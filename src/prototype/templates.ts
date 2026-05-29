export type PrototypeTemplate = {
  routeId: string;
  requiredPieces: string[];
  guidance: string;
};

export const prototypeTemplates = [
  {
    routeId: "service_storyboard",
    requiredPieces: [
      "Nombre del artefacto",
      "Que valida y que no valida",
      "5 escenas",
      "Preguntas post-escena",
      "Preguntas de cierre",
      "Senales de avance y freno",
      "Falso positivo y falso negativo",
      "Alcance de evidencia",
      "Siguiente paso",
    ],
    guidance:
      "Construye un storyboard de experiencia con 5 escenas: problema, punto de quiebre, propuesta, resultado y siguiente paso. Cada escena debe tener 3-4 oraciones y preguntas especificas. La escena 3 debe mostrar la mecanica concreta sin frases como solucion integral, plataforma robusta o herramienta innovadora.",
  },
  {
    routeId: "service_wizard",
    requiredPieces: [
      "Nombre del artefacto",
      "Que valida y que no valida",
      "Configuracion de simulacion",
      "Roles del equipo",
      "Secuencia de 4 momentos",
      "Preguntas post-simulacion",
      "Senales de avance y freno",
      "Falso positivo y falso negativo",
      "Alcance de evidencia",
      "Siguiente paso",
    ],
    guidance:
      "Construye un guion de simulacion de servicio operado manualmente. Debe incluir activacion, entrega de valor central, friccion o duda, cierre y siguiente paso. Diferencia lo que ve el cliente de lo que opera el equipo detras de escena.",
  },
  {
    routeId: "digital_clickable",
    requiredPieces: [
      "Nombre del artefacto",
      "Que valida y que no valida",
      "Brief de construccion",
      "Tarea critica",
      "Pantallas minimas",
      "Protocolo de sesion",
      "Preguntas post-sesion",
      "Senales de avance y freno",
      "Falso positivo y falso negativo",
      "Alcance de evidencia",
      "Siguiente paso",
    ],
    guidance:
      "Construye un brief de prototipo clickable moderado. Debe definir herramienta sugerida, formato, numero de pantallas, contenido por pantalla, tarea critica observable, instruccion exacta para el tester y preguntas post-sesion.",
  },
  {
    routeId: "digital_smoke",
    requiredPieces: [
      "Nombre del artefacto",
      "Que valida y que no valida",
      "Brief de landing",
      "Headline y subheadline",
      "Seccion de valor",
      "CTA especifico",
      "Flujo posterior al CTA",
      "Distribucion y alcance",
      "Metricas",
      "Senales de avance y freno",
      "Falso positivo y falso negativo",
      "Alcance de evidencia",
      "Siguiente paso",
    ],
    guidance:
      "Construye un landing brief mas protocolo de CTA. El CTA debe ser especifico y de bajo compromiso, nunca Saber mas ni Contactanos. Define canal, audiencia, volumen, duracion y metricas de conversion.",
  },
  {
    routeId: "process_blueprint",
    requiredPieces: [
      "Nombre del artefacto",
      "Que valida y que no valida",
      "Proceso actual",
      "Cuellos de botella",
      "Proceso propuesto",
      "Dependencias nuevas",
      "Condiciones de funcionamiento",
      "Sesion de walkthrough",
      "Senales de avance y freno",
      "Falso positivo y falso negativo",
      "Alcance de evidencia",
      "Siguiente paso",
    ],
    guidance:
      "Construye un blueprint antes/despues. Debe mostrar pasos, roles, tiempos estimados, puntos de falla, cambios contra el proceso actual, dependencias y preguntas para una sesion de walkthrough con quienes ejecutan el proceso.",
  },
  {
    routeId: "process_pilot",
    requiredPieces: [
      "Nombre del artefacto",
      "Que valida y que no valida",
      "Definicion del piloto",
      "Perimetro",
      "Criterios de inclusion y exclusion",
      "Regla de salida",
      "Metricas",
      "Bitacora semanal",
      "Senales de avance y freno",
      "Falso positivo y falso negativo",
      "Alcance de evidencia",
      "Siguiente paso",
    ],
    guidance:
      "Construye un plan de piloto con bitacora. Debe definir perimetro seguro, duracion, equipo, casos que entran y salen, regla de salida, metricas con linea base y umbrales, y formato de bitacora para registrar hechos observados.",
  },
  {
    routeId: "commercial_offer",
    requiredPieces: [
      "Nombre del artefacto",
      "Que valida y que no valida",
      "Ficha de oferta",
      "Para quien es",
      "Que resuelve",
      "Incluye y no incluye",
      "Precio",
      "Garantia o condicion de entrada",
      "Accion para empezar",
      "Protocolo de presentacion",
      "Preguntas de conversacion",
      "Senales de avance y freno",
      "Falso positivo y falso negativo",
      "Alcance de evidencia",
      "Siguiente paso",
    ],
    guidance:
      "Construye una ficha de oferta legible en 60 segundos para compradores reales. Debe incluir paquete, precio, garantia o condicion de entrada, accion unica para empezar y protocolo para que el vendedor observe objeciones y siguiente paso.",
  },
  {
    routeId: "commercial_concierge",
    requiredPieces: [
      "Nombre del artefacto",
      "Que valida y que no valida",
      "Perfil del comprador objetivo",
      "Senal de urgencia",
      "Objecion esperada",
      "Guion de apertura",
      "Preguntas de descubrimiento",
      "Presentacion de propuesta",
      "Manejo de objecion",
      "Cierre con fecha",
      "Senales de avance y freno",
      "Falso positivo y falso negativo",
      "Alcance de evidencia",
      "Siguiente paso",
    ],
    guidance:
      "Construye un guion de venta y simulacion comercial. Debe vender antes de construir, revelar urgencia, pagador real y avance comercial observable. El cierre debe pedir siguiente paso con fecha concreta.",
  },
  {
    routeId: "physical_visual",
    requiredPieces: [
      "Nombre del artefacto",
      "Que valida y que no valida",
      "Ficha visual",
      "Imagen o boceto descrito",
      "Uso en una oracion",
      "Especificaciones visibles",
      "Contexto de uso",
      "Protocolo de sesion",
      "Preguntas de sesion",
      "Senales de avance y freno",
      "Falso positivo y falso negativo",
      "Alcance de evidencia",
      "Siguiente paso",
    ],
    guidance:
      "Construye una ficha visual de concepto. Si no hay imagen real, describe tamano, forma, color, materiales aparentes, interaccion principal y contexto. La prueba debe separar gusto estetico de uso esperado.",
  },
  {
    routeId: "physical_mockup",
    requiredPieces: [
      "Nombre del artefacto",
      "Que valida y que no valida",
      "Brief del mockup",
      "Materiales",
      "Dimensiones",
      "Partes reales y simuladas",
      "Elementos excluidos",
      "Protocolo de uso",
      "Observaciones a registrar",
      "Preguntas post-uso",
      "Senales de avance y freno",
      "Falso positivo y falso negativo",
      "Alcance de evidencia",
      "Siguiente paso",
    ],
    guidance:
      "Construye un brief de mockup manipulable minimo. Debe explicar que se construye, con que materiales, que partes deben funcionar, que partes se simulan y que tarea fisica hara el tester sin instrucciones adicionales.",
  },
] as const satisfies readonly PrototypeTemplate[];

export function renderPrototypeTemplatesForPrompt() {
  return prototypeTemplates
    .map((template) =>
      [
        `Ruta: ${template.routeId}`,
        `Piezas obligatorias: ${template.requiredPieces.join("; ")}.`,
        `Guia: ${template.guidance}`,
      ].join("\n"),
    )
    .join("\n\n");
}
