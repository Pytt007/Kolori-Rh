import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Users,
  Building2,
  Briefcase,
  FileText,
  Check,
  X,
  ShieldAlert,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";
import {
  getMockAdminStats,
  getMockAdminCompanies,
  saveMockAdminCompany,
  type MockAdminStats,
} from "@/lib/mockData";
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

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

type CompanyRow = {
  id: string;
  nom: string;
  secteur: string | null;
  localisation: string | null;
  site_web: string | null;
  created_at: string;
};

type StatsType = {
  candidates: number;
  companies: { total: number; en_attente: number; validee: number; rejetee: number };
  offers: { total: number; brouillon: number; publiee: number; suspendue: number; expiree: number };
  applications: number;
};

const SIGNUP_DATA = [
  { name: "Sem 1", inscrits: 12 },
  { name: "Sem 2", inscrits: 25 },
  { name: "Sem 3", inscrits: 40 },
  { name: "Sem 4", inscrits: 32 },
  { name: "Sem 5", inscrits: 45 },
  { name: "Sem 6", inscrits: 58 },
  { name: "Sem 7", inscrits: 50 },
  { name: "Sem 8", inscrits: 75 },
];

const PIE_COLORS = ["#1c305c", "#9c1c1e", "#3b5284", "#cbd5e1"];

