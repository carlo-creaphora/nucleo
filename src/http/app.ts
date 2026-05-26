import { Hono } from "hono";
import { z } from "zod";
import { createDiagnosisEngine } from "../diagnosis/engine.js";
import {
  DiagnosisClosureError,
  DiagnosisService,
} from "../diagnosis/service.js";
import { createRegistrationEngine } from "../registration/engine.js";
import { RegistrationService } from "../registration/service.js";
import { diagnosisOutputSchema } from "../contracts/diagnosis.js";
import { createStore } from "../storage/file-store.js";
import { createSignalsEngine } from "../signals/engine.js";
import { SignalsService } from "../signals/service.js";
import { createIdeationEngine } from "../ideation/engine.js";
import { IdeationService } from "../ideation/service.js";
import {
  prototypeBuildInputSchema,
  prototypeClassifyInputSchema,
  prototypePhaseStateSchema,
} from "../contracts/prototype.js";
import {
  evidenceReadInputSchema,
  resultsPhaseStateSchema,
} from "../contracts/results.js";
import { playbookGenerateInputSchema } from "../contracts/playbook.js";
import { createPrototypeEngine } from "../prototype/engine.js";
import { PrototypeService } from "../prototype/service.js";
import { createResultsEngine } from "../results/engine.js";
import { ResultsService } from "../results/service.js";
import { createPlaybookEngine } from "../playbook/engine.js";
import { PlaybookService } from "../playbook/service.js";
import { buildSystemCapabilities } from "../system/capabilities.js";
import { readClientAsset, readClientIndex } from "./client-assets.js";

