import type { DiagnosisInput, DiagnosisOutput } from "../contracts/diagnosis.js";

export const MAX_DIAGNOSIS_QUESTIONS = 15;

export const DIAGNOSIS_RULES = [
  "No aceptar la etiqueta inicial del usuario como diagnostico final.",
  "Tratar lo que dice el usuario como hipotesis de entrada, no como conclusion.",
  "Separar sintoma visible, lectura declarada, mecanismo causal probable y reto estrategico.",
  "Si falta evidencia, bajar confianza o preguntar; no inventar.",
  "Hacer preguntas adaptativas, no cuestionario fijo.",
  "No repetir preguntas ya respondidas.",
  "Si el usuario corrige algo, responder esa correccion antes de avanzar.",
  "El diagnostico debe producir una recomendacion experta, no una descripcion complaciente.",
  "El brief debe dejar lista la ideacion y bloquear ideas genericas.",
] as const;

export function countUserDiagnosisTurns(input: DiagnosisInput) {
  return input.dialogMessages.filter((message) => message.role === "user")
    .length;
}

export function buildDiagnosisSystemPrompt() {
  return [
    "Eres la skill de Diagnostico de Nucleo.",
    "Tu trabajo es encontrar el reto real de una empresa usando criterio experto.",
    "Trabajas en espanol claro, directo y ejecutivo.",
    "No propones ideas ni soluciones en Diagnostico.",
    "Reglas obligatorias:",
    ...DIAGNOSIS_RULES.map((rule) => `- ${rule}`),
  ].join("\n");
}

export function buildQuestionInstruction(input: DiagnosisInput) {
  const userTurns = countUserDiagnosisTurns(input);

  return {
    task: "Genera la siguiente pregunta de Diagnostico.",
    limit: {
      maxQuestions: MAX_DIAGNOSIS_QUESTIONS,
      questionsAlreadyAnswered: userTurns,
      remainingQuestions: Math.max(0, MAX_DIAGNOSIS_QUESTIONS - userTurns),
    },
    instruction:
      userTurns >= MAX_DIAGNOSIS_QUESTIONS
        ? "Ya se alcanzo el maximo de preguntas. No hagas otra pregunta salvo que sea indispensable; marca shouldCloseDiagnosis=true."
        : "Haz una sola pregunta adaptativa que nazca de lo ya respondido y ataque el punto mas incierto del diagnostico.",
    input,
  };
}

export function buildCompletionInstruction(input: DiagnosisInput) {
  return {
    task: "Cierra el Diagnostico.",
    instruction:
      "Reinterpreta lo que declara el perfil. Entrega el reto real, no lo que el usuario cree que es el problema. Si hay incertidumbre, dejala reflejada en causas, tensiones, restricciones o supuesto a cuestionar.",
    outputContract: [
      "recommendedChallenge",
      "whyThisChallenge",
      "symptoms",
      "causes",
      "tensions",
      "metrics",
      "restrictions",
      "notWorthAttackingYet",
      "assumptionToQuestion",
      "ideationBrief",
    ],
    input,
  };
}

export function buildReinterpretInstruction(
  input: DiagnosisInput,
  previousDiagnosis: DiagnosisOutput,
) {
  return {
    task: "Reinterpreta el Diagnostico despues de una correccion del usuario.",
    instruction:
      "Responde la correccion antes de avanzar. Recompone el diagnostico completo, cambiando solo lo que la aclaracion afecte.",
    previousDiagnosis,
    corrections: input.correctedSections,
    input,
  };
}

