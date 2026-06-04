import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, Search, Shield, UserCheck } from "lucide-react";
import { getMockUsers, saveMockUser } from "@/lib/mockData";

export const Route = createFileRoute("/_authenticated/admin/utilisateurs")({
  component: AdminUtilisateurs,
});

type ProfileRow = {
  id: string;
  nom: string | null;
  prenom: string | null;
  telephone: string | null;
  ville: string | null;
  created_at: string;
  role?: string;
};

function AdminUtilisateurs() {
  const { user } = useAuth();
  const isMock = user?.id.startsWith("mock-");

  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  async function loadUsers() {
    if (!user) return;
    // ── Mock mode ──────────────────────────────
    if (isMock) {
      const mockUsers = getMockUsers();
      setProfiles(
        mockUsers.map((u) => ({
          id: u.id,
          nom: u.nom,
          prenom: u.prenom,
          telephone: u.telephone,
          ville: u.ville,
          created_at: u.created_at,
          role: u.role,
        })),
      );
      setLoading(false);
      return;
    }
    // ── Supabase ───────────────────────────────
    try {
      setLoading(true);
      // Récupérer tous les profils
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, nom, prenom, telephone, ville, created_at")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Récupérer tous les rôles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const rolesMap: Record<string, string> = {};
      rolesData?.forEach((r) => {
        rolesMap[r.user_id] = r.role;
      });

      const enrichedProfiles = (profilesData ?? []).map((p) => ({
        ...p,
        role: rolesMap[p.id] || "candidat", // par défaut s'il n'y a pas de rôle
      }));

      setProfiles(enrichedProfiles);
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger les utilisateurs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [user]);

  async function handleRoleChange(userId: string, newRole: "candidat" | "recruteur" | "admin") {
    if (isMock) {
      const all = getMockUsers();
      const u = all.find((x) => x.id === userId);
      if (u) {
        u.role = newRole;
        saveMockUser(u);
      }
      toast.success("Rôle utilisateur mis à jour.");
      loadUsers();
      return;
    }
    try {
      setUpdatingUserId(userId);

      // 1. Supprimer l'ancien rôle
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      // 2. Insérer le nouveau rôle
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole });

      if (insertError) throw insertError;

      // 3. Si le rôle est candidat, s'assurer qu'il a une ligne dans candidates
      if (newRole === "candidat") {
        const { error: candidateError } = await supabase
          .from("candidates")
          .upsert({ user_id: userId }, { onConflict: "user_id" });

        if (candidateError) console.warn("Candidates insert error:", candidateError);
      }

      toast.success("Rôle utilisateur mis à jour.");
      loadUsers();
    } catch (err) {
      console.error(err);
      toast.error("Impossible de mettre à jour le rôle.");
    } finally {
      setUpdatingUserId(null);
    }
  }

  const filteredProfiles = profiles.filter((p) => {
    const nameBlob = `${p.nom ?? ""} ${p.prenom ?? ""} ${p.ville ?? ""}`.toLowerCase();
    return nameBlob.includes(searchQuery.toLowerCase());
  });

  if (loading)
    return (
      <div className="dash-empty">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">Chargement des utilisateurs…</p>
      </div>
    );

  const adminCount = profiles.filter((p) => p.role === "admin").length;
  const recruiterCount = profiles.filter((p) => p.role === "recruteur").length;
  const candidateCount = profiles.filter((p) => p.role === "candidat").length;

  return (
    <>
      {/* ── Hero Header ─────────────────────────────────────────────────── */}
      <div className="page-hero page-hero-admin animate-reveal">
        <div
          className="page-hero-blob"
          style={{ width: 300, height: 300, background: "#9c1c1e", top: -110, right: -80 }}
        />
        <div
          className="page-hero-blob"
          style={{ width: 180, height: 180, background: "#1c305c", bottom: -60, left: 40 }}
        />
        <div className="hero-content">
          <div className="dash-section-title" style={{ color: "rgba(255,255,255,0.6)" }}>
            Supervision
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white mb-3">
            Gestion des Utilisateurs
          </h1>
          <div className="flex flex-wrap gap-2">
            <span
              className="stat-pill"
              style={{
                background: "rgba(255,255,255,0.15)",
                borderColor: "rgba(255,255,255,0.2)",
                color: "white",
              }}
            >
              👥 {profiles.length} utilisateur{profiles.length !== 1 ? "s" : ""}
            </span>
            <span
              className="stat-pill"
              style={{
                background: "rgba(239,68,68,0.25)",
                borderColor: "rgba(239,68,68,0.4)",
                color: "#FCA5A5",
              }}
            >
              🛡️ {adminCount} admin{adminCount !== 1 ? "s" : ""}
            </span>
            <span
              className="stat-pill"
              style={{
                background: "rgba(59,130,246,0.25)",
                borderColor: "rgba(59,130,246,0.4)",
                color: "#BFDBFE",
              }}
            >
              🏢 {recruiterCount} recruteur{recruiterCount !== 1 ? "s" : ""}
            </span>
            <span
              className="stat-pill"
              style={{
                background: "rgba(16,185,129,0.25)",
                borderColor: "rgba(16,185,129,0.4)",
                color: "#6EE7B7",
              }}
            >
              🧑 {candidateCount} candidat{candidateCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* ── Search ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-border/60 rounded-2xl shadow-sm p-4 mb-5">
        <div className="flex items-center gap-2 px-3 border border-border/60 rounded-xl bg-slate-50 max-w-md h-10">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            className="border-0 shadow-none focus-visible:ring-0 text-sm bg-transparent"
            placeholder="Rechercher par nom, prénom, ville…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredProfiles.length === 0 ? (
        <div className="dash-empty">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-4xl mb-2">
            👥
          </div>
          <h3 className="font-display font-bold text-xl text-foreground">
            Aucun utilisateur trouvé
          </h3>
          <p className="text-sm text-muted-foreground">Essayez de modifier votre recherche.</p>
        </div>
      ) : (
        <div className="bg-white border border-border/60 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Téléphone</th>
                  <th>Ville</th>
                  <th>Inscription</th>
                  <th>Rôle</th>
                  <th style={{ textAlign: "right" }}>Modifier le rôle</th>
                </tr>
              </thead>
              <tbody>
                {filteredProfiles.map((p) => {
                  const fullName = [p.prenom, p.nom].filter(Boolean).join(" ");
                  const initials =
                    [p.prenom?.charAt(0), p.nom?.charAt(0)]
                      .filter(Boolean)
                      .join("")
                      .toUpperCase() || "?";
                  const roleConfig = {
                    admin: {
                      badge: "bg-red-100 text-red-800 border border-red-200",
                      avatar: "from-red-500 to-rose-600",
                      label: "Admin",
                    },
                    recruteur: {
                      badge: "bg-blue-100 text-blue-800 border border-blue-200",
                      avatar: "from-blue-500 to-indigo-600",
                      label: "Recruteur",
                    },
                    candidat: {
                      badge: "bg-emerald-100 text-emerald-800 border border-emerald-200",
                      avatar: "from-emerald-500 to-teal-600",
                      label: "Candidat",
                    },
                  }[p.role ?? "candidat"] ?? {
                    badge: "bg-muted text-muted-foreground border border-border",
                    avatar: "from-slate-400 to-slate-600",
                    label: p.role ?? "?",
                  };

                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl bg-gradient-to-br ${roleConfig.avatar} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm`}
                          >
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-foreground">
                              {fullName || "Utilisateur sans nom"}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              {p.id.slice(0, 8)}…
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-muted-foreground font-mono text-xs">
                        {p.telephone ?? "—"}
                      </td>
                      <td className="text-muted-foreground text-sm">{p.ville ?? "—"}</td>
                      <td className="text-xs font-mono text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td>
                        <span className={`badge-modern ${roleConfig.badge}`}>
                          {roleConfig.label}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <select
                          disabled={updatingUserId === p.id}
                          className="bg-slate-50 border border-border/60 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                          value={p.role}
                          onChange={(e) => handleRoleChange(p.id, e.target.value as any)}
                        >
                          <option value="candidat">Candidat</option>
                          <option value="recruteur">Recruteur</option>
                          <option value="admin">Administrateur</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
