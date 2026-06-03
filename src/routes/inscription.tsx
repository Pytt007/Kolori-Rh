import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/site/AuthShell";
import { toast } from "sonner";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";

const searchSchema = z.object({
  role: z.enum(["candidat", "recruteur"]).catch("candidat"),
});

export const Route = createFileRoute("/inscription")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Créer un compte — Kolori RH" },
      { name: "description", content: "Créez votre compte candidat ou recruteur sur Kolori RH." },
    ],
  }),
  component: InscriptionPage,
});

function InscriptionPage() {
  const { role } = Route.useSearch();
  const navigate = useNavigate();
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);

  const setRole = (r: "candidat" | "recruteur") => {
    navigate({ to: "/inscription", search: { role: r }, replace: true });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Mot de passe trop court (8 caractères minimum)");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/connexion`,
        data: { prenom, nom, role },
      },
    });
    setBusy(false);
    if (error) {
      toast.error("Inscription impossible", { description: error.message });
      return;
    }
    toast.success("Compte créé.", {
      description: "Vérifiez votre email pour confirmer votre adresse.",
    });
    navigate({ to: "/connexion" });
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
      eyebrow={role === "recruteur" ? "Espace recruteur" : "Espace candidat"}
      title="Créer un compte."
      subtitle="Rejoignez la plateforme et démarrez votre prochain chapitre."
      footer={
        <>
          Déjà inscrit ?{" "}
          <Link to="/connexion" className="text-primary font-semibold hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      {/* Role toggle */}
      <div className="grid grid-cols-2 p-1 bg-[#f4f5f7] rounded-xl mb-5 gap-1">
        <button
          type="button"
          onClick={() => setRole("candidat")}
          className={`py-2 text-xs font-semibold rounded-lg transition-all ${
            role === "candidat"
              ? "bg-white shadow text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Je cherche un emploi
        </button>
        <button
          type="button"
          onClick={() => setRole("recruteur")}
          className={`py-2 text-xs font-semibold rounded-lg transition-all ${
            role === "recruteur"
              ? "bg-white shadow text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Je recrute
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* First/Last name */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="prenom" className="block text-xs font-semibold text-foreground mb-1.5">
              Prénom
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                id="prenom"
                type="text"
                required
                placeholder="Jean"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60"
              />
            </div>
          </div>
          <div>
            <label htmlFor="nom" className="block text-xs font-semibold text-foreground mb-1.5">
              Nom
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                id="nom"
                type="text"
                required
                placeholder="Koné"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60"
              />
            </div>
          </div>
        </div>

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
              minLength={8}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
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
          <p className="text-[11px] text-muted-foreground mt-1">Minimum 8 caractères.</p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={busy}
          className="w-full py-3 text-sm font-semibold text-white rounded-xl shadow-md transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          style={{ background: "var(--primary)" }}
        >
          {busy ? "Création…" : "Créer mon compte"}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs text-muted-foreground font-mono uppercase tracking-widest">
            ou
          </span>
        </div>
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogle}
        className="w-full flex items-center justify-center gap-2.5 py-2.5 text-sm font-semibold border border-border rounded-xl bg-white hover:bg-secondary/50 transition-colors shadow-sm"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        S'inscrire avec Google
      </button>

      {/* Legal */}
      <p className="text-[11px] text-muted-foreground mt-5 leading-relaxed">
        En créant un compte, vous acceptez nos{" "}
        <Link to="/mentions-legales" className="underline hover:text-primary">
          conditions d'utilisation
        </Link>{" "}
        et notre{" "}
        <Link to="/confidentialite" className="underline hover:text-primary">
          politique de confidentialité
        </Link>
        .
      </p>
    </AuthShell>
  );
}
