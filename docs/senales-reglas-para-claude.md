# Senales de Nucleo: reglas, condiciones y estructura

Este documento define la logica del modulo de Senales de Nucleo. Esta escrito para que un modelo de IA pueda interpretar el objetivo del paso, distinguir evidencia externa de diagnostico interno y producir gaps e insights con valor para Ideacion.

## 1. Objetivo del paso

Senales no es una repeticion del Diagnostico.

El objetivo de Senales es contrastar el reto recomendado con evidencia externa del mercado, clientes, tendencias y competidores para descubrir oportunidades, tensiones y verdades accionables que el diagnostico por si solo no puede revelar.

La fase debe responder:

- Que esta pasando afuera que cambia la lectura del reto.
- Que expectativa, presion, comportamiento o movimiento del mercado abre una oportunidad.
- Que brecha existe entre el estado actual de la empresa y una posibilidad externa verificable.
- Que motivacion real del cliente o comprador puede orientar la ideacion.

El valor de Senales esta en descubrir lo no obvio. Si el resultado solo repite lo que el usuario ya dijo, la fase fallo.

## 2. Principio fundacional: el reto es el filtro

El Diagnostico mira hacia adentro del caso.

Senales mira hacia afuera.

El diagnostico puede usarse como punto de partida, pero no como fuente principal de verdad para gaps e insights. La evidencia externa debe tensionar, ampliar o corregir la lectura interna.

El modelo debe evitar convertir el reto diagnosticado en una descripcion de mercado sin nueva informacion.

Todo lo que se busca, evalua y produce debe estar tensionado por el reto recomendado. El reto recomendado funciona como filtro de relevancia, no como texto para repetir.

Antes de lanzar cualquier busqueda, la IA debe extraer tres elementos:

1. Mecanismo causal
   - Patron estructural que explica por que existe el problema.
   - Puede venir de las causas, tensiones, justificacion del reto o historial diagnostico.

2. Restriccion no negociable
   - Limite real que cualquier solucion debe respetar.
   - Puede venir de restricciones, capacidades, recursos, cultura, mercado, regulacion o condiciones declaradas.

3. Decision trabada
   - Decision concreta que el reto necesita destrabar.
   - Puede venir del supuesto a cuestionar, reto recomendado, tension interna o brief de ideacion.

La pregunta rectora de busqueda es:

Que esta pasando afuera que cambia la lectura de este mecanismo, esta restriccion o esta decision?

Si una senal no conecta con mecanismo causal, restriccion no negociable o decision trabada, debe descartarse aunque sea interesante en abstracto.

## 3. Insumos permitidos

La fase puede usar:

- Diagnostico cerrado.
- Reto recomendado.
- Registro de empresa, categoria, mercado y competidores.
- Memoria de ciclos previos.
- Fuentes publicas encontradas durante la busqueda.
- Evidencia por lentes: social listening, tendencias, competidores y customer insight.

El diagnostico sirve para orientar la busqueda y filtrar relevancia. No sirve para fabricar hallazgos.

## 4. Salidas esperadas

La fase debe producir:

1. Analisis de social listening.
2. Analisis de tendencias.
3. Analisis de competidores.
4. Exactamente 2 gaps.
5. Exactamente 2 insights accionables.
6. Base interna de senales consultadas.
7. Limitaciones o vacios de evidencia.

Cada salida debe estar conectada a evidencia trazable.

## 5. Que es una senal valida

Una senal valida es una evidencia externa que revela algo relevante para el reto.

Debe cumplir al menos una de estas condiciones:

- Muestra una expectativa emergente del mercado.
- Muestra una friccion repetida del cliente o comprador.
- Muestra un cambio en comportamiento, preferencia o criterio de decision.
- Muestra una promesa competitiva relevante.
- Muestra una brecha entre lo que el mercado valora y lo que la empresa puede sostener.
- Muestra una tension entre demanda, adopcion, confianza, precio, riesgo, implementacion o resultado esperado.

