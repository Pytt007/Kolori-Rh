import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { ensureCandidate } from "@/lib/candidate";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, MessageSquare, Building2, User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/candidat/messages")({
  component: CandidatMessages,
});

type MessageType = {
  id: string;
  sender_id: string;
  recipient_id: string;
  application_id: string | null;
  contenu: string;
  lu: boolean;
  created_at: string;
};

type ThreadType = {
  applicationId: string;
  jobTitle: string;
  companyName: string;
  companyLogo: string | null;
  recruiterId: string;
  lastMessage: string | null;
  lastMessageDate: string | null;
  unreadCount: number;
};

function CandidatMessages() {
  const { user } = useAuth();
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [threads, setThreads] = useState<ThreadType[]>([]);
  const [activeThread, setActiveThread] = useState<ThreadType | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function loadThreads(cid: string) {
    try {
      if (user?.id === "mock-candidate-1") {
        const { getMockJobOffers, getMockCompanies, getMockApplications, getMockMessages } = await import("@/lib/mockData");
        const mockApps = getMockApplications().filter((a) => a.candidate_id === cid);
        if (mockApps.length === 0) {
          setThreads([]);
          setLoading(false);
          return;
        }
        const mockOffers = getMockJobOffers();
        const mockCompanies = getMockCompanies();
        const allMsgs = getMockMessages();

        const threadList: ThreadType[] = mockApps.map((app) => {
          const offer = mockOffers.find((o) => o.id === app.offer_id);
          const company = offer ? mockCompanies.find((c) => c.id === offer.company_id) : null;
          const appMsgs = allMsgs.filter((m) =>
            (m.sender_id === "mock-candidate-1" && m.recipient_id === "mock-recruiter-1") ||
            (m.sender_id === "mock-recruiter-1" && m.recipient_id === "mock-candidate-1")
          );
          const lastMsg = appMsgs[appMsgs.length - 1];
          const unread = appMsgs.filter((m) => !m.lu && m.recipient_id === user.id).length;

          return {
            applicationId: app.id,
            jobTitle: offer?.titre ?? "Poste",
            companyName: company?.nom ?? "Entreprise",
            companyLogo: company?.logo_url ?? null,
            recruiterId: "mock-recruiter-1",
            lastMessage: lastMsg ? lastMsg.message : "Aucun message pour l'instant",
            lastMessageDate: lastMsg ? lastMsg.created_at : null,
            unreadCount: unread,
          };
        });

        threadList.sort((a, b) => {
          if (!a.lastMessageDate) return 1;
          if (!b.lastMessageDate) return -1;
          return new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime();
        });

        setThreads(threadList);
        setLoading(false);
        return;
      }

      // 1. Récupérer toutes les candidatures du candidat avec l'entreprise liée
      const { data: appsData, error: appsError } = await supabase
        .from("applications")
        .select(`
          id,
          offer:job_offers(
            id,
            titre,
            company:companies(
              id,
              nom,
              logo_url,
              owner_id
            )
          )
        `)
        .eq("candidate_id", cid);

      if (appsError) throw appsError;

      const apps = appsData ?? [];
      if (apps.length === 0) {
        setThreads([]);
        setLoading(false);
        return;
      }

      // 2. Récupérer tous les messages liés à ces candidatures
      const appIds = apps.map((a) => a.id);
      const { data: msgsData, error: msgsError } = await supabase
        .from("messages")
        .select("*")
        .in("application_id", appIds)
        .order("created_at", { ascending: true });

      if (msgsError) throw msgsError;

      const allMsgs = (msgsData ?? []) as MessageType[];

      // 3. Construire les discussions
      const threadList: ThreadType[] = apps.map((app: any) => {
        const appMsgs = allMsgs.filter((m) => m.application_id === app.id);
        const lastMsg = appMsgs[appMsgs.length - 1];
        const unread = appMsgs.filter((m) => !m.lu && m.recipient_id === user?.id).length;

        return {
          applicationId: app.id,
          jobTitle: app.offer?.titre ?? "Poste",
          companyName: app.offer?.company?.nom ?? "Entreprise",
          companyLogo: app.offer?.company?.logo_url ?? null,
          recruiterId: app.offer?.company?.owner_id ?? "",
          lastMessage: lastMsg ? lastMsg.contenu : "Aucun message pour l'instant",
          lastMessageDate: lastMsg ? lastMsg.created_at : null,
          unreadCount: unread,
        };
      });

      threadList.sort((a, b) => {
        if (!a.lastMessageDate) return 1;
        if (!b.lastMessageDate) return -1;
        return new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime();
      });

      setThreads(threadList);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du chargement des messages.");
    } finally {
      setLoading(false);
    }
  }

  // Charger les messages de la discussion active
  async function loadActiveMessages(appId: string) {
    try {
      if (user?.id === "mock-candidate-1") {
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
        setMessages(formatted);

        // Mark as read in local storage
        const updatedMsgs = msgs.map((m) => {
          if (m.recipient_id === user.id) {
            return { ...m, lu: true };
          }
          return m;
        });
        localStorage.setItem("mock_messages", JSON.stringify(updatedMsgs));

        setThreads((prev) =>
          prev.map((t) => (t.applicationId === appId ? { ...t, unreadCount: 0 } : t))
        );
        return;
      }

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("application_id", appId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages((data as MessageType[]) ?? []);

      // Marquer comme lus
      if (user) {
        await supabase
          .from("messages")
          .update({ lu: true })
          .eq("application_id", appId)
          .eq("recipient_id", user.id);
        
        // Mettre à jour l'état local des discussions
        setThreads((prev) =>
          prev.map((t) => (t.applicationId === appId ? { ...t, unreadCount: 0 } : t))
        );
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (!user) return;
    (async () => {
      const cid = await ensureCandidate(user.id);
      setCandidateId(cid);
      await loadThreads(cid);
    })();
  }, [user]);

  useEffect(() => {
    if (activeThread) {
      loadActiveMessages(activeThread.applicationId);
    }
  }, [activeThread]);

  // Écouter les messages en temps réel
  useEffect(() => {
    if (!user || !candidateId) return;
    if (user.id === "mock-candidate-1") return;

    const channel = supabase
      .channel("candidat-chat-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          const newMsgItem = payload.new as MessageType;
          
          if (activeThread && newMsgItem.application_id === activeThread.applicationId) {
            setMessages((prev) => [...prev, newMsgItem]);
            supabase.from("messages").update({ lu: true }).eq("id", newMsgItem.id);
          } else {
            setThreads((prev) =>
              prev.map((t) =>
                t.applicationId === newMsgItem.application_id
                  ? { ...t, unreadCount: t.unreadCount + 1, lastMessage: newMsgItem.contenu, lastMessageDate: newMsgItem.created_at }
                  : t
              )
            );
          }
          loadThreads(candidateId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, candidateId, activeThread]);

  // Scroll automatique vers le bas de la discussion
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMsg.trim() || !user || !activeThread) return;

    setSending(true);
    try {
      if (user.id === "mock-candidate-1") {
        const { saveMockMessage } = await import("@/lib/mockData");
        const newMsgItem = {
          id: `msg-${Date.now()}`,
          sender_id: user.id,
          recipient_id: activeThread.recruiterId,
          message: newMsg.trim(),
          created_at: new Date().toISOString(),
          lu: false
        };
        saveMockMessage(newMsgItem);

        const formatted: MessageType = {
          id: newMsgItem.id,
          sender_id: newMsgItem.sender_id,
          recipient_id: newMsgItem.recipient_id,
          application_id: activeThread.applicationId,
          contenu: newMsgItem.message,
          lu: newMsgItem.lu,
          created_at: newMsgItem.created_at
        };
        setMessages((prev) => [...prev, formatted]);
        setNewMsg("");

        setThreads((prev) =>
          prev.map((t) =>
            t.applicationId === activeThread.applicationId
              ? { ...t, lastMessage: newMsg.trim(), lastMessageDate: new Date().toISOString() }
              : t
          )
        );
        setSending(false);
        return;
      }

      // 1. Envoyer le message
      const { data: insData, error: insError } = await supabase
        .from("messages")
        .insert({
          sender_id: user.id,
          recipient_id: activeThread.recruiterId,
          application_id: activeThread.applicationId,
          contenu: newMsg.trim(),
        })
        .select("*")
        .single();

      if (insError) throw insError;

      // 2. Envoyer une notification au recruteur
      const { data: profile } = await supabase
        .from("profiles")
        .select("prenom, nom")
        .eq("id", user.id)
        .maybeSingle();

      const candidateName = profile ? `${profile.prenom || ""} ${profile.nom || ""}`.trim() : "Un candidat";

      await supabase.from("notifications").insert({
        user_id: activeThread.recruiterId,
        type: "message",
        titre: `Nouveau message de ${candidateName}`,
        message: newMsg.trim().slice(0, 80) + (newMsg.length > 80 ? "..." : ""),
        link: "/recruteur/messages",
      });

      // Mettre à jour l'affichage
      setMessages((prev) => [...prev, insData as MessageType]);
      setNewMsg("");

      setThreads((prev) =>
        prev.map((t) =>
          t.applicationId === activeThread.applicationId
            ? { ...t, lastMessage: newMsg.trim(), lastMessageDate: new Date().toISOString() }
            : t
        )
      );
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'envoyer le message.");
    } finally {
      setSending(false);
    }
  }

  if (loading) return <div className="text-sm font-mono text-muted-foreground">Chargement des conversations…</div>;

  return (
    <>
      <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3 font-semibold">
        Messagerie
      </div>
      <h1 className="font-display italic text-5xl mb-10">Mes Messages.</h1>

      {threads.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-border rounded-sm bg-card">
          <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <p className="font-display italic text-2xl mb-2">Aucune conversation active.</p>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
            Les fils de discussion apparaissent dès qu'un recruteur vous contacte suite à une candidature.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-[280px_1fr] border border-border rounded-sm bg-card min-h-[550px] overflow-hidden">
          {/* Liste des discussions */}
          <div className="border-r border-border bg-muted/20 flex flex-col divide-y divide-border/60 overflow-y-auto max-h-[550px]">
            {threads.map((t) => {
              const isActive = activeThread?.applicationId === t.applicationId;
              return (
                <button
                  key={t.applicationId}
                  onClick={() => setActiveThread(t)}
                  className={`text-left p-4 hover:bg-secondary/15 transition-all w-full flex items-start gap-3 ${
                    isActive ? "bg-secondary/30 border-l-2 border-primary" : ""
                  }`}
                >
                  {t.companyLogo ? (
                    <img src={t.companyLogo} alt={t.companyName} className="w-10 h-10 object-cover rounded-sm border border-border shrink-0" />
                  ) : (
                    <div className="w-10 h-10 bg-secondary flex items-center justify-center rounded-sm shrink-0 border border-border">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-semibold text-xs font-mono uppercase tracking-wider text-primary truncate">
                        {t.companyName}
                      </span>
                      {t.unreadCount > 0 && (
                        <span className="text-[10px] bg-primary text-primary-foreground font-mono font-bold px-1.5 py-0.5 rounded-full">
                          {t.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="font-display italic text-sm text-foreground truncate mb-1">
                      {t.jobTitle}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{t.lastMessage}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Discussion en cours */}
          <div className="flex flex-col h-[550px]">
            {activeThread ? (
              <>
                {/* En-tête discussion */}
                <div className="p-4 border-b border-border bg-card flex items-center gap-3">
                  {activeThread.companyLogo ? (
                    <img src={activeThread.companyLogo} alt={activeThread.companyName} className="w-9 h-9 object-cover rounded-sm border border-border" />
                  ) : (
                    <div className="w-9 h-9 bg-secondary flex items-center justify-center rounded-sm border border-border">
                      <Building2 className="w-4.5 h-4.5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-sm leading-tight text-primary font-mono uppercase tracking-wider">
                      {activeThread.companyName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Sujet : <span className="font-display italic font-semibold">{activeThread.jobTitle}</span>
                    </div>
                  </div>
                </div>

                {/* Bulle de messages */}
                <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto bg-muted/10 space-y-4">
                  {messages.map((m) => {
                    const isOwn = m.sender_id === user?.id;
                    return (
                      <div key={m.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] rounded-sm p-3.5 text-sm shadow-sm ${
                          isOwn 
                            ? "bg-primary text-primary-foreground rounded-br-none" 
                            : "bg-card border border-border text-foreground rounded-bl-none"
                        }`}>
                          <p className="whitespace-pre-line leading-relaxed">{m.contenu}</p>
                          <span className={`text-[9px] font-mono mt-1.5 block text-right ${
                            isOwn ? "text-primary-foreground/75" : "text-muted-foreground"
                          }`}>
                            {new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Formulaire envoi */}
                <form onSubmit={handleSend} className="p-4 border-t border-border bg-card flex gap-2">
                  <Textarea
                    required
                    placeholder="Écrivez votre message..."
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    className="min-h-9 h-11 resize-none py-2.5 rounded-sm focus-visible:ring-primary border-border"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                  />
                  <Button type="submit" size="icon" className="h-11 w-11 shrink-0 rounded-sm" disabled={sending}>
                    <Send className="h-4.5 w-4.5" />
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6 bg-muted/5">
                <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="font-display italic text-lg">Sélectionnez une discussion</p>
                <p className="text-xs text-muted-foreground/80 mt-1">
                  Choisissez un contact dans le panneau de gauche pour commencer à discuter.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
