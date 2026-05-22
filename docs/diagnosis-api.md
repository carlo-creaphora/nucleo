# API De Diagnostico

Base path: `/api`

## POST `/diagnosis/question`

Genera la siguiente pregunta adaptativa de Diagnostico. Si ya existen 15 respuestas de usuario, cierra el diagnostico y devuelve `diagnosis`.

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

## POST `/diagnosis/reinterpret`

Reinterpreta el diagnostico cuando el usuario corrige o aclara una seccion.

Body:

```json
{
  "input": {},
  "previousDiagnosis": {}
}
```

## GET `/diagnosis/cycles/:cycleId`

Consulta un ciclo guardado.

## GET `/companies/:companyId/diagnosis-cycles`

Lista ciclos de diagnostico de una empresa para alimentar memoria compartida sin mezclar empresas.

