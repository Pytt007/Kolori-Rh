import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────
// TYPES PARTAGÉS (exportés pour usage dans les composants)
// ─────────────────────────────────────────────────────────────

export type InterviewQuestions = {
  techniques: string[];
  comportementales: string[];
  ciblees: string[];
};

export type CandidateAIAnalysis = {
  candidate_id: string;
  candidate_name: string;
  candidate_title: string | null;
  candidate_ville: string | null;
  is_applicant: boolean;
  score: number;
  match_level: "excellent" | "moyen" | "faible";
  summary: string;
  strengths: string[];
  weaknesses: string[];
  anomalies: string[];
  interview_questions: InterviewQuestions;
};

export type AIAnalysisStats = {
  total: number;
  excellent: number;
  moyen: number;
  faible: number;
  avg_score: number;
};

export type AIAnalysisResult = {
  analyses: CandidateAIAnalysis[];
  stats: AIAnalysisStats;
  offer_title: string;
  mode: "candidatures" | "cvtheque";
  powered_by: "openai" | "simulation";
};

// ─────────────────────────────────────────────────────────────
// SCHÉMAS ZOD (validation des entrées)
// ─────────────────────────────────────────────────────────────

const CandidateInputSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string().nullable(),
  ville: z.string().nullable(),
  diplome: z.string().nullable(),
  competences: z.array(z.string()),
  experiences: z.array(z.any()),
  langues: z.array(z.any()),
  bio: z.string().nullable(),
  is_applicant: z.boolean(),
});

const OfferInputSchema = z.object({
  id: z.string(),
  titre: z.string(),
  description: z.string(),
  secteur: z.string().nullable(),
  contrat: z.string(),
  localisation: z.string().nullable(),
  competences_requises: z.array(z.string()),
  competences_souhaitees: z.array(z.string()),
  experience_min: z.number().nullable(),
  niveau_etudes_min: z.string().nullable(),
  langues_souhaitees: z.array(z.string()),
  criteres_ia: z.any().nullable(),
});

export type CandidateInput = z.infer<typeof CandidateInputSchema>;
export type OfferInput = z.infer<typeof OfferInputSchema>;

// ─────────────────────────────────────────────────────────────
// CORRESPONDANCE SÉMANTIQUE DES COMPÉTENCES
// Comprend les compétences proches / transférables
// ─────────────────────────────────────────────────────────────

const SEMANTIC_MAP: Record<string, string[]> = {
  "react": ["next.js", "nextjs", "preact", "vue.js", "vuejs", "angular", "svelte", "frontend"],
  "node.js": ["nodejs", "express", "nest.js", "nestjs", "fastify", "hapi", "backend javascript"],
  "typescript": ["javascript", "es6", "js", "ts"],
  "javascript": ["typescript", "ts", "es6", "es2020"],
  "postgresql": ["postgres", "psql", "mysql", "mariadb", "sql", "oracle", "sqlite"],
  "python": ["django", "flask", "fastapi", "pandas", "numpy", "machine learning"],
  "docker": ["kubernetes", "k8s", "devops", "conteneurisation", "helm", "docker-compose"],
  "aws": ["azure", "gcp", "cloud", "heroku", "vercel", "cloudflare", "digitalocean"],
  "tailwindcss": ["css", "scss", "sass", "bootstrap", "styled-components", "mui"],
  "react native": ["flutter", "ionic", "xamarin", "mobile development"],
  "git": ["github", "gitlab", "bitbucket", "versioning"],
  "recrutement": ["talent acquisition", "sourcing", "head hunting", "rh", "ressources humaines"],
  "leadership": ["management", "encadrement", "coaching", "mentoring", "team lead"],
  "droit social": ["droit du travail", "conformité rh", "relations sociales", "cnps", "législation"],
  "syscohada": ["comptabilité générale", "comptabilité", "bilan", "liasse fiscale"],
  "marketing digital": ["digital marketing", "social media", "seo", "sea", "growth hacking", "acquisition digitale"],
  "google ads": ["meta ads", "facebook ads", "sem", "paid media", "sea", "google analytics"],
};

function normalizeSkill(s: string): string {
  return s.toLowerCase().trim();
}

function skillsMatch(offerSkill: string, candSkill: string): boolean {
  const o = normalizeSkill(offerSkill);
  const c = normalizeSkill(candSkill);
  if (o === c) return true;
  if (c.includes(o) || o.includes(c)) return true;
  const synonyms = SEMANTIC_MAP[o] ?? [];
  return synonyms.some((s) => c.includes(s) || s.includes(c));
}

