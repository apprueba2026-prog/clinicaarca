import "server-only";
import type { Content } from "@google/generative-ai";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AIConversation {
  id: string;
  session_id: string;
  patient_id: string | null;
  status: "active" | "completed" | "abandoned";
  total_tokens: number;
  estimated_cost_usd: number;
  appointment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIMessageRow {
  id: string;
  conversation_id: string;
  role: "user" | "model" | "function";
  parts: unknown; // JSONB - Content.parts
  tokens: number | null;
  created_at: string;
}

const COLS =
  "id, session_id, patient_id, status, total_tokens, estimated_cost_usd, appointment_id, created_at, updated_at";

// Costo aprox por 1K tokens (gemini-2.5-flash, ajustar si cambia el modelo)
const COST_PER_1K_TOKENS_USD = 0.000125;

export const aiConversationService = {
  /**
   * Carga conversación por session_id (la crea si no existe).
   * Devuelve la conv + mensajes ordenados.
   */
  async loadOrCreateConversation(
    sessionId: string,
    ipAddress: string | null,
    userAgent: string | null
  ): Promise<{ conversation: AIConversation; messages: AIMessageRow[] }> {
    const supabase = createAdminClient();

    // 1. Buscar existente
    const { data: existing } = await supabase
      .from("ai_conversations")
      .select(COLS)
      .eq("session_id", sessionId)
      .maybeSingle();

    let conversation: AIConversation;

    if (existing) {
      conversation = existing as AIConversation;
    } else {
      const { data: created, error } = await supabase
        .from("ai_conversations")
        .insert({
          session_id: sessionId,
          ip_address: ipAddress,
          user_agent: userAgent,
        })
        .select(COLS)
        .single();

      if (error || !created) {
        throw new Error(
          `No se pudo crear conversación: ${error?.message ?? "unknown"}`
        );
      }
      conversation = created as AIConversation;
    }

    // 2. Cargar mensajes
    const { data: messages, error: msgError } = await supabase
      .from("ai_messages")
      .select("id, conversation_id, role, parts, tokens, created_at")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true });

    if (msgError) {
      throw new Error(`Error cargando mensajes: ${msgError.message}`);
    }

    return {
      conversation,
      messages: (messages as AIMessageRow[]) ?? [],
    };
  },

  /**
   * Reconstruye Content[] de Gemini desde rows de ai_messages.
   *
   * IMPORTANTE: el SDK @google/generative-ai exige que los parts tipo
   * `functionResponse` estén en mensajes con role `function` (no `user`).
   * Ver VALID_PARTS_PER_ROLE en node_modules/@google/generative-ai/dist/index.js
   */
  messagesToGeminiContent(messages: AIMessageRow[]): Content[] {
    return messages.map((m) => ({
      // role queda tal cual está en BD: "user" | "model" | "function"
      role: m.role as Content["role"],
      parts: (m.parts as Content["parts"]) ?? [],
    }));
  },

  /**
   * Inserta mensajes nuevos al final de la conversación.
   * Suma tokens y actualiza el costo estimado.
   */
  async appendMessages(
    conversationId: string,
    messages: Content[],
    tokensThisTurn: number
  ): Promise<void> {
    const supabase = createAdminClient();

    if (messages.length > 0) {
      const rows = messages.map((m, idx) => {
        // Detectar si es un mensaje de function responses (todos los parts son functionResponse)
        const isFunctionResponse =
          Array.isArray(m.parts) &&
          m.parts.length > 0 &&
          m.parts.every(
            (p) => typeof p === "object" && p !== null && "functionResponse" in p
          );
        const role: "user" | "model" | "function" = isFunctionResponse
          ? "function"
          : m.role === "model"
            ? "model"
            : "user";
        return {
          conversation_id: conversationId,
          role,
          parts: m.parts,
          tokens: idx === messages.length - 1 ? tokensThisTurn : null,
        };
      });

      const { error } = await supabase.from("ai_messages").insert(rows);
      if (error) {
        throw new Error(`Error guardando mensajes: ${error.message}`);
      }
    }

    if (tokensThisTurn > 0) {
      // RPC sería ideal, pero un UPDATE simple es suficiente para MVP
      const { data: current } = await supabase
        .from("ai_conversations")
        .select("total_tokens, estimated_cost_usd")
        .eq("id", conversationId)
        .single();

      if (current) {
        const newTokens =
          (current.total_tokens as number) + tokensThisTurn;
        const newCost =
          (current.estimated_cost_usd as number) +
          (tokensThisTurn / 1000) * COST_PER_1K_TOKENS_USD;

        await supabase
          .from("ai_conversations")
          .update({
            total_tokens: newTokens,
            estimated_cost_usd: newCost,
          })
          .eq("id", conversationId);
      }
    }
  },

  async markCompleted(
    conversationId: string,
    appointmentId: string
  ): Promise<void> {
    const supabase = createAdminClient();
    await supabase
      .from("ai_conversations")
      .update({ status: "completed", appointment_id: appointmentId })
      .eq("id", conversationId);
  },

  async linkPatient(
    conversationId: string,
    patientId: string
  ): Promise<void> {
    const supabase = createAdminClient();
    await supabase
      .from("ai_conversations")
      .update({ patient_id: patientId })
      .eq("id", conversationId);
  },
};
