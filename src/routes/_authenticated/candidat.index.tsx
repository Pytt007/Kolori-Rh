import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { APPLICATION_STATUS_LABELS, ensureCandidate } from "@/lib/candidate";
import { getMockApplications, getMockJobOffers, getMockCvs } from "@/lib/mockData";

export const Route = createFileRoute("/_authenticated/candidat/")({
  component: CandidatDashboard,
});

function CandidatDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ cvs: 0, candidatures: 0, entretiens: 0 });
  const [recent, setRecent] = useState<Array<{ id: string; statut: string; created_at: string; offer: { titre: string } | null }>>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const candidateId = await ensureCandidate(user.id);

        if (user.id === "mock-candidate-1") {
          // Load from mock data
          const mockApps = getMockApplications().filter(a => a.candidate_id === candidateId);
          const mockOffers = getMockJobOffers();
          const mockCvs = getMockCvs(candidateId);
          const recentMapped = mockApps.slice(0, 5).map(a => {
            const offer = mockOffers.find(o => o.id === a.offer_id);
            return {
              id: a.id,
              statut: a.statut,
              created_at: a.created_at,
              offer: offer ? { titre: offer.titre } : null
            };
          });
          setRecent(recentMapped);
          setStats({
            cvs: mockCvs.length,
            candidatures: mockApps.length,
            entretiens: mockApps.filter(a => a.statut === "entretien").length
          });
          return;
        }

        const [{ count: cvs }, { data: apps }] = await Promise.all([
          supabase.from("cv_documents").select("id", { count: "exact", head: true }).eq("candidate_id", candidateId),
          supabase
            .from("applications")
            .select("id, statut, created_at, offer:job_offers(titre)")
            .eq("candidate_id", candidateId)
            .order("created_at", { ascending: false })
            .limit(5),
        ]);
        const all = (apps as unknown as Array<{ id: string; statut: string; created_at: string; offer: { titre: string } | null }>) ?? [];

        // If no supabase data, fallback to mock
        if (all.length === 0) {
          const mockApps = getMockApplications().filter(a => a.candidate_id === candidateId);
          const mockOffers = getMockJobOffers();
          const mockCvs = getMockCvs(candidateId);
          const recentMapped = mockApps.slice(0, 5).map(a => {
            const offer = mockOffers.find(o => o.id === a.offer_id);
            return {
              id: a.id,
              statut: a.statut,
              created_at: a.created_at,
              offer: offer ? { titre: offer.titre } : null
            };
          });
          setRecent(recentMapped);
          setStats({
            cvs: mockCvs.length,
            candidatures: mockApps.length,
            entretiens: mockApps.filter(a => a.statut === "entretien").length
          });
          return;
        }

        setRecent(all);
        const { count: total } = await supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .eq("candidate_id", candidateId);
        const { count: entretiens } = await supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .eq("candidate_id", candidateId)
          .eq("statut", "entretien");
        setStats({ cvs: cvs ?? 0, candidatures: total ?? 0, entretiens: entretiens ?? 0 });
      } catch (err) {
        console.warn("Dashboard stats failed, using mock fallback:", err);
        const mockApps = getMockApplications().filter(a => a.candidate_id === "mock-candidate-1");
        const mockOffers = getMockJobOffers();
        const mockCvs = getMockCvs("mock-candidate-1");
        const recentMapped = mockApps.slice(0, 5).map(a => {
          const offer = mockOffers.find(o => o.id === a.offer_id);
          return {
            id: a.id,
            statut: a.statut,
            created_at: a.created_at,
            offer: offer ? { titre: offer.titre } : null
          };
        });
        setRecent(recentMapped);
        setStats({
          cvs: mockCvs.length,
          candidatures: mockApps.length,
          entretiens: mockApps.filter(a => a.statut === "entretien").length
        });
      }
    })();
  }, [user]);

  return (
    <>
      <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Chapitre 01</div>
      <h1 className="font-display italic text-5xl mb-10">Tableau de bord.</h1>

      <div className="grid sm:grid-cols-3 gap-4 mb-12">
        {[
          { label: "CV déposés", value: stats.cvs, to: "/candidat/cv" },
          { label: "Candidatures", value: stats.candidatures, to: "/candidat/candidatures" },
          { label: "Entretiens", value: stats.entretiens, to: "/candidat/candidatures" },
        ].map((s) => (
          <Link key={s.label} to={s.to} className="p-6 bg-card border border-border rounded-sm hover:border-primary transition-colors">
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">{s.label}</div>
            <div className="font-display italic text-5xl text-primary">{s.value}</div>
          </Link>
        ))}
      </div>

      <div className="mb-4 flex items-end justify-between">
        <h2 className="font-display italic text-2xl">Candidatures récentes</h2>
        <Link to="/candidat/candidatures" className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-primary">
          Tout voir →
        </Link>
      </div>
      <div className="border border-border rounded-sm divide-y divide-border bg-card">
        {recent.length === 0 && (
          <div className="p-6 text-sm text-muted-foreground">
            Aucune candidature pour l'instant. <Link to="/offres" className="text-primary underline">Parcourir les offres</Link>.
          </div>
        )}
        {recent.map((a) => {
          const s = APPLICATION_STATUS_LABELS[a.statut] ?? { label: a.statut, tone: "bg-muted" };
          return (
            <div key={a.id} className="p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-medium">{a.offer?.titre ?? "Offre supprimée"}</div>
                <div className="text-xs text-muted-foreground font-mono">{new Date(a.created_at).toLocaleDateString("fr-FR")}</div>
              </div>
              <span className={`text-xs font-mono uppercase tracking-widest px-2 py-1 rounded-sm ${s.tone}`}>{s.label}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}
