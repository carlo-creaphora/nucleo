import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { DiagnosisService } from "../src/diagnosis/service.js";
import { DiagnosisClosureError } from "../src/diagnosis/service.js";
import { HeuristicDiagnosisEngine } from "../src/diagnosis/engine.js";
import { buildDiagnosisSystemPrompt } from "../src/diagnosis/prompt.js";
import { RegistrationService } from "../src/registration/service.js";
import { HeuristicRegistrationEngine } from "../src/registration/engine.js";
import { SignalsService } from "../src/signals/service.js";
import {
  HeuristicSignalsEngine,
  buildSearchUserPromptForTest,
} from "../src/signals/engine.js";
import { IdeationService } from "../src/ideation/service.js";
import {
  buildCaseScreeningSystemPrompt,
  buildConceptReviewSystemPrompt,
  buildIdeationSystemPrompt,
  cleanIdeationOutputForDisplay,
  createIdeationEngine,
} from "../src/ideation/engine.js";
import { validateIdeationOutput } from "../src/ideation/validation.js";
import { FileStore } from "../src/storage/file-store.js";
import type { DiagnosisInput } from "../src/contracts/diagnosis.js";
import type {
  IdeationGenerationInput,
  IdeationOutput,
} from "../src/contracts/ideation.js";

