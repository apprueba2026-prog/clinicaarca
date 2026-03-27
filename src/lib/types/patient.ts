import type { PatientStatus } from "./enums";

export interface Patient {
  id: string;
  dni: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  birth_date: string | null;
  address: string | null;
  insurance_partner_id: string | null;
  insurance_policy_number: string | null;
  status: PatientStatus;
  notes: string | null;
  avatar_url: string | null;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}
