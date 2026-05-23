import type {
  IdeationGenerationInput,
  IdeationOutput,
} from "../contracts/ideation.js";

export type IdeationContractViolation = {
  type:
    | "ROUTE_MISMATCH"
    | "CASE_TRACE_MISMATCH"
    | "MISSING_VISIBLE_STRUCTURE";
  ideaId?: string;
  message: string;
  source?: string;
};

export function validateIdeationOutput(
  input: IdeationGenerationInput,
  output: IdeationOutput,
): IdeationContractViolation[] {
  return [
    ...validateVisibleStructure(output),
    ...validateCaseTrace(output),
    ...validateRouteFit(input, output),
  ];
}

function validateVisibleStructure(output: IdeationOutput) {
  const violations: IdeationContractViolation[] = [];

  for (const [index, idea] of output.ideas.entries()) {
    if (!new RegExp(`^Idea ${index + 1}\\.`).test(idea.idea)) {
      violations.push({
        type: "MISSING_VISIBLE_STRUCTURE",
        ideaId: idea.id,
        message:
          "El campo idea debe empezar con 'Idea N.' y actuar como primer bloque visible.",
      });
    }
  }

  return violations;
}

function validateCaseTrace(output: IdeationOutput) {
  const violations: IdeationContractViolation[] = [];
  const references = output.internal.caseScreening.translatedCaseReferences;
  const referenceNames = new Set(references.map((reference) => normalize(reference.caseName)));

  for (const idea of output.ideas) {
    if (!referenceNames.has(normalize(idea.trace.disruptiveCaseName))) {
      violations.push({
        type: "CASE_TRACE_MISMATCH",
        ideaId: idea.id,
        message:
          "La idea debe trazarse a uno de los casos seleccionados en el scouting previo.",
        source: idea.trace.disruptiveCaseName,
      });
    }
  }

  return dedupeViolations(violations);
}

function validateRouteFit(
  input: IdeationGenerationInput,
  output: IdeationOutput,
) {
  const violations: IdeationContractViolation[] = [];

  if (output.route.ruptureType !== input.selection.ruptureType) {
    violations.push({
      type: "ROUTE_MISMATCH",
      message:
        "La ruta generada debe conservar el tipo de ruptura seleccionado por el usuario.",
      source: output.route.ruptureType,
    });
  }

  if (!output.route.usesGapTitles.includes(input.selection.gapTitle)) {
    violations.push({
      type: "ROUTE_MISMATCH",
      message: "La ruta generada debe usar el gap seleccionado por el usuario.",
      source: input.selection.gapTitle,
    });
  }

  if (!output.route.usesInsightTitles.includes(input.selection.insightTitle)) {
    violations.push({
      type: "ROUTE_MISMATCH",
      message:
        "La ruta generada debe usar el insight seleccionado por el usuario.",
      source: input.selection.insightTitle,
    });
  }

  for (const idea of output.ideas) {
    if (!idea.trace.gapTitles.includes(input.selection.gapTitle)) {
      violations.push({
        type: "ROUTE_MISMATCH",
        ideaId: idea.id,
        message: "Cada idea debe trazarse al gap seleccionado.",
        source: input.selection.gapTitle,
      });
    }

    if (!idea.trace.insightTitles.includes(input.selection.insightTitle)) {
      violations.push({
        type: "ROUTE_MISMATCH",
        ideaId: idea.id,
        message: "Cada idea debe trazarse al insight seleccionado.",
        source: input.selection.insightTitle,
      });
    }
  }

  return violations;
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function dedupeViolations(violations: IdeationContractViolation[]) {
  const seen = new Set<string>();

  return violations.filter((violation) => {
    const key = [
      violation.type,
      violation.ideaId,
      violation.message,
      violation.source,
    ].join("|");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