export function createApp() {
  const app = new Hono();
  const store = createStore();
  const service = new DiagnosisService(createDiagnosisEngine(), store);
  const registrationService = new RegistrationService(
    createRegistrationEngine(),
    store,
  );
  const signalsService = new SignalsService(
    createSignalsEngine(),
    store,
    service,
  );
  const ideationService = new IdeationService(
    createIdeationEngine(),
    store,
    service,
    signalsService,
  );
  const prototypeService = new PrototypeService(createPrototypeEngine(), store);
  const resultsService = new ResultsService(store, createResultsEngine());
  const playbookService = new PlaybookService(createPlaybookEngine(), store);

  app.get("/", async (context) => {
    const index = await readClientIndex();

    if (index) {
      return new Response(new Uint8Array(index.body), {
        headers: { "content-type": index.contentType },
      });
    }

    return context.html(renderClientBuildMissingPage(), 503);
  });

  app.get("/assets/*", async (context) => {
    const asset = await readClientAsset(context.req.path);

    if (!asset) {
      return context.notFound();
    }

    return new Response(new Uint8Array(asset.body), {
      headers: {
        "cache-control": "public, max-age=31536000, immutable",
        "content-type": asset.contentType,
      },
    });
  });

  app.get("/api/health", (context) =>
    context.json({
      ok: true,
      service: "nucleo",
      diagnosis: "ready",
      signals: "ready",
      ideation: "ready",
      prototype: "ready",
      results: "ready",
      evidenceReading: "ready",
      playbook: "ready",
      cycleMemory: "ready",
      databaseId: process.env.NUCLEO_DB_ID ?? "local-file",
    }),
  );

  app.get("/api/system/capabilities", (context) =>
    context.json(buildSystemCapabilities()),
  );

  app.post("/api/diagnosis/question", async (context) => {
    const body = await context.req.json();
    const result = await service.nextQuestion(body);
    return context.json(result);
  });

  app.post("/api/registration", async (context) => {
    const body = await context.req.json();
    const result = await registrationService.create(body);
    return context.json(result);
  });

  app.post("/api/registration/documents", async (context) => {
    const body = await context.req.json();
    const result = await registrationService.uploadDocuments(body);
    return context.json(result);
  });

  app.get("/api/registration/:registrationId", async (context) => {
    const registration = await registrationService.get(
      context.req.param("registrationId"),
    );

    if (!registration) {
      return context.json({ error: "registration_not_found" }, 404);
    }

    return context.json({ registration });
  });

  app.post("/api/diagnosis/complete", async (context) => {
    const body = await context.req.json();
    const result = await service.complete(body);
    return context.json(result);
  });

  app.post("/api/diagnosis/reinterpret", async (context) => {
    const body = await context.req.json();
    const payload = z
      .object({
        input: z.unknown(),
        previousDiagnosis: diagnosisOutputSchema,
      })
      .parse(body);
    const result = await service.reinterpret(
      payload.input,
      payload.previousDiagnosis,
    );

    return context.json(result);
  });

  app.get("/api/diagnosis/cycles/:cycleId", async (context) => {
    const cycle = await service.getCycle(context.req.param("cycleId"));

    if (!cycle) {
      return context.json({ error: "cycle_not_found" }, 404);
    }

    return context.json({ cycle });
  });

  app.get("/api/diagnosis/cycles/:cycleId/versions", async (context) => {
    const versions = await service.listVersions(context.req.param("cycleId"));
    return context.json({ versions });
  });

  app.get("/api/diagnosis/cycles/:cycleId/audit", async (context) => {
    const events = await service.listAudit(context.req.param("cycleId"));
    return context.json({ events });
  });

  app.get("/api/diagnosis/cycles/:cycleId/ideation-input", async (context) => {
    const ideationInput = await service.buildIdeationInput(
      context.req.param("cycleId"),
    );

    if (!ideationInput) {
      return context.json({ error: "ideation_input_not_ready" }, 404);
    }

    return context.json({ ideationInput });
  });

  app.get("/api/signals/cycles/:cycleId/input", async (context) => {
    const signalsInput = await signalsService.buildInput(
      context.req.param("cycleId"),
    );

    return context.json({ signalsInput });
  });

  app.post("/api/signals/cycles/:cycleId/generate", async (context) => {
    const result = await signalsService.generate(context.req.param("cycleId"));
    return context.json(result);
  });

  app.get("/api/signals/cycles/:cycleId", async (context) => {
    const signals = await signalsService.get(context.req.param("cycleId"));

    if (!signals) {
      return context.json({ error: "signals_not_found" }, 404);
    }

    return context.json({ signals });
  });

  app.get("/api/signals/cycles/:cycleId/ideation-input", async (context) => {
    const signalsIdeationInput = await signalsService.buildIdeationInput(
      context.req.param("cycleId"),
    );

    if (!signalsIdeationInput) {
      return context.json({ error: "signals_ideation_input_not_ready" }, 404);
    }

    return context.json({ signalsIdeationInput });
  });

  app.post("/api/ideation/cycles/:cycleId/generate", async (context) => {
    const body = await context.req.json();
    const result = await ideationService.generate(
      context.req.param("cycleId"),
      body.selection,
    );

    return context.json(result);
  });

  app.get("/api/ideation/cycles/:cycleId/options", async (context) => {
    const options = await ideationService.buildOptions(
      context.req.param("cycleId"),
    );

    return context.json({ options });
  });

  app.get("/api/ideation/cycles/:cycleId", async (context) => {
    const ideation = await ideationService.get(context.req.param("cycleId"));

    if (!ideation) {
      return context.json({ error: "ideation_not_found" }, 404);
    }

    return context.json({ ideation });
  });

  app.post("/api/prototype/build", async (context) => {
    const body = await context.req.json();
    const input = prototypeBuildInputSchema.parse(body);
    const artifact = await prototypeService.build(input);

    return context.json({ artifact });
  });

  app.post("/api/prototype/classify", async (context) => {
    const body = await context.req.json();
    const input = prototypeClassifyInputSchema.parse(body);
    const classification = await prototypeService.classify(input);

    return context.json({ classification });
  });

  app.get("/api/prototype/cycles/:cycleId", async (context) => {
    const prototype = await prototypeService.get(context.req.param("cycleId"));

    if (!prototype) {
      return context.json({ error: "prototype_not_found" }, 404);
    }

    return context.json({ prototype });
  });

  app.post("/api/prototype/cycles/:cycleId", async (context) => {
    const body = await context.req.json();
    const input = prototypePhaseStateSchema.parse({
      ...body,
      cycleId: context.req.param("cycleId"),
    });
    const prototype = await prototypeService.save(input);

    return context.json({ prototype });
  });

  app.get("/api/results/cycles/:cycleId", async (context) => {
    const results = await resultsService.get(context.req.param("cycleId"));

    if (!results) {
      return context.json({ error: "results_not_found" }, 404);
    }

    return context.json({ results });
  });

  app.post("/api/results/cycles/:cycleId", async (context) => {
    const body = await context.req.json();
    const input = resultsPhaseStateSchema.parse({
      ...body,
      cycleId: context.req.param("cycleId"),
    });
    const results = await resultsService.save(input);

    return context.json({ results });
  });

  app.post("/api/results/read", async (context) => {
    const body = await context.req.json();
    const input = evidenceReadInputSchema.parse(body);
    const results = await resultsService.read(input);

    return context.json({ evidenceReading: results.evidenceReading });
  });

  app.post("/api/playbook/generate", async (context) => {
    const body = await context.req.json();
    const input = playbookGenerateInputSchema.parse(body);
    const playbook = await playbookService.generate(input);

    return context.json({ playbook });
  });

  app.get("/api/playbook/cycles/:cycleId", async (context) => {
    const playbook = await playbookService.get(context.req.param("cycleId"));

    if (!playbook) {
      return context.json({ error: "playbook_not_found" }, 404);
    }

    return context.json({ playbook });
  });

  app.get("/api/companies/:companyId/cycle-memories", async (context) => {
    const memories = await playbookService.listCompanyMemory(
      context.req.param("companyId"),
    );

    return context.json({ memories });
  });

  app.get("/api/companies/:companyId/diagnosis-cycles", async (context) => {
    const cycles = await service.listCompanyCycles(
      context.req.param("companyId"),
    );

    return context.json({ cycles });
  });

  app.get("/api/companies/:companyId/registrations", async (context) => {
    const registrations = await registrationService.listCompany(
      context.req.param("companyId"),
    );

    return context.json({ registrations });
  });

  app.onError((error, context) => {
    const status =
      error instanceof DiagnosisClosureError
        ? 409
        : error instanceof z.ZodError
          ? 400
          : 500;

    return context.json(
      {
        error:
          status === 400
            ? "invalid_request"
            : status === 409
              ? "diagnosis_not_ready"
              : "internal_error",
        message: error.message,
        criticalMissing:
          error instanceof DiagnosisClosureError
            ? error.criticalMissing
            : undefined,
      },
      status,
    );
  });

  return app;
}

function renderClientBuildMissingPage() {
  return [
    "<!doctype html>",
    '<html lang="es">',
    "<head>",
    '<meta charset="UTF-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    "<title>Núcleo</title>",
    "</head>",
    '<body style="font-family: system-ui, sans-serif; margin: 48px; color: #171717;">',
    "<h1>Núcleo requiere el build React.</h1>",
    "<p>Ejecuta <code>pnpm build</code> para generar <code>dist/client</code>.</p>",
    "</body>",
    "</html>",
  ].join("");
}
