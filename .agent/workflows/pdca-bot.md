# Flujo PDCA — Cambios en el Arca Assistant

Especialización del [pdca-cycle.md](./pdca-cycle.md) para cuando trabajas en
el bot conversacional. **Aplica este flujo siempre que toques alguno de estos
archivos**:

- `src/lib/ai/*` (gemini-client, prompts, tools)
- `src/app/api/ai/**`
- `src/lib/services/ai-conversation.service.ts`
- `src/lib/services/email-otp.service.ts`
- `src/stores/ai-chat.store.ts`
- `src/components/shared/ai-fab.tsx`, `ai-chat-panel.tsx`

## Por qué este workflow existe

El bot tuvo 8 bugs consecutivos en sus primeras 4 sesiones de iteración.
Cada uno encontrado por el usuario en producción/dev. La causa raíz sistémica:
**no había una capa de regresión automatizada**. Este workflow fuerza un
checkpoint antes de declarar "listo".

---

## PLANIFICAR

1. Lee [bot-test-cases.md](./bot-test-cases.md) y identifica qué casos
   pueden verse afectados por tu cambio.
2. Si vas a corregir un bug que el usuario reportó: revisa si ya hay un caso
   T# que lo cubra. Si no, **planea añadirlo en la fase ACT**.
3. Si vas a refactorizar la arquitectura del bot (cambiar provider, modelo,
   formato del history): planea ejecutar la suite completa antes y después.

## HACER

1. Implementa el cambio.
2. Asegúrate de que el dev server está corriendo (`npm run dev`).
3. Si tu cambio toca `tools.ts` o `prompts.ts`, **trunca las conversaciones
   residuales**: `npm run test:bot:clean` (lo hace automáticamente).

## VERIFICAR

### Obligatorio

```bash
npm run test:bot
```

Debe reportar **8/8 PASS**. Si falla cualquier caso pre-existente, NO
declares el cambio listo. Diagnostica:

- ¿Es un regression real?
- ¿Es flakeo de Gemini? Re-ejecuta una vez. Si vuelve a fallar, es regression.
- ¿La aserción del caso es muy estricta? Ajusta con cuidado, sin perder valor.

### Si añadiste un caso nuevo

```bash
npm run test:bot:clean    # asegúrate de que TODOS pasan
```

### Si tu cambio toca BD (Supabase)

```bash
npm run build              # verifica tipos
```

Y si modificaste tablas: ejecuta la migración contra la BD remota.

## ACTUAR

1. Si descubriste un bug nuevo durante el desarrollo:
   - Añade un caso `T#` a [bot-test-cases.md](./bot-test-cases.md)
   - Implementa la aserción en `scripts/test-bot.mjs`
   - Documenta la lección en la memoria de Claude
     (`feedback_bot_lessons.md`)
2. Si refactorizaste algo no obvio: añade un comentario en el código
   apuntando al caso T# que lo protege.
3. Commit con mensaje claro: `fix(bot): <bug>` o `feat(bot): <feature>`.

---

## Reglas duras

1. **Nunca declares un fix del bot "listo" sin haber ejecutado `npm run test:bot`.**
2. **Cada bug encontrado por el usuario en producción se convierte en un
   caso T#.** Sin excepción. Es la única forma de que la suite crezca y la
   memoria del proyecto se haga más robusta.
3. **No bajes `maxOutputTokens` de 4096** en `gemini-client.ts`. Causa
   `MALFORMED_FUNCTION_CALL`. Documentado en [bot-test-cases.md T8].
4. **Los `functionResponse` parts van en mensajes con role `function`**, no
   `user`. Lo valida el SDK de `@google/generative-ai`. Ver
   `ai-conversation.service.ts` `appendMessages` (detección automática).
5. **El history de Gemini debe empezar con role `user`** o estar vacío. La
   persistencia en BD respeta esto automáticamente.
6. **Siempre inyectar fecha actual de Lima** al system prompt. Ver
   `gemini-client.ts` `getAssistantModel()`. NO usar `new Date().toISOString()`
   directamente — usa `Intl.DateTimeFormat` con `timeZone: "America/Lima"`.

## Anti-patterns

- Probar el bot SOLO en el navegador y declararlo listo
- Tocar `tools.ts` sin correr la suite
- Confiar en que un fix manual aislado no rompió otras cosas
- Esperar a que el usuario encuentre el siguiente bug
