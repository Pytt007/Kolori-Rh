import { useState, useEffect, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CONTRACT_TYPES, type ContractType } from "@/lib/recruiter";
import {
  ChevronDown,
  Briefcase,
  AlignLeft,
  GraduationCap,
  Sparkles,
  Info,
  Clock,
  Calendar,
  AlertCircle
} from "lucide-react";

export type OfferFormValues = {
  titre: string;
  contrat: ContractType;
  secteur: string;
  localisation: string;
  teletravail: string;
  salaire_min: string;
  salaire_max: string;
  competences_requises: string;

  // New fields
  departement: string;
  missions_principales: string;
  responsabilites: string;
  objectifs: string;
  niveau_etudes_min: string;
  experience_min: string;
  competences_souhaitees: string;
  certifications_souhaitees: string;
  langues_souhaitees: string;
  date_limite: string;
  salaire_texte: string;
  avantages: string;
  horaires: string;
  description: string;

  // IA weightings
  ponderation_competences: number;
  ponderation_experience: number;
  ponderation_formation: number;
  ponderation_langues: number;
  ponderation_certifications: number;
};

export function OfferForm({
  initial,
  onSubmit,
  submitLabel,
}: {
  initial?: Partial<OfferFormValues>;
  onSubmit: (v: OfferFormValues) => Promise<void>;
  submitLabel: string;
}) {
  const [form, setForm] = useState<OfferFormValues>({
    titre: initial?.titre ?? "",
    contrat: (initial?.contrat as ContractType) ?? "CDI",
    secteur: initial?.secteur ?? "",
    localisation: initial?.localisation ?? "",
    teletravail: initial?.teletravail ?? "",
    salaire_min: initial?.salaire_min ?? "",
    salaire_max: initial?.salaire_max ?? "",
    competences_requises: initial?.competences_requises ?? "",

    // New fields
    departement: (initial as any)?.departement ?? "",
    missions_principales: (initial as any)?.missions_principales ?? "",
    responsabilites: (initial as any)?.responsabilites ?? "",
    objectifs: (initial as any)?.objectifs ?? "",
    niveau_etudes_min: (initial as any)?.niveau_etudes_min ?? "Aucun",
    experience_min: (initial as any)?.experience_min?.toString() ?? "0",
    competences_souhaitees: (initial as any)?.competences_souhaitees ?? "",
    certifications_souhaitees: (initial as any)?.certifications_souhaitees ?? "",
    langues_souhaitees: (initial as any)?.langues_souhaitees ?? "",
    date_limite: (initial as any)?.date_limite ?? "",
    salaire_texte: (initial as any)?.salaire_texte ?? "",
    avantages: (initial as any)?.avantages ?? "",
    horaires: (initial as any)?.horaires ?? "",
    description: initial?.description ?? "",

    // IA Weightings
    ponderation_competences: (initial as any)?.ponderation_competences ?? 50,
    ponderation_experience: (initial as any)?.ponderation_experience ?? 25,
    ponderation_formation: (initial as any)?.ponderation_formation ?? 15,
    ponderation_langues: (initial as any)?.ponderation_langues ?? 5,
    ponderation_certifications: (initial as any)?.ponderation_certifications ?? 5,
  });

  const [saving, setSaving] = useState(false);

  // Accordion Sections State
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    general: true,
    description: false,
    profil: false,
    conditions: false,
    ia: false,
  });

  const toggleSection = (section: string) => {
    setExpanded((prev) => {
      const nextState = {
        general: false,
        description: false,
        profil: false,
        conditions: false,
        ia: false,
      };
      nextState[section as keyof typeof nextState] = !prev[section];
      return nextState;
    });
  };

  // Live matching candidate simulator state
  const [candidateSim, setCandidateSim] = useState({
    skills: [] as string[],
    experience: 2,
    education: "Bac+3",
    certifications: [] as string[],
    languages: [] as string[],
  });

  // Helper to parse comma-separated fields
  const parseList = (str: string) =>
    str
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const reqSkills = parseList(form.competences_requises);
  const desSkills = parseList(form.competences_souhaitees);
  const certs = parseList(form.certifications_souhaitees);
  const langs = parseList(form.langues_souhaitees);

  // Synchronization: Ensure candidate simulation list updates when form fields are typed
  useEffect(() => {
    setCandidateSim((prev) => {
      const allFormSkills = [...reqSkills, ...desSkills];
      return {
        ...prev,
        skills: prev.skills.filter((s) => allFormSkills.includes(s)),
        certifications: prev.certifications.filter((c) => certs.includes(c)),
        languages: prev.languages.filter((l) => langs.includes(l)),
      };
    });
  }, [form.competences_requises, form.competences_souhaitees, form.certifications_souhaitees, form.langues_souhaitees]);

  // Compatibility Score Calculator logic
  const wSkills = form.ponderation_competences;
  const wExp = form.ponderation_experience;
  const wEdu = form.ponderation_formation;
  const wLang = form.ponderation_langues;
  const wCert = form.ponderation_certifications;

  const sumWeights = wSkills + wExp + wEdu + wLang + wCert;

  // 1. Skills compat
  let scoreSkills = 100;
  if (reqSkills.length > 0 || desSkills.length > 0) {
    const checkedReq = reqSkills.filter((s) => candidateSim.skills.includes(s)).length;
    const checkedDes = desSkills.filter((s) => candidateSim.skills.includes(s)).length;
    const reqScore = reqSkills.length > 0 ? (checkedReq / reqSkills.length) * 100 : 100;
    const desScore = desSkills.length > 0 ? (checkedDes / desSkills.length) * 100 : 100;

    if (reqSkills.length > 0 && desSkills.length > 0) {
      scoreSkills = reqScore * 0.7 + desScore * 0.3;
    } else if (reqSkills.length > 0) {
      scoreSkills = reqScore;
    } else {
      scoreSkills = desScore;
    }
  }

  // 2. Experience compat
  let scoreExp = 100;
  const minExp = parseInt(form.experience_min, 10) || 0;
  if (minExp > 0) {
    if (candidateSim.experience >= minExp) {
      scoreExp = 100;
    } else {
      scoreExp = (candidateSim.experience / minExp) * 100;
    }
  }

  // 3. Education compat
  let scoreEdu = 100;
  const eduMap: Record<string, number> = {
    Aucun: 0,
    Bac: 1,
    "Bac+2": 2,
    "Bac+3": 3,
    "Bac+4": 4,
    "Bac+5": 5,
    "Bac+8": 6,
  };
  const reqEduVal = eduMap[form.niveau_etudes_min] || 0;
  const candEduVal = eduMap[candidateSim.education] || 0;
  if (reqEduVal > 0) {
    if (candEduVal >= reqEduVal) {
      scoreEdu = 100;
    } else {
      scoreEdu = candEduVal === 0 ? 0 : Math.max(30, (candEduVal / reqEduVal) * 80);
    }
  }

  // 4. Languages compat
  let scoreLang = 100;
  if (langs.length > 0) {
    const checkedLang = langs.filter((l) => candidateSim.languages.includes(l)).length;
    scoreLang = (checkedLang / langs.length) * 100;
  }

  // 5. Certifications compat
  let scoreCert = 100;
  if (certs.length > 0) {
    const checkedCert = certs.filter((c) => candidateSim.certifications.includes(c)).length;
    scoreCert = (checkedCert / certs.length) * 100;
  }

  let finalScore = 0;
  if (sumWeights > 0) {
    finalScore = Math.round(
      (scoreSkills * wSkills +
        scoreExp * wExp +
        scoreEdu * wEdu +
        scoreLang * wLang +
        scoreCert * wCert) /
        sumWeights
    );
  }

  // Auto balance to 100% helper
  const handleAutoBalance = () => {
    setForm((prev) => ({
      ...prev,
      ponderation_competences: 50,
      ponderation_experience: 25,
      ponderation_formation: 15,
      ponderation_langues: 5,
      ponderation_certifications: 5,
    }));
  };

  async function handle(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handle} className="max-w-3xl space-y-6 pb-20">
      
      {/* SECTION 1: GENERAL INFO */}
      <div className="bg-white border border-border/60 rounded-2xl shadow-sm overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => toggleSection("general")}
          className={`w-full px-6 py-4.5 flex items-center justify-between transition-all border-b border-border/40 border-l-4 ${
            expanded.general
              ? "bg-[#059669]/[0.02] border-l-[#059669]"
              : "bg-white hover:bg-slate-50/50 border-l-transparent"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#059669]/10 text-[#059669]">
              <Briefcase className="h-5 w-5" />
            </div>
            <div className="text-left">
              <h3 className="font-display font-bold text-sm text-foreground">1. Informations générales</h3>
              <p className="text-[10px] text-muted-foreground font-medium">Intitulé, département, type de contrat et localisation</p>
            </div>
          </div>
          <ChevronDown
            className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${
              expanded.general ? "rotate-180" : ""
            }`}
          />
        </button>

        {expanded.general && (
          <div className="p-6 space-y-4 animate-reveal">
            <div>
              <Label htmlFor="titre" className="text-xs font-semibold">Intitulé du poste *</Label>
              <Input
                id="titre"
                required
                placeholder="Ex: Développeur Full-Stack React / Laravel"
                value={form.titre}
                onChange={(e) => setForm({ ...form, titre: e.target.value })}
                className="rounded-xl text-sm mt-1"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="departement" className="text-xs font-semibold">Département / Service *</Label>
                <Input
                  id="departement"
                  required
                  placeholder="Ex: Technique, R&D, RH..."
                  value={form.departement}
                  onChange={(e) => setForm({ ...form, departement: e.target.value })}
                  className="rounded-xl text-sm mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Type de contrat *</Label>
                <Select
                  value={form.contrat}
                  onValueChange={(v) => setForm({ ...form, contrat: v as ContractType })}
                >
                  <SelectTrigger className="rounded-xl text-sm mt-1 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-border shadow-md z-50">
                    {CONTRACT_TYPES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="secteur" className="text-xs font-semibold">Secteur d'activité *</Label>
                <Input
                  id="secteur"
                  required
                  placeholder="Ex: Informatique, Banque, Industrie..."
                  value={form.secteur}
                  onChange={(e) => setForm({ ...form, secteur: e.target.value })}
                  className="rounded-xl text-sm mt-1"
                />
              </div>

              <div>
                <Label htmlFor="localisation" className="text-xs font-semibold">Localisation du poste *</Label>
                <Input
                  id="localisation"
                  required
                  placeholder="Ex: Abidjan, Cocody"
                  value={form.localisation}
                  onChange={(e) => setForm({ ...form, localisation: e.target.value })}
                  className="rounded-xl text-sm mt-1"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: DESCRIPTION & RESPONSIBILITIES */}
      <div className="bg-white border border-border/60 rounded-2xl shadow-sm overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => toggleSection("description")}
          className={`w-full px-6 py-4.5 flex items-center justify-between transition-all border-b border-border/40 border-l-4 ${
            expanded.description
              ? "bg-[#059669]/[0.02] border-l-[#059669]"
              : "bg-white hover:bg-slate-50/50 border-l-transparent"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#059669]/10 text-[#059669]">
              <AlignLeft className="h-5 w-5" />
            </div>
            <div className="text-left">
              <h3 className="font-display font-bold text-sm text-foreground">2. Description & Missions</h3>
              <p className="text-[10px] text-muted-foreground font-medium">Présentation complète du poste et des livrables attendus</p>
            </div>
          </div>
          <ChevronDown
            className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${
              expanded.description ? "rotate-180" : ""
            }`}
          />
        </button>

        {expanded.description && (
          <div className="p-6 space-y-4 animate-reveal">
            <div>
              <Label htmlFor="desc" className="text-xs font-semibold">Description générale du poste *</Label>
              <Textarea
                id="desc"
                rows={4}
                placeholder="Rédigez un résumé accrocheur du poste et du contexte..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="rounded-xl text-sm mt-1"
              />
            </div>
            <div>
              <Label htmlFor="missions_principales" className="text-xs font-semibold">Missions principales</Label>
              <Textarea
                id="missions_principales"
                rows={4}
                placeholder="- Concevoir des architectures logicielles...&#10;- Animer les sprints agiles..."
                value={form.missions_principales}
                onChange={(e) => setForm({ ...form, missions_principales: e.target.value })}
                className="rounded-xl text-sm mt-1"
              />
            </div>
            <div>
              <Label htmlFor="responsabilites" className="text-xs font-semibold">Responsabilités clés</Label>
              <Textarea
                id="responsabilites"
                rows={3}
                placeholder="- Responsabilité de la qualité de la production...&#10;- Mentoring des profils juniors..."
                value={form.responsabilites}
                onChange={(e) => setForm({ ...form, responsabilites: e.target.value })}
                className="rounded-xl text-sm mt-1"
              />
            </div>
            <div>
              <Label htmlFor="objectifs" className="text-xs font-semibold">Objectifs de performance</Label>
              <Textarea
                id="objectifs"
                rows={3}
                placeholder="Ex: Livrer le MVP dans les 3 mois, augmenter la couverture de test de 20%..."
                value={form.objectifs}
                onChange={(e) => setForm({ ...form, objectifs: e.target.value })}
                className="rounded-xl text-sm mt-1"
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: REQUISITES & PROFILE */}
      <div className="bg-white border border-border/60 rounded-2xl shadow-sm overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => toggleSection("profil")}
          className={`w-full px-6 py-4.5 flex items-center justify-between transition-all border-b border-border/40 border-l-4 ${
            expanded.profil
              ? "bg-[#059669]/[0.02] border-l-[#059669]"
              : "bg-white hover:bg-slate-50/50 border-l-transparent"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#059669]/10 text-[#059669]">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="text-left">
              <h3 className="font-display font-bold text-sm text-foreground">3. Profil recherché</h3>
              <p className="text-[10px] text-muted-foreground font-medium">Diplôme, expérience, compétences et langues souhaitées</p>
            </div>
          </div>
          <ChevronDown
            className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${
              expanded.profil ? "rotate-180" : ""
            }`}
          />
        </button>

        {expanded.profil && (
          <div className="p-6 space-y-4 animate-reveal">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Niveau d'études requis *</Label>
                <Select
                  value={form.niveau_etudes_min}
                  onValueChange={(val) => setForm({ ...form, niveau_etudes_min: val })}
                >
                  <SelectTrigger className="rounded-xl text-sm mt-1 h-10">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-border shadow-md z-50">
                    <SelectItem value="Aucun">Aucun diplôme spécifique</SelectItem>
                    <SelectItem value="Bac">Baccalauréat</SelectItem>
                    <SelectItem value="Bac+2">Bac +2 (BTS, DUT)</SelectItem>
                    <SelectItem value="Bac+3">Bac +3 (Licence)</SelectItem>
                    <SelectItem value="Bac+4">Bac +4 (M1)</SelectItem>
                    <SelectItem value="Bac+5">Bac +5 (Master, Diplôme d'ingénieur)</SelectItem>
                    <SelectItem value="Bac+8">Bac +8 (Doctorat)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="experience_min" className="text-xs font-semibold">Expérience minimale (Années) *</Label>
                <Input
                  id="experience_min"
                  type="number"
                  min="0"
                  max="30"
                  value={form.experience_min}
                  onChange={(e) => setForm({ ...form, experience_min: e.target.value })}
                  className="rounded-xl text-sm mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="comp" className="text-xs font-semibold text-foreground">Compétences indispensables * (séparées par des virgules)</Label>
              <Input
                id="comp"
                placeholder="Ex: React, TypeScript, Node.js"
                value={form.competences_requises}
                onChange={(e) => setForm({ ...form, competences_requises: e.target.value })}
                className="rounded-xl text-sm mt-1"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Ces compétences serviront de base d'évaluation éliminatoire/forte pour l'IA.</p>
            </div>

            <div>
              <Label htmlFor="comp_souhaitees" className="text-xs font-semibold text-foreground">Compétences souhaitées / bonus (séparées par des virgules)</Label>
              <Input
                id="comp_souhaitees"
                placeholder="Ex: Laravel, AWS, Docker"
                value={form.competences_souhaitees}
                onChange={(e) => setForm({ ...form, competences_souhaitees: e.target.value })}
                className="rounded-xl text-sm mt-1"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Compétences secondaires valorisées (bonus pour le candidat).</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="certifications" className="text-xs font-semibold text-foreground">Certifications souhaitées</Label>
                <Input
                  id="certifications"
                  placeholder="Ex: AWS Certified, Scrum Master"
                  value={form.certifications_souhaitees}
                  onChange={(e) => setForm({ ...form, certifications_souhaitees: e.target.value })}
                  className="rounded-xl text-sm mt-1"
                />
              </div>

              <div>
                <Label htmlFor="langues" className="text-xs font-semibold text-foreground">Langues souhaitées</Label>
                <Input
                  id="langues"
                  placeholder="Ex: Anglais, Français"
                  value={form.langues_souhaitees}
                  onChange={(e) => setForm({ ...form, langues_souhaitees: e.target.value })}
                  className="rounded-xl text-sm mt-1"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: CONDITIONS & SALARY */}
      <div className="bg-white border border-border/60 rounded-2xl shadow-sm overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => toggleSection("conditions")}
          className={`w-full px-6 py-4.5 flex items-center justify-between transition-all border-b border-border/40 border-l-4 ${
            expanded.conditions
              ? "bg-[#059669]/[0.02] border-l-[#059669]"
              : "bg-white hover:bg-slate-50/50 border-l-transparent"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#059669]/10 text-[#059669]">
              <Clock className="h-5 w-5" />
            </div>
            <div className="text-left">
              <h3 className="font-display font-bold text-sm text-foreground">4. Conditions de travail</h3>
              <p className="text-[10px] text-muted-foreground font-medium">Télétravail, salaire, avantages, horaires et date limite</p>
            </div>
          </div>
          <ChevronDown
            className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${
              expanded.conditions ? "rotate-180" : ""
            }`}
          />
        </button>

        {expanded.conditions && (
          <div className="p-6 space-y-4 animate-reveal">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="teletravail" className="text-xs font-semibold">Télétravail</Label>
                <Select
                  value={form.teletravail}
                  onValueChange={(val) => setForm({ ...form, teletravail: val })}
                >
                  <SelectTrigger className="rounded-xl text-sm mt-1 h-10">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-border shadow-md z-50">
                    <SelectItem value="non">Pas de télétravail (100% Présentiel)</SelectItem>
                    <SelectItem value="partiel">Hybride (Télétravail partiel)</SelectItem>
                    <SelectItem value="oui">100% Télétravail (Full Remote)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date_limite" className="text-xs font-semibold">Date limite de candidature</Label>
                <Input
                  id="date_limite"
                  type="date"
                  value={form.date_limite}
                  onChange={(e) => setForm({ ...form, date_limite: e.target.value })}
                  className="rounded-xl text-sm mt-1"
                />
              </div>

              <div>
                <Label htmlFor="smin" className="text-xs font-semibold">Salaire minimal annuel (€ / an ou FCFA)</Label>
                <Input
                  id="smin"
                  type="number"
                  placeholder="Min"
                  value={form.salaire_min}
                  onChange={(e) => setForm({ ...form, salaire_min: e.target.value })}
                  className="rounded-xl text-sm mt-1"
                />
              </div>

              <div>
                <Label htmlFor="smax" className="text-xs font-semibold">Salaire maximal annuel (€ / an ou FCFA)</Label>
                <Input
                  id="smax"
                  type="number"
                  placeholder="Max"
                  value={form.salaire_max}
                  onChange={(e) => setForm({ ...form, salaire_max: e.target.value })}
                  className="rounded-xl text-sm mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="salaire_texte" className="text-xs font-semibold">Détails sur la rémunération</Label>
              <Input
                id="salaire_texte"
                placeholder="Ex: 800 000 - 1 200 000 FCFA net mensuel selon profil"
                value={form.salaire_texte}
                onChange={(e) => setForm({ ...form, salaire_texte: e.target.value })}
                className="rounded-xl text-sm mt-1"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="avantages" className="text-xs font-semibold">Avantages proposés</Label>
                <Textarea
                  id="avantages"
                  rows={2}
                  placeholder="Ex: Mutuelle santé à 80%, tickets restaurant, intéressement..."
                  value={form.avantages}
                  onChange={(e) => setForm({ ...form, avantages: e.target.value })}
                  className="rounded-xl text-sm mt-1"
                />
              </div>

              <div>
                <Label htmlFor="horaires" className="text-xs font-semibold">Horaires & Temps de travail</Label>
                <Textarea
                  id="horaires"
                  rows={2}
                  placeholder="Ex: 40 heures hebdomadaires, horaires flexibles..."
                  value={form.horaires}
                  onChange={(e) => setForm({ ...form, horaires: e.target.value })}
                  className="rounded-xl text-sm mt-1"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 5: IA WEIGHTS & INTERACTIVE SIMULATOR */}
      <div className="bg-white border border-border/60 rounded-2xl shadow-sm overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => toggleSection("ia")}
          className={`w-full px-6 py-4.5 flex items-center justify-between transition-all border-b border-border/40 border-l-4 ${
            expanded.ia
              ? "bg-[#059669]/[0.02] border-l-[#059669]"
              : "bg-white hover:bg-slate-50/50 border-l-transparent"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#059669]/10 text-[#059669]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="text-left">
              <h3 className="font-display font-bold text-sm text-foreground">5. Paramètres IA & Simulateur</h3>
              <p className="text-[10px] text-muted-foreground font-medium">Ajustement des poids de matching et simulation en temps réel</p>
            </div>
          </div>
          <ChevronDown
            className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${
              expanded.ia ? "rotate-180" : ""
            }`}
          />
        </button>

        {expanded.ia && (
          <div className="p-6 space-y-6 animate-reveal">
            
            {/* Weight Sliders Controls */}
            <div className="space-y-4 bg-slate-50/60 p-4 rounded-xl border border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Pondération des critères de matching</h4>
                  <p className="text-[10px] text-muted-foreground">Déterminez l'importance de chaque catégorie pour le score du candidat.</p>
                </div>
                
                <div className="flex flex-col items-end gap-1.5">
                  <span
                    className={`text-xs font-mono uppercase tracking-widest px-2.5 py-1 rounded-md font-bold ${
                      sumWeights === 100
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800 animate-pulse"
                    }`}
                  >
                    Total : {sumWeights} % / 100 %
                  </span>
                  {sumWeights !== 100 && (
                    <Button type="button" variant="outline" size="sm" onClick={handleAutoBalance} className="h-7 text-[10px] px-2 rounded-lg border-amber-300 text-amber-700 bg-amber-50">
                      Équilibrer à 100%
                    </Button>
                  )}
                </div>
              </div>

              {/* Sliders grid */}
              <div className="space-y-4 pt-2">
                {/* 1. Compétences */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">Compétences techniques</span>
                    <span className="text-foreground">{form.ponderation_competences}%</span>
                  </div>
                  <Slider
                    defaultValue={[form.ponderation_competences]}
                    max={100}
                    step={5}
                    onValueChange={([val]) => setForm((prev) => ({ ...prev, ponderation_competences: val }))}
                  />
                </div>

                {/* 2. Expérience */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">Années d'expérience</span>
                    <span className="text-foreground">{form.ponderation_experience}%</span>
                  </div>
                  <Slider
                    defaultValue={[form.ponderation_experience]}
                    max={100}
                    step={5}
                    onValueChange={([val]) => setForm((prev) => ({ ...prev, ponderation_experience: val }))}
                  />
                </div>

                {/* 3. Formation */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">Niveau d'études</span>
                    <span className="text-foreground">{form.ponderation_formation}%</span>
                  </div>
                  <Slider
                    defaultValue={[form.ponderation_formation]}
                    max={100}
                    step={5}
                    onValueChange={([val]) => setForm((prev) => ({ ...prev, ponderation_formation: val }))}
                  />
                </div>

                {/* 4. Langues */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">Langues maîtrisées</span>
                    <span className="text-foreground">{form.ponderation_langues}%</span>
                  </div>
                  <Slider
                    defaultValue={[form.ponderation_langues]}
                    max={100}
                    step={5}
                    onValueChange={([val]) => setForm((prev) => ({ ...prev, ponderation_langues: val }))}
                  />
                </div>

                {/* 5. Certifications */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">Certifications professionnelles</span>
                    <span className="text-foreground">{form.ponderation_certifications}%</span>
                  </div>
                  <Slider
                    defaultValue={[form.ponderation_certifications]}
                    max={100}
                    step={5}
                    onValueChange={([val]) => setForm((prev) => ({ ...prev, ponderation_certifications: val }))}
                  />
                </div>
              </div>
            </div>

            {/* INTERACTIVE CLIENT-SIDE MATCHING SIMULATOR */}
            <div className="border border-border/80 rounded-xl p-5 bg-card space-y-4 shadow-sm">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Sparkles className="h-5 w-5 text-emerald-600 animate-pulse" />
                <div>
                  <h4 className="text-sm font-bold text-foreground">Simulateur de matching IA (Candidat Test)</h4>
                  <p className="text-[10px] text-muted-foreground">Simulez le profil d'un candidat fictif pour valider vos pondérations de matching.</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 pt-1">
                {/* Simulator Inputs */}
                <div className="space-y-4">
                  {/* Candidate Skills */}
                  <div>
                    <Label className="text-xs font-bold text-muted-foreground">Compétences du candidat test</Label>
                    {[...reqSkills, ...desSkills].length === 0 ? (
                      <p className="text-[10px] text-slate-500 italic mt-1">Saisissez des compétences dans la Section 3 pour les voir apparaître ici.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {[...reqSkills, ...desSkills].map((skill) => {
                          const isChecked = candidateSim.skills.includes(skill);
                          const isReq = reqSkills.includes(skill);
                          return (
                            <button
                              type="button"
                              key={skill}
                              onClick={() => {
                                setCandidateSim((prev) => ({
                                  ...prev,
                                  skills: isChecked
                                    ? prev.skills.filter((s) => s !== skill)
                                    : [...prev.skills, skill],
                                }));
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                                isChecked
                                  ? "bg-emerald-50 border-emerald-500 text-emerald-700 font-semibold"
                                  : "bg-white hover:bg-slate-50 border-border text-slate-600"
                              }`}
                            >
                              {skill} {isReq && <span className="text-[9px] text-[#059669] ml-1">(Requis)</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Candidate Experience Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <Label className="font-bold text-muted-foreground">Expérience professionnelle</Label>
                      <span className="font-semibold text-foreground font-mono">{candidateSim.experience} ans</span>
                    </div>
                    <Slider
                      defaultValue={[candidateSim.experience]}
                      max={15}
                      step={1}
                      onValueChange={([val]) => setCandidateSim((prev) => ({ ...prev, experience: val }))}
                      className="mt-1"
                    />
                    <p className="text-[9px] text-muted-foreground">Expérience requise pour le poste : {minExp} ans.</p>
                  </div>

                  {/* Candidate Education */}
                  <div>
                    <Label htmlFor="cand_edu" className="text-xs font-bold text-muted-foreground">Diplôme du candidat test</Label>
                    <Select
                      value={candidateSim.education}
                      onValueChange={(val) => setCandidateSim((prev) => ({ ...prev, education: val }))}
                    >
                      <SelectTrigger id="cand_edu" className="rounded-lg text-xs h-9 mt-1 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-border shadow-md z-50">
                        <SelectItem value="Aucun">Aucun diplôme</SelectItem>
                        <SelectItem value="Bac">Baccalauréat</SelectItem>
                        <SelectItem value="Bac+2">Bac +2 (BTS, DUT)</SelectItem>
                        <SelectItem value="Bac+3">Bac +3 (Licence)</SelectItem>
                        <SelectItem value="Bac+4">Bac +4</SelectItem>
                        <SelectItem value="Bac+5">Bac +5 (Master / Ingénieur)</SelectItem>
                        <SelectItem value="Bac+8">Bac +8 (Doctorat)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Candidate Languages */}
                  {langs.length > 0 && (
                    <div>
                      <Label className="text-xs font-bold text-muted-foreground">Langues maîtrisées</Label>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {langs.map((lang) => {
                          const isChecked = candidateSim.languages.includes(lang);
                          return (
                            <button
                              type="button"
                              key={lang}
                              onClick={() => {
                                setCandidateSim((prev) => ({
                                  ...prev,
                                  languages: isChecked
                                    ? prev.languages.filter((l) => l !== lang)
                                    : [...prev.languages, lang],
                                }));
                              }}
                              className={`px-2 py-1 rounded-md text-xs border transition-all ${
                                isChecked
                                  ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                                  : "bg-white hover:bg-slate-50 border-border text-slate-600"
                              }`}
                            >
                              {lang}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Candidate Certifications */}
                  {certs.length > 0 && (
                    <div>
                      <Label className="text-xs font-bold text-muted-foreground">Certifications détenues</Label>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {certs.map((cert) => {
                          const isChecked = candidateSim.certifications.includes(cert);
                          return (
                            <button
                              type="button"
                              key={cert}
                              onClick={() => {
                                setCandidateSim((prev) => ({
                                  ...prev,
                                  certifications: isChecked
                                    ? prev.certifications.filter((c) => c !== cert)
                                    : [...prev.certifications, cert],
                                }));
                              }}
                              className={`px-2 py-1 rounded-md text-xs border transition-all ${
                                isChecked
                                  ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                                  : "bg-white hover:bg-slate-50 border-border text-slate-600"
                              }`}
                            >
                              {cert}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Score Output Ring Widget */}
                <div className="flex flex-col items-center justify-center bg-slate-50 p-6 rounded-xl border border-border/80">
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    {/* SVG Progress Circle */}
                    <svg className="absolute w-full h-full transform -rotate-90">
                      <circle
                        cx="72"
                        cy="72"
                        r="60"
                        stroke="#e2e8f0"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      <circle
                        cx="72"
                        cy="72"
                        r="60"
                        stroke="#059669"
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 60}
                        strokeDashoffset={2 * Math.PI * 60 * (1 - finalScore / 100)}
                        className="transition-all duration-500 ease-out"
                      />
                    </svg>
                    <div className="text-center z-10">
                      <span className="text-4xl font-extrabold text-[#059669] font-mono">{finalScore}%</span>
                      <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">Compatibilité</p>
                    </div>
                  </div>

                  {/* Rating diagnosis */}
                  <div className="mt-5 text-center space-y-1">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                      finalScore >= 80
                        ? "bg-emerald-100 text-emerald-800"
                        : finalScore >= 50
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                    }`}>
                      {finalScore >= 80 ? "Excellent profil" : finalScore >= 50 ? "Profil convenable" : "Insuffisant"}
                    </span>
                    <p className="text-[9px] text-muted-foreground pt-1.5">
                      IA Score computed using custom recruiter weightings.
                    </p>
                  </div>

                  {/* Detail Breakdown */}
                  <div className="w-full mt-4 pt-4 border-t border-slate-200 space-y-1.5 text-[10px] text-slate-600">
                    <div className="flex justify-between">
                      <span>Compétences ({wSkills}%):</span>
                      <span className="font-bold">{Math.round(scoreSkills)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expérience ({wExp}%):</span>
                      <span className="font-bold">{Math.round(scoreExp)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Formation ({wEdu}%):</span>
                      <span className="font-bold">{Math.round(scoreEdu)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Langues ({wLang}%):</span>
                      <span className="font-bold">{Math.round(scoreLang)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Certifications ({wCert}%):</span>
                      <span className="font-bold">{Math.round(scoreCert)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STICKY FLOATING ACTION BAR */}
      <div className="sticky bottom-4 z-40 bg-white/90 backdrop-blur-md border border-border/80 p-4 px-6 rounded-2xl shadow-xl flex items-center justify-between gap-4 mt-8 animate-reveal">
        <div className="text-xs text-muted-foreground flex items-center gap-2 font-medium">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" style={{ color: sumWeights === 100 ? '#059669' : '#d97706' }} />
          {sumWeights === 100 ? (
            <span>Pondérations IA : ✓ 100%</span>
          ) : (
            <span className="text-amber-600">Pondérations IA : {sumWeights}% / 100% — Pensez à équilibrer.</span>
          )}
        </div>
        <Button
          type="submit"
          disabled={saving}
          className="bg-[#059669] hover:bg-[#059669]/90 disabled:opacity-50 text-white rounded-xl px-8 shadow-md h-11 text-xs font-semibold"
        >
          {saving ? "Sauvegarde..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

export function serializeOffer(v: OfferFormValues) {
  return {
    titre: v.titre,
    description: v.description,
    contrat: v.contrat,
    secteur: v.secteur || null,
    localisation: v.localisation || null,
    teletravail: v.teletravail || null,
    salaire_min: v.salaire_min ? Number(v.salaire_min) : null,
    salaire_max: v.salaire_max ? Number(v.salaire_max) : null,
    competences_requises: v.competences_requises
      ? v.competences_requises
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],

    // New fields
    departement: v.departement || null,
    missions_principales: v.missions_principales || null,
    responsabilites: v.responsabilites || null,
    objectifs: v.objectifs || null,
    niveau_etudes_min: v.niveau_etudes_min || null,
    experience_min: v.experience_min ? parseInt(v.experience_min, 10) : null,
    competences_souhaitees: v.competences_souhaitees
      ? v.competences_souhaitees
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    certifications_souhaitees: v.certifications_souhaitees
      ? v.certifications_souhaitees
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    langues_souhaitees: v.langues_souhaitees
      ? v.langues_souhaitees
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    date_limite: v.date_limite || null,
    salaire_texte: v.salaire_texte || null,
    avantages: v.avantages || null,
    horaires: v.horaires || null,

    // IA Ponderation mapping
    criteres_ia: {
      ponderation: {
        competences: v.ponderation_competences,
        experience: v.ponderation_experience,
        formation: v.ponderation_formation,
        langues: v.ponderation_langues,
        certifications: v.ponderation_certifications,
      },
    },
  };
}
