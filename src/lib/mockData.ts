export type MockCompany = {
  id: string;
  nom: string;
  secteur: string | null;
  localisation: string | null;
  site_web: string | null;
  description: string | null;
  logo_url: string | null;
  created_at: string;
};

export type MockJobOffer = {
  id: string;
  titre: string;
  description: string;
  contrat: string;
  localisation: string | null;
  teletravail: boolean;
  salaire_min: number | null;
  salaire_max: number | null;
  publiee_le: string | null;
  secteur: string | null;
  competences_requises: string | null;
  company_id: string;
  statut: string;
  created_at: string;
};

export type MockCv = {
  id: string;
  nom_fichier: string;
  candidate_id: string;
  created_at: string;
};

export type MockApplication = {
  id: string;
  candidate_id: string;
  offer_id: string;
  cv_id: string | null;
  lettre: string | null;
  statut: string; // "envoyee", "retard", "refusee", "entretien", "embauche"
  created_at: string;
};

export type MockMessage = {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  created_at: string;
  lu: boolean;
};

export const MOCK_COMPANIES: MockCompany[] = [
  {
    id: "company-1",
    nom: "Ivory Tech Solutions",
    secteur: "Technologie & Informatique",
    localisation: "Abidjan, Cocody",
    site_web: "https://www.ivorytech.ci",
    description:
      "Ivory Tech Solutions est un leader de la transformation digitale et des solutions logicielles sur mesure en Afrique de l'Ouest. Nous accompagnons les grandes institutions publiques et privées dans la modernisation de leurs infrastructures technologiques.",
    logo_url: null,
    created_at: "2026-05-01T08:00:00Z",
  },
  {
    id: "company-2",
    nom: "Société Ivoirienne de Banque (SIB)",
    secteur: "Finance & Comptabilité",
    localisation: "Abidjan, Plateau",
    site_web: "https://www.sib.ci",
    description:
      "Acteur bancaire de premier plan en Côte d'Ivoire, la SIB propose une large gamme de produits et services financiers aux particuliers, professionnels et grandes entreprises. Notre force repose sur la confiance et l'accompagnement de nos clients.",
    logo_url: null,
    created_at: "2026-05-02T09:30:00Z",
  },
  {
    id: "company-3",
    nom: "Afriq Agro Industries",
    secteur: "Industrie & Production",
    localisation: "Bouaké",
    site_web: "https://www.afriqagro.ci",
    description:
      "Spécialisé dans la transformation industrielle de produits agricoles locaux (cacao, café, anacarde), Afriq Agro Industries favorise le développement local et la création de valeur ajoutée sur le territoire national.",
    logo_url: null,
    created_at: "2026-05-03T10:15:00Z",
  },
  {
    id: "company-4",
    nom: "Orange Côte d'Ivoire",
    secteur: "Marketing & Communication",
    localisation: "Abidjan, Marcory",
    site_web: "https://www.orange.ci",
    description:
      "Opérateur de télécommunications leader en Côte d'Ivoire, nous connectons des millions de clients à travers notre réseau mobile, internet et mobile money. Nous favorisons l'innovation et l'inclusion numérique au quotidien.",
    logo_url: null,
    created_at: "2026-05-04T11:45:00Z",
  },
  {
    id: "company-5",
    nom: "Sociaux & RH Cabinet",
    secteur: "Ressources Humaines",
    localisation: "Yamoussoukro",
    site_web: "https://www.sociauxrh.ci",
    description:
      "Cabinet de conseil RH spécialisé dans la gestion de la formation professionnelle, de la conformité réglementaire et de l'externalisation de la paie en Côte d'Ivoire.",
    logo_url: null,
    created_at: "2026-05-05T14:20:00Z",
  },
];

