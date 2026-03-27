"use client";

import { Icon } from "@/components/ui/icon";
import type { Invoice } from "@/lib/types/invoice";
import { formatDate } from "@/lib/utils/format-date";
import { formatCurrency } from "@/lib/utils/format-currency";

interface InvoiceCardProps {
  invoice: Invoice;
}

const TYPE_LABEL: Record<string, string> = {
  boleta: "Boleta",
  factura: "Factura",
};

export function InvoiceCard({ invoice }: InvoiceCardProps) {
  const typeLabel = TYPE_LABEL[invoice.invoice_type] ?? "Comprobante";

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-between group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm">
          <Icon name="description" className="text-sky-600" size="sm" />
        </div>
        <div>
          <p className="text-sm font-bold text-on-surface">
            {typeLabel} {invoice.invoice_number}
          </p>
          <p className="text-xs text-slate-500">
            {formatDate(invoice.issued_at)}
            {invoice.concept && ` • ${invoice.concept}`}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-extrabold text-on-surface">
          {formatCurrency(invoice.total)}
        </p>
        <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="text-slate-400 hover:text-sky-600 cursor-pointer">
            <Icon name="picture_as_pdf" size="sm" />
          </button>
          <button className="text-slate-400 hover:text-sky-600 cursor-pointer">
            <Icon name="code" size="sm" />
          </button>
        </div>
      </div>
    </div>
  );
}
