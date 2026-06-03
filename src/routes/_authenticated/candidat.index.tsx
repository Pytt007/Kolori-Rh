import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { APPLICATION_STATUS_LABELS, ensureCandidate } from "@/lib/candidate";
import { getMockApplications, getMockJobOffers, getMockCvs } from "@/lib/mockData";
import {
  FileText,
  CheckSquare,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  ChevronRight,
  Briefcase,
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

export const Route = createFileRoute("/_authenticated/candidat/")({
  component: CandidatDashboard,
});

const ACTIVITY_DATA = [
  { name: "Jan", vues: 8 },
  { name: "Fév", vues: 14 },
  { name: "Mar", vues: 12 },
  { name: "Avr", vues: 19 },
  { name: "Mai", vues: 26 },
  { name: "Juin", vues: 18 },
  { name: "Juil", vues: 22 },
  { name: "Août", vues: 35 },
  { name: "Sept", vues: 25 },
  { name: "Oct", vues: 21 },
  { name: "Nov", vues: 30 },
  { name: "Déc", vues: 28 },
];

const KPI_GRADIENTS = [
  "linear-gradient(135deg,#D97706 0%,#F59E0B 100%)",
  "linear-gradient(135deg,#1D3A6C 0%,#2A5298 100%)",
  "linear-gradient(135deg,#7C3AED 0%,#A855F7 100%)",
  "linear-gradient(135deg,#059669 0%,#10B981 100%)",
];
const PIE_COLORS = ["#1D3A6C", "#9C1515", "#7C3AED", "#D97706"];

function CandidatDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ cvs: 0, candidatures: 0, entretiens: 0 });
  const [recent, setRecent] = useState<
    Array<{
      id: string;
      statut: string;
      created_at: string;
      offer: { id: string; titre: string; contrat: string } | null;
    }>
  >([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const candidateId = await ensureCandidate(user.id);

        if (user.id === "mock-candidate-1") {
          const mockApps = getMockApplications().filter((a) => a.candidate_id === candidateId);
          const mockOffers = getMockJobOffers();
          const mockCvs = getMockCvs(candidateId);
          const recentMapped = mockApps.slice(0, 5).map((a) => {
            const offer = mockOffers.find((o) => o.id === a.offer_id);
            return {
              id: a.id,
              statut: a.statut,
              created_at: a.created_at,
              offer: offer ? { id: offer.id, titre: offer.titre, contrat: offer.contrat } : null,
            };
          });
          setRecent(recentMapped);
          setStats({
            cvs: mockCvs.length,
            candidatures: mockApps.length,
            entretiens: mockApps.filter((a) => a.statut === "entretien").length,
          });
          return;
        }

        const [{ count: cvs }, { data: apps }] = await Promise.all([
          supabase
            .from("cv_documents")
            .select("id", { count: "exact", head: true })
            .eq("candidate_id", candidateId),
          supabase
            .from("applications")
            .select("id, statut, created_at, offer:job_offers(id, titre, contrat)")
            .eq("candidate_id", candidateId)
            .order("created_at", { ascending: false })
            .limit(5),
        ]);
        const all =
          (apps as unknown as Array<{
            id: string;
            statut: string;
            created_at: string;
            offer: { id: string; titre: string; contrat: string } | null;
          }>) ?? [];

        if (all.length === 0) {
          const mockApps = getMockApplications().filter((a) => a.candidate_id === candidateId);
          const mockOffers = getMockJobOffers();
          const mockCvs = getMockCvs(candidateId);
          const recentMapped = mockApps.slice(0, 5).map((a) => {
            const offer = mockOffers.find((o) => o.id === a.offer_id);
            return {
              id: a.id,
              statut: a.statut,
              created_at: a.created_at,
              offer: offer ? { id: offer.id, titre: offer.titre, contrat: offer.contrat } : null,
            };
          });
          setRecent(recentMapped);
          setStats({
            cvs: mockCvs.length,
            candidatures: mockApps.length,
            entretiens: mockApps.filter((a) => a.statut === "entretien").length,
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
        const mockApps = getMockApplications().filter((a) => a.candidate_id === "mock-candidate-1");
        const mockOffers = getMockJobOffers();
        const mockCvs = getMockCvs("mock-candidate-1");
        const recentMapped = mockApps.slice(0, 5).map((a) => {
          const offer = mockOffers.find((o) => o.id === a.offer_id);
          return {
            id: a.id,
            statut: a.statut,
            created_at: a.created_at,
            offer: offer ? { id: offer.id, titre: offer.titre, contrat: offer.contrat } : null,
          };
        });
        setRecent(recentMapped);
        setStats({
          cvs: mockCvs.length,
          candidatures: mockApps.length,
          entretiens: mockApps.filter((a) => a.statut === "entretien").length,
        });
      }
    })();
  }, [user]);

  // Pie chart data
  const pieData = [
    { name: "Entretiens", value: stats.entretiens },
    { name: "Envoyées", value: Math.max(0, stats.candidatures - stats.entretiens) },
    { name: "CV Déposés", value: stats.cvs },
  ].filter((d) => d.value > 0);

  // If pieData is empty, add fallback mock slices
  if (pieData.length === 0) {
    pieData.push(
      { name: "Entretiens", value: 1 },
      { name: "Envoyées", value: 2 },
      { name: "CV Déposés", value: 2 },
    );
  }

  const kpis = [
    {
      label: "CV Actifs",
      value: stats.cvs,
      icon: <FileText className="h-4 w-4 text-white" />,
      trend: "Stable",
    },
    {
      label: "Candidatures",
      value: stats.candidatures,
      icon: <CheckSquare className="h-4 w-4 text-white" />,
      trend: "+15% ce mois",
    },
    {
      label: "Entretiens",
      value: stats.entretiens,
      icon: <Calendar className="h-4 w-4 text-white" />,
      trend: "En hausse",
    },
    {
      label: "Vues Profil",
      value: stats.candidatures * 3 + 2,
      icon: <TrendingUp className="h-4 w-4 text-white" />,
      trend: "+25% ce mois",
    },
  ];

  return (
    <div className="space-y-5 animate-reveal">
      {/* Header */}
      <div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Espace Candidat
        </span>
        <h1 className="font-display font-black text-3xl tracking-tight text-foreground">
          Tableau de bord
        </h1>
      </div>

      {/* KPI Cards â€” gradient */}
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 bg-white border border-border/60 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-base text-foreground">Activité du profil</h3>
              <p className="text-xs text-muted-foreground">Vues par des recruteurs ce mois</p>
            </div>
            <span className="text-xs font-bold text-primary bg-primary/8 px-3 py-1.5 rounded-lg border border-primary/10">
              Mensuel
            </span>
          </div>
          <div className="h-52 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ACTIVITY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVues" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1D3A6C" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#1D3A6C" stopOpacity={0} />
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
                  labelStyle={{ fontWeight: "bold", color: "#F59E0B" }}
                />
                <Area
                  type="monotone"
                  dataKey="vues"
                  name="Vues"
                  stroke="#1D3A6C"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorVues)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white border border-border/60 rounded-2xl p-5 shadow-sm flex flex-col">
          <div>
            <h3 className="font-bold text-base text-foreground">Répartition</h3>
            <p className="text-xs text-muted-foreground">Détail de votre dossier</p>
          </div>
          <div className="h-40 w-full my-3 flex items-center justify-center">
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
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
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

      {/* Recent Applications */}
      <div className="bg-white border border-border/60 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base text-foreground">Candidatures récentes</h3>
          <Link
            to="/candidat/candidatures"
            className="text-xs font-bold text-primary bg-primary/8 hover:bg-primary/15 border border-primary/10 rounded-xl px-4 py-2 flex items-center gap-1 transition-all"
          >
            Voir tout <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-border rounded-2xl">
            <CheckSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">
              Aucune candidature envoyée
            </p>
            <Link
              to="/offres"
              className="text-xs text-primary font-bold mt-2 inline-block hover:underline"
            >
              Parcourir les offres â†’
            </Link>
          </div>
        ) : (
          <div className="space-y-1.5">
            {recent.map((a) => {
              const s = APPLICATION_STATUS_LABELS[a.statut] ?? {
                label: a.statut,
                tone: "bg-muted text-muted-foreground",
              };
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-3 p-3.5 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Briefcase className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-foreground truncate">
                      {a.offer?.titre ?? "Offre supprimée"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      {a.offer?.contrat && (
                        <span className="font-mono uppercase tracking-wider text-[10px]">
                          {a.offer.contrat}
                        </span>
                      )}
                      {a.offer?.contrat && <span>Â·</span>}
                      <span>{new Date(a.created_at).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>
                  <span
                    className={`hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0 ${s.tone}`}
                  >
                    {s.label}
                  </span>
                  {a.offer && (
                    <Link
                      to="/offres/$offerId"
                      params={{ offerId: a.offer.id }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    >
                      <ChevronRight className="h-4 w-4 text-primary" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
