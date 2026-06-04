import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { ensureCandidate } from "@/lib/candidate";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  User,
  Briefcase,
  GraduationCap,
  Sparkles,
  Languages,
  Award,
  Heart,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Phone,
  MapPin,
  Calendar as CalendarIcon,
  Globe,
  Clock,
  CircleDollarSign,
  AlertCircle,
  ChevronDown
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/candidat/profil")({
  component: CandidatProfil,
});

type ExperienceItem = {
  id: string;
  poste: string;
  entreprise: string;
  secteur: string;
  ville: string;
  pays: string;
  debut: string;
  fin: string;
  actuel: boolean;
  missions: string;
  resultats: string;
};

type EducationItem = {
  id: string;
  diplome: string;
  etablissement: string;
  specialite: string;
  ville: string;
  pays: string;
  annee: string;
};

type LanguageItem = {
  langue: string;
  niveau: string;
};

type CertificationItem = {
  nom: string;
  organisme: string;
  obtention: string;
  expiration: string;
};

// CSS for modern select dropdown arrow
const SELECT_CLASS = "w-full h-10 px-3 py-2 border border-input bg-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm appearance-none bg-no-repeat bg-[right_0.75rem_center] bg-[length:1.25rem_1.25rem] bg-[image:url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%231d3a6c%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] pr-10 text-foreground shadow-sm hover:border-slate-400 cursor-pointer transition-all";

