# Contrato global de persistencia de avance por ciclo

Este contrato aplica a todas las fases de Nucleo, actuales y futuras.

## Regla principal

Todo avance del usuario debe guardarse progresivamente por `cycleId`.

Esta regla aplica a cualquier fase, cualquier accion relevante y cualquier resultado generado, seleccionado, editado o agregado dentro del ciclo.

El estado del ciclo no puede depender de:

- Que la pantalla siga abierta.
- Que React conserve memoria local.
- Que el usuario no actualice el navegador.
- Que el usuario no cierre la pestana.
- Que el usuario no cambie de fase.
- Que la fase no vuelva a cargar desde backend.

Si el usuario cierra la pantalla, actualiza, avanza de fase o regresa a una fase anterior, la plataforma debe recuperar el avance guardado del ciclo activo.

La persistencia no es una mejora opcional de UX. Es una regla estructural del producto.

## Que se debe guardar

Cada fase debe persistir todos los avances relevantes del usuario y del sistema.

Incluye, sin limitarse a:

- Registro guardado.
- Conversacion progresiva de Diagnostico.
- Diagnostico cerrado y reto recomendado.
- Senales generadas.
- Selecciones realizadas por el usuario.
- Resultados generados por IA.
- Contenido agregado manualmente por el usuario.
- Ediciones realizadas por el usuario.
- Estados de seleccion, confirmacion o descarte.
- Evaluaciones, puntajes y ganador seleccionado.
- Prototipos, rutas, artefactos y campos editados.
- Resultados de prueba.
- Lectura de evidencia y decision metodologica.
- Playbook y memoria de ciclo.

Si una accion cambia lo que el usuario espera encontrar al volver, esa accion debe persistirse.

## Regla de equivalencia entre UI y persistencia

El estado visible para el usuario y el estado persistido del ciclo deben converger.

Si una accion actualiza el estado local de la UI, esa misma accion debe tener una estrategia de persistencia por `cycleId`.

No es valido guardar solo en memoria React un avance que el usuario considera parte de su trabajo.

Ejemplos de avances que no pueden vivir solo en estado local:

- Una idea manual agregada en el canvas.
- Una idea editada.
- Una idea marcada o desmarcada para evaluacion.
- Una seleccion de ruta, gap o insight.
- Un puntaje cambiado.
- Un campo de prototipo escrito por el usuario.
- Una decision de lectura de evidencia.
- Una aclaracion de diagnostico.

## Responsabilidad de cada fase

Cada fase debe cumplir tres responsabilidades:

1. Cargar
   - Al entrar a la fase, debe recuperar el estado guardado por `cycleId`.
   - Si ya hay estado local vigente, puede usarlo, pero debe ser compatible con lo guardado.

2. Persistir
   - Cada avance relevante debe guardarse en backend o en el mecanismo persistente definido para esa fase.
   - La persistencia debe ocurrir sin exigir que el usuario complete toda la fase.

3. Restaurar
   - Si el usuario vuelve, recarga o pierde estado local, la fase debe reconstruirse desde el estado persistido.

Una fase no cumple el contrato si solo guarda lo generado por IA pero no lo agregado, editado o seleccionado por el usuario.

## Diagnostico

Diagnostico tiene dos niveles de persistencia:

1. Draft progresivo
   - Guarda mensajes, aclaraciones, ultima pregunta y composer.
   - Sirve para recuperar una conversacion abierta si el usuario cierra o actualiza.

2. Diagnostico cerrado
   - Guarda el resultado contractual, incluido `recommendedChallenge`.
   - Sirve para que el reto no desaparezca al avanzar de fase, recargar o regresar.

Una vez que el diagnostico cierra, el reto recomendado debe considerarse parte del estado persistido del ciclo.

## Ideacion

Ideacion debe persistir tanto ideas generadas por IA como ideas creadas o modificadas por el usuario.

Debe guardarse:

- Seleccion de ruta, gap e insight.
- Sets de ideacion.
- Ideas generadas por IA.
- Ideas manuales agregadas por el usuario.
- Ediciones sobre cualquier idea.
- Estado `selectedForEvaluation`.

No basta con persistir el resultado de `generateIdeation`. Cualquier accion posterior del usuario sobre el canvas tambien debe persistirse por `cycleId`.

## Recuperacion

Al entrar a una fase, la plataforma debe:

- Revisar si ya existe estado local en memoria.
- Si no existe, consultar el backend por `cycleId`.
- Restaurar el estado guardado antes de bloquear acciones por falta de contexto.

Ejemplo: si el usuario entra a Senales y `diagnosis` no existe en memoria React, la fase debe intentar recuperar el Diagnostico cerrado del ciclo antes de decir que falta confirmar Diagnostico.

La misma regla aplica a todas las fases posteriores. Si una fase necesita ideas, prototipo, resultados o playbook, debe intentar recuperar ese avance antes de asumir que no existe.

## Limpieza

El avance del espacio de trabajo activo solo se limpia cuando el usuario inicia un nuevo ciclo.

Iniciar un nuevo ciclo debe:

- Crear un nuevo `cycleId`.
- Limpiar estado local del ciclo anterior.
- Volver a Registro.
- Mantener el ciclo anterior disponible como memoria si fue cerrado.

No se debe limpiar avance por:

- Cambiar de fase.
- Volver a una fase anterior.
- Actualizar navegador.
- Cerrar y abrir pantalla.
- Generar una fase posterior.
- Recargar una fase desde backend.
- Perder estado local de React.

## Principio operativo

Cada fase es responsable de guardar lo que produce, lo que el usuario modifica y lo que la fase necesita para reconstruirse.

El contrato global es: avanzar nunca debe borrar, volver nunca debe perder, refrescar nunca debe reiniciar, y nuevo ciclo es el unico acto que limpia el espacio de trabajo activo.

## Criterios de aceptacion globales

Para cualquier fase, una funcionalidad se considera completa solo si cumple:

- El usuario puede hacer un avance.
- El avance se ve en pantalla.
- El usuario puede cambiar de fase y volver sin perderlo.
- El usuario puede actualizar el navegador y recuperarlo.
- El usuario puede cerrar la pantalla y volver al mismo ciclo sin perderlo.
- El avance se mantiene aunque la fase vuelva a cargar desde backend.
- El avance desaparece del espacio activo solo al iniciar un nuevo ciclo.

Si cualquiera de estos puntos falla, la fase incumple el contrato global de persistencia.
