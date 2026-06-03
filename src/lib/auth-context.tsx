import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "candidat" | "recruteur" | "admin";

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  loading: boolean;
  hasRole: (role: AppRole) => boolean;
  signOut: () => Promise<void>;
}

const defaultAuth: AuthState = {
  isAuthenticated: false,
  user: null,
  session: null,
  roles: [],
  loading: true,
  hasRole: () => false,
  signOut: async () => {},
};

const AuthContext = createContext<AuthState>(defaultAuth);

export function useAuth() {
  return useContext(AuthContext);
}

async function fetchRoles(userId: string): Promise<AppRole[]> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((r) => r.role as AppRole);
}

async function uploadBase64Image(userId: string, base64: string, isAvatar: boolean): Promise<string | null> {
  try {
    const parts = base64.split(";base64,");
    const contentType = parts[0].split(":")[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    const blob = new Blob([uInt8Array], { type: contentType });
    const ext = contentType.split("/")[1] || "png";
    const filename = `${Date.now()}.${ext}`;

    if (isAvatar) {
      const path = `avatars/${userId}/${filename}`;
      const { error } = await supabase.storage
        .from("company_logos")
        .upload(path, blob, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("company_logos").getPublicUrl(path);
      return data.publicUrl;
    } else {
      const path = `${userId}/${filename}`;
      const { error } = await supabase.storage
        .from("company_logos")
        .upload(path, blob, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("company_logos").getPublicUrl(path);
      return data.publicUrl;
    }
  } catch (e) {
    console.error("Échec du téléversement Base64 :", e);
    return null;
  }
}

async function syncUserMetadataToTables(user: User) {
  const metadata = user.user_metadata;
  if (!metadata || !metadata.role) return;

  const role = metadata.role;
  const prenom = metadata.prenom;
  const nom = metadata.nom;
  const telephone = metadata.telephone;
  const ville = metadata.ville;

  try {
    // 1. Sync profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, telephone, ville, photo_url")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      const profileUpdates: any = {};
      if (!profile.telephone && telephone) profileUpdates.telephone = telephone;
      if (!profile.ville && ville) profileUpdates.ville = ville;

      // Synchronisation de la photo si présente dans le localStorage suite à l'inscription
      const pendingPhoto = typeof window !== "undefined" ? localStorage.getItem("signup_pending_photo") : null;
      if (pendingPhoto && !profile.photo_url) {
        const publicUrl = await uploadBase64Image(user.id, pendingPhoto, true);
        if (publicUrl) {
          profileUpdates.photo_url = publicUrl;
          localStorage.removeItem("signup_pending_photo");
        }
      }

      if (Object.keys(profileUpdates).length > 0) {
        await supabase.from("profiles").update(profileUpdates).eq("id", user.id);
      }
    }

    // 2. Sync role-specific tables
    if (role === "candidat") {
      const { data: candidate } = await supabase
        .from("candidates")
        .select("id, titre")
        .eq("user_id", user.id)
        .maybeSingle();

      if (candidate) {
        if (!candidate.titre && metadata.titre) {
          const comps = metadata.competences;
          const competencesArray = Array.isArray(comps)
            ? comps
            : typeof comps === "string"
            ? comps.split(",").map((s: string) => s.trim()).filter(Boolean)
            : [];

          await supabase
            .from("candidates")
            .update({
              titre: metadata.titre || null,
              diplome: metadata.diplome || null,
              competences: competencesArray,
              disponibilite: metadata.disponibilite || null,
              pretention_salariale: metadata.pretention_salariale || null,
              bio: metadata.bio || null,
              ville: metadata.ville || null,
            })
            .eq("user_id", user.id);
        }
      } else {
        const comps = metadata.competences;
        const competencesArray = Array.isArray(comps)
          ? comps
          : typeof comps === "string"
          ? comps.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [];

        await supabase.from("candidates").insert({
          user_id: user.id,
          titre: metadata.titre || null,
          diplome: metadata.diplome || null,
          competences: competencesArray,
          disponibilite: metadata.disponibilite || null,
          pretention_salariale: metadata.pretention_salariale || null,
          bio: metadata.bio || null,
          ville: metadata.ville || null,
        });
      }
    } else if (role === "recruteur") {
      const { data: company } = await supabase
        .from("companies")
        .select("id, logo_url")
        .eq("owner_id", user.id)
        .maybeSingle();

      let publicLogoUrl = null;
      const pendingLogo = typeof window !== "undefined" ? localStorage.getItem("signup_pending_logo") : null;
      if (pendingLogo && (!company || !company.logo_url)) {
        publicLogoUrl = await uploadBase64Image(user.id, pendingLogo, false);
        if (publicLogoUrl) {
          localStorage.removeItem("signup_pending_logo");
        }
      }

      if (!company && metadata.nom_entreprise) {
        await supabase.from("companies").insert({
          owner_id: user.id,
          nom: metadata.nom_entreprise,
          secteur: metadata.secteur || null,
          localisation: metadata.localisation || null,
          site_web: metadata.site_web || null,
          description: metadata.description || null,
          logo_url: publicLogoUrl || null,
          statut: "en_attente",
        });
      } else if (company && publicLogoUrl && !company.logo_url) {
        await supabase
          .from("companies")
          .update({ logo_url: publicLogoUrl })
          .eq("id", company.id);
      }
    }
  } catch (err) {
    console.error("Erreur de synchronisation inscription :", err);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check mock authentication in localStorage first
    const mockUserStr =
      typeof window !== "undefined" ? localStorage.getItem("mock_auth_user") : null;
    const mockRolesStr =
      typeof window !== "undefined" ? localStorage.getItem("mock_auth_roles") : null;
    if (mockUserStr && mockRolesStr) {
      const mockUser = JSON.parse(mockUserStr);
      setUser(mockUser);
      setRoles(JSON.parse(mockRolesStr));
      setSession({
        access_token: "mock-token",
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "mock-refresh",
        user: mockUser,
      } as any);
      setLoading(false);
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // If we are in mock mode, ignore
      if (typeof window !== "undefined" && localStorage.getItem("mock_auth_user")) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        // defer to avoid recursion warning
        setTimeout(() => {
          fetchRoles(newSession.user.id).then(setRoles);
          syncUserMetadataToTables(newSession.user);
        }, 0);
      } else {
        setRoles([]);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (typeof window !== "undefined" && localStorage.getItem("mock_auth_user")) return;

      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        syncUserMetadataToTables(data.session.user);
        fetchRoles(data.session.user.id)
          .then(setRoles)
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthState = {
    isAuthenticated: !!user,
    user,
    session,
    roles,
    loading,
    hasRole: (role) => roles.includes(role),
    signOut: async () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("mock_auth_user");
        localStorage.removeItem("mock_auth_roles");
      }
      await supabase.auth.signOut();
      setUser(null);
      setRoles([]);
      setSession(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
