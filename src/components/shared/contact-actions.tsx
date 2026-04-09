"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useAIChatStore } from "@/stores/ai-chat.store";

/**
 * Acciones de contacto del card "Hablemos" en /ubicacion.
 * - "Dialoga con Noé": abre el chat flotante (useAIChatStore.open()).
 * - Teléfono: solo informativo (no es link tel:, no abre app externa).
 */
export function ContactActions() {
  const openChat = useAIChatStore((s) => s.open);

  return (
    <div className="flex flex-col gap-3">
      <Button
        variant="primary"
        onClick={openChat}
        className="w-full bg-gradient-to-r from-primary to-primary-container py-3.5 shadow-md"
      >
        <Icon name="smart_toy" />
        Dialoga con nuestro asistente Noé 24/7
      </Button>
      <div className="w-full py-3.5 px-6 rounded-lg bg-surface-container-high text-on-surface-variant font-medium flex items-center justify-center gap-2">
        <Icon name="call" className="text-primary" />
        <span>Recepción:</span>
        <span className="font-bold text-on-surface">985 289 689</span>
      </div>
    </div>
  );
}