export const MOCK_JOB_OFFERS: MockJobOffer[] = [
  {
    id: "offer-1",
    titre: "Directeur des Ressources Humaines (H/F)",
    description:
      "Dans le cadre de notre forte expansion régionale, nous recrutons notre futur Directeur des Ressources Humaines (H/F). Rattaché au Directeur Général, vous concevez et déployez la stratégie RH de l'entreprise (recrutement, gestion des compétences, climat social et relations gouvernementales). Vous managez une équipe de 5 collaborateurs.",
    contrat: "CDI",
    localisation: "Abidjan, Cocody",
    teletravail: true,
    salaire_min: 1500000,
    salaire_max: 2500000,
    publiee_le: "2026-05-28T09:00:00Z",
    secteur: "Ressources Humaines",
    competences_requises: "Stratégie RH, Droit social, Recrutement, Leadership, SYSCOHADA",
    company_id: "company-1",
    statut: "publiee",
    created_at: "2026-05-28T09:00:00Z",
  },
  {
    id: "offer-2",
    titre: "Développeur Full-Stack React / Node.js Senior",
    description:
      "Nous recherchons un Développeur Full-Stack Senior pour concevoir des applications web innovantes à destination de nos clients internationaux. Vous travaillerez dans un environnement agile moderne et participerez aux choix d'architecture technique. Autonomie et maîtrise de la qualité du code sont indispensables.",
    contrat: "CDI",
    localisation: "Abidjan, Cocody",
    teletravail: true,
    salaire_min: 800000,
    salaire_max: 1300000,
    publiee_le: "2026-05-29T10:30:00Z",
    secteur: "Technologie & Informatique",
    competences_requises: "React, Node.js, TypeScript, PostgreSQL, TailwindCSS",
    company_id: "company-1",
    statut: "publiee",
    created_at: "2026-05-29T10:30:00Z",
  },
  {
    id: "offer-3",
    titre: "Responsable Recrutement & Talent Acquisition",
    description:
      "Au sein de notre équipe RH, vous piloterez le sourcing et la sélection des profils d'élite de la banque. Vous travaillerez en étroite collaboration avec les directeurs métiers, animerez les relations avec les grandes écoles et développerez la marque employeur de la SIB sur les réseaux professionnels.",
    contrat: "CDI",
    localisation: "Abidjan, Plateau",
    teletravail: false,
    salaire_min: 1200000,
    salaire_max: 1800000,
    publiee_le: "2026-05-30T11:00:00Z",
    secteur: "Ressources Humaines",
    competences_requises: "Recrutement de cadres, Sourcing, Réseaux sociaux, Entretiens structurés",
    company_id: "company-2",
    statut: "publiee",
    created_at: "2026-05-30T11:00:00Z",
  },
  {
    id: "offer-4",
    titre: "Comptable Unique (H/F)",
    description:
      "Nous recherchons un Comptable Unique pour notre site industriel à Bouaké. Rattaché directement au Directeur d'Usine, vous assurez la tenue complète de la comptabilité : facturation, comptabilité fournisseurs/clients, rapprochements bancaires, déclarations de TVA et préparation des éléments de paie sous le référentiel SYSCOHADA.",
    contrat: "CDI",
    localisation: "Bouaké",
    teletravail: false,
    salaire_min: 500000,
    salaire_max: 750000,
    publiee_le: "2026-06-01T08:00:00Z",
    secteur: "Finance & Comptabilité",
    competences_requises: "Comptabilité générale, SYSCOHADA, Déclarations fiscales, Paie",
    company_id: "company-3",
    statut: "publiee",
    created_at: "2026-06-01T08:00:00Z",
  },
  {
    id: "offer-5",
    titre: "Chef de Projet Marketing Digital (H/F)",
    description:
      "Vous pilotez les campagnes d'acquisition digitale et la communication en ligne de nos services mobiles. Responsable du budget publicitaire numérique, vous analysez les performances (ROI, trafic) et proposez des optimisations régulières pour accroître la notoriété de notre marque.",
    contrat: "CDD",
    localisation: "Abidjan, Marcory",
    teletravail: false,
    salaire_min: 700000,
    salaire_max: 1100000,
    publiee_le: "2026-06-01T09:15:00Z",
    secteur: "Marketing & Communication",
    competences_requises: "Google Ads, Social Media, Growth Hacking, Analytics, SEO",
    company_id: "company-4",
    statut: "publiee",
    created_at: "2026-06-01T09:15:00Z",
  },
  {
    id: "offer-6",
    titre: "Consultant Paie & Administration du Personnel (H/F)",
    description:
      "Au sein du cabinet, vous assurez la gestion d'un portefeuille de clients pour l'établissement de la paie et la réalisation des déclarations sociales (CNPS). Vous conseillez vos interlocuteurs sur le droit social et veillez à l'application rigoureuse de la législation du travail.",
    contrat: "CDI",
    localisation: "Abidjan, Cocody",
    teletravail: true,
    salaire_min: 600000,
    salaire_max: 950000,
    publiee_le: "2026-05-25T14:00:00Z",
    secteur: "Ressources Humaines",
    competences_requises: "Gestion de la paie, Déclarations sociales, CNPS, Droit du travail",
    company_id: "company-5",
    statut: "publiee",
    created_at: "2026-05-25T14:00:00Z",
  },
];

