import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/site/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/mot-de-passe-oublie")({
  head: () => ({ meta: [{ title: "Mot de passe oublié — L'Alternative" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reinitialiser-mot-de-passe`,
    });
    setBusy(false);
    if (error) {
      toast.error("Envoi impossible", { description: error.message });
      return;
    }
    setSent(true);
  };

  return (
    <AuthShell
      eyebrow="Récupération"
      title="Mot de passe oublié."
      subtitle="Indiquez votre email, nous vous enverrons un lien de réinitialisation."
      footer={<Link to="/connexion" className="text-primary font-semibold hover:underline">Retour à la connexion</Link>}
    >
      {sent ? (
        <div className="p-6 bg-secondary rounded-sm text-sm">
          Si un compte existe pour <strong>{email}</strong>, un lien de réinitialisation vient d'être envoyé.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Envoi…" : "Envoyer le lien"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
