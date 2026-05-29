# Prototipado de Nucleo: reglas, condiciones y matriz

Este documento define la logica del modulo de Prototipado de Nucleo. Esta escrito para que un modelo de IA pueda convertir una idea ganadora en un artefacto real, tangible y testeable sin volver a idear, sin sobredesarrollar y sin confundir prototipo con producto final.

## 1. Objetivo del paso

Prototipado no es implementacion ni descripcion de un prototipo.

El objetivo de Prototipado es transformar la idea ganadora en un artefacto completo, listo para imprimir, mostrar en pantalla o enviar antes de una reunion segun el tipo de prueba.

La fase debe responder:

- Que artefacto permite probar la idea sin construir producto final.
- Que valida y que no valida ese artefacto.
- Como se usa durante la prueba.
- Que preguntas deben hacerse.
- Que evidencia debe registrarse.
- Que senales permiten avanzar, iterar o replantear.
- Que falsos positivos o falsos negativos pueden contaminar la lectura.

El valor de Prototipado esta en producir una prueba usable y evidencia limpia. Quien reciba el artefacto no debe necesitar instrucciones adicionales de la IA para entender como usarlo.

## 2. Principio fundacional: prototipar es aislar incertidumbre

Un buen prototipo no intenta probar todo.

Debe aislar el supuesto critico mas importante de la idea ganadora y convertirlo en una situacion observable.

La IA debe evitar:

- Cambiar la idea de base.
- Volver a idear.
- Mejorar la idea en vez de volverla testeable.
- Agregar funcionalidades por entusiasmo.
- Convertir el prototipo en producto final.
- Probar adopcion, escala o impacto financiero cuando el artefacto no puede validar eso.
- Declarar exito por agrado declarado.
- Entregar resumenes cuando se necesita una pieza usable.

El prototipo debe dejar claro que aprende y que todavia no puede afirmar.

## 3. Entradas obligatorias

Prototipado solo puede operar cuando existen:

- Idea ganadora unica.
- Clasificacion de tipo de idea.
- Razon de clasificacion.
- Supuesto que rompe la idea.
- Mecanica concreta.
- Primer paso ejecutable.
- Reto recomendado.
- Senales, gap e insight de origen.
- Restricciones del ciclo.
- Decision de evaluacion: supuestos criticos, lo primero a testear y riesgos a vigilar.

## 4. Condiciones de entrada

Antes de construir el artefacto, la fase debe verificar:

1. La idea ganadora existe y fue confirmada en Evaluacion.
2. La ruta de matriz corresponde al tipo de idea clasificado.
3. La ruta elegida prueba la incertidumbre correcta.
4. El artefacto puede construirse o simularse con recursos internos.
5. El perimetro de prueba es acotado.
6. La prueba no compromete clientes criticos, operacion principal, seguridad o reputacion.
7. La evidencia esperada es observable.

Si no se cumplen estas condiciones, Prototipado debe pedir ajustar ruta, alcance o campos de construccion antes de generar el artefacto.

Si falta una entrada critica, la fase debe responder:

> Para generar el artefacto necesito [campo faltante]. Sin eso no puedo construir una prueba con criterio.

## 5. Matriz de prototipado

La matriz define dos rutas por tipo de idea. La IA debe elegir o respetar una ruta compatible con el tipo clasificado.

| Tipo de idea | Ruta | Metodo | Artefacto | Uso principal |
|---|---|---|---|---|
| Servicio / experiencia | service_storyboard | Concept test narrativo | Storyboard de experiencia | Probar deseo, claridad y objeciones antes de operar la experiencia. |
| Servicio / experiencia | service_wizard | Wizard of Oz | Guion de simulacion de servicio | Vivir el servicio con operacion manual antes de automatizar o escalar. |
| Producto digital / interfaz | digital_clickable | Test clickable moderado | Brief de prototipo clickable | Observar comprension, confianza y ejecucion de una tarea critica. |
| Producto digital / interfaz | digital_smoke | Smoke test | Landing brief / video demo + CTA | Medir traccion real con promesa clara y CTA observable. |
| Proceso / operacion | process_blueprint | Blueprint walkthrough | Blueprint antes/despues | Detectar bloqueos antes de tocar operacion. |
| Proceso / operacion | process_pilot | Piloto controlado | Plan de piloto + bitacora | Probar en perimetro seguro con metrica, roles y regla de salida. |
| Modelo comercial / acceso | commercial_offer | Offer test | Ficha de oferta | Probar paquete, precio, garantia y claridad de compra. |
| Modelo comercial / acceso | commercial_concierge | Concierge test comercial | Guion de venta / simulacion comercial | Validar urgencia, pagador, evidencia requerida y siguiente paso. |
| Producto fisico / tangible | physical_visual | Concept visual test | Ficha visual / video de uso simulado | Probar uso imaginado, confianza y objeciones fisicas. |
| Producto fisico / tangible | physical_mockup | Prueba manipulable minima | Brief de mockup + protocolo de uso | Observar uso fisico sin sobredesarrollar. |

## 6. Criterio para elegir ruta

La ruta debe elegirse por la primera incertidumbre critica:

- Si todavia no se entiende o desea la experiencia: storyboard.
- Si hay que vivir la experiencia para percibir valor: Wizard of Oz.
- Si la tarea digital es el nucleo del valor: clickable.
- Si lo critico es interes o conversion ante una promesa: smoke test.
- Si el riesgo esta en roles, dependencias o bloqueos: blueprint.
- Si ya se puede ejecutar en un perimetro seguro: piloto controlado.
- Si lo critico es paquete, precio, garantia o claridad: offer test.
- Si lo critico es urgencia, pagador o avance comercial: concierge comercial.
- Si el objeto todavia debe imaginarse: concept visual.
- Si hay que manipular algo para entender valor o riesgo: mockup.

