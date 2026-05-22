import { PDFParse } from "pdf-parse";
import * as mammoth from "mammoth";
import * as XLSX from "xlsx";

export const MAX_DOCUMENT_BYTES = 4 * 1024 * 1024;
const MAX_EXTRACTED_TEXT_CHARS = 24_000;

export type DocumentUploadItem = {
  name: string;
  mimeType?: string;
  sizeBytes?: number;
  text?: string;
  dataBase64?: string;
  summary?: string;
};

export type ExtractionResult = {
  text: string;
  status: "EXTRACTED" | "TEXT_PROVIDED" | "UNSUPPORTED" | "EMPTY";
  summary?: string;
};

export async function extractDocumentText(
  document: DocumentUploadItem,
): Promise<ExtractionResult> {
  const providedText = cleanText(document.text ?? "");

  if (providedText) {
    return {
      text: limitText(providedText),
      status: "EXTRACTED",
      summary: summarizeText(providedText),
    };
  }

  const summary = cleanText(document.summary ?? "");

  if (!document.dataBase64) {
    return {
      text: "",
      status: summary ? "TEXT_PROVIDED" : "UNSUPPORTED",
      summary: summary || undefined,
    };
  }

  const buffer = Buffer.from(document.dataBase64, "base64");
  const declaredSize = document.sizeBytes ?? buffer.byteLength;

  if (declaredSize > MAX_DOCUMENT_BYTES || buffer.byteLength > MAX_DOCUMENT_BYTES) {
    return {
      text: "",
      status: "UNSUPPORTED",
      summary: `Archivo cargado, pero supera el limite de demo de ${Math.round(MAX_DOCUMENT_BYTES / 1024 / 1024)} MB.`,
    };
  }

  const kind = detectDocumentKind(document.name, document.mimeType);

  if (kind === "unsupported") {
    return {
      text: "",
      status: "UNSUPPORTED",
      summary:
        summary ||
        "Archivo cargado. Extraccion automatica no disponible para este tipo en el demo.",
    };
  }

  try {
    const extracted = cleanText(await extractByKind(kind, buffer));

    if (!extracted) {
      return {
        text: "",
        status: "EMPTY",
        summary: summary || "Archivo cargado, pero no se encontro texto extraible.",
      };
    }

    return {
      text: limitText(extracted),
      status: "EXTRACTED",
      summary: summarizeText(extracted),
    };
  } catch (error) {
    return {
      text: "",
      status: "UNSUPPORTED",
      summary:
        error instanceof Error
          ? `Archivo cargado, pero no se pudo extraer texto: ${error.message}`
          : "Archivo cargado, pero no se pudo extraer texto.",
    };
  }
}

async function extractByKind(kind: string, buffer: Buffer) {
  if (kind === "pdf") return extractPdf(buffer);
  if (kind === "docx") return extractDocx(buffer);
  if (kind === "xlsx") return extractWorkbook(buffer);
  if (kind === "csv" || kind === "text") return buffer.toString("utf8");

  return "";
}

async function extractPdf(buffer: Buffer) {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });

  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

async function extractDocx(buffer: Buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

function extractWorkbook(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const chunks: string[] = [];

  for (const sheetName of workbook.SheetNames.slice(0, 5)) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
      raw: false,
    });
    const sample = rows.slice(0, 80).map((row) =>
      Object.entries(row)
        .map(([key, value]) => `${key}: ${String(value).trim()}`)
        .filter((item) => !item.endsWith(":"))
        .join(" | "),
    );

    chunks.push([`Hoja: ${sheetName}`, ...sample].join("\n"));
  }

  return chunks.join("\n\n");
}

function detectDocumentKind(name: string, mimeType = "") {
  const cleanName = name.toLowerCase();
  const cleanMime = mimeType.toLowerCase();

  if (cleanMime.includes("pdf") || cleanName.endsWith(".pdf")) return "pdf";
  if (
    cleanMime.includes("wordprocessingml") ||
    cleanMime.includes("msword") ||
    cleanName.endsWith(".docx")
  ) {
    return "docx";
  }
  if (
    cleanMime.includes("spreadsheetml") ||
    cleanMime.includes("excel") ||
    cleanName.endsWith(".xlsx") ||
    cleanName.endsWith(".xls")
  ) {
    return "xlsx";
  }
  if (cleanMime.includes("csv") || cleanName.endsWith(".csv")) return "csv";
  if (
    cleanMime.startsWith("text/") ||
    /\.(txt|md|json|xml|html)$/i.test(cleanName)
  ) {
    return "text";
  }

  return "unsupported";
}

function cleanText(value: string) {
  return value.replace(/\u0000/g, "").replace(/\s+/g, " ").trim();
}

function limitText(value: string) {
  return value.length > MAX_EXTRACTED_TEXT_CHARS
    ? `${value.slice(0, MAX_EXTRACTED_TEXT_CHARS - 3)}...`
    : value;
}

function summarizeText(text: string) {
  const clean = cleanText(text);
  return clean.length > 360 ? `${clean.slice(0, 357)}...` : clean;
}
