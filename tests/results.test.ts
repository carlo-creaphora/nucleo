import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type EvidenceReadInput,
  type EvidenceReading,
  evidenceReadingSchema,
  resultsPhaseStateSchema,
  type ResultsPhaseState,
} from "../src/contracts/results.js";
import { createApp } from "../src/http/app.js";
import { prototypeMatrix } from "../src/prototype/matrix.js";
import type { ResultsEngine } from "../src/results/engine.js";
import { ResultsService } from "../src/results/service.js";
import { FileStore } from "../src/storage/file-store.js";

let tempDir: string;
let store: FileStore;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "nucleo-results-test-"));
  store = new FileStore(join(tempDir, "store.json"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("Registro de resultados", () => {
  it("usa los campos de registro declarados por cada artefacto de la matriz", () => {
    for (const route of prototypeMatrix) {
      const hydratedRoute = route as typeof route & {
        evidenceScope: {
          sample: string;
          sampleTargetMin: number;
          sampleTargetMax: number;
        };
        advanceSignals: string[];
        closedQuestions: unknown[];
        evidenceMetrics: Array<{
          questionId: string;
          advanceValues: string[];
          advance: string;
          iterate: string;
          rethink: string;
        }>;
      };

      expect(hydratedRoute.register).toBeDefined();
      expect(hydratedRoute.register.length).toBeGreaterThanOrEqual(4);
      expect(hydratedRoute.evidenceScope.sample).toBeTruthy();
      expect(hydratedRoute.evidenceScope.sampleTargetMin).toBeGreaterThan(0);
      expect(hydratedRoute.evidenceScope.sampleTargetMax).toBeGreaterThanOrEqual(
        hydratedRoute.evidenceScope.sampleTargetMin,
      );
      expect(hydratedRoute.advanceSignals.length).toBeGreaterThanOrEqual(2);
      expect(hydratedRoute.closedQuestions.length).toBeGreaterThanOrEqual(4);
      expect(hydratedRoute.evidenceMetrics.length).toBeGreaterThanOrEqual(1);
      for (const metric of hydratedRoute.evidenceMetrics) {
        expect(metric.questionId).toBeTruthy();
        expect(metric.advanceValues.length).toBeGreaterThanOrEqual(1);
        expect(metric.advance).toBeTruthy();
        expect(metric.iterate).toBeTruthy();
        expect(metric.rethink).toBeTruthy();
      }
    }
  });

  it("normaliza estado parcial con registros vacíos", () => {
    const parsed = resultsPhaseStateSchema.parse({
      cycleId: "cycle-results",
      prototypeRouteId: "commercial_offer",
    });

    expect(parsed.records).toEqual([]);
  });

  it("persiste registros de evidencia ligados a la ruta prototipada", async () => {
    const service = new ResultsService(store);
    const input: ResultsPhaseState = {
      cycleId: "cycle-results",
      prototypeRouteId: "commercial_offer",
      methodologicalRoute: "invalidate_signal",
      records: [
        {
          id: "result-1",
          closedValues: {
            asked_next_step: "Sí",
            identified_differential_value: "Sí",
          },
          values: {
            claridad_de_oferta: "Entiende el paquete.",
            solicita_reunion_o_cotizacion: "Solicita reunión con comité.",
          },
          notes: "Señal observable de avance.",
          createdAt: new Date().toISOString(),
        },
      ],
    };

    await service.save(input);

    const stored = await service.get(input.cycleId);
    const audit = await store.listAuditEvents(input.cycleId);

    expect(stored?.prototypeRouteId).toBe("commercial_offer");
    expect(stored?.methodologicalRoute).toBe("invalidate_signal");
    expect(stored?.records).toHaveLength(1);
    expect(stored?.records[0]?.values.solicita_reunion_o_cotizacion).toBe(
      "Solicita reunión con comité.",
    );
    expect(audit.some((event) => event.stage === "RESULTS")).toBe(true);
  });

  it("lee evidencia con IA y persiste una decisión sin score", async () => {
    const service = new ResultsService(store, new FakeResultsEngine());
    const route = prototypeMatrix.find((item) => item.id === "commercial_offer") as unknown as EvidenceReadInput["route"];
    const input: EvidenceReadInput = {
      cycleId: "cycle-results",
      route,
      closedQuestions: [],
      records: [
        {
          id: "result-1",
          closedValues: {
            asked_next_step: "Sí",
            interest_quality: "Compromiso observable",
          },
          values: {
            claridad_de_oferta: "Entiende el valor diferencial.",
          },
          createdAt: new Date().toISOString(),
        },
      ],
    };

    const result = await service.read(input);
    const stored = await service.get(input.cycleId);

    expect(result.evidenceReading?.decision).toBe("Iterar");
    expect(stored?.evidenceReading?.decision).toBe("Iterar");
    expect(stored?.methodologicalRoute).toBe("iterate");
    expect(JSON.stringify(stored?.evidenceReading)).not.toMatch(/score/i);
  });

  it("bloquea avance optimista cuando la muestra no alcanza el mínimo del artefacto", async () => {
    const service = new ResultsService(store, new OptimisticResultsEngine());
    const route = prototypeMatrix.find((item) => item.id === "commercial_offer") as unknown as EvidenceReadInput["route"];
    const result = await service.read({
      cycleId: "cycle-results",
      route,
      closedQuestions: [],
      records: [
        {
          id: "result-1",
          closedValues: {
            asked_next_step: "Sí",
          },
          values: {},
          createdAt: new Date().toISOString(),
        },
      ],
    });

    expect(result.evidenceReading?.decision).toBe("Iterar");
    expect(result.evidenceReading?.confidence).toBe("Baja");
    expect(result.evidenceReading?.methodologicalRoute).toBe("iterate");
    expect(result.evidenceReading?.weakOrMissingEvidence[0]).toContain("1/5");
  });

  it("rechaza lecturas de evidencia con rutas metodológicas fuera del contrato", () => {
    expect(() =>
      evidenceReadingSchema.parse({
        decision: "Iterar",
        confidence: "Media",
        testedAssumption: "El comprador pagaría por visibilidad preventiva.",
        methodologicalRoute: "score_gate",
        methodologicalRationale:
          "La recomendación debe quedar dentro de las rutas metodológicas declaradas.",
        rationale:
          "Hay señales parciales, pero todavía falta ampliar muestra y controlar mala lectura.",
        evidenceSupports: ["Existe un siguiente paso observable."],
        weakOrMissingEvidence: ["Faltan más registros contra la muestra esperada."],
        falsePositiveRisk:
          "El interés puede ser cortesía si no hay compromiso verificable.",
        falseNegativeRisk:
          "Una mala explicación del artefacto puede ocultar un problema real.",
        learning:
          "La idea puede tener valor, pero necesita una prueba mejor instrumentada.",
        nextStep: "Ajustar el prototipo y repetir el test.",
      }),
    ).toThrow();
  });

  it("mantiene health con Resultados listo", async () => {
    const response = await createApp().request("/api/health");
    const body = await response.json();

    expect(body.results).toBe("ready");
    expect(body.evidenceReading).toBe("ready");
  });
});

class FakeResultsEngine implements ResultsEngine {
  async read(): Promise<EvidenceReading> {
    return {
      decision: "Iterar",
      confidence: "Baja",
      testedAssumption: "La renovación depende principalmente de precio y relación.",
      methodologicalRoute: "iterate",
      methodologicalRationale:
        "Hay señal observable, pero falta muestra suficiente y una segunda confirmación antes de avanzar.",
      rationale:
        "Hay compromiso observable, pero la muestra todavia es insuficiente para avanzar con confianza.",
      evidenceSupports: ["Pidio un siguiente paso concreto."],
      weakOrMissingEvidence: ["Faltan mas conversaciones frente al alcance esperado."],
      falsePositiveRisk:
        "El interes puede ser cortesia si no se confirma con mas compradores.",
      falseNegativeRisk:
        "Una ficha incompleta puede ocultar valor real de la propuesta.",
      learning:
        "La propuesta se entiende, pero necesita mas evidencia antes de avanzar.",
      nextStep: "Probar con compradores adicionales y reforzar la ficha.",
    };
  }
}

class OptimisticResultsEngine implements ResultsEngine {
  async read(): Promise<EvidenceReading> {
    return {
      decision: "Avanzar",
      confidence: "Alta",
      testedAssumption: "El comprador avanza con evidencia preventiva.",
      methodologicalRoute: "advance",
      methodologicalRationale:
        "El registro disponible muestra todas las señales positivas.",
      rationale:
        "Hay compromiso observable y valor diferencial declarado en el registro.",
      evidenceSupports: ["Pidió siguiente paso concreto."],
      weakOrMissingEvidence: ["Falta contrastar con más conversaciones."],
      falsePositiveRisk:
        "El interés podría depender de una relación comercial previa.",
      falseNegativeRisk:
        "Una mala explicación podría ocultar valor.",
      learning:
        "La oferta puede ser clara para este comprador inicial.",
      nextStep: "Pasar a playbook.",
    };
  }
}