Si la plataforma ya recibe una ruta activa elegida por el usuario, la IA debe respetarla salvo incompatibilidad clara con el tipo de idea o con la incertidumbre critica.

## 7. Estructura obligatoria del artefacto

Todo artefacto debe incluir:

- Titulo.
- Tipo de artefacto.
- Metodo.
- Objetivo.
- Como se usa.
- Que valida.
- Que no valida.
- Piezas del artefacto.
- Preguntas de test.
- Senales de avance.
- Senales de freno.
- Falso positivo posible.
- Falso negativo posible.
- Como evitar mala lectura.
- Lectura de decision: avanzar, iterar, replantear.
- Alcance de evidencia.
- Limites.
- Siguiente paso.

La IA debe escribir en lenguaje operativo. No debe usar texto de venta, manifiestos ni promesas amplias.

La seccion `artifact` debe contener piezas completas, no resumenes. Cada pieza debe poder copiarse, imprimirse o usarse en una sesion.

## 7.1 Contenido minimo por ruta

Cada ruta tiene contenido minimo esperado:

Estas plantillas deben existir tambien como estructura operativa en codigo. No son solo documentacion: funcionan como molde para el prompt de generacion y como contrato de cobertura por ruta.

| Ruta | Contenido minimo del artefacto |
|---|---|
| service_storyboard | 5 escenas completas, preguntas post-escena, preguntas de cierre y siguiente paso observable. |
| service_wizard | Configuracion de simulacion, roles frontstage/backstage, secuencia de 4 momentos, preguntas post-simulacion y cierre. |
| digital_clickable | Brief de construccion, tarea critica, pantallas minimas, instruccion al tester, protocolo moderado y preguntas post-sesion. |
| digital_smoke | Brief de landing, headline, subheadline, bloques de valor, CTA especifico, que ocurre tras el CTA, distribucion, audiencia y metricas. |
| process_blueprint | Proceso actual, proceso propuesto, tabla de roles/pasos, dependencias, condiciones y guion de walkthrough. |
| process_pilot | Definicion de perimetro, duracion, equipo, criterios de inclusion/exclusion, regla de salida, metricas y bitacora. |
| commercial_offer | Ficha de oferta legible en 60 segundos, para quien es, que resuelve, incluye/no incluye, precio, garantia, accion para empezar y protocolo comercial. |
| commercial_concierge | Perfil de comprador, guion de apertura, descubrimiento, presentacion, objecion principal y cierre con fecha. |
| physical_visual | Ficha visual, descripcion de imagen o boceto, uso en una oracion, especificaciones visibles, contexto de uso y protocolo. |
| physical_mockup | Brief de construccion, materiales, dimensiones, partes reales/simuladas, protocolo de uso, observaciones y preguntas post-uso. |

El modelo no debe dejar placeholders, campos vacios ni texto de ejemplo. Si falta un dato, debe completarlo con el minimo razonable desde la idea, diagnostico, senales, decision de evaluacion y campos del constructor.

## 8. Reglas de construccion

El artefacto debe:

- Mantener la idea original.
- Hacer visible la mecanica concreta.
- Conectar con el supuesto critico.
- Crear una situacion donde el usuario, comprador o equipo haga algo observable.
- Incluir instrucciones exactas para moderador, vendedor, operador o tester cuando la ruta lo requiera.
- Incluir preguntas listas para usar.
- Separar opinion de comportamiento.
- Declarar limites de lectura.
- Definir una muestra minima y maxima razonable.
- Definir umbrales de avance, iteracion y replanteo.

El artefacto no debe:

- Cambiar el gap, insight o idea ganadora.
- Resolver problemas fuera del alcance.
- Usar mas complejidad de la necesaria.
- Pedir una encuesta generica de satisfaccion.
- Medir likes, agrado o interes declarado como validacion suficiente.
- Probar escala si solo se esta probando comprension, deseo, confianza o ejecucion inicial.
- Usar lenguaje de venta dentro del artefacto cuando se necesita observar conducta.

## 9. Alcance de evidencia

Cada ruta debe declarar:

- Muestra esperada.
- Minimo de registros para leer evidencia.
- Maximo sugerido antes de decidir.
- Que valida.
- Que no valida.
- Umbral para avanzar.
- Umbral para iterar.
- Umbral para replantear.

La muestra no debe ser inflada. Un prototipo temprano busca senales de aprendizaje, no prueba estadistica.

## 10. Senales de avance y freno

Una senal de avance debe ser observable:

- Completa una tarea.
- Acepta un siguiente paso.
- Pide continuar.
- Reconoce el problema con sus palabras.
- Identifica valor diferencial.
- Aparece pagador o aprobador.
- Mejora una metrica en perimetro controlado.
- No aparece bloqueo estructural.

Una senal de freno tambien debe ser observable:

- No reconoce el problema.
- No entiende la propuesta.
- No confia lo suficiente para avanzar.
- No aparece urgencia, pagador o decision.
- Aparece riesgo operativo, reputacional, de seguridad o clima.
- La prueba requiere ayuda excesiva.
- El valor depende de esfuerzo manual imposible de sostener.

## 11. Falso positivo y falso negativo

Todo artefacto debe advertir:

- Falso positivo: cuando parece funcionar por cortesia, mala muestra, ayuda excesiva, incentivo artificial o sesgo del moderador.
- Falso negativo: cuando parece fallar por mala narracion, prototipo confuso, operador mal preparado, muestra equivocada o condicion artificial.

La IA debe proponer como evitar la mala lectura.

## 12. Salida esperada

La fase debe dejar un artefacto listo para ejecutar o construir, no un plan estrategico.

La salida debe permitir pasar directamente a Registro de resultados.