function AdminDashboard() {
  const { user } = useAuth();
  const isMock = user?.id.startsWith("mock-");

  const [stats, setStats] = useState<StatsType>({
    candidates: 0,
    companies: { total: 0, en_attente: 0, validee: 0, rejetee: 0 },
    offers: { total: 0, brouillon: 0, publiee: 0, suspendue: 0, expiree: 0 },
    applications: 0,
  });
  const [pendingCompanies, setPendingCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadDashboardData() {
    if (isMock) {
      const s = getMockAdminStats();
      setStats(s);
      const pending = getMockAdminCompanies().filter((c) => c.statut === "en_attente");
      setPendingCompanies(pending as any);
      setLoading(false);
      return;
    }
    try {
      const [
        { count: candidatesCount },
        { data: companiesData },
        { data: offersData },
        { count: appsCount },
        { data: pendingData },
      ] = await Promise.all([
        supabase.from("candidates").select("*", { count: "exact", head: true }),
        supabase.from("companies").select("statut"),
        supabase.from("job_offers").select("statut"),
        supabase.from("applications").select("*", { count: "exact", head: true }),
        supabase
          .from("companies")
          .select("id, nom, secteur, localisation, site_web, created_at")
          .eq("statut", "en_attente")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const compStats = {
        total: companiesData?.length ?? 0,
        en_attente: 0,
        validee: 0,
        rejetee: 0,
      };
      companiesData?.forEach((c) => {
        if (c.statut === "en_attente") compStats.en_attente++;
        else if (c.statut === "validee") compStats.validee++;
        else if (c.statut === "rejetee") compStats.rejetee++;
      });

      const offStats = {
        total: offersData?.length ?? 0,
        brouillon: 0,
        publiee: 0,
        suspendue: 0,
        expiree: 0,
      };
      offersData?.forEach((o) => {
        if (o.statut === "brouillon") offStats.brouillon++;
        else if (o.statut === "publiee") offStats.publiee++;
        else if (o.statut === "suspendue") offStats.suspendue++;
        else if (o.statut === "expiree") offStats.expiree++;
      });

      setStats({
        candidates: candidatesCount ?? 0,
        companies: compStats,
        offers: offStats,
        applications: appsCount ?? 0,
      });

      setPendingCompanies((pendingData as any) ?? []);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la récupération des statistiques.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function handleCompanyStatus(id: string, newStatus: "validee" | "rejetee") {
    if (isMock) {
      saveMockAdminCompany(id, newStatus);
      toast.success(newStatus === "validee" ? "Entreprise validée." : "Entreprise refusée.");
      loadDashboardData();
      return;
    }
    try {
      const { error } = await supabase.from("companies").update({ statut: newStatus }).eq("id", id);

      if (error) throw error;

      toast.success(newStatus === "validee" ? "Entreprise validée." : "Entreprise refusée.");
      loadDashboardData();
    } catch (err) {
      console.error(err);
      toast.error("Action impossible.");
    }
  }

  // Donut chart data
  const pieData = [
    { name: "Validées", value: stats.companies.validee },
    { name: "En attente", value: stats.companies.en_attente },
    { name: "Refusées", value: stats.companies.rejetee },
  ].filter((d) => d.value > 0);

  if (pieData.length === 0) {
    pieData.push(
      { name: "Validées", value: 5 },
      { name: "En attente", value: 2 },
      { name: "Refusées", value: 0 },
    );
  }

  const kpis = [
    {
      label: "Candidats",
      value: stats.candidates,
      desc: "Profils enregistrés",
      icon: <Users className="h-5 w-5 text-amber-600" />,
      badgeColor: "bg-amber-100",
      trend: "+18% ce mois",
      trendIcon: <ArrowUpRight className="h-3 w-3 text-emerald-500" />,
    },
    {
      label: "Entreprises",
      value: stats.companies.validee,
      desc: `${stats.companies.en_attente} en attente`,
      icon: <Building2 className="h-5 w-5 text-blue-600" />,
      badgeColor: "bg-blue-100",
      trend: "En croissance",
      trendIcon: <ArrowUpRight className="h-3 w-3 text-emerald-500" />,
    },
    {
      label: "Offres Actives",
      value: stats.offers.publiee,
      desc: `Sur ${stats.offers.total} offres`,
      icon: <Briefcase className="h-5 w-5 text-emerald-600" />,
      badgeColor: "bg-emerald-100",
      trend: "Stable",
      trendIcon: <ArrowUpRight className="h-3 w-3 text-emerald-500" />,
    },
    {
      label: "Candidatures",
      value: stats.applications,
      desc: "Postulées au total",
      icon: <FileText className="h-5 w-5 text-purple-600" />,
      badgeColor: "bg-purple-100",
      trend: "+20% ce mois",
      trendIcon: <ArrowUpRight className="h-3 w-3 text-emerald-500" />,
    },
  ];

  if (loading)
    return <div className="text-sm font-mono text-muted-foreground">Chargement des données…</div>;

  return (
    <div className="space-y-8 animate-reveal">
      {/* Title section */}
      <div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Espace Administration
        </span>
        <h1 className="font-display font-black text-3xl tracking-tight text-foreground">
          Tableau de bord
        </h1>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className={`p-5 bg-white border border-border/80 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow`}
          >
            <div
              className={`h-11 w-11 rounded-xl flex items-center justify-center ${kpi.badgeColor} shrink-0 shadow-inner`}
            >
              {kpi.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {kpi.label}
              </div>
              <div className="text-2xl font-black text-foreground leading-tight mt-0.5">
                {kpi.value}
              </div>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                {kpi.trendIcon}
                <span className="font-semibold text-foreground/80">{kpi.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Line Chart */}
        <div className="lg:col-span-8 bg-white border border-border/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold text-lg text-foreground">
                Inscriptions d'utilisateurs
              </h3>
              <p className="text-xs text-muted-foreground">
                Volume de nouveaux comptes candidats et recruteurs créés
              </p>
            </div>
            <span className="text-xs font-bold text-[#1c305c] bg-[#1c305c]/10 px-3 py-1.5 rounded-lg border border-[#1c305c]/10 cursor-pointer hover:bg-[#1c305c]/20 transition-colors">
              Hebdomadaire
            </span>
          </div>

          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SIGNUP_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInscrits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1c305c" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#1c305c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} />
                <ChartTooltip
                  contentStyle={{
                    backgroundColor: "#1c305c",
                    color: "#fff",
                    borderRadius: "12px",
                    border: "none",
                  }}
                  labelStyle={{ fontWeight: "bold", color: "#9c1c1e" }}
                />
                <Area
                  type="monotone"
                  dataKey="inscrits"
                  name="Inscrits"
                  stroke="#1c305c"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorInscrits)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="lg:col-span-4 bg-white border border-border/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-display font-bold text-lg text-foreground">
              Statuts des entreprises
            </h3>
            <p className="text-xs text-muted-foreground">Proportion des demandes de modération</p>
          </div>

          <div className="h-44 w-full my-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legends */}
          <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
            {pieData.map((d, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <span className="flex items-center gap-1 font-bold text-foreground">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  />
                  {d.value}
                </span>
                <span className="text-muted-foreground mt-0.5 truncate max-w-full">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending companies moderation list */}
      <div className="bg-white border border-border/80 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" /> Modération des Entreprises
          </h3>
          <Link
            to="/admin/entreprises"
            className="text-xs font-bold text-[#1c305c] bg-[#1c305c]/10 hover:bg-[#1c305c]/20 border border-[#1c305c]/10 rounded-xl px-4 py-2 flex items-center gap-1 transition-all"
          >
            Gérer tout
          </Link>
        </div>

        {pendingCompanies.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-border rounded-xl">
            <p className="text-sm text-muted-foreground">
              Aucune demande d'inscription en attente de modération.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-muted-foreground uppercase font-mono tracking-wider">
                  <th className="py-3 px-4">Entreprise</th>
                  <th className="py-3 px-4">Secteur</th>
                  <th className="py-3 px-4">Localisation</th>
                  <th className="py-3 px-4">Date Demande</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium text-black">
                {pendingCompanies.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-primary">{c.nom}</td>
                    <td className="py-3.5 px-4 text-muted-foreground">{c.secteur ?? "—"}</td>
                    <td className="py-3.5 px-4 text-muted-foreground">{c.localisation ?? "—"}</td>
                    <td className="py-3.5 px-4 text-muted-foreground font-mono">
                      {new Date(c.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-xl px-3 text-[11px]"
                          onClick={() => handleCompanyStatus(c.id, "validee")}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" /> Approuver
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-destructive hover:bg-destructive/5 rounded-xl px-3 text-[11px]"
                          onClick={() => handleCompanyStatus(c.id, "rejetee")}
                        >
                          <X className="h-3.5 w-3.5 mr-1" /> Refuser
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