Una senal no es valida si solo repite:

- Lo que el usuario ya declaro.
- El diagnostico interno.
- Una debilidad obvia de la empresa.
- Una recomendacion generica.
- Una tendencia amplia sin conexion clara con compradores o decisiones.

## 6. Lentes de busqueda

Los lentes de busqueda no cumplen la misma funcion para gaps e insights.

Las consultas no deben salir desde el nombre de la industria, la empresa o la categoria de forma generica. Deben construirse desde el mecanismo causal, la restriccion no negociable o la decision trabada.

La fase debe separar dos rutas de investigacion:

1. Ruta para gaps
   - Busca evidencia de mercado, categoria, tendencias, competidores y fricciones externas.
   - Su objetivo es descubrir una brecha entre estado actual de la empresa y potencial externo.
   - Usa principalmente social listening, tendencias y competidores.

2. Ruta para insights
   - Busca motivaciones, miedos, criterios de decision y tensiones del comprador.
   - Su objetivo es descubrir una verdad accionable sobre por que el cliente compraria, dudaria, cambiaria o rechazaria.
   - Usa principalmente customer insight.

No se debe usar la misma consulta para producir gaps e insights. Si se usa la misma evidencia, debe interpretarse con preguntas distintas.

Cada lente tiene una funcion propia:

- Social listening: fricciones, quejas, expectativas y lenguaje del mercado.
- Tendencias: cambios de contexto, presiones y movimientos de categoria.
- Competidores: promesas, mecanismos, vacios y expectativas educadas.
- Customer insight: motivaciones, miedos, criterios de decision y tensiones del comprador.

### Preguntas guia para gaps

La busqueda orientada a gaps debe preguntar:

- Que expectativa externa esta creciendo.
- Que friccion del mercado revela una oportunidad.
- Que promesa competitiva esta educando al comprador.
- Que cambio de contexto hace que el estado actual de la empresa quede insuficiente.
- Que potencial externo no esta capturando la empresa.

La respuesta debe terminar en una brecha de mercado, no en una motivacion psicologica del comprador.

### Preguntas guia para insights

La busqueda orientada a insights debe preguntar:

- Que intenta proteger el comprador.
- Que necesita justificar ante otros.
- Que riesgo quiere evitar.
- Que le haria confiar.
- Que comportamiento revela su motivacion real.
- Que tension de decision explica su compra, rechazo o postergacion.

La respuesta debe terminar en una verdad accionable del comprador, no en una brecha de mercado.

## 6.1 Matriz de uso por lente

| Lente | Uso principal para gaps | Uso principal para insights | No debe hacer |
|---|---|---|---|
| Social listening | Detectar fricciones externas, quejas, expectativas y lenguaje del mercado | Puede aportar indicios de motivacion si hay voz directa del comprador | No usar prensa, SEO o mensajes corporativos como si fueran voz de cliente |
| Tendencias | Detectar cambios de contexto, presiones, adopcion, regulacion o movimientos de categoria | Solo aporta insight si muestra cambio en criterios de decision del comprador | No convertir una tendencia amplia en oportunidad sin tension concreta |
| Competidores | Detectar promesas, mecanismos, claims, garantias, vacios y expectativas educadas por la oferta | Puede sugerir que riesgo o promesa valora el comprador, pero no reemplaza evidencia de cliente | No hacer lista descriptiva de competidores ni copiar claims |
| Customer insight | No es fuente principal de gaps, salvo que revele una expectativa externa repetida | Detectar motivaciones, miedos, criterios, presiones y verdades de decision | No convertir necesidades genericas en insight |

## 6.2 Separacion obligatoria entre gap e insight

El modelo debe mantener esta diferencia:

- Gap: diferencia estrategica entre empresa y mercado.
- Insight: verdad accionable sobre comprador, usuario o decisor.

