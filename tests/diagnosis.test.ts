import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DiagnosisService } from "../src/diagnosis/service.js";
import { HeuristicDiagnosisEngine } from "../src/diagnosis/engine.js";
import { buildDiagnosisSystemPrompt } from "../src/diagnosis/prompt.js";
import { FileStore } from "../src/storage/file-store.js";
import type { DiagnosisInput } from "../src/contracts/diagnosis.js";

let tempDir: string;
let service: DiagnosisService;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "nucleo-test-"));
  service = new DiagnosisService(
    new HeuristicDiagnosisEngine(),
    new FileStore(join(tempDir, "store.json")),
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

    const result = await service.nextQuestion(input);
    const stored = await service.getCycle(input.cycleId);

    expect(result.question?.question).toContain("metrica");
    expect(result.diagnosis).toBeNull();
    expect(stored?.companyId).toBe(input.company.companyId);
  });

  it("cierra diagnostico con los 10 outputs contratados", async () => {
    const input = buildInput();
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

  it("respeta el maximo de 15 preguntas y cierra diagnostico", async () => {
    const dialogMessages = Array.from({ length: 15 }, (_, index) => ({
      role: "user" as const,
      content: `Respuesta de contexto ${index + 1}`,
    }));
    const input = buildInput({ dialogMessages });
    const result = await service.nextQuestion(input);

    expect(result.maxQuestionsReached).toBe(true);
    expect(result.question).toBeNull();
    expect(result.diagnosis?.recommendedChallenge).toBeTruthy();
  });

  it("usa intentos previos, tensiones, decision trabada y cambio esperado como complementos de pregunta", async () => {
    const first = await service.nextQuestion(
      buildInput({
        dialogMessages: [
          {
            role: "user",
            content:
              "El reto es que la venta enterprise tarda mucho. La metrica es ciclo de venta y no podemos bajar precio.",
          },
        ],
      }),
    );
    const second = await service.nextQuestion(
      buildInput({
        dialogMessages: [
          {
            role: "user",
            content:
              "El reto es que la venta enterprise tarda mucho. La metrica es ciclo de venta, no podemos bajar precio, ya probamos webinars y no funcionaron.",
          },
        ],
      }),
    );
    const third = await service.nextQuestion(
      buildInput({
        dialogMessages: [
          {
            role: "user",
            content:
              "El reto es que la venta enterprise tarda mucho. La metrica es ciclo de venta, no podemos bajar precio, ya probamos webinars y no funcionaron. Hay tension entre comercial y operaciones.",
          },
        ],
      }),
    );
    const fourth = await service.nextQuestion(
      buildInput({
        dialogMessages: [
          {
            role: "user",
            content:
              "El reto es que la venta enterprise tarda mucho. La metrica es ciclo de venta, no podemos bajar precio, ya probamos webinars y no funcionaron. Hay tension entre comercial y operaciones. Esta trabada la decision de cambiar la oferta.",
          },
        ],
      }),
    );

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
    const previous = (await service.complete(buildInput())).diagnosis;
    const result = await service.reinterpret(input, previous);

    expect(result.diagnosis.recommendedChallenge).toContain("confianza");
  });

  it("lista memoria de diagnosticos por empresa sin mezclar empresas", async () => {
    await service.complete(buildInput({ cycleId: "cycle-a" }));
    await service.complete(
      buildInput({
        cycleId: "cycle-b",
        company: { companyId: "other-company", name: "Otra Empresa" },
      }),
    );

    const cycles = await service.listCompanyCycles("company-1");

    expect(cycles).toHaveLength(1);
    expect(cycles[0]?.cycleId).toBe("cycle-a");
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
          "El problema declarado es que los clientes tardan mucho en decidir y piden demasiadas reuniones.",
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