// Helper functions for LOCAL STORAGE Simulation
export function getMockJobOffers(): MockJobOffer[] {
  if (typeof window === "undefined") return MOCK_JOB_OFFERS;
  const stored = localStorage.getItem("mock_job_offers");
  if (!stored) {
    localStorage.setItem("mock_job_offers", JSON.stringify(MOCK_JOB_OFFERS));
    return MOCK_JOB_OFFERS;
  }
  return JSON.parse(stored);
}

export function saveMockJobOffer(offer: MockJobOffer) {
  const list = getMockJobOffers();
  const index = list.findIndex((o) => o.id === offer.id);
  if (index >= 0) {
    list[index] = offer;
  } else {
    list.push(offer);
  }
  localStorage.setItem("mock_job_offers", JSON.stringify(list));
}

export function getMockCompanies(): MockCompany[] {
  if (typeof window === "undefined") return MOCK_COMPANIES;
  const stored = localStorage.getItem("mock_companies");
  if (!stored) {
    localStorage.setItem("mock_companies", JSON.stringify(MOCK_COMPANIES));
    return MOCK_COMPANIES;
  }
  return JSON.parse(stored);
}

export function saveMockCompany(comp: MockCompany) {
  const list = getMockCompanies();
  const index = list.findIndex((c) => c.id === comp.id);
  if (index >= 0) {
    list[index] = comp;
  } else {
    list.push(comp);
  }
  localStorage.setItem("mock_companies", JSON.stringify(list));
}

export function getMockCvs(candidateId: string): MockCv[] {
  if (typeof window === "undefined") return [];
  const key = `mock_cvs_${candidateId}`;
  const stored = localStorage.getItem(key);
  if (!stored) {
    const defaultCvs = [
      {
        id: "cv-1",
        nom_fichier: "CV_Koffi_Anan_Directeur_RH.pdf",
        candidate_id: candidateId,
        created_at: new Date().toISOString(),
      },
      {
        id: "cv-2",
        nom_fichier: "CV_Koffi_Anan_Consultant_Senior.pdf",
        candidate_id: candidateId,
        created_at: new Date().toISOString(),
      },
    ];
    localStorage.setItem(key, JSON.stringify(defaultCvs));
    return defaultCvs;
  }
  return JSON.parse(stored);
}

export function saveMockCv(cv: MockCv) {
  const list = getMockCvs(cv.candidate_id);
  list.push(cv);
  localStorage.setItem(`mock_cvs_${cv.candidate_id}`, JSON.stringify(list));
}

export function getMockApplications(): MockApplication[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("mock_applications");
  if (!stored) {
    const defaultApps = [
      {
        id: "app-1",
        candidate_id: "mock-candidate-1",
        offer_id: "offer-1",
        cv_id: "cv-1",
        lettre:
          "Bonjour, je suis vivement intéressé par le poste de DRH chez Ivory Tech Solutions. Fort de 8 années d'expérience en gestion d'équipes et administration en Côte d'Ivoire, je souhaite apporter mon expertise à vos projets.",
        statut: "entretien",
        created_at: "2026-05-29T14:30:00Z",
      },
      {
        id: "app-2",
        candidate_id: "mock-candidate-1",
        offer_id: "offer-3",
        cv_id: "cv-1",
        lettre:
          "Madame, Monsieur,\n\nJe postule pour le poste de Responsable Recrutement. Mon profil correspond parfaitement à vos recherches.",
        statut: "envoyee",
        created_at: "2026-05-30T16:00:00Z",
      },
    ];
    localStorage.setItem("mock_applications", JSON.stringify(defaultApps));
    return defaultApps;
  }
  return JSON.parse(stored);
}

