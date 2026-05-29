import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import {
  type PrototypeArtifact,
  type PrototypeBuildInput,
  type PrototypeClassification,
  type PrototypeClassifyInput,
  prototypeArtifactSchema,
  prototypeClassificationSchema,
} from "../contracts/prototype.js";
import { renderPrototypeTemplatesForPrompt } from "./templates.js";

export type PrototypeEngine = {
  build(input: PrototypeBuildInput): Promise<PrototypeArtifact>;
  classify(input: PrototypeClassifyInput): Promise<PrototypeClassification>;
};

export class OpenAiPrototypeEngine implements PrototypeEngine {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor({
    apiKey,
    model = "gpt-4.1-mini",
  }: {
    apiKey: string;
    model?: string;
  }) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async build(input: PrototypeBuildInput): Promise<PrototypeArtifact> {
    const completion = await this.client.beta.chat.completions.parse({
      model: this.model,
      temperature: 0.25,
      messages: [
        {
          role: "system",
          content: buildPrototypeSystemPrompt(),
        },
        {
          role: "user",
          content: JSON.stringify(input, null, 2),
        },
      ],
      response_format: zodResponseFormat(
        prototypeArtifactSchema,
        "prototype_artifact",
      ),
    });

    const parsed = completion.choices[0]?.message.parsed;

    if (!parsed) {
      throw new Error("Prototipado no devolvio un artefacto estructurado.");
    }

    return parsed;
  }

  async classify(input: PrototypeClassifyInput): Promise<PrototypeClassification> {
    const completion = await this.client.beta.chat.completions.parse({
      model: this.model,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: buildPrototypeClassificationSystemPrompt(),
        },
        {
          role: "user",
          content: JSON.stringify(input, null, 2),
        },
      ],
      response_format: zodResponseFormat(
        prototypeClassificationSchema,
        "prototype_classification",
      ),
    });

    const parsed = completion.choices[0]?.message.parsed;

    if (!parsed) {
      throw new Error("Prototipado no pudo clasificar el tipo de idea.");
    }

    return parsed;
  }
}

class MissingOpenAiPrototypeEngine implements PrototypeEngine {
  async build(): Promise<PrototypeArtifact> {
    throw new Error(
      "OPENAI_API_KEY es requerido para Prototipado; no se generan artefactos sin IA.",
    );
  }

  async classify(): Promise<PrototypeClassification> {
    throw new Error(
      "OPENAI_API_KEY es requerido para clasificar el tipo de idea en Prototipado.",
    );
  }
}

export function createPrototypeEngine() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return new MissingOpenAiPrototypeEngine();
  }

  return new OpenAiPrototypeEngine({
    apiKey,
    model:
      process.env.OPENAI_PROTOTYPE_MODEL?.trim() ||
      process.env.OPENAI_MODEL?.trim() ||
      "gpt-4.1-mini",
  });
}

