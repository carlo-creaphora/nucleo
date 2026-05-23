import type { IncomingMessage, ServerResponse } from "node:http";
import { createDiagnosisEngine } from "../src/diagnosis/engine.js";
import {
  DiagnosisClosureError,
  DiagnosisService,
} from "../src/diagnosis/service.js";
import { createRegistrationEngine } from "../src/registration/engine.js";
import { RegistrationService } from "../src/registration/service.js";
import { diagnosisOutputSchema } from "../src/contracts/diagnosis.js";
import { createStore } from "../src/storage/file-store.js";
import { renderHomePage } from "../src/http/home-page.js";
import { createSignalsEngine } from "../src/signals/engine.js";
import { SignalsService } from "../src/signals/service.js";

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

export const config = {
  runtime: "nodejs",
};

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  try {
    const url = new URL(request.url ?? "/", "https://nucleo.local");
    const method = request.method ?? "GET";

    if ((method === "GET" || method === "HEAD") && url.pathname === "/") {
      if (method === "HEAD") {
        response.statusCode = 200;
        response.setHeader("content-type", "text/html; charset=utf-8");
        return response.end();
      }

      return sendHtml(response, 200, renderHomePage());
    }

    if ((method === "GET" || method === "HEAD") && url.pathname === "/api/health") {
      if (method === "HEAD") {
        response.statusCode = 200;
        response.setHeader("content-type", "application/json");
        return response.end();
      }

      return sendJson(response, 200, {
        ok: true,
        service: "nucleo",
        diagnosis: "ready",
        signals: "ready",
        databaseId: process.env.NUCLEO_DB_ID ?? "local-file",
      });
    }

    if (method === "POST" && url.pathname === "/api/registration") {
      const body = await readJson(request);
      return sendJson(response, 200, await registrationService.create(body));
    }

    if (method === "POST" && url.pathname === "/api/registration/documents") {
      const body = await readJson(request);
      return sendJson(response, 200, await registrationService.uploadDocuments(body));
    }

    const registrationMatch = /^\/api\/registration\/([^/]+)$/.exec(
      url.pathname,
    );

    if (method === "GET" && registrationMatch) {
      const registration = await registrationService.get(
        decodeURIComponent(registrationMatch[1]!),
      );

      if (!registration) {
        return sendJson(response, 404, { error: "registration_not_found" });
      }

      return sendJson(response, 200, { registration });
    }

    if (method === "POST" && url.pathname === "/api/diagnosis/question") {
      const body = await readJson(request);
      return sendJson(response, 200, await service.nextQuestion(body));
    }

    if (method === "POST" && url.pathname === "/api/diagnosis/complete") {
      const body = await readJson(request);
      return sendJson(response, 200, await service.complete(body));
    }

    if (method === "POST" && url.pathname === "/api/diagnosis/reinterpret") {
      const body = await readJson(request);
      const previousDiagnosis = diagnosisOutputSchema.parse(
        body.previousDiagnosis,
      );

      return sendJson(
        response,
        200,
        await service.reinterpret(body.input, previousDiagnosis),
      );
    }

    const cycleMatch = /^\/api\/diagnosis\/cycles\/([^/]+)$/.exec(
      url.pathname,
    );

    if (method === "GET" && cycleMatch) {
      const cycle = await service.getCycle(decodeURIComponent(cycleMatch[1]!));

      if (!cycle) {
        return sendJson(response, 404, { error: "cycle_not_found" });
      }

      return sendJson(response, 200, { cycle });
    }

    const cycleVersionsMatch = /^\/api\/diagnosis\/cycles\/([^/]+)\/versions$/.exec(
      url.pathname,
    );

    if (method === "GET" && cycleVersionsMatch) {
      const versions = await service.listVersions(
        decodeURIComponent(cycleVersionsMatch[1]!),
      );

      return sendJson(response, 200, { versions });
    }

    const cycleAuditMatch = /^\/api\/diagnosis\/cycles\/([^/]+)\/audit$/.exec(
      url.pathname,
    );

    if (method === "GET" && cycleAuditMatch) {
      const events = await service.listAudit(
        decodeURIComponent(cycleAuditMatch[1]!),
      );

      return sendJson(response, 200, { events });
    }

    const ideationInputMatch =
      /^\/api\/diagnosis\/cycles\/([^/]+)\/ideation-input$/.exec(
        url.pathname,
      );

    if (method === "GET" && ideationInputMatch) {
      const ideationInput = await service.buildIdeationInput(
        decodeURIComponent(ideationInputMatch[1]!),
      );

      if (!ideationInput) {
        return sendJson(response, 404, { error: "ideation_input_not_ready" });
      }

      return sendJson(response, 200, { ideationInput });
    }

    const signalsInputMatch =
      /^\/api\/signals\/cycles\/([^/]+)\/input$/.exec(url.pathname);

    if (method === "GET" && signalsInputMatch) {
      const signalsInput = await signalsService.buildInput(
        decodeURIComponent(signalsInputMatch[1]!),
      );

      if (!signalsInput) {
        return sendJson(response, 404, { error: "signals_input_not_ready" });
      }

      return sendJson(response, 200, { signalsInput });
    }

    const signalsGenerateMatch =
      /^\/api\/signals\/cycles\/([^/]+)\/generate$/.exec(url.pathname);

    if (method === "POST" && signalsGenerateMatch) {
      const result = await signalsService.generate(
        decodeURIComponent(signalsGenerateMatch[1]!),
      );

      return sendJson(response, 200, result);
    }

    const signalsMatch = /^\/api\/signals\/cycles\/([^/]+)$/.exec(
      url.pathname,
    );

    if (method === "GET" && signalsMatch) {
      const signals = await signalsService.get(
        decodeURIComponent(signalsMatch[1]!),
      );

      if (!signals) {
        return sendJson(response, 404, { error: "signals_not_found" });
      }

      return sendJson(response, 200, { signals });
    }

    const signalsIdeationInputMatch =
      /^\/api\/signals\/cycles\/([^/]+)\/ideation-input$/.exec(url.pathname);

    if (method === "GET" && signalsIdeationInputMatch) {
      const signalsIdeationInput = await signalsService.buildIdeationInput(
        decodeURIComponent(signalsIdeationInputMatch[1]!),
      );

      if (!signalsIdeationInput) {
        return sendJson(response, 404, {
          error: "signals_ideation_input_not_ready",
        });
      }

      return sendJson(response, 200, { signalsIdeationInput });
    }

    const companyCyclesMatch =
      /^\/api\/companies\/([^/]+)\/diagnosis-cycles$/.exec(url.pathname);

    if (method === "GET" && companyCyclesMatch) {
      const cycles = await service.listCompanyCycles(
        decodeURIComponent(companyCyclesMatch[1]!),
      );

      return sendJson(response, 200, { cycles });
    }

    const companyRegistrationsMatch =
      /^\/api\/companies\/([^/]+)\/registrations$/.exec(url.pathname);

    if (method === "GET" && companyRegistrationsMatch) {
      const registrations = await registrationService.listCompany(
        decodeURIComponent(companyRegistrationsMatch[1]!),
      );

      return sendJson(response, 200, { registrations });
    }

    return sendJson(response, 404, { error: "not_found" });
  } catch (error) {
    const status =
      error instanceof DiagnosisClosureError
        ? error.status
        : error instanceof Error && error.name === "ZodError"
          ? 400
          : 500;

    return sendJson(response, status, {
      error:
        status === 400
          ? "invalid_request"
          : status === 409
            ? "diagnosis_not_ready"
            : "internal_error",
      message: error instanceof Error ? error.message : "Unknown error",
      criticalMissing:
        error instanceof DiagnosisClosureError
          ? error.criticalMissing
          : undefined,
    });
  }
}

async function readJson(request: IncomingMessage) {
  const anyRequest = request as IncomingMessage & { body?: unknown };

  if (anyRequest.body && typeof anyRequest.body === "object") {
    return anyRequest.body as Record<string, unknown>;
  }

  const raw = await new Promise<string>((resolve, reject) => {
    let data = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      data += chunk;
    });
    request.on("end", () => resolve(data));
    request.on("error", reject);
  });

  return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
}

function sendJson(
  response: ServerResponse,
  status: number,
  body: Record<string, unknown>,
) {
  response.statusCode = status;
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify(body));
}

function sendHtml(response: ServerResponse, status: number, body: string) {
  response.statusCode = status;
  response.setHeader("content-type", "text/html; charset=utf-8");
  response.end(body);
}