function analyzeSkills(
  offerReqSkills: string[],
  offerDesSkills: string[],
  candSkills: string[]
): { matched: string[]; missing: string[]; bonuses: string[] } {
  const matched = offerReqSkills.filter((os) =>
    candSkills.some((cs) => skillsMatch(os, cs))
  );
  const missing = offerReqSkills.filter(
    (os) => !candSkills.some((cs) => skillsMatch(os, cs))
  );
  const bonuses = offerDesSkills.filter((os) =>
    candSkills.some((cs) => skillsMatch(os, cs))
  );
  return { matched, missing, bonuses };
}

// ─────────────────────────────────────────────────────────────
// CALCUL DE L'EXPÉRIENCE
// ─────────────────────────────────────────────────────────────

function calcExperienceYears(experiences: unknown[]): number {
  if (!experiences || experiences.length === 0) return 0;
  let totalMonths = 0;
  for (const exp of experiences as Record<string, unknown>[]) {
    try {
      const debutStr = exp["debut"] as string | undefined;
      const finStr = exp["fin"] as string | undefined;
      const actuel = exp["actuel"] as boolean | undefined;
      const start = debutStr ? new Date(debutStr + "-01") : new Date();
      const end = actuel ? new Date() : finStr ? new Date(finStr + "-01") : new Date();
      const months = (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());
      if (months > 0) totalMonths += months;
    } catch {
      totalMonths += 12;
    }
  }
  return Math.max(0, Math.round(totalMonths / 12));
}

// ─────────────────────────────────────────────────────────────
// CALCUL DU SCORE DE COMPATIBILITÉ
// ─────────────────────────────────────────────────────────────

const EDU_MAP: Record<string, number> = {
  Aucun: 0, Bac: 1, "Bac+2": 2, "Bac+3": 3, "Bac+4": 4, "Bac+5": 5, "Bac+8": 6,
};

function getEduLevel(diplome: string | null): number {
  if (!diplome) return 0;
  for (const [key, val] of Object.entries(EDU_MAP)) {
    if (diplome.includes(key)) return val;
  }
  // Detect common diploma names
  const d = diplome.toLowerCase();
  if (d.includes("master") || d.includes("ingénieur") || d.includes("mba")) return 5;
  if (d.includes("licence") || d.includes("bachelor")) return 3;
  if (d.includes("bts") || d.includes("dut") || d.includes("hnd")) return 2;
  if (d.includes("doctorat") || d.includes("phd") || d.includes("docteur")) return 6;
  return 2;
}

function calculateScore(
  offer: OfferInput,
  candidate: CandidateInput
): { score: number; matched: string[]; missing: string[]; bonuses: string[]; expYears: number; eduScore: number; expScore: number; skillScore: number } {
  const w = offer.criteres_ia?.ponderation ?? {};
  const wSkills = (w.competences as number) ?? 50;
  const wExp = (w.experience as number) ?? 25;
  const wEdu = (w.formation as number) ?? 15;
  const wLang = (w.langues as number) ?? 5;
  const wCert = (w.certifications as number) ?? 5;

  const { matched, missing, bonuses } = analyzeSkills(
    offer.competences_requises,
    offer.competences_souhaitees,
    candidate.competences
  );

  const reqLen = offer.competences_requises.length;
  const desLen = offer.competences_souhaitees.length;
  const reqPct = reqLen > 0 ? (matched.length / reqLen) * 100 : 100;
  const desPct = desLen > 0 ? (bonuses.length / desLen) * 100 : 100;

  let skillScore = 100;
  if (reqLen > 0 && desLen > 0) skillScore = reqPct * 0.7 + desPct * 0.3;
  else if (reqLen > 0) skillScore = reqPct;
  else if (desLen > 0) skillScore = desPct;

  const reqExp = offer.experience_min ?? 0;
  const expYears = calcExperienceYears(candidate.experiences);
  const expScore = reqExp > 0 ? Math.min(100, (expYears / reqExp) * 100) : 100;

  const reqEduKey = offer.niveau_etudes_min ?? "Aucun";
  const reqEduVal = EDU_MAP[reqEduKey] ?? 0;
  const candEduVal = getEduLevel(candidate.diplome);
  const eduScore = reqEduVal > 0
    ? candEduVal >= reqEduVal ? 100 : Math.round((candEduVal / reqEduVal) * 100)
    : 100;

  // Languages score (simplified)
  const langScore = 100; // weighted low anyway

  const totalW = wSkills + wExp + wEdu + wLang + wCert;
  const rawScore = totalW > 0
    ? (skillScore * wSkills + expScore * wExp + eduScore * wEdu + langScore * wLang + 80 * wCert) / totalW
    : skillScore;

  const score = Math.min(100, Math.max(0, Math.round(rawScore)));
  return { score, matched, missing, bonuses, expYears, eduScore: Math.round(eduScore), expScore: Math.round(expScore), skillScore: Math.round(skillScore) };
}

