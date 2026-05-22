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
  "No darle la razon al usuario por defecto; contrastar su lectura con la evidencia disponible.",
  "No usar tono optimista, alentador ni motivacional. No decir que el usuario va bien ni validar el avance.",
  "Entregar verdades incomodas que el perfil puede saber pero no estar asumiendo.",
  "Tener criterio propio: reinterpretar el reto segun evidencias, tensiones y omisiones, aunque contradiga la lectura declarada.",
  "El brief debe dejar lista la ideacion y bloquear ideas genericas.",
] as const;

export const DIAGNOSIS_RESPONSE_STYLE = [
  "Mantener los mismos campos del contrato; no agregar secciones nuevas.",
  "Responder breve y con filo: cada campo debe ser util, no explicativo por relleno.",
  "Evitar frases de cortesia, entusiasmo, tranquilidad o aprobacion.",
  "Usar lenguaje directo: sintoma, mecanismo, tension, restriccion y decision.",
  "Si el usuario nombra una causa amplia como cultura, ventas, comunicacion o liderazgo, tratarla como etiqueta provisional hasta probar el mecanismo real.",
] as const;

export const DIAGNOSIS_QUESTION_COMPLEMENTS = [
  "intentos previos",
  "tensiones internas",
  "decision trabada",
  "cambio esperado",
] as const;

export const DIAGNOSIS_CLOSE_RULES = [
  "Maximo 15 preguntas.",
  "Cerrar despues de suficiente contexto.",
  "Detectar si faltan piezas criticas antes de cerrar.",
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
    "Estilo obligatorio de respuesta:",
    ...DIAGNOSIS_RESPONSE_STYLE.map((rule) => `- ${rule}`),
    "Reglas de cierre:",
    ...DIAGNOSIS_CLOSE_RULES.map((rule) => `- ${rule}`),
    "Complementos para orientar preguntas, sin convertirlos en cuestionario fijo:",
    ...DIAGNOSIS_QUESTION_COMPLEMENTS.map((item) => `- ${item}`),
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
        ? "Ya se alcanzo el maximo de preguntas. No hagas otra pregunta; marca shouldCloseDiagnosis=true y senala que piezas criticas faltan si aplica."
        : "Haz una sola pregunta adaptativa que nazca de lo ya respondido y ataque el punto mas incierto del diagnostico. Usa los complementos solo si ayudan a completar contexto critico.",
    questionComplements: DIAGNOSIS_QUESTION_COMPLEMENTS,
    closeRules: DIAGNOSIS_CLOSE_RULES,
    input,
  };
}

export function buildCompletionInstruction(input: DiagnosisInput) {
  return {
    task: "Cierra el Diagnostico.",
    instruction:
      "Reinterpreta lo que declara el perfil. Entrega el reto real, no lo que el usuario cree que es el problema. No confirmes su lectura por complacencia. Si hay incertidumbre, dejala reflejada en causas, tensiones, restricciones o supuesto a cuestionar. Mantente breve, criterioso y directo.",
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
      "Responde la correccion antes de avanzar. Recompone el diagnostico completo, cambiando solo lo que la aclaracion afecte. No le des la razon al usuario por defecto; usa la correccion como nueva evidencia, no como conclusion. Mantente breve y directo.",
    previousDiagnosis,
    corrections: input.correctedSections,
    input,
  };
}
