import {
  type IdeationIdea,
  type PrototypeClassification,
  type PrototypeIdeaType,
} from "../../app-state.js";

const AVAILABLE_IDEA_TYPES: PrototypeIdeaType[] = [
  "Servicio / experiencia",
  "Producto digital / interfaz",
  "Proceso / operación",
  "Modelo comercial / acceso",
  "Producto físico / tangible",
];

export async function classifyPrototypeIdea({
  diagnosis,
  idea,
  signals,
}: {
  diagnosis: unknown;
  idea: IdeationIdea;
  signals: unknown;
}) {
  const response = await fetch("/api/prototype/classify", {
    body: JSON.stringify({
      availableIdeaTypes: AVAILABLE_IDEA_TYPES,
      diagnosis,
      idea,
      signals,
    }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });

  const data = (await response.json().catch(() => null)) as {
    classification?: PrototypeClassification;
    message?: string;
  } | null;

  if (!response.ok || !data?.classification) {
    throw new Error(
      data?.message ?? "No se pudo clasificar la idea para prototipado.",
    );
  }

  return data.classification;
}

export async function savePrototypeClassification({
  classification,
  cycleId,
  ideaId,
}: {
  classification: PrototypeClassification;
  cycleId: string;
  ideaId: string;
}) {
  const response = await fetch(
    `/api/prototype/cycles/${encodeURIComponent(cycleId)}`,
    {
      body: JSON.stringify({
        prototypeBuilderValues: {},
        prototypeClassification: {
          ...classification,
          ideaId,
        },
        prototypeIdeaType: classification.ideaType,
        prototypeRouteId: null,
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    },
  );

  const data = (await response.json().catch(() => null)) as {
    message?: string;
  } | null;

  if (!response.ok) {
    throw new Error(
      data?.message ?? "No se pudo guardar la clasificación de prototipado.",
    );
  }
}