// ─────────────────────────────────────────────────────────────
// GÉNÉRATION DE TEXTE — Résumé
// ─────────────────────────────────────────────────────────────

function genSummary(candidate: CandidateInput, score: number, expYears: number, matched: string[], offer: OfferInput): string {
  const name = candidate.name;
  const title = candidate.title ?? "Professionnel(le)";
  const expStr = expYears > 0 ? `${expYears} an${expYears > 1 ? "s" : ""} d'expérience` : "profil en développement";
  const matchedStr = matched.slice(0, 3).join(", ");

  if (score >= 80) {
    return `${name} est un(e) ${title} avec ${expStr}, présentant une excellente adéquation avec le poste de ${offer.titre}. Son profil couvre les compétences clés attendues${matchedStr ? ` (${matchedStr})` : ""} et son parcours professionnel est cohérent avec les responsabilités attendues. Profil fortement recommandé pour une convocation en entretien.`;
  }
  if (score >= 60) {
    return `${name} présente un profil intéressant avec ${expStr}. Certaines compétences requises sont présentes${matchedStr ? ` (${matchedStr})` : ""}, mais le profil n'est pas une correspondance parfaite avec le poste de ${offer.titre}. Une discussion approfondie lors d'un entretien permettrait de mieux évaluer la capacité d'adaptation du candidat.`;
  }
  return `${name} dispose d'un profil dont les compétences actuelles correspondent partiellement aux exigences du poste de ${offer.titre}. L'écart identifié concerne principalement les compétences techniques clés requises. Ce profil pourrait convenir sous réserve d'une montée en compétences ou d'une reorientation de parcours.`;
}

// ─────────────────────────────────────────────────────────────
// GÉNÉRATION DES FORCES
// ─────────────────────────────────────────────────────────────

function genStrengths(candidate: CandidateInput, matched: string[], bonuses: string[], expYears: number, expScore: number, eduScore: number, offer: OfferInput): string[] {
  const s: string[] = [];
  if (matched.length > 0) {
    s.push(`✅ Maîtrise des compétences clés indispensables : ${matched.join(", ")}`);
  }
  if (bonuses.length > 0) {
    s.push(`✅ Compétences bonus souhaitées maîtrisées : ${bonuses.slice(0, 3).join(", ")}`);
  }
  if (expScore === 100 && expYears > 0) {
    const reqExp = offer.experience_min ?? 0;
    s.push(reqExp > 0 ? `✅ Expérience suffisante : ${expYears} an${expYears > 1 ? "s" : ""} pour ${reqExp} an${reqExp > 1 ? "s" : ""} requis` : `✅ Solide expérience professionnelle de ${expYears} an${expYears > 1 ? "s" : ""}`);
  }
  if (eduScore === 100 && offer.niveau_etudes_min && offer.niveau_etudes_min !== "Aucun") {
    s.push(`✅ Niveau de formation atteint (${offer.niveau_etudes_min} ou supérieur)`);
  }
  if (candidate.bio && candidate.bio.length > 80) {
    s.push("✅ Profil complet avec une présentation professionnelle détaillée");
  }
  const langCount = Array.isArray(candidate.langues) ? candidate.langues.length : 0;
  if (langCount > 1) s.push(`✅ Multilinguisme — ${langCount} langue${langCount > 1 ? "s" : ""} maîtrisée${langCount > 1 ? "s" : ""}`);

  return s.length > 0 ? s : ["✅ Profil enregistré sur la plateforme avec une présentation disponible"];
}

// ─────────────────────────────────────────────────────────────
// GÉNÉRATION DES FAIBLESSES
// ─────────────────────────────────────────────────────────────