Un gap debe decir: "afuera esta pasando algo que la empresa todavia no captura".

Un insight debe decir: "el comprador actua asi porque intenta proteger, conseguir, justificar o evitar algo".

Si un supuesto hallazgo no puede clasificarse claramente como gap o insight, debe reformularse o descartarse.

## 6.3 Proceso interno obligatorio

La IA debe ejecutar esta secuencia antes de cerrar la fase:

1. Reconstruir el foco diagnostico
   - Identificar mecanismo causal.
   - Identificar restriccion no negociable.
   - Identificar decision trabada.
   - Usar todo el contexto disponible del ciclo.

2. Construir busquedas tensionadas
   - Cada busqueda debe nacer de mecanismo, restriccion o decision.
   - La categoria y los competidores sirven como contexto, no como punto de partida unico.
   - La busqueda debe evitar resumen sectorial.

3. Separar lentes
   - Social listening, tendencias y competidores alimentan principalmente gaps.
   - Customer insight alimenta principalmente insights.
   - Si una fuente sirve para ambas rutas, debe leerse con preguntas distintas.

4. Evaluar cada senal
   - Que agrega frente al diagnostico.
   - Que evidencia externa la sostiene.
   - Que tension nueva aparece.
   - Que cambia para Ideacion.
   - Si abre una direccion distinta o solo confirma una carencia.
   - Si es especifica para este caso o generica de categoria.

5. Sintetizar gaps desde ruta de mercado
   - El gap debe cerrar como brecha de mercado.
   - No debe cerrar como motivacion de comprador.

6. Sintetizar insights desde ruta de comprador
   - El insight debe cerrar como verdad accionable del comprador.
   - No debe cerrar como brecha de mercado.

7. Verificar tension gap por insight
   - La IA debe revisar las cuatro combinaciones posibles entre dos gaps y dos insights.
   - Al menos dos combinaciones deben tener tension real.
   - Si no existe tension, debe ajustar gaps o insights antes de cerrar.

### Social listening

Debe buscar voz externa, fricciones, quejas, expectativas, deseos o patrones de conversacion.

No debe limitarse a describir el sector.

Debe responder:

- Que molesta, preocupa o frustra al mercado.
- Que expectativas aparecen de forma recurrente.
- Que lenguaje usa el comprador, usuario o actor afectado.
- Que promesas generan desconfianza.

### Tendencias

Debe identificar movimientos externos que cambian el contexto de decision.

No debe usar tendencias como adorno.

Debe responder:

- Que esta cambiando en adopcion, tecnologia, regulacion, comportamiento, modelos de negocio o criterios de compra.
- Que tension crea ese cambio.
- Que oportunidad concreta abre.
- Que limitacion o incertidumbre tiene la evidencia.

### Competidores

Debe identificar promesas, mecanismos, posicionamientos y vacios competitivos.

No debe convertirse en una lista descriptiva de competidores.

Debe responder:

- Que prometen los competidores.
- Que mecanismo usan para hacerlo creible.
- Que expectativas estan educando en el mercado.
- Que promesas parecen no estar respaldadas por evidencia.
- Que espacio queda abierto para diferenciarse.

### Customer insight

Debe revelar motivaciones, miedos, criterios de decision o tensiones del comprador.

No debe describir segmentos de forma generica.

Debe responder:

- Quien decide o influye.
- Que riesgo intenta evitar.
- Que necesita justificar.
- Que controla, teme perder o desea demostrar.
- Que condicion haria que una solucion sea creible.

## 7. Que es un gap

Un gap no es una falencia interna escrita con otras palabras.

Un gap es la diferencia entre:

- Estado actual de la empresa.
- Evidencia externa de mercado, cliente, tendencia o competencia.
- Oportunidad accionable que aparece al comparar ambos lados.

El gap debe tener tres elementos:

1. Estado actual de la empresa
   - Puede venir del diagnostico.
   - Debe ser breve y funcional.
   - No debe ocupar el centro del hallazgo.

2. Potencial o expectativa del mercado
   - Debe venir de evidencia externa.
   - Debe mostrar algo que el diagnostico no podia producir por si solo.

3. Brecha estrategica
   - Debe explicar la distancia entre ambos.
   - Debe abrir una direccion nueva para ideacion.

Un gap es debil si:

- Solo dice que la empresa no tiene lo que el mercado quiere.
- Repite el reto diagnosticado.
- Usa palabras del usuario sin agregar evidencia externa.
- Describe una carencia evidente.
- Termina en una solucion obvia.

Un gap es fuerte si:

- Tensiona la lectura del diagnostico con una expectativa externa.
- Revela una oportunidad que no era evidente.
- Nombra una distancia especifica entre mercado y empresa.
- Tiene implicacion clara para ideacion.
- Puede defenderse con evidencia trazable.

## 8. Que es un insight accionable

Un insight no es una recomendacion.

Un insight es una verdad sobre el comprador, usuario o actor de decision que explica por que una idea podria funcionar.

Debe contener:

- Cliente o actor relevante.
- Comportamiento observado.
- Motivacion o tension interna del cliente.
- Verdad accionable para ideacion.
- Evidencia que lo sostiene.

Un insight es debil si:

- Dice que el cliente quiere mejores resultados.
- Dice que el cliente busca confianza sin explicar por que.
- Describe necesidades genericas.
- Repite la solucion deseada por la empresa.
- No identifica una tension de decision.

Un insight es fuerte si:

- Revela un miedo, deseo, presion o criterio de decision especifico.
- Explica que necesita creer o demostrar el comprador.
- Muestra un comportamiento que puede cambiarse con una mecanica de solucion.
- Permite idear desde motivacion, no desde funcionalidad.

## 9. Evidencia y trazabilidad

Cada gap e insight debe citar `evidenceIds`.

La evidencia debe ser usada de forma sustantiva, no decorativa.

Reglas:

- No inventar evidencia.
- No inflar confianza cuando la evidencia es indirecta.
- No afirmar comportamiento del cliente si la evidencia solo habla de empresas o mercado.
- No afirmar mercado si la evidencia solo habla de un competidor.
- No afirmar tendencia si solo hay una opinion aislada.
- Si la evidencia es debil, marcarla como limitacion.

La fase debe diferenciar:

- Evidencia fuerte.
- Evidencia media.
- Evidencia indirecta.
- Vacios de evidencia.

La evidencia fuerte requiere multiples fuentes independientes, datos cuantitativos o comportamiento observado directamente.

La evidencia media requiere una fuente confiable, un patron reconocible o una inferencia razonable.

La evidencia indirecta incluye analogias, senales debiles, opiniones sectoriales o fuentes que no observan directamente al comprador.

Un vacio de evidencia es una zona donde no se encontro soporte suficiente y debe declararse como limitacion, no rellenarse con inferencia.

## 10. Relacion con Diagnostico

El diagnostico debe orientar, no dominar.

Uso correcto del diagnostico:

- Definir que buscar.
- Filtrar senales irrelevantes.
- Entender el estado actual de la empresa.
- Conectar gaps con el reto recomendado.

Uso incorrecto del diagnostico:

- Reescribirlo como gap.
- Usarlo como fuente de mercado.
- Repetir causas internas como si fueran hallazgos externos.
- Convertir tensiones internas en insights de cliente.

## 11. Criterio de profundidad

Antes de aceptar un gap o insight, el modelo debe preguntarse:

- Que aprendi aqui que no estaba ya en el diagnostico?
- Que evidencia externa sostiene este hallazgo?
- Que tension nueva aparece?
- Que cambia para Ideacion si este hallazgo es cierto?
- Esto abre una direccion de solucion distinta o solo confirma una carencia?
- El hallazgo es especifico o podria servir para cualquier empresa?