let tempDir: string;
let service: DiagnosisService;
let registrationService: RegistrationService;
let signalsService: SignalsService;
let ideationService: IdeationService;
let store: FileStore;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "nucleo-test-"));
  store = new FileStore(join(tempDir, "store.json"));
  service = new DiagnosisService(new HeuristicDiagnosisEngine(), store);
  registrationService = new RegistrationService(
    new HeuristicRegistrationEngine(),
    store,
  );
  signalsService = new SignalsService(
    new HeuristicSignalsEngine(),
    store,
    service,
  );
  ideationService = new IdeationService(
    createIdeationEngine(),
    store,
    service,
    signalsService,
  );
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("Diagnostico", () => {
  it("genera una pregunta adaptativa y persiste el ciclo", async () => {
    const input = buildInput({
      dialogMessages: [
        {
          role: "user",
          content: "Tenemos mucha demora en cerrar negocios enterprise.",
        },
      ],
    });
    await registerInput(input);

    const result = await service.nextQuestion(input);
    const stored = await service.getCycle(input.cycleId);

    expect(result.question?.question).toContain("metrica");
    expect(result.diagnosis).toBeNull();
    expect(stored?.companyId).toBe(input.company.companyId);
  });

  it("cierra diagnostico con los 10 outputs contratados", async () => {
    const input = buildInput();
    await registerInput(input);
    const result = await service.complete(input);

    expect(result.diagnosis.recommendedChallenge).toBeTruthy();
    expect(result.diagnosis.whyThisChallenge).toBeTruthy();
    expect(result.diagnosis.symptoms.length).toBeGreaterThan(0);
    expect(result.diagnosis.causes.length).toBeGreaterThan(0);
    expect(result.diagnosis.tensions.length).toBeGreaterThan(0);
    expect(result.diagnosis.metrics.length).toBeGreaterThan(0);
    expect(result.diagnosis.restrictions).toBeDefined();
    expect(result.diagnosis.notWorthAttackingYet).toBeDefined();
    expect(result.diagnosis.assumptionToQuestion).toBeTruthy();
    expect(result.diagnosis.ideationBrief).toBeTruthy();
  });

  it("guarda registro con output contractual para diagnostico", async () => {
    const input = buildInput();
    const result = await registrationService.create({
      cycleId: input.cycleId,
      profileLicense: input.profileLicense,
      company: input.company,
      category: input.category,
      uploadedDocuments: input.uploadedDocuments,
    });

    expect(result.registration.id).toMatch(/^reg_/);
    expect(result.registration.output.contextForDiagnosis.company.name).toBe(
      input.company.name,
    );
    expect(
      result.registration.output.competitorEvaluationFrame.criteria.length,
    ).toBeGreaterThan(0);
    expect(
      result.registration.output.competitorEvaluationFrame.signalQuestions.length,
    ).toBeGreaterThan(0);
    expect(result.registration.output.readiness.isReadyForDiagnosis).toBe(true);
  });

  it("procesa carga real de documentos para Registro", async () => {
    const result = await registrationService.uploadDocuments({
      cycleId: "cycle-docs",
      documents: [
        {
          name: "contexto.txt",
          mimeType: "text/plain",
          sizeBytes: 58,
          text: "Los descuentos no cambiaron la calidad de los prospectos.",
        },
      ],
    });

    expect(result.documents[0]?.id).toMatch(/^doc_/);
    expect(result.documents[0]?.extractionStatus).toBe("EXTRACTED");
  });

  it("extrae texto basico de archivos XLSX para Registro", async () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet([
      {
        hallazgo: "Los decisores piden evidencia financiera antes de aprobar.",
        metrica: "conversion demo-cierre",
      },
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet, "Aprendizajes");
    const dataBase64 = XLSX.write(workbook, {
      type: "base64",
      bookType: "xlsx",
    });

    const result = await registrationService.uploadDocuments({
      cycleId: "cycle-docs-xlsx",
      documents: [
        {
          name: "aprendizajes.xlsx",
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          sizeBytes: Buffer.from(dataBase64, "base64").byteLength,
          dataBase64,
        },
      ],
    });

    expect(result.documents[0]?.extractionStatus).toBe("EXTRACTED");
    expect(result.documents[0]?.extractedText).toContain("decisores");
  });

  it("marca como no soportado un binario sin extractor de demo", async () => {
    const result = await registrationService.uploadDocuments({
      cycleId: "cycle-docs-image",
      documents: [
        {
          name: "foto.png",
          mimeType: "image/png",
          sizeBytes: 10,
          dataBase64: Buffer.from("fake-image").toString("base64"),
        },
      ],
    });

    expect(result.documents[0]?.extractionStatus).toBe("UNSUPPORTED");
  });

  it("respeta el maximo de 15 preguntas pero no cierra si faltan piezas criticas", async () => {
    const dialogMessages = Array.from({ length: 15 }, (_, index) => ({
      role: "user" as const,
      content: `Respuesta de contexto ${index + 1}`,
    }));
    const input = buildInput({ dialogMessages });
    await registerInput(input);
    const result = await service.nextQuestion(input);

    expect(result.maxQuestionsReached).toBe(true);
    expect(result.question).toBeNull();
    expect(result.diagnosis).toBeNull();
    expect(result.criticalMissing.length).toBeGreaterThan(0);
  });

  it("usa intentos previos, tensiones, decision trabada y cambio esperado como complementos de pregunta", async () => {
    const firstInput = buildInput({
      cycleId: "question-1",
      dialogMessages: [
        {
          role: "user",
          content:
            "El reto es que la venta enterprise tarda mucho. La metrica es ciclo de venta y no podemos bajar precio.",
        },
      ],
    });
    await registerInput(firstInput);
    const first = await service.nextQuestion(firstInput);
    const secondInput = buildInput({
      cycleId: "question-2",
      dialogMessages: [
        {
          role: "user",
          content:
            "El reto es que la venta enterprise tarda mucho. La metrica es ciclo de venta, no podemos bajar precio, ya probamos webinars y no funcionaron.",
        },
      ],
    });
    await registerInput(secondInput);
    const second = await service.nextQuestion(secondInput);
    const thirdInput = buildInput({
      cycleId: "question-3",
      dialogMessages: [
        {
          role: "user",
          content:
            "El reto es que la venta enterprise tarda mucho. La metrica es ciclo de venta, no podemos bajar precio, ya probamos webinars y no funcionaron. Hay tension entre comercial y operaciones.",
        },
      ],
    });
    await registerInput(thirdInput);
    const third = await service.nextQuestion(thirdInput);
    const fourthInput = buildInput({
      cycleId: "question-4",
      dialogMessages: [
        {
          role: "user",
          content:
            "El reto es que la venta enterprise tarda mucho. La metrica es ciclo de venta, no podemos bajar precio, ya probamos webinars y no funcionaron. Hay tension entre comercial y operaciones. Esta trabada la decision de cambiar la oferta.",
        },
      ],
    });
    await registerInput(fourthInput);
    const fourth = await service.nextQuestion(fourthInput);

    expect(first.question?.nextFocus).toBe("intentos previos");
    expect(second.question?.nextFocus).toBe("tensiones internas");
    expect(third.question?.nextFocus).toBe("decision trabada");
    expect(fourth.question?.nextFocus).toBe("cambio esperado");
  });

  it("reinterpreta una seccion corregida por el usuario", async () => {
    const input = buildInput({
      correctedSections: [
        {
          section: "recommendedChallenge",
          clarification: "El reto no es ventas, es confianza antes del contacto comercial.",
        },
      ],
    });
    await registerInput(input);
    const previousInput = buildInput({ cycleId: "previous-reinterpret" });
    await registerInput(previousInput);
    const previous = (await service.complete(previousInput)).diagnosis;
    const result = await service.reinterpret(input, previous);

    expect(result.diagnosis.recommendedChallenge).toContain("confianza");
    expect(result.changeSummary.changed.length).toBeGreaterThan(0);
  });

  it("bloquea cierre si faltan piezas criticas antes del maximo", async () => {
    const input = buildInput({
      cycleId: "cycle-missing",
      dialogMessages: [
        {
          role: "user",
          content: "Creo que el problema es cultura.",
        },
      ],
    });
    await registerInput(input);

    await expect(service.complete(input)).rejects.toBeInstanceOf(
      DiagnosisClosureError,
    );
  });

  it("versiona diagnosticos y deja auditoria al reinterpretar", async () => {
    const base = buildInput();
    await registerInput(base);
    const previous = (await service.complete(base)).diagnosis;
    const reinterpretInput = buildInput({
        correctedSections: [
          {
            section: "causes",
            clarification: "La causa no es falta de demanda; es confianza tardia.",
          },
        ],
    });
    await service.reinterpret(reinterpretInput, previous);

    const versions = await service.listVersions("cycle-1");
    const events = await service.listAudit("cycle-1");

    expect(versions.map((item) => item.version)).toEqual([1, 2]);
    expect(events.some((item) => item.action === "DIAGNOSIS_REINTERPRETED")).toBe(
      true,
    );
  });

  it("lista memoria de diagnosticos por empresa sin mezclar empresas", async () => {
    const cycleA = buildInput({ cycleId: "cycle-a" });
    await registerInput(cycleA);
    await service.complete(cycleA);
    const cycleB = buildInput({
      cycleId: "cycle-b",
      company: { companyId: "other-company", name: "Otra Empresa" },
    });
    await registerInput(cycleB);
    await service.complete(
      cycleB,
    );

    const cycles = await service.listCompanyCycles("company-1");

    expect(cycles).toHaveLength(1);
    expect(cycles[0]?.cycleId).toBe("cycle-a");
  });

  it("construye handoff formal para ideacion desde diagnostico cerrado", async () => {
    const input = buildInput({ cycleId: "cycle-ideation" });
    await registrationService.create({
      cycleId: input.cycleId,
      profileLicense: input.profileLicense,
      company: input.company,
      category: input.category,
      uploadedDocuments: input.uploadedDocuments,
    });
    await service.complete(input);

    const ideationInput = await service.buildIdeationInput(input.cycleId);

    expect(ideationInput?.selectedChallenge).toBeTruthy();
    expect(ideationInput?.diagnosticInput.detonators.length).toBeGreaterThan(0);
    expect(ideationInput?.registration?.contextForDiagnosis.company.name).toBe(
      input.company.name,
    );
  });

  it("construye input formal de Senales desde Registro y Diagnostico cerrado", async () => {
    const input = buildInput({ cycleId: "cycle-signals-input" });
    await registerInput(input);
    await service.complete(input);

    const signalsInput = await signalsService.buildInput(input.cycleId);

    expect(signalsInput.searchDepth).toBe("standard");
    expect(signalsInput.registration.contextForDiagnosis.company.name).toBe(
      input.company.name,
    );
    expect(signalsInput.ideationInput.selectedChallenge).toBeTruthy();
    expect(
      signalsInput.registration.contextForDiagnosis.category.competitors.length,
    ).toBe(3);
  });

  it("genera Senales con exactamente 2 gaps y 2 insights", async () => {
    const input = buildInput({ cycleId: "cycle-signals" });
    await registerInput(input);
    await service.complete(input);

    const result = await signalsService.generate(input.cycleId);
    const stored = await signalsService.get(input.cycleId);
    const events = await service.listAudit(input.cycleId);

    expect(result.signals.output.searchDepth).toBe("standard");
    expect(result.signals.output.analisisSocialListening.summary).toBeTruthy();
    expect(result.signals.output.analisisTendencias.summary).toBeTruthy();
    expect(result.signals.output.analisisCompetidores.summary).toBeTruthy();
    expect(result.signals.output.gaps).toHaveLength(2);
    expect(result.signals.output.insights).toHaveLength(2);
    expect(result.signals.output.gaps[0]?.evidenceBase).toBeTruthy();
    expect(result.signals.output.gaps[0]?.potencialMercado).toBeTruthy();
    expect(result.signals.output.insights[0]?.evidenceBase).toBeTruthy();
    expect(result.signals.output.insights[0]?.cliente).toBeTruthy();
    expect(result.signals.output.memoriaEmpresa.companyPatterns).toBeDefined();
    expect(result.signals.output.internal.senalesBase.length).toBeGreaterThan(0);
    expect(stored?.cycleId).toBe(input.cycleId);
    expect(events.some((event) => event.action === "SIGNALS_GENERATED")).toBe(
      true,
    );
  });

  it("construye handoff formal de Senales hacia Ideacion", async () => {
    const input = buildInput({ cycleId: "cycle-signals-ideation" });
    await registerInput(input);
    await service.complete(input);
    await signalsService.generate(input.cycleId);

    const signalsIdeationInput = await signalsService.buildIdeationInput(
      input.cycleId,
    );

    expect(signalsIdeationInput?.gaps).toHaveLength(2);
    expect(signalsIdeationInput?.insights).toHaveLength(2);
    expect(signalsIdeationInput?.evidence.length).toBeGreaterThan(0);
    expect(signalsIdeationInput?.companyId).toBe(input.company.companyId);
  });

  it("usa mapa de clientes para orientar busqueda de customer insight", async () => {
    const input = buildInput({
      cycleId: "cycle-buyer-map",
      company: {
        sectorCategory: "Mantenimiento de ascensores",
        sellsTo: "Administradores de edificios y centros comerciales",
      },
      category: {
        averageTicket: "USD 1200 mensual",
        averageSalesCycleDays: 45,
        competitors: [
          { name: "Competidor 1", website: "https://competidor1.com" },
          { name: "Competidor 2", website: "https://competidor2.com" },
          { name: "Competidor 3", website: "https://competidor3.com" },
        ],
        notes:
          "Compradores con presion de residentes, comites y arrendatarios.",
      },
    });
    await registerInput(input);
    await service.complete(input);

    const signalsInput = await signalsService.buildInput(input.cycleId);
    const prompt = buildSearchUserPromptForTest(
      signalsInput,
      "CUSTOMER_INSIGHT",
    );

    expect(prompt).toContain("administradores de edificios");
    expect(prompt).toContain("administradores de centros comerciales");
    expect(prompt).toContain("residentes");
    expect(prompt).toContain("responsable visible");
    expect(prompt).toContain("maintenance reporting");
  });

  it("bloquea Senales si Diagnostico no esta cerrado", async () => {
    const input = buildInput({ cycleId: "cycle-signals-blocked" });
    await registerInput(input);

    await expect(signalsService.generate(input.cycleId)).rejects.toThrow(
      "Senales requiere Diagnostico cerrado",
    );
  });

  it("incluye criterio incomodo y no complaciente en el contrato del prompt", () => {
    const prompt = buildDiagnosisSystemPrompt();

    expect(prompt).toContain("No darle la razon al usuario");
    expect(prompt).toContain("No usar tono optimista");
    expect(prompt).toContain("verdades incomodas");
    expect(prompt).toContain("Mantener los mismos campos");
    expect(prompt).toContain("Responder breve");
  });

  it("construye input y opciones de Ideacion sin motor heuristico", async () => {
    const input = buildInput({ cycleId: "cycle-ideation-clean" });
    await registerInput(input);
    await service.complete(input);
    const signalsResult = await signalsService.generate(input.cycleId);
    const selectedGap = signalsResult.signals.output.gaps[0]?.title;
    const selectedInsight = signalsResult.signals.output.insights[0]?.title;

    const options = await ideationService.buildOptions(input.cycleId);
    const ideationInput = await ideationService.buildInput(
      input.cycleId,
      {
        ruptureType: "RUPTURA_FUERTE",
        gapTitle: selectedGap,
        insightTitle: selectedInsight,
      },
    );

    expect(options.ruptureTypes[1]?.verb).toBe("transformar");
    expect(options.ruptureTypes[1]?.guidingQuestion).toContain("pieza del modelo");
    expect(options.ruptureTypes[1]?.riskLevel).toBe("medio");
    expect(ideationInput.selection.ruptureType).toBe("RUPTURA_FUERTE");
    expect(ideationInput.knowledgePack.disruptiveCases.length).toBeGreaterThanOrEqual(
      60,
    );
  });

  it("valida ajuste estructural de ruta en Ideacion sin bloquear por palabras", async () => {
    const input = buildInput({ cycleId: "cycle-ideation-validation" });
    await registerInput(input);
    await service.complete(input);
    const signalsResult = await signalsService.generate(input.cycleId);
    const selectedGap = signalsResult.signals.output.gaps[0]?.title;
    const selectedInsight = signalsResult.signals.output.insights[0]?.title;
    const ideationInput = await ideationService.buildInput(input.cycleId, {
      ruptureType: "RUPTURA_MODERADA",
      gapTitle: selectedGap,
      insightTitle: selectedInsight,
    });
    const output = buildIdeationOutputForTest(ideationInput, {
      idea:
        "Idea 1. App generica: crear una plataforma que conecta administradores con tecnicos",
      mecanicaConcreta:
        "Crear una app que conecta administradores con tecnicos y cambia el modelo de negocio con suscripcion mensual.",
    });
    output.route.ruptureType = "RUPTURA_FUERTE";
    const violations = validateIdeationOutput(ideationInput, output);

    expect(
      violations.some((violation) => violation.type === "ROUTE_MISMATCH"),
    ).toBe(true);
    expect(
      violations.some((violation) => violation.type === "CASE_TRACE_MISMATCH"),
    ).toBe(false);
  });

  it("no castiga una idea por mencionar anti-patrones en el campo de ejecucion", async () => {
    const input = buildInput({ cycleId: "cycle-ideation-avoid-list" });
    await registerInput(input);
    await service.complete(input);
    const signalsResult = await signalsService.generate(input.cycleId);
    const selectedGap = signalsResult.signals.output.gaps[0]?.title;
    const selectedInsight = signalsResult.signals.output.insights[0]?.title;
    const ideationInput = await ideationService.buildInput(input.cycleId, {
      ruptureType: "RUPTURA_MODERADA",
      gapTitle: selectedGap,
      insightTitle: selectedInsight,
    });
    const output = buildIdeationOutputForTest(ideationInput, {
      antiPatronesAEvitar: [
        "No caer en D3. Solucion antes que problema.",
        "No caer en D4. Beneficio sin mecanica.",
      ],
    });
    const violations = validateIdeationOutput(ideationInput, output);

    expect(violations).toHaveLength(0);
  });

  it("acepta ruptura fuerte cuando transforma reglas o incentivos de decision", async () => {
    const input = buildInput({ cycleId: "cycle-ideation-strong-rules" });
    await registerInput(input);
    await service.complete(input);
    const signalsResult = await signalsService.generate(input.cycleId);
    const selectedGap = signalsResult.signals.output.gaps[0]?.title;
    const selectedInsight = signalsResult.signals.output.insights[0]?.title;
    const ideationInput = await ideationService.buildInput(input.cycleId, {
      ruptureType: "RUPTURA_FUERTE",
      gapTitle: selectedGap,
      insightTitle: selectedInsight,
    });
    const output = buildIdeationOutputForTest(ideationInput, {
      routeId: "ruptura_fuerte",
      mecanicaConcreta:
        "Cambiar la regla de decision: cada cierre requiere un ritual de arbitraje entre pares donde el responsable solo aprueba si existe evidencia de criterio comun, con incentivos ligados a convergencia y no a velocidad.",
      supuestoQueRompe:
        "Que la forma de decidir debe seguir dependiendo de supervision individual del lider.",
    });
    const violations = validateIdeationOutput(ideationInput, output);

    expect(
      violations.some((violation) => violation.type === "ROUTE_MISMATCH"),
    ).toBe(false);
  });

  it("no bloquea una idea concreta solo por mencionar plataforma sin conectar generico", async () => {
    const input = buildInput({ cycleId: "cycle-ideation-platform-word" });
    await registerInput(input);
    await service.complete(input);
    const signalsResult = await signalsService.generate(input.cycleId);
    const selectedGap = signalsResult.signals.output.gaps[0]?.title;
    const selectedInsight = signalsResult.signals.output.insights[0]?.title;
    const ideationInput = await ideationService.buildInput(input.cycleId, {
      ruptureType: "RUPTURA_MODERADA",
      gapTitle: selectedGap,
      insightTitle: selectedInsight,
    });
    const output = buildIdeationOutputForTest(ideationInput, {
      mecanicaConcreta:
        "Instalar una plataforma fisica de decision en campo: una plantilla visible con tres casillas obligatorias, responsable del cierre y regla de evidencia antes de terminar cada tarea.",
    });
    const violations = validateIdeationOutput(ideationInput, output);

    expect(violations).toHaveLength(0);
  });

  it("exige trazabilidad a los casos seleccionados en scouting", async () => {
    const input = buildInput({ cycleId: "cycle-ideation-case-trace" });
    await registerInput(input);
    await service.complete(input);
    const signalsResult = await signalsService.generate(input.cycleId);
    const selectedGap = signalsResult.signals.output.gaps[0]?.title;
    const selectedInsight = signalsResult.signals.output.insights[0]?.title;
    const ideationInput = await ideationService.buildInput(input.cycleId, {
      ruptureType: "RUPTURA_MODERADA",
      gapTitle: selectedGap,
      insightTitle: selectedInsight,
    });
    const output = buildIdeationOutputForTest(ideationInput, {
      trace: {
        gapTitles: [ideationInput.selection.gapTitle],
        insightTitles: [ideationInput.selection.insightTitle],
        evidenceIds: ["sig_1"],
        disruptiveCaseName: "Caso inventado",
      },
    });
    const violations = validateIdeationOutput(ideationInput, output);

    expect(
      violations.some((violation) => violation.type === "CASE_TRACE_MISMATCH"),
    ).toBe(true);
  });

  it("bloquea Ideacion sin Senales generadas", async () => {
    const input = buildInput({ cycleId: "cycle-ideation-blocked" });
    await registerInput(input);
    await service.complete(input);

    await expect(
      ideationService.generate(input.cycleId, {
        ruptureType: "RUPTURA_MODERADA",
        gapTitle: "gap inexistente",
        insightTitle: "insight inexistente",
      }),
    ).rejects.toThrow("Ideacion requiere Senales generadas");
  });

  it("el prompt final de Ideacion fuerza uso criterio de casos y antipatrones", () => {
    const prompt = buildIdeationSystemPrompt();
    const screeningPrompt = buildCaseScreeningSystemPrompt();
    const reviewPrompt = buildConceptReviewSystemPrompt();

    expect(screeningPrompt).toContain("seleccionar casos disruptivos antes de generar ideas");
    expect(screeningPrompt).toContain("Selecciona exactamente 3 casos");
    expect(screeningPrompt).toContain("mecanismo transferible");
    expect(reviewPrompt).toContain("No bloquees por palabras sueltas");
    expect(reviewPrompt).toContain("modelo de la idea");
    expect(prompt).toContain("mandatoryCaseScreening");
    expect(prompt).toContain("Generar exactamente 1 idea");
    expect(prompt).toContain("referencia principal");
    expect(prompt).toContain("Cruzar cada idea contra antipatrones");
    expect(prompt).toContain("No copiar el caso");
    expect(prompt).not.toContain("prototypeBrief");
    expect(prompt).toContain("translatedCaseReferences");
    expect(prompt).toContain("1. idea:");
    expect(prompt).toContain("8. antiPatronesAEvitar:");
    expect(prompt).toContain("mejorar optimiza el juego");
    expect(prompt).toContain("RUPTURA_FUERTE = transformar");
    expect(prompt).toContain("No mezclar rutas");
  });

  it("limpia repeticiones y codigos internos de la salida visible de ideas", async () => {
    const input = buildInput({ cycleId: "cycle-ideation-clean-copy" });
    await registerInput(input);
    await service.complete(input);
    const signalsResult = await signalsService.generate(input.cycleId);
    const selectedGap = signalsResult.signals.output.gaps[0]?.title;
    const selectedInsight = signalsResult.signals.output.insights[0]?.title;
    const ideationInput = await ideationService.buildInput(input.cycleId, {
      ruptureType: "RUPTURA_MODERADA",
      gapTitle: selectedGap,
      insightTitle: selectedInsight,
    });
    const output = buildIdeationOutputForTest(ideationInput, {
      supuestoQueRompe:
        "Supuesto que rompe: Rompe el supuesto de que el estandar se adopta solo porque esta escrito. Cambia la unidad economica de la operacion.",
      mecanicaConcreta:
        "La mecanica concreta consiste en usar tarjetas fisicas de decision en campo antes de cerrar tareas. El piloto consiste en probarlo durante 30 dias con seis tecnicos.",
      porQueFunciona:
        "Funciona porque reduce ambiguedad en campo. Tambien mejora la supervision. Esta tercera frase no debe quedar.",
      antiPatronesAEvitar: [
        "No convertirlo en otro checklist burocratico. (evitar D4).",
        "No saltar directo a una solucion de software. (evitar D3).",
      ],
    });

    const cleaned = cleanIdeationOutputForDisplay(output);

    expect(cleaned.ideas[0]?.supuestoQueRompe).toBe(
      "El estandar se adopta solo porque esta escrito.",
    );
    expect(cleaned.ideas[0]?.mecanicaConcreta).toBe(
      "usar tarjetas fisicas de decision en campo antes de cerrar tareas.",
    );
    expect(cleaned.ideas[0]?.porQueFunciona).toBe(
      "Funciona porque reduce ambiguedad en campo. Tambien mejora la supervision.",
    );
    expect(
      cleanIdeationOutputForDisplay(
        buildIdeationOutputForTest(ideationInput, {
          supuestoQueRompe:
            "Rompe el upue to de que el servicio de mantenimiento debe cobrarse por visita.",
          mecanicaConcreta:
            "Conecta actua como re pon able y e tablece una tarifa ba ada en operacion egura de a cen ore y e calera electrica.",
          porQueFunciona:
            "Alinea incentivo entre proveedor y cliente hacia el re ultado de eado con operacion egura y menor reproce o.",
        }),
      ).ideas[0]?.supuestoQueRompe,
    ).toBe("El servicio de mantenimiento debe cobrarse por visita.");
    const repaired = cleanIdeationOutputForDisplay(
      buildIdeationOutputForTest(ideationInput, {
        mecanicaConcreta:
          "Conecta actua como re pon able y e tablece una tarifa ba ada en operacion egura de a cen ore y e calera electrica.",
        porQueFunciona:
          "Alinea incentivo entre proveedor y cliente hacia el re ultado de eado con operacion egura y menor reproce o.",
      }),
    );
    expect(repaired.ideas[0]?.mecanicaConcreta).toContain("responsable");
    expect(repaired.ideas[0]?.mecanicaConcreta).toContain("establece");
    expect(repaired.ideas[0]?.mecanicaConcreta).toContain("basada");
    expect(repaired.ideas[0]?.mecanicaConcreta).toContain("segura");
    expect(repaired.ideas[0]?.mecanicaConcreta).toContain("ascensores");
    expect(repaired.ideas[0]?.porQueFunciona).toContain("resultado deseado");
    expect(repaired.ideas[0]?.porQueFunciona).toContain("reproceso");
    expect(cleaned.ideas[0]?.antiPatronesAEvitar).toEqual([
      "No convertirlo en otro checklist burocratico.",
      "No saltar directo a una solucion de software.",
    ]);
  });
});

