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
    let userId = entry.user_id;
    let userName = entry.user_name;

    if (!userId || !userName) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = userId || user.id;
        userName = userName || user.user_metadata?.full_name || user.email || "Desconhecido";
      }
    }

    const { error } = await supabase.from("audit_logs").insert([{
      ...entry,
      user_id: userId,
      user_name: userName,
    }]);
    if (error) console.error("Audit log error:", error);
  } catch (e) {
    console.error("Audit log exception:", e);
  }
}