export function saveMockApplication(app: MockApplication) {
  const list = getMockApplications();
  const index = list.findIndex((a) => a.id === app.id);
  if (index >= 0) {
    list[index] = app;
  } else {
    list.push(app);
  }
  localStorage.setItem("mock_applications", JSON.stringify(list));
}

export function getMockMessages(): MockMessage[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("mock_messages");
  if (!stored) {
    const defaultMsgs = [
      {
        id: "msg-1",
        sender_id: "mock-recruiter-1",
        recipient_id: "mock-candidate-1",
        message:
          "Bonjour M. Anan, nous avons bien reçu votre candidature pour le poste de DRH. Votre profil a retenu toute notre attention. Seriez-vous disponible pour un entretien Teams ce jeudi à 10h ?",
        created_at: "2026-05-30T09:00:00Z",
        lu: true,
      },
      {
        id: "msg-2",
        sender_id: "mock-candidate-1",
        recipient_id: "mock-recruiter-1",
        message:
          "Bonjour M. Yao, merci pour ce retour positif. Je serai tout à fait disponible ce jeudi à 10h pour échanger de vive voix. Je vous souhaite une excellente journée.",
        created_at: "2026-05-30T10:15:00Z",
        lu: true,
      },
    ];
    localStorage.setItem("mock_messages", JSON.stringify(defaultMsgs));
    return defaultMsgs;
  }
  return JSON.parse(stored);
}

export function saveMockMessage(msg: MockMessage) {
  const list = getMockMessages();
  list.push(msg);
  localStorage.setItem(`mock_messages`, JSON.stringify(list));
}

// ─────────────────────────────────────────────
// ADMIN MOCK DATA
// ─────────────────────────────────────────────

export type MockUser = {
  id: string;
  prenom: string;
  nom: string;
  telephone: string | null;
  ville: string | null;
  created_at: string;
  role: "candidat" | "recruteur" | "admin";
};

export type MockReferential = {
  id: string;
  type: "secteur" | "localisation" | "contrat";
  valeur: string;
  ordre: number;
  actif: boolean;
};

export type MockAdminStats = {
  candidates: number;
  companies: { total: number; en_attente: number; validee: number; rejetee: number };
  offers: { total: number; brouillon: number; publiee: number; suspendue: number; expiree: number };
  applications: number;
};

export const MOCK_USERS: MockUser[] = [
  {
    id: "mock-admin-1",
    prenom: "Adjoua",
    nom: "Konan",
    telephone: "+225 07 00 00 01",
    ville: "Abidjan",
    created_at: "2026-01-10T08:00:00Z",
    role: "admin",
  },
  {
    id: "mock-recruiter-1",
    prenom: "Kouassi",
    nom: "Yao",
    telephone: "+225 07 00 00 02",
    ville: "Abidjan",
    created_at: "2026-02-14T09:30:00Z",
    role: "recruteur",
  },
  {
    id: "mock-recruiter-2",
    prenom: "Aya",
    nom: "Touré",
    telephone: "+225 07 00 00 03",
    ville: "Bouaké",
    created_at: "2026-02-20T10:00:00Z",
    role: "recruteur",
  },
  {
    id: "mock-recruiter-3",
    prenom: "Issouf",
    nom: "Coulibaly",
    telephone: "+225 07 00 00 04",
    ville: "Abidjan",
    created_at: "2026-03-01T08:45:00Z",
    role: "recruteur",
  },
  {
    id: "mock-candidate-1",
    prenom: "Koffi",
    nom: "Anan",
    telephone: "+225 07 00 00 05",
    ville: "Abidjan",
    created_at: "2026-03-15T14:00:00Z",
    role: "candidat",
  },
  {
    id: "mock-candidate-2",
    prenom: "Fatou",
    nom: "Diallo",
    telephone: "+225 07 00 00 06",
    ville: "Yamoussoukro",
    created_at: "2026-03-22T11:30:00Z",
    role: "candidat",
  },
  {
    id: "mock-candidate-3",
    prenom: "Serge",
    nom: "Gbagbo",
    telephone: "+225 07 00 00 07",
    ville: "Abidjan",
    created_at: "2026-04-05T09:00:00Z",
    role: "candidat",
  },
  {
    id: "mock-candidate-4",
    prenom: "Aminata",
    nom: "Bamba",
    telephone: "+225 07 00 00 08",
    ville: "San Pedro",
    created_at: "2026-04-18T16:00:00Z",
    role: "candidat",
  },
];

