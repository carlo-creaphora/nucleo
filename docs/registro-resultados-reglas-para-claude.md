# Registro de resultados de Nucleo: reglas, condiciones y estructura

Este documento define la logica del modulo de Registro de resultados de Nucleo. Esta fase captura evidencia observada durante el test del artefacto. No interpreta, no decide y no inventa conclusiones.

Los campos dependen de la ruta de prototipado activa. Cada ruta tiene preguntas cerradas especificas y campos abiertos propios. No se deben usar campos genericos cuando la ruta define un bloque exacto.

## 1. Objetivo del paso

Registro de resultados no es analisis.

El objetivo es capturar evidencia limpia, comparable y trazable para que Lectura de evidencias pueda decidir con criterio.

La fase debe responder:

- Que ocurrio durante la prueba.
- Que respuestas cerradas se observaron.
- Que evidencia abierta aparecio.
- Que objeciones, fricciones o compromisos fueron visibles.
- Que contexto puede explicar o contaminar la evidencia.

El valor del registro esta en separar hechos observados de interpretaciones.

## 2. Principio fundacional: registrar no es convencer

El registro no debe intentar demostrar que la idea funciona.

Debe capturar lo que paso, incluso si contradice la expectativa del equipo.

La fase debe evitar:

- Completar evidencia faltante por inferencia.
- Cambiar respuestas para que encajen con el umbral.
- Convertir opiniones en comportamientos.
- Resumir de forma optimista.
- Mezclar registros de personas, sesiones o casos distintos.
- Omitir fricciones por parecer pequenas.

La evidencia incomoda es mas valiosa que una conclusion decorativa.

## 3. Entradas obligatorias

Registro de resultados solo puede operar cuando existen:

- Ruta de prototipado activa.
- Artefacto generado.
- Alcance de evidencia: muestra minima, maxima y umbrales.

Si no hay artefacto, no debe registrarse evidencia.

Si falta una entrada necesaria, la fase debe responder:

> Para registrar necesito [campo faltante]. Sin eso no puedo capturar evidencia con criterio.

## 4. Unidad de registro

Cada registro debe representar una unidad observada:

- Una persona entrevistada.
- Una sesion de prueba.
- Una cuenta comercial.
- Un caso piloto.
- Un flujo ejecutado.
- Un uso fisico.
- Una conversacion de venta.

No se deben mezclar varias unidades en un solo registro salvo que la ruta lo defina explicitamente.

## 5. Estructura de cada registro

Cada registro debe incluir:

- Perfil de la unidad observada.
- Duracion de la sesion.
- Quien modero.
- Desviacion del protocolo, si hubo.
- Respuestas cerradas.
- Evidencia abierta por campos de la matriz.
- Notas de contexto.
- Fecha de creacion.

Las respuestas cerradas sirven para comparabilidad.

La evidencia abierta sirve para entender por que ocurrio la senal, que objecion aparecio, que frase textual importa y que riesgo de mala lectura existe.

## 5.1 Activacion de bloque por ruta

La fase debe leer la ruta activa y activar solo el bloque correspondiente. Solo se usa un bloque por ciclo.

Cada bloque debe tener:

- 7 preguntas cerradas identificadas como C1 a C7.
- Campos abiertos especificos para esa ruta.
- Las preguntas C1 a C4 son las mas criticas para Lectura de evidencias.

| Ruta | Campos abiertos especificos |
|---|---|
| service_storyboard | Escena donde mas reacciono; frase textual mas relevante; parte no clara; objecion principal; condicion para avanzar; ayuda fuera del protocolo. |
| service_wizard | Momento de mayor valor; momento de mayor friccion; frase textual; pedido no preparado; objecion principal; esfuerzo extraordinario del equipo. |
| digital_clickable | Pantalla de mayor friccion; frase textual; tarea no completada o completada con ayuda; funcionalidad que cambiaria la mecanica; ayuda fuera del protocolo; objecion post-sesion. |
| digital_smoke | Canal de origen; respuesta textual del follow-up; objecion o pregunta principal; razon de no avanzar; perfil real vs perfil objetivo. |
| process_blueprint | Paso con mas friccion; bloqueo relevante; frase textual del equipo; condicion para piloto; diferencia entre no podemos y no queremos; dependencia no prevista. |
| process_pilot | Semana con mas friccion; ajuste sobre la marcha; caso excluido; esfuerzo no sostenible; aprendizaje inesperado. |
| commercial_offer | Primera reaccion a la ficha; parte que genero preguntas; objecion principal; condicion para avanzar; perfil real del interlocutor; razon de no avanzar. |
| commercial_concierge | Momento de mayor activacion; frase textual; objecion y manejo; interes real vs cortesia; perfil real vs objetivo; razon sin siguiente paso. |
| physical_visual | Primera reaccion; uso imaginado; objecion fisica; parte no entendida; cambio propuesto; condicion de compra. |
| physical_mockup | Como tomo el objeto; que intento primero; punto de friccion; frase post-uso; cambio menor; problema de construccion del mockup. |

