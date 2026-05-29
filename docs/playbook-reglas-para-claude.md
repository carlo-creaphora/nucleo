# Playbook de Nucleo: reglas, condiciones y estructura

Este documento define la logica del modulo Playbook de Nucleo. La fase convierte una lectura de evidencias con ruta metodologica `advance` en un plan gerencial ejecutable, trazable y prudente.

Si la ruta final no es `advance`, no se genera Playbook de avance. El ciclo se cierra en memoria con aprendizaje, decision metodologica y siguiente movimiento recomendado.

## 1. Objetivo del paso

Playbook no es una presentacion optimista ni un plan de escala automatico.

El objetivo es transformar evidencia validada en un movimiento operativo claro, con responsables, recursos, metricas, riesgos, controles y condiciones de revision.

La fase debe responder:

- Que decision ejecutiva se toma.
- Que movimiento queda validado por la evidencia.
- Por que tiene sentido avanzar ahora.
- Que evidencia sostiene el avance.
- Que limite de extrapolacion sigue vigente.
- Que principio operativo debe guiar la ejecucion.
- Que se hara en tres horizontes.
- Quien es responsable.
- Que recursos se necesitan.
- Que metricas se monitorean.
- Que riesgos deben controlarse.
- Cuando se revisa la decision.
- Cuando se detiene o itera.
- Que no debe repetirse.
- Que aprendizaje queda en memoria.

El valor de Playbook esta en convertir aprendizaje en accion prudente, no en sobredimensionar la prueba.

## 2. Principio fundacional: avanzar no es escalar

Una ruta `advance` significa que la idea puede pasar al siguiente nivel de ejecucion. No significa que el negocio ya haya validado escala, adopcion sostenida, rentabilidad total o impacto financiero amplio.

Playbook debe respetar estrictamente:

- Lo que el artefacto valido.
- Lo que el artefacto no valido.
- La confianza de la lectura.
- La ruta de prototipado usada.
- Las restricciones no negociables del diagnostico.
- Los riesgos de falso positivo y falso negativo.

La fase debe evitar:

- Convertir evidencia parcial en certeza.
- Presentar un piloto como validacion de escala.
- Ocultar riesgos de mala lectura.
- Cambiar una ruta `iterate`, `discard`, `invalidate_challenge` o `invalidate_signal` en avance disfrazado.
- Proponer varias opciones en vez de un siguiente movimiento unico.
- Ignorar gaps, insights, aprendizajes y anti-patrones del ciclo.

El Playbook debe ser ejecutivo, pero no triunfalista.

## 3. Entradas obligatorias

Playbook necesita:

- Ciclo identificado.
- Ruta metodologica final.
- Lectura de evidencias con confianza.
- Al menos un registro de resultados.
- Idea ganadora con mecanismo, supuesto que rompe y metrica que mueve cuando existan.
- Reto recomendado con mecanismo causal y restriccion no negociable cuando existan.
- Gap e insight de origen.
- Ruta de prototipado.
- Artefacto con `validates` y `doesNotValidate`.
- Riesgo de falso positivo y falso negativo.
- Override ejecutivo cuando el usuario fuerza `advance` contra la recomendacion IA.

Si falta una entrada critica, la fase debe responder:

`Para generar el Playbook necesito [campo faltante]. Sin eso no puedo construir un plan trazable.`

## 4. Condiciones de ruta

| Ruta final | Resultado permitido |
|---|---|
| `advance` | Generar Playbook completo y cerrar memoria. |
| `iterate` | No generar Playbook de avance; cerrar memoria y recomendar iteracion. |
| `discard` | No generar Playbook de avance; cerrar memoria y volver a ideacion. |
| `invalidate_challenge` | No generar Playbook de avance; cerrar memoria y volver a diagnostico. |
| `invalidate_signal` | No generar Playbook de avance; cerrar memoria y volver a senales. |

Si existe override hacia `advance`, el sistema puede generar Playbook solo si el override esta trazado. El override no borra el riesgo: debe quedar visible en el plan, memoria y auditoria.

## 5. Techo de alcance por ruta y confianza

El primer horizonte del plan no puede exceder el techo permitido por la ruta de prototipado y la confianza de la lectura.

Si la confianza es `Baja`, el primer horizonte siempre es preparatorio. No se puede proponer piloto, despliegue, construccion funcional, pipeline activo ni expansion.

