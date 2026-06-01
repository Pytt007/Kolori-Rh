import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getMockCvs, saveMockCv } from "@/lib/mockData";
import { useAuth } from "@/lib/auth-context";
import { ensureCandidate } from "@/lib/candidate";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Trash2, Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/candidat/cv")({
  component: CandidatCV,
});

type CvRow = { id: string; nom_fichier: string; storage_path: string; taille: number | null; created_at: string };

const ACCEPTED = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const MAX_SIZE = 5 * 1024 * 1024;

function CandidatCV() {
  const { user } = useAuth();
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [docs, setDocs] = useState<CvRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function refresh(cid: string) {
    const { data } = await supabase
      .from("cv_documents")
      .select("id, nom_fichier, storage_path, taille, created_at")
      .eq("candidate_id", cid)
      .order("created_at", { ascending: false });
    if (data && data.length > 0) {
      setDocs((data as CvRow[]) ?? []);
    } else {
      setDocs(getMockCvs(cid) as any);
    }
  }

  useEffect(() => {
    if (!user) return;
    (async () => {
      const cid = await ensureCandidate(user.id);
      setCandidateId(cid);
      await refresh(cid);
    })();
  }, [user]);

  async function handleFile(file: File) {
    if (!user || !candidateId) return;
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Format non supporté. PDF, DOC ou DOCX uniquement.");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Fichier trop volumineux (5 Mo max).");
      return;
    }
    setUploading(true);
    try {
      const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("cvs").upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from("cv_documents").insert({
        candidate_id: candidateId,
        nom_fichier: file.name,
        storage_path: path,
        taille: file.size,
        type: "cv",
      });
      if (insErr) throw insErr;
      toast.success("CV ajouté.");
      await refresh(candidateId);
    } catch (err: unknown) {
      console.warn("Storage upload failed, falling back to local simulation:", err);
      saveMockCv({
        id: `cv-${Date.now()}`,
        nom_fichier: file.name,
        candidate_id: candidateId,
        created_at: new Date().toISOString()
      } as any);
      toast.success("CV ajouté (Mode Démo).");
      await refresh(candidateId);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function remove(doc: CvRow) {
    if (!candidateId) return;
    if (!confirm(`Supprimer "${doc.nom_fichier}" ?`)) return;
    try {
      const { error: sErr } = await supabase.storage.from("cvs").remove([doc.storage_path]);
      if (sErr) console.warn(sErr);
      const { error } = await supabase.from("cv_documents").delete().eq("id", doc.id);
      if (error) throw error;
      toast.success("CV supprimé.");
      await refresh(candidateId);
    } catch (err) {
      console.warn("Database delete failed, falling back to local simulation:", err);
      const key = `mock_cvs_${candidateId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const list = JSON.parse(stored).filter((c: any) => c.id !== doc.id);
        localStorage.setItem(key, JSON.stringify(list));
      }
      toast.success("CV supprimé (Mode Démo).");
      await refresh(candidateId);
    }
  }

  async function download(doc: CvRow) {
    if (doc.id.startsWith("cv-")) {
      toast.success("Téléchargement du fichier démo lancé.");
      return;
    }
    const { data, error } = await supabase.storage.from("cvs").createSignedUrl(doc.storage_path, 60);
    if (error || !data) {
      toast.error("Lien indisponible.");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  return (
    <>
      <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Documents</div>
      <h1 className="font-display italic text-5xl mb-10">Mes CV.</h1>

      <div className="border-2 border-dashed border-border rounded-sm p-8 text-center mb-8 bg-card">
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground mb-4">PDF, DOC ou DOCX — 5 Mo maximum.</p>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <Button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? "Téléversement…" : "Choisir un fichier"}
        </Button>
      </div>

      <div className="border border-border rounded-sm divide-y divide-border bg-card">
        {docs.length === 0 && <div className="p-6 text-sm text-muted-foreground">Aucun CV pour l'instant.</div>}
        {docs.map((d) => (
          <div key={d.id} className="p-4 flex items-center gap-4">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{d.nom_fichier}</div>
              <div className="text-xs text-muted-foreground font-mono">
                {d.taille ? `${(d.taille / 1024).toFixed(0)} ko` : "—"} · {new Date(d.created_at).toLocaleDateString("fr-FR")}
              </div>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => download(d)}><Download className="h-4 w-4" /></Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => remove(d)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
      </div>
    </>
  );
}
