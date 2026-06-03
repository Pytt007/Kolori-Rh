import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getMockCvs, getMockApplications, saveMockApplication } from "@/lib/mockData";
import { useAuth } from "@/lib/auth-context";
import { ensureCandidate } from "@/lib/candidate";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Cv = { id: string; nom_fichier: string };

export function PostulerDialog({
  offerId,
  offerTitle,
  onSubmitted,
}: {
  offerId: string;
  offerTitle: string;
  onSubmitted?: () => void;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [cvs, setCvs] = useState<Cv[]>([]);
  const [cvId, setCvId] = useState<string>("");
  const [lettre, setLettre] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      try {
        const cid = await ensureCandidate(user.id);

        let list: Cv[] = [];
        try {
          const { data, error } = await supabase
            .from("cv_documents")
            .select("id, nom_fichier")
            .eq("candidate_id", cid)
            .order("created_at", { ascending: false });
          if (error) throw error;
          list = (data as Cv[]) ?? [];
        } catch (cvErr) {
          console.warn("Failed to load CVs from Supabase, trying mock fallback:", cvErr);
        }

        if (list.length > 0) {
          setCvs(list);
          setCvId(list[0].id);
        } else {
          const mockCvs = getMockCvs(cid);
          setCvs(mockCvs);
          if (mockCvs.length > 0) setCvId(mockCvs[0].id);
        }

        let existingApp = null;
        try {
          const { data: existing, error: appErr } = await supabase
            .from("applications")
            .select("id")
            .eq("candidate_id", cid)
            .eq("offer_id", offerId)
            .maybeSingle();
          if (appErr) throw appErr;
          existingApp = existing;
        } catch (appErr) {
          console.warn("Failed to query application from Supabase, trying mock fallback:", appErr);
        }

        if (existingApp) {
          setAlreadyApplied(true);
        } else {
          const mockApps = getMockApplications();
          const found = mockApps.find((a) => a.candidate_id === cid && a.offer_id === offerId);
          setAlreadyApplied(!!found);
        }
      } catch (err) {
        console.warn("PostulerDialog initialization failed, falling back completely to mock:", err);
        const mockCvs = getMockCvs("mock-candidate-1");
        setCvs(mockCvs);
        if (mockCvs.length > 0) setCvId(mockCvs[0].id);
        const mockApps = getMockApplications();
        const found = mockApps.find(
          (a) => a.candidate_id === "mock-candidate-1" && a.offer_id === offerId,
        );
        setAlreadyApplied(!!found);
      }
    })();
  }, [open, user, offerId]);
  async function onSubmit() {
    if (!user) return;
    setSubmitting(true);
    try {
      const cid = await ensureCandidate(user.id);
      const { error } = await supabase.from("applications").insert({
        candidate_id: cid,
        offer_id: offerId,
        cv_id: cvId || null,
        lettre: lettre || null,
      });
      if (error) throw error;
      toast.success("Candidature envoyée.");
      setOpen(false);
      setLettre("");
      onSubmitted?.();
    } catch (err) {
      console.warn("Database insert failed, falling back to local simulation:", err);
      const cid = await ensureCandidate(user.id);
      saveMockApplication({
        id: `app-${Date.now()}`,
        candidate_id: cid,
        offer_id: offerId,
        cv_id: cvId || null,
        lettre: lettre || null,
        statut: "envoyee",
        created_at: new Date().toISOString(),
      });
      toast.success("Candidature envoyée (Mode Démo).");
      setOpen(false);
      setLettre("");
      onSubmitted?.();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="lg" onClick={() => setOpen(true)}>
        Postuler à cette offre
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display italic text-2xl">
            Postuler — {offerTitle}
          </DialogTitle>
          <DialogDescription>Joignez votre CV et un mot d'introduction.</DialogDescription>
        </DialogHeader>

        {alreadyApplied ? (
          <p className="text-sm text-muted-foreground">
            Vous avez déjà postulé à cette offre. Retrouvez le suivi dans{" "}
            <Link to="/candidat/candidatures" className="underline text-primary">
              vos candidatures
            </Link>
            .
          </p>
        ) : (
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                CV joint
              </Label>
              {cvs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucun CV en ligne.{" "}
                  <Link to="/candidat/cv" className="underline text-primary">
                    Déposer un CV
                  </Link>
                  .
                </p>
              ) : (
                <select
                  className="bg-background border border-border rounded-sm px-3 py-2 text-sm"
                  value={cvId}
                  onChange={(e) => setCvId(e.target.value)}
                >
                  {cvs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nom_fichier}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Lettre de motivation (optionnel)
              </Label>
              <Textarea
                rows={6}
                value={lettre}
                onChange={(e) => setLettre(e.target.value)}
                placeholder="Un mot pour vous présenter…"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          {!alreadyApplied && (
            <Button disabled={submitting || cvs.length === 0} onClick={onSubmit}>
              {submitting ? "Envoi…" : "Envoyer ma candidature"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