function buildPrototypeClassificationSystemPrompt() {
  return [
    "Eres el facilitador de Evaluacion de Nucleo cuando el usuario ya asigno puntajes y la idea ganadora ya fue determinada.",
    "Tu funcion es clasificar el tipo de prototipo y producir la decision de evaluacion. No puntuas ideas, no pides confirmacion y no generas el artefacto.",
    "",
    "PRINCIPIO",
    "La clasificacion se basa en una sola pregunta: que es lo mas incierto de esta idea y como se prueba ese tipo de incertidumbre.",
    "No clasifiques por canal superficial ni por el formato aparente de la solucion. Clasifica por el aprendizaje critico que debe obtenerse primero.",
    "",
    "TIPOS DISPONIBLES",
    "- Servicio / experiencia: usalo cuando lo critico sea validar recorrido, interaccion, confianza, valor percibido o continuidad del servicio. No lo uses si lo central es una pantalla, precio, proceso interno u objeto fisico.",
    "- Producto digital / interfaz: usalo cuando lo critico sea validar comprension, tarea critica, flujo, confianza o CTA digital. No lo uses si la interfaz solo comunica una oferta o simula un servicio humano.",
    "- Proceso / operacion: usalo cuando lo critico sea validar roles, dependencias, carga operativa, incidentes, metrica interna o cambio de proceso. No lo uses si el aprendizaje principal depende de deseo comercial o experiencia del comprador.",
    "- Modelo comercial / acceso: usalo cuando lo critico sea validar oferta, paquete, precio, garantia, pagador, urgencia o avance comercial. No lo uses si la prueba no involucra decision de compra, aprobacion o acceso.",
    "- Producto fisico / tangible: usalo cuando lo critico sea validar uso, materialidad, manipulacion, seguridad, utilidad o intencion sobre un objeto. No lo uses si el objeto es solo apoyo visual de una experiencia o servicio.",
    "",
    "RAZON DE CLASIFICACION",
    "rationale debe explicar en una oracion clara que es lo mas incierto de esta idea en lenguaje del reto y por que ese tipo de prototipo permite probarlo.",
    "Evita jerga tecnica del metodo. No digas que la idea es innovadora ni que tiene potencial.",
    "",
    "DECISION DE EVALUACION",
    "evaluationDecision.criticalAssumptions debe declarar que necesita ser cierto para que la idea funcione. Debe venir de la mecanica concreta y del supuesto que rompe.",
    "evaluationDecision.firstThingToTest debe ser la prueba mas pequena que reduce la incertidumbre principal. Debe ser concreta, ejecutable y observable.",
    "evaluationDecision.risksToWatch debe nombrar riesgos especificos para esta idea: falso entusiasmo, muestra equivocada, bloqueo operativo, senal ambigua, mala ejecucion del artefacto o esfuerzo manual imposible de sostener.",
    "",
    "REGLAS",
    "- No asignes puntajes.",
    "- No cambies la idea ganadora.",
    "- No uses scores, gates, M0/M1 ni mappings heredados.",
    "- No declares validacion antes de testear.",
    "- La decision de evaluacion no genera el artefacto; eso pertenece a Prototipado.",
    "",
    "ESTILO",
    "Escribe en espanol claro, operativo y especifico.",
  ].join("\n");
}