| Ruta de prototipado | Alta | Media | Baja |
|---|---|---|---|
| `service_storyboard` | Piloto con muestra ampliada del servicio. | Repetir con perfil más representativo antes de pilotar. | Una sesión adicional con perfil correcto; no pilotar aún. |
| `service_wizard` | Piloto operativo en perímetro controlado. | Piloto reducido con 1-2 cuentas antes de ampliar. | Repetir simulación con ajuste de guion. |
| `digital_clickable` | Desarrollar versión funcional mínima. | Iterar prototipo en pantalla específica con fricción. | Rediseñar flujo antes de cualquier desarrollo. |
| `digital_smoke` | Campaña de adquisición controlada. | Segunda landing con propuesta ajustada. | Revisar headline y CTA antes de nueva distribución. |
| `process_blueprint` | Piloto controlado con equipo real. | Walkthrough con roles faltantes antes del piloto. | Completar dependencias antes de cualquier cambio. |
| `process_pilot` | Expansión a perímetro mayor o consolidación. | Extensión del piloto con métrica adicional. | Mantener perímetro actual y ajustar proceso. |
| `commercial_offer` | Proceso comercial formal con pipeline definido. | Ficha ajustada con 3-5 conversaciones adicionales. | Revisar precio o entregables antes de más conversaciones. |
| `commercial_concierge` | Pipeline comercial activo con seguimiento. | 5 conversaciones adicionales con perfil ajustado. | Revisar guion de descubrimiento o perfil objetivo. |
| `physical_visual` | Construir mockup para prueba manipulable. | Segunda ronda visual con imagen o descripción ajustada. | Rediseñar ficha antes de cualquier construcción. |
| `physical_mockup` | Versión funcional con materiales reales. | Mockup ajustado en punto de fricción específico. | Reconstruir mockup corrigiendo problema de construcción. |

## 6. Proceso interno obligatorio

Antes de escribir Playbook, la IA debe:

1. Verificar la ruta metodologica final.
2. Confirmar si corresponde Playbook o solo memoria.
3. Reconstruir la cadena: Diagnostico, Senales, Ideacion, Evaluacion, Prototipado, Registro y Lectura.
4. Identificar el supuesto testeado.
5. Separar evidencia fuerte, evidencia debil y evidencia faltante.
6. Revisar que valida y que no valida el artefacto.
7. Revisar falso positivo, falso negativo, muestra, sesgo y moderacion.
8. Determinar el techo de alcance por ruta y confianza.
9. Definir un unico movimiento central.
10. Convertirlo en plan de tres horizontes.
11. Definir responsables, recursos, metricas y controles.
12. Declarar condiciones de parada o iteracion con responsable, escalamiento y consecuencia operativa.
13. Preservar que no debe repetirse.
14. Cerrar memoria del ciclo.

## 7. Cadena de evidencia

Todo Playbook debe incluir una cadena de evidencia:

| Eslabon | Debe responder |
|---|---|
| Diagnostico | Que mecanismo causal y restriccion dieron origen al reto. |
| Senales | Que gap e insight justificaron la oportunidad. |
| Ideacion | Que mecanismo de la idea se probo. |
| Evaluacion | Por que esa idea fue seleccionada. |
| Prototipado | Que ruta y artefacto se usaron; que podia validar. |
| Registro | Que comportamiento, compromiso o friccion se observo. |
| Lectura | Que decision metodologica se tomo y con que confianza. |
| Decision | Que movimiento gerencial se deriva y que no se puede extrapolar. |

Si la cadena no puede completarse, el Playbook no debe inventarla.

## 8. Plan de implementacion

El plan debe tener exactamente tres horizontes:

1. Corto plazo
   - No puede exceder el techo de alcance.
   - Debe incluir maximo 3 acciones.
   - Debe tener responsable y metrica de decision.

2. Mediano plazo
   - Consolida lo observado si el primer movimiento funciona.
   - No promete escala sin evidencia adicional.
   - Debe incluir maximo 3 acciones.

3. Revision o expansion controlada
   - Define que se decide despues de nueva evidencia.
   - Debe incluir maximo 3 acciones.
   - Debe preservar condiciones de freno.

Cada horizonte debe ser ejecutable, no aspiracional.

