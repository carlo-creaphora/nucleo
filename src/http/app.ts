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
import { renderHomePage } from "./home-page.js";

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

  app.get("/", (context) => context.html(renderHomePage()));

  app.get("/api/health", (context) =>
    context.json({
      ok: true,
      service: "nucleo",
      diagnosis: "ready",
      signals: "ready",
      ideation: "ready",
      databaseId: process.env.NUCLEO_DB_ID ?? "local-file",
    }),
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
