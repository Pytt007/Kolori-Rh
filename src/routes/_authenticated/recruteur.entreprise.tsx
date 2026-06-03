import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { COMPANY_STATUS_LABELS } from "@/lib/recruiter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/recruteur/entreprise")({
  component: RecruteurEntreprise,
});

type Form = {
  nom: string;
  secteur: string;
  localisation: string;
  site_web: string;
  description: string;
  logo_url: string | null;
};

function RecruteurEntreprise() {
  const { user } = useAuth();
  const [id, setId] = useState<string | null>(null);
  const [statut, setStatut] = useState<string>("en_attente");
  const [form, setForm] = useState<Form>({
    nom: "",
    secteur: "",
    localisation: "",
    site_web: "",
    description: "",
    logo_url: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      if (user.id === "mock-recruiter-1") {
        // Pre-fill mock company data
        setId("company-1");
        setStatut("validee");
        const savedLogo = localStorage.getItem("mock_recruiter_logo") || null;
        setForm({
          nom: localStorage.getItem("mock_recruiter_nom") || "Ivory Tech Solutions",
          secteur: localStorage.getItem("mock_recruiter_secteur") || "Technologie & Informatique",
          localisation: localStorage.getItem("mock_recruiter_localisation") || "Abidjan, Cocody",
          site_web: localStorage.getItem("mock_recruiter_site_web") || "https://www.ivorytech.ci",
          description:
            localStorage.getItem("mock_recruiter_description") ||
            "Ivory Tech Solutions est un leader de la transformation digitale et des solutions logicielles sur mesure en Afrique de l'Ouest. Nous accompagnons les grandes institutions publiques et privées dans la modernisation de leurs infrastructures technologiques.",
          logo_url: savedLogo,
        });
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from("companies")
          .select("*")
          .eq("owner_id", user.id)
          .maybeSingle();
        if (data) {
          setId(data.id);
          setStatut(data.statut);
          setForm({
            nom: data.nom ?? "",
            secteur: data.secteur ?? "",
            localisation: data.localisation ?? "",
            site_web: data.site_web ?? "",
            description: data.description ?? "",
            logo_url: data.logo_url ?? null,
          });
        }
      } catch (err) {
        console.warn("Failed to load company data:", err);
      }
      setLoading(false);
    })();
  }, [user]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    // Handle mock mode
    if (user.id === "mock-recruiter-1") {
      localStorage.setItem("mock_recruiter_nom", form.nom);
      localStorage.setItem("mock_recruiter_secteur", form.secteur);
      localStorage.setItem("mock_recruiter_localisation", form.localisation);
      localStorage.setItem("mock_recruiter_site_web", form.site_web);
      localStorage.setItem("mock_recruiter_description", form.description);
      window.dispatchEvent(new Event("profile-updated"));
      toast.success("Fiche mise à jour (Mode Démo).");
      return;
    }

    setSaving(true);
    const payload = {
      nom: form.nom,
      secteur: form.secteur || null,
      localisation: form.localisation || null,
      site_web: form.site_web || null,
      description: form.description || null,
      logo_url: form.logo_url,
      owner_id: user.id,
    };
    const { error } = id
      ? await supabase.from("companies").update(payload).eq("id", id)
      : await supabase.from("companies").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(id ? "Fiche mise à jour." : "Fiche envoyée pour validation.");
    if (!id) {
      const { data } = await supabase
        .from("companies")
        .select("id, statut")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (data) {
        setId(data.id);
        setStatut(data.statut);
      }
    }
  }

  async function uploadLogo(file: File) {
    if (!user) return;
    if (user.id === "mock-recruiter-1") {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setForm((f) => ({ ...f, logo_url: result }));
        localStorage.setItem("mock_recruiter_logo", result);
        window.dispatchEvent(new Event("profile-updated"));
        toast.success("Logo mis à jour (Mode Démo).");
      };
      reader.readAsDataURL(file);
      return;
    }
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("company_logos")
      .upload(path, file, { upsert: true });
    if (error) {
      toast.error(error.message);
      return;
    }
    const { data } = supabase.storage.from("company_logos").getPublicUrl(path);
    setForm((f) => ({ ...f, logo_url: data.publicUrl }));
    window.dispatchEvent(new Event("profile-updated"));
    toast.success("Logo téléversé.");
  }

  if (loading) return <div className="text-sm font-mono text-muted-foreground">Chargement…</div>;

  return (
    <>
      <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
        Identité
      </div>
      <h1 className="font-display italic text-5xl mb-2">Mon entreprise.</h1>
      {id && (
        <div className="mb-8 flex items-center gap-3">
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Statut :
          </span>
          <span
            className={`text-xs font-mono uppercase tracking-widest px-2 py-1 rounded-sm ${COMPANY_STATUS_LABELS[statut]?.tone}`}
          >
            {COMPANY_STATUS_LABELS[statut]?.label}
          </span>
        </div>
      )}
      {!id && (
        <p className="text-muted-foreground mb-8 max-w-2xl">
          Renseignez les informations de votre entreprise. Une fois enregistrées, elles seront
          soumises à validation par notre équipe.
        </p>
      )}

      <form onSubmit={save} className="max-w-2xl space-y-6">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 border border-border bg-secondary rounded-sm flex items-center justify-center overflow-hidden">
            {form.logo_url ? (
              <img src={form.logo_url} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Logo
              </span>
            )}
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])}
            />
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
              Téléverser un logo
            </Button>
            <p className="text-xs text-muted-foreground mt-2">PNG, JPG. Max 2 Mo recommandé.</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nom">Nom de l'entreprise *</Label>
            <Input
              id="nom"
              required
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="secteur">Secteur</Label>
            <Input
              id="secteur"
              value={form.secteur}
              onChange={(e) => setForm({ ...form, secteur: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="localisation">Localisation</Label>
            <Input
              id="localisation"
              value={form.localisation}
              onChange={(e) => setForm({ ...form, localisation: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="site_web">Site web</Label>
            <Input
              id="site_web"
              type="url"
              placeholder="https://"
              value={form.site_web}
              onChange={(e) => setForm({ ...form, site_web: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={6}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? "Enregistrement…" : id ? "Enregistrer" : "Créer la fiche"}
        </Button>
      </form>
    </>
  );
}
