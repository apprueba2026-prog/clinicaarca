import { createClient } from "@/lib/supabase/client";
import type { Invoice } from "@/lib/types/invoice";

const INVOICE_COLUMNS =
  "id, patient_id, appointment_id, invoice_type, invoice_number, ruc, business_name, subtotal, igv, total, payment_status, concept, issued_at, paid_at, created_by";

export const invoicesService = {
  async getByPatient(patientId: string): Promise<Invoice[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("invoices")
      .select(INVOICE_COLUMNS)
      .eq("patient_id", patientId)
      .order("issued_at", { ascending: false });

    if (error) throw error;
    return (data as Invoice[]) ?? [];
  },

  async getPatientBalance(patientId: string): Promise<number> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("invoices")
      .select("total, payment_status")
      .eq("patient_id", patientId)
      .in("payment_status", ["pending", "partial", "overdue"]);

    if (error) throw error;
    return (data ?? []).reduce((sum, inv) => sum + (inv.total ?? 0), 0);
  },

  async create(
    invoice: Omit<Invoice, "id" | "invoice_number" | "igv" | "total" | "issued_at" | "paid_at">
  ): Promise<Invoice> {
    const supabase = createClient();
    const igv = invoice.subtotal * 0.18;
    const total = invoice.subtotal + igv;

    const { data, error } = await supabase
      .from("invoices")
      .insert({
        ...invoice,
        igv,
        total,
        payment_status: "pending",
      })
      .select(INVOICE_COLUMNS)
      .single();

    if (error) throw error;
    return data as Invoice;
  },
};
