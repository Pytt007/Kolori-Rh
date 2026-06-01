import { supabase } from "@/integrations/supabase/client";

export const COMPANY_STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  en_attente: { label: "En attente de validation", tone: "bg-muted text-muted-foreground" },
  validee: { label: "Validée", tone: "bg-emerald-100 text-emerald-900" },
  rejetee: { label: "Refusée", tone: "bg-destructive/15 text-destructive" },
};

export const OFFER_STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  brouillon: { label: "Brouillon", tone: "bg-muted text-muted-foreground" },
  publiee: { label: "Publiée", tone: "bg-primary/15 text-primary" },
  suspendue: { label: "Suspendue", tone: "bg-accent text-accent-foreground" },
  expiree: { label: "Expirée", tone: "bg-destructive/15 text-destructive" },
};

export const CONTRACT_TYPES = ["CDI", "CDD", "Freelance", "Stage", "Alternance"] as const;
export type ContractType = (typeof CONTRACT_TYPES)[number];

export async function getMyCompany(userId: string) {
  if (userId === "mock-recruiter-1") {
    return {
      id: "company-1",
      nom: "Ivory Tech Solutions",
      secteur: "Technologie & Informatique",
      localisation: "Abidjan, Cocody",
      site_web: "https://www.ivorytech.ci",
      description: "Ivory Tech Solutions est un leader de la transformation digitale et des solutions logicielles sur mesure en Afrique de l'Ouest. Nous accompagnons les grandes institutions publiques et privées dans la modernisation de leurs infrastructures technologiques.",
      logo_url: null,
      statut: "validee",
      owner_id: userId
    };
  }
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("owner_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type ProfileLite = { id: string; prenom: string | null; nom: string | null; telephone: string | null };

/** Fetch a map of profile data by user ids (candidates.user_id → profiles.id). */
export async function fetchProfilesByIds(ids: string[]): Promise<Record<string, ProfileLite>> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (unique.length === 0) return {};
  const { data } = await supabase.from("profiles").select("id, prenom, nom, telephone").in("id", unique);
  const map: Record<string, ProfileLite> = {};
  (data ?? []).forEach((p) => { map[p.id] = p as ProfileLite; });
  return map;
}

export function displayName(p: ProfileLite | undefined | null, fallback = "Candidat") {
  if (!p) return fallback;
  const n = [p.prenom, p.nom].filter(Boolean).join(" ").trim();
  return n || fallback;
}
