import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { analyzeOfferCandidates, type AIAnalysisResult, type CandidateAIAnalysis, type CandidateInput, type OfferInput } from "@/lib/api/ai.functions";
import {
  Sparkles, ChevronDown, ChevronUp, X, Users, TrendingUp,
  AlertTriangle, CheckCircle2, Brain, FileText, BarChart3,
  ArrowRight, RefreshCw, Search, Award, ChevronRight
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// PROFILS ÉTENDUS POUR LES CANDIDATS MOCK
// Chaque candidat a des compétences réalistes selon son profil
// ─────────────────────────────────────────────────────────────

const MOCK_EXTENDED_PROFILES: Record<string, {
  competences: string[];
  diplome: string;
  experiences: { poste: string; entreprise: string; debut: string; fin?: string; actuel?: boolean }[];
  langues: { langue: string; niveau: string }[];
  bio: string;
  ville: string;
}> = {
  "mock-candidate-1": {
    competences: ["Recrutement", "Droit social", "SYSCOHADA", "Leadership", "Gestion des conflits", "Formation professionnelle", "Administration du personnel", "CNPS"],
    diplome: "Master en Management des Ressources Humaines",
    experiences: [
      { poste: "Responsable des Ressources Humaines", entreprise: "Ivory Tech Solutions", debut: "2022-01", actuel: true },
      { poste: "Chargé de Recrutement", entreprise: "Sociaux & RH Cabinet", debut: "2018-03", fin: "2021-12" },
    ],
    langues: [{ langue: "Français", niveau: "Natif" }, { langue: "Anglais", niveau: "Professionnel" }],
    bio: "Professionnel RH avec 8 ans d'expérience en gestion des talents, droit social et administration du personnel en Côte d'Ivoire.",
    ville: "Abidjan",
  },
  "mock-candidate-2": {
    competences: ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker", "Git", "REST API", "TailwindCSS"],
    diplome: "Licence en Informatique — Université de Cocody",
    experiences: [
      { poste: "Développeuse Full-Stack", entreprise: "Fintech Africa", debut: "2023-03", actuel: true },
      { poste: "Développeuse Frontend React", entreprise: "Orange Côte d'Ivoire", debut: "2020-06", fin: "2023-02" },
    ],
    langues: [{ langue: "Français", niveau: "Natif" }, { langue: "Anglais", niveau: "Courant" }],
    bio: "Développeuse Full-Stack passionnée avec 4 ans d'expérience. Spécialisée en React, TypeScript et Node.js. Habituée aux environnements agiles et aux projets à haute disponibilité.",
    ville: "Yamoussoukro",
  },
  "mock-candidate-3": {
    competences: ["React", "Vue.js", "JavaScript", "MySQL", "Laravel", "TailwindCSS", "PHP", "Git"],
    diplome: "Licence en Développement Web — INPHB Yamoussoukro",
    experiences: [
      { poste: "Développeur Full-Stack Senior", entreprise: "DigiCom CI", debut: "2020-01", actuel: true },
      { poste: "Développeur Web", entreprise: "StartupCi", debut: "2017-06", fin: "2019-11" },
      { poste: "Stagiaire Développeur", entreprise: "Mediazone", debut: "2017-01", fin: "2017-05" },
    ],
    langues: [{ langue: "Français", niveau: "Natif" }],
    bio: "Développeur Full-Stack avec 6 ans d'expérience, spécialisé dans la création d'applications web performantes. Expert React et Laravel, avec une forte appétence pour les nouvelles technologies.",
    ville: "Abidjan",
  },
  "mock-candidate-4": {
    competences: ["Node.js", "Python", "PostgreSQL", "Docker", "AWS", "TypeScript", "Kubernetes", "CI/CD"],
    diplome: "Master en Informatique et Réseaux — Université Felix Houphouet-Boigny",
    experiences: [
      { poste: "Ingénieure DevOps & Backend", entreprise: "Boost Digital", debut: "2024-01", actuel: true },
      { poste: "Développeuse Backend Node.js", entreprise: "AfriPay", debut: "2021-08", fin: "2023-12" },
    ],
    langues: [{ langue: "Français", niveau: "Natif" }, { langue: "Anglais", niveau: "Courant" }, { langue: "Arabe", niveau: "Notions" }],
    bio: "Ingénieure Backend et DevOps avec 3 ans d'expérience. Experte en Node.js, Python, AWS et Kubernetes. Passionnée par l'automatisation et les architectures cloud.",
    ville: "San Pedro",
  },
  // Candidats supplémentaires pour la CVthèque (Mode 2)
  "mock-candidate-5": {
    competences: ["React", "GraphQL", "TypeScript", "MongoDB", "Redis", "Docker"],
    diplome: "Bac+5 Ingénieur Logiciel — École Polytechnique d'Abidjan",
    experiences: [
      { poste: "Ingénieur Full-Stack", entreprise: "MTN Côte d'Ivoire", debut: "2021-09", actuel: true },
      { poste: "Développeur React", entreprise: "Financia", debut: "2019-03", fin: "2021-08" },
    ],
    langues: [{ langue: "Français", niveau: "Natif" }, { langue: "Anglais", niveau: "Courant" }],
    bio: "Ingénieur Full-Stack avec 5 ans d'expérience. Expertise en React, GraphQL et architectures orientées microservices. Passionné par la performance et l'UX.",
    ville: "Abidjan",
  },
  "mock-candidate-6": {
    competences: ["Vue.js", "JavaScript", "PHP", "MySQL", "Bootstrap"],
    diplome: "Licence Informatique — Université de Bouaké",
    experiences: [
      { poste: "Développeur Web Junior", entreprise: "WebCi Agency", debut: "2023-06", actuel: true },
    ],
    langues: [{ langue: "Français", niveau: "Natif" }],
    bio: "Développeur web junior déterminé, avec 1 an d'expérience sur des projets Vue.js et PHP.",
    ville: "Bouaké",
  },
  "mock-candidate-7": {
    competences: ["Recrutement", "Marketing RH", "Sourcing LinkedIn", "ATS", "Excel", "Communication"],
    diplome: "Bac+3 en Gestion des Ressources Humaines — ESCA Abidjan",
    experiences: [
      { poste: "Chargée de Recrutement", entreprise: "SIB Banque", debut: "2022-01", actuel: true },
      { poste: "Assistante RH", entreprise: "Cabinet Alpha", debut: "2019-09", fin: "2021-12" },
    ],
    langues: [{ langue: "Français", niveau: "Natif" }, { langue: "Anglais", niveau: "Notions" }],
    bio: "Spécialiste du recrutement avec 4 ans d'expérience dans le secteur bancaire et des services. Maîtrise des ATS et du sourcing LinkedIn.",
    ville: "Abidjan",
  },
  "mock-candidate-8": {
    competences: ["Comptabilité générale", "SYSCOHADA", "Déclarations fiscales", "Paie", "SAGE", "Excel"],
    diplome: "Bac+2 BTS Comptabilité — ISTAO Abidjan",
    experiences: [
      { poste: "Comptable", entreprise: "Afriq Agro Industries", debut: "2020-03", actuel: true },
    ],
    langues: [{ langue: "Français", niveau: "Natif" }],
    bio: "Comptable unique avec 4 ans d'expérience en comptabilité générale, paie et déclarations fiscales en Côte d'Ivoire.",
    ville: "Bouaké",
  },
};

// ─────────────────────────────────────────────────────────────
// TYPES DU COMPOSANT
// ─────────────────────────────────────────────────────────────

interface AIDashboardDialogProps {
  open: boolean;
  onClose: () => void;
  offer: OfferInput & { id: string };
  applicantsRaw: { candidateId: string; applicationId: string; cvId: string | null }[];
  isMockUser: boolean;
}

type Step = "config" | "loading" | "results";

const LOADING_STEPS = [
  "Extraction des critères de l'offre…",
  "Récupération des profils candidats…",
  "Analyse sémantique des compétences…",
  "Calcul des scores de compatibilité…",
  "Détection des anomalies de parcours…",
  "Génération des questions d'entretien…",
  "Finalisation du classement…",
];

// ─────────────────────────────────────────────────────────────
// HELPERS COULEUR
// ─────────────────────────────────────────────────────────────

function scoreColor(score: number): { text: string; bg: string; ring: string; badge: string } {
  if (score >= 80) return { text: "text-emerald-700", bg: "bg-emerald-50", ring: "stroke-emerald-500", badge: "bg-emerald-100 text-emerald-800" };
  if (score >= 60) return { text: "text-amber-700", bg: "bg-amber-50", ring: "stroke-amber-500", badge: "bg-amber-100 text-amber-800" };
  return { text: "text-red-600", bg: "bg-red-50", ring: "stroke-red-500", badge: "bg-red-100 text-red-700" };
}

function ScoreRing({ score, size = 64 }: { score: number; size?: number }) {
  const r = size * 0.4;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const { text, ring } = scoreColor(score);
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={size * 0.1} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          className={ring} strokeWidth={size * 0.1}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <span className={`absolute text-xs font-black font-mono ${text}`}>{score}%</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CARTE CANDIDAT (résumé dans la liste)
// ─────────────────────────────────────────────────────────────

function CandidateCard({
  analysis, rank, selected, onSelect,
}: {
  analysis: CandidateAIAnalysis; rank: number; selected: boolean; onSelect: () => void;
}) {
  const colors = scoreColor(analysis.score);
  const initials = analysis.candidate_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left flex items-center gap-4 p-4 rounded-2xl border-2 transition-all hover:shadow-md ${
        selected ? "border-indigo-400 bg-indigo-50/50 shadow-md" : "border-border/50 bg-white hover:border-indigo-200"
      }`}
    >
      {/* Rank */}
      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
        rank === 1 ? "bg-yellow-400 text-yellow-900" : rank === 2 ? "bg-slate-200 text-slate-700" : rank === 3 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
      }`}>
        {rank}
      </div>
      {/* Avatar */}
      <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
        {initials}
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm text-foreground truncate">{analysis.candidate_name}</div>
        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 flex-wrap">
          {analysis.candidate_title && <span className="truncate max-w-[150px]">{analysis.candidate_title}</span>}
          {analysis.candidate_ville && <span className="text-muted-foreground/60">· {analysis.candidate_ville}</span>}
          {!analysis.is_applicant && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-semibold">CVthèque</span>
          )}
        </div>
      </div>
      {/* Score ring */}
      <div className="shrink-0 flex flex-col items-center gap-1">
        <ScoreRing score={analysis.score} size={52} />
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>
          {analysis.match_level === "excellent" ? "Excellent" : analysis.match_level === "moyen" ? "Moyen" : "Faible"}
        </span>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// PANNEAU DÉTAIL CANDIDAT
// ─────────────────────────────────────────────────────────────

function CandidateDetail({ analysis, onClose }: { analysis: CandidateAIAnalysis; onClose: () => void }) {
  const [openSection, setOpenSection] = useState<string | null>("summary");
  const colors = scoreColor(analysis.score);
  const initials = analysis.candidate_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  function toggleSection(s: string) {
    setOpenSection((prev) => (prev === s ? null : s));
  }

  const Section = ({ id, icon, title, count, children }: { id: string; icon: React.ReactNode; title: string; count?: number; children: React.ReactNode }) => (
    <div className="border border-border/60 rounded-xl overflow-hidden">
      <button
        onClick={() => toggleSection(id)}
        className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${openSection === id ? "bg-slate-50" : "bg-white hover:bg-slate-50/50"}`}
      >
        <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
          {icon}
          {title}
          {count !== undefined && (
            <span className="text-xs font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{count}</span>
          )}
        </div>
        {openSection === id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {openSection === id && (
        <div className="px-4 pb-4 pt-3 bg-white border-t border-border/40 animate-reveal">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-5 bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-t-2xl relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white" />
        </div>
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center font-black text-xl backdrop-blur-sm">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-black text-xl leading-tight">{analysis.candidate_name}</h3>
            <p className="text-white/70 text-xs mt-0.5">{analysis.candidate_title ?? "—"} {analysis.candidate_ville ? `· ${analysis.candidate_ville}` : ""}</p>
            {!analysis.is_applicant && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-400/40 text-purple-100 font-semibold mt-1 inline-block">
                Depuis la CVthèque
              </span>
            )}
          </div>
          <div className="flex flex-col items-center gap-1 shrink-0">
            <ScoreRing score={analysis.score} size={64} />
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>
              {analysis.match_level === "excellent" ? "🟢 Excellent" : analysis.match_level === "moyen" ? "🟡 Moyen" : "🔴 Faible"}
            </span>
          </div>
        </div>
      </div>

      {/* Body - scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">

        {/* Résumé */}
        <Section id="summary" icon={<Brain className="h-4 w-4 text-indigo-500" />} title="Résumé IA">
          <p className="text-sm text-foreground leading-relaxed">{analysis.summary}</p>
        </Section>

        {/* Forces */}
        <Section id="strengths" icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} title="Points forts" count={analysis.strengths.length}>
          <ul className="space-y-2">
            {analysis.strengths.map((s, i) => (
              <li key={i} className="text-sm text-foreground flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                <span>{s.replace(/^✅\s*/, "")}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* Faiblesses */}
        {analysis.weaknesses.length > 0 && (
          <Section id="weaknesses" icon={<AlertTriangle className="h-4 w-4 text-amber-500" />} title="Points d'attention" count={analysis.weaknesses.length}>
            <ul className="space-y-2">
              {analysis.weaknesses.map((w, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5 shrink-0">!</span>
                  <span>{w.replace(/^⚠\s*/, "")}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Anomalies */}
        {analysis.anomalies.length > 0 && (
          <Section id="anomalies" icon={<AlertTriangle className="h-4 w-4 text-red-500" />} title="Anomalies détectées" count={analysis.anomalies.length}>
            <ul className="space-y-2">
              {analysis.anomalies.map((a, i) => (
                <li key={i} className="text-sm text-red-700 flex items-start gap-2 bg-red-50 p-2 rounded-lg">
                  <span className="shrink-0">⚠</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Questions d'entretien */}
        <Section id="questions" icon={<FileText className="h-4 w-4 text-blue-500" />} title="Questions d'entretien" count={
          analysis.interview_questions.techniques.length +
          analysis.interview_questions.comportementales.length +
          analysis.interview_questions.ciblees.length
        }>
          <div className="space-y-4">
            {analysis.interview_questions.techniques.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Questions techniques ({analysis.interview_questions.techniques.length})
                </p>
                <ol className="space-y-2 list-decimal list-inside">
                  {analysis.interview_questions.techniques.map((q, i) => (
                    <li key={i} className="text-xs text-foreground leading-relaxed">{q}</li>
                  ))}
                </ol>
              </div>
            )}
            {analysis.interview_questions.comportementales.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Questions comportementales ({analysis.interview_questions.comportementales.length})
                </p>
                <ol className="space-y-2 list-decimal list-inside">
                  {analysis.interview_questions.comportementales.map((q, i) => (
                    <li key={i} className="text-xs text-foreground leading-relaxed">{q}</li>
                  ))}
                </ol>
              </div>
            )}
            {analysis.interview_questions.ciblees.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Questions ciblées sur les faiblesses ({analysis.interview_questions.ciblees.length})
                </p>
                <ol className="space-y-2 list-decimal list-inside">
                  {analysis.interview_questions.ciblees.map((q, i) => (
                    <li key={i} className="text-xs text-foreground leading-relaxed text-amber-800">{q}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </Section>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border/60 bg-white flex-shrink-0">
        <Button variant="outline" size="sm" onClick={onClose} className="w-full rounded-xl">
          ← Retour au classement
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL : AIDashboardDialog
// ─────────────────────────────────────────────────────────────

export function AIDashboardDialog({ open, onClose, offer, applicantsRaw, isMockUser }: AIDashboardDialogProps) {
  const [step, setStep] = useState<Step>("config");
  const [mode, setMode] = useState<"candidatures" | "cvtheque">("candidatures");
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateAIAnalysis | null>(null);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setStep("config");
      setResult(null);
      setError(null);
      setSelectedCandidate(null);
      setLoadingStep(0);
    }
  }, [open]);

  // Loading animation
  useEffect(() => {
    if (step !== "loading") return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setLoadingStep(i);
      if (i >= LOADING_STEPS.length) clearInterval(interval);
    }, 600);
    return () => clearInterval(interval);
  }, [step]);

  async function buildCandidatesFromMock(mode: "candidatures" | "cvtheque"): Promise<CandidateInput[]> {
    const { getMockJobOffers, getMockApplications } = await import("@/lib/mockData");
    const offers = getMockJobOffers();
    const apps = getMockApplications();

    let candidateIds: string[] = [];

    if (mode === "candidatures") {
      const offerApps = apps.filter((a) => a.offer_id === offer.id);
      candidateIds = [...new Set(offerApps.map((a) => a.candidate_id))];
    } else {
      // CVthèque: all mock candidates
      candidateIds = Object.keys(MOCK_EXTENDED_PROFILES);
    }

    const applicantSet = new Set(
      apps.filter((a) => a.offer_id === offer.id).map((a) => a.candidate_id)
    );

    // Name map from mock users
    const nameMap: Record<string, string> = {
      "mock-candidate-1": "Koffi Anan",
      "mock-candidate-2": "Fatou Diallo",
      "mock-candidate-3": "Serge Gbagbo",
      "mock-candidate-4": "Aminata Bamba",
      "mock-candidate-5": "Ibrahim Koné",
      "mock-candidate-6": "Adjoa Mensah",
      "mock-candidate-7": "Ramatou Coulibaly",
      "mock-candidate-8": "Ernest Brou",
    };

    return candidateIds.map((id) => {
      const ext = MOCK_EXTENDED_PROFILES[id];
      return {
        id,
        name: nameMap[id] ?? `Candidat ${id}`,
        title: ext?.competences[0] ?? null,
        ville: ext?.ville ?? "Abidjan",
        diplome: ext?.diplome ?? null,
        competences: ext?.competences ?? [],
        experiences: ext?.experiences ?? [],
        langues: ext?.langues ?? [],
        bio: ext?.bio ?? null,
        is_applicant: applicantSet.has(id),
      };
    });
  }

  async function buildCandidatesFromSupabase(mode: "candidatures" | "cvtheque"): Promise<CandidateInput[]> {
    const { supabase } = await import("@/integrations/supabase/client");

    if (mode === "candidatures") {
      const { data: apps } = await supabase
        .from("applications")
        .select("candidate_id, candidates(id, titre, ville, diplome, competences, experiences, langues, bio, user_id, profiles:profiles(nom, prenom))")
        .eq("offer_id", offer.id);

      if (!apps) return [];

      return (apps as any[]).map((app) => {
        const c = app.candidates;
        const p = c?.profiles as any;
        return {
          id: c?.id ?? app.candidate_id,
          name: `${p?.prenom ?? ""} ${p?.nom ?? ""}`.trim() || "Candidat",
          title: c?.titre ?? null,
          ville: c?.ville ?? null,
          diplome: c?.diplome ?? null,
          competences: c?.competences ?? [],
          experiences: c?.experiences ?? [],
          langues: c?.langues ?? [],
          bio: c?.bio ?? null,
          is_applicant: true,
        };
      });
    } else {
      // CVthèque: top 50 candidates (pre-fetched)
      const { data: cands } = await supabase
        .from("candidates")
        .select("id, titre, ville, diplome, competences, experiences, langues, bio, user_id, profiles:profiles(nom, prenom)")
        .limit(50);

      const { data: apps } = await supabase
        .from("applications")
        .select("candidate_id")
        .eq("offer_id", offer.id);

      const applicantSet = new Set((apps ?? []).map((a: any) => a.candidate_id));

      return (cands as any[] ?? []).map((c) => {
        const p = c.profiles as any;
        return {
          id: c.id,
          name: `${p?.prenom ?? ""} ${p?.nom ?? ""}`.trim() || "Candidat",
          title: c.titre ?? null,
          ville: c.ville ?? null,
          diplome: c.diplome ?? null,
          competences: c.competences ?? [],
          experiences: c.experiences ?? [],
          langues: c.langues ?? [],
          bio: c.bio ?? null,
          is_applicant: applicantSet.has(c.id),
        };
      });
    }
  }

  async function runAnalysis() {
    setStep("loading");
    setLoadingStep(0);
    setError(null);

    try {
      const candidates = isMockUser
        ? await buildCandidatesFromMock(mode)
        : await buildCandidatesFromSupabase(mode);

      if (candidates.length === 0) {
        setError("Aucun candidat trouvé pour cette analyse. Assurez-vous que des candidatures ont bien été reçues.");
        setStep("config");
        return;
      }

      const offerInput: OfferInput = {
        id: offer.id,
        titre: offer.titre,
        description: offer.description,
        secteur: offer.secteur,
        contrat: offer.contrat,
        localisation: offer.localisation,
        competences_requises: offer.competences_requises,
        competences_souhaitees: offer.competences_souhaitees,
        experience_min: offer.experience_min,
        niveau_etudes_min: offer.niveau_etudes_min,
        langues_souhaitees: offer.langues_souhaitees,
        criteres_ia: offer.criteres_ia,
      };

      const res = await analyzeOfferCandidates({
        data: { offer: offerInput, candidates, mode },
      });

      setResult(res);
      setStep("results");
    } catch (e) {
      console.error("AI analysis error:", e);
      setError("Une erreur est survenue lors de l'analyse. Vérifiez votre connexion et réessayez.");
      setStep("config");
    }
  }

  const noBestMatch = result && result.stats.excellent === 0 && result.stats.moyen === 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 overflow-hidden flex flex-col rounded-3xl border-0 shadow-2xl">

        {/* ── HEADER ─────────────────────────────────────────────── */}
        <div className="relative bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 text-white px-6 py-4 flex-shrink-0 overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white" />
            <div className="absolute -bottom-8 left-20 w-32 h-32 rounded-full bg-purple-300" />
          </div>
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center backdrop-blur-sm">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/60">Assistant IA — Analyse des Candidats</div>
                <h2 className="font-display font-black text-lg leading-tight truncate max-w-md">{offer.titre}</h2>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {result && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs font-semibold">
                  {result.powered_by === "openai" ? (
                    <><Sparkles className="h-3.5 w-3.5" /> OpenAI GPT-4o</>
                  ) : (
                    <><Brain className="h-3.5 w-3.5" /> Simulation IA</>
                  )}
                </div>
              )}
              <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-white/20 flex items-center justify-center transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── BODY ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-hidden">

          {/* STEP 1: Configuration */}
          {step === "config" && (
            <div className="h-full overflow-y-auto p-8 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/30">
              <div className="w-full max-w-lg space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-3xl bg-indigo-100 flex items-center justify-center text-3xl mx-auto mb-3">🤖</div>
                  <h3 className="font-display font-black text-2xl text-foreground">Choisissez le mode d'analyse</h3>
                  <p className="text-muted-foreground text-sm mt-1">L'IA va analyser, scorer et classer les profils par rapport aux critères de l'offre.</p>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Mode 1 */}
                <button
                  onClick={() => setMode("candidatures")}
                  className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
                    mode === "candidatures"
                      ? "border-indigo-500 bg-indigo-50 shadow-md"
                      : "border-border/60 bg-white hover:border-indigo-200 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${mode === "candidatures" ? "bg-indigo-500 text-white" : "bg-slate-100"}`}>
                      👥
                    </div>
                    <div>
                      <div className="font-bold text-sm text-foreground flex items-center gap-2">
                        Mode 1 — Candidatures reçues
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                          {applicantsRaw.length} candidat{applicantsRaw.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Analyse uniquement les candidats ayant directement postulé à cette offre.
                        Résultats plus ciblés et plus rapides.
                      </p>
                    </div>
                    {mode === "candidatures" && (
                      <div className="ml-auto shrink-0 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                  </div>
                </button>

                {/* Mode 2 */}
                <button
                  onClick={() => setMode("cvtheque")}
                  className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
                    mode === "cvtheque"
                      ? "border-purple-500 bg-purple-50 shadow-md"
                      : "border-border/60 bg-white hover:border-purple-200 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${mode === "cvtheque" ? "bg-purple-500 text-white" : "bg-slate-100"}`}>
                      🔍
                    </div>
                    <div>
                      <div className="font-bold text-sm text-foreground flex items-center gap-2">
                        Mode 2 — Toute la CVthèque
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">
                          Tous les profils disponibles
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Recherche dans l'ensemble des CV disponibles sur la plateforme. Peut révéler des profils n'ayant pas encore postulé.
                      </p>
                    </div>
                    {mode === "cvtheque" && (
                      <div className="ml-auto shrink-0 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                  </div>
                </button>

                <Button
                  onClick={runAnalysis}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Lancer l'analyse IA
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Loading */}
          {step === "loading" && (
            <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50/50 to-purple-50/50 p-8">
              <div className="w-full max-w-md space-y-8 text-center">
                <div className="relative w-24 h-24 mx-auto">
                  <svg className="w-24 h-24 animate-spin" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r="40" fill="none" stroke="#e0e7ff" strokeWidth="8" />
                    <circle cx="48" cy="48" r="40" fill="none" stroke="url(#grad)" strokeWidth="8"
                      strokeDasharray="251.2" strokeDashoffset="188.4" strokeLinecap="round" />
                    <defs>
                      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Brain className="h-8 w-8 text-indigo-600" />
                  </div>
                </div>

                <div>
                  <h3 className="font-display font-black text-xl text-foreground mb-1">Analyse en cours…</h3>
                  <p className="text-muted-foreground text-sm">
                    {LOADING_STEPS[Math.min(loadingStep, LOADING_STEPS.length - 1)]}
                  </p>
                </div>

                <div className="space-y-2 text-left">
                  {LOADING_STEPS.map((s, i) => (
                    <div key={i} className={`flex items-center gap-3 text-sm transition-all duration-500 ${
                      i < loadingStep ? "text-emerald-700" : i === loadingStep ? "text-indigo-700 font-semibold" : "text-muted-foreground/40"
                    }`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        i < loadingStep ? "bg-emerald-100" : i === loadingStep ? "bg-indigo-100" : "bg-slate-100"
                      }`}>
                        {i < loadingStep ? "✓" : i === loadingStep ? "·" : "○"}
                      </div>
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Résultats */}
          {step === "results" && result && (
            <div className="flex h-full overflow-hidden">
              {/* Colonne gauche : liste */}
              <div className={`flex flex-col overflow-hidden transition-all ${selectedCandidate ? "w-[42%] border-r border-border/60" : "w-full"}`}>

                {/* Stats bar */}
                <div className="flex-shrink-0 bg-white border-b border-border/60 p-4">
                  {/* Alert si aucun bon candidat */}
                  {noBestMatch && (
                    <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-amber-800">Aucun candidat ne répond suffisamment aux critères de cette offre.</p>
                        <p className="text-[11px] text-amber-700 mt-0.5">Recommandation : élargir la recherche, ajuster les critères ou republier l'offre avec de nouveaux termes.</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Analysés", value: result.stats.total, color: "text-foreground", bg: "bg-slate-50" },
                      { label: "Excellents", value: result.stats.excellent, color: "text-emerald-700", bg: "bg-emerald-50" },
                      { label: "Moyens", value: result.stats.moyen, color: "text-amber-700", bg: "bg-amber-50" },
                      { label: "Faibles", value: result.stats.faible, color: "text-red-600", bg: "bg-red-50" },
                    ].map((stat) => (
                      <div key={stat.label} className={`${stat.bg} rounded-xl p-2.5 text-center`}>
                        <div className={`text-xl font-black font-mono ${stat.color}`}>{stat.value}</div>
                        <div className="text-[10px] text-muted-foreground font-medium">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                    <span>Taux de compatibilité moyen : <strong>{result.stats.avg_score}%</strong></span>
                    <button
                      onClick={() => { setStep("config"); setResult(null); setSelectedCandidate(null); }}
                      className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      <RefreshCw className="h-3 w-3" /> Relancer
                    </button>
                  </div>
                </div>

                {/* Liste candidats */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {result.analyses.map((analysis, idx) => (
                    <CandidateCard
                      key={analysis.candidate_id}
                      analysis={analysis}
                      rank={idx + 1}
                      selected={selectedCandidate?.candidate_id === analysis.candidate_id}
                      onSelect={() => setSelectedCandidate(
                        selectedCandidate?.candidate_id === analysis.candidate_id ? null : analysis
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Colonne droite : détail candidat */}
              {selectedCandidate && (
                <div className="flex-1 overflow-hidden flex flex-col">
                  <CandidateDetail
                    analysis={selectedCandidate}
                    onClose={() => setSelectedCandidate(null)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
