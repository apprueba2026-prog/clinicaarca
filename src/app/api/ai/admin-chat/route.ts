/**
 * POST /api/ai/admin-chat — Noé Operativo (uso interno staff).
 *
 * Variante admin del chat IA. Diferencias vs /api/ai/chat:
 *  - Solo accesible para staff autenticado (admin/dentist/receptionist).
 *  - Usa prompts-admin.ts (sin OTP, más directo).
 *  - Sin Turnstile (es interno, autenticado por sesión).
 *  - Rate limit por user.id (no IP) y más permisivo.
 */
import { NextResponse } from "next/server";
import { type Content, type Part } from "@google/generative-ai";
import { getAssistantModel } from "@/lib/ai/gemini-client";
import {
  ASSISTANT_TOOL_DECLARATIONS,
  executeToolCall,
  todayLimaFormatted,
  type ToolContext,
} from "@/lib/ai/tools";
import { buildAdminAssistantSystemPrompt } from "@/lib/ai/prompts-admin";
import { aiConversationService } from "@/lib/services/ai-conversation.service";
import { checkRateLimit } from "@/lib/ratelimit";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ITERATIONS = 10;

interface AdminChatBody {
  sessionId: string;
  message: string;
}

export async function POST(request: Request) {
  try {
    // 1. Auth — solo staff
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, is_active, first_name")
      .eq("id", user.id)
      .maybeSingle();
    if (
      !profile ||
      !profile.is_active ||
      !["admin", "dentist", "receptionist"].includes(profile.role)
    ) {
      return NextResponse.json({ error: "Solo staff" }, { status: 403 });
    }

    // 2. Rate limit por user.id
    const rl = await checkRateLimit(`staff:${user.id}`, {
      max: 60,
      windowSeconds: 5 * 60,
    });
    if (!rl.success) {
      return NextResponse.json(
        { error: "Demasiadas consultas. Espera un momento." },
        { status: 429 }
      );
    }

    // 3. Parse body
    const body = (await request.json()) as AdminChatBody;
    if (!body.sessionId || !body.message?.trim()) {
      return NextResponse.json(
        { error: "sessionId y message requeridos" },
        { status: 400 }
      );
    }

    // 4. Cargar / crear conversación
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "staff";
    const ua = request.headers.get("user-agent") ?? null;
    const { conversation, messages: dbMessages } =
      await aiConversationService.loadOrCreateConversation(
        body.sessionId,
        ip,
        ua
      );
    const history = aiConversationService.messagesToGeminiContent(dbMessages);

    // 5. Modelo con system prompt admin
    const todayISO = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Lima",
    }).format(new Date());
    const systemInstruction = buildAdminAssistantSystemPrompt({
      todayFormatted: todayLimaFormatted(),
      todayISO,
      staffFirstName: profile.first_name ?? "staff",
      staffRole: profile.role as "admin" | "dentist" | "receptionist",
    });

    const model = getAssistantModel({
      systemInstruction,
      tools: ASSISTANT_TOOL_DECLARATIONS,
    });
    const chat = model.startChat({ history });

    // 6. Loop function calling
    const ctx: ToolContext = { conversationId: conversation.id };
    let parts: Part[] | string = body.message;
    const toSave: Content[] = [
      { role: "user", parts: [{ text: body.message }] },
    ];
    let totalTokens = 0;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const result = await chat.sendMessage(parts);
      const response = result.response;
      const fnCalls = response.functionCalls();
      const text = response.text();
      totalTokens += response.usageMetadata?.totalTokenCount ?? 0;

      if (!fnCalls || fnCalls.length === 0) {
        const safeText =
          text && text.trim().length > 0
            ? text
            : "No pude procesar esa solicitud, ¿puedes reformularla?";
        toSave.push({ role: "model", parts: [{ text: safeText }] });
        await aiConversationService.appendMessages(
          conversation.id,
          toSave,
          totalTokens
        );
        return NextResponse.json({
          message: safeText,
          sessionId: body.sessionId,
        });
      }

      const modelParts: Part[] = [];
      if (text) modelParts.push({ text });
      for (const fc of fnCalls) {
        modelParts.push({
          functionCall: { name: fc.name, args: fc.args },
        });
      }
      toSave.push({ role: "model", parts: modelParts });

      const toolResults: Part[] = [];
      for (const call of fnCalls) {
        const r = await executeToolCall(call.name, call.args, ctx);
        toolResults.push({
          functionResponse: { name: call.name, response: r as object },
        });
      }
      toSave.push({
        role: "function" as Content["role"],
        parts: toolResults,
      });
      parts = toolResults;
    }

    const fallback =
      "Esta operación es compleja. Intenta dividirla en pasos más pequeños.";
    toSave.push({ role: "model", parts: [{ text: fallback }] });
    await aiConversationService.appendMessages(
      conversation.id,
      toSave,
      totalTokens
    );
    return NextResponse.json({
      message: fallback,
      sessionId: body.sessionId,
    });
  } catch (err) {
    console.error("[AI admin-chat]", err);
    const detail =
      err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    return NextResponse.json(
      {
        error: "Error procesando consulta",
        ...(process.env.NODE_ENV !== "production" && { debug: detail }),
      },
      { status: 500 }
    );
  }
}
