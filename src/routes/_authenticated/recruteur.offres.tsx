import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { getMyCompany, OFFER_STATUS_LABELS } from "@/lib/recruiter";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/recruteur/offres")({
  component: RecruteurOffres,
});

type Offer = {
  id: string;
  titre: string;
  contrat: string;
  localisation: string | null;
  statut: string;
  created_at: string;
  publiee_le: string | null;
};

function RecruteurOffres() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Offer[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyStatus, setCompanyStatus] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!user) return;
    try {
      const company = await getMyCompany(user.id);
      if (!company) { setLoading(false); return; }
      setCompanyId(company.id);
      setCompanyStatus(company.statut);

      if (user.id === "mock-recruiter-1") {
        const { getMockJobOffers, getMockApplications } = await import("@/lib/mockData");
        const mockOffers = getMockJobOffers().filter((o) => o.company_id === company.id);
        setRows(mockOffers);
        const mockApps = getMockApplications();
        const c: Record<string, number> = {};
        mockApps.forEach((a) => { c[a.offer_id] = (c[a.offer_id] ?? 0) + 1; });
        setCounts(c);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("job_offers")
        .select("id, titre, contrat, localisation, statut, created_at, publiee_le")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const offers = (data ?? []) as Offer[];
      setRows(offers);
      if (offers.length) {
        const { data: apps, error: appsErr } = await supabase
          .from("applications")
          .select("offer_id")
          .in("offer_id", offers.map((o) => o.id));
        if (appsErr) throw appsErr;
        const c: Record<string, number> = {};
        (apps ?? []).forEach((a) => { c[a.offer_id] = (c[a.offer_id] ?? 0) + 1; });
        setCounts(c);
      }
    } catch (e: any) {
      console.warn("Supabase query failed, falling back to mock data:", e);
      const company = await getMyCompany(user.id);
      if (company) {
        const { getMockJobOffers, getMockApplications } = await import("@/lib/mockData");
        const mockOffers = getMockJobOffers().filter((o) => o.company_id === company.id);
        setRows(mockOffers);
        const mockApps = getMockApplications();
        const c: Record<string, number> = {};
        mockApps.forEach((a) => { c[a.offer_id] = (c[a.offer_id] ?? 0) + 1; });
        setCounts(c);
      }
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [user]);

  async function changeStatus(id: string, newStatus: "publiee" | "suspendue" | "brouillon") {
    if (user?.id === "mock-recruiter-1") {
      const { getMockJobOffers, saveMockJobOffer } = await import("@/lib/mockData");
      const mockOffers = getMockJobOffers();
      const offer = mockOffers.find((o) => o.id === id);
      if (offer) {
        offer.statut = newStatus;
        if (newStatus === "publiee") offer.publiee_le = new Date().toISOString();
        saveMockJobOffer(offer);
        toast.success("Offre mise à jour (simulation).");
        load();
      }
      return;
    }
    const payload: { statut: typeof newStatus; publiee_le?: string } = { statut: newStatus };
    if (newStatus === "publiee") payload.publiee_le = new Date().toISOString();
    const { error } = await supabase.from("job_offers").update(payload).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Offre mise à jour.");
    load();
  }

  async function remove(id: string) {
    if (!confirm("Supprimer cette offre ?")) return;
    if (user?.id === "mock-recruiter-1") {
      const { getMockJobOffers } = await import("@/lib/mockData");
      const mockOffers = getMockJobOffers();
      const list = mockOffers.filter((o) => o.id !== id);
      localStorage.setItem("mock_job_offers", JSON.stringify(list));
      toast.success("Offre supprimée (simulation).");
      load();
      return;
    }
    const { error } = await supabase.from("job_offers").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Offre supprimée.");
    load();
  }

  if (loading) return <div className="text-sm font-mono text-muted-foreground">Chargement…</div>;

  if (!companyId) {
    return (
      <>
        <h1 className="font-display italic text-5xl mb-4">Mes offres.</h1>
        <div className="p-6 border border-dashed border-border rounded-sm">
          <p className="mb-3">Vous devez créer votre fiche entreprise avant de publier des offres.</p>
          <Link to="/recruteur/entreprise" className="text-primary underline">Créer ma fiche →</Link>
        </div>
      </>
    );
  }

  const canPublish = companyStatus === "validee";

  return (
    <>
      <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Diffusion</div>
      <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
        <h1 className="font-display italic text-5xl">Mes offres.</h1>
        <Button asChild disabled={!canPublish}>
          <Link to="/recruteur/offres/nouvelle">+ Nouvelle offre</Link>
        </Button>
      </div>

      {!canPublish && (
        <div className="mb-8 p-4 bg-accent text-accent-foreground rounded-sm text-sm">
          Votre entreprise doit être validée par notre équipe avant que vous puissiez créer ou publier des offres.
        </div>
      )}

      {rows.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-border rounded-sm">
          <p className="font-display italic text-2xl mb-2">Aucune offre pour l'instant.</p>
          {canPublish && <Link to="/recruteur/offres/nouvelle" className="text-primary underline text-sm">Créer ma première offre</Link>}
        </div>
      ) : (
        <div className="border border-border rounded-sm divide-y divide-border bg-card">
          {rows.map((o) => {
            const s = OFFER_STATUS_LABELS[o.statut] ?? { label: o.statut, tone: "bg-muted" };
            return (
              <div key={o.id} className="p-5 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[260px]">
                  <Link to="/recruteur/offres/$offerId" params={{ offerId: o.id }} className="font-display italic text-xl hover:text-primary">
                    {o.titre}
                  </Link>
                  <div className="text-xs text-muted-foreground font-mono uppercase tracking-widest mt-1">
                    {o.contrat} {o.localisation ? `· ${o.localisation}` : ""} · {counts[o.id] ?? 0} candidature(s)
                  </div>
                </div>
                <span className={`text-xs font-mono uppercase tracking-widest px-2 py-1 rounded-sm ${s.tone}`}>{s.label}</span>
                {o.statut !== "publiee" && canPublish && (
                  <Button size="sm" variant="outline" onClick={() => changeStatus(o.id, "publiee")}>Publier</Button>
                )}
                {o.statut === "publiee" && (
                  <Button size="sm" variant="outline" onClick={() => changeStatus(o.id, "suspendue")}>Suspendre</Button>
                )}
                <Button asChild size="sm" variant="ghost">
                  <Link to="/recruteur/offres/$offerId" params={{ offerId: o.id }}>Éditer</Link>
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(o.id)}>Supprimer</Button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
