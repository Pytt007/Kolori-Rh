import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  COMPANY_STATUS_LABELS,
  displayName,
  fetchProfilesByIds,
  getMyCompany,
  type ProfileLite,
} from "@/lib/recruiter";
import { APPLICATION_STATUS_LABELS } from "@/lib/candidate";
import {
  Briefcase,
  CheckSquare,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  ChevronRight,
  Eye,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export const Route = createFileRoute("/_authenticated/recruteur/")({
  component: RecruteurDashboard,
});

type RecentApp = {
  id: string;
  statut: string;
  created_at: string;
  offer: { id: string; titre: string; contrat?: string } | null;
  candidate: { id: string; user_id: string; titre: string | null } | null;
};

const VISITOR_DATA = [
  { name: "Jan", visites: 45 },
  { name: "Fév", visites: 58 },
  { name: "Mar", visites: 85 },
  { name: "Avr", visites: 120 },
  { name: "Mai", visites: 180 },
  { name: "Juin", visites: 140 },
  { name: "Juil", visites: 165 },
  { name: "Août", visites: 210 },
  { name: "Sept", visites: 195 },
  { name: "Oct", visites: 230 },
  { name: "Nov", visites: 270 },
  { name: "Déc", visites: 250 },
];

const KPI_GRADIENTS = [
  "linear-gradient(135deg,#D97706 0%,#F59E0B 100%)",
  "linear-gradient(135deg,#059669 0%,#10B981 100%)",
  "linear-gradient(135deg,#1D3A6C 0%,#2A5298 100%)",
  "linear-gradient(135deg,#7C3AED 0%,#A855F7 100%)",
];
const PIE_COLORS = ["#1D3A6C", "#9C1515", "#7C3AED", "#D97706"];

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

        if (user.id.startsWith("mock-")) {
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
                offer: offer ? { id: offer.id, titre: offer.titre, contrat: offer.contrat } : null,
                candidate: {
                  id: a.candidate_id,
                  user_id: a.candidate_id,
                  titre: "Directeur des Ressources Humaines",
                },
              };
            });
            const userIds = rec.map((r) => r.candidate?.user_id).filter(Boolean) as string[];
            setProfiles(await fetchProfilesByIds(userIds));
          }
          setStats({ offres: offersCount, publiees: pubCount, candidatures: candCount });
          setRecent(rec);
          return;
        }

        const [{ count: offres }, { count: publiees }] = await Promise.all([
          supabase
            .from("job_offers")
            .select("id", { count: "exact", head: true })
            .eq("company_id", company.id),
          supabase
            .from("job_offers")
            .select("id", { count: "exact", head: true })
            .eq("company_id", company.id)
            .eq("statut", "publiee"),
        ]);

        const { data: offerIds } = await supabase
          .from("job_offers")
          .select("id")
          .eq("company_id", company.id);
        const ids = (offerIds ?? []).map((o) => o.id);
        let candCount = 0;
        let rec: RecentApp[] = [];
        if (ids.length) {
          const { count } = await supabase
            .from("applications")
            .select("id", { count: "exact", head: true })
            .in("offer_id", ids);
          candCount = count ?? 0;
          const { data } = await supabase
            .from("applications")
            .select(
              "id, statut, created_at, offer:job_offers(id, titre, contrat), candidate:candidates(id, user_id, titre)",
            )
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
                offer: offer ? { id: offer.id, titre: offer.titre, contrat: offer.contrat } : null,
                candidate: {
                  id: a.candidate_id,
                  user_id: a.candidate_id,
                  titre: "Directeur des Ressources Humaines",
                },
              };
            });
            const userIds = rec.map((r) => r.candidate?.user_id).filter(Boolean) as string[];
            setProfiles(await fetchProfilesByIds(userIds));
          }
          setStats({ offres: offersCount, publiees: pubCount, candidatures: candCount });
          setRecent(rec);
        }
      }
    })();
  }, [user]);

  // Donut chart data
  const pieData = [
    { name: "Publiées", value: stats.publiees },
    { name: "Brouillons", value: Math.max(0, stats.offres - stats.publiees) },
    { name: "Candidatures", value: stats.candidatures },
  ].filter((d) => d.value > 0);

  if (pieData.length === 0) {
    pieData.push(
      { name: "Publiées", value: 2 },
      { name: "Brouillons", value: 1 },
      { name: "Candidatures", value: 4 },
    );
  }

  const kpis = [
    {
      label: "Offres Totales",
      value: stats.offres,
      icon: <Briefcase className="h-4 w-4 text-white" />,
      trend: "Stable",
    },
    {
      label: "Offres Actives",
      value: stats.publiees,
      icon: <Eye className="h-4 w-4 text-white" />,
      trend: "En ligne",
    },
    {
      label: "Candidatures",
      value: stats.candidatures,
      icon: <CheckSquare className="h-4 w-4 text-white" />,
      trend: "+12% sem.",
    },
    {
      label: "Visites Offres",
      value: stats.publiees * 15 + stats.candidatures * 8 + 35,
      icon: <TrendingUp className="h-4 w-4 text-white" />,
      trend: "+35% mois",
    },
  ];

  return (
    <div className="space-y-5 animate-reveal">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Espace Recruteur
          </span>
          <h1 className="font-display font-black text-3xl tracking-tight text-foreground">
            Tableau de bord
          </h1>
        </div>
        {companyStatus && (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Entreprise :
            </span>
            <span
              className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${COMPANY_STATUS_LABELS[companyStatus]?.tone ?? "bg-muted"}`}
            >
              {COMPANY_STATUS_LABELS[companyStatus]?.label ?? companyStatus}
            </span>
          </div>
        )}
      </div>

      {hasCompany === false && (
        <div className="p-5 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/3">
          <h3 className="font-bold text-base text-foreground mb-1">Première étape requise</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Renseignez la fiche de votre entreprise pour publier des offres.
          </p>
          <Link
            to="/recruteur/entreprise"
            className="inline-flex items-center gap-1.5 bg-primary text-white py-2 px-4 text-xs font-bold rounded-xl hover:brightness-110 transition-all"
          >
            Créer ma fiche entreprise
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className="relative overflow-hidden rounded-2xl p-4 sm:p-5"
            style={{ background: KPI_GRADIENTS[idx] }}
          >
            <div className="absolute -right-5 -top-5 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
            <div className="absolute right-4 bottom-0 w-10 h-10 rounded-full bg-white/5 pointer-events-none" />
            <div className="relative z-10">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                {kpi.icon}
              </div>
              <div className="text-3xl sm:text-4xl font-black text-white leading-none">
                {kpi.value}
              </div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-white/65 mt-1.5 truncate">
                {kpi.label}
              </div>
              <div className="mt-2.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-black/20 px-2 py-0.5 rounded-full text-white/90">
                  <ArrowUpRight className="h-2.5 w-2.5" /> {kpi.trend}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 bg-white border border-border/60 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-base text-foreground">Visites sur vos offres</h3>
              <p className="text-xs text-muted-foreground">
                Candidatures et consultations par mois
              </p>
            </div>
            <span className="text-xs font-bold text-primary bg-primary/8 px-3 py-1.5 rounded-lg border border-primary/10">
              Mensuel
            </span>
          </div>
          <div className="h-52 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={VISITOR_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVisites" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} />
                <ChartTooltip
                  contentStyle={{
                    backgroundColor: "#1D3A6C",
                    color: "#fff",
                    borderRadius: "12px",
                    border: "none",
                  }}
                  labelStyle={{ fontWeight: "bold", color: "#10B981" }}
                />
                <Area
                  type="monotone"
                  dataKey="visites"
                  name="Visites"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorVisites)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white border border-border/60 rounded-2xl p-5 shadow-sm flex flex-col">
          <div>
            <h3 className="font-bold text-base text-foreground">Répartition d'activité</h3>
            <p className="text-xs text-muted-foreground">Offres et candidatures</p>
          </div>
          <div className="h-40 w-full my-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={66}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] mt-auto">
            {pieData.map((d, idx) => (
              <div key={idx} className="flex flex-col items-center gap-0.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                />
                <span className="font-black text-sm text-foreground">{d.value}</span>
                <span className="text-muted-foreground leading-tight">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-border/60 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base text-foreground">Candidatures reçues récemment</h3>
          <Link
            to="/recruteur/candidatures"
            className="text-xs font-bold text-primary bg-primary/8 hover:bg-primary/15 border border-primary/10 rounded-xl px-4 py-2 flex items-center gap-1 transition-all"
          >
            Voir tout <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-border rounded-2xl">
            <CheckSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">Aucune candidature reçue</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {recent.map((a) => {
              const s = APPLICATION_STATUS_LABELS[a.statut] ?? {
                label: a.statut,
                tone: "bg-muted text-muted-foreground",
              };
              const name = displayName(a.candidate ? profiles[a.candidate.user_id] : null);
              return (
                <div
                  key={a.id}
                  className="relative flex items-center gap-3 p-3.5 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer"
                >
                  <Link
                    to="/recruteur/candidatures"
                    className="absolute inset-0 z-0"
                  />
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 relative z-10 pointer-events-none">
                    <CheckSquare className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0 relative z-10 pointer-events-none">
                    <div className="font-bold text-sm text-foreground truncate">{name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                      {a.offer?.titre ?? "Offre supprimée"}
                    </div>
                  </div>
                  <span
                    className={`hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0 relative z-10 pointer-events-none ${s.tone}`}
                  >
                    {s.label}
                  </span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 relative z-10 pointer-events-none">
                    <ChevronRight className="h-4 w-4 text-primary" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