function CandidatProfil() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Accordion Sections State
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    personal: true,
    professional: false,
    experiences: false,
    formations: false,
    skills: false,
  });

  const toggleSection = (section: string) => {
    setExpanded((prev) => {
      const wasExpanded = prev[section];
      const nextState = {
        personal: false,
        professional: false,
        experiences: false,
        formations: false,
        skills: false,
      };
      nextState[section as keyof typeof nextState] = !wasExpanded;
      return nextState;
    });
  };

  // State: Personal Info
  const [profile, setProfile] = useState({
    prenom: "",
    nom: "",
    telephone: "",
    whatsapp: "",
    email: "",
    ville: "",
    adresse: "",
    date_naissance: "",
    sexe: "",
    nationalite: "",
    permis_conduire: "",
    photo_url: null as string | null,
  });

  // State: Professional Info
  const [candidate, setCandidate] = useState({
    id: "",
    titre: "",
    metier_recherche: "",
    diplome: "",
    bio: "",
    disponibilite: "",
    pretention_salariale: "",
    competences: "", // edited as comma-separated
  });

  // State: Geographic Mobility
  const [mobilite, setMobilite] = useState({
    demenagement: false,
    teletravail: false,
    etranger: false,
  });

  // State: Dynamic lists
  const [experiences, setExperiences] = useState<ExperienceItem[]>([]);
  const [formations, setFormations] = useState<EducationItem[]>([]);
  const [languesList, setLanguesList] = useState<LanguageItem[]>([]);
  const [certificationsList, setCertificationsList] = useState<CertificationItem[]>([]);
  const [interetsList, setInteretsList] = useState<string[]>([]);

  // Sub-forms local states
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [localExp, setLocalExp] = useState<Omit<ExperienceItem, "id">>({
    poste: "",
    entreprise: "",
    secteur: "",
    ville: "",
    pays: "",
    debut: "",
    fin: "",
    actuel: false,
    missions: "",
    resultats: "",
  });

  const [editingEduId, setEditingEduId] = useState<string | null>(null);
  const [localEdu, setLocalEdu] = useState<Omit<EducationItem, "id">>({
    diplome: "",
    etablissement: "",
    specialite: "",
    ville: "",
    pays: "",
    annee: "",
  });

  // Single value list inputs
  const [newSkill, setNewSkill] = useState("");
  const [newLangName, setNewLangName] = useState("");
  const [newLvl, setNewLvl] = useState("Intermédiaire");
  const [newCertName, setNewCertName] = useState("");
  const [newCertOrg, setNewCertOrg] = useState("");
  const [newCertObt, setNewCertObt] = useState("");
  const [newCertExp, setNewCertExp] = useState("");
  const [newInteret, setNewInteret] = useState("");

  async function uploadPhoto(file: File) {
    if (!user) return;
    if (user.id.startsWith("mock-")) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setProfile((p) => ({ ...p, photo_url: result }));
        localStorage.setItem("mock_candidate_photo", result);
        window.dispatchEvent(new Event("profile-updated"));
        toast.success("Photo mise à jour (Mode Démo).");
      };
      reader.readAsDataURL(file);
      return;
    }
    try {
      const ext = file.name.split(".").pop() ?? "png";
      const path = `avatars/${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("company_logos")
        .upload(path, file, { upsert: true });
      if (error) {
        toast.error(error.message);
        return;
      }
      const { data } = supabase.storage.from("company_logos").getPublicUrl(path);
      setProfile((p) => ({ ...p, photo_url: data.publicUrl }));
      window.dispatchEvent(new Event("profile-updated"));
      toast.success("Photo téléversée.");
    } catch (err: any) {
      toast.error(err.message || "Erreur de téléversement");
    }
  }

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        if (user.id.startsWith("mock-")) {
          const { getMockCandidateProfile } = await import("@/lib/mockData");
          const p = getMockCandidateProfile(user.id);
          setProfile({
            prenom: p.prenom || "",
            nom: p.nom || "",
            telephone: p.telephone || "",
            whatsapp: p.whatsapp || "",
            email: p.email || "",
            ville: p.ville || "",
            adresse: p.adresse || "",
            date_naissance: p.date_naissance || "",
            sexe: p.sexe || "",
            nationalite: p.nationalite || "",
            permis_conduire: p.permis_conduire || "",
            photo_url: p.photo_url || null,
          });
          setCandidate({
            id: user.id,
            titre: p.titre || "",
            metier_recherche: p.metier_recherche || "",
            diplome: p.diplome || "",
            bio: p.bio || "",
            disponibilite: p.disponibilite || "",
            pretention_salariale: p.pretention_salariale || "",
            competences: (p.competences || []).join(", "),
          });
          setExperiences(p.experiences || []);
          if ((p as any).formations) {
            setFormations((p as any).formations);
          } else {
            setFormations([
              {
                id: "edu-1",
                diplome: "Master 2 en Management des RH",
                etablissement: "Université Félix Houphouët-Boigny",
                specialite: "Ressources Humaines",
                ville: "Abidjan",
                pays: "Côte d'Ivoire",
                annee: "2018",
              },
            ]);
          }
          setLanguesList(p.langues || []);
          setCertificationsList(p.certifications || []);
          setInteretsList(p.interets || []);
          setMobilite(p.mobilite || { demenagement: false, teletravail: false, etranger: false });
          setLoading(false);
          return;
        }

        const cid = await ensureCandidate(user.id);
        const [{ data: p }, { data: c }] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
          supabase.from("candidates").select("*").eq("id", cid).single(),
        ]);
        if (p) {
          setProfile({
            prenom: p.prenom ?? "",
            nom: p.nom ?? "",
            telephone: p.telephone ?? "",
            whatsapp: (p as any).whatsapp ?? "",
            email: user.email ?? "",
            ville: p.ville ?? "",
            adresse: (p as any).adresse ?? "",
            date_naissance: (p as any).date_naissance ?? "",
            sexe: (p as any).sexe ?? "",
            nationalite: (p as any).nationalite ?? "",
            permis_conduire: (p as any).permis_conduire ?? "",
            photo_url: p.photo_url ?? null,
          });
        }
        if (c) {
          setCandidate({
            id: c.id,
            titre: c.titre ?? "",
            metier_recherche: (c as any).metier_recherche ?? "",
            diplome: c.diplome ?? "",
            bio: c.bio ?? "",
            disponibilite: c.disponibilite ?? "",
            pretention_salariale: c.pretention_salariale ?? "",
            competences: (c.competences ?? []).join(", "),
          });
          setExperiences((c.experiences as ExperienceItem[]) ?? []);
          setFormations(((c as any).formations as EducationItem[]) ?? []);
          setLanguesList((c.langues as LanguageItem[]) ?? []);
          setCertificationsList(((c as any).certifications as CertificationItem[]) ?? []);
          setInteretsList(((c as any).interets as string[]) ?? []);
          setMobilite(
            ((c as any).mobilite as any) ?? { demenagement: false, teletravail: false, etranger: false },
          );
        }
      } catch (err) {
        console.warn("Failed to load profile, using mock fallback:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const competencesArray = candidate.competences
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!profile.prenom || !profile.nom || !profile.telephone || !profile.ville) {
      toast.error("Veuillez remplir vos informations personnelles obligatoires (Nom, Prénom, Téléphone, Ville).");
      return;
    }

    if (!candidate.metier_recherche) {
      toast.error("Le Métier recherché est obligatoire pour être visible des recruteurs.");
      return;
    }

    if (competencesArray.length < 3) {
      toast.error("Veuillez renseigner au moins 3 compétences.");
      return;
    }

    if (user.id.startsWith("mock-")) {
      const { saveMockCandidateProfile } = await import("@/lib/mockData");
      saveMockCandidateProfile({
        userId: user.id,
        prenom: profile.prenom,
        nom: profile.nom,
        telephone: profile.telephone,
        whatsapp: profile.whatsapp,
        email: profile.email,
        date_naissance: profile.date_naissance,
        sexe: profile.sexe,
        nationalite: profile.nationalite,
        ville: profile.ville,
        adresse: profile.adresse,
        permis_conduire: profile.permis_conduire,
        titre: candidate.titre,
        metier_recherche: candidate.metier_recherche,
        diplome: candidate.diplome,
        bio: candidate.bio,
        disponibilite: candidate.disponibilite,
        pretention_salariale: candidate.pretention_salariale,
        competences: competencesArray,
        experiences,
        langues: languesList,
        certifications: certificationsList,
        interets: interetsList,
        mobilite,
        photo_url: profile.photo_url,
        formations,
      } as any);

      window.dispatchEvent(new Event("profile-updated"));
      toast.success("Profil mis à jour (Mode Démo).");
      return;
    }

    setSaving(true);
    try {
      const [{ error: e1 }, { error: e2 }] = await Promise.all([
        supabase.from("profiles").upsert({
          id: user.id,
          nom: profile.nom,
          prenom: profile.prenom,
          telephone: profile.telephone,
          photo_url: profile.photo_url,
          ville: profile.ville,
          whatsapp: profile.whatsapp || null,
          date_naissance: profile.date_naissance || null,
          sexe: profile.sexe || null,
          nationalite: profile.nationalite || null,
          adresse: profile.adresse || null,
          permis_conduire: profile.permis_conduire || null,
        } as any),
        supabase
          .from("candidates")
          .update({
            titre: candidate.titre || null,
            metier_recherche: candidate.metier_recherche || null,
            diplome: candidate.diplome || null,
            bio: candidate.bio || null,
            disponibilite: candidate.disponibilite || null,
            pretention_salariale: candidate.pretention_salariale || null,
            competences: competencesArray,
            experiences: experiences as any,
            formations: formations as any,
            langues: languesList as any,
            certifications: certificationsList as any,
            interets: interetsList,
            mobilite: mobilite as any,
            ville: profile.ville,
          } as any)
          .eq("id", candidate.id),
      ]);
      if (e1 || e2) throw e1 ?? e2;
      toast.success("Profil mis à jour avec succès.");
    } catch (err: any) {
      console.error(err);
      toast.error("Impossible d'enregistrer le profil : " + err.message);
    } finally {
      setSaving(false);
    }
  }

  // Experience handlers
  function handleAddOrUpdateExp() {
    if (!localExp.poste || !localExp.entreprise || !localExp.debut) {
      toast.error("Veuillez renseigner le poste, l'entreprise et la date de début.");
      return;
    }
    if (editingExpId) {
      setExperiences(
        experiences.map((exp) => (exp.id === editingExpId ? { ...localExp, id: editingExpId } : exp)),
      );
      setEditingExpId(null);
      toast.success("Expérience mise à jour.");
    } else {
      const newId = `exp-${Date.now()}`;
      setExperiences([...experiences, { ...localExp, id: newId }]);
      toast.success("Expérience ajoutée.");
    }
    setLocalExp({
      poste: "",
      entreprise: "",
      secteur: "",
      ville: "",
      pays: "",
      debut: "",
      fin: "",
      actuel: false,
      missions: "",
      resultats: "",
    });
  }

  function handleEditExp(exp: ExperienceItem) {
    setEditingExpId(exp.id);
    setLocalExp({
      poste: exp.poste,
      entreprise: exp.entreprise,
      secteur: exp.secteur,
      ville: exp.ville,
      pays: exp.pays,
      debut: exp.debut,
      fin: exp.fin,
      actuel: exp.actuel,
      missions: exp.missions,
      resultats: exp.resultats,
    });
  }

  function handleDeleteExp(id: string) {
    setExperiences(experiences.filter((exp) => exp.id !== id));
    toast.success("Expérience retirée.");
  }

  // Education handlers
  function handleAddOrUpdateEdu() {
    if (!localEdu.diplome || !localEdu.etablissement || !localEdu.annee) {
      toast.error("Veuillez renseigner le diplôme, l'établissement et l'année.");
      return;
    }
    if (editingEduId) {
      setFormations(
        formations.map((edu) => (edu.id === editingEduId ? { ...localEdu, id: editingEduId } : edu)),
      );
      setEditingEduId(null);
      toast.success("Formation mise à jour.");
    } else {
      const newId = `edu-${Date.now()}`;
      setFormations([...formations, { ...localEdu, id: newId }]);
      toast.success("Formation ajoutée.");
    }
    setLocalEdu({
      diplome: "",
      etablissement: "",
      specialite: "",
      ville: "",
      pays: "",
      annee: "",
    });
  }

  function handleEditEdu(edu: EducationItem) {
    setEditingEduId(edu.id);
    setLocalEdu({
      diplome: edu.diplome,
      etablissement: edu.etablissement,
      specialite: edu.specialite,
      ville: edu.ville,
      pays: edu.pays,
      annee: edu.annee,
    });
  }

  function handleDeleteEdu(id: string) {
    setFormations(formations.filter((edu) => edu.id !== id));
    toast.success("Formation retirée.");
  }

  // Tags & single list item actions
  function addSkillTag() {
    if (!newSkill.trim()) return;
    const comps = candidate.competences
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    if (!comps.includes(newSkill.trim())) {
      const updated = [...comps, newSkill.trim()].join(", ");
      setCandidate({ ...candidate, competences: updated });
    }
    setNewSkill("");
  }

  function removeSkillTag(tagToRemove: string) {
    const updated = candidate.competences
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c !== tagToRemove)
      .join(", ");
    setCandidate({ ...candidate, competences: updated });
  }

  function addLanguage() {
    if (!newLangName.trim()) return;
    if (languesList.some((l) => l.langue.toLowerCase() === newLangName.toLowerCase().trim())) {
      toast.error("Langue déjà ajoutée.");
      return;
    }
    setLanguesList([...languesList, { langue: newLangName.trim(), niveau: newLvl }]);
    setNewLangName("");
  }

  function deleteLanguage(lang: string) {
    setLanguesList(languesList.filter((l) => l.langue !== lang));
  }

  function addCertification() {
    if (!newCertName.trim() || !newCertOrg.trim() || !newCertObt.trim()) {
      toast.error("Veuillez remplir le nom, l'organisme et l'année d'obtention.");
      return;
    }
    setCertificationsList([
      ...certificationsList,
      {
        nom: newCertName.trim(),
        organisme: newCertOrg.trim(),
        obtention: newCertObt.trim(),
        expiration: newCertExp.trim(),
      },
    ]);
    setNewCertName("");
    setNewCertOrg("");
    setNewCertObt("");
    setNewCertExp("");
  }

  function deleteCertification(idx: number) {
    setCertificationsList(certificationsList.filter((_, i) => i !== idx));
  }

  function addInteret() {
    if (!newInteret.trim()) return;
    if (!interetsList.includes(newInteret.trim())) {
      setInteretsList([...interetsList, newInteret.trim()]);
    }
    setNewInteret("");
  }

  function deleteInteret(tag: string) {
    setInteretsList(interetsList.filter((t) => t !== tag));
  }

  if (loading)
    return (
      <div className="dash-empty">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">Chargement du CV Builder…</p>
      </div>
    );

  return (
    <div className="space-y-6 pb-24">
      {/* ── Hero Header ─────────────────────────────────────────────────── */}
      <div className="page-hero page-hero-candidat animate-reveal">
        <div
          className="page-hero-blob"
          style={{ width: 280, height: 280, background: "#2A5298", top: -100, right: -60 }}
        />
        <div
          className="page-hero-blob"
          style={{ width: 160, height: 160, background: "#93C5FD", bottom: -60, left: 60 }}
        />
        <div className="hero-content">
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/60">
            Mon Espace
          </span>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white">Mon CV Builder</h1>
          <p className="text-white/70 text-xs mt-1">
            Gérez vos informations de manière structurée pour optimiser la visibilité auprès des recruteurs.
          </p>
        </div>
      </div>


      <form onSubmit={onSave} className="space-y-6 max-w-4xl">
        {/* SECTION 1: PERSONAL INFO */}
        <div className="bg-white border border-border/60 rounded-2xl shadow-sm overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => toggleSection("personal")}
            className={`w-full px-6 py-5 flex items-center justify-between transition-all border-b border-border/40 border-l-4 ${
              expanded.personal
                ? "bg-slate-50 border-l-primary"
                : "bg-white hover:bg-slate-50/50 border-l-transparent"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <User className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h3 className="font-display font-bold text-sm text-foreground">Informations personnelles</h3>
                <p className="text-[10px] text-muted-foreground font-medium">Identité, contacts et coordonnées de base</p>
              </div>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${
                expanded.personal ? "rotate-180" : ""
              }`}
            />
          </button>

          {expanded.personal && (
            <div className="p-8 space-y-6 animate-reveal">
              <div className="flex flex-wrap items-center gap-5 border-b border-border pb-5">
                <div className="w-20 h-20 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/15 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                  {profile.photo_url ? (
                    <img
                      src={profile.photo_url}
                      alt="Photo de profil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl">👤</span>
                  )}
                </div>
                <div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                    className="rounded-xl border-primary/20 text-primary hover:bg-primary/5 text-xs"
                  >
                    Téléverser une photo
                  </Button>
                  <p className="text-[10px] text-muted-foreground mt-1.5">PNG, JPG. Max 2 Mo conseillé.</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="grid gap-1.5">
                  <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    Prénom *
                  </Label>
                  <Input
                    required
                    value={profile.prenom}
                    onChange={(e) => setProfile({ ...profile, prenom: e.target.value })}
                    className="rounded-xl text-sm"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    Nom *
                  </Label>
                  <Input
                    required
                    value={profile.nom}
                    onChange={(e) => setProfile({ ...profile, nom: e.target.value })}
                    className="rounded-xl text-sm"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    Téléphone *
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      required
                      value={profile.telephone}
                      onChange={(e) => setProfile({ ...profile, telephone: e.target.value })}
                      className="rounded-xl pl-9 text-sm"
                    />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    WhatsApp
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                    <Input
                      placeholder="+225 07..."
                      value={profile.whatsapp}
                      onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
                      className="rounded-xl pl-9 text-sm"
                    />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    Email de contact *
                  </Label>
                  <Input
                    disabled
                    value={profile.email}
                    className="rounded-xl bg-slate-50 text-sm cursor-not-allowed opacity-80"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    Ville de résidence *
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      required
                      value={profile.ville}
                      onChange={(e) => setProfile({ ...profile, ville: e.target.value })}
                      className="rounded-xl pl-9 text-sm"
                    />
                  </div>
                </div>
                <div className="grid gap-1.5 sm:col-span-2">
                  <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    Adresse complète
                  </Label>
                  <Input
                    placeholder="Rue, Quartier..."
                    value={profile.adresse}
                    onChange={(e) => setProfile({ ...profile, adresse: e.target.value })}
                    className="rounded-xl text-sm"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    Date de naissance
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        type="button"
                        className={cn(
                          "w-full justify-start text-left font-normal rounded-xl h-10 border-input bg-background shadow-sm hover:border-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm pl-3",
                          !profile.date_naissance && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                        {profile.date_naissance ? (
                          format(parseISO(profile.date_naissance), "d MMMM yyyy", { locale: fr })
                        ) : (
                          <span>Sélectionner une date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl border border-border shadow-xl bg-white z-50" align="start">
                      <Calendar
                        mode="single"
                        selected={profile.date_naissance ? parseISO(profile.date_naissance) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const yyyy = date.getFullYear();
                            const mm = String(date.getMonth() + 1).padStart(2, '0');
                            const dd = String(date.getDate()).padStart(2, '0');
                            setProfile({ ...profile, date_naissance: `${yyyy}-${mm}-${dd}` });
                          } else {
                            setProfile({ ...profile, date_naissance: "" });
                          }
                        }}
                        captionLayout="dropdown"
                        startMonth={new Date(1940, 0)}
                        endMonth={new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    Sexe
                  </Label>
                  <Select
                    value={profile.sexe || "none"}
                    onValueChange={(val) => setProfile({ ...profile, sexe: val === "none" ? "" : val })}
                  >
                    <SelectTrigger className="rounded-xl border-input bg-background shadow-sm hover:border-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary h-10 text-sm">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border bg-white shadow-md z-50">
                      <SelectItem value="none">Sélectionner</SelectItem>
                      <SelectItem value="M">Masculin</SelectItem>
                      <SelectItem value="F">Féminin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    Nationalité
                  </Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Ivoirienne..."
                      value={profile.nationalite}
                      onChange={(e) => setProfile({ ...profile, nationalite: e.target.value })}
                      className="rounded-xl pl-9 text-sm"
                    />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    Permis de conduire
                  </Label>
                  <Input
                    placeholder="Oui (Catégorie B), Non..."
                    value={profile.permis_conduire}
                    onChange={(e) => setProfile({ ...profile, permis_conduire: e.target.value })}
                    className="rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: PROFESSIONAL PROFILE */}
        <div className="bg-white border border-border/60 rounded-2xl shadow-sm overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => toggleSection("professional")}
            className={`w-full px-6 py-5 flex items-center justify-between transition-all border-b border-border/40 border-l-4 ${
              expanded.professional
                ? "bg-slate-50 border-l-primary"
                : "bg-white hover:bg-slate-50/50 border-l-transparent"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Briefcase className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h3 className="font-display font-bold text-sm text-foreground">Profil professionnel</h3>
                <p className="text-[10px] text-muted-foreground font-medium">Métier recherché, salaire, mobilité et résumé</p>
              </div>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${
                expanded.professional ? "rotate-180" : ""
              }`}
            />
          </button>

          {expanded.professional && (
            <div className="p-8 space-y-6 animate-reveal">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="grid gap-1.5">
                  <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    Métier recherché * (Très important pour les recruteurs)
                  </Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      required
                      placeholder="Ex: Développeur Full Stack, Comptable..."
                      value={candidate.metier_recherche}
                      onChange={(e) => setCandidate({ ...candidate, metier_recherche: e.target.value })}
                      className="rounded-xl pl-9 text-sm"
                    />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    Titre professionnel actuel / recherché
                  </Label>
                  <Input
                    placeholder="Ex: Développeur React senior"
                    value={candidate.titre}
                    onChange={(e) => setCandidate({ ...candidate, titre: e.target.value })}
                    className="rounded-xl text-sm"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    Disponibilité
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                    <Select
                      value={candidate.disponibilite || "none"}
                      onValueChange={(val) => setCandidate({ ...candidate, disponibilite: val === "none" ? "" : val })}
                    >
                      <SelectTrigger className="pl-9 rounded-xl border-input bg-background shadow-sm hover:border-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary h-10 text-sm">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border bg-white shadow-md z-50">
                        <SelectItem value="none">Sélectionner</SelectItem>
                        <SelectItem value="Immédiate">Immédiate</SelectItem>
                        <SelectItem value="Sous 15 jours">Sous 15 jours</SelectItem>
                        <SelectItem value="Sous 1 mois">Sous 1 mois</SelectItem>
                        <SelectItem value="Plus d'un mois">Plus d'un mois</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    Prétention salariale
                  </Label>
                  <div className="relative">
                    <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Ex: 800k - 1M FCFA"
                      value={candidate.pretention_salariale}
                      onChange={(e) => setCandidate({ ...candidate, pretention_salariale: e.target.value })}
                      className="rounded-xl pl-9 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  Mobilité géographique & Télétravail
                </Label>
                <div className="grid grid-cols-3 gap-3 p-3 border border-border bg-[#f8fafc] rounded-xl">
                  <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground cursor-pointer select-none">
                    <Checkbox
                      checked={mobilite.demenagement}
                      onCheckedChange={(checked) => setMobilite({ ...mobilite, demenagement: !!checked })}
                    />
                    Déménagement
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground cursor-pointer select-none">
                    <Checkbox
                      checked={mobilite.teletravail}
                      onCheckedChange={(checked) => setMobilite({ ...mobilite, teletravail: !!checked })}
                    />
                    Télétravail
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground cursor-pointer select-none">
                    <Checkbox
                      checked={mobilite.etranger}
                      onCheckedChange={(checked) => setMobilite({ ...mobilite, etranger: !!checked })}
                    />
                    Étranger
                  </label>
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  Résumé professionnel / Bio (Très important pour les recruteurs)
                </Label>
                <Textarea
                  rows={5}
                  placeholder="Décrivez brièvement votre parcours et vos aspirations..."
                  value={candidate.bio}
                  onChange={(e) => setCandidate({ ...candidate, bio: e.target.value })}
                  className="rounded-xl text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: WORK EXPERIENCES */}
        <div className="bg-white border border-border/60 rounded-2xl shadow-sm overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => toggleSection("experiences")}
            className={`w-full px-6 py-5 flex items-center justify-between transition-all border-b border-border/40 border-l-4 ${
              expanded.experiences
                ? "bg-slate-50 border-l-primary"
                : "bg-white hover:bg-slate-50/50 border-l-transparent"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Briefcase className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h3 className="font-display font-bold text-sm text-foreground">Expériences professionnelles</h3>
                <p className="text-[10px] text-muted-foreground font-medium">Historique de vos postes et réalisations</p>
              </div>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${
                expanded.experiences ? "rotate-180" : ""
              }`}
            />
          </button>

          {expanded.experiences && (
            <div className="p-8 space-y-6 animate-reveal">
              {/* Experience list */}
              {experiences.length > 0 && (
                <div className="grid gap-3">
                  {experiences.map((exp) => (
                    <div
                      key={exp.id}
                      className="bg-white border border-border/85 rounded-2xl p-4 flex items-start justify-between shadow-sm"
                    >
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-foreground">{exp.poste}</h4>
                        <p className="text-xs text-primary font-semibold">
                          {exp.entreprise} · {exp.secteur}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {exp.debut} - {exp.actuel ? "Aujourd'hui" : exp.fin} · {exp.ville}, {exp.pays}
                        </p>
                        {exp.missions && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {exp.missions}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1.5 shrink-0 ml-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditExp(exp)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteExp(exp.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/5"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Experience Form Card */}
              <div className="bg-slate-50/50 border border-border/60 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <h4 className="font-bold text-xs text-foreground">
                    {editingExpId ? "Modifier l'expérience" : "Ajouter une expérience"}
                  </h4>
                  {editingExpId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingExpId(null);
                        setLocalExp({
                          poste: "",
                          entreprise: "",
                          secteur: "",
                          ville: "",
                          pays: "",
                          debut: "",
                          fin: "",
                          actuel: false,
                          missions: "",
                          resultats: "",
                        });
                      }}
                      className="text-[10px] text-muted-foreground hover:text-foreground font-bold"
                    >
                      Annuler
                    </button>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Poste occupé *</Label>
                    <Input
                      placeholder="Ex: Développeur Web"
                      value={localExp.poste}
                      onChange={(e) => setLocalExp({ ...localExp, poste: e.target.value })}
                      className="rounded-xl text-sm"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Entreprise *</Label>
                    <Input
                      placeholder="Ex: XYZ SARL"
                      value={localExp.entreprise}
                      onChange={(e) => setLocalExp({ ...localExp, entreprise: e.target.value })}
                      className="rounded-xl text-sm"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Secteur d'activité</Label>
                    <Input
                      placeholder="Ex: Technologie, Informatique"
                      value={localExp.secteur}
                      onChange={(e) => setLocalExp({ ...localExp, secteur: e.target.value })}
                      className="rounded-xl text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Ville</Label>
                      <Input
                        value={localExp.ville}
                        onChange={(e) => setLocalExp({ ...localExp, ville: e.target.value })}
                        className="rounded-xl text-sm"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Pays</Label>
                      <Input
                        value={localExp.pays}
                        onChange={(e) => setLocalExp({ ...localExp, pays: e.target.value })}
                        className="rounded-xl text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Date de début *</Label>
                    <Input
                      type="month"
                      value={localExp.debut}
                      onChange={(e) => setLocalExp({ ...localExp, debut: e.target.value })}
                      className="rounded-xl text-sm"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Date de fin</Label>
                    <Input
                      type="month"
                      disabled={localExp.actuel}
                      value={localExp.actuel ? "" : localExp.fin}
                      onChange={(e) => setLocalExp({ ...localExp, fin: e.target.value })}
                      className="rounded-xl text-sm disabled:opacity-50"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-2 py-1 select-none">
                    <Checkbox
                      id="actuel"
                      checked={localExp.actuel}
                      onCheckedChange={(checked) => setLocalExp({ ...localExp, actuel: !!checked })}
                    />
                    <label htmlFor="actuel" className="text-xs font-semibold text-muted-foreground cursor-pointer">
                      Je travaille actuellement dans ce poste
                    </label>
                  </div>
                  <div className="grid gap-1.5 sm:col-span-2">
                    <Label className="text-xs">Missions réalisées</Label>
                    <Textarea
                      rows={3}
                      placeholder="Ex: Développement d'applications, Maintenance..."
                      value={localExp.missions}
                      onChange={(e) => setLocalExp({ ...localExp, missions: e.target.value })}
                      className="rounded-xl text-sm"
                    />
                  </div>
                  <div className="grid gap-1.5 sm:col-span-2">
                    <Label className="text-xs">Résultats obtenus</Label>
                    <Input
                      placeholder="Ex: Amélioration du temps de réponse de 15%..."
                      value={localExp.resultats}
                      onChange={(e) => setLocalExp({ ...localExp, resultats: e.target.value })}
                      className="rounded-xl text-sm"
                    />
                  </div>
                </div>
                <div className="pt-2 flex justify-end">
                  <Button
                    type="button"
                    onClick={handleAddOrUpdateExp}
                    className="rounded-xl flex items-center gap-1.5 text-xs px-4"
                  >
                    <Plus className="h-4 w-4" />
                    {editingExpId ? "Mettre à jour" : "Ajouter l'expérience"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: EDUCATIONS */}
        <div className="bg-white border border-border/60 rounded-2xl shadow-sm overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => toggleSection("formations")}
            className={`w-full px-6 py-4 flex items-center justify-between transition-all border-b border-border/40 border-l-4 ${
              expanded.formations
                ? "bg-slate-50 border-l-primary"
                : "bg-white hover:bg-slate-50/50 border-l-transparent"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h3 className="font-display font-bold text-sm text-foreground">Formations & Diplômes</h3>
                <p className="text-[10px] text-muted-foreground font-medium">Votre cursus d'études et diplômes obtenus</p>
              </div>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${
                expanded.formations ? "rotate-180" : ""
              }`}
            />
          </button>

          {expanded.formations && (
            <div className="p-6 space-y-6 animate-reveal">
              {/* Educations list */}
              {formations.length > 0 && (
                <div className="grid gap-3">
                  {formations.map((edu) => (
                    <div
                      key={edu.id}
                      className="bg-white border border-border/80 rounded-2xl p-4 flex items-start justify-between shadow-sm"
                    >
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-foreground">{edu.diplome}</h4>
                        <p className="text-xs text-primary font-semibold">
                          {edu.etablissement} {edu.specialite ? `· ${edu.specialite}` : ""}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          Année d'obtention : {edu.annee} · {edu.ville}, {edu.pays}
                        </p>
                      </div>
                      <div className="flex gap-1.5 shrink-0 ml-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditEdu(edu)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEdu(edu.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/5"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Education Form Card */}
              <div className="bg-slate-50/50 border border-border/60 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <h4 className="font-bold text-xs text-foreground">
                    {editingEduId ? "Modifier le diplôme" : "Ajouter une formation"}
                  </h4>
                  {editingEduId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEduId(null);
                        setLocalEdu({
                          diplome: "",
                          etablissement: "",
                          specialite: "",
                          ville: "",
                          pays: "",
                          annee: "",
                        });
                      }}
                      className="text-[10px] text-muted-foreground hover:text-foreground font-bold"
                    >
                      Annuler
                    </button>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Diplôme *</Label>
                    <Input
                      placeholder="Ex: Master Informatique"
                      value={localEdu.diplome}
                      onChange={(e) => setLocalEdu({ ...localEdu, diplome: e.target.value })}
                      className="rounded-xl text-sm"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Établissement d'études *</Label>
                    <Input
                      placeholder="Ex: Université Félix Houphouët-Boigny"
                      value={localEdu.etablissement}
                      onChange={(e) => setLocalEdu({ ...localEdu, etablissement: e.target.value })}
                      className="rounded-xl text-sm"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Spécialité / Option</Label>
                    <Input
                      placeholder="Ex: Réseaux, Management, Comptabilité..."
                      value={localEdu.specialite}
                      onChange={(e) => setLocalEdu({ ...localEdu, specialite: e.target.value })}
                      className="rounded-xl text-sm"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Année d'obtention *</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 2024"
                      value={localEdu.annee}
                      onChange={(e) => setLocalEdu({ ...localEdu, annee: e.target.value })}
                      className="rounded-xl text-sm"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Ville</Label>
                    <Input
                      value={localEdu.ville}
                      onChange={(e) => setLocalEdu({ ...localEdu, ville: e.target.value })}
                      className="rounded-xl text-sm"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Pays</Label>
                    <Input
                      value={localEdu.pays}
                      onChange={(e) => setLocalEdu({ ...localEdu, pays: e.target.value })}
                      className="rounded-xl text-sm"
                    />
                  </div>
                </div>
                <div className="pt-2 flex justify-end">
                  <Button
                    type="button"
                    onClick={handleAddOrUpdateEdu}
                    className="rounded-xl flex items-center gap-1.5 text-xs px-4"
                  >
                    <Plus className="h-4 w-4" />
                    {editingEduId ? "Mettre à jour" : "Ajouter aux formations"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 5: SKILLS, LANGUAGES & CERTIFICATIONS */}
        <div className="bg-white border border-border/60 rounded-2xl shadow-sm overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => toggleSection("skills")}
            className={`w-full px-6 py-4 flex items-center justify-between transition-all border-b border-border/40 border-l-4 ${
              expanded.skills
                ? "bg-slate-50 border-l-primary"
                : "bg-white hover:bg-slate-50/50 border-l-transparent"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h3 className="font-display font-bold text-sm text-foreground">Compétences & Langues</h3>
                <p className="text-[10px] text-muted-foreground font-medium">Techniques, soft skills, langues et certifications</p>
              </div>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${
                expanded.skills ? "rotate-180" : ""
              }`}
            />
          </button>

          {expanded.skills && (
            <div className="p-6 space-y-6 animate-reveal">
              {/* Skills Sub-Card */}
              <div className="border-b border-slate-100 pb-5 space-y-3">
                <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block">
                  Compétences techniques * (Au moins 3)
                </Label>
                <div className="flex gap-2 max-w-md">
                  <Input
                    placeholder="Ex: React, Laravel, Excel..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkillTag())}
                    className="rounded-xl text-sm"
                  />
                  <Button type="button" onClick={addSkillTag} className="rounded-xl text-xs">
                    Ajouter
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {candidate.competences
                    .split(",")
                    .map((c) => c.trim())
                    .filter(Boolean)
                    .map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold shadow-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeSkillTag(tag)}
                          className="hover:text-destructive font-black text-[10px]"
                        >
                          <X className="h-3 w-3 shrink-0" />
                        </button>
                      </span>
                    ))}
                </div>
              </div>

              {/* Languages Sub-Card */}
              <div className="border-b border-slate-100 pb-5 space-y-3">
                <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block">
                  Langues
                </Label>
                <div className="grid sm:grid-cols-3 gap-3 items-end max-w-xl">
                  <div className="grid gap-1">
                    <Label className="text-[10px] text-muted-foreground">Langue</Label>
                    <Input
                      placeholder="Ex: Anglais, Allemand"
                      value={newLangName}
                      onChange={(e) => setNewLangName(e.target.value)}
                      className="rounded-xl text-sm"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[10px] text-muted-foreground">Niveau</Label>
                    <Select value={newLvl} onValueChange={setNewLvl}>
                      <SelectTrigger className="rounded-xl border-input bg-background shadow-sm hover:border-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary h-10 text-sm">
                        <SelectValue placeholder="Niveau" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border bg-white shadow-md z-50">
                        <SelectItem value="Débutant">Débutant</SelectItem>
                        <SelectItem value="Intermédiaire">Intermédiaire</SelectItem>
                        <SelectItem value="Courant">Courant</SelectItem>
                        <SelectItem value="Langue Maternelle">Langue Maternelle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="button" onClick={addLanguage} className="rounded-xl text-xs h-10">
                    Ajouter
                  </Button>
                </div>
                {languesList.length > 0 && (
                  <div className="grid gap-2 pt-2 max-w-md">
                    {languesList.map((l) => (
                      <div
                        key={l.langue}
                        className="flex items-center justify-between p-2 py-1.5 border border-border bg-slate-50 rounded-xl px-3"
                      >
                        <div className="text-xs font-semibold text-foreground">
                          {l.langue} : <span className="text-primary">{l.niveau}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteLanguage(l.langue)}
                          className="text-destructive hover:text-red-700 transition-colors p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Certifications Sub-Card */}
              <div className="border-b border-slate-100 pb-5 space-y-3">
                <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block">
                  Certifications
                </Label>
                <div className="grid sm:grid-cols-4 gap-3 items-end">
                  <div className="grid gap-1">
                    <Label className="text-[10px] text-muted-foreground">Certification</Label>
                    <Input
                      placeholder="Ex: Scrum Master"
                      value={newCertName}
                      onChange={(e) => setNewCertName(e.target.value)}
                      className="rounded-xl text-sm"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[10px] text-muted-foreground">Organisme</Label>
                    <Input
                      placeholder="Ex: Scrum.org"
                      value={newCertOrg}
                      onChange={(e) => setNewCertOrg(e.target.value)}
                      className="rounded-xl text-sm"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[10px] text-muted-foreground">Année d'obtention</Label>
                    <Input
                      placeholder="Ex: 2024"
                      value={newCertObt}
                      onChange={(e) => setNewCertObt(e.target.value)}
                      className="rounded-xl text-sm"
                    />
                  </div>
                  <Button type="button" onClick={addCertification} className="rounded-xl text-xs h-10">
                    Ajouter
                  </Button>
                </div>
                {certificationsList.length > 0 && (
                  <div className="grid gap-2 pt-2 max-w-xl">
                    {certificationsList.map((c, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 py-1.5 border border-border bg-slate-50 rounded-xl px-3"
                      >
                        <div className="text-xs font-semibold text-foreground">
                          {c.nom} (délivrée par <span className="text-primary">{c.organisme}</span> en{" "}
                          {c.obtention})
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteCertification(idx)}
                          className="text-destructive hover:text-red-700 transition-colors p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Hobbies Sub-Card */}
              <div className="space-y-3">
                <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block">
                  Centres d'intérêt
                </Label>
                <div className="flex gap-2 max-w-md">
                  <Input
                    placeholder="Ex: Sport, Musique, Bénévolat..."
                    value={newInteret}
                    onChange={(e) => setNewInteret(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInteret())}
                    className="rounded-xl text-sm"
                  />
                  <Button type="button" onClick={addInteret} className="rounded-xl text-xs">
                    Ajouter
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {interetsList.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => deleteInteret(tag)}
                        className="hover:text-destructive font-black text-[10px]"
                      >
                        <X className="h-3 w-3 shrink-0" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions Bar at the bottom of the form in normal flow to avoid overlapping inputs */}
        <div className="bg-white border border-border/60 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm mt-6">
          <div className="text-xs text-muted-foreground flex items-center gap-2 font-medium">
            <AlertCircle className="h-4.5 w-4.5 text-primary shrink-0" />
            N'oubliez pas de sauvegarder vos modifications globales
          </div>
          <Button type="submit" disabled={saving} className="rounded-xl px-8 shadow-md w-full sm:w-auto h-11">
            {saving ? "Sauvegarde en cours…" : "Enregistrer les modifications"}
          </Button>
        </div>
      </form>
    </div>
  );
}
