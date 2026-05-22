import { Hono } from "hono";
import { z } from "zod";
import { createDiagnosisEngine } from "../diagnosis/engine.js";
import { DiagnosisService } from "../diagnosis/service.js";
import { diagnosisOutputSchema } from "../contracts/diagnosis.js";
import { createStore } from "../storage/file-store.js";

export function createApp() {
  const app = new Hono();
  const service = new DiagnosisService(createDiagnosisEngine(), createStore());

  app.get("/api/health", (context) =>
    context.json({
      ok: true,
      service: "nucleo",
      diagnosis: "ready",
    }),
  );

  app.post("/api/diagnosis/question", async (context) => {
    const body = await context.req.json();
    const result = await service.nextQuestion(body);
    return context.json(result);
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

  app.get("/api/companies/:companyId/diagnosis-cycles", async (context) => {
    const cycles = await service.listCompanyCycles(
      context.req.param("companyId"),
    );

    return context.json({ cycles });
  });

  app.onError((error, context) => {
    const status = error instanceof z.ZodError ? 400 : 500;

    return context.json(
      {
        error: status === 400 ? "invalid_request" : "internal_error",
        message: error.message,
      },
      status,
    );
  });

  return app;
}

