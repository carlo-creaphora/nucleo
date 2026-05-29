# Lectura de evidencias de Nucleo: reglas, condiciones y estructura

Este documento define la logica del modulo de Lectura de evidencias de Nucleo. Esta fase interpreta registros de testeo contra las preguntas cerradas y campos abiertos especificos de la ruta activa para recomendar Avanzar, Iterar o Replantear y elegir una ruta metodologica.

## 1. Objetivo del paso

Lectura de evidencias no es celebracion del piloto.

El objetivo es decidir que hacer despues de observar la prueba del artefacto.

La fase debe responder:

- Que supuesto fue realmente probado.
- Que evidencia sostiene la decision.
- Que evidencia es debil o faltante.
- Que riesgo hay de falso positivo.
- Que riesgo hay de falso negativo.
- Que aprendizaje queda.
- Cual es el siguiente paso.
- Que ruta metodologica debe seguir el ciclo.

El valor de la fase esta en evitar optimismo injustificado y proteger el aprendizaje del ciclo.

## 2. Principio fundacional: evidencia observada sobre intencion declarada

La IA no debe decidir por entusiasmo, narrativa interna ni cantidad mecanica de respuestas cerradas.

Debe leer:

- Respuestas cerradas como senales comparables.
- Respuestas abiertas como contexto, matiz y contradiccion.
- Preguntas C1 a C7 del bloque activo.
- Preguntas C1 a C4 como cobertura critica.
- Umbrales de la matriz como referencia, no como veredicto automatico.
- Senales de avance y freno como marco de interpretacion.
- Riesgos de falso positivo y falso negativo antes de decidir.

Una respuesta positiva no valida la idea si no hay comportamiento, compromiso, comprension o resultado observable.

## 3. Entradas obligatorias

Lectura de evidencias solo puede operar cuando existen:

- Ruta de prototipado.
- Artefacto usado.
- Idea ganadora.
- Preguntas cerradas C1 a C7 del bloque activo.
- Registros de resultados.
- Alcance de evidencia.
- Umbrales de avance, iteracion y replanteo.
- Senales de avance y freno.
- Falso positivo y falso negativo definidos.

Si no hay registros, la fase no debe leer evidencia.

Si no hay registros con el bloque de la ruta activa completado, la fase debe responder:

> No hay registros con el bloque de [ruta activa] completado. Esta fase no puede operar sin evidencia del testeo.

## 4. Decisiones posibles

La decision visible debe ser una de:

- Avanzar.
- Iterar.
- Replantear.

### Avanzar

Se recomienda avanzar cuando:

- Hay accion observable o compromiso concreto.
- La evidencia cumple o se acerca al umbral de avance.
- Las preguntas criticas C1 a C4 tienen mayoria de "Si".
- La muestra es suficiente o muy consistente.
- Las objeciones son corregibles.
- El riesgo residual es manejable.
- El artefacto valido lo que podia validar.

Avanzar no significa escalar sin condiciones. Significa que la idea puede pasar a Playbook o a una prueba de mayor compromiso.

### Iterar

Se recomienda iterar cuando:

- Hay valor, interes o senales parciales.
- Las preguntas C1 a C4 tienen mayoria de "Parcial" o cobertura incompleta.
- La evidencia es insuficiente.
- La muestra es debil.
- Hay confusion corregible.
- El artefacto estuvo mal ejecutado.
- La friccion parece del prototipo, no del concepto.
- Se necesita otra ruta de prototipado para aislar mejor la incertidumbre.

Iterar mantiene viva la idea, pero exige ajustar artefacto, muestra, protocolo o mecanica.

### Replantear

Se recomienda replantear cuando:

- No se reconoce el problema.
- C1 tiene mayoria de "No".
- No aparece valor real.
- No hay pagador, urgencia, confianza, uso o siguiente paso.
- La objecion destruye el supuesto central.
- Aparece bloqueo estructural.
- La evidencia invalida el gap, insight o reto.
- El riesgo de avanzar es mayor que el aprendizaje disponible.

Replantear no siempre significa descartar todo. Puede significar matar la idea, volver a Senales o volver a Diagnostico.

## 5. Confianza de lectura

La confianza debe ser:

- Alta: muestra suficiente, senales consistentes, evidencia abierta concreta y bajo riesgo de mala lectura.
- Media: senales razonables, pero con muestra limitada, contradicciones o algun riesgo interpretativo.
- Baja: muestra pequena, evidencia vaga, sesgo fuerte, registros incompletos o protocolo inconsistente.