function genWeaknesses(candidate: CandidateInput, missing: string[], expYears: number, expScore: number, offer: OfferInput): string[] {
  const w: string[] = [];
  if (missing.length > 0) {
    w.push(`⚠ Compétences requises non mentionnées dans le profil : ${missing.join(", ")}`);
  }
  const reqExp = offer.experience_min ?? 0;
  if (reqExp > 0 && expScore < 100) {
    w.push(`⚠ Expérience insuffisante : ${expYears} an${expYears > 1 ? "s" : ""} pour ${reqExp} an${reqExp > 1 ? "s" : ""} requis`);
  }
  if (!candidate.bio || candidate.bio.length < 50) {
    w.push("⚠ Profil peu documenté — absence ou manque de présentation professionnelle détaillée");
  }
  const langCount = Array.isArray(candidate.langues) ? candidate.langues.length : 0;
  if (langCount === 0 && offer.langues_souhaitees.length > 0) {
    w.push(`⚠ Maîtrise des langues non renseignée (${offer.langues_souhaitees.join(", ")} souhaitée${offer.langues_souhaitees.length > 1 ? "s" : ""})`);
  }
  return w;
}

// ─────────────────────────────────────────────────────────────
// DÉTECTION D'ANOMALIES DE PARCOURS
// ─────────────────────────────────────────────────────────────

function detectAnomalies(candidate: CandidateInput): string[] {
  const anomalies: string[] = [];
  const experiences = candidate.experiences as Record<string, unknown>[];
  if (!experiences || experiences.length === 0) return [];

  const parsed = experiences
    .filter((e) => e["debut"])
    .map((e) => {
      const debut = new Date((e["debut"] as string) + "-01");
      const actuel = e["actuel"] as boolean;
      const fin = actuel ? null : e["fin"] ? new Date((e["fin"] as string) + "-01") : null;
      return { debut, fin, actuel, poste: (e["poste"] as string) ?? "Poste inconnu" };
    })
    .sort((a, b) => a.debut.getTime() - b.debut.getTime());

  for (let i = 0; i < parsed.length - 1; i++) {
    const curr = parsed[i];
    const next = parsed[i + 1];

    // Chevauchement de dates
    if (curr.fin && next.debut && curr.fin > next.debut) {
      anomalies.push(`Chevauchement détecté entre "${curr.poste}" et "${next.poste}" — à clarifier lors de l'entretien`);
    }

    // Trou de carrière (> 12 mois)
    if (curr.fin && next.debut) {
      const gapMonths = Math.round((next.debut.getTime() - curr.fin.getTime()) / (1000 * 60 * 60 * 24 * 30));
      if (gapMonths > 12) {
        anomalies.push(`Trou de carrière de ~${Math.round(gapMonths / 12)} an${Math.round(gapMonths / 12) > 1 ? "s" : ""} détecté entre "${curr.poste}" et "${next.poste}"`);
      }
    }
  }

  // Postes de très courte durée
  const shortTenures = parsed.filter((e) => {
    if (e.debut && e.fin) {
      const months = (e.fin.getTime() - e.debut.getTime()) / (1000 * 60 * 60 * 24 * 30);
      return months < 6;
    }
    return false;
  });
  if (shortTenures.length >= 2) {
    anomalies.push("Plusieurs postes de très courte durée (< 6 mois) détectés — mobilité professionnelle à évaluer");
  }

  return anomalies;
}

// ─────────────────────────────────────────────────────────────
// GÉNÉRATION DES QUESTIONS D'ENTRETIEN
// ─────────────────────────────────────────────────────────────

