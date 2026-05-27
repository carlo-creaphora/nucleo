import {
  BarChart3,
  BookOpenCheck,
  Brain,
  ClipboardCheck,
  ClipboardList,
  FlaskConical,
  Lightbulb,
  Radar,
  type LucideIcon,
} from "lucide-react";

export type PhaseId =
  | "registration"
  | "diagnosis"
  | "signals"
  | "ideation"
  | "evaluation"
  | "prototype"
  | "results"
  | "reading"
  | "playbook"
  | "memory";

export type Phase = {
  id: PhaseId;
  name: string;
  status: "Vista actual" | "Completada" | "Lista" | "Solo lectura";
  eyebrow: string;
  title: string;
  summary: string;
  icon: LucideIcon;
};

export const companyContext = {
  user: "Usuario",
  company: "Núcleo",
  cycle: "Ciclo activo",
  category: "Categoría por definir",
};

export const registrationPhase: Phase = {
  id: "registration",
  name: "Registro",
  status: "Lista",
  eyebrow: "Contexto base",
  title: "Registro real de perfil, empresa y categoría.",
  summary:
    "Esta información queda como contexto invisible para diagnóstico, señales e ideación.",
  icon: ClipboardList,
};

export const memoryPhase: Phase = {
  id: "memory",
  name: "Memoria de ciclos",
  status: "Solo lectura",
  eyebrow: "Memoria",
  title: "Aprendizaje de ciclo cerrado para la empresa.",
  summary:
    "Conserva decisión final, evidencia, supuestos no resueltos y patrones que no deben repetirse.",
  icon: BookOpenCheck,
};

export const sidebarPhases: Phase[] = [
  {
    id: "diagnosis",
    name: "Diagnóstico estratégico",
    status: "Completada",
    eyebrow: "Diagnóstico",
    title: "Reto real reinterpretado desde contexto y restricciones.",
    summary:
      "El problema central no es generar más demanda, sino reducir dependencia de ventas reactivas y convertir señales operativas en decisiones comerciales.",
    icon: Brain,
  },
  {
    id: "signals",
    name: "Lectura de señales",
    status: "Completada",
    eyebrow: "Señales",
    title: "Gaps e insights accionables para ideación.",
    summary:
      "La evidencia apunta a una brecha entre mantenimiento correctivo y prevención visible para administradores de edificios.",
    icon: Radar,
  },
  {
    id: "ideation",
    name: "Ideación disruptiva",
    status: "Completada",
    eyebrow: "Ideación",
    title: "Rutas de ruptura aplicadas a gaps e insights.",
    summary:
      "La idea ganadora transforma una conversación técnica en una mesa de decisión preventiva con evidencia comprensible.",
    icon: Lightbulb,
  },
  {
    id: "evaluation",
    name: "Evaluación de ideas",
    status: "Completada",
    eyebrow: "Evaluación",
    title: "Comparación manual con criterios visibles.",
    summary:
      "La plataforma ordena la decisión sin reemplazar el juicio del usuario: todas las ideas parten en cero y se califican explícitamente.",
    icon: ClipboardCheck,
  },
  {
    id: "prototype",
    name: "Prototipado rápido",
    status: "Completada",
    eyebrow: "Prototipado",
    title: "Artefacto elegido para testear comportamiento observable.",
    summary:
      "El prototipo no registra evidencia; define qué se va a observar, cómo leerlo y qué no puede validar.",
    icon: FlaskConical,
  },
  {
    id: "results",
    name: "Registro de resultados",
    status: "Completada",
    eyebrow: "Resultados",
    title: "Bitácora estructurada de respuestas cerradas y abiertas.",
    summary:
      "La plataforma no inventa evidencia. El usuario registra observaciones contra preguntas sugeridas por la matriz.",
    icon: ClipboardList,
  },
  {
    id: "reading",
    name: "Lectura de evidencia",
    status: "Completada",
    eyebrow: "Evidencia",
    title: "Lectura contra umbrales, alcance y riesgos de mala interpretación.",
    summary:
      "La recomendación distingue avance, iteración o replanteamiento sin convertir señales débiles en conclusiones fuertes.",
    icon: BarChart3,
  },
  {
    id: "playbook",
    name: "Playbook de acción",
    status: "Completada",
    eyebrow: "Playbook",
    title: "Plan ejecutivo solo porque la ruta final fue Avanzar.",
    summary:
      "Define qué se ejecuta, qué se mide, quién responde y cuándo se revisa. También deja claro qué no quedó validado.",
    icon: BookOpenCheck,
  },
];

export const phaseDetails: Record<PhaseId, string[]> = {
  registration: [
    "Perfil, empresa y categoría cargados como contexto invisible.",
    "No participa como fase visible del ciclo comercial.",
    "Sus datos alimentan diagnóstico, señales e ideación.",
  ],
  diagnosis: [
    "Reto recomendado: reducir dependencia de ventas reactivas.",
    "Tensión principal: promesa preventiva versus operación correctiva.",
    "Gap crítico: el comprador no ve riesgo hasta que aparece la falla.",
  ],
  signals: [
    "Gap 1: falta un lenguaje gerencial para priorizar mantenimiento.",
    "Gap 2: los reportes técnicos no se convierten en decisiones comerciales.",
    "Insight: el administrador compra tranquilidad operativa, no repuestos.",
  ],
  ideation: [
    "Ruta seleccionada: ruptura fuerte sobre la mecánica comercial.",
    "Idea: mesa preventiva de decisión para administradores.",
    "Métrica que mueve: conversión de correctivo a contrato recurrente.",
  ],
  evaluation: [
    "Idea ganadora única por mejor calificación manual.",
    "Supuesto crítico: el cliente actúa si el riesgo se vuelve visible.",
    "Qué probar primero: decisión explícita frente al artefacto.",
  ],
  prototype: [
    "Tipo de idea: servicio / experiencia.",
    "Artefacto: guion + tablero de priorización preventiva.",
    "No valida escalabilidad operativa ni margen unitario.",
  ],
  results: [
    "Muestra esperada: 3 a 5 conversaciones con administradores.",
    "Señal de avance: decisión explícita o solicitud de siguiente paso.",
    "Registro: preguntas cerradas y notas abiertas por caso.",
  ],
  reading: [
    "3 de 3 casos terminaron con decisión.",
    "Confianza moderada: muestra pequeña, señal conductual fuerte.",
    "Riesgo: sobreinterpretar interés como validación de modelo.",
  ],
  playbook: [
    "Decisión ejecutiva: avanzar con implementación controlada.",
    "Cadencia: revisión semanal durante los primeros 30 días.",
    "Condición de freno: señales débiles fuera del segmento probado.",
  ],
  memory: [
    "El ciclo queda cerrado y disponible como memoria de empresa.",
    "Aprendizajes reutilizables para nuevos ciclos.",
    "Solo lectura para licencias asociadas a la compañía.",
  ],
};

export const evidenceRows = [
  ["Evidencia observada", "Tipo de señal", "Lectura"],
  ["3 de 3 casos terminaron con decisión", "Comportamiento", "Fuerte"],
  ["La muestra sigue debajo del mínimo comercial", "Alcance", "Débil"],
  ["No valida escalabilidad operacional", "Riesgo", "Vigilar"],
];
