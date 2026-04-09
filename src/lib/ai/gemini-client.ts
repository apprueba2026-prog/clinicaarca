import "server-only";
import {
  GoogleGenerativeAI,
  type GenerativeModel,
} from "@google/generative-ai";
import { buildAssistantSystemPrompt } from "./prompts";
import { ASSISTANT_TOOL_DECLARATIONS, todayLimaFormatted } from "./tools";

/**
 * Modelo de Gemini a usar.
 *
 * Modelos verificados al 2026-04-07:
 * - gemini-2.5-flash-lite → ✅ funciona, free tier más generoso (recomendado dev)
 * - gemini-2.5-flash      → ✅ funciona pero free tier solo 20 req/día
 * - gemini-2.0-flash      → ⚠️ free tier muy limitado
 * - gemini-2.0-flash-exp  → ❌ DESCONTINUADO (404)
 * - gemini-1.5-flash      → ❌ DESCONTINUADO (404)
 *
 * Cuando "gemini-3-flash" tenga GA con SDK público, cambiar aquí.
 * En producción con billing activo, considerar gemini-2.5-flash (mejor calidad).
 */
export const GEMINI_MODEL = "gemini-2.5-flash";

let _client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (_client) return _client;

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_GENERATIVE_AI_API_KEY no está configurada. Añádela a .env.local"
    );
  }

  _client = new GoogleGenerativeAI(apiKey);
  return _client;
}

/**
 * Devuelve el modelo de Gemini configurado para Noé (asistente de Clínica Arca)
 * con tools (function calling) y system instruction.
 *
 * El system prompt se construye dinámicamente con la fecha actual de Lima
 * para que el modelo siempre tenga contexto temporal correcto.
 */
export function getAssistantModel(): GenerativeModel {
  const todayISO = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
  }).format(new Date());

  return getClient().getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: buildAssistantSystemPrompt({
      todayFormatted: todayLimaFormatted(),
      todayISO,
    }),
    tools: [{ functionDeclarations: ASSISTANT_TOOL_DECLARATIONS }],
    generationConfig: {
      temperature: 0.4,
      // ⚠️ Importante: no bajar de 4096. Gemini Flash trunca la generación
      // de function calls a media argumentación si el límite es bajo,
      // lo que produce finishReason MALFORMED_FUNCTION_CALL sin texto ni calls.
      maxOutputTokens: 4096,
    },
  });
}