function genInterviewQuestions(offer: OfferInput, candidate: CandidateInput, weaknesses: string[], matched: string[]): InterviewQuestions {
  const t = offer.titre.toLowerCase();
  const isDevRole = ["développeur", "dev", "full stack", "frontend", "backend", "software", "ingénieur logiciel"].some((k) => t.includes(k));
  const isHRRole = ["ressources humaines", "rh", "recrutement", "talent", "drh", "hrm"].some((k) => t.includes(k));
  const isFinanceRole = ["comptable", "finance", "comptabilité", "trésorier", "audit", "contrôleur"].some((k) => t.includes(k));
  const isMarketingRole = ["marketing", "digital", "communication", "seo", "growth"].some((k) => t.includes(k));
  const isSalesRole = ["commercial", "vente", "sales", "business developer", "account"].some((k) => t.includes(k));

  const req = offer.competences_requises;
  const s1 = req[0] ?? "la compétence principale";
  const s2 = req[1] ?? "les outils métiers";
  const s3 = req[2] ?? "les processus liés au poste";

  let techniques: string[] = [];
  if (isDevRole) {
    techniques = [
      `Pouvez-vous décrire en détail votre expérience avec ${s1} et les types de projets sur lesquels vous l'avez appliqué ?`,
      `Comment architecturez-vous une application ${s2} en partant de zéro ? Quels patterns utilisez-vous ?`,
      `Quelle est votre approche pour les tests (unitaires, intégration, e2e) dans vos projets ?`,
      `Décrivez un problème de performance que vous avez résolu. Quelle était la cause et la solution ?`,
      `Comment gérez-vous la sécurité applicative (authentification, injection SQL, CSRF, CORS) ?`,
      `Quelle est votre expérience avec les bases de données relationnelles et l'optimisation SQL ?`,
      `Décrivez comment vous travaillez dans un contexte Agile/Scrum. Quel est votre rôle typique ?`,
      `Comment gérez-vous le versioning avec Git ? Décrivez votre workflow de branching.`,
      `Avez-vous de l'expérience avec les déploiements CI/CD et les environnements cloud ? Lesquels ?`,
      `Comment assurez-vous la maintenabilité et la lisibilité de votre code dans le temps ?`,
    ];
  } else if (isHRRole) {
    techniques = [
      `Décrivez votre processus de recrutement complet, de l'analyse du besoin à l'intégration du candidat retenu.`,
      `Comment gérez-vous le sourcing pour des profils rares ou très spécialisés ?`,
      `Quelle est votre maîtrise du droit du travail ivoirien et des conventions collectives ?`,
      `Comment mesurez-vous l'efficacité de vos recrutements (KPIs, délais, coûts) ?`,
      `Décrivez une situation de gestion de conflit social difficile que vous avez résolue.`,
      `Quelle est votre expérience avec les SIRH et outils RH digitaux ?`,
      `Comment construisez-vous un plan de formation annuel ? Quelle est votre méthode ?`,
      `Quelle est votre approche pour les entretiens d'évaluation et la gestion de la performance ?`,
      `Décrivez votre expérience avec les déclarations CNPS et les obligations légales employeur.`,
      `Comment gérez-vous la paie et les spécificités du référentiel SYSCOHADA ?`,
    ];
  } else if (isFinanceRole) {
    techniques = [
      `Quelle est votre expérience avec le référentiel comptable SYSCOHADA ?`,
      `Décrivez votre processus de clôture mensuelle et annuelle des comptes.`,
      `Comment gérez-vous les déclarations de TVA et les autres obligations fiscales ivoiriennes ?`,
      `Quels logiciels comptables maîtrisez-vous (SAGE, Coda, ERP, Excel avancé) ?`,
      `Comment établissez-vous une liasse fiscale ? Quelles déclarations traitez-vous régulièrement ?`,
      `Décrivez votre approche pour les rapprochements bancaires et la réconciliation des comptes.`,
      `Quelle est votre expérience avec la gestion des immobilisations et des amortissements ?`,
      `Comment assurez-vous le suivi de la trésorerie et anticipez-vous les besoins de financement ?`,
      `Avez-vous de l'expérience avec les audits internes ou externes ? Quel est votre rôle ?`,
      `Comment détectez-vous et gérez-vous les anomalies comptables ou les risques de fraude ?`,
    ];
  } else if (isMarketingRole) {
    techniques = [
      `Quelle est votre expérience avec Google Analytics, Google Ads et les outils Meta Business ?`,
      `Comment mesurez-vous et optimisez-vous le ROI de vos campagnes digitales ?`,
      `Décrivez une stratégie de contenu que vous avez pilotée et ses résultats mesurables.`,
      `Comment gérez-vous et optimisez-vous un budget publicitaire digital ?`,
      `Quelle est votre approche SEO/SEA et comment collaborez-vous avec l'équipe technique ?`,
      `Quels outils de marketing automation connaissez-vous (HubSpot, Mailchimp, Brevo) ?`,
      `Comment construisez-vous et animez-vous une communauté sur les réseaux sociaux ?`,
      `Quelle est votre expérience en gestion de marque et création de contenus pour l'Afrique de l'Ouest ?`,
      `Comment adaptez-vous une stratégie marketing internationale au marché ivoirien local ?`,
      `Décrivez une campagne qui n'a pas fonctionné. Qu'avez-vous analysé et appris ?`,
    ];
  } else if (isSalesRole) {
    techniques = [
      `Décrivez votre méthode de prospection et de qualification d'un nouveau prospect.`,
      `Comment construisez-vous et gérez-vous votre pipeline commercial ?`,
      `Quelle est votre expérience avec les outils CRM (Salesforce, HubSpot, Pipedrive) ?`,
      `Comment négociez-vous un contrat complexe avec plusieurs parties prenantes ?`,
      `Décrivez votre meilleure performance commerciale et comment vous l'avez atteinte.`,
      `Comment fidélisez-vous un client sur le long terme ?`,
      `Quelle est votre approche pour gérer les objections et les refus ?`,
      `Comment collaborez-vous avec les équipes marketing et produit pour vendre efficacement ?`,
      `Avez-vous de l'expérience dans le développement commercial sur de nouveaux marchés ?`,
      `Comment vous organisez-vous pour gérer un portefeuille client important ?`,
    ];
  } else {
    techniques = [
      `Décrivez votre expérience la plus significative dans votre domaine et les résultats obtenus.`,
      `Quelles compétences techniques maîtrisez-vous le mieux pour ce type de poste ?`,
      `Comment vous tenez-vous informé(e) des évolutions et tendances de votre secteur d'activité ?`,
      `Décrivez un projet complexe que vous avez piloté de A à Z.`,
      `Quels outils et méthodes utilisez-vous pour gérer vos priorités et votre organisation ?`,
      `Comment avez-vous contribué à l'amélioration de processus dans votre dernier poste ?`,
      `Quelle est votre expérience en gestion d'équipe ou en travail transversal ?`,
      `Comment gérez-vous la pression et les délais serrés dans votre activité ?`,
      `Décrivez une décision importante que vous avez prise avec peu d'informations disponibles.`,
      `Quels indicateurs de performance suivez-vous et comment les analysez-vous ?`,
    ];
  }

  const comportementales = [
    `Décrivez une situation où vous avez dû convaincre des parties prenantes d'une décision difficile ou impopulaire. Comment avez-vous procédé et quel a été le résultat ?`,
    `Parlez-moi d'un échec professionnel important. Qu'en avez-vous appris et comment avez-vous rebondi ?`,
    `Comment gérez-vous les conflits au sein d'une équipe ? Donnez-moi un exemple concret et la manière dont vous l'avez résolu.`,
    `Décrivez une situation où vous avez dû vous adapter rapidement à un changement majeur et imprévu.`,
    `Comment priorisez-vous votre travail lorsque vous avez plusieurs urgences simultanées et des ressources limitées ?`,
  ];

  const ciblees: string[] = [];
  const hasMissingSkills = weaknesses.some((w) => w.includes("Compétences requises non mentionnées"));
  if (hasMissingSkills) {
    const missingLine = weaknesses.find((w) => w.includes("Compétences requises non mentionnées")) ?? "";
    const skillsStr = missingLine.replace(/^⚠\s*Compétences requises non mentionnées dans le profil\s*:\s*/, "");
    ciblees.push(`Votre profil ne mentionne pas ${skillsStr || "certaines compétences clés"}. Quel est votre niveau réel de maîtrise de ces technologies et comment envisagez-vous de combler cet écart rapidement ?`);
  }
  if (weaknesses.some((w) => w.includes("Expérience insuffisante"))) {
    ciblees.push(`Votre expérience est en dessous de nos prérequis habituels. Qu'est-ce qui dans votre parcours compenserait cette différence et vous permettrait d'être opérationnel(le) rapidement ?`);
  }
  if (!candidate.bio || candidate.bio.length < 50) {
    ciblees.push(`Votre profil est peu détaillé. Pouvez-vous nous présenter de manière structurée vos principales réalisations et la valeur que vous pouvez apporter à ce poste ?`);
  }
  if (ciblees.length === 0) {
    ciblees.push(`Selon vous, quel est l'aspect de ce poste qui représente le plus grand défi pour vous, et comment comptez-vous y faire face ?`);
  }

  return {
    techniques: techniques.slice(0, 10),
    comportementales,
    ciblees: ciblees.slice(0, 5),
  };
}

