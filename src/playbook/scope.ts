export type PlaybookEvidenceConfidence = "Alta" | "Media" | "Baja";

export type PlaybookScopeCeiling = {
  routeId: string;
  ceilingByConfidence: Record<PlaybookEvidenceConfidence, string>;
};

export const playbookScopeCeilings: PlaybookScopeCeiling[] = [
  {
    routeId: "service_storyboard",
    ceilingByConfidence: {
      Alta: "Piloto con muestra ampliada del servicio.",
      Media: "Repetir con perfil más representativo antes de pilotar.",
      Baja: "Una sesión adicional con perfil correcto; no pilotar aún.",
    },
  },
  {
    routeId: "service_wizard",
    ceilingByConfidence: {
      Alta: "Piloto operativo en perímetro controlado.",
      Media: "Piloto reducido con 1-2 cuentas antes de ampliar.",
      Baja: "Repetir simulación con ajuste de guion.",
    },
  },
  {
    routeId: "digital_clickable",
    ceilingByConfidence: {
      Alta: "Desarrollar versión funcional mínima.",
      Media: "Iterar prototipo en pantalla específica con fricción.",
      Baja: "Rediseñar flujo antes de cualquier desarrollo.",
    },
  },
  {
    routeId: "digital_smoke",
    ceilingByConfidence: {
      Alta: "Campaña de adquisición controlada.",
      Media: "Segunda landing con propuesta ajustada.",
      Baja: "Revisar headline y CTA antes de nueva distribución.",
    },
  },
  {
    routeId: "process_blueprint",
    ceilingByConfidence: {
      Alta: "Piloto controlado con equipo real.",
      Media: "Walkthrough con roles faltantes antes del piloto.",
      Baja: "Completar dependencias antes de cualquier cambio.",
    },
  },
  {
    routeId: "process_pilot",
    ceilingByConfidence: {
      Alta: "Expansión a perímetro mayor o consolidación.",
      Media: "Extensión del piloto con métrica adicional.",
      Baja: "Mantener perímetro actual y ajustar proceso.",
    },
  },
  {
    routeId: "commercial_offer",
    ceilingByConfidence: {
      Alta: "Proceso comercial formal con pipeline definido.",
      Media: "Ficha ajustada con 3-5 conversaciones adicionales.",
      Baja: "Revisar precio o entregables antes de más conversaciones.",
    },
  },
  {
    routeId: "commercial_concierge",
    ceilingByConfidence: {
      Alta: "Pipeline comercial activo con seguimiento.",
      Media: "5 conversaciones adicionales con perfil ajustado.",
      Baja: "Revisar guion de descubrimiento o perfil objetivo.",
    },
  },
  {
    routeId: "physical_visual",
    ceilingByConfidence: {
      Alta: "Construir mockup para prueba manipulable.",
      Media: "Segunda ronda visual con imagen o descripción ajustada.",
      Baja: "Rediseñar ficha antes de cualquier construcción.",
    },
  },
  {
    routeId: "physical_mockup",
    ceilingByConfidence: {
      Alta: "Versión funcional con materiales reales.",
      Media: "Mockup ajustado en punto de fricción específico.",
      Baja: "Reconstruir mockup corrigiendo problema de construcción.",
    },
  },
];

export function renderPlaybookScopeCeilingsForPrompt() {
  return playbookScopeCeilings
    .map((ceiling) => {
      const { Alta, Media, Baja } = ceiling.ceilingByConfidence;
      return [
        `Ruta: ${ceiling.routeId}`,
        `- Alta: ${Alta}`,
        `- Media: ${Media}`,
        `- Baja: ${Baja}`,
      ].join("\n");
    })
    .join("\n\n");
}
