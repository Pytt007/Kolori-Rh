import { supabase } from "@/integrations/supabase/client";

/** Ensure the current user has a candidate row. Returns the candidate id. */
export async function ensureCandidate(userId: string): Promise<string> {
  // Guard pour tous les utilisateurs mock (mock-candidate-*, mock-recruiter-*, mock-admin-*)
  if (userId.startsWith("mock-")) {
    return userId;
  }
  const { data: existing, error: selErr } = await supabase
    .from("candidates")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (selErr) throw selErr;
  if (existing) return existing.id;

  const { data: inserted, error: insErr } = await supabase
    .from("candidates")
    .insert({ user_id: userId })
    .select("id")
    .single();
  if (insErr) throw insErr;
  return inserted.id;
}

export const APPLICATION_STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  brouillon: { label: "Brouillon", tone: "bg-muted text-muted-foreground" },
  envoyee: { label: "Envoyée", tone: "bg-secondary text-foreground" },
  recue: { label: "Reçue", tone: "bg-accent text-accent-foreground" },
  en_analyse: { label: "En analyse", tone: "bg-primary/10 text-primary" },
  preselectionne: { label: "Présélectionnée", tone: "bg-primary/20 text-primary" },
  entretien: { label: "Entretien", tone: "bg-primary/30 text-primary" },
  retenu: { label: "Retenue", tone: "bg-emerald-100 text-emerald-900" },
  rejete: { label: "Refusée", tone: "bg-destructive/15 text-destructive" },
};