Si la respuesta no agrega informacion nueva, debe descartarse o reformularse.

## 11.1 Verificacion de tension entre gaps e insights

Antes de cerrar, la IA debe comprobar si cada insight explica, al menos en parte, por que existe o persiste cada gap.

La pregunta de verificacion es:

El comportamiento que revela el insight explica por que existe el gap?

La fase debe revisar:

- Gap 1 con Insight 1.
- Gap 1 con Insight 2.
- Gap 2 con Insight 1.
- Gap 2 con Insight 2.

Las combinaciones con tension real son las que tienen mayor potencial para Ideacion.

Si ninguna combinacion tiene tension real, los gaps y los insights estan desconectados y la fase no puede cerrar.

Si solo una combinacion tiene tension real, la fase debe ajustar al menos un gap o un insight.

Si al menos dos combinaciones tienen tension real, la fase puede cerrar siempre que cumpla los demas criterios de calidad.

## 12. Anti-patrones prohibidos

No hacer:

- Repetir el diagnostico con lenguaje de mercado.
- Llamar gap a una falencia obvia de la empresa.
- Llamar insight a una necesidad generica del cliente.
- Usar tendencias amplias sin conexion con decision, comprador o oportunidad.
- Describir competidores sin extraer mecanismo, expectativa o vacio.
- Presentar evidencia indirecta como fuerte.
- Proponer soluciones en lugar de senales.
- Convertir el estado actual de la empresa en el centro del gap.
- Omitir limitaciones cuando la evidencia es debil.
- Generar gaps que no cambian la direccion de Ideacion.

## 13. Estructura de gap

Cada gap debe mantener esta estructura:

1. Titulo
   - Debe nombrar la brecha, no la solucion.

2. Estado actual de la empresa
   - Sintesis breve del punto interno relevante.

3. Potencial de mercado
   - Evidencia externa de expectativa, movimiento o oportunidad.

4. Brecha
   - Distancia estrategica entre estado actual y potencial externo.

5. Evidencia de mercado
   - Base externa que sostiene el gap.

6. Implicacion para ideacion
   - Direccion que abre para crear ideas.
   - No debe ser una solucion cerrada.

## 14. Estructura de insight

Cada insight debe mantener esta estructura:

1. Titulo
   - Debe nombrar la verdad accionable.

2. Cliente
   - Actor, comprador, usuario, influenciador o decisor.

3. Comportamiento observado
   - Que hace, evita, exige, compara, posterga o busca.

4. Motivacion o deseo
   - Que intenta lograr, proteger, justificar o evitar.

5. Verdad accionable
   - Principio que debe guiar la ideacion.

6. Prompt para ideacion
   - Instruccion para crear ideas desde la motivacion del cliente.

## 15. Criterio de cierre

La fase puede cerrar cuando:

- Hay suficiente evidencia externa para producir 2 gaps y 2 insights.
- Cada gap cambia o amplia la lectura del diagnostico.
- Cada insight revela una motivacion o tension accionable del cliente.
- Al menos dos de las cuatro combinaciones gap por insight tienen tension real.
- Las limitaciones de evidencia estan declaradas.
- La salida deja a Ideacion con direcciones mas ricas que el diagnostico inicial.

La fase no debe cerrar si:

- Los gaps son parafrasis del diagnostico.
- Los insights son necesidades genericas.
- No hay trazabilidad a evidencia.
- Ninguna combinacion entre gaps e insights tiene tension real.
- La salida no cambia nada para Ideacion.

## 16. Principio operativo

Senales debe funcionar como una capa de contraste externo.

El resultado correcto no confirma simplemente lo que la empresa ya sabe. El resultado correcto descubre donde el mercado, el cliente o la competencia estan mostrando una posibilidad que la empresa todavia no esta leyendo con suficiente precision.
