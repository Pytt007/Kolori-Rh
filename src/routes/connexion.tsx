import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/site/AuthShell";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/connexion")({
  head: () => ({
    meta: [
      { title: "Connexion — Kolori RH" },
      { name: "description", content: "Connectez-vous à votre espace candidat ou recruteur sur Kolori RH." },
    ],
  }),
  component: ConnexionPage,
});

function ConnexionPage() {
  const navigate = useNavigate();
  const { isAuthenticated, roles, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      const target = roles.includes("admin") ? "/admin" : roles.includes("recruteur") ? "/recruteur" : "/candidat";
      navigate({ to: target, replace: true });
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
    toast.success("Bienvenue.");
  };

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) toast.error("Connexion Google impossible", { description: error.message });
  };

  return (
    <AuthShell
      eyebrow="Accès"
      title="Connexion."
      subtitle="Retrouvez votre espace, vos candidatures et vos conversations."
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link to="/inscription" className="text-primary font-semibold hover:underline">
            Créer un compte
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-foreground mb-1.5">
            Adresse email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              id="email"
              type="email"
              required
              placeholder="johndoe@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-foreground mb-1.5">
            Mot de passe
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              id="password"
              type={showPwd ? "text" : "password"}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full pl-10 pr-10 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Remember + forgot */}
        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-3.5 h-3.5 accent-primary rounded"
            />
            Se souvenir de moi
          </label>
          <Link to="/mot-de-passe-oublie" className="text-muted-foreground hover:text-primary transition-colors">
            Mot de passe oublié
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={busy}
          className="w-full py-3 text-sm font-semibold text-white rounded-xl shadow-md transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          style={{ background: "var(--primary)" }}
        >
          {busy ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs text-muted-foreground font-mono uppercase tracking-widest">ou</span>
        </div>
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogle}
        className="w-full flex items-center justify-center gap-2.5 py-2.5 text-sm font-semibold border border-border rounded-xl bg-white hover:bg-secondary/50 transition-colors shadow-sm"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continuer avec Google
      </button>

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

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            localStorage.setItem("mock_auth_user", JSON.stringify({ id: "mock-candidate-1", email: "candidat@demo.ci" }));
            localStorage.setItem("mock_auth_roles", JSON.stringify(["candidat"]));
            window.location.href = "/candidat";
          }}
          className="py-2.5 text-xs font-semibold rounded-xl border transition-all hover:shadow-md"
          style={{
            background: "hsl(219 51% 24% / 0.06)",
            borderColor: "hsl(219 51% 24% / 0.25)",
            color: "var(--primary)",
          }}
        >
          Accès Candidat Démo
        </button>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem("mock_auth_user", JSON.stringify({ id: "mock-recruiter-1", email: "recruteur@demo.ci" }));
            localStorage.setItem("mock_auth_roles", JSON.stringify(["recruteur"]));
            window.location.href = "/recruteur";
          }}
          className="py-2.5 text-xs font-semibold rounded-xl border transition-all hover:shadow-md"
          style={{
            background: "hsl(359 70% 36% / 0.06)",
            borderColor: "hsl(359 70% 36% / 0.25)",
            color: "var(--accent)",
          }}
        >
          Accès Recruteur Démo
        </button>
      </div>
    </AuthShell>
  );
}
