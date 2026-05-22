# Nucleo

Repositorio limpio para definir y construir Nucleo desde cero.

Este repo no importa codigo, modelos, endpoints, documentos ni reglas del proyecto anterior. La fuente de verdad inicial es el contrato de input/output por fase.

## Diagnostico

La primera fase funcional implementada es Diagnostico:

- API HTTP en `/api/diagnosis/*`.
- Prompt y reglas limpias basadas en `contracts/phase-io.md`.
- Schema estricto para los 10 outputs contratados.
- Maximo 15 preguntas de contexto.
- Reinterpretacion cuando el usuario corrige una seccion.
- Persistencia por ciclo, licencia y empresa.
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