La confianza no debe subir solo porque la decision sea positiva.

## 6. Ruta metodologica

La fase debe recomendar una ruta metodologica:

| Ruta | Cuándo aplica | Siguiente movimiento |
|---|---|---|
| advance | La idea pasa la prueba del artefacto y el riesgo residual es manejable. | Avanzar a Playbook. |
| iterate | La idea sigue viva, pero falta ajustar prototipo, muestra, registro o criterio. | Volver a Prototipado o Resultados. |
| discard | La idea falla, pero el reto, gap e insight siguen siendo plausibles. | Volver a Ideacion. |
| invalidate_challenge | La evidencia sugiere que el reto estaba mal definido. | Volver a Diagnostico. |
| invalidate_signal | La evidencia sugiere que el gap o insight de partida fallo. | Volver a Senales. |

La ruta metodologica es mas precisa que la decision visible. Por ejemplo, una decision "Replantear" puede terminar en discard, invalidate_challenge o invalidate_signal.

## 7. Proceso interno obligatorio

Antes de decidir, la IA debe:

1. Identificar el supuesto testeado.
2. Verificar cobertura de preguntas cerradas.
3. Revisar que valida y que no valida el artefacto.
4. Contar senales cerradas por pregunta: cuantas respuestas son "Si", "No" y "Parcial".
5. Leer evidencia abierta.
6. Buscar contradicciones entre respuestas cerradas y abiertas.
7. Revisar muestra y alcance.
8. Comparar contra umbrales.
9. Identificar evidencia fuerte.
10. Identificar evidencia debil o faltante.
11. Evaluar falso positivo.
12. Evaluar falso negativo.
13. Decidir Avanzar, Iterar o Replantear.
14. Elegir ruta metodologica.

## 8. Reglas de interpretacion

La IA debe respetar:

- No extrapolar a escala si el artefacto no valida escala.
- No extrapolar a adopcion sostenida si solo se probo comprension o deseo inicial.
- No declarar validacion comercial sin pagador, aprobador o siguiente paso.
- No declarar validacion operativa si el equipo compenso con esfuerzo extraordinario.
- Tratar como "Parcial" una respuesta cerrada marcada "Si" cuando la evidencia abierta la contradice.
- No declarar fracaso si la friccion fue del artefacto y es corregible.
- No matar el reto si solo fallo una idea mal formulada.
- No invalidar una senal si la muestra no representaba al comprador correcto.
- No usar el numero de registros como unica base de confianza.

## 9. Evidencia fuerte

La evidencia fuerte debe ser observable y especifica:

- Completo tarea critica sin ayuda fuerte.
- Pidio siguiente paso concreto.
- Acepto reunion, piloto, cotizacion o prueba.
- Identifico valor diferencial con sus palabras.
- Reconocio el problema como propio.
- Aparecio pagador o aprobador real.
- La metrica mejoro en un caso piloto.
- No aparecio bloqueo estructural.

## 10. Evidencia debil o faltante

La evidencia es debil cuando:

- Solo hay agrado declarado.
- La muestra no representa al usuario o comprador.
- Faltan respuestas cerradas clave, especialmente C1 a C4.
- Las notas abiertas son genericas.
- El moderador explico demasiado.
- El usuario recibio incentivo artificial.
- No hubo oportunidad real de aceptar o rechazar siguiente paso.
- La objecion principal no fue explorada.

## 11. Riesgos de mala lectura

La fase debe declarar:

- Riesgo de falso positivo: por que podria parecer que funciona sin funcionar.
- Riesgo de falso negativo: por que podria parecer que falla aunque la idea tenga potencial.

Tambien debe indicar que falta para reducir ese riesgo.

## 12. Salida esperada

La fase debe producir:

- Decision: Avanzar, Iterar o Replantear.
- Confianza: Baja, Media o Alta.
- Supuesto testeado.
- Ruta metodologica.
- Razon metodologica.
- Razon de decision.
- Evidencia que sostiene.
- Evidencia debil o faltante.
- Riesgo de falso positivo.
- Riesgo de falso negativo.
- Aprendizaje.
- Siguiente paso.

## 13. Cambios manuales de ruta

El usuario puede cambiar la ruta metodologica recomendada.

Si lo hace, el sistema debe guardar:

- Ruta original.
- Ruta elegida.
- Razon del cambio.
- Fecha del cambio.

El cambio manual debe ser trazable porque afecta memoria del ciclo y aprendizaje posterior.