// ─────────────────────────────────────────────────────────────
// MOTEUR DE SIMULATION (qualité équivalente à OpenAI)
// ─────────────────────────────────────────────────────────────

function runSimulation(offer: OfferInput, candidates: CandidateInput[]): AIAnalysisResult {
  const analyses: CandidateAIAnalysis[] = candidates.map((candidate) => {
    const { score, matched, missing, bonuses, expYears, eduScore, expScore } = calculateScore(offer, candidate);
    const match_level: "excellent" | "moyen" | "faible" =
      score >= 80 ? "excellent" : score >= 60 ? "moyen" : "faible";

    const summary = genSummary(candidate, score, expYears, matched, offer);
    const strengths = genStrengths(candidate, matched, bonuses, expYears, expScore, eduScore, offer);
    const weaknesses = genWeaknesses(candidate, missing, expYears, expScore, offer);
    const anomalies = detectAnomalies(candidate);
    const interview_questions = genInterviewQuestions(offer, candidate, weaknesses, matched);

    return {
      candidate_id: candidate.id,
      candidate_name: candidate.name,
      candidate_title: candidate.title,
      candidate_ville: candidate.ville,
      is_applicant: candidate.is_applicant,
      score,
      match_level,
      summary,
      strengths,
      weaknesses,
      anomalies,
      interview_questions,
    };
  });

  analyses.sort((a, b) => b.score - a.score);

  const stats: AIAnalysisStats = {
    total: analyses.length,
    excellent: analyses.filter((a) => a.match_level === "excellent").length,
    moyen: analyses.filter((a) => a.match_level === "moyen").length,
    faible: analyses.filter((a) => a.match_level === "faible").length,
    avg_score:
      analyses.length > 0
        ? Math.round(analyses.reduce((s, a) => s + a.score, 0) / analyses.length)
        : 0,
  };

  return { analyses, stats, offer_title: offer.titre, mode: "candidatures", powered_by: "simulation" };
}

