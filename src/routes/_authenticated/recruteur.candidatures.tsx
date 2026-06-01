import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { displayName, fetchProfilesByIds, getMyCompany, type ProfileLite } from "@/lib/recruiter";
import { APPLICATION_STATUS_LABELS } from "@/lib/candidate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

export const Route = createFileRoute("/_authenticated/recruteur/candidatures")({
  component: RecruteurCandidatures,
});

type App = {
  id: string;
  statut: string;
  created_at: string;
  lettre: string | null;
  notes_recruteur: string | null;
  cv_id: string | null;
  offer: { id: string; titre: string } | null;
  candidate: {
    id: string;
    user_id: string;
    titre: string | null;
    ville: string | null;
    bio: string | null;
    competences: string[] | null;
  } | null;
};

type MessageType = {
  id: string;
  sender_id: string;
  recipient_id: string;
  application_id: string | null;
  contenu: string;
  lu: boolean;
  created_at: string;
};

const STATUSES = ["envoyee", "recue", "en_analyse", "preselectionne", "entretien", "retenu", "rejete"] as const;

function RecruteurCandidatures() {
  const { user } = useAuth();
  const [rows, setRows] = useState<App[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterOffer, setFilterOffer] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<App | null>(null);
  const [notes, setNotes] = useState("");

  // État pour le chat contextuel
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<MessageType[]>([]);
  const [chatNewMsg, setChatNewMsg] = useState("");
  const [chatSending, setChatSending] = useState(false);

  async function load() {
    if (!user) return;
    try {
      const company = await getMyCompany(user.id);
      if (!company) { setLoading(false); return; }

      if (user.id === "mock-recruiter-1") {
        const { getMockJobOffers, getMockApplications } = await import("@/lib/mockData");
        const mockOffers = getMockJobOffers().filter((o) => o.company_id === company.id);
        const ids = mockOffers.map((o) => o.id);
        if (!ids.length) { setRows([]); setLoading(false); return; }

        const mockApps = getMockApplications().filter((a) => ids.includes(a.offer_id));
        const r: App[] = mockApps.map((a) => {
          const offer = mockOffers.find((o) => o.id === a.offer_id);
          return {
            id: a.id,
            statut: a.statut,
            created_at: a.created_at,
            lettre: a.lettre,
            notes_recruteur: (a as any).notes_recruteur ?? null,
            cv_id: a.cv_id,
            offer: offer ? { id: offer.id, titre: offer.titre } : null,
            candidate: {
              id: a.candidate_id,
              user_id: a.candidate_id,
              titre: "Directeur des Ressources Humaines",
              ville: "Abidjan",
              bio: "Candidat qualifié avec 8 ans d'expérience.",
              competences: ["Recrutement", "Droit social", "SYSCOHADA"]
            }
          };
        });
        setRows(r);
        setProfiles({
          "mock-candidate-1": {
            id: "mock-candidate-1",
            prenom: "Koffi",
            nom: "Anan",
            telephone: "+225 07 08 09 10 11"
          }
        });
        setLoading(false);
        return;
      }

      const { data: offers } = await supabase.from("job_offers").select("id").eq("company_id", company.id);
      const ids = (offers ?? []).map((o) => o.id);
      if (!ids.length) { setRows([]); setLoading(false); return; }
      const { data } = await supabase
        .from("applications")
        .select("id, statut, created_at, lettre, notes_recruteur, cv_id, offer:job_offers(id, titre), candidate:candidates(id, user_id, titre, ville, bio, competences)")
        .in("offer_id", ids)
        .order("created_at", { ascending: false });
      const r = (data as unknown as App[]) ?? [];
      setRows(r);
      const userIds = r.map((x) => x.candidate?.user_id).filter(Boolean) as string[];
      setProfiles(await fetchProfilesByIds(userIds));
    } catch (e: any) {
      console.warn("Failed loading applications from Supabase, falling back:", e);
      const company = await getMyCompany(user.id);
      if (company) {
        const { getMockJobOffers, getMockApplications } = await import("@/lib/mockData");
        const mockOffers = getMockJobOffers().filter((o) => o.company_id === company.id);
        const ids = mockOffers.map((o) => o.id);
        if (ids.length) {
          const mockApps = getMockApplications().filter((a) => ids.includes(a.offer_id));
          const r: App[] = mockApps.map((a) => {
            const offer = mockOffers.find((o) => o.id === a.offer_id);
            return {
              id: a.id,
              statut: a.statut,
              created_at: a.created_at,
              lettre: a.lettre,
              notes_recruteur: (a as any).notes_recruteur ?? null,
              cv_id: a.cv_id,
              offer: offer ? { id: offer.id, titre: offer.titre } : null,
              candidate: {
                id: a.candidate_id,
                user_id: a.candidate_id,
                titre: "Directeur des Ressources Humaines",
                ville: "Abidjan",
                bio: "Candidat qualifié avec 8 ans d'expérience.",
                competences: ["Recrutement", "Droit social"]
              }
            };
          });
          setRows(r);
          setProfiles({
            "mock-candidate-1": {
              id: "mock-candidate-1",
              prenom: "Koffi",
              nom: "Anan",
              telephone: "+225 07 08 09 10 11"
            }
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [user]);

  const offers = useMemo(() => {
    const m = new Map<string, string>();
    rows.forEach((r) => r.offer && m.set(r.offer.id, r.offer.titre));
    return Array.from(m.entries());
  }, [rows]);

  const filtered = rows.filter((r) => {
    if (filterStatus !== "all" && r.statut !== filterStatus) return false;
    if (filterOffer !== "all" && r.offer?.id !== filterOffer) return false;
    if (query) {
      const p = r.candidate ? profiles[r.candidate.user_id] : null;
      const name = `${p?.prenom ?? ""} ${p?.nom ?? ""} ${r.candidate?.titre ?? ""}`.toLowerCase();
      if (!name.includes(query.toLowerCase())) return false;
    }
    return true;
  });

  async function setStatus(id: string, st: string) {
    if (user?.id === "mock-recruiter-1") {
      const { getMockApplications, saveMockApplication } = await import("@/lib/mockData");
      const apps = getMockApplications();
      const match = apps.find((a) => a.id === id);
      if (match) {
        match.statut = st;
        saveMockApplication(match);
        toast.success("Statut mis à jour (simulation).");
        load();
        if (active?.id === id) setActive({ ...active, statut: st });
      }
      return;
    }
    const { error } = await supabase.from("applications").update({ statut: st as never }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Statut mis à jour.");
    load();
    if (active?.id === id) setActive({ ...active, statut: st });
  }

  async function openCV(cvId: string | null) {
    if (!cvId) { toast.info("Aucun CV joint."); return; }
    if (user?.id === "mock-recruiter-1" || cvId.startsWith("cv-")) {
      toast.success(`Téléchargement simulé pour le CV : ${cvId === "cv-1" ? "CV_Koffi_Anan_Directeur_RH.pdf" : "CV_Koffi_Anan_Consultant_Senior.pdf"}`);
      return;
    }
    const { data: cv } = await supabase.from("cv_documents").select("storage_path").eq("id", cvId).maybeSingle();
    if (!cv) { toast.error("CV introuvable."); return; }
    const { data, error } = await supabase.storage.from("cvs").createSignedUrl(cv.storage_path, 300);
    if (error) { toast.error(error.message); return; }
    window.open(data.signedUrl, "_blank");
  }

  async function saveNotes() {
    if (!active) return;
    if (user?.id === "mock-recruiter-1") {
      const { getMockApplications, saveMockApplication } = await import("@/lib/mockData");
      const apps = getMockApplications();
      const match = apps.find((a) => a.id === active.id);
      if (match) {
        (match as any).notes_recruteur = notes;
        saveMockApplication(match);
        toast.success("Notes enregistrées (simulation).");
        setActive({ ...active, notes_recruteur: notes });
      }
      return;
    }
    const { error } = await supabase.from("applications").update({ notes_recruteur: notes }).eq("id", active.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Notes enregistrées.");
    setActive({ ...active, notes_recruteur: notes });
  }

  function open(a: App) { setActive(a); setNotes(a.notes_recruteur ?? ""); }

  // Charger les messages du chat contextuel
  async function loadChatMessages(appId: string) {
    if (user?.id === "mock-recruiter-1") {
      const { getMockMessages } = await import("@/lib/mockData");
      const msgs = getMockMessages();
      const formatted = msgs.map((m) => ({
        id: m.id,
        sender_id: m.sender_id,
        recipient_id: m.recipient_id,
        application_id: appId,
        contenu: m.message,
        lu: m.lu,
        created_at: m.created_at
      }));
      setChatMessages(formatted);

      // Mark as read in local storage
      const updatedMsgs = msgs.map((m) => {
        if (m.recipient_id === user.id) {
          return { ...m, lu: true };
        }
        return m;
      });
      localStorage.setItem("mock_messages", JSON.stringify(updatedMsgs));
      return;
    }
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("application_id", appId)
      .order("created_at", { ascending: true });
    setChatMessages((data as MessageType[]) ?? []);

    if (user) {
      await supabase
        .from("messages")
        .update({ lu: true })
        .eq("application_id", appId)
        .eq("recipient_id", user.id);
    }
  }

  // Écouter les messages en temps réel pour le chat
  useEffect(() => {
    if (!chatOpen || !active) return;

    const mockUserStr = typeof window !== "undefined" ? localStorage.getItem("mock_auth_user") : null;
    const isMock = mockUserStr ? JSON.parse(mockUserStr).id === "mock-recruiter-1" : false;

    loadChatMessages(active.id);
    if (isMock) return;

    const channel = supabase
      .channel(`chat-contextual-${active.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `application_id=eq.${active.id}`,
        },
        (payload) => {
          const m = payload.new as MessageType;
          setChatMessages((prev) => {
            if (prev.some((x) => x.id === m.id)) return prev;
            return [...prev, m];
          });
          if (m.recipient_id === user?.id) {
            supabase.from("messages").update({ lu: true }).eq("id", m.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatOpen, active]);

  async function sendChatMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!chatNewMsg.trim() || !user || !active || !active.candidate) return;

    setChatSending(true);
    try {
      if (user.id === "mock-recruiter-1") {
        const { saveMockMessage } = await import("@/lib/mockData");
        const newMsgItem = {
          id: `msg-${Date.now()}`,
          sender_id: user.id,
          recipient_id: active.candidate.user_id,
          message: chatNewMsg.trim(),
          created_at: new Date().toISOString(),
          lu: false
        };
        saveMockMessage(newMsgItem);

        const formatted: MessageType = {
          id: newMsgItem.id,
          sender_id: newMsgItem.sender_id,
          recipient_id: newMsgItem.recipient_id,
          application_id: active.id,
          contenu: newMsgItem.message,
          lu: newMsgItem.lu,
          created_at: newMsgItem.created_at
        };
        setChatMessages((prev) => [...prev, formatted]);
        setChatNewMsg("");
        setChatSending(false);
        return;
      }

      const company = await getMyCompany(user.id);
      const companyName = company?.nom ?? "Un recruteur";

      const { data: insData } = await supabase
        .from("messages")
        .insert({
          sender_id: user.id,
          recipient_id: active.candidate.user_id,
          application_id: active.id,
          contenu: chatNewMsg.trim(),
        })
        .select("*")
        .single();

      await supabase.from("notifications").insert({
        user_id: active.candidate.user_id,
        type: "message",
        titre: `Nouveau message de ${companyName}`,
        message: chatNewMsg.trim().slice(0, 80) + (chatNewMsg.length > 80 ? "..." : ""),
        link: "/candidat/messages",
      });

      if (insData) {
        setChatMessages((prev) => [...prev, insData as MessageType]);
      }
      setChatNewMsg("");
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'envoyer le message.");
    } finally {
      setChatSending(false);
    }
  }

  if (loading) return <div className="text-sm font-mono text-muted-foreground">Chargement…</div>;

  return (
    <>
      <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Sélection</div>
      <h1 className="font-display italic text-5xl mb-10">Candidatures reçues.</h1>

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <Input placeholder="Rechercher un candidat…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select value={filterOffer} onValueChange={setFilterOffer}>
          <SelectTrigger><SelectValue placeholder="Offre" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les offres</SelectItem>
            {offers.map(([id, titre]) => <SelectItem key={id} value={id}>{titre}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{APPLICATION_STATUS_LABELS[s].label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-border rounded-sm">
          <p className="font-display italic text-2xl">Aucune candidature ne correspond aux filtres.</p>
        </div>
      ) : (
        <div className="border border-border rounded-sm divide-y divide-border bg-card">
          {filtered.map((a) => {
            const st = APPLICATION_STATUS_LABELS[a.statut] ?? { label: a.statut, tone: "bg-muted" };
            const name = displayName(a.candidate ? profiles[a.candidate.user_id] : null);
            return (
              <button key={a.id} onClick={() => open(a)} className="w-full text-left p-5 flex flex-wrap items-center gap-4 hover:bg-secondary/40">
                <div className="flex-1 min-w-[260px]">
                  <div className="font-display italic text-xl">{name}</div>
                  <div className="text-xs text-muted-foreground font-mono uppercase tracking-widest mt-1">
                    {a.candidate?.titre ?? "Profil"} {a.candidate?.ville ? `· ${a.candidate.ville}` : ""} · {a.offer?.titre} · {new Date(a.created_at).toLocaleDateString("fr-FR")}
                  </div>
                </div>
                <span className={`text-xs font-mono uppercase tracking-widest px-2 py-1 rounded-sm ${st.tone}`}>{st.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {active && (() => {
            const p = active.candidate ? profiles[active.candidate.user_id] : null;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="font-display italic text-3xl">{displayName(p)}</DialogTitle>
                </DialogHeader>
                <div className="space-y-5 text-sm">
                  <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    {active.candidate?.titre ?? "—"} {active.candidate?.ville ? `· ${active.candidate.ville}` : ""}
                  </div>
                  {p?.telephone && (
                    <div><span className="text-muted-foreground">Téléphone : </span>{p.telephone}</div>
                  )}
                  {active.candidate?.bio && (
                    <div><div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">À propos</div><p>{active.candidate.bio}</p></div>
                  )}
                  {active.candidate?.competences && active.candidate.competences.length > 0 && (
                    <div>
                      <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Compétences</div>
                      <div className="flex flex-wrap gap-2">
                        {active.candidate.competences.map((c) => <span key={c} className="text-xs px-2 py-1 bg-secondary rounded-sm">{c}</span>)}
                      </div>
                    </div>
                  )}
                  {active.lettre && (
                    <div><div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">Lettre de motivation</div><p className="whitespace-pre-wrap">{active.lettre}</p></div>
                  )}

                  <div className="border-t border-border pt-4">
                    <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Statut</div>
                    <div className="flex flex-wrap gap-2">
                      {STATUSES.map((s) => (
                        <Button key={s} size="sm" variant={active.statut === s ? "default" : "outline"} onClick={() => setStatus(active.id, s)}>
                          {APPLICATION_STATUS_LABELS[s].label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Notes internes</div>
                    <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
                    <Button size="sm" className="mt-2" onClick={saveNotes}>Enregistrer les notes</Button>
                  </div>

                  <div className="flex gap-2 border-t border-border pt-4">
                    <Button variant="outline" onClick={() => openCV(active.cv_id)}>Voir le CV</Button>
                    <Button variant="outline" onClick={() => setChatOpen(true)}>Discuter avec le candidat</Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Chat contextuel */}
      <Dialog open={chatOpen} onOpenChange={(o) => !o && setChatOpen(false)}>
        <DialogContent className="max-w-md h-[80vh] flex flex-col p-0 overflow-hidden">
          {active && (() => {
            const p = active.candidate ? profiles[active.candidate.user_id] : null;
            const name = displayName(p);
            return (
              <>
                <DialogHeader className="p-4 border-b border-border bg-card">
                  <DialogTitle className="font-display italic text-2xl">Discussion : {name}</DialogTitle>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{active.offer?.titre}</p>
                </DialogHeader>

                <div className="flex-1 p-4 overflow-y-auto bg-muted/10 flex flex-col justify-between">
                  <div className="space-y-4 overflow-y-auto flex-1 pr-1">
                    {chatMessages.length === 0 ? (
                      <p className="text-center text-xs font-mono text-muted-foreground py-10">Aucun message échangé.</p>
                    ) : (
                      chatMessages.map((m) => {
                        const isOwn = m.sender_id === user?.id;
                        return (
                          <div key={m.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[85%] rounded-sm p-3 text-xs shadow-sm ${
                              isOwn 
                                ? "bg-primary text-primary-foreground rounded-br-none" 
                                : "bg-card border border-border text-foreground rounded-bl-none"
                            }`}>
                              <p className="whitespace-pre-line leading-relaxed">{m.contenu}</p>
                              <span className={`text-[8px] font-mono mt-1 block text-right ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                {new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <form onSubmit={sendChatMessage} className="p-3 border-t border-border bg-card flex gap-2">
                  <Input
                    required
                    placeholder="Écrivez un message..."
                    value={chatNewMsg}
                    onChange={(e) => setChatNewMsg(e.target.value)}
                    className="h-10 text-xs rounded-sm focus-visible:ring-primary border-border"
                  />
                  <Button type="submit" size="icon" className="h-10 w-10 shrink-0 rounded-sm" disabled={chatSending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
}
