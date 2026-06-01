import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, Search, Shield, UserCheck } from "lucide-react";

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
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  async function loadUsers() {
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
  }, []);

  async function handleRoleChange(userId: string, newRole: "candidat" | "recruteur" | "admin") {
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
          .insert({ user_id: userId })
          .onConflict("user_id")
          .ignore();

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

  if (loading) return <div className="text-sm font-mono text-muted-foreground">Chargement des utilisateurs…</div>;

  return (
    <>
      <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3 font-semibold">
        Supervision
      </div>
      <h1 className="font-display italic text-5xl mb-10">Gestion des Utilisateurs.</h1>

      <div className="flex gap-3 mb-8 max-w-md">
        <div className="flex-1 flex items-center px-3 border border-border bg-card rounded-sm">
          <Search className="h-4 w-4 text-muted-foreground mr-2" />
          <Input
            className="border-0 shadow-none focus-visible:ring-0 text-sm"
            placeholder="Rechercher par nom, prénom, ville…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="border border-border rounded-sm bg-card overflow-hidden">
        {filteredProfiles.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground text-center">Aucun utilisateur trouvé.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans border-collapse">
              <thead>
                <tr className="border-b border-border font-mono text-xs uppercase tracking-widest text-muted-foreground bg-secondary/20">
                  <th className="py-4 px-6">Utilisateur</th>
                  <th className="py-4 px-6">Téléphone</th>
                  <th className="py-4 px-6">Ville</th>
                  <th className="py-4 px-6">Date d'inscription</th>
                  <th className="py-4 px-6">Rôle actuel</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredProfiles.map((p) => {
                  const fullName = [p.prenom, p.nom].filter(Boolean).join(" ");
                  return (
                    <tr key={p.id} className="hover:bg-secondary/5">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                            {fullName.charAt(0) || "U"}
                          </div>
                          <div>
                            <div className="font-semibold">{fullName || "Utilisateur sans nom"}</div>
                            <div className="text-xs text-muted-foreground font-mono">{p.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground font-mono text-xs">
                        {p.telephone ?? "—"}
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">
                        {p.ville ?? "—"}
                      </td>
                      <td className="py-4 px-6 text-xs font-mono text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-xs font-mono uppercase tracking-wider px-2.5 py-1 rounded-sm font-semibold ${
                          p.role === "admin" 
                            ? "bg-red-100 text-red-800 border border-red-200" 
                            : p.role === "recruteur" 
                              ? "bg-blue-100 text-blue-800 border border-blue-200" 
                              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}>
                          {p.role}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <select
                          disabled={updatingUserId === p.id}
                          className="bg-transparent border border-border rounded-sm px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
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
        )}
      </div>
    </>
  );
}
