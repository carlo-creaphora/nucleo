# Nucleo

Repositorio limpio para definir y construir Nucleo desde cero.

Este repo no importa codigo, modelos, endpoints, documentos ni reglas del proyecto anterior. La fuente de verdad inicial es el contrato de input/output por fase.

## Registro Y Diagnostico

Las primeras fases funcionales implementadas son Registro y Diagnostico:

- API de Registro en `/api/registration`.
- Output contractual de Registro: contexto para Diagnostico, informacion de categoria y marco competitivo.
- Carga de documentos de demo con extraccion de texto para TXT, MD, CSV, JSON, HTML, PDF con texto, DOCX y XLSX.
- API HTTP en `/api/diagnosis/*`.
- Prompt y reglas limpias basadas en `contracts/phase-io.md`.
- Schema estricto para los 10 outputs contratados.
- Maximo 15 preguntas de contexto.
- Reinterpretacion cuando el usuario corrige una seccion.
- Persistencia por ciclo, licencia y empresa en Postgres si `DATABASE_URL` existe; fallback local para desarrollo.
- Versionado de diagnosticos y auditoria por ciclo.
- Memoria demo derivada de ciclos previos de la misma empresa.
- Handoff formal hacia Ideacion en `/api/diagnosis/cycles/:cycleId/ideation-input`.
- Pruebas automatizadas.

## Desarrollo

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm dev
```

Variables:

```bash
cp .env.example .env
```

Para usar IA real, configurar `OPENAI_API_KEY`. Para pruebas locales sin IA real, usar `NUCLEO_FAKE_AI=true`.

Documentacion de endpoints:

- `docs/diagnosis-api.md`