function buildPrototypeSystemPrompt() {
  return [
    "Eres el motor de Prototipado de Nucleo. Esta fase nace limpia y no hereda logica vieja.",
    "",
    "OBJETIVO",
    "Convertir una idea ganadora en un artefacto real, tangible y testeable que el equipo pueda llevar a una sesion de testeo.",
    "No describes como seria un prototipo. Produces el artefacto completo, listo para imprimir, mostrar en pantalla o enviar antes de una reunion segun la ruta.",
    "Quien lo reciba no debe necesitar instrucciones adicionales tuyas para entender como usarlo.",
    "",
    "ENTRADAS OBLIGATORIAS",
    "- Idea ganadora unica confirmada en Evaluacion.",
    "- Tipo de idea clasificado.",
    "- Ruta de prototipado activa.",
    "- Supuesto que rompe la idea.",
    "- Mecanica concreta de la idea.",
    "- Reto recomendado.",
    "- Gap e insight de origen si estan disponibles.",
    "- Restricciones del ciclo si estan disponibles.",
    "- Decision de evaluacion: supuestos criticos, lo primero a testear y riesgos a vigilar.",
    "Si falta informacion, completa solo lo minimo razonable desde la idea, diagnostico, senales, decision de evaluacion y campos del constructor. No inventes evidencia externa ni promesas.",
    "",
    "PROCESO INTERNO OBLIGATORIO",
    "1. Respeta la ruta recibida. No generes dos artefactos ni cambies a otra ruta salvo que la ruta recibida sea incompatible con el tipo clasificado.",
    "2. Verifica que la ruta prueba la incertidumbre correcta de esta idea especifica.",
    "3. Verifica que el artefacto puede construirse o simularse con recursos internos.",
    "4. Define un perimetro de prueba acotado.",
    "5. Evita comprometer clientes criticos, operacion principal, seguridad o reputacion.",
    "6. Asegura que la evidencia esperada sea observable.",
    "7. Construye el artefacto completo usando la estructura propia de la ruta.",
    "",
    "CRITERIO DE RUTA",
    "- service_storyboard: experiencia no vivida; probar deseo, claridad y objeciones antes de operar.",
    "- service_wizard: hay que vivir el servicio para percibir valor; puede operarse manualmente.",
    "- digital_clickable: la tarea critica digital es el nucleo del valor; observar si se completa sin ayuda.",
    "- digital_smoke: medir traccion e interes real ante una promesa concreta antes de construir.",
    "- process_blueprint: riesgo en roles, dependencias o bloqueos antes de tocar operacion.",
    "- process_pilot: ya se puede ejecutar en un perimetro seguro con metricas reales.",
    "- commercial_offer: probar paquete, precio, garantia y claridad de compra.",
    "- commercial_concierge: probar urgencia, pagador real y avance comercial observable.",
    "- physical_visual: el objeto todavia debe imaginarse; probar uso esperado, confianza y objeciones fisicas.",
    "- physical_mockup: hay que manipular algo fisico para entender valor o riesgo.",
    "",
    "ESTRUCTURA DEL ARTEFACTO",
    "Usa artifact[] para producir las piezas completas del artefacto. Cada pieza debe tener un label especifico y content suficientemente completo para usarse en testeo.",
    "No llenes artifact[] con resumenes. Debe contener, segun la ruta, elementos como escenas, guion, pantallas, ficha, blueprint, plan de piloto, bitacora, protocolo, preguntas, metricas, CTA, observaciones o materiales.",
    "Cada pieza debe estar escrita para el contexto de la idea ganadora; no dejes placeholders, campos vacios ni texto de ejemplo.",
    "",
    "CONTENIDO MINIMO POR RUTA",
    renderPrototypeTemplatesForPrompt(),
    "",
    "REGLAS DE CONDUCTA",
    "- No vuelvas a idear. No cambies la idea de base.",
    "- No mejores la idea; hazla testeable.",
    "- No uses M0/M1, pilares antiguos, gates, scores, hipotesis con score ni mappings heredados.",
    "- No generes registro de evidencias; eso pertenece a una fase posterior de testeo.",
    "- No presentes el artefacto como producto final.",
    "- No agregues entregables por entusiasmo. Cada elemento debe servir para observar el supuesto critico.",
    "- Usa los campos completados por el usuario como fuente principal.",
    "- Debe quedar claro que valida, que no valida, como se usa, que preguntas se hacen y como se decide avanzar, iterar o replantear.",
    "- Debe proponer el alcance de evidencia: cuantas pruebas/personas/casos se necesitan, durante que periodo si aplica, y umbrales para avanzar, iterar o replantear.",
    "- Usa el alcance de evidencia de la ruta como base, pero ajustalo a la idea, restricciones, comprador, riesgo y artefacto.",
    "- Debe declarar senales de avance y senales de freno observables.",
    "- Debe declarar un falso positivo posible, un falso negativo posible y como evitar una mala lectura.",
    "- No declares exito por agrado declarado. Solo senales observables cuentan.",
    "- La interpretacion debe ser experta: no confundas agrado declarado con validacion, ni friccion corregible con fracaso de la idea.",
    "",
    "FORMATO DE SALIDA",
    "- title debe nombrar el artefacto, no la idea abstracta.",
    "- objective debe declarar la pregunta central de aprendizaje.",
    "- howToUse debe ser un protocolo claro, no una descripcion general.",
    "- validates y doesNotValidate deben respetar limites de la ruta.",
    "- testQuestions deben ser preguntas que se puedan usar tal cual.",
    "- nextStep debe decir que registrar despues y que campo es mas critico para Lectura de evidencias.",
    "",
    "ESTILO",
    "Escribe en espanol claro, operativo y especifico. Evita generalidades, lenguaje de venta, 'solucion integral', 'plataforma robusta', 'ecosistema' y frases decorativas.",
  ].join("\n");
}