export const MOCK_PENDING_COMPANIES: (MockCompany & { statut: string; owner_id: string })[] = [
  {
    id: "company-6",
    nom: "Savane Construction Group",
    secteur: "BTP & Immobilier",
    localisation: "Abidjan, Yopougon",
    site_web: "https://www.savane-construction.ci",
    description:
      "Entreprise de construction et de promotion immobilière active dans les projets d'infrastructure publique et privée en Côte d'Ivoire depuis 2012.",
    logo_url: null,
    created_at: "2026-05-30T14:00:00Z",
    statut: "en_attente",
    owner_id: "mock-recruiter-2",
  },
  {
    id: "company-7",
    nom: "MediCare Côte d'Ivoire",
    secteur: "Santé & Médical",
    localisation: "Abidjan, Cocody",
    site_web: "https://www.medicare.ci",
    description:
      "Groupe hospitalier privé proposant des services de santé de pointe : consultations spécialisées, imagerie médicale et chirurgie ambulatoire.",
    logo_url: null,
    created_at: "2026-06-01T10:30:00Z",
    statut: "en_attente",
    owner_id: "mock-recruiter-3",
  },
];

export const MOCK_REFERENTIALS: MockReferential[] = [
  // Secteurs
  { id: "ref-s1", type: "secteur", valeur: "Technologie & Informatique", ordre: 1, actif: true },
  { id: "ref-s2", type: "secteur", valeur: "Finance & Comptabilité", ordre: 2, actif: true },
  { id: "ref-s3", type: "secteur", valeur: "Ressources Humaines", ordre: 3, actif: true },
  { id: "ref-s4", type: "secteur", valeur: "Marketing & Communication", ordre: 4, actif: true },
  { id: "ref-s5", type: "secteur", valeur: "Industrie & Production", ordre: 5, actif: true },
  { id: "ref-s6", type: "secteur", valeur: "BTP & Immobilier", ordre: 6, actif: true },
  { id: "ref-s7", type: "secteur", valeur: "Santé & Médical", ordre: 7, actif: true },
  { id: "ref-s8", type: "secteur", valeur: "Education & Formation", ordre: 8, actif: true },
  { id: "ref-s9", type: "secteur", valeur: "Commerce & Distribution", ordre: 9, actif: true },
  { id: "ref-s10", type: "secteur", valeur: "Transport & Logistique", ordre: 10, actif: true },
  // Localisations
  { id: "ref-l1", type: "localisation", valeur: "Abidjan", ordre: 1, actif: true },
  { id: "ref-l2", type: "localisation", valeur: "Bouaké", ordre: 2, actif: true },
  { id: "ref-l3", type: "localisation", valeur: "Yamoussoukro", ordre: 3, actif: true },
  { id: "ref-l4", type: "localisation", valeur: "San Pedro", ordre: 4, actif: true },
  { id: "ref-l5", type: "localisation", valeur: "Korhogo", ordre: 5, actif: true },
  { id: "ref-l6", type: "localisation", valeur: "Daloa", ordre: 6, actif: true },
  { id: "ref-l7", type: "localisation", valeur: "Man", ordre: 7, actif: true },
  // Contrats
  { id: "ref-c1", type: "contrat", valeur: "CDI", ordre: 1, actif: true },
  { id: "ref-c2", type: "contrat", valeur: "CDD", ordre: 2, actif: true },
  { id: "ref-c3", type: "contrat", valeur: "Stage", ordre: 3, actif: true },
  { id: "ref-c4", type: "contrat", valeur: "Alternance", ordre: 4, actif: true },
  { id: "ref-c5", type: "contrat", valeur: "Freelance", ordre: 5, actif: true },
  { id: "ref-c6", type: "contrat", valeur: "Intérim", ordre: 6, actif: true },
];