## 9. Metricas

El Playbook debe incluir maximo 3 metricas:

- Metrica principal.
- Metrica secundaria.
- Metrica de riesgo.

Las metricas deben venir de:

- La metrica que mueve la idea.
- Las senales observadas en Registro.
- Los umbrales del artefacto.
- Los riesgos de Lectura de evidencias.
- Las restricciones del diagnostico.

Cada metrica debe incluir nombre, objetivo o umbral y fuente de evidencia.

No deben incluirse metricas vanidosas si no ayudan a decidir.

## 10. Riesgos y controles

Los riesgos deben derivarse de:

- Falso positivo.
- Falso negativo.
- Evidencia debil o faltante.
- Restriccion no negociable.
- Lo que el artefacto no valido.
- Sesgo de muestra.
- Ayuda excesiva del moderador.
- Riesgo operativo, comercial o reputacional.
- Riesgo de extrapolar mas alla del artefacto.

Cada riesgo debe tener un control concreto.

## 11. Condiciones de detener o iterar

Las condiciones de parada no pueden ser frases generales. Deben incluir:

- Condicion observable.
- Responsable.
- Escalamiento.
- Consecuencia operativa.

Ejemplos:

- Si no aparecen compromisos fechados en 3 conversaciones, el lider comercial escala a gerencia y se detiene el pipeline hasta ajustar la oferta.
- Si la ejecucion requiere esfuerzo extraordinario no sostenible, operaciones escala a direccion y el piloto vuelve a blueprint.
- Si la evidencia contradice el supuesto testeado, producto detiene desarrollo y vuelve a ideacion con el aprendizaje.

Estas condiciones protegen al equipo de avanzar por inercia.

## 12. Que no repetir

La fase debe preservar aprendizajes sobre patrones que no deben repetirse:

- Leer agrado declarado como validacion.
- Saltar a escala sin validar alcance.
- Usar una muestra equivocada.
- Confundir friccion del prototipo con fracaso del concepto.
- Confundir fallo de idea con fallo del reto.
- Ignorar una restriccion no negociable.
- Repetir un artefacto que no captura la incertidumbre correcta.

Esta seccion alimenta memoria de ciclo y debe servir para futuros ciclos.

## 13. Salida esperada para `advance`

Si la ruta final es `advance`, la fase debe entregar:

- Encabezado con ciclo, fecha, ruta, confianza y override si aplica.
- Decision ejecutiva.
- Movimiento validado.
- Por que ahora.
- Limite de extrapolacion.
- Cadena de evidencia.
- Principio operativo.
- Plan de implementacion de tres horizontes.
- Responsables.
- Recursos requeridos.
- Metricas a monitorear.
- Riesgos y controles.
- Cadencia de revision.
- Condiciones de detener o iterar.
- Que no repetir.
- Resumen ejecutivo exportable.
- Memoria de ciclo.

## 14. Salida esperada para rutas sin avance

Si la ruta final no es `advance`, la fase debe entregar:

`CICLO CERRADO SIN PLAYBOOK DE AVANCE`

La memoria debe incluir:

- Ruta metodologica.
- Decision.
- Problema.
- Resumen de diagnostico.
- Resumen de senales.
- Idea seleccionada.
- Artefacto prototipado.
- Lectura de evidencia.
- Siguiente movimiento recomendado.
- Aprendizajes clave.
- Supuestos validados.
- Supuestos no resueltos.
- Riesgos.
- Patrones a evitar.

No debe incluir plan de avance, expansion, piloto, pipeline ni implementacion si la lectura pide iterar, descartar o invalidar.

## 15. Anti-patrones

Playbook falla si:

- Genera plan de avance para una ruta que no es `advance`.
- Convierte evidencia insuficiente en expansion.
- Ignora lo que no valida el artefacto.
- Omite riesgos de falso positivo o falso negativo.
- Supera el techo de alcance por ruta y confianza.
- Propone muchas opciones en vez de un movimiento unico.
- Usa mas de 3 acciones por horizonte.
- Usa mas de 3 metricas.
- No asigna responsables.
- No define metricas de decision.
- No declara condiciones de parada con responsable, escalamiento y consecuencia.
- Redacta un manifiesto en vez de un plan operativo.
- Borra aprendizajes incomodos del ciclo.
