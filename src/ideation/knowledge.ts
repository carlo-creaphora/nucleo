import { readFile } from "node:fs/promises";
import { join } from "node:path";
import mammoth from "mammoth";
import {
  type IdeationKnowledgePack,
  ideationKnowledgePackSchema,
} from "../contracts/ideation.js";

const DEFAULT_KNOWLEDGE_DIR = join(
  process.cwd(),
  "knowledge",
  "ideation",
);

export async function loadIdeationKnowledgePack(
  dir = process.env.NUCLEO_IDEATION_KNOWLEDGE_DIR?.trim() ||
    DEFAULT_KNOWLEDGE_DIR,
): Promise<IdeationKnowledgePack> {
  const [assumptionsRaw, antiPatternsRaw, businessModelsRaw, casesResult] =
    await Promise.all([
      readFile(join(dir, "supuestos-por-industria.md"), "utf8"),
      readFile(join(dir, "anti-patrones.md"), "utf8"),
      readFile(join(dir, "modelos-negocio-raros.md"), "utf8"),
      mammoth.extractRawText({
        path: join(dir, "casos-disruptivos.md.docx"),
      }),
    ]);
  const disruptiveCasesRaw = casesResult.value;

  return ideationKnowledgePackSchema.parse({
    sourceDocuments: {
      assumptionsByIndustry: assumptionsRaw,
      antiPatterns: antiPatternsRaw,
      disruptiveCases: disruptiveCasesRaw,
      weirdBusinessModels: businessModelsRaw,
    },
    assumptionsByIndustry: parseAssumptions(assumptionsRaw),
    antiPatterns: parseAntiPatterns(antiPatternsRaw),
    disruptiveCases: parseDisruptiveCases(disruptiveCasesRaw),
    weirdBusinessModels: parseBusinessModels(businessModelsRaw),
  });
}

function parseAssumptions(markdown: string) {
  return parseHeadingBlocks(markdown)
    .filter((block) => /^#{3}\s+/.test(block.heading))
    .map((block) => {
      const industry = nearestIndustry(markdown, block.heading) ?? "transversal";
      const assumption =
        block.heading.replace(/^#{3}\s+/, "").replace(/^[A-Z]+\d+\.\s*/, "").replace(/^"|"$/g, "");
      const whyItLimitsIdeation =
        extractAfterLabel(block.body, "Realidad") ||
        extractAfterLabel(block.body, "Tipo de idea") ||
        block.body.slice(0, 300);

      return {
        industry,
        assumption,
        whyItLimitsIdeation,
      };
    })
    .filter((item) => item.assumption.length >= 12)
    .slice(0, 80);
}

function parseAntiPatterns(markdown: string) {
  return parseHeadingBlocks(markdown)
    .filter((block) => /^#{3}\s+/.test(block.heading))
    .map((block) => {
      const title = block.heading.replace(/^#{3}\s+/, "").trim();
      const description =
        extractAfterLabel(block.body, "Por qué se reformula") ||
        block.body.replace(/\s+/g, " ").trim().slice(0, 500);
      const pattern =
        extractAfterLabel(block.body, "Riesgo") ||
        extractAfterLabel(block.body, "Patrón") ||
        title.replace(/^[A-Z]\d+\.\s*/, "");

      return {
        title,
        description,
        forbiddenIdeaPatterns: splitPatternTerms(pattern),
      };
    })
    .filter((item) => item.description.length >= 12)
    .slice(0, 80);
}

function parseDisruptiveCases(text: string) {
  const blocks = text
    .split(/\n(?=\d+\.\s)/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks
    .map((block) => {
      const firstLine = block.split("\n")[0] ?? "";
      const name = firstLine.replace(/^\d+\.\s*/, "").trim();
      const industryLine = block.split("\n")[1] ?? "industria / pais / ano no documentado";
      const [rawIndustry, rawCountry, rawYear] = industryLine
        .split("/")
        .map((part) => part.trim());
      const industry =
        rawIndustry && rawIndustry.length >= 3 ? rawIndustry : "no documentado";
      const country =
        rawCountry && rawCountry.length >= 3 ? rawCountry : "no documentado";
      const year = rawYear && rawYear.length >= 4 ? rawYear : "no documentado";

      return {
        name,
        year,
        industry,
        country,
        mechanism:
          extractInlineSection(block, "Mecánica") ||
          extractInlineSection(block, "Mecanica") ||
          "Mecanica no documentada en la fuente.",
        transferablePrinciple:
          extractInlineSection(block, "Patrón transferible") ||
          extractInlineSection(block, "Patron transferible") ||
          "Principio transferible no documentado en la fuente.",
      };
    })
    .filter(
      (item) =>
        item.name.length >= 2 &&
        item.mechanism.length >= 12 &&
        item.transferablePrinciple.length >= 12,
    )
    .slice(0, 80);
}

function parseBusinessModels(markdown: string) {
  return parseHeadingBlocks(markdown)
    .filter((block) => /^#{3}\s+\d+\.\s/.test(block.heading))
    .map((block) => {
      const name = block.heading.replace(/^#{3}\s+\d+\.\s*/, "").trim();

      return {
        name,
        model:
          extractAfterLabel(block.body, "Mecánica") ||
          extractAfterLabel(block.body, "Mecanica") ||
          block.body.slice(0, 300),
        usefulWhen:
          extractAfterLabel(block.body, "Cuándo aplica") ||
          extractAfterLabel(block.body, "Cuando aplica") ||
          "Aplicabilidad no documentada.",
      };
    })
    .filter((item) => item.name.length >= 3)
    .slice(0, 80);
}

function parseHeadingBlocks(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  const blocks: Array<{ heading: string; body: string }> = [];
  let current: { heading: string; body: string[] } | null = null;

  for (const line of lines) {
    if (/^#{2,3}\s+/.test(line)) {
      if (current) {
        blocks.push({ heading: current.heading, body: current.body.join("\n") });
      }
      current = { heading: line, body: [] };
    } else if (current) {
      current.body.push(line);
    }
  }

  if (current) {
    blocks.push({ heading: current.heading, body: current.body.join("\n") });
  }

  return blocks;
}

function nearestIndustry(markdown: string, heading: string) {
  const index = markdown.indexOf(heading);
  const before = markdown.slice(0, index).split(/\r?\n/).reverse();
  const industryHeading = before.find((line) => /^#{2}\s+/.test(line));

  return industryHeading?.replace(/^#{2}\s+/, "").trim();
}

function extractAfterLabel(text: string, label: string) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(
    new RegExp(`(?:\\*\\*)?${escaped}:(?:\\*\\*)?\\s*([^\\n]+)`, "i"),
  );

  return match?.[1]?.trim();
}

function extractInlineSection(text: string, label: string) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(
    new RegExp(`${escaped}:\\s*([\\s\\S]*?)(?=\\n[A-ZÁÉÍÓÚ][^\\n]{2,40}:|\\n\\d+\\.\\s|$)`, "i"),
  );

  return match?.[1]?.replace(/\s+/g, " ").trim();
}

function splitPatternTerms(pattern: string) {
  const quoted = Array.from(pattern.matchAll(/"([^"]+)"/g)).map(
    (match) => match[1] ?? "",
  );
  const terms = quoted.length > 0 ? quoted : pattern.split(/,| o | y |\/|;/i);

  return terms
    .map((term) => term.trim().toLowerCase())
    .filter((term) => term.length >= 3)
    .slice(0, 8);
}
