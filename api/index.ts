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
import { createSignalsEngine } from "../src/signals/engine.js";
import { SignalsService } from "../src/signals/service.js";
import { createIdeationEngine } from "../src/ideation/engine.js";
import { IdeationService } from "../src/ideation/service.js";
import {
  prototypeBuildInputSchema,
  prototypeClassifyInputSchema,
  prototypePhaseStateSchema,
} from "../src/contracts/prototype.js";
import {
  evidenceReadInputSchema,
  resultsPhaseStateSchema,
} from "../src/contracts/results.js";
import { playbookGenerateInputSchema } from "../src/contracts/playbook.js";
import { createPrototypeEngine } from "../src/prototype/engine.js";
import { PrototypeService } from "../src/prototype/service.js";
import { createResultsEngine } from "../src/results/engine.js";
import { ResultsService } from "../src/results/service.js";
import { createPlaybookEngine } from "../src/playbook/engine.js";
import { PlaybookService } from "../src/playbook/service.js";
import { buildSystemCapabilities } from "../src/system/capabilities.js";
import { readClientAsset, readClientIndex } from "../src/http/client-assets.js";

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
      const index = await readClientIndex();

      if (method === "HEAD") {
        response.statusCode = 200;
        response.setHeader("content-type", "text/html; charset=utf-8");
        return response.end();
      }

      if (index) {
        return sendAsset(response, 200, index.body, index.contentType);
      }

      return sendHtml(response, 503, renderClientBuildMissingPage());
    }

    if (
      (method === "GET" || method === "HEAD") &&
      url.pathname.startsWith("/assets/")
    ) {
      const asset = await readClientAsset(url.pathname);

      if (!asset) {
        return sendJson(response, 404, { error: "not_found" });
      }

      if (method === "HEAD") {
        response.statusCode = 200;
        response.setHeader("content-type", asset.contentType);
        response.setHeader(
          "cache-control",
          "public, max-age=31536000, immutable",
        );
        return response.end();
      }

      response.setHeader(
        "cache-control",
        "public, max-age=31536000, immutable",
      );
      return sendAsset(response, 200, asset.body, asset.contentType);
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
        ideation: "ready",
        prototype: "ready",
        results: "ready",
        evidenceReading: "ready",
        playbook: "ready",
        cycleMemory: "ready",
        databaseId: process.env.NUCLEO_DB_ID ?? "local-file",
      });
    }

    if (
      (method === "GET" || method === "HEAD") &&
      url.pathname === "/api/system/capabilities"
    ) {
      if (method === "HEAD") {
        response.statusCode = 200;
        response.setHeader("content-type", "application/json");
        return response.end();
      }

      return sendJson(response, 200, buildSystemCapabilities());
    }

    if (method === "POST" && url.pathname === "/api/registration") {
      const body = await readJson(request);
      return sendJson(response, 200, await registrationService.create(body));
    }

    if (method === "POST" && url.pathname === "/api/registration/documents") {
      const body = await readJson(request);
      return sendJson(response, 200, await registrationService.uploadDocuments(body));
    }

    const registrationByCycleMatch = /^\/api\/registration\/cycles\/([^/]+)$/.exec(
      url.pathname,
    );

    if (method === "GET" && registrationByCycleMatch) {
      const registration = await registrationService.getByCycle(
        decodeURIComponent(registrationByCycleMatch[1]!),
      );

      if (!registration) {
        return sendJson(response, 404, { error: "registration_not_found" });
      }

      return sendJson(response, 200, { registration });
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

    const cycleDraftMatch = /^\/api\/diagnosis\/cycles\/([^/]+)\/draft$/.exec(
      url.pathname,
    );

    if (method === "GET" && cycleDraftMatch) {
      const draft = await service.getDraft(
        decodeURIComponent(cycleDraftMatch[1]!),
      );

      return sendJson(response, 200, { draft });
    }

    if (method === "PUT" && cycleDraftMatch) {
      const body = await readJson(request);
      const draft = await service.saveDraft({
        ...body,
        cycleId: decodeURIComponent(cycleDraftMatch[1]!),
        updatedAt: new Date().toISOString(),
      });

      return sendJson(response, 200, { draft });
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

    const ideationGenerateMatch =
      /^\/api\/ideation\/cycles\/([^/]+)\/generate$/.exec(url.pathname);

    if (method === "POST" && ideationGenerateMatch) {
      const body = await readJson(request);
      const result = await ideationService.generate(
        decodeURIComponent(ideationGenerateMatch[1]!),
        body.selection,
      );

      return sendJson(response, 200, result);
    }

    const ideationOptionsMatch =
      /^\/api\/ideation\/cycles\/([^/]+)\/options$/.exec(url.pathname);

    if (method === "GET" && ideationOptionsMatch) {
      const options = await ideationService.buildOptions(
        decodeURIComponent(ideationOptionsMatch[1]!),
      );

      return sendJson(response, 200, { options });
    }

    const ideationMatch = /^\/api\/ideation\/cycles\/([^/]+)$/.exec(
      url.pathname,
    );

    if (method === "GET" && ideationMatch) {
      const ideation = await ideationService.get(
        decodeURIComponent(ideationMatch[1]!),
      );

      if (!ideation) {
        return sendJson(response, 404, { error: "ideation_not_found" });
      }

      return sendJson(response, 200, { ideation });
    }

    if (method === "POST" && url.pathname === "/api/prototype/build") {
      const body = await readJson(request);
      const input = prototypeBuildInputSchema.parse(body);
      const artifact = await prototypeService.build(input);

      return sendJson(response, 200, { artifact });
    }

    if (method === "POST" && url.pathname === "/api/prototype/classify") {
      const body = await readJson(request);
      const input = prototypeClassifyInputSchema.parse(body);
      const classification = await prototypeService.classify(input);

      return sendJson(response, 200, { classification });
    }

    const prototypeMatch = /^\/api\/prototype\/cycles\/([^/]+)$/.exec(
      url.pathname,
    );

    if (method === "GET" && prototypeMatch) {
      const prototype = await prototypeService.get(
        decodeURIComponent(prototypeMatch[1]!),
      );

      if (!prototype) {
        return sendJson(response, 404, { error: "prototype_not_found" });
      }

      return sendJson(response, 200, { prototype });
    }

    if (method === "POST" && prototypeMatch) {
      const body = await readJson(request);
      const input = prototypePhaseStateSchema.parse({
        ...body,
        cycleId: decodeURIComponent(prototypeMatch[1]!),
      });
      const prototype = await prototypeService.save(input);

      return sendJson(response, 200, { prototype });
    }

    const resultsMatch = /^\/api\/results\/cycles\/([^/]+)$/.exec(
      url.pathname,
    );

    if (method === "GET" && resultsMatch) {
      const results = await resultsService.get(
        decodeURIComponent(resultsMatch[1]!),
      );

      if (!results) {
        return sendJson(response, 404, { error: "results_not_found" });
      }

      return sendJson(response, 200, { results });
    }

    if (method === "POST" && resultsMatch) {
      const body = await readJson(request);
      const input = resultsPhaseStateSchema.parse({
        ...body,
        cycleId: decodeURIComponent(resultsMatch[1]!),
      });
      const results = await resultsService.save(input);

      return sendJson(response, 200, { results });
    }

    if (method === "POST" && url.pathname === "/api/results/read") {
      const body = await readJson(request);
      const input = evidenceReadInputSchema.parse(body);
      const results = await resultsService.read(input);

      return sendJson(response, 200, { evidenceReading: results.evidenceReading });
    }

    if (method === "POST" && url.pathname === "/api/playbook/generate") {
      const body = await readJson(request);
      const input = playbookGenerateInputSchema.parse(body);
      const playbook = await playbookService.generate(input);

      return sendJson(response, 200, { playbook });
    }

    const playbookMatch = /^\/api\/playbook\/cycles\/([^/]+)$/.exec(
      url.pathname,
    );

    if (method === "GET" && playbookMatch) {
      const playbook = await playbookService.get(
        decodeURIComponent(playbookMatch[1]!),
      );

      if (!playbook) {
        return sendJson(response, 404, { error: "playbook_not_found" });
      }

      return sendJson(response, 200, { playbook });
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

    const companyMemoriesMatch =
      /^\/api\/companies\/([^/]+)\/cycle-memories$/.exec(url.pathname);

    if (method === "GET" && companyMemoriesMatch) {
      const memories = await playbookService.listCompanyMemory(
        decodeURIComponent(companyMemoriesMatch[1]!),
      );

      return sendJson(response, 200, { memories });
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

function sendAsset(
  response: ServerResponse,
  status: number,
  body: Buffer,
  contentType: string,
) {
  response.statusCode = status;
  response.setHeader("content-type", contentType);
  response.end(body);
}
