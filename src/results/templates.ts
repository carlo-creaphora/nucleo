export type ResultsClosedQuestion = {
  id: string;
  label: string;
  type: "choice";
  options: string[];
  evidenceRole: string;
};

export type ResultsTemplate = {
  routeId: string;
  closedQuestions: ResultsClosedQuestion[];
  openFields: string[];
};

const yesNoPartial = ["Sí", "No", "Parcial"];
const yesNoPartialNotApplicable = ["Sí", "No", "Parcial", "No aplica"];

export const resultsTemplates: ResultsTemplate[] = [
  {
    routeId: "service_storyboard",
    closedQuestions: [
      question("C1", "¿Reconoció el problema descrito en la Escena 1 como propio o familiar?", "Reconocimiento del problema"),
      question("C2", "¿Describió el costo o consecuencia del problema sin que se lo sugirieran?", "Costo reconocido"),
      question("C3", "¿Entendió qué hace la propuesta después de la Escena 3?", "Comprensión de propuesta"),
      question("C4", "¿Identificó qué parte le parece más útil?", "Utilidad percibida"),
      question("C5", "¿Expresó que el resultado de la Escena 4 sería valioso para él?", "Valor del resultado"),
      question("C6", "¿Aceptó el siguiente paso de la Escena 5?", "Siguiente paso"),
      question("C7", "¿Apareció objeción estructural no prevista?", "Objeción estructural"),
    ],
    openFields: [
      "Escena donde más reaccionó",
      "Frase textual más relevante de la sesión",
      "Parte de la propuesta que no quedó clara",
      "Objeción principal",
      "Condición que pidió para avanzar",
      "Ayuda que el moderador tuvo que dar fuera del protocolo",
    ],
  },
  {
    routeId: "service_wizard",
    closedQuestions: [
      question("C1", "¿Completó la secuencia de la simulación sin interrumpirla?", "Secuencia completada"),
      question("C2", "¿Percibió valor durante el Momento 2?", "Valor vivido"),
      question("C3", "¿Se trabó en el Momento 3?", "Fricción observada"),
      question("C4", "¿Aceptó el siguiente paso del Momento 4?", "Siguiente paso"),
      question("C5", "¿El equipo tuvo que compensar con esfuerzo extraordinario no previsto?", "Esfuerzo extraordinario"),
      question("C6", "¿Apareció objeción que el guión no cubría?", "Objeción no cubierta"),
      question("C7", "¿Identificó que el servicio era operado manualmente?", "Manualidad detectada"),
    ],
    openFields: [
      "Momento donde más valor percibió",
      "Momento donde más fricción hubo",
      "Frase textual más relevante",
      "Qué pidió que el equipo no tenía listo",
      "Objeción principal",
      "Esfuerzo extraordinario del equipo",
    ],
  },
  {
    routeId: "digital_clickable",
    closedQuestions: [
      question("C1", "¿Completó la tarea crítica sin ayuda del moderador?", "Tarea crítica"),
      question("C2", "¿Entendió para qué sirve la propuesta después de la sesión?", "Comprensión"),
      question("C3", "¿Se trabó en alguna pantalla específica?", "Pantalla de fricción"),
      question("C4", "¿Preguntó por precio, integración o siguiente paso?", "Interés de avance"),
      question("C5", "¿Identificó el valor diferencial con sus palabras?", "Valor diferencial"),
      question("C6", "¿Confiaría en esto para la tarea crítica del reto?", "Confianza"),
      question("C7", "¿Apareció confusión estructural en el flujo?", "Confusión estructural"),
    ],
    openFields: [
      "Pantalla donde se trabó más tiempo",
      "Frase textual más relevante",
      "Tarea que no pudo completar o completó con ayuda",
      "Funcionalidad que pidió que cambiaría la mecánica",
      "Ayuda que el moderador dio fuera del protocolo",
      "Objeción principal post-sesión",
    ],
  },
  {
    routeId: "digital_smoke",
    closedQuestions: [
      question("C1", "¿Visitó la landing?", "Visita"),
      question("C2", "¿Hizo clic en el CTA?", "CTA"),
      question("C3", "¿Completó el formulario o acción post-CTA?", "Acción post-CTA"),
      question("C4", "¿Respondió el follow-up?", "Follow-up"),
      question("C5", "¿Preguntó por precio, condiciones o siguiente paso en el follow-up?", "Interés comercial"),
      question("C6", "¿El perfil corresponde al comprador objetivo?", "Perfil correcto"),
      question("C7", "¿Compartió o refirió a alguien más?", "Referencia"),
    ],
    openFields: [
      "Canal de origen",
      "Respuesta textual del follow-up",
      "Objeción o pregunta principal",
      "Razón declarada de no avanzar",
      "Perfil real vs. perfil objetivo",
    ],
  },
  {
    routeId: "process_blueprint",
    closedQuestions: [
      question("C1", "¿Todos los pasos del proceso propuesto tienen un responsable claro?", "Responsables claros"),
      question("C2", "¿Apareció bloqueo por sistema, aprobación o dependencia no prevista?", "Bloqueo no previsto"),
      question("C3", "¿Los tiempos reales estimados son ejecutables sin carga extraordinaria?", "Tiempos ejecutables"),
      question("C4", "¿Algún rol dijo \"eso no es mi responsabilidad\"?", "Responsabilidad rechazada"),
      question("C5", "¿El equipo puede iniciar un piloto con este proceso en el ciclo actual?", "Piloto posible"),
      question("C6", "¿Apareció restricción cultural o política no declarada en el diagnóstico?", "Restricción oculta"),
      question("C7", "¿Los cambios propuestos generaron resistencia activa?", "Resistencia activa"),
    ],
    openFields: [
      "Paso con más fricción durante el walkthrough",
      "Bloqueo más relevante encontrado",
      "Frase textual más relevante del equipo",
      "Condición que el equipo puso para hacer el piloto",
      "Diferencia entre no podemos y no queremos",
      "Dependencia nueva que el blueprint no había previsto",
    ],
  },
  {
    routeId: "process_pilot",
    closedQuestions: [
      question("C1", "¿La métrica principal mejoró respecto a la línea base?", "Métrica principal"),
      question("C2", "¿El equipo ejecutó el proceso sin carga extraordinaria?", "Carga operativa"),
      question("C3", "¿Se activó la regla de salida?", "Regla de salida"),
      question("C4", "¿Apareció bloqueo de sistema o aprobación no previsto?", "Bloqueo no previsto"),
      question("C5", "¿Los casos del perímetro generaron reclamo o fricción adicional?", "Fricción adicional"),
      question("C6", "¿La métrica de riesgo se mantuvo estable?", "Métrica de riesgo"),
      question("C7", "¿El proceso puede sostenerse más allá del piloto sin ajuste mayor?", "Sostenibilidad"),
    ],
    openFields: [
      "Semana con más fricción",
      "Ajuste que el equipo hizo sobre la marcha",
      "Caso que se excluyó del piloto",
      "Esfuerzo extraordinario que no puede sostenerse",
      "Aprendizaje inesperado del piloto",
    ],
  },
  {
    routeId: "commercial_offer",
    closedQuestions: [
      question("C1", "¿El comprador leyó la ficha completa sin interrumpir?", "Lectura de ficha"),
      question("C2", "¿Reconoció el problema que describe la ficha como propio?", "Problema reconocido"),
      question("C3", "¿Preguntó por condiciones específicas: plazo, integración, soporte?", "Condiciones específicas"),
      question("C4", "¿Mencionó a otra persona que debe estar en la decisión?", "Aprobador"),
      question("C5", "¿Aceptó siguiente paso concreto con fecha?", "Siguiente paso"),
      question("C6", "¿Hizo contra-oferta o negoció precio?", "Negociación"),
      question("C7", "¿Dijo que ya tiene algo que hace lo mismo?", "Alternativa actual"),
    ],
    openFields: [
      "Primera reacción al ver la ficha",
      "Parte de la ficha que generó más preguntas",
      "Objeción principal",
      "Condición que puso para avanzar",
      "Perfil real del interlocutor",
      "Razón declarada de no avanzar",
    ],
  },
  {
    routeId: "commercial_concierge",
    closedQuestions: [
      question("C1", "¿El comprador hizo preguntas propias durante el descubrimiento?", "Preguntas propias"),
      question("C2", "¿Apareció el pagador o aprobador durante la conversación?", "Pagador o aprobador"),
      question("C3", "¿Aceptó siguiente paso con fecha concreta?", "Siguiente paso"),
      question("C4", "¿Hizo objeción de precio?", "Objeción de precio"),
      question("C5", "¿Mencionó a alguien más que debería estar en la conversación?", "Stakeholder adicional"),
      question("C6", "¿Apareció objeción estructural: contrato exclusivo, restricción legal, política interna?", "Objeción estructural"),
      question("C7", "¿Confirmó la reunión de seguimiento con 24h de anticipación?", "Confirmación posterior"),
    ],
    openFields: [
      "Momento donde más se activó en la conversación",
      "Frase textual más relevante",
      "Objeción principal y cómo se manejó",
      "Señal de interés real vs. cortesía",
      "Perfil real del interlocutor vs. perfil objetivo",
      "Razón por la que no hubo siguiente paso",
    ],
  },
  {
    routeId: "physical_visual",
    closedQuestions: [
      question("C1", "¿Describió el uso del objeto sin que se lo explicaran?", "Uso entendido"),
      question("C2", "¿El uso que imaginó corresponde al uso que resuelve el reto?", "Uso correcto"),
      question("C3", "¿Expresó confianza en el objeto al verlo?", "Confianza visual"),
      question("C4", "¿Apareció objeción física estructural: tamaño, material, compatibilidad?", "Objeción física"),
      question("C5", "¿Mencionó un contexto concreto de uso propio?", "Contexto propio"),
      question("C6", "¿Mencionó un rango de precio razonable?", "Precio imaginado"),
      question("C7", "¿Dijo que lo mostraría o recomendaría a alguien?", "Recomendación"),
    ],
    openFields: [
      "Primera reacción al ver la ficha o imagen",
      "Uso que imaginó con sus palabras",
      "Objeción física principal",
      "Parte del concepto que no entendió",
      "Cambio que propuso en diseño o función",
      "Condición para comprarlo",
    ],
  },
  {
    routeId: "physical_mockup",
    closedQuestions: [
      question("C1", "¿Completó la tarea asignada sin instrucciones adicionales?", "Tarea física"),
      question("C2", "¿Usó el objeto de la forma que el diseño intenta?", "Uso esperado"),
      question("C3", "¿Apareció riesgo de seguridad durante el uso?", "Seguridad"),
      question("C4", "¿Se trabó en algún punto específico de la manipulación?", "Fricción física"),
      question("C5", "¿Describió el valor del objeto después de usarlo?", "Valor post-uso"),
      question("C6", "¿Propuso cambio físico que invalida el concepto?", "Cambio invalidante"),
      question("C7", "¿Preguntó cuándo estaría disponible o a qué precio?", "Interés posterior"),
    ],
    openFields: [
      "Cómo tomó el objeto la primera vez",
      "Qué intentó hacer primero",
      "Punto exacto donde se trabó",
      "Frase textual más relevante post-uso",
      "Cambio menor que propuso",
      "Problema de construcción del mockup que generó fricción artificial",
    ],
  },
];

export function getResultsTemplate(routeId: string) {
  return resultsTemplates.find((template) => template.routeId === routeId) ?? null;
}

function question(id: string, label: string, evidenceRole: string): ResultsClosedQuestion {
  return {
    evidenceRole,
    id,
    label,
    options: label.includes("Apareció pagador") ? yesNoPartialNotApplicable : yesNoPartial,
    type: "choice",
  };
}
