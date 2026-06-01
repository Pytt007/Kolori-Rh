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
    description: "Ivory Tech Solutions est un leader de la transformation digitale et des solutions logicielles sur mesure en Afrique de l'Ouest. Nous accompagnons les grandes institutions publiques et privées dans la modernisation de leurs infrastructures technologiques.",
    logo_url: null,
    created_at: "2026-05-01T08:00:00Z"
  },
  {
    id: "company-2",
    nom: "Société Ivoirienne de Banque (SIB)",
    secteur: "Finance & Comptabilité",
    localisation: "Abidjan, Plateau",
    site_web: "https://www.sib.ci",
    description: "Acteur bancaire de premier plan en Côte d'Ivoire, la SIB propose une large gamme de produits et services financiers aux particuliers, professionnels et grandes entreprises. Notre force repose sur la confiance et l'accompagnement de nos clients.",
    logo_url: null,
    created_at: "2026-05-02T09:30:00Z"
  },
  {
    id: "company-3",
    nom: "Afriq Agro Industries",
    secteur: "Industrie & Production",
    localisation: "Bouaké",
    site_web: "https://www.afriqagro.ci",
    description: "Spécialisé dans la transformation industrielle de produits agricoles locaux (cacao, café, anacarde), Afriq Agro Industries favorise le développement local et la création de valeur ajoutée sur le territoire national.",
    logo_url: null,
    created_at: "2026-05-03T10:15:00Z"
  },
  {
    id: "company-4",
    nom: "Orange Côte d'Ivoire",
    secteur: "Marketing & Communication",
    localisation: "Abidjan, Marcory",
    site_web: "https://www.orange.ci",
    description: "Opérateur de télécommunications leader en Côte d'Ivoire, nous connectons des millions de clients à travers notre réseau mobile, internet et mobile money. Nous favorisons l'innovation et l'inclusion numérique au quotidien.",
    logo_url: null,
    created_at: "2026-05-04T11:45:00Z"
  },
  {
    id: "company-5",
    nom: "Sociaux & RH Cabinet",
    secteur: "Ressources Humaines",
    localisation: "Yamoussoukro",
    site_web: "https://www.sociauxrh.ci",
    description: "Cabinet de conseil RH spécialisé dans la gestion de la formation professionnelle, de la conformité réglementaire et de l'externalisation de la paie en Côte d'Ivoire.",
    logo_url: null,
    created_at: "2026-05-05T14:20:00Z"
  }
];

export const MOCK_JOB_OFFERS: MockJobOffer[] = [
  {
    id: "offer-1",
    titre: "Directeur des Ressources Humaines (H/F)",
    description: "Dans le cadre de notre forte expansion régionale, nous recrutons notre futur Directeur des Ressources Humaines (H/F). Rattaché au Directeur Général, vous concevez et déployez la stratégie RH de l'entreprise (recrutement, gestion des compétences, climat social et relations gouvernementales). Vous managez une équipe de 5 collaborateurs.",
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
    created_at: "2026-05-28T09:00:00Z"
  },
  {
    id: "offer-2",
    titre: "Développeur Full-Stack React / Node.js Senior",
    description: "Nous recherchons un Développeur Full-Stack Senior pour concevoir des applications web innovantes à destination de nos clients internationaux. Vous travaillerez dans un environnement agile moderne et participerez aux choix d'architecture technique. Autonomie et maîtrise de la qualité du code sont indispensables.",
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
    created_at: "2026-05-29T10:30:00Z"
  },
  {
    id: "offer-3",
    titre: "Responsable Recrutement & Talent Acquisition",
    description: "Au sein de notre équipe RH, vous piloterez le sourcing et la sélection des profils d'élite de la banque. Vous travaillerez en étroite collaboration avec les directeurs métiers, animerez les relations avec les grandes écoles et développerez la marque employeur de la SIB sur les réseaux professionnels.",
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
    created_at: "2026-05-30T11:00:00Z"
  },
  {
    id: "offer-4",
    titre: "Comptable Unique (H/F)",
    description: "Nous recherchons un Comptable Unique pour notre site industriel à Bouaké. Rattaché directement au Directeur d'Usine, vous assurez la tenue complète de la comptabilité : facturation, comptabilité fournisseurs/clients, rapprochements bancaires, déclarations de TVA et préparation des éléments de paie sous le référentiel SYSCOHADA.",
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
    created_at: "2026-06-01T08:00:00Z"
  },
  {
    id: "offer-5",
    titre: "Chef de Projet Marketing Digital (H/F)",
    description: "Vous pilotez les campagnes d'acquisition digitale et la communication en ligne de nos services mobiles. Responsable du budget publicitaire numérique, vous analysez les performances (ROI, trafic) et proposez des optimisations régulières pour accroître la notoriété de notre marque.",
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
    created_at: "2026-06-01T09:15:00Z"
  },
  {
    id: "offer-6",
    titre: "Consultant Paie & Administration du Personnel (H/F)",
    description: "Au sein du cabinet, vous assurez la gestion d'un portefeuille de clients pour l'établissement de la paie et la réalisation des déclarations sociales (CNPS). Vous conseillez vos interlocuteurs sur le droit social et veillez à l'application rigoureuse de la législation du travail.",
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
    created_at: "2026-05-25T14:00:00Z"
  }
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
      { id: "cv-1", nom_fichier: "CV_Koffi_Anan_Directeur_RH.pdf", candidate_id: candidateId, created_at: new Date().toISOString() },
      { id: "cv-2", nom_fichier: "CV_Koffi_Anan_Consultant_Senior.pdf", candidate_id: candidateId, created_at: new Date().toISOString() }
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
        lettre: "Bonjour, je suis vivement intéressé par le poste de DRH chez Ivory Tech Solutions. Fort de 8 années d'expérience en gestion d'équipes et administration en Côte d'Ivoire, je souhaite apporter mon expertise à vos projets.",
        statut: "entretien",
        created_at: "2026-05-29T14:30:00Z"
      },
      {
        id: "app-2",
        candidate_id: "mock-candidate-1",
        offer_id: "offer-3",
        cv_id: "cv-1",
        lettre: "Madame, Monsieur,\n\nJe postule pour le poste de Responsable Recrutement. Mon profil correspond parfaitement à vos recherches.",
        statut: "envoyee",
        created_at: "2026-05-30T16:00:00Z"
      }
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
        message: "Bonjour M. Anan, nous avons bien reçu votre candidature pour le poste de DRH. Votre profil a retenu toute notre attention. Seriez-vous disponible pour un entretien Teams ce jeudi à 10h ?",
        created_at: "2026-05-30T09:00:00Z",
        lu: true
      },
      {
        id: "msg-2",
        sender_id: "mock-candidate-1",
        recipient_id: "mock-recruiter-1",
        message: "Bonjour M. Yao, merci pour ce retour positif. Je serai tout à fait disponible ce jeudi à 10h pour échanger de vive voix. Je vous souhaite une excellente journée.",
        created_at: "2026-05-30T10:15:00Z",
        lu: true
      }
    ];
    localStorage.setItem("mock_messages", JSON.stringify(defaultMsgs));
    return defaultMsgs;
  }
  return JSON.parse(stored);
}

export function saveMockMessage(msg: MockMessage) {
  const list = getMockMessages();
  list.push(msg);
  localStorage.setItem("mock_messages", JSON.stringify(list));
}
