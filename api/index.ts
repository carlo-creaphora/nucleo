import type { IncomingMessage, ServerResponse } from "node:http";
import { createDiagnosisEngine } from "../src/diagnosis/engine.js";
import { DiagnosisService } from "../src/diagnosis/service.js";
import { diagnosisOutputSchema } from "../src/contracts/diagnosis.js";
import { createStore } from "../src/storage/file-store.js";

const service = new DiagnosisService(createDiagnosisEngine(), createStore());

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

    if (method === "GET" && url.pathname === "/") {
      return sendHtml(response, 200, renderHomePage());
    }

    if (method === "GET" && url.pathname === "/api/health") {
      return sendJson(response, 200, {
        ok: true,
        service: "nucleo",
        diagnosis: "ready",
      });
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

    const companyCyclesMatch =
      /^\/api\/companies\/([^/]+)\/diagnosis-cycles$/.exec(url.pathname);

    if (method === "GET" && companyCyclesMatch) {
      const cycles = await service.listCompanyCycles(
        decodeURIComponent(companyCyclesMatch[1]!),
      );

      return sendJson(response, 200, { cycles });
    }

    return sendJson(response, 404, { error: "not_found" });
  } catch (error) {
    const status =
      error instanceof Error && error.name === "ZodError" ? 400 : 500;

    return sendJson(response, status, {
      error: status === 400 ? "invalid_request" : "internal_error",
      message: error instanceof Error ? error.message : "Unknown error",
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

function renderHomePage() {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Nucleo</title>
    <style>
      body {
        margin: 0;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #f7f4ee;
        color: #171717;
      }
      main {
        max-width: 840px;
        margin: 0 auto;
        padding: 64px 24px;
      }
      h1 {
        font-size: 48px;
        line-height: 1;
        margin: 0 0 16px;
      }
      p {
        font-size: 18px;
        line-height: 1.6;
        color: #4b4b4b;
      }
      code {
        background: #e9e2d6;
        border-radius: 6px;
        padding: 3px 6px;
      }
      ul {
        padding-left: 20px;
        line-height: 1.9;
      }
      a {
        color: #111;
        font-weight: 650;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Nucleo</h1>
      <p>API publica activa. La primera fase funcional implementada es Diagnostico con IA real en produccion.</p>
      <ul>
        <li><a href="/api/health"><code>GET /api/health</code></a></li>
        <li><code>POST /api/diagnosis/question</code></li>
        <li><code>POST /api/diagnosis/complete</code></li>
        <li><code>POST /api/diagnosis/reinterpret</code></li>
      </ul>
    </main>
  </body>
</html>`;
}
