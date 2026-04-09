# Arca Assistant — Integración Gemini

Asistente conversacional con Google Gemini + function calling.
Acompaña al visitante en: **discovery → reserva de cita → onboarding del paciente nuevo**.

## Archivos

- `gemini-client.ts` — Singleton del SDK + modelo configurado con tools y system prompt.
- `prompts.ts` — System prompt principal (rol, tono, reglas, flujo).
- `tools.ts` — 6 function declarations + handlers ejecutados server-side, validados con Zod.
- API route: `src/app/api/ai/chat/route.ts` — POST que orquesta el loop de function calling.

## Cambiar a Gemini 3 Flash

Cuando `gemini-3-flash` tenga GA con SDK público:
```ts
// gemini-client.ts
export const GEMINI_MODEL = "gemini-3-flash"; // ← una línea
```

## Añadir nuevas tools

1. Añade un objeto a `ASSISTANT_TOOL_DECLARATIONS` (formato `FunctionDeclaration`).
2. Crea el handler `async function miTool(args: unknown)` validando con Zod.
3. Regístralo en `TOOL_HANDLERS`.
4. Si el modelo debe usarla en un caso específico, menciónalo en `prompts.ts`.

## Features pospuestas (P1)

Documentar para retomar en sesiones futuras:

- **Telegram Bot** — `@ClinicaArcaBot` con webhook + vinculación por código único + tools de mensajería bidireccional.
- **Recordatorio 2h antes** — cron cada 15 min.
- **Post-cita follow-up** — cron 2h después de cita completada → pedir feedback.
- **Recall semestral** — cron mensual → detectar pacientes con última cita >5 meses.
- **Smart scheduling avanzado** — IA rankea slots según patrones históricos (no solo dispone de tiempo libre).
- **Alertas predictivas** — IA analiza patrones de cancelación, demanda creciente, etc.
- **Revenue analytics** — Insights generados por IA para el dashboard admin.

## Variables de entorno

```env
GOOGLE_GENERATIVE_AI_API_KEY=...
```

Obtener en https://aistudio.google.com/apikey
