import { supabase } from "@/integrations/supabase/client";

interface AuditLogEntry {
  user_id?: string;
  user_name?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, unknown>;
}

export async function logAudit(entry: AuditLogEntry) {
  try {
    const { error } = await supabase.from("audit_logs").insert([entry]);
    if (error) console.error("Audit log error:", error);
  } catch (e) {
    console.error("Audit log exception:", e);
  }
}
