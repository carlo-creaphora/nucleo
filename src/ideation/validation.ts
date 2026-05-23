import type {
  IdeationGenerationInput,
  IdeationOutput,
} from "../contracts/ideation.js";

export type IdeationContractViolation = {
  type:
    | "ANTI_PATTERN"
    | "ROUTE_MISMATCH"
    | "MISSING_VISIBLE_STRUCTURE";
  ideaId?: string;
  message: string;
  source?: string;
};

const UNIVERSAL_ANTI_PATTERN_REGEXES = [
  /\b(app|aplicaci[oó]n)\b.*\b(conecta|conectar|gestiona|centraliza)\b/i,
  /\b(plataforma)\b.*\b(para|de)\b/i,
  /\b(usar|utilizar|implementar)\s+ia\b/i,
  /\b(agente|chatbot)\b.*\bia\b/i,
  /\b(gamificaci[oó]n|puntos|badges|leaderboard|ranking)\b/i,
  /\b(comunidad|marketplace)\b/i,
  /\b(webinar|workshop|taller|evento)\b/i,
  /\b(newsletter|podcast|linkedin|contenido)\b/i,
  /\b(alianza estrat[eé]gica)\b(?!.*\bprimer experimento\b)/i,
  /\b(transformaci[oó]n digital)\b/i,
  /\b(dashboard|tablero)\b(?!.*\bdecisi[oó]n obligatoria\b)/i,
  /\b(capacitaci[oó]n|certificaci[oó]n|manual)\b(?!.*\bobjeto|interfaz|campo|decisi[oó]n\b)/i,
];

export function validateIdeationOutput(
  input: IdeationGenerationInput,
  output: IdeationOutput,
): IdeationContractViolation[] {
  return [
    ...validateVisibleStructure(output),
    ...validateAntiPatterns(input, output),
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

function validateAntiPatterns(
  input: IdeationGenerationInput,
  output: IdeationOutput,
) {
  const violations: IdeationContractViolation[] = [];

  for (const idea of output.ideas) {
    const text = ideaText(idea);

    for (const regex of UNIVERSAL_ANTI_PATTERN_REGEXES) {
      if (regex.test(text)) {
        violations.push({
          type: "ANTI_PATTERN",
          ideaId: idea.id,
          message:
            "La idea coincide con un anti-patron universal de ideacion generica.",
          source: regex.source,
        });
      }
    }

    for (const antiPattern of input.knowledgePack.antiPatterns) {
      const matchedTerm = antiPattern.forbiddenIdeaPatterns.find((term) =>
        includesNormalized(text, term),
      );

      if (matchedTerm) {
        violations.push({
          type: "ANTI_PATTERN",
          ideaId: idea.id,
          message: `La idea coincide con el anti-patron "${antiPattern.title}".`,
          source: matchedTerm,
        });
      }
    }
  }

  return dedupeViolations(violations);
}

function validateRouteFit(
  input: IdeationGenerationInput,
  output: IdeationOutput,
) {
  const violations: IdeationContractViolation[] = [];
  const ruptureType = input.selection.ruptureType;

  for (const idea of output.ideas) {
    const text = ideaText(idea);

    if (
      ruptureType === "RUPTURA_MODERADA" &&
      /\b(quien paga|qui[eé]n paga|modelo de negocio|suscripci[oó]n|cobro|cobra|pago por|tercero paga|marketplace|distribuci[oó]n nueva)\b/i.test(
        text,
      )
    ) {
      violations.push({
        type: "ROUTE_MISMATCH",
        ideaId: idea.id,
        message:
          "Ruptura moderada debe mejorar lo existente sin cambiar cobro, pagador, distribucion ni modelo de negocio.",
      });
    }

    if (
      ruptureType === "RUPTURA_FUERTE" &&
      !/\b(cobra|cobro|paga|pagador|entrega|accede|acceso|canal|modelo|precio|suscripci[oó]n|distribuci[oó]n|quien paga|qui[eé]n paga)\b/i.test(
        text,
      )
    ) {
      violations.push({
        type: "ROUTE_MISMATCH",
        ideaId: idea.id,
        message:
          "Ruptura fuerte debe transformar una pieza del modelo: cobro, pagador, entrega, acceso, canal, precio o distribucion.",
      });
    }

    if (
      ruptureType === "RUPTURA_RADICAL_CONTROLADA" &&
      !/\b(supuesto|creencia|industria|categoria|categor[ií]a|todo el mundo|se asume|se da por obvio|no es cierto)\b/i.test(
        idea.supuestoQueRompe,
      )
    ) {
      violations.push({
        type: "ROUTE_MISMATCH",
        ideaId: idea.id,
        message:
          "Ruptura radical controlada debe romper una creencia industrial explicita, no solo mejorar o transformar.",
      });
    }
  }

  return violations;
}

function ideaText(idea: IdeationOutput["ideas"][number]) {
  return [
    idea.idea,
    idea.supuestoQueRompe,
    idea.mecanicaConcreta,
    idea.porQueFunciona,
    idea.casoAnalogo,
    idea.metricaQueMueve,
    idea.primerPasoEjecutable,
  ].join("\n");
}

function includesNormalized(text: string, term: string) {
  const normalizedTerm = normalize(term);

  if (normalizedTerm.length < 4) {
    return false;
  }

  return normalize(text).includes(normalizedTerm);
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