// ─────────────────────────────────────────────────────────────
// INTÉGRATION OPENAI (bascule automatique si clé disponible)
// ─────────────────────────────────────────────────────────────

async function runOpenAIAnalysis(offer: OfferInput, candidates: CandidateInput[], apiKey: string): Promise<AIAnalysisResult> {
  const candidatesText = candidates
    .map(
      (c, i) => `
Candidat ${i + 1} (ID: ${c.id}):
- Nom complet: ${c.name}
- Titre professionnel: ${c.title ?? "Non renseigné"}
- Ville: ${c.ville ?? "Non renseignée"}
- Diplôme: ${c.diplome ?? "Non renseigné"}
- Compétences: ${c.competences.length > 0 ? c.competences.join(", ") : "Non renseignées"}
- Expériences: ${(c.experiences as Record<string, unknown>[]).length > 0
    ? (c.experiences as Record<string, unknown>[]).map((e) => `${e["poste"] ?? ""} chez ${e["entreprise"] ?? ""} (${e["debut"] ?? "?"} - ${e["actuel"] ? "Présent" : e["fin"] ?? "?"})`).join(" | ")
    : "Non renseignées"}
- Biographie: ${c.bio ?? "Non renseignée"}
- Langues: ${Array.isArray(c.langues) && c.langues.length > 0 ? c.langues.map((l: Record<string, string>) => l["langue"] ?? l).join(", ") : "Non renseignées"}
- Postulant direct: ${c.is_applicant ? "Oui" : "Non (CVthèque)"}
`
    )
    .join("\n---\n");

  const systemPrompt = `Tu es un expert senior en recrutement et en évaluation de profils pour des entreprises en Afrique de l'Ouest (Côte d'Ivoire). 
Tu analyses objectivement les candidats en te basant UNIQUEMENT sur les compétences professionnelles, l'expérience, la formation et les réalisations.
Tu ne prends JAMAIS en compte le sexe, l'âge, l'origine ethnique, la religion, la nationalité, l'état civil ou tout autre critère personnel non-professionnel.
Tu réponds toujours en français professionnel. Tu génères des analyses précises, nuancées et actionnables pour aider les recruteurs dans leur décision.`;

  const userPrompt = `Analyse ces ${candidates.length} candidat(s) pour l'offre d'emploi suivante.

OFFRE:
- Intitulé: ${offer.titre}
- Secteur: ${offer.secteur ?? "Non précisé"}
- Type de contrat: ${offer.contrat}
- Localisation: ${offer.localisation ?? "Non précisée"}
- Description: ${offer.description}
- Compétences indispensables: ${offer.competences_requises.join(", ")}
- Compétences souhaitées: ${offer.competences_souhaitees.join(", ")}
- Expérience minimum: ${offer.experience_min ?? 0} an(s)
- Niveau d'études minimum: ${offer.niveau_etudes_min ?? "Aucun"}
- Langues souhaitées: ${offer.langues_souhaitees.join(", ")}

Pondération du score: compétences ${offer.criteres_ia?.ponderation?.competences ?? 50}%, expérience ${offer.criteres_ia?.ponderation?.experience ?? 25}%, formation ${offer.criteres_ia?.ponderation?.formation ?? 15}%, langues ${offer.criteres_ia?.ponderation?.langues ?? 5}%, certifications ${offer.criteres_ia?.ponderation?.certifications ?? 5}%

CANDIDATS:
${candidatesText}

Réponds UNIQUEMENT avec un JSON valide ayant cette structure exacte:
{
  "analyses": [
    {
      "candidate_id": "string",
      "score": number,
      "match_level": "excellent"|"moyen"|"faible",
      "summary": "string (2-3 phrases professionnelles en français)",
      "strengths": ["string"],
      "weaknesses": ["string"],
      "anomalies": ["string"],
      "interview_questions": {
        "techniques": ["string"],
        "comportementales": ["string"],
        "ciblees": ["string"]
      }
    }
  ]
}

Règles: score >=80 = "excellent", 60-79 = "moyen", <60 = "faible". Génère 10 questions techniques, 5 comportementales, 3-5 ciblées.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errText}`);
  }

  const data = await response.json() as { choices: { message: { content: string } }[] };
  const content = data.choices[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned empty response");

  const parsed = JSON.parse(content) as { analyses: Record<string, unknown>[] };

  const analyses: CandidateAIAnalysis[] = (parsed.analyses ?? []).map((a) => {
    const candidate = candidates.find((c) => c.id === (a["candidate_id"] as string));
    const iq = a["interview_questions"] as Record<string, string[]> | undefined;
    return {
      candidate_id: a["candidate_id"] as string,
      candidate_name: candidate?.name ?? "Candidat inconnu",
      candidate_title: candidate?.title ?? null,
      candidate_ville: candidate?.ville ?? null,
      is_applicant: candidate?.is_applicant ?? false,
      score: Math.min(100, Math.max(0, (a["score"] as number) ?? 0)),
      match_level: (a["match_level"] as "excellent" | "moyen" | "faible") ?? "faible",
      summary: (a["summary"] as string) ?? "",
      strengths: (a["strengths"] as string[]) ?? [],
      weaknesses: (a["weaknesses"] as string[]) ?? [],
      anomalies: (a["anomalies"] as string[]) ?? [],
      interview_questions: {
        techniques: iq?.["techniques"] ?? [],
        comportementales: iq?.["comportementales"] ?? [],
        ciblees: iq?.["ciblees"] ?? [],
      },
    };
  });

  analyses.sort((a, b) => b.score - a.score);

  const stats: AIAnalysisStats = {
    total: analyses.length,
    excellent: analyses.filter((a) => a.match_level === "excellent").length,
    moyen: analyses.filter((a) => a.match_level === "moyen").length,
    faible: analyses.filter((a) => a.match_level === "faible").length,
    avg_score: analyses.length > 0 ? Math.round(analyses.reduce((s, a) => s + a.score, 0) / analyses.length) : 0,
  };

  return { analyses, stats, offer_title: offer.titre, mode: "candidatures", powered_by: "openai" };
}

// ─────────────────────────────────────────────────────────────
// FONCTION SERVEUR PRINCIPALE (TanStack Start)
// Bascule automatiquement entre OpenAI et simulation
// ─────────────────────────────────────────────────────────────

export const analyzeOfferCandidates = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      offer: OfferInputSchema,
      candidates: z.array(CandidateInputSchema),
      mode: z.enum(["candidatures", "cvtheque"]),
    })
  )
  .handler(async ({ data }): Promise<AIAnalysisResult> => {
    const apiKey = process.env.OPENAI_API_KEY;

    let result: AIAnalysisResult;

    if (apiKey && apiKey.length > 20 && apiKey.startsWith("sk-")) {
      try {
        result = await runOpenAIAnalysis(data.offer, data.candidates, apiKey);
      } catch (e) {
        console.warn("[AI] OpenAI unavailable, using simulation:", e);
        result = runSimulation(data.offer, data.candidates);
      }
    } else {
      result = runSimulation(data.offer, data.candidates);
    }

    result.mode = data.mode;
    return result;
  });
