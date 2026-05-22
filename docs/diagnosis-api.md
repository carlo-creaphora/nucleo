# API De Diagnostico

Base path: `/api`

## POST `/registration`

Guarda Registro en persistencia durable cuando `DATABASE_URL` esta configurada. Devuelve:

- `registration.id`
- `registration.output.contextForDiagnosis`
- `registration.output.categoryInformation`
- `registration.output.competitorEvaluationFrame`
- `registration.output.readiness`

Registro no diagnostica, no propone ideas y no evalua competidores todavia.

## POST `/registration/documents`

Recibe documentos del demo como texto extraido, resumen, URL o archivo no soportado. Devuelve documentos normalizados con:

- `id`
- `name`
- `mimeType`
- `sizeBytes`
- `extractionStatus`
- `summary`
- `extractedText`

## GET `/registration/:registrationId`

Consulta un registro guardado.

## POST `/diagnosis/question`

Genera la siguiente pregunta adaptativa de Diagnostico. Si ya existen 15 respuestas de usuario, cierra el diagnostico y devuelve `diagnosis`.
Devuelve `criticalMissing` para mostrar piezas faltantes antes del cierre.

## POST `/diagnosis/complete`

Cierra Diagnostico y devuelve los 10 outputs contratados:

- `recommendedChallenge`
- `whyThisChallenge`
- `symptoms`
- `causes`
- `tensions`
- `metrics`
- `restrictions`
- `notWorthAttackingYet`
- `assumptionToQuestion`
- `ideationBrief`

Si faltan piezas criticas antes de llegar a 15 preguntas, responde `409 diagnosis_not_ready`.

## POST `/diagnosis/reinterpret`

Reinterpreta el diagnostico cuando el usuario corrige o aclara una seccion.
Devuelve `changeSummary` con lo que cambio y lo que no cambio.

Body:

```json
{
  "input": {},
  "previousDiagnosis": {}
}
```

## GET `/diagnosis/cycles/:cycleId`

Consulta un ciclo guardado.

## GET `/diagnosis/cycles/:cycleId/versions`

Lista versiones del diagnostico. Cada cierre o reinterpretacion crea una nueva version.

## GET `/diagnosis/cycles/:cycleId/audit`

Lista eventos de auditoria del ciclo.

## GET `/diagnosis/cycles/:cycleId/ideation-input`

Devuelve el handoff formal hacia Ideacion:

- reto seleccionado
- version de diagnostico
- detonadores desde causas y tensiones
- senales negativas desde `notWorthAttackingYet`
- registro asociado si existe
- memoria derivada de ciclos previos de la misma empresa

## GET `/companies/:companyId/diagnosis-cycles`

Lista ciclos de diagnostico de una empresa para alimentar memoria compartida sin mezclar empresas.

## GET `/companies/:companyId/registrations`

Lista registros guardados de una empresa.
