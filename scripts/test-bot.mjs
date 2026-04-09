#!/usr/bin/env node
/**
 * Suite de smoke tests del Arca Assistant.
 *
 * Cada caso (T1-T8) está derivado de un bug histórico real.
 * Si añades un caso nuevo, sincronízalo con .agent/workflows/bot-test-cases.md
 *
 * Uso:
 *   npm run test:bot
 *   npm run test:bot:clean   (trunca ai_conversations antes de correr)
 *
 * Requisitos:
 *   - npm run dev corriendo en localhost:3000
 *   - GOOGLE_GENERATIVE_AI_API_KEY válida en .env.local
 *   - Si --clean: SUPABASE_SERVICE_ROLE_KEY y NEXT_PUBLIC_SUPABASE_URL en .env.local
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ──────────────────────────────────────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────────────────────────────────────

const BASE_URL = process.env.BOT_TEST_BASE_URL ?? "http://localhost:3000";
const ENDPOINT = `${BASE_URL}/api/ai/chat`;
const CLEAN = process.argv.includes("--clean");
const VERBOSE = process.argv.includes("--verbose");

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  bold: "\x1b[1m",
};
const c = (color, s) => `${colors[color]}${s}${colors.reset}`;

function loadEnv() {
  try {
    const content = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
    for (const line of content.split("\n")) {
      if (!line || line.startsWith("#")) continue;
      const idx = line.indexOf("=");
      if (idx > 0) {
        const k = line.slice(0, idx).trim();
        const v = line.slice(idx + 1).trim().replace(/^"|"$/g, "");
        if (!process.env[k]) process.env[k] = v;
      }
    }
  } catch {
    /* .env.local opcional */
  }
}

function newSessionId(prefix = "test") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function chat(sessionId, message, retryOnTransient = true) {
  const send = async () => {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, message }),
    });
    const data = await res.json();
    // Normalizar: si vino error, propagarlo en .data.error y dejar message vacío
    return { status: res.status, data };
  };

  let r = await send();
  // Retry una vez ante 5xx o 429 (errores transitorios: rate limit, Gemini hiccup)
  if (retryOnTransient && (r.status >= 500 || r.status === 429)) {
    await sleep(2000);
    r = await send();
  }

  // Si la respuesta tiene error explícito, lanzar para que el test lo reporte
  if (r.data?.error) {
    const detail = r.data.debug ? ` [debug: ${r.data.debug}]` : "";
    throw new AssertionError(
      `API devolvió error (status ${r.status}): ${r.data.error}${detail}`
    );
  }
  return r;
}

async function verifyServer() {
  try {
    const res = await fetch(BASE_URL, { method: "HEAD" });
    if (!res.ok && res.status !== 405) {
      throw new Error(`Servidor responde ${res.status}`);
    }
  } catch (err) {
    console.error(
      c("red", "✗ Servidor no responde en " + BASE_URL),
      "\n  Asegúrate de que `npm run dev` esté corriendo.\n  Detalle:",
      err.message
    );
    process.exit(2);
  }
}

async function cleanConversations() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.warn(
      c("yellow", "⚠ --clean ignorado: faltan NEXT_PUBLIC_SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY")
    );
    return;
  }
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };
  for (const table of ["ai_messages", "ai_conversations"]) {
    await fetch(`${url}/rest/v1/${table}?id=neq.00000000-0000-0000-0000-000000000000`, {
      method: "DELETE",
      headers,
    });
  }
  // rate_limits no tiene UUID id, usa identifier; borra todos los buckets
  await fetch(`${url}/rest/v1/rate_limits?identifier=neq.__never__`, {
    method: "DELETE",
    headers,
  });
  console.log(c("gray", "✓ Tablas ai_* y rate_limits limpiadas"));
}

// ──────────────────────────────────────────────────────────────────────────────
// Aserciones
// ──────────────────────────────────────────────────────────────────────────────

class AssertionError extends Error {
  constructor(msg) {
    super(msg);
  }
}

function assert(cond, msg) {
  if (!cond) throw new AssertionError(msg);
}

function notEmpty(text, ctx, errorDetail) {
  if (errorDetail) {
    throw new AssertionError(`${ctx}: API devolvió error → ${errorDetail}`);
  }
  assert(typeof text === "string" && text.trim().length > 0, `${ctx}: respuesta vacía`);
}

function notError(text, ctx) {
  assert(
    !/Disculpa.{0,30}problema|tuve un problema/i.test(text),
    `${ctx}: respuesta contiene mensaje de error genérico`
  );
}

function contains(text, regex, ctx) {
  assert(regex.test(text), `${ctx}: no contiene patrón ${regex}`);
}

function notContains(text, regex, ctx) {
  assert(!regex.test(text), `${ctx}: NO debería contener ${regex}`);
}

// ──────────────────────────────────────────────────────────────────────────────
// Casos de prueba (T1-T8)
// ──────────────────────────────────────────────────────────────────────────────

