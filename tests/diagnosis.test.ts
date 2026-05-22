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
import { HeuristicSignalsEngine } from "../src/signals/engine.js";
import { FileStore } from "../src/storage/file-store.js";
import type { DiagnosisInput } from "../src/contracts/diagnosis.js";

let tempDir: string;
let service: DiagnosisService;
let registrationService: RegistrationService;
let signalsService: SignalsService;
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

  it("respeta el maximo de 15 preguntas y cierra diagnostico", async () => {
    const dialogMessages = Array.from({ length: 15 }, (_, index) => ({
      role: "user" as const,
      content: `Respuesta de contexto ${index + 1}`,
    }));
    const input = buildInput({ dialogMessages });
    await registerInput(input);
    const result = await service.nextQuestion(input);

    expect(result.maxQuestionsReached).toBe(true);
    expect(result.question).toBeNull();
    expect(result.diagnosis?.recommendedChallenge).toBeTruthy();
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

  it("genera Senales con outputs visibles e internos trazables", async () => {
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
    expect(result.signals.output.gaps.length).toBeGreaterThan(0);
    expect(result.signals.output.insights.length).toBeGreaterThan(0);
    expect(result.signals.output.memoriaEmpresa.companyPatterns).toBeDefined();
    expect(result.signals.output.internal.senalesBase.length).toBeGreaterThan(0);
    expect(stored?.cycleId).toBe(input.cycleId);
    expect(events.some((event) => event.action === "SIGNALS_GENERATED")).toBe(
      true,
    );
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
});

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
