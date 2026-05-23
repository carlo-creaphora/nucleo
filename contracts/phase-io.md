# Contrato De Fases

Estado: borrador limpio.

Regla base: ninguna fase puede incorporar logica, nombres, gates o entidades heredadas del proyecto anterior sin aprobacion explicita.

## Modelo Comercial Y De Memoria

Nucleo se vende por licencias a empresas.

Una empresa puede comprar una o varias licencias. Cada licencia corresponde a una persona/perfil dentro de la empresa, por ejemplo lider comercial, lider de operaciones, lider de recursos humanos, gerencia general u otro rol.

Cada perfil puede iniciar y trabajar ciclos individuales desde su contexto, pero los aprendizajes aprobados de esos ciclos alimentan una memoria compartida de la empresa. Esa memoria compartida debe mejorar la calidad de diagnosticos, senales, ideacion, prototipado, testeo y playbook en ciclos futuros.

La memoria compartida nunca mezcla informacion entre empresas distintas. El conocimiento se comparte dentro de la misma empresa segun permisos y licencias.

## Fases

1. Registro
2. Diagnostico
3. Senales
4. Ideacion
5. Prototipado
6. Testeo
7. Playbook

## Registro

Proposito: crear el contexto base de la licencia, la empresa y la categoria para que Diagnostico no empiece desde cero.

Input:

- Contexto del perfil que utiliza la licencia:
  - nombre
  - cargo
  - area
  - email
  - pais
  - personas a cargo
- Contexto de la empresa:
  - nombre
  - sector/categoria
  - numero de empleados
  - anos en el mercado
  - paises o regiones donde opera
  - a quien le vende
  - modelo de cobro
  - sitio web
  - canales de adquisicion
  - documentos que el perfil puede cargar sobre la empresa o la categoria
- Contexto de la categoria:
  - ticket promedio del servicio o producto
  - ciclo de venta promedio en dias
  - tres competidores con pagina web
  - informacion adicional de la categoria agregada por el perfil como notas

Output:

- Contexto inicial para Diagnostico.
- Informacion de categoria derivada de notas y documentos cargados por el perfil.
- Marco para evaluar competidores.
- Vinculo entre perfil, licencia, empresa y memoria compartida de empresa.
- Readiness de Registro: indica si el contexto esta listo para Diagnostico, que bloquea y que queda como advertencia.
- Documentos cargados con estado de extraccion: extraido, texto provisto, no soportado o vacio.
- Extraccion documental demo: texto simple, CSV, JSON, Markdown, HTML, PDF con texto seleccionable, DOCX y XLSX. OCR, imagenes y PDFs escaneados quedan fuera de demo.
- Datos normalizados para paises, canales, empresa, categoria, competidores y perfil.
- Marco competitivo preparado para Senales/Benchmark: criterios, ejes de comparacion, preguntas de senal y brechas de evidencia.

No debe hacer:

- No diagnostica el problema.
- No propone ideas.
- No evalua competidores todavia.
- No mezcla memoria de empresas distintas.
- No permite avanzar a Diagnostico si el Registro contractual esta incompleto.

## Diagnostico

Proposito: reinterpretar lo que declara el perfil y encontrar el reto real, no solo el problema que el usuario cree tener.

Desde esta fase comienza la funcion de IA. La IA debe hacer las preguntas correctas segun la empresa, la categoria, la memoria disponible y lo que el usuario declare como problema o reto.

Reglas:

- No aceptar la lectura inicial del usuario como diagnostico final.
- Tratar el problema declarado como hipotesis de entrada.
- Separar sintoma visible, lectura declarada, mecanismo causal probable y reto estrategico.
- Si falta evidencia, bajar confianza o preguntar; no inventar.
- Hacer preguntas adaptativas segun las respuestas, no un cuestionario fijo.
- No repetir preguntas ya respondidas.
- Usar maximo 15 preguntas de contexto antes de cerrar o declarar datos faltantes.
- Cerrar despues de suficiente contexto.
- Detectar si faltan piezas criticas antes de cerrar.
- Bloquear cierre antes de 15 preguntas si faltan piezas criticas: metrica, restriccion, intentos previos, tension interna, decision trabada o cambio esperado.
- Modificar la ruta de preguntas segun el problema, reto, aclaraciones o preguntas directas del usuario.
- Si el usuario corrige algo, responder esa correccion antes de avanzar.
- Si el usuario corrige una seccion, la IA debe reinterpretar esa parte y recomponer el diagnostico.
- El diagnostico debe producir una recomendacion experta, no una descripcion complaciente.
- El diagnostico debe entregar criterio experto: el reto real que conviene trabajar, no una repeticion del sintoma.
- La plataforma no existe para darle la razon al usuario.
- La plataforma no debe ser optimista, alentadora ni tranquilizadora por defecto.
- La plataforma debe entregar verdades incomodas que el perfil puede saber pero no estar asumiendo.
- La IA debe contrastar la lectura declarada contra evidencias, tensiones, omisiones, intentos previos y restricciones.
- Si el usuario nombra una causa amplia como cultura, ventas, comunicacion o liderazgo, debe tratarla como etiqueta provisional hasta identificar el mecanismo real.
- La respuesta debe mantener los mismos campos de resultado y ser breve, directa y con criterio. No debe agregar secciones nuevas ni extenderse para sonar convincente.
- El brief debe dejar lista la ideacion y bloquear ideas genericas.

Complemento para preguntas:

- Intentos previos.
- Tensiones internas.
- Decision trabada.
- Cambio esperado.

Input:

