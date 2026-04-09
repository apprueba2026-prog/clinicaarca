import { NextResponse } from "next/server";
import { type Content, type Part } from "@google/generative-ai";
import { getAssistantModel } from "@/lib/ai/gemini-client";
import { executeToolCall, type ToolContext } from "@/lib/ai/tools";
import { aiConversationService } from "@/lib/services/ai-conversation.service";
import { checkRateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatRequestBody {
  sessionId: string;
  message: string;
}

interface ChatResponse {
  message: string;
  sessionId: string;
  appointmentCreated: boolean;
  patientId?: string;
  awaitingOTP?: boolean;
}

const MAX_ITERATIONS = 8;

export async function POST(request: Request) {
  try {
    // 1. Rate limit (Upstash; degradación graceful en dev)
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    const rl = await checkRateLimit(ip);
    if (!rl.success) {
      return NextResponse.json(
        {
          error:
            "Has hecho muchas consultas seguidas. Espera unos minutos por favor.",
        },
        { status: 429 }
      );
    }

    // 2. Parsear body
    const body = (await request.json()) as ChatRequestBody;
    if (!body.sessionId || !body.message?.trim()) {
      return NextResponse.json(
        { error: "sessionId y message son requeridos" },
        { status: 400 }
      );
    }

    // 3. Cargar/crear conversación + reconstruir history desde BD
    const userAgent = request.headers.get("user-agent") ?? null;
    const { conversation, messages: dbMessages } =
      await aiConversationService.loadOrCreateConversation(
        body.sessionId,
        ip,
        userAgent
      );

    const history = aiConversationService.messagesToGeminiContent(dbMessages);

    // 4. Crear chat session con history persistente
    const model = getAssistantModel();
    const chat = model.startChat({ history });

    // 5. Loop de function calling
    const ctx: ToolContext = { conversationId: conversation.id };
    let appointmentCreated = false;
    let createdAppointmentId: string | null = null;
    let createdPatientId: string | null = null;
    let parts: Part[] | string = body.message;
    const newMessagesToSave: Content[] = [
      { role: "user", parts: [{ text: body.message }] },
    ];
    let totalTokensThisTurn = 0;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const result = await chat.sendMessage(parts);
      const response = result.response;
      const functionCalls = response.functionCalls();
      const text = response.text();
      const finishReason = response.candidates?.[0]?.finishReason;
      totalTokensThisTurn += response.usageMetadata?.totalTokenCount ?? 0;

      // Caso: el modelo trunca la generación de la llamada a tool.
      if (finishReason === "MALFORMED_FUNCTION_CALL" && i < 2) {
        parts =
          "Por favor responde brevemente. Llama solo UNA tool a la vez con argumentos mínimos.";
        continue;
      }

      // Si no hay function calls → texto final
      if (!functionCalls || functionCalls.length === 0) {
        const safeText =
          text && text.trim().length > 0
            ? text
            : "Disculpa, no pude procesar esa solicitud. ¿Puedes reformular o darme más detalles?";

        // Guardar la respuesta del modelo en la BD
        newMessagesToSave.push({
          role: "model",
          parts: [{ text: safeText }],
        });

        await aiConversationService.appendMessages(
          conversation.id,
          newMessagesToSave,
          totalTokensThisTurn
        );

        if (appointmentCreated && createdAppointmentId) {
          await aiConversationService.markCompleted(
            conversation.id,
            createdAppointmentId
          );
        }

        const resp: ChatResponse = {
          message: safeText,
          sessionId: body.sessionId,
          appointmentCreated,
          ...(createdPatientId ? { patientId: createdPatientId } : {}),
        };
        return NextResponse.json(resp);
      }

      // Guardar el turn del modelo (con function calls)
      const modelParts: Part[] = [];
      if (text) modelParts.push({ text });
      for (const fc of functionCalls) {
        modelParts.push({
          functionCall: { name: fc.name, args: fc.args },
        });
      }
      newMessagesToSave.push({ role: "model", parts: modelParts });

      // Ejecutar todas las tools llamadas
      const toolResults: Part[] = [];
      for (const call of functionCalls) {
        const handlerResult = await executeToolCall(call.name, call.args, ctx);

        if (
          call.name === "createAppointment" &&
          (handlerResult as { success?: boolean; appointmentId?: string })
            .success === true
        ) {
          appointmentCreated = true;
          createdAppointmentId =
            (handlerResult as { appointmentId?: string }).appointmentId ?? null;
          createdPatientId =
            (handlerResult as { patientId?: string }).patientId ?? null;
        }

        toolResults.push({
          functionResponse: {
            name: call.name,
            response: handlerResult as object,
          },
        });
      }

      // Guardar las function responses como un turn con role "function"
      // (requerido por @google/generative-ai VALID_PARTS_PER_ROLE)
      newMessagesToSave.push({
        role: "function" as Content["role"],
        parts: toolResults,
      });

      // Próxima iteración: enviar resultados al modelo
      parts = toolResults;
    }

    // Si llegamos aquí, hit MAX_ITERATIONS
    const fallback =
      "Disculpa, esta consulta es compleja. ¿Puedes simplificarla o intentar de nuevo?";
    newMessagesToSave.push({
      role: "model",
      parts: [{ text: fallback }],
    });
    await aiConversationService.appendMessages(
      conversation.id,
      newMessagesToSave,
      totalTokensThisTurn
    );

    return NextResponse.json({
      message: fallback,
      sessionId: body.sessionId,
      appointmentCreated,
    });
  } catch (err) {
    const detail =
      err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error("[AI Chat] Error:", detail);
    if (err instanceof Error && err.stack) console.error(err.stack);

    const message =
      err instanceof Error && err.message.includes("GOOGLE_GENERATIVE_AI_API_KEY")
        ? "El asistente no está configurado. Contacta al administrador."
        : "Disculpa, tuve un problema. Intenta de nuevo en un momento.";
    return NextResponse.json(
      {
        error: message,
        ...(process.env.NODE_ENV !== "production" && { debug: detail }),
      },
      { status: 500 }
    );
  }
}
