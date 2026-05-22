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

No debe hacer:

- No diagnostica el problema.
- No propone ideas.
- No evalua competidores todavia.
- No mezcla memoria de empresas distintas.

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
- Modificar la ruta de preguntas segun el problema, reto, aclaraciones o preguntas directas del usuario.
- Si el usuario corrige algo, responder esa correccion antes de avanzar.
- Si el usuario corrige una seccion, la IA debe reinterpretar esa parte y recomponer el diagnostico.
- El diagnostico debe producir una recomendacion experta, no una descripcion complaciente.
- El diagnostico debe entregar criterio experto: el reto real que conviene trabajar, no una repeticion del sintoma.
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

## Senales

Input: pendiente de definir.

Output: pendiente de definir.

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