- Perfil/licencia.
- Datos de empresa.
- Datos de categoria.
- Competidores.
- Ubicacion/paises.
- Notas de categoria.
- Documentos cargados por el perfil.
- Mensajes del dialogo de diagnostico.
- Aclaraciones del usuario o preguntas directas durante el dialogo.
- Memoria compartida de la empresa, si existe.
- Aprendizajes de ciclos anteriores.
- Secciones que el usuario corrija o aclare.

Output:

- Reto recomendado.
- Por que ese reto es mas correcto que la lectura inicial.
- Sintomas.
- Causas.
- Tensiones.
- Metricas.
- Restricciones.
- Que no conviene atacar todavia.
- Supuesto a cuestionar.
- Brief para ideacion.

Regla de aclaracion del resultado:

- El perfil puede pedir aclarar campos especificos del resultado sin reiniciar el diagnostico.
- Los campos aclarables son: sintomas, causas, tensiones, metricas, restricciones y que no conviene atacar todavia.
- Al aclarar un campo, la plataforma debe volver a activar el dialogo solo para recoger evidencia o correccion sobre ese campo.
- La respuesta del perfil se guarda como correccion de seccion, no como conclusion automatica.
- La IA debe reinterpretar el diagnostico completo con esa nueva evidencia y mantener los mismos 10 campos de output.
- La reinterpretacion no debe limitarse a editar el campo aclarado si la nueva evidencia afecta reto, causas, tensiones, metricas, restricciones o brief.
- La reinterpretacion debe devolver un resumen breve de que cambio y que no cambio.
- El handoff a Ideacion debe usar la ultima version del diagnostico y contener detonadores desde causas/tensiones, senales negativas desde lo que no conviene atacar y memoria disponible del ciclo/empresa.

## Senales

Proposito: consultar senales publicas reales para contrastar Registro y Diagnostico contra mercado, categoria y competidores. Senales no diagnostica de nuevo y no propone ideas; convierte evidencia externa en gaps e insights usables para Ideacion.

Input:

- Registro completo:
  - perfil/licencia
  - empresa
  - categoria
  - competidores declarados
  - paises/regiones
  - canales
  - documentos extraidos
- Diagnostico cerrado:
  - reto recomendado
  - sintomas
  - causas
  - tensiones
  - metricas
  - restricciones
  - que no conviene atacar todavia
  - supuesto a cuestionar
  - brief para ideacion
- Handoff desde Diagnostico.
- Memoria de empresa si existe.
- Fuentes publicas consultables.
- Profundidad de busqueda: `standard`.

Output visible:

- 2 gaps priorizados para Ideacion.
- 2 insights priorizados para Ideacion.
- Analisis de soporte por social listening, tendencias y competidores.
- Aprendizajes o memoria de otros ciclos/perfiles asociados a la empresa, si existen.

Output interno:

- Fuentes consultadas.
- Senales base con lente, fuente, URL si existe y nivel de confianza.
- Vacios de evidencia.

Reglas:

- Usar busqueda web real.
- Separar social listening, tendencias y competidores.
- Priorizar fuentes primarias, reguladores, asociaciones, reportes fechados y sitios oficiales.
- Social listening solo cuenta si hay voz textual de usuarios, clientes u operadores.
- Blogs, prensa corporativa y SEO no cuentan como social listening.
- Buscar primero senales negativas: quejas, fricciones, miedos, reclamos, abandono, ratings bajos, costos ocultos y promesas incumplidas.
- No inventar datos, fuentes, URLs, competidores ni comportamientos.
- Una tendencia positiva no es gap por si sola.
- Un gap exige contradiccion o friccion no resuelta.
- Un insight debe ser una verdad accionable, no un resumen.
- La sintesis final debe entregar exactamente 2 gaps y exactamente 2 insights.
- Si la evidencia es debil, no bloquear Ideacion: marcar `evidenceBase` como `indirecta`.
- Un gap debe expresar la diferencia entre estado actual de la empresa y potencial, expectativa o movimiento del mercado.
- Un insight debe revelar comportamiento, motivacion, miedo o deseo del cliente/comprador declarado.
- No se permite entregar como gap o insight una parafrasis de causas internas ya declaradas en Diagnostico.
- Competidores deben analizar promesa visible versus friccion evidenciada.
- No convertir todo en oportunidad optimista.
- Si el mercado contradice al usuario o debilita el Diagnostico, decirlo.

Metodo:

- Ejecutar busquedas reales y explicitas por lente: social listening, tendencias, competidores y customer insight.
- Social listening, tendencias y competidores alimentan principalmente gaps.
- Customer insight alimenta insights y busca motivaciones, deseos, verdades incomodas, riesgos politicos, miedo reputacional, criterios de compra, aversion al cambio, necesidad de control y rituales de decision del comprador declarado.
- Cada busqueda debe ser agresiva y orientada a fricciones, contradicciones, senales negativas o motivaciones ocultas del comprador.
- Extraer maximo 5 evidencias textuales por lente.
- Rankear evidencias por utilidad para Ideacion.
- Sintetizar exactamente 2 gaps desde evidencia de mercado y exactamente 2 insights desde evidencia del comprador.

## Ideacion

Input: pendiente de definir.

Output: pendiente de definir.

## Prototipado

Input: pendiente de definir.

Output: pendiente de definir.

## Testeo

Input: pendiente de definir.

Output: pendiente de definir.

## Playbook

Input: pendiente de definir.

Output: pendiente de definir.

## Terminos Prohibidos En Este Contrato Inicial

- M0, M1, M2, M3
- pilares
- palancas
- paquetes
- score
- gate numerico heredado
- semaforo heredado
- entidades tecnicas heredadas del repo anterior
