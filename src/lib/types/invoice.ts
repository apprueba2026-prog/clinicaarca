import type { InvoiceType, PaymentStatus } from "./enums";

export interface Invoice {
  id: string;
  patient_id: string;
  appointment_id: string | null;
  invoice_type: InvoiceType;
  invoice_number: string;
  ruc: string | null;
  business_name: string | null;
  subtotal: number;
  igv: number;
  total: number;
  payment_status: PaymentStatus;
  concept: string | null;
  issued_at: string;
  paid_at: string | null;
  created_by: string | null;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  procedure_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}
