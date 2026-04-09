#!/usr/bin/env node
/**
 * Registra el webhook de Telegram para Noé.
 *
 * Uso:
 *   1. Asegúrate de tener en .env.local:
 *        TELEGRAM_BOT_TOKEN
 *        TELEGRAM_WEBHOOK_SECRET
 *        TELEGRAM_WEBHOOK_URL   (p.ej. https://clinica-arca.vercel.app/api/telegram/webhook)
 *   2. Ejecuta:
 *        node scripts/register-telegram-webhook.mjs
 *
 * Para eliminar el webhook (vuelta a polling o pausa):
 *        node scripts/register-telegram-webhook.mjs --delete
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Cargar .env.local manualmente (sin dependencias)
try {
  const envFile = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of envFile.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
} catch {
  // .env.local opcional, también se puede pasar via export
}

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const url = process.env.TELEGRAM_WEBHOOK_URL;

if (!token) {
  console.error("❌ TELEGRAM_BOT_TOKEN no está definido.");
  process.exit(1);
}

const shouldDelete = process.argv.includes("--delete");

if (shouldDelete) {
  const res = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, {
    method: "POST",
  });
  const data = await res.json();
  console.log(data.ok ? "✅ Webhook eliminado" : `❌ ${JSON.stringify(data)}`);
  process.exit(data.ok ? 0 : 1);
}

if (!secret || !url) {
  console.error("❌ Necesitas TELEGRAM_WEBHOOK_SECRET y TELEGRAM_WEBHOOK_URL.");
  process.exit(1);
}

const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url,
    secret_token: secret,
    allowed_updates: ["message"],
    drop_pending_updates: true,
  }),
});
const data = await res.json();

if (data.ok) {
  console.log(`✅ Webhook registrado: ${url}`);
  // Verificar
  const info = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`).then((r) => r.json());
  console.log("ℹ️  getWebhookInfo:", JSON.stringify(info.result, null, 2));
} else {
  console.error("❌", JSON.stringify(data, null, 2));
  process.exit(1);
}
