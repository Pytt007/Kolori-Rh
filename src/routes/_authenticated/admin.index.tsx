import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, Building2, Briefcase, FileText, Check, X, ShieldAlert } from "lucide-react";

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

function AdminDashboard() {
  const [stats, setStats] = useState<StatsType>({
    candidates: 0,
    companies: { total: 0, en_attente: 0, validee: 0, rejetee: 0 },
    offers: { total: 0, brouillon: 0, publiee: 0, suspendue: 0, expiree: 0 },
    applications: 0,
  });
  const [pendingCompanies, setPendingCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadDashboardData() {
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
        supabase.from("companies")
          .select("id, nom, secteur, localisation, site_web, created_at")
          .eq("statut", "en_attente")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const compStats = { total: companiesData?.length ?? 0, en_attente: 0, validee: 0, rejetee: 0 };
      companiesData?.forEach((c) => {
        if (c.statut === "en_attente") compStats.en_attente++;
        else if (c.statut === "validee") compStats.validee++;
        else if (c.statut === "rejetee") compStats.rejetee++;
      });

      const offStats = { total: offersData?.length ?? 0, brouillon: 0, publiee: 0, suspendue: 0, expiree: 0 };
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
    try {
      const { error } = await supabase
        .from("companies")
        .update({ statut: newStatus })
        .eq("id", id);

      if (error) throw error;

      toast.success(newStatus === "validee" ? "Entreprise validée." : "Entreprise refusée.");
      loadDashboardData();
    } catch (err) {
      console.error(err);
      toast.error("Action impossible.");
    }
  }

  if (loading) return <div className="text-sm font-mono text-muted-foreground">Chargement des données…</div>;

  return (
    <>
      <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3 font-semibold">Direction éditoriale</div>
      <h1 className="font-display italic text-5xl mb-10">Administration.</h1>

      {/* KPI Section */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Card className="p-6 bg-card border border-border rounded-sm flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-sm">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Candidats</div>
            <div className="font-display italic text-2xl">{stats.candidates}</div>
          </div>
        </Card>

        <Card className="p-6 bg-card border border-border rounded-sm flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-sm">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Entreprises</div>
            <div className="font-display italic text-2xl">
              {stats.companies.validee} <span className="text-xs font-mono text-muted-foreground not-italic">({stats.companies.en_attente} en attente)</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card border border-border rounded-sm flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-sm">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Offres</div>
            <div className="font-display italic text-2xl">
              {stats.offers.publiee} <span className="text-xs font-mono text-muted-foreground not-italic">({stats.offers.total} tot.)</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card border border-border rounded-sm flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-sm">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Candidatures</div>
            <div className="font-display italic text-2xl">{stats.applications}</div>
          </div>
        </Card>
      </div>

      {/* Entreprises en attente de modération rapide */}
      <div className="border border-border rounded-sm bg-card p-6 mb-10">
        <div className="flex items-center justify-between mb-6 border-b border-border/50 pb-3">
          <h2 className="font-display italic text-2xl flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-accent" /> Entreprises en attente de validation
          </h2>
          <Link to="/admin/entreprises" className="text-xs font-mono uppercase tracking-widest text-primary hover:underline font-semibold">
            Voir tout →
          </Link>
        </div>

        {pendingCompanies.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6">Aucune entreprise en attente de validation pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans border-collapse">
              <thead>
                <tr className="border-b border-border font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  <th className="pb-3 pr-4">Nom</th>
                  <th className="pb-3 px-4">Secteur</th>
                  <th className="pb-3 px-4">Localisation</th>
                  <th className="pb-3 px-4">Date de demande</th>
                  <th className="pb-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {pendingCompanies.map((c) => (
                  <tr key={c.id} className="hover:bg-secondary/10">
                    <td className="py-4 pr-4 font-semibold">{c.nom}</td>
                    <td className="py-4 px-4 text-muted-foreground">{c.secteur ?? "—"}</td>
                    <td className="py-4 px-4 text-muted-foreground">{c.localisation ?? "—"}</td>
                    <td className="py-4 px-4 text-xs font-mono text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="py-4 pl-4 text-right flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-sm"
                        onClick={() => handleCompanyStatus(c.id, "validee")}
                      >
                        <Check className="h-4 w-4 mr-1" /> Valider
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-destructive hover:bg-destructive/10 rounded-sm"
                        onClick={() => handleCompanyStatus(c.id, "rejetee")}
                      >
                        <X className="h-4 w-4 mr-1" /> Rejeter
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