const tests = [
  {
    id: "T1",
    name: "Saludo simple — modelo y history role válidos",
    prevents: "Modelo descontinuado, history role inválido",
    async run() {
      const sid = newSessionId("t1");
      const r = await chat(sid, "hola");
      notEmpty(r.data.message, "T1");
      notError(r.data.message, "T1");
      assert(r.status === 200, `T1: status ${r.status} ≠ 200`);
    },
  },
  {
    id: "T2",
    name: "Multi-turn con contexto persistente",
    prevents: "Bug arquitectónico stateless (bot olvidaba IDs entre turns)",
    async run() {
      const sid = newSessionId("t2");
      const r1 = await chat(sid, "Quiero agendar una cita de odontología general");
      notEmpty(r1.data.message, "T2 turn 1");
      notError(r1.data.message, "T2 turn 1");

      const r2 = await chat(sid, "sí, dime los doctores");
      notEmpty(r2.data.message, "T2 turn 2");
      notError(r2.data.message, "T2 turn 2");
      // El bot no debería volver a preguntar la especialidad — ya la sabe
      notContains(
        r2.data.message,
        /qué especialidad|cuál especialidad|qué tratamiento/i,
        "T2 turn 2 (no debería pedir especialidad otra vez)"
      );
    },
  },
  {
    id: "T3",
    name: "Discovery sin inventar doctores",
    prevents: "Bot inventando nombres de doctores ('Carlos Pérez', 'Ana García')",
    async run() {
      const sid = newSessionId("t3");
      const r1 = await chat(sid, "Quiero agendar cita de odontología general");
      const r2 = await chat(sid, "Sí, muéstrame los doctores disponibles");
      const combined = r1.data.message + " " + r2.data.message;
      notError(combined, "T3");
      // Solo Dra. Sonia existe en la BD seed. Si menciona otro nombre, es invento.
      const inventedNames = /Carlos\s*P[eé]rez|Ana\s*Garc[ií]a|Juan\s*L[oó]pez|Mar[ií]a\s*Gonz[aá]lez/i;
      notContains(combined, inventedNames, "T3 (nombre inventado detectado)");
    },
  },
  {
    id: "T4",
    name: "Slots de día específico (dateFrom)",
    prevents: "getAvailableSlots sesgo al primer día (12 slots TOTALES)",
    async run() {
      const sid = newSessionId("t4");
      // Calcular un día futuro (mañana)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const month = tomorrow.toLocaleDateString("es-PE", {
        month: "long",
      });
      const day = tomorrow.getDate();

      await chat(sid, "Quiero agendar cita de odontología general");
      await chat(sid, "Sí, con cualquier doctor disponible");
      const r = await chat(sid, `Quiero el ${day} de ${month}`);
      notEmpty(r.data.message, "T4");
      notError(r.data.message, "T4");
      // Debe mencionar el día solicitado o devolver alternativas para esa fecha
      assert(
        r.data.message.length > 20,
        "T4: respuesta sospechosamente corta"
      );
    },
  },
  {
    id: "T5",
    name: "Hora específica disponible (preferredTime)",
    prevents: "Bot decía 'no disponible' sin validar la hora real",
    async run() {
      const sid = newSessionId("t5");
      // Día futuro (mañana) + hora específica
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const month = tomorrow.toLocaleDateString("es-PE", {
        month: "long",
      });
      const day = tomorrow.getDate();

      await chat(sid, "Quiero agendar cita de odontología general");
      await chat(sid, "Con la doctora disponible");
      const r = await chat(
        sid,
        `Quiero el ${day} de ${month} a las 11:00 de la mañana`
      );
      notEmpty(r.data.message, "T5");
      notError(r.data.message, "T5");
      // 11am es horario laboral típico → debería estar disponible o el bot debe ofrecer alternativa cercana
      // No debe decir "no hay disponibilidad" sin más
      const flatRefusal =
        /no.{0,15}(hay|tengo).{0,30}(disponibilidad|horario|disponible)/i;
      // Aceptamos refusal SOLO si va seguido de alternativas
      if (flatRefusal.test(r.data.message)) {
        assert(
          /(8:00|8:30|9:00|10:00|10:30|11:30|12:00|alternativ|otro|opci[oó]n)/i.test(
            r.data.message
          ),
          "T5: dice 'no disponible' SIN ofrecer alternativas"
        );
      }
    },
  },
  {
    id: "T6",
    name: "Fecha pasada rechazada",
    prevents: "Bot proponía slots de ayer (sin contexto temporal)",
    async run() {
      const sid = newSessionId("t6");
      await chat(sid, "Quiero agendar cita de odontología general");
      await chat(sid, "Con cualquier doctor");
      // Fecha del año pasado, claramente pasada
      const r = await chat(sid, "Quiero el 1 de enero de 2024");
      notEmpty(r.data.message, "T6");
      notError(r.data.message, "T6");
      // El bot NO debe confirmar una fecha pasada
      notContains(
        r.data.message,
        /confirmo.{0,30}1.{0,5}enero.{0,5}2024|reservado.{0,30}1.{0,5}enero.{0,5}2024/i,
        "T6: confirmó una fecha de 2024"
      );
    },
  },
  {
    id: "T7",
    name: "Info de clínica (getClinicInfo, no inventa)",
    prevents: "Bot inventando datos de clínica (dirección/teléfono/horarios)",
    async run() {
      const sid = newSessionId("t7");
      const r = await chat(sid, "¿Dónde están ubicados?");
      notEmpty(r.data.message, "T7");
      notError(r.data.message, "T7");
      // Debe mencionar Huarochirí o Santa Anita (la dirección REAL en BD)
      contains(
        r.data.message,
        /Huarochir[ií]|Santa\s*Anita/i,
        "T7: no menciona la dirección real"
      );
      // No debe mencionar la dirección vieja inventada
      notContains(
        r.data.message,
        /Javier\s*Prado|Av\.\s*Ejemplo/i,
        "T7: menciona dirección antigua/falsa"
      );
    },
  },
  {
    id: "T8",
    name: "Conversación de varios turnos sin romper",
    prevents: "MAX_ITERATIONS, MALFORMED_FUNCTION_CALL handling",
    async run() {
      const sid = newSessionId("t8");
      const turns = [
        "Hola, tengo dolor de muelas",
        "Sí, quiero agendar",
        "Odontología general está bien",
        "¿Quién está disponible?",
        "Ok, muéstrame horarios para esta semana",
      ];
      for (let i = 0; i < turns.length; i++) {
        const r = await chat(sid, turns[i]);
        assert(r.status === 200, `T8 turn ${i + 1}: status ${r.status}`);
        notEmpty(r.data.message, `T8 turn ${i + 1}`);
        notError(r.data.message, `T8 turn ${i + 1}`);
      }
    },
  },
  {
    id: "T9",
    name: "Eficiencia conversacional: el bot pide datos en grupos",
    prevents:
      "Bot pidiendo nombre/teléfono/email uno por uno → agotar rate limit en 1 reserva",
    async run() {
      const sid = newSessionId("t9");
      // Paciente nuevo intenta reservar. Verificamos que cuando le pidan
      // datos, sea en grupos (nombre+teléfono juntos), no atomizado.
      await chat(sid, "Quiero agendar cita de odontología general");
      await chat(sid, "Con la doctora disponible, mañana");
      // Le damos un slot directamente (asume que el bot va a pedir DNI)
      const r3 = await chat(sid, "El primer horario está bien. Mi DNI es 99999999");
      notEmpty(r3.data.message, "T9 turn 3");

      // El bot no me conoce (DNI ficticio). Debe pedir datos para registrar.
      // ASERCIÓN CLAVE: el siguiente mensaje del bot debe pedir nombre Y
      // teléfono en el MISMO mensaje (regla del prompt).
      const text = r3.data.message.toLowerCase();
      const asksForName = /nombre/.test(text);
      const asksForPhone = /tel[eé]fono|celular/.test(text);

      // Si el bot está en la fase de captura de datos del paciente nuevo,
      // debe pedir nombre Y teléfono juntos. Si solo pide uno, falla.
      if (asksForName || asksForPhone) {
        assert(
          asksForName && asksForPhone,
          `T9: el bot pide datos atomizados (nombre solo o teléfono solo). Mensaje: "${r3.data.message.slice(0, 200)}"`
        );
      }
      // Si el bot está en otra fase (ej. confirmando DNI inválido) está OK.
    },
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// Runner
// ──────────────────────────────────────────────────────────────────────────────

async function main() {
  loadEnv();

  console.log(c("bold", "\n🤖 Arca Assistant — Smoke Tests"));
  console.log(c("gray", `Endpoint: ${ENDPOINT}\n`));

  await verifyServer();
  if (CLEAN) await cleanConversations();

  let pass = 0;
  let fail = 0;
  const failures = [];

  for (let i = 0; i < tests.length; i++) {
    const t = tests[i];
    process.stdout.write(c("cyan", `${t.id} `) + t.name + " ... ");
    const t0 = Date.now();
    try {
      await t.run();
      const dt = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(c("green", `PASS`) + c("gray", ` (${dt}s)`));
      pass++;
    } catch (err) {
      const dt = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(c("red", `FAIL`) + c("gray", ` (${dt}s)`));
      console.log(c("red", `   ↳ ${err.message}`));
      if (VERBOSE && err.stack) console.log(c("gray", err.stack));
      fail++;
      failures.push({ id: t.id, name: t.name, error: err.message });
    }
    // Delay corto entre tests para evitar acumular rate limit / saturar Gemini RPM
    if (i < tests.length - 1) await sleep(500);
  }

  console.log();
  console.log(
    c(
      fail === 0 ? "green" : "red",
      `${fail === 0 ? "✓" : "✗"} ${pass}/${tests.length} pasaron, ${fail} fallaron`
    )
  );

  if (fail > 0) {
    console.log(c("yellow", "\nFallos:"));
    for (const f of failures) {
      console.log(`  ${c("red", f.id)} ${f.name}\n    ${c("gray", f.error)}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(c("red", "Error fatal:"), err);
  process.exit(2);
});