function buildIdeationOutputForTest(
  input: IdeationGenerationInput,
  override: Partial<IdeationOutput["ideas"][number]> = {},
): IdeationOutput {
  const gapTitle = input.selection.gapTitle;
  const insightTitle = input.selection.insightTitle;
  const route = {
    id: input.selection.ruptureType.toLowerCase(),
    title: "Ruptura moderada",
    ruptureType: input.selection.ruptureType,
    verb: "mejorar" as const,
    guidingQuestion: "Que hacemos hoy que podria funcionar mejor?",
    riskLevel: "bajo" as const,
    purpose:
      "Mejorar lo que ya existe para hacerlo mas rapido, barato, comodo o con menos friccion.",
    usesGapTitles: [gapTitle],
    usesInsightTitles: [insightTitle],
  };
  const baseIdea: IdeationOutput["ideas"][number] = {
    id: "idea_1",
    routeId: route.id,
    idea: "Idea 1. Regla visible: reducir friccion en una decision existente",
    supuestoQueRompe:
      "Que la operacion mejora solamente cuando se agrega mas supervision.",
    mecanicaConcreta:
      "Tomar una decision existente y hacerla mas rapida con una regla visible, un responsable y una evidencia minima antes del cierre.",
    porQueFunciona:
      "Funciona porque reduce ambiguedad sin cambiar el modelo de negocio ni pedir una transformacion estructural.",
    casoAnalogo:
      "IKEA, Cook this Page, 2002, retail/hogar, Suecia. La similitud es convertir una instruccion interpretable en una guia visible; la diferencia es que aqui se aplica a una decision empresarial.",
    metricaQueMueve:
      "Tiempo de decision y variabilidad de ejecucion en el proceso seleccionado.",
    primerPasoEjecutable:
      "En 30 dias, elegir una decision repetida, crear una regla visible y probarla con cinco usuarios reales del proceso.",
    antiPatronesAEvitar: [
      "No convertirlo en capacitacion generica.",
      "No hacerlo como dashboard sin decision obligatoria.",
    ],
    trace: {
      gapTitles: [gapTitle],
      insightTitles: [insightTitle],
      evidenceIds: ["sig_1"],
      disruptiveCaseName: "IKEA Cook this Page",
    },
    ...override,
    source: override.source ?? "ai",
    selectedForEvaluation: override.selectedForEvaluation ?? false,
  };

  return {
    generatedAt: new Date().toISOString(),
    route,
    ideas: [
      baseIdea,
      {
        ...baseIdea,
        id: "idea_2",
        idea: "Idea 2. Criterio comparado: mejorar una revision existente",
      },
      {
        ...baseIdea,
        id: "idea_3",
        idea: "Idea 3. Evidencia minima: mejorar el cierre de una accion",
      },
    ],
    internal: {
      caseScreening: {
        translatedCaseReferences: [
          {
            caseName: "IKEA Cook this Page",
            transferableMechanism:
              "Convertir instrucciones interpretables en una interfaz fisica.",
            reinterpretationForThisIdea:
              "Traducir el mecanismo a una regla visible de decision.",
            caveat: "Validar que no se vuelva burocracia.",
          },
          {
            caseName: "UPS left turns",
            transferableMechanism:
              "Optimizar por una variable contraintuitiva y no por la obvia.",
            reinterpretationForThisIdea:
              "Elegir una variable de decision que anticipe friccion.",
            caveat: "Requiere datos operativos minimos.",
          },
          {
            caseName: "WeightWatchers",
            transferableMechanism:
              "Usar pares para sostener comportamiento y accountability.",
            reinterpretationForThisIdea:
              "Convertir revision entre pares en criterio comun.",
            caveat: "Evitar juicio personal.",
          },
        ],
        rejectedCaseFamilies: [],
      },
      consultedKnowledge: {
        assumptionsByIndustry: 1,
        antiPatterns: 1,
        disruptiveCases: 60,
        weirdBusinessModels: 1,
      },
      rejectedAntiPatternMatches: [],
    },
  };
}

