import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { getMyCompany } from "@/lib/recruiter";
import { OfferForm, serializeOffer } from "@/components/site/OfferForm";

export const Route = createFileRoute("/_authenticated/recruteur/offres/nouvelle")({
  component: NouvelleOffre,
});

function NouvelleOffre() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const c = await getMyCompany(user.id);
      if (!c) {
        setBlocked("Vous devez d'abord créer votre fiche entreprise.");
        return;
      }
      if (c.statut !== "validee") {
        setBlocked("Votre entreprise doit être validée avant de publier des offres.");
        return;
      }
      setCompanyId(c.id);
    })();
  }, [user]);

  if (blocked) {
    return (
      <>
        <h1 className="font-display italic text-5xl mb-4">Nouvelle offre.</h1>
        <div className="p-6 border border-dashed border-border rounded-sm">
          <p className="mb-3">{blocked}</p>
          <Link to="/recruteur/entreprise" className="text-primary underline">
            Voir ma fiche entreprise →
          </Link>
        </div>
      </>
    );
  }

  if (!companyId) return <div className="text-sm font-mono text-muted-foreground">Chargement…</div>;

  return (
    <>
      <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
        Création
      </div>
      <h1 className="font-display italic text-5xl mb-10">Nouvelle offre.</h1>
      <OfferForm
        submitLabel="Enregistrer en brouillon"
        onSubmit={async (v) => {
          if (user?.id.startsWith("mock-")) {
            const { getMockJobOffers, saveMockJobOffer } = await import("@/lib/mockData");
            const newOffer = {
              id: `offer-${Date.now()}`,
              ...serializeOffer(v),
              company_id: companyId,
              statut: "brouillon",
              created_at: new Date().toISOString(),
              publiee_le: null,
            };
            saveMockJobOffer(newOffer as any);
            toast.success("Offre créée en brouillon (simulation).");
            navigate({ to: "/recruteur/offres" });
            return;
          }
          const { error } = await supabase
            .from("job_offers")
            .insert({ ...serializeOffer(v), company_id: companyId, statut: "brouillon" });
          if (error) {
            toast.error(error.message);
            return;
          }
          toast.success("Offre créée en brouillon.");
          navigate({ to: "/recruteur/offres" });
        }}
      />
    </>
  );
}
