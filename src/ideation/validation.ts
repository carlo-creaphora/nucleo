import type {
  IdeationGenerationInput,
  IdeationOutput,
} from "../contracts/ideation.js";

export type IdeationContractViolation = {
  type:
    | "ROUTE_MISMATCH"
    | "CASE_TRACE_MISMATCH"
    | "MISSING_VISIBLE_STRUCTURE"
    | "GENERIC_MECHANISM"
    | "DECORATIVE_CASE";
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
    ...validateMechanismQuality(output),
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

function validateMechanismQuality(output: IdeationOutput) {
  const violations: IdeationContractViolation[] = [];

  for (const idea of output.ideas) {
    const visibleText = normalizeText([
      idea.idea,
      idea.mecanicaConcreta,
      idea.porQueFunciona,
    ].join(" "));
    const mechanismText = normalizeText(idea.mecanicaConcreta);
    const caseText = normalizeText(idea.casoAnalogo);

    if (isGenericStructureIdea(visibleText, mechanismText)) {
      violations.push({
        type: "GENERIC_MECHANISM",
        ideaId: idea.id,
        message:
          "La idea no puede ser solo crear un sistema, proceso, programa o metodologia; debe cambiar una regla, incentivo, ritual, objeto, acceso, riesgo o decision observable.",
        source: idea.idea,
      });
    }

    if (!hasConcreteMechanismAnchor(mechanismText)) {
      violations.push({
        type: "GENERIC_MECHANISM",
        ideaId: idea.id,
        message:
          "La mecanica concreta debe incluir actor, objeto/ritual/interaccion, regla de uso y momento; no basta describir un proceso ordenado.",
        source: idea.mecanicaConcreta,
      });
    }

    if (!hasTransferredCaseMechanism(caseText)) {
      violations.push({
        type: "DECORATIVE_CASE",
        ideaId: idea.id,
        message:
          "El caso analogo debe declarar el mecanismo transferido; no puede funcionar como referencia decorativa.",
        source: idea.casoAnalogo,
      });
    }
  }

  return dedupeViolations(violations);
}

function isGenericStructureIdea(visibleText: string, mechanismText: string) {
  const hasGenericBuildVerb =
    /\b(cre(ar|a|ando)?|dise(n|ñ)ar|implementar|desarrollar|construir|formalizar|estructurar)\b/.test(
      visibleText,
    );
  const hasGenericObject =
    /\b(sistema|proceso|programa|metodologia|metodolog(i|í)a|plan|estructura|modelo comercial|seguimiento|capacitacion|capacitaci(o|ó)n)\b/.test(
      visibleText,
    );
  const hasGenericMechanismLanguage =
    /\b(claro|documentado|estructurado|responsabilidades definidas|herramientas|metodolog(i|í)as|paso a paso|generaci(o|ó)n de oportunidades|cierre y seguimiento)\b/.test(
      mechanismText,
    );

  return (
    hasGenericBuildVerb &&
    hasGenericObject &&
    hasGenericMechanismLanguage &&
    !hasConcreteMechanismAnchor(mechanismText)
  );
}

function hasConcreteMechanismAnchor(value: string) {
  const hasRuleOrCondition =
    /\b(regla|ritual|objeto|interacci(o|ó)n|contrato|garant(i|í)a|alerta|umbral|condici(o|ó)n|condicionar|solo si|si .{1,80} entonces|obligatorio|debe|no puede|devuelve|reembolsa|bono|paga|cobra|tarifa|precio|porcentaje|%)\b/.test(
      value,
    );
  const hasMomentOrCadence =
    /\b(antes de|antes del|despu(e|é)s de|despu(e|é)s del|durante|cada|semanal|mensual|quincenal|diario|al cerrar|al iniciar|en la primera|en [0-9]+ (d(i|í)as|semanas|meses))\b/.test(
      value,
    );
  const hasActor =
    /\b(cliente|comprador|usuario|equipo|responsable|proveedor|vendedor|director|lider|l(i|í)der|comit(e|é)|decisor|empresa|persona)\b/.test(
      value,
    );

  return hasRuleOrCondition && hasMomentOrCadence && hasActor;
}

function hasTransferredCaseMechanism(value: string) {
  return (
    /\bmecanismo\b/.test(value) &&
    /\b(similitud|similar|se parece|transferido|transferencia)\b/.test(value) &&
    /\b(diferencia|difiere|se separa|distinto)\b/.test(value)
  );
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
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
