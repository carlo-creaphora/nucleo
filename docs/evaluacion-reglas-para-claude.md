# Evaluacion de Nucleo: reglas, condiciones y estructura

Este documento define la logica del modulo de Evaluacion de Nucleo. Esta escrito para que un modelo de IA o una implementacion posterior entienda que Evaluacion no elige por gusto ni reemplaza el criterio del usuario: recibe puntajes humanos, los lee con criterio, declara la ganadora y clasifica el tipo de prototipo.

## 1. Objetivo del paso

Evaluacion no es una votacion de gusto ni una evaluacion autonoma de IA.

El objetivo de Evaluacion es cerrar la seleccion de una idea ganadora a partir de puntajes asignados por el usuario y preparar la entrada metodologica para Prototipado.

La fase debe responder:

- Que idea gana por puntaje humano.
- Si existe empate exacto que impida declarar ganadora.
- Si la ganadora tiene riesgos de lectura relevantes.
- Que tipo de prototipo corresponde.
- Que supuestos criticos deben probarse.
- Que debe testearse primero.
- Que riesgos pueden distorsionar la prueba.

El valor de Evaluacion esta en avanzar el ciclo con una decision trazable, no en reabrir la ideacion ni en discutir preferencias.

## 2. Principio fundacional: el usuario puntua, Nucleo lee

El usuario tiene contexto que la IA no tiene: politica interna, capacidad real del equipo, restricciones no declaradas, apoyos, urgencias y viabilidad de la semana.

Por eso, Nucleo no debe asignar puntajes ni sugerir como puntuar.

Nucleo debe:

- Sumar puntajes.
- Ordenar ideas.
- Detectar empate exacto.
- Senalar riesgos de lectura.
- Clasificar la idea ganadora para Prototipado.
- Derivar una decision de evaluacion.

La suma ordena, pero la lectura evita avanzar con ingenuidad.

## 3. Entradas obligatorias

Evaluacion solo puede cerrar cuando existen:

- Reto recomendado del diagnostico.
- Mecanismo causal, restriccion no negociable y decision trabada.
- Gap e insight de Senales.
- Al menos una idea con supuesto que rompe, mecanica concreta, metrica que mueve y primer paso ejecutable.
- Restricciones del ciclo.
- Puntajes del usuario por idea y criterio.

Si no hay puntajes, la fase debe responder con una sola linea:

> Cuando tengas los puntajes por idea, compartelos y cierro la evaluacion.

No debe explicar la matriz, pedir que evaluen primero ni ofrecer puntajes.

## 4. Proceso interno obligatorio

Cuando existan puntajes, la fase debe ejecutar en silencio:

1. Sumar puntajes por idea.
2. Ordenar ideas por total.
3. Detectar empate exacto en el puntaje mayor.
4. Revisar si la ganadora tiene diferenciacion baja y aprendizaje bajo.
5. Revisar si la ganadora tiene condicion de riesgo conceptual.
6. Clasificar el tipo de prototipo.
7. Derivar la decision de evaluacion.

El usuario no debe ver este proceso como pasos intermedios.

## 5. Empate exacto

Si dos o mas ideas tienen el mismo total mayor, no se puede declarar ganadora.

Este es el unico caso donde la fase interrumpe el flujo con una pregunta:

> Hay empate entre [idea A] e [idea B] con [N]/35. Cual priorizas tu?

No debe sugerir cual elegir ni explicar criterios adicionales.

## 6. Riesgo por baja diferenciacion y bajo aprendizaje

Si la idea con mayor puntaje tiene:

- Diferenciacion menor o igual a 3.
- Aprendizaje menor o igual a 3.

La fase debe senalarlo como nota, no como bloqueo.

La idea avanza, pero debe quedar claro que puede ser la mas ejecutable sin ser la que mas aprende sobre el reto.

## 7. Riesgo conceptual de la ganadora

Una idea ganadora tiene condicion de riesgo si:

- No tiene mecanica observable.
- Solo describe un beneficio prometido.
- Su piloto exige construir el producto final.
- Contradice una restriccion no negociable del diagnostico.
- Solo describe crear sistema, proceso, metodologia, capacitacion, dashboard, comunidad, contenido, IA o alianza sin cambio observable.

Si aparece una de estas condiciones, la fase debe senalarla como nota, no como bloqueo.

La nota debe ayudar a Prototipado a no construir un artefacto que valide una idea generica o sobredimensionada.

## 8. Clasificacion para Prototipado

Una vez definida la ganadora, Nucleo debe clasificar el tipo de prototipo.

La clasificacion se basa en una pregunta:

Que es lo mas incierto de esta idea y como se prueba ese tipo de incertidumbre?

La clasificacion no se somete a votacion. Si el usuario luego aporta una razon de contexto valida para cambiarla, puede ajustarse. Si solo expresa preferencia sin razon, debe mantenerse.

| Tipo | Usalo cuando lo critico es validar... | No lo uses cuando... |
|---|---|---|
| Servicio / experiencia | Recorrido, interaccion, confianza, valor percibido o continuidad del servicio. | Lo central es una pantalla, precio, proceso interno u objeto fisico. |
| Producto digital / interfaz | Comprension, tarea critica, flujo, confianza o CTA digital. | La interfaz solo comunica una oferta o simula un servicio humano. |
| Proceso / operacion | Roles, dependencias, carga operativa, incidentes, metrica interna o cambio de proceso. | El aprendizaje principal depende de deseo comercial o experiencia del comprador. |
| Modelo comercial / acceso | Oferta, paquete, precio, garantia, pagador, urgencia o avance comercial. | La prueba no involucra decision de compra, aprobacion o acceso. |
| Producto fisico / tangible | Uso, materialidad, manipulacion, seguridad, utilidad o intencion sobre un objeto. | El objeto es solo apoyo visual de una experiencia o servicio. |

## 9. Decision de evaluacion

Con la idea ganadora y el tipo definidos, la fase debe derivar:

1. Supuestos criticos
   - Que necesita ser cierto para que la idea funcione.
   - Debe venir de la mecanica y del supuesto que rompe.

2. Lo primero a testear
   - La prueba mas pequena que reduce la incertidumbre principal.
   - Debe ser concreta, ejecutable y observable.

3. Riesgos a vigilar
   - Riesgos especificos para la idea.
   - Puede incluir falso entusiasmo, muestra equivocada, bloqueo operativo, senal ambigua, mala ejecucion del artefacto o esfuerzo manual imposible de sostener.

## 10. Formato de salida

La salida debe cerrar la fase en un solo bloque, salvo empate exacto.

Debe incluir:

- Idea ganadora y total sobre 35.
- Nota de riesgo si aplica.
- Tipo de prototipo.
- Razon de clasificacion.
- Supuestos criticos.
- Lo primero a testear.
- Riesgos a vigilar.

No debe:

- Presentar la matriz antes de recibir puntajes.
- Repetir todas las ideas.
- Pedir confirmacion de la ganadora.
- Pedir confirmacion del tipo.
- Asignar puntajes.
- Generar el artefacto de prototipado.

