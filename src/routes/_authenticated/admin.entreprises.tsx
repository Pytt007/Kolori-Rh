import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Building2, Check, X, Globe, MapPin, Search } from "lucide-react";
import { displayName, fetchProfilesByIds, type ProfileLite } from "@/lib/recruiter";
import { getMockAdminCompanies, saveMockAdminCompany, getMockUsers } from "@/lib/mockData";

export const Route = createFileRoute("/_authenticated/admin/entreprises")({
  component: AdminEntreprises,
});

type CompanyRow = {
  id: string;
  nom: string;
  logo_url: string | null;
  secteur: string | null;
  localisation: string | null;
  description: string | null;
  site_web: string | null;
  statut: "en_attente" | "validee" | "rejetee";
  owner_id: string;
  created_at: string;
};

function AdminEntreprises() {
  const { user } = useAuth();
  const isMock = user?.id === "mock-admin-1";

  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("en_attente");
  const [filterQuery, setFilterQuery] = useState("");

  async function loadCompanies() {
    if (!user) return;
    // ── Mock mode ──────────────────────────────
    if (isMock) {
      const list = getMockAdminCompanies() as any as CompanyRow[];
      setCompanies(list);
      // Build mock profiles from MOCK_USERS
      const mockUsers = getMockUsers();
      const mockProfiles: Record<string, ProfileLite> = {};
      mockUsers.forEach((u) => {
        mockProfiles[u.id] = { id: u.id, nom: u.nom, prenom: u.prenom, email: null } as any;
      });
      setProfiles(mockProfiles);
      setLoading(false);
      return;
    }
    // ── Supabase ───────────────────────────────
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const list = ((data as any) ?? []) as CompanyRow[];
      setCompanies(list);

      // Récupérer les profils des propriétaires (recruteurs)
      const ownerIds = list.map((c) => c.owner_id);
      setProfiles(await fetchProfilesByIds(ownerIds));
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger les entreprises.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCompanies();
  }, [user]);

  async function updateStatus(id: string, newStatus: "validee" | "rejetee") {
    if (isMock) {
      saveMockAdminCompany(id, newStatus);
      toast.success(newStatus === "validee" ? "Entreprise approuvée." : "Entreprise rejetée.");
      loadCompanies();
      return;
    }
    try {
      const { error } = await supabase.from("companies").update({ statut: newStatus }).eq("id", id);

      if (error) throw error;

      toast.success(newStatus === "validee" ? "Entreprise approuvée." : "Entreprise rejetée.");
      loadCompanies();
    } catch (err) {
      console.error(err);
      toast.error("Impossible de modifier le statut de l'entreprise.");
    }
  }

  const filteredCompanies = companies.filter((c) => {
    const matchesTab = c.statut === activeTab;
    const matchesSearch =
      c.nom.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (c.secteur ?? "").toLowerCase().includes(filterQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  if (loading)
    return (
      <div className="dash-empty">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">Chargement des entreprises…</p>
      </div>
    );

  const pendingCount = companies.filter((c) => c.statut === "en_attente").length;
  const validatedCount = companies.filter((c) => c.statut === "validee").length;
  const rejectedCount = companies.filter((c) => c.statut === "rejetee").length;

  return (
    <>
      {/* ── Hero Header ─────────────────────────────────────────────────── */}
      <div className="page-hero page-hero-admin animate-reveal">
        <div
          className="page-hero-blob"
          style={{ width: 350, height: 350, background: "#9c1c1e", top: -140, right: -100 }}
        />
        <div
          className="page-hero-blob"
          style={{ width: 200, height: 200, background: "#1c305c", bottom: -80, left: 40 }}
        />
        <div className="hero-content">
          <div className="dash-section-title" style={{ color: "rgba(255,255,255,0.6)" }}>
            Modération
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white mb-3">
            Validation des Entreprises
          </h1>
          <div className="flex flex-wrap gap-2 mt-3">
            <span
              className="stat-pill"
              style={{
                background: "rgba(251,191,36,0.25)",
                borderColor: "rgba(251,191,36,0.4)",
                color: "#FDE68A",
              }}
            >
              ⏳ {pendingCount} en attente
            </span>
            <span
              className="stat-pill"
              style={{
                background: "rgba(16,185,129,0.25)",
                borderColor: "rgba(16,185,129,0.4)",
                color: "#6EE7B7",
              }}
            >
              ✓ {validatedCount} validées
            </span>
            {rejectedCount > 0 && (
              <span
                className="stat-pill"
                style={{
                  background: "rgba(239,68,68,0.25)",
                  borderColor: "rgba(239,68,68,0.4)",
                  color: "#FCA5A5",
                }}
              >
                ✗ {rejectedCount} rejetées
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        {/* Tab pills */}
        <div className="flex gap-2 flex-wrap">
          {[
            {
              value: "en_attente",
              label: "En attente",
              count: pendingCount,
              color: "bg-amber-100 text-amber-800 border-amber-200",
              activeColor: "bg-amber-500 text-white border-amber-500",
            },
            {
              value: "validee",
              label: "Validées",
              count: validatedCount,
              color: "bg-emerald-100 text-emerald-800 border-emerald-200",
              activeColor: "bg-emerald-600 text-white border-emerald-600",
            },
            {
              value: "rejetee",
              label: "Rejetées",
              count: rejectedCount,
              color: "bg-red-100 text-red-800 border-red-200",
              activeColor: "bg-red-500 text-white border-red-500",
            },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${activeTab === tab.value ? tab.activeColor : tab.color + " hover:brightness-95"}`}
            >
              {tab.label}
              <span
                className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black ${activeTab === tab.value ? "bg-white/25" : "bg-white/70"}`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 border border-border bg-white rounded-xl w-full sm:w-72 h-9 shadow-sm">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            className="border-0 shadow-none focus-visible:ring-0 text-sm h-full bg-transparent"
            placeholder="Rechercher par nom, secteur…"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredCompanies.length === 0 ? (
        <div className="dash-empty">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-4xl mb-2">
            🏢
          </div>
          <h3 className="font-display font-bold text-xl text-foreground">
            Aucune entreprise dans cette catégorie
          </h3>
          <p className="text-sm text-muted-foreground">
            Les demandes de modération s'afficheront ici.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCompanies.map((c) => {
            const recruiterName = displayName(profiles[c.owner_id], "Recruteur inconnu");
            const statusConfig = {
              en_attente: {
                bg: "bg-amber-50",
                border: "border-amber-200",
                badge: "bg-amber-100 text-amber-700",
                dot: "bg-amber-400",
                label: "En attente",
              },
              validee: {
                bg: "bg-emerald-50/30",
                border: "border-emerald-200/60",
                badge: "bg-emerald-100 text-emerald-700",
                dot: "bg-emerald-500",
                label: "Validée",
              },
              rejetee: {
                bg: "bg-red-50/30",
                border: "border-red-200/50",
                badge: "bg-red-100 text-red-600",
                dot: "bg-red-400",
                label: "Rejetée",
              },
            }[c.statut] ?? {
              bg: "bg-white",
              border: "border-border",
              badge: "bg-muted text-muted-foreground",
              dot: "bg-gray-400",
              label: c.statut,
            };

            return (
              <div
                key={c.id}
                className={`p-5 ${statusConfig.bg} border ${statusConfig.border} rounded-2xl transition-shadow hover:shadow-md`}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Logo */}
                    {c.logo_url ? (
                      <img
                        src={c.logo_url}
                        alt={`Logo ${c.nom}`}
                        className="w-14 h-14 rounded-xl object-cover border border-white shadow-sm shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-white border border-border/60 flex items-center justify-center shrink-0 shadow-sm">
                        <Building2 className="w-7 h-7 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-display font-bold text-xl text-foreground">{c.nom}</h2>
                        <span className={`badge-modern ${statusConfig.badge}`}>
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} inline-block`}
                          />
                          {statusConfig.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1.5">
                        {c.secteur && <span className="font-medium">{c.secteur}</span>}
                        {c.secteur && c.localisation && <span>·</span>}
                        {c.localisation && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {c.localisation}
                          </span>
                        )}
                        <span>·</span>
                        <span className="text-primary font-semibold">{recruiterName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {c.site_web && (
                      <a
                        href={c.site_web.startsWith("http") ? c.site_web : `https://${c.site_web}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 gap-1 text-xs font-bold rounded-lg"
                        >
                          <Globe className="h-3.5 w-3.5" /> Site
                        </Button>
                      </a>
                    )}

                    {c.statut === "en_attente" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-8 gap-1 text-xs font-bold px-4"
                          onClick={() => updateStatus(c.id, "validee")}
                        >
                          <Check className="h-3.5 w-3.5" /> Approuver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl h-8 gap-1 text-xs font-bold px-4"
                          onClick={() => updateStatus(c.id, "rejetee")}
                        >
                          <X className="h-3.5 w-3.5" /> Rejeter
                        </Button>
                      </>
                    )}

                    {c.statut === "validee" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl h-8 gap-1 text-xs font-bold px-4"
                        onClick={() => updateStatus(c.id, "rejetee")}
                      >
                        <X className="h-3.5 w-3.5" /> Révoquer
                      </Button>
                    )}

                    {c.statut === "rejetee" && (
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-8 gap-1 text-xs font-bold px-4"
                        onClick={() => updateStatus(c.id, "validee")}
                      >
                        <Check className="h-3.5 w-3.5" /> Réhabiliter
                      </Button>
                    )}
                  </div>
                </div>

                {c.description && (
                  <div className="mt-4 pt-4 border-t border-white/60 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {c.description}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