Estas plantillas deben existir como estructura operativa en codigo. No son solo documentacion: definen que bloque aparece en la interfaz de Registro.

## 6. Reglas para respuestas cerradas

Las respuestas cerradas deben marcarse solo si hubo evidencia.

No deben usarse como opinion del equipo.

Ejemplos:

- "Acepta siguiente paso" solo es "Si" si hubo accion o compromiso concreto.
- "Completo tarea" solo es positivo si la ejecucion ocurrio bajo las condiciones de la prueba.
- "Confianza suficiente" solo es "Si" si la persona avanzaria, entregaria informacion o tomaria la accion esperada.
- "Pagador real" solo es "Si" si aparece quien decide, paga o aprueba.
- "Sin riesgo critico" solo es "No hay riesgo" si el riesgo fue observado o descartado durante la prueba.
- "Identifico valor diferencial" solo es "Si" si lo describio con sus propias palabras.

Si no se sabe, se debe marcar "No sabemos", "Dudoso", "Parcial" o el equivalente disponible.

Si una pregunta cerrada C1 a C4 no tiene respuesta, el registro puede guardarse, pero el dashboard debe advertir que la lectura tendra menor confianza.

## 7. Reglas para evidencia abierta

La evidencia abierta debe ser concreta.

Debe capturar:

- Que dijo la persona, idealmente con frase textual corta.
- Que hizo o no hizo.
- Donde se trabo.
- Que objecion aparecio.
- Que condicion pidio para avanzar.
- Que parte entendio o no entendio.
- Que ayuda necesito.
- Que riesgo aparecio.
- Que paso siguiente acepto o rechazo.

No debe escribirse:

- "Le gusto mucho" sin accion observable.
- "Se mostro interesado" sin evidencia.
- "La idea fue bien recibida" sin frase, comportamiento o compromiso.
- "Hay oportunidad" como conclusion.
- "Falta comunicar mejor" como explicacion automatica.

## 8. Notas de contexto

Las notas de contexto deben registrar condiciones que pueden afectar la lectura:

- Perfil de la persona o cuenta.
- Canal usado.
- Duracion de la prueba.
- Quien modero.
- Incentivo ofrecido.
- Nivel de familiaridad con la empresa.
- Problemas tecnicos.
- Sesgo posible.
- Desviacion frente al protocolo.
- Condicion externa relevante.

Estas notas no sustituyen evidencia. Ayudan a interpretar riesgo de falso positivo o falso negativo.

## 9. Mini dashboard

El dashboard debe mostrar:

- Numero de registros capturados.
- Muestra esperada segun la ruta.
- Conteo de senales cerradas relevantes.
- Avance frente al minimo de muestra.
- Si se puede pasar a Lectura de evidencias: si, no o con advertencia.
- Registros faltantes para el minimo.
- Preguntas cerradas con mayoria de "Si".
- Preguntas cerradas con mayoria de "No" o "Parcial".
- Bloqueos estructurales encontrados, cuando la ruta los capture.

El dashboard no decide. Solo muestra progreso de evidencia.

## 10. Condiciones para pasar a lectura

Se puede pasar a Lectura de evidencias cuando:

- Hay al menos un registro.
- Existe ruta de prototipado.
- Existe artefacto.
- El artefacto tiene piezas suficientes para interpretar la prueba.
- Las preguntas cerradas C1 a C4 del bloque activo tienen respuesta, aunque sea "No" o "Parcial".

Pero la confianza de la lectura puede ser baja si:

- La muestra esta por debajo del minimo.
- Faltan respuestas cerradas clave, especialmente C1 a C4.
- La evidencia abierta es vaga.
- La muestra no representa al comprador, usuario o caso esperado.
- El protocolo se ejecuto de forma inconsistente.

## 11. Anti-patrones

El registro es invalido o debil si:

- Solo contiene opiniones generales.
- No distingue entre sesiones.
- No incluye objeciones.
- Solo captura lo positivo.
- No registra condicion de muestra.
- Confunde intencion con compromiso.
- No registra fricciones corregibles.
- No registra riesgos de seguridad, operacion, confianza o precio.
- Usa campos de otra ruta o mezcla bloques.

## 12. Salida esperada

La fase debe dejar:

- Lista de registros.
- Respuestas cerradas por registro.
- Campos abiertos por registro.
- Notas de contexto.
- Conteo de avance frente a muestra.

La fase no debe producir decision final. Eso pertenece a Lectura de evidencias.
