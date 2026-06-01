import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { COMPANY_STATUS_LABELS, displayName, fetchProfilesByIds, getMyCompany, type ProfileLite } from "@/lib/recruiter";
import { APPLICATION_STATUS_LABELS } from "@/lib/candidate";

export const Route = createFileRoute("/_authenticated/recruteur/")({
  component: RecruteurDashboard,
});

type RecentApp = {
  id: string;
  statut: string;
  created_at: string;
  offer: { id: string; titre: string } | null;
  candidate: { id: string; user_id: string; titre: string | null } | null;
};

function RecruteurDashboard() {
  const { user } = useAuth();
  const [companyStatus, setCompanyStatus] = useState<string | null>(null);
  const [hasCompany, setHasCompany] = useState<boolean | null>(null);
  const [stats, setStats] = useState({ offres: 0, publiees: 0, candidatures: 0 });
  const [recent, setRecent] = useState<RecentApp[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const company = await getMyCompany(user.id);
        setHasCompany(!!company);
        setCompanyStatus(company?.statut ?? null);
        if (!company) return;

        if (user.id === "mock-recruiter-1") {
          const { getMockJobOffers, getMockApplications } = await import("@/lib/mockData");
          const mockOffers = getMockJobOffers().filter((o) => o.company_id === company.id);
          const offersCount = mockOffers.length;
          const pubCount = mockOffers.filter((o) => o.statut === "publiee").length;

          const ids = mockOffers.map((o) => o.id);
          let candCount = 0;
          let rec: RecentApp[] = [];
          if (ids.length) {
            const mockApps = getMockApplications().filter((a) => ids.includes(a.offer_id));
            candCount = mockApps.length;
            rec = mockApps.slice(0, 6).map((a) => {
              const offer = mockOffers.find((o) => o.id === a.offer_id);
              return {
                id: a.id,
                statut: a.statut,
                created_at: a.created_at,
                offer: offer ? { id: offer.id, titre: offer.titre } : null,
                candidate: { id: a.candidate_id, user_id: a.candidate_id, titre: "Directeur des Ressources Humaines" }
              };
            });
            setProfiles({
              "mock-candidate-1": {
                id: "mock-candidate-1",
                prenom: "Koffi",
                nom: "Anan",
                telephone: "+225 07 08 09 10 11"
              }
            });
          }
          setStats({ offres: offersCount, publiees: pubCount, candidatures: candCount });
          setRecent(rec);
          return;
        }

        const [{ count: offres }, { count: publiees }] = await Promise.all([
          supabase.from("job_offers").select("id", { count: "exact", head: true }).eq("company_id", company.id),
          supabase.from("job_offers").select("id", { count: "exact", head: true }).eq("company_id", company.id).eq("statut", "publiee"),
        ]);

        const { data: offerIds } = await supabase.from("job_offers").select("id").eq("company_id", company.id);
        const ids = (offerIds ?? []).map((o) => o.id);
        let candCount = 0;
        let rec: RecentApp[] = [];
        if (ids.length) {
          const { count } = await supabase.from("applications").select("id", { count: "exact", head: true }).in("offer_id", ids);
          candCount = count ?? 0;
          const { data } = await supabase
            .from("applications")
            .select("id, statut, created_at, offer:job_offers(id, titre), candidate:candidates(id, user_id, titre)")
            .in("offer_id", ids)
            .order("created_at", { ascending: false })
            .limit(6);
          rec = (data as unknown as RecentApp[]) ?? [];
          const userIds = rec.map((r) => r.candidate?.user_id).filter(Boolean) as string[];
          setProfiles(await fetchProfilesByIds(userIds));
        }
        setStats({ offres: offres ?? 0, publiees: publiees ?? 0, candidatures: candCount });
        setRecent(rec);
      } catch (e: any) {
        console.warn("Failed loading recruiter dashboard statistics from Supabase:", e);
        const company = await getMyCompany(user.id);
        if (company) {
          const { getMockJobOffers, getMockApplications } = await import("@/lib/mockData");
          const mockOffers = getMockJobOffers().filter((o) => o.company_id === company.id);
          const offersCount = mockOffers.length;
          const pubCount = mockOffers.filter((o) => o.statut === "publiee").length;

          const ids = mockOffers.map((o) => o.id);
          let candCount = 0;
          let rec: RecentApp[] = [];
          if (ids.length) {
            const mockApps = getMockApplications().filter((a) => ids.includes(a.offer_id));
            candCount = mockApps.length;
            rec = mockApps.slice(0, 6).map((a) => {
              const offer = mockOffers.find((o) => o.id === a.offer_id);
              return {
                id: a.id,
                statut: a.statut,
                created_at: a.created_at,
                offer: offer ? { id: offer.id, titre: offer.titre } : null,
                candidate: { id: a.candidate_id, user_id: a.candidate_id, titre: "Directeur des Ressources Humaines" }
              };
            });
            setProfiles({
              "mock-candidate-1": {
                id: "mock-candidate-1",
                prenom: "Koffi",
                nom: "Anan",
                telephone: "+225 07 08 09 10 11"
              }
            });
          }
          setStats({ offres: offersCount, publiees: pubCount, candidatures: candCount });
          setRecent(rec);
        }
      }
    })();
  }, [user]);

  return (
    <>
      <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Chapitre 02</div>
      <h1 className="font-display italic text-5xl mb-10">Tableau de bord.</h1>

      {hasCompany === false && (
        <div className="mb-10 p-6 border border-border bg-card rounded-sm">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Première étape</div>
          <p className="font-display italic text-2xl mb-2">Présentez votre entreprise.</p>
          <p className="text-muted-foreground mb-4">
            Vous devez créer votre fiche entreprise et la faire valider avant de publier des offres.
          </p>
          <Link to="/recruteur/entreprise" className="text-primary underline text-sm">Créer ma fiche →</Link>
        </div>
      )}

      {companyStatus && (
        <div className="mb-10 flex items-center gap-3">
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Statut de l'entreprise :</span>
          <span className={`text-xs font-mono uppercase tracking-widest px-2 py-1 rounded-sm ${COMPANY_STATUS_LABELS[companyStatus]?.tone ?? "bg-muted"}`}>
            {COMPANY_STATUS_LABELS[companyStatus]?.label ?? companyStatus}
          </span>
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-4 mb-12">
        {[
          { label: "Offres totales", value: stats.offres, to: "/recruteur/offres" },
          { label: "Offres publiées", value: stats.publiees, to: "/recruteur/offres" },
          { label: "Candidatures", value: stats.candidatures, to: "/recruteur/candidatures" },
        ].map((s) => (
          <Link key={s.label} to={s.to} className="p-6 bg-card border border-border rounded-sm hover:border-primary transition-colors">
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">{s.label}</div>
            <div className="font-display italic text-5xl text-primary">{s.value}</div>
          </Link>
        ))}
      </div>

      <div className="mb-4 flex items-end justify-between">
        <h2 className="font-display italic text-2xl">Candidatures récentes</h2>
        <Link to="/recruteur/candidatures" className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-primary">Tout voir →</Link>
      </div>
      <div className="border border-border rounded-sm divide-y divide-border bg-card">
        {recent.length === 0 && <div className="p-6 text-sm text-muted-foreground">Aucune candidature pour le moment.</div>}
        {recent.map((a) => {
          const s = APPLICATION_STATUS_LABELS[a.statut] ?? { label: a.statut, tone: "bg-muted" };
          const name = displayName(a.candidate ? profiles[a.candidate.user_id] : null);
          return (
            <Link key={a.id} to="/recruteur/candidatures" className="p-4 flex items-center justify-between gap-4 hover:bg-secondary/40">
              <div>
                <div className="font-medium">{name} <span className="text-muted-foreground">— {a.candidate?.titre ?? "Profil"}</span></div>
                <div className="text-xs text-muted-foreground font-mono">{a.offer?.titre} · {new Date(a.created_at).toLocaleDateString("fr-FR")}</div>
              </div>
              <span className={`text-xs font-mono uppercase tracking-widest px-2 py-1 rounded-sm ${s.tone}`}>{s.label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
