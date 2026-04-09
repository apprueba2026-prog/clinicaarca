# Catálogo de casos de prueba — Arca Assistant

Cada caso está derivado de un bug histórico real del bot. Si descubres un bug
nuevo, **añade un caso aquí Y en `scripts/test-bot.mjs`** antes de declarar el
fix completo.

Implementación ejecutable: [scripts/test-bot.mjs](../../scripts/test-bot.mjs)

Comando: `npm run test:bot` (o `npm run test:bot:clean` para truncar `ai_*` antes).

---

## T1 — Saludo simple

**Bug que previene**:
- Modelo `gemini-2.0-flash-exp` descontinuado (404)
- History inválido por mensaje welcome con role `model` al inicio

**Pasos**:
1. POST con `message: "hola"` y un `sessionId` nuevo

**Aserciones**:
- `status === 200`
- `message` no vacío
- `message` no contiene "Disculpa, tuve un problema"

---

## T2 — Multi-turn con contexto persistente

**Bug que previene**:
- Bug arquitectónico stateless: el bot olvidaba IDs entre turnos porque cada request creaba un chat session nuevo

**Pasos**:
1. Turn 1: "Quiero agendar una cita de odontología general"
2. Turn 2 (mismo `sessionId`): "sí, dime los doctores"

**Aserciones**:
- Turn 2 NO debe volver a preguntar la especialidad — el bot ya la sabe del turn 1

---

## T3 — Discovery sin inventar doctores

**Bug que previene**:
- Modelo lite (`gemini-2.5-flash-lite`) inventando "Carlos Pérez", "Ana García"
- Cualquier modelo respondiendo sin llamar tools

**Pasos**:
1. "Quiero agendar cita de odontología general"
2. "Sí, muéstrame los doctores disponibles"

**Aserciones**:
- Respuesta combinada NO menciona nombres inventados (`Carlos Pérez`, `Ana García`, `Juan López`, `María González`)
- Solo `Dra. Sonia` existe en el seed

---

## T4 — Slots de día específico (`dateFrom`)

**Bug que previene**:
- `getAvailableSlots` saturaba 12 slots TOTALES con solo el primer día → el bot ignoraba el día específico que pedía el usuario

**Pasos**:
1. "Quiero agendar cita de odontología general"
2. "Sí, con cualquier doctor disponible"
3. "Quiero el {día} de {mes}" (mañana)

**Aserciones**:
- Respuesta no vacía y no error
- Respuesta sustantiva (más de 20 caracteres)

---

## T5 — Hora específica disponible (`preferredTime`)

**Bug que previene**:
- Bot decía "no disponible a las 5pm" sin validar la hora real
- `getAvailableSlots` solo devolvía 3 slots representativos (mañana/medio/tarde) → 17:00 no aparecía

**Pasos**:
1. "Quiero agendar cita de odontología general"
2. "Con la doctora disponible"
3. "Quiero el {día} de {mes} a las 11:00 de la mañana"

**Aserciones**:
- 11am es horario laboral típico → el bot debe confirmar disponibilidad O ofrecer alternativas concretas
- Si dice "no hay disponibilidad" DEBE incluir alternativas (8:00, 8:30, ..., u otro slot real)

---

## T6 — Fecha pasada rechazada

**Bug que previene**:
- Bot proponía slots de ayer porque el system prompt no tenía contexto temporal

**Pasos**:
1. "Quiero agendar cita de odontología general"
2. "Con cualquier doctor"
3. "Quiero el 1 de enero de 2024"

**Aserciones**:
- El bot NO debe confirmar/reservar una fecha del pasado (NO matches `confirmo.*1.*enero.*2024` ni `reservado.*1.*enero.*2024`)

---

## T7 — Info de clínica (`getClinicInfo`)

**Bug que previene**:
- Bot inventando dirección, teléfono, horarios

**Pasos**:
1. "¿Dónde están ubicados?"

**Aserciones**:
- Respuesta menciona `Huarochirí` o `Santa Anita` (dirección REAL en `clinic_settings`)
- NO menciona `Javier Prado` ni `Av. Ejemplo` (direcciones inventadas/viejas)

---

## T8 — Conversación de varios turnos sin romper

**Bug que previene**:
- `MAX_ITERATIONS` hit por loops de tools
- `MALFORMED_FUNCTION_CALL` por `maxOutputTokens` bajo

**Pasos** (5 turns en el mismo `sessionId`):
1. "Hola, tengo dolor de muelas"
2. "Sí, quiero agendar"
3. "Odontología general está bien"
4. "¿Quién está disponible?"
5. "Ok, muéstrame horarios para esta semana"

**Aserciones**:
- Todos los turns devuelven `status === 200`
- Ningún turn devuelve mensaje de error genérico

---

## Cómo añadir un caso nuevo

1. Identificar el bug (síntoma + causa raíz)
2. Añadir entrada `T#` aquí con: nombre, bug que previene, pasos, aserciones
3. Implementar en `scripts/test-bot.mjs` siguiendo el patrón de los existentes
4. Documentar en la memoria de Claude (`feedback_bot_lessons.md`)
5. Ejecutar `npm run test:bot` localmente — DEBE pasar el caso nuevo
6. Commit de `bot-test-cases.md` + `test-bot.mjs` junto con el fix

## T9 — Eficiencia conversacional (datos en grupos)

**Bug que previene**:
- Bot pidiendo nombre, apellido, teléfono y email uno por uno → 4 turns extra → agotar rate limit en una sola reserva

**Pasos**:
1. "Quiero agendar cita de odontología general"
2. "Con la doctora disponible, mañana"
3. "El primer horario está bien. Mi DNI es 99999999" (DNI ficticio = paciente nuevo)

**Aserciones**:
- Cuando el bot pide datos del paciente nuevo, **debe pedir nombre Y teléfono juntos** en el mismo mensaje (NO uno solo).
- Si pide uno sin el otro → fail.

**Notas**:
- DNI 99999999 es ficticio. Si en el futuro existe en BD, cambiar a otro.
- La aserción es tolerante: si el bot está en otra fase (ej. confirmando DNI inválido), no falla.

---

## Casos pospuestos (no implementados aún)

- **T10**: cancelación con DNI (`cancelAppointment`). Requiere crear/limpiar paciente + cita test en cada run.
- **T11**: validación DNI peruano (8 dígitos). Caso unit-test simple, pendiente.