export const MOCK_ADMIN_STATS: MockAdminStats = {
  candidates: 4,
  companies: { total: 7, en_attente: 2, validee: 5, rejetee: 0 },
  offers: { total: 6, brouillon: 0, publiee: 6, suspendue: 0, expiree: 0 },
  applications: 2,
};

// ── Helpers Admin ──────────────────────────────

export function getMockUsers(): MockUser[] {
  if (typeof window === "undefined") return MOCK_USERS;
  const stored = localStorage.getItem("mock_users");
  if (!stored) {
    localStorage.setItem("mock_users", JSON.stringify(MOCK_USERS));
    return MOCK_USERS;
  }
  return JSON.parse(stored);
}

export function saveMockUser(user: MockUser) {
  const list = getMockUsers();
  const index = list.findIndex((u) => u.id === user.id);
  if (index >= 0) list[index] = user;
  else list.push(user);
  localStorage.setItem("mock_users", JSON.stringify(list));
}

export function getMockAdminCompanies(): (MockCompany & { statut: string; owner_id: string })[] {
  if (typeof window === "undefined")
    return [
      ...MOCK_COMPANIES.map((c) => ({ ...c, statut: "validee", owner_id: "mock-recruiter-1" })),
      ...MOCK_PENDING_COMPANIES,
    ];
  const stored = localStorage.getItem("mock_admin_companies");
  if (!stored) {
    const all = [
      ...MOCK_COMPANIES.map((c) => ({ ...c, statut: "validee", owner_id: "mock-recruiter-1" })),
      ...MOCK_PENDING_COMPANIES,
    ];
    localStorage.setItem("mock_admin_companies", JSON.stringify(all));
    return all;
  }
  return JSON.parse(stored);
}

export function saveMockAdminCompany(id: string, statut: string) {
  const list = getMockAdminCompanies();
  const index = list.findIndex((c) => c.id === id);
  if (index >= 0) list[index].statut = statut;
  localStorage.setItem("mock_admin_companies", JSON.stringify(list));
}

export function getMockReferentials(): MockReferential[] {
  if (typeof window === "undefined") return MOCK_REFERENTIALS;
  const stored = localStorage.getItem("mock_referentials");
  if (!stored) {
    localStorage.setItem("mock_referentials", JSON.stringify(MOCK_REFERENTIALS));
    return MOCK_REFERENTIALS;
  }
  return JSON.parse(stored);
}

export function addMockReferential(item: Omit<MockReferential, "id">) {
  const list = getMockReferentials();
  const newItem: MockReferential = { ...item, id: `ref-${Date.now()}` };
  list.push(newItem);
  localStorage.setItem("mock_referentials", JSON.stringify(list));
  return newItem;
}

export function deleteMockReferential(id: string) {
  const list = getMockReferentials().filter((r) => r.id !== id);
  localStorage.setItem("mock_referentials", JSON.stringify(list));
}

export function getMockAdminStats(): MockAdminStats {
  const companies = getMockAdminCompanies();
  const offers = getMockJobOffers();
  const users = getMockUsers();
  return {
    candidates: users.filter((u) => u.role === "candidat").length,
    companies: {
      total: companies.length,
      en_attente: companies.filter((c) => c.statut === "en_attente").length,
      validee: companies.filter((c) => c.statut === "validee").length,
      rejetee: companies.filter((c) => c.statut === "rejetee").length,
    },
    offers: {
      total: offers.length,
      brouillon: offers.filter((o) => o.statut === "brouillon").length,
      publiee: offers.filter((o) => o.statut === "publiee").length,
      suspendue: offers.filter((o) => o.statut === "suspendue").length,
      expiree: offers.filter((o) => o.statut === "expiree").length,
    },
    applications: getMockApplications().length,
  };
}
