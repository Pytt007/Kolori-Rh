import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/site/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/reinitialiser-mot-de-passe")({
  head: () => ({ meta: [{ title: "Réinitialiser le mot de passe — L'Alternative" }] }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("8 caractères minimum");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error("Modification impossible", { description: error.message });
      return;
    }
    toast.success("Mot de passe mis à jour");
    navigate({ to: "/connexion" });
  };

  return (
    <AuthShell eyebrow="Sécurité" title="Nouveau mot de passe.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="password">Nouveau mot de passe</Label>
          <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </form>
    </AuthShell>
  );
}