function buildInput(
  overrides: Partial<Omit<DiagnosisInput, "company">> & {
    company?: Partial<DiagnosisInput["company"]>;
  } = {},
): DiagnosisInput {
  return {
    cycleId: overrides.cycleId ?? "cycle-1",
    profileLicense: {
      licenseId: "license-1",
      name: "Carolina Perez",
      role: "Lider Comercial",
      area: "Comercial",
      email: "carolina@example.com",
      country: "Colombia",
      peopleManaged: 8,
    },
    company: {
      companyId: overrides.company?.companyId ?? "company-1",
      name: overrides.company?.name ?? "Acme B2B",
      sectorCategory: "Servicios B2B",
      employeeCount: 120,
      yearsInMarket: 12,
      operatingCountries: ["Colombia", "Panama"],
      sellsTo: "Empresas medianas",
      revenueModel: "Fee mensual",
      website: "https://example.com",
      acquisitionChannels: ["referidos", "venta consultiva"],
      ...overrides.company,
    },
    category: {
      averageTicket: "USD 1200 mensual",
      averageSalesCycleDays: 45,
      competitors: [
        { name: "Competidor 1", website: "https://competidor1.com" },
        { name: "Competidor 2", website: "https://competidor2.com" },
        { name: "Competidor 3", website: "https://competidor3.com" },
      ],
      notes: "El mercado compara mucho por confianza y casos previos.",
    },
    uploadedDocuments: [],
    dialogMessages: overrides.dialogMessages ?? [
      {
        role: "user",
        content:
          "El problema declarado es que los clientes tardan mucho en decidir y piden demasiadas reuniones. La metrica es ciclo de venta y conversion demo-cierre. No podemos bajar precios ni duplicar equipo. Ya probamos webinars y descuentos sin mejora. Hay tension entre comercial y operaciones. Esta trabada la decision de cambiar la oferta. Esperamos reducir ciclo y cerrar sin descuento.",
      },
    ],
    userClarifications: overrides.userClarifications ?? [
      "No podemos bajar precios ni duplicar el equipo comercial.",
    ],
    companyMemory: {
      summary: "La empresa ha probado webinars y descuentos sin mejora sostenida.",
      repeatedPatterns: ["Descuentos que atraen clientes no calificados"],
      previousLearnings: ["Los casos concretos reducen incertidumbre"],
    },
    previousCycleLearnings: [],
    correctedSections: overrides.correctedSections ?? [],
  };
}

async function registerInput(input: DiagnosisInput) {
  await registrationService.create({
    cycleId: input.cycleId,
    profileLicense: input.profileLicense,
    company: input.company,
    category: input.category,
    uploadedDocuments: input.uploadedDocuments,
  });
}
