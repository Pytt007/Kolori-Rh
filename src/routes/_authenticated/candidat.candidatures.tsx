import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getMockApplications, getMockJobOffers, getMockCompanies } from "@/lib/mockData";
import { useAuth } from "@/lib/auth-context";
import { APPLICATION_STATUS_LABELS, ensureCandidate } from "@/lib/candidate";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/candidat/candidatures")({
  component: CandidatCandidatures,
});

type Row = {
  id: string;
  statut: string;
  created_at: string;
  lettre: string | null;
  offer: { id: string; titre: string; contrat: string; localisation: string | null; company: { nom: string } | null } | null;
};

function CandidatCandidatures() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!user) return;
    const cid = await ensureCandidate(user.id);
    const { data } = await supabase
      .from("applications")
      .select("id, statut, created_at, lettre, offer:job_offers(id, titre, contrat, localisation, company:companies(nom))")
      .eq("candidate_id", cid)
      .order("created_at", { ascending: false });
    if (data && data.length > 0) {
      setRows((data as unknown as Row[]) ?? []);
    } else {
      // Fallback local storage
      const mockApps = getMockApplications().filter(a => a.candidate_id === cid);
      const mapped = mockApps.map(a => {
        const off = getMockJobOffers().find(o => o.id === a.offer_id);
        const comp = off ? getMockCompanies().find(c => c.id === off.company_id) : null;
        return {
          id: a.id,
          statut: a.statut,
          created_at: a.created_at,
          lettre: a.lettre,
          offer: off ? {
            id: off.id,
            titre: off.titre,
            contrat: off.contrat,
            localisation: off.localisation,
            company: comp ? { nom: comp.nom } : null
          } : null
        };
      });
      setRows(mapped as any);
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, [user]);

  async function retirer(id: string) {
    if (!confirm("Retirer cette candidature ? Cette action est définitive.")) return;
    try {
      const { error } = await supabase.from("applications").delete().eq("id", id);
      if (error) throw error;
      toast.success("Candidature retirée.");
      load();
    } catch (err) {
      console.warn("Database delete failed, falling back to local simulation:", err);
      const stored = localStorage.getItem("mock_applications");
      if (stored) {
        const list = JSON.parse(stored).filter((a: any) => a.id !== id);
        localStorage.setItem("mock_applications", JSON.stringify(list));
      }
      toast.success("Candidature retirée (Mode Démo).");
      load();
    }
  }

  return (
    <>
      <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Suivi</div>
      <h1 className="font-display italic text-5xl mb-10">Mes candidatures.</h1>

      {loading ? (
        <div className="text-sm font-mono text-muted-foreground">Chargement…</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-border rounded-sm">
          <p className="font-display italic text-2xl mb-2">Aucune candidature pour l'instant.</p>
          <Link to="/offres" className="text-primary underline text-sm">Parcourir les offres</Link>
        </div>
      ) : (
        <div className="border border-border rounded-sm divide-y divide-border bg-card">
          {rows.map((r) => {
            const s = APPLICATION_STATUS_LABELS[r.statut] ?? { label: r.statut, tone: "bg-muted" };
            const closed = r.statut === "rejete" || r.statut === "retenu";
            return (
              <div key={r.id} className="p-5 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[240px]">
                  {r.offer ? (
                    <Link to="/offres/$offerId" params={{ offerId: r.offer.id }} className="font-display italic text-xl hover:text-primary">
                      {r.offer.titre}
                    </Link>
                  ) : (
                    <span className="font-display italic text-xl text-muted-foreground">Offre supprimée</span>
                  )}
                  <div className="text-xs text-muted-foreground font-mono uppercase tracking-widest mt-1">
                    {r.offer?.company?.nom} {r.offer?.localisation ? `· ${r.offer.localisation}` : ""} · envoyée le {new Date(r.created_at).toLocaleDateString("fr-FR")}
                  </div>
                </div>
                <span className={`text-xs font-mono uppercase tracking-widest px-2 py-1 rounded-sm ${s.tone}`}>{s.label}</span>
                {!closed && (
                  <Button variant="ghost" size="sm" onClick={() => retirer(r.id)}>Retirer</Button>
                )}
                {closed && null}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
