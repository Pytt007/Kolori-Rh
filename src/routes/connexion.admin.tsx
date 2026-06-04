import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/site/AuthShell";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/connexion/admin")({
  head: () => ({
    meta: [
      { title: "Connexion Admin — Kolori RH" },
      {
        name: "description",
        content: "Connectez-vous à votre espace administrateur sur Kolori RH.",
      },
    ],
  }),
  component: ConnexionAdminPage,
});

function ConnexionAdminPage() {
  const navigate = useNavigate();
  const { isAuthenticated, roles, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (roles.includes("admin")) {
        navigate({ to: "/admin", replace: true });
      } else {
        const target = roles.includes("recruteur") ? "/recruteur" : "/candidat";
        toast.warning("Vous êtes déjà connecté avec un autre type de compte.");
        navigate({ to: target, replace: true });
      }
    }
  }, [isAuthenticated, loading, roles, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error("Identifiants invalides", { description: error.message });
      return;
    }
    toast.success("Bienvenue dans votre espace d'administration.");
  };

  return (
    <AuthShell
      role="admin"
      eyebrow="Espace Administrateur"
      title="Connexion Administrateur"
      subtitle="Accédez au panneau de contrôle sécurisé de Kolori RH pour gérer la plateforme."
      footer={
        <div>
          <Link
            to="/connexion"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3 w-3" /> Retour aux choix de connexion
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-foreground mb-1.5">
            Adresse email administrateur
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
            <Input
              id="email"
              type="email"
              required
              placeholder="admin@demo.ci"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="pl-10 h-11 rounded-xl border-border bg-white shadow-sm focus:ring-[#7c3aed]/20 focus:border-[#7c3aed] transition-all text-sm font-medium"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-foreground mb-1.5">
            Mot de passe sécurisé
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
            <Input
              id="password"
              type={showPwd ? "text" : "password"}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="pl-10 pr-10 h-11 rounded-xl border-border bg-white shadow-sm focus:ring-[#7c3aed]/20 focus:border-[#7c3aed] transition-all text-sm font-medium"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-20"
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Remember + forgot */}
        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground font-semibold">
            <Checkbox
              checked={remember}
              onCheckedChange={(checked) => setRemember(!!checked)}
            />
            Se souvenir de moi
          </label>
          <Link
            to="/mot-de-passe-oublie"
            className="text-muted-foreground hover:text-[#7c3aed] transition-colors"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={busy}
          className="w-full py-3 text-sm font-semibold text-white rounded-xl shadow-md transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60 bg-[#7c3aed] cursor-pointer"
        >
          {busy ? "Connexion…" : "Se connecter (Admin)"}
        </button>
      </form>

      {/* Demo access */}
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
            Simulation / Démo
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          localStorage.setItem(
            "mock_auth_user",
            JSON.stringify({ id: "mock-admin-1", email: "admin@demo.ci" }),
          );
          localStorage.setItem("mock_auth_roles", JSON.stringify(["admin"]));
          window.location.href = "/admin";
        }}
        className="w-full py-2.5 text-xs font-semibold rounded-xl border transition-all hover:shadow-md cursor-pointer flex items-center justify-center gap-2"
        style={{
          background: "hsl(270 60% 40% / 0.07)",
          borderColor: "hsl(270 60% 40% / 0.30)",
          color: "hsl(270 60% 35%)",
        }}
      >
        🛡️ Se connecter en tant qu'Administrateur (Démo)
      </button>
    </AuthShell>
  );
}
