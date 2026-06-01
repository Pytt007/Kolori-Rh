import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { OFFER_STATUS_LABELS, displayName, fetchProfilesByIds, type ProfileLite } from "@/lib/recruiter";
import { APPLICATION_STATUS_LABELS } from "@/lib/candidate";
import { OfferForm, serializeOffer } from "@/components/site/OfferForm";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/recruteur/offres/$offerId")({
  component: EditOffre,
});

type Offer = {
  id: string;
  titre: string;
  description: string;
  contrat: string;
  secteur: string | null;
  localisation: string | null;
  teletravail: string | null;
  salaire_min: number | null;
  salaire_max: number | null;
  competences_requises: string[] | null;
  statut: string;
};

type App = {
  id: string;
  statut: string;
  created_at: string;
  candidate: { id: string; user_id: string; titre: string | null; ville: string | null } | null;
};

function EditOffre() {
  const { offerId } = Route.useParams();
  const navigate = useNavigate();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [apps, setApps] = useState<App[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [loading, setLoading] = useState(true);

  async function load() {
    const mockUserStr = typeof window !== "undefined" ? localStorage.getItem("mock_auth_user") : null;
    const isMock = mockUserStr ? JSON.parse(mockUserStr).id === "mock-recruiter-1" : false;

    if (isMock) {
      const { getMockJobOffers, getMockApplications } = await import("@/lib/mockData");
      const offers = getMockJobOffers();
      const match = offers.find((o) => o.id === offerId);
      if (match) {
        setOffer({
          ...match,
          competences_requises: match.competences_requises ? match.competences_requises.split(",").map(c => c.trim()) : null,
          teletravail: match.teletravail ? "oui" : "non"
        } as any);
        const allApps = getMockApplications();
        const matchApps = allApps.filter((a) => a.offer_id === offerId);
        const formattedApps: App[] = matchApps.map((a) => ({
          id: a.id,
          statut: a.statut,
          created_at: a.created_at,
          candidate: {
            id: a.candidate_id,
            user_id: a.candidate_id,
            titre: "Directeur des Ressources Humaines",
            ville: "Abidjan"
          }
        }));
        setApps(formattedApps);
        setProfiles({
          "mock-candidate-1": {
            id: "mock-candidate-1",
            prenom: "Koffi",
            nom: "Anan",
            telephone: "+225 07 08 09 10 11"
          }
        });
      }
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase.from("job_offers").select("*").eq("id", offerId).maybeSingle();
      setOffer(data as Offer | null);
      const { data: a } = await supabase
        .from("applications")
        .select("id, statut, created_at, candidate:candidates(id, user_id, titre, ville)")
        .eq("offer_id", offerId)
        .order("created_at", { ascending: false });
      const list = (a as unknown as App[]) ?? [];
      setApps(list);
      setProfiles(await fetchProfilesByIds(list.map((x) => x.candidate?.user_id).filter(Boolean) as string[]));
    } catch (e) {
      console.warn("Failed to load offer from Supabase, trying mock fallback:", e);
      const { getMockJobOffers, getMockApplications } = await import("@/lib/mockData");
      const offers = getMockJobOffers();
      const match = offers.find((o) => o.id === offerId);
      if (match) {
        setOffer({
          ...match,
          competences_requises: match.competences_requises ? match.competences_requises.split(",").map(c => c.trim()) : null,
          teletravail: match.teletravail ? "oui" : "non"
        } as any);
        const allApps = getMockApplications();
        const matchApps = allApps.filter((a) => a.offer_id === offerId);
        const formattedApps: App[] = matchApps.map((a) => ({
          id: a.id,
          statut: a.statut,
          created_at: a.created_at,
          candidate: {
            id: a.candidate_id,
            user_id: a.candidate_id,
            titre: "Directeur des Ressources Humaines",
            ville: "Abidjan"
          }
        }));
        setApps(formattedApps);
        setProfiles({
          "mock-candidate-1": {
            id: "mock-candidate-1",
            prenom: "Koffi",
            nom: "Anan",
            telephone: "+225 07 08 09 10 11"
          }
        });
      }
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [offerId]);

  async function deleteOffer() {
    if (!confirm("Supprimer cette offre ? Cette action est définitive.")) return;
    const mockUserStr = typeof window !== "undefined" ? localStorage.getItem("mock_auth_user") : null;
    const isMock = mockUserStr ? JSON.parse(mockUserStr).id === "mock-recruiter-1" : false;
    if (isMock) {
      const { getMockJobOffers } = await import("@/lib/mockData");
      const list = getMockJobOffers().filter((o) => o.id !== offerId);
      localStorage.setItem("mock_job_offers", JSON.stringify(list));
      toast.success("Offre supprimée (simulation).");
      navigate({ to: "/recruteur/offres" });
      return;
    }
    const { error } = await supabase.from("job_offers").delete().eq("id", offerId);
    if (error) { toast.error(error.message); return; }
    toast.success("Offre supprimée.");
    navigate({ to: "/recruteur/offres" });
  }

  if (loading) return <div className="text-sm font-mono text-muted-foreground">Chargement…</div>;
  if (!offer) return <div>Offre introuvable.</div>;

  const s = OFFER_STATUS_LABELS[offer.statut];

  return (
    <>
      <Link to="/recruteur/offres" className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-primary">← Retour aux offres</Link>
      <div className="flex items-end justify-between mt-3 mb-10 flex-wrap gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Édition</div>
          <h1 className="font-display italic text-5xl">{offer.titre}</h1>
        </div>
        <span className={`text-xs font-mono uppercase tracking-widest px-2 py-1 rounded-sm ${s?.tone}`}>{s?.label}</span>
      </div>

      <OfferForm
        submitLabel="Enregistrer"
        initial={{
          titre: offer.titre,
          description: offer.description,
          contrat: offer.contrat as never,
          secteur: offer.secteur ?? "",
          localisation: offer.localisation ?? "",
          teletravail: offer.teletravail ?? "",
          salaire_min: offer.salaire_min?.toString() ?? "",
          salaire_max: offer.salaire_max?.toString() ?? "",
          competences_requises: (offer.competences_requises ?? []).join(", "),
        }}
        onSubmit={async (v) => {
          const mockUserStr = typeof window !== "undefined" ? localStorage.getItem("mock_auth_user") : null;
          const isMock = mockUserStr ? JSON.parse(mockUserStr).id === "mock-recruiter-1" : false;
          if (isMock) {
            const { getMockJobOffers, saveMockJobOffer } = await import("@/lib/mockData");
            const offers = getMockJobOffers();
            const match = offers.find((o) => o.id === offerId);
            if (match) {
              const updated = {
                ...match,
                ...serializeOffer(v),
              };
              saveMockJobOffer(updated as any);
              toast.success("Offre mise à jour (simulation).");
              load();
            }
            return;
          }
          const { error } = await supabase.from("job_offers").update(serializeOffer(v)).eq("id", offerId);
          if (error) { toast.error(error.message); return; }
          toast.success("Offre mise à jour.");
          load();
        }}
      />

      <div className="mt-10 flex gap-3">
        <Button variant="ghost" onClick={deleteOffer}>Supprimer l'offre</Button>
      </div>

      <div className="mt-16">
        <h2 className="font-display italic text-3xl mb-6">Candidatures ({apps.length})</h2>
        {apps.length === 0 ? (
          <div className="text-sm text-muted-foreground p-6 border border-dashed border-border rounded-sm">Aucune candidature reçue.</div>
        ) : (
          <div className="border border-border rounded-sm divide-y divide-border bg-card">
            {apps.map((a) => {
              const st = APPLICATION_STATUS_LABELS[a.statut] ?? { label: a.statut, tone: "bg-muted" };
              const name = displayName(a.candidate ? profiles[a.candidate.user_id] : null);
              return (
                <Link key={a.id} to="/recruteur/candidatures" className="p-4 flex items-center justify-between gap-4 hover:bg-secondary/40">
                  <div>
                    <div className="font-medium">{name}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {a.candidate?.titre ?? "Profil"} {a.candidate?.ville ? `· ${a.candidate.ville}` : ""} · {new Date(a.created_at).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <span className={`text-xs font-mono uppercase tracking-widest px-2 py-1 rounded-sm ${st.tone}`}>{st.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
