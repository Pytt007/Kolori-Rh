import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/site/AuthShell";
import { ensureCandidate } from "@/lib/candidate";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
  Clock,
  CircleDollarSign,
  AlignLeft,
  Eye,
  EyeOff,
  Upload,
  Check,
  FileText,
  AlertCircle,
  Languages,
  Award,
  Heart,
  Globe
} from "lucide-react";

export const Route = createFileRoute("/inscription/candidat")({
  head: () => ({
    meta: [
      { title: "Inscription Candidat — Kolori RH" },
      { name: "description", content: "Créez votre compte candidat sur Kolori RH pour postuler aux offres." },
    ],
  }),
  component: InscriptionCandidatPage,
});

function InscriptionCandidatPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);

  // File states
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [cvFile, setCvFile] = useState<File | null>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  // Form states - Step 1 (Obligatoire)
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [telephone, setTelephone] = useState("");
  const [ville, setVille] = useState("");
  const [metierRecherche, setMetierRecherche] = useState("");

  // Form states - Step 2 (Recommandé)
  const [titre, setTitre] = useState("");
  const [diplome, setDiplome] = useState("");
  const [competences, setCompetences] = useState("");
  const [disponibilite, setDisponibilite] = useState("");

  // Form states - Step 3 (Optionnel)
  const [pretentionSalariale, setPretentionSalariale] = useState("");
  const [bio, setBio] = useState("");
  const [langues, setLangues] = useState("");
  const [certifications, setCertifications] = useState("");
  const [interets, setInterets] = useState("");
  const [mobiliteDemenagement, setMobiliteDemenagement] = useState(false);
  const [mobiliteTeletravail, setMobiliteTeletravail] = useState(false);
  const [mobiliteEtranger, setMobiliteEtranger] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("L'image est trop grande (2 Mo maximum).");
        return;
      }
      setPhotoFile(file);
      setPhotoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Le fichier est trop grand (5 Mo maximum).");
        return;
      }
      if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
        toast.error("Format de fichier non supporté. Veuillez téléverser un PDF.");
        return;
      }
      setCvFile(file);
    }
  };

  const handleStep1Next = (e: FormEvent) => {
    e.preventDefault();
    if (!prenom || !nom || !email || !password || !telephone || !ville || !metierRecherche) {
      toast.error("Veuillez remplir tous les champs obligatoires de l'étape 1.");
      return;
    }
    if (password.length < 8) {
      toast.error("Mot de passe trop court (8 caractères minimum).");
      return;
    }
    if (!cvFile) {
      toast.warning("Le CV au format PDF est fortement recommandé pour attirer les recruteurs.");
    }
    setStep(2);
  };

  const handleStep2Next = (e: FormEvent) => {
    e.preventDefault();
    // Validate competencies has at least 3 skills if they want to proceed normally
    const skillCount = competences
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean).length;
    if (skillCount > 0 && skillCount < 3) {
      toast.error("Veuillez saisir au moins 3 compétences ou laisser le champ vide.");
      return;
    }
    setStep(3);
  };

  const handleSubmit = async (e?: FormEvent, targetStep?: number) => {
    if (e) e.preventDefault();
    const activeStep = targetStep ?? step;
    setBusy(true);

    try {
      // 1. Convert photo to Base64
      let pendingPhotoBase64: string | null = null;
      if (activeStep === 3 && photoFile) {
        pendingPhotoBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(photoFile);
        });
      }

      // Convert CV to Base64 for local storage mock fallback
      let pendingCvBase64: string | null = null;
      if (cvFile) {
        pendingCvBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(cvFile);
        });
      }

      // 2. Prepare competences array
      const competencesArray =
        activeStep >= 2 && competences
          ? competences
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];

      // Prepare metadata languages and certifications lists
      const languagesArray =
        activeStep === 3 && langues
          ? langues
              .split(",")
              .map((l) => {
                const parts = l.split(":");
                return {
                  langue: parts[0]?.trim() || l.trim(),
                  niveau: parts[1]?.trim() || "Intermédiaire",
                };
              })
              .filter(Boolean)
          : [];

      const certificationsArray =
        activeStep === 3 && certifications
          ? certifications
              .split(",")
              .map((c) => {
                const parts = c.split(":");
                return {
                  nom: parts[0]?.trim() || c.trim(),
                  organisme: parts[1]?.trim() || "Inconnu",
                  obtention: "2025",
                };
              })
              .filter(Boolean)
          : [];

      const interetsArray =
        activeStep === 3 && interets
          ? interets
              .split(",")
              .map((i) => i.trim())
              .filter(Boolean)
          : [];

      // 3. SignUp user
      const signUpMetadata = {
        prenom,
        nom,
        role: "candidat",
        telephone,
        ville,
        metier_recherche: metierRecherche,
        // Step 2
        titre: activeStep >= 2 ? titre : "",
        diplome: activeStep >= 2 ? diplome : "",
        competences: competencesArray,
        disponibilite: activeStep >= 2 ? disponibilite : "",
        // Step 3
        pretention_salariale: activeStep === 3 ? pretentionSalariale : "",
        bio: activeStep === 3 ? bio : "",
        langues: languagesArray,
        certifications: certificationsArray,
        interets: interetsArray,
        mobilite: {
          demenagement: activeStep === 3 ? mobiliteDemenagement : false,
          teletravail: activeStep === 3 ? mobiliteTeletravail : false,
          etranger: activeStep === 3 ? mobiliteEtranger : false,
        },
      };

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/connexion`,
          data: signUpMetadata,
        },
      });

      if (error) throw error;

      // Local storage cache in case confirmation is required
      if (pendingPhotoBase64) {
        localStorage.setItem("signup_pending_photo", pendingPhotoBase64);
      }
      if (pendingCvBase64) {
        localStorage.setItem("signup_pending_cv", pendingCvBase64);
        localStorage.setItem("signup_pending_cv_name", cvFile?.name || "CV.pdf");
      }

      // If logged in immediately (mock mode or email confirmation disabled)
      if (data?.session && data.user) {
        const userId = data.user.id;

        // Upload photo
        let publicPhotoUrl = null;
        if (activeStep === 3 && photoFile) {
          try {
            const ext = photoFile.name.split(".").pop() ?? "png";
            const path = `avatars/${userId}/${Date.now()}.${ext}`;
            const { error: uploadErr } = await supabase.storage
              .from("company_logos")
              .upload(path, photoFile, { upsert: true });

            if (!uploadErr) {
              const { data: publicUrlData } = supabase.storage
                .from("company_logos")
                .getPublicUrl(path);
              publicPhotoUrl = publicUrlData.publicUrl;
              localStorage.removeItem("signup_pending_photo");
            }
          } catch (uploadErr) {
            console.error("Erreur de téléversement photo:", uploadErr);
          }
        }

        // Update profile
        await supabase
          .from("profiles")
          .update({
            telephone,
            ville,
            photo_url: publicPhotoUrl,
            whatsapp: telephone,
          })
          .eq("id", userId);

        // Ensure candidate row exists
        const cid = await ensureCandidate(userId);

        // Update candidate details
        await supabase
          .from("candidates")
          .update({
            titre: activeStep >= 2 ? titre : null,
            metier_recherche: metierRecherche,
            diplome: activeStep >= 2 ? diplome : null,
            competences: competencesArray,
            disponibilite: activeStep >= 2 ? disponibilite : null,
            pretention_salariale: activeStep === 3 ? pretentionSalariale : null,
            bio: activeStep === 3 ? bio : null,
            ville,
            langues: languagesArray,
            certifications: certificationsArray,
            interets: interetsArray,
            mobilite: {
              demenagement: activeStep === 3 ? mobiliteDemenagement : false,
              teletravail: activeStep === 3 ? mobiliteTeletravail : false,
              etranger: activeStep === 3 ? mobiliteEtranger : false,
            },
          })
          .eq("id", cid);

        // Upload CV
        if (cvFile) {
          try {
            const ext = cvFile.name.split(".").pop() ?? "pdf";
            const path = `${userId}/${Date.now()}-${cvFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
            const { error: cvUploadErr } = await supabase.storage
              .from("cvs")
              .upload(path, cvFile, { upsert: false });
            if (!cvUploadErr) {
              await supabase.from("cv_documents").insert({
                candidate_id: cid,
                nom_fichier: cvFile.name,
                storage_path: path,
                taille: cvFile.size,
                type: "cv",
              });
            }
          } catch (cvErr) {
            console.error("Erreur de téléversement du CV:", cvErr);
          }
        }

        toast.success("Compte créé avec succès ! Bienvenue.");
        navigate({ to: "/candidat" });
      } else {
        toast.success("Compte créé.", {
          description: "Vérifiez votre boîte mail pour confirmer votre inscription.",
        });
        navigate({ to: "/connexion" });
      }
    } catch (err: any) {
      console.warn("Inscription Supabase impossible, simulation en mode démo:", err);

      // Create local mock user session
      const mockUser = {
        id: "mock-candidate-1",
        email: email || "koffi.anan@gmail.com",
        role: "candidat",
      };
      localStorage.setItem("mock_auth_user", JSON.stringify(mockUser));

      // Build mock profile
      const competencesArray =
        activeStep >= 2 && competences
          ? competences
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : ["Recrutement", "Droit social", "SYSCOHADA"];

      const languagesArray =
        activeStep === 3 && langues
          ? langues.split(",").map((l) => {
              const parts = l.split(":");
              return {
                langue: parts[0]?.trim() || l.trim(),
                niveau: parts[1]?.trim() || "Intermédiaire",
              };
            })
          : [
              { langue: "Français", niveau: "Courant" },
              { langue: "Anglais", niveau: "Intermédiaire" },
            ];

      const certificationsArray =
        activeStep === 3 && certifications
          ? certifications
              .split(",")
              .map((c) => ({ nom: c.trim(), organisme: "Organisme émetteur", obtention: "2025" }))
          : [{ nom: "Certification PHRi", organisme: "HRCI", obtention: "2021" }];

      const interetsArray =
        activeStep === 3 && interets
          ? interets.split(",").map((i) => i.trim())
          : ["Lecture", "Football", "Bénévolat"];

      const { saveMockCandidateProfile } = await import("@/lib/mockData");
      saveMockCandidateProfile({
        userId: "mock-candidate-1",
        prenom: prenom || "Koffi",
        nom: nom || "Anan",
        telephone: telephone || "+225 07 08 09 10 11",
        whatsapp: telephone || "+225 07 08 09 10 11",
        email: email || "koffi.anan@gmail.com",
        date_naissance: "1994-06-15",
        sexe: "M",
        nationalite: "Ivoirienne",
        ville: ville || "Abidjan",
        adresse: "Cocody Angré, Rue des Jardins",
        permis_conduire: "Oui (Catégorie B)",
        titre: activeStep >= 2 ? titre || "Titre Professionnel" : "Directeur des Ressources Humaines",
        metier_recherche: metierRecherche || "Responsable RH",
        diplome: activeStep >= 2 ? diplome || "Diplôme" : "Master RH",
        bio: activeStep === 3 ? bio : "Professionnel qualifié.",
        disponibilite: activeStep >= 2 ? disponibilite || "Immédiate" : "Immédiate",
        pretention_salariale: activeStep === 3 ? pretentionSalariale : "1 500 000 FCFA",
        competences: competencesArray,
        experiences: [
          {
            id: "exp-1",
            poste: activeStep >= 2 ? titre || "Poste principal" : "Responsable RH",
            entreprise: "Entreprise Démo",
            secteur: "Ressources Humaines",
            ville: ville || "Abidjan",
            pays: "Côte d'Ivoire",
            debut: "2023-01",
            fin: "",
            actuel: true,
            missions: "Gestion des activités RH et administration locale.",
            resultats: "Amélioration des processus opérationnels.",
          },
        ],
        langues: languagesArray,
        certifications: certificationsArray,
        interets: interetsArray,
        mobilite: {
          demenagement: activeStep === 3 ? mobiliteDemenagement : false,
          teletravail: activeStep === 3 ? mobiliteTeletravail : false,
          etranger: activeStep === 3 ? mobiliteEtranger : false,
        },
        photo_url: photoPreviewUrl,
      });

      // Save mock CV document if uploaded
      if (cvFile) {
        const { saveMockCv } = await import("@/lib/mockData");
        saveMockCv({
          id: `cv-${Date.now()}`,
          nom_fichier: cvFile.name,
          candidate_id: "mock-candidate-1",
          created_at: new Date().toISOString(),
        });
      }

      toast.success("Compte créé avec succès ! Bienvenue (Mode Démo).");
      window.dispatchEvent(new Event("storage"));
      navigate({ to: "/candidat" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Espace Candidat"
      title="Créer mon compte."
      subtitle={`Étape ${step} sur 3 : ${
        step === 1
          ? "Identité (Obligatoire)"
          : step === 2
            ? "Parcours & Compétences (Recommandé)"
            : "Profil complet"
      }`}
      role="candidat"
      footer={
        <>
          Déjà inscrit ?{" "}
          <Link to="/connexion/candidat" className="text-primary font-semibold hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      {/* Progress Bar */}
      <div className="w-full bg-[#f4f5f7] h-1.5 rounded-full overflow-hidden mb-6 flex">
        <div
          className={`h-full transition-all duration-300 ${
            step === 1 ? "bg-primary w-1/3" : step === 2 ? "bg-primary w-2/3" : "bg-primary w-full"
          }`}
        />
      </div>

      {step === 1 && (
        <form onSubmit={handleStep1Next} className="space-y-4">
          {/* Prénom & Nom */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="prenom" className="block text-xs font-semibold text-foreground mb-1.5">
                Prénom *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                <Input
                  id="prenom"
                  type="text"
                  required
                  placeholder="Jean"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  className="pl-9 h-11 rounded-xl border-border bg-white shadow-sm focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                />
              </div>
            </div>
            <div>
              <label htmlFor="nom" className="block text-xs font-semibold text-foreground mb-1.5">
                Nom *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                <Input
                  id="nom"
                  type="text"
                  required
                  placeholder="Koné"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="pl-9 h-11 rounded-xl border-border bg-white shadow-sm focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                />
              </div>
            </div>
          </div>

          {/* Téléphone & Ville */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="telephone" className="block text-xs font-semibold text-foreground mb-1.5">
                Téléphone *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                <Input
                  id="telephone"
                  type="tel"
                  required
                  placeholder="+225 07 00..."
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  className="pl-9 h-11 rounded-xl border-border bg-white shadow-sm focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                />
              </div>
            </div>
            <div>
              <label htmlFor="ville" className="block text-xs font-semibold text-foreground mb-1.5">
                Ville *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                <Input
                  id="ville"
                  type="text"
                  required
                  placeholder="Abidjan"
                  value={ville}
                  onChange={(e) => setVille(e.target.value)}
                  className="pl-9 h-11 rounded-xl border-border bg-white shadow-sm focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                />
              </div>
            </div>
          </div>

          {/* Métier recherché (Strategic field!) */}
          <div>
            <label htmlFor="metierRecherche" className="block text-xs font-semibold text-foreground mb-1.5">
              Métier recherché *
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                id="metierRecherche"
                type="text"
                required
                placeholder="Ex: Développeur Full Stack, Comptable, Infirmier..."
                value={metierRecherche}
                onChange={(e) => setMetierRecherche(e.target.value)}
                className="pl-9 h-11 rounded-xl border-border bg-white shadow-sm focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Sert de critère principal pour être repéré par les recruteurs.</p>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-foreground mb-1.5">
              Adresse email *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                id="email"
                type="email"
                required
                placeholder="johndoe@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="pl-10 h-11 rounded-xl border-border bg-white shadow-sm focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-foreground mb-1.5">
              Mot de passe *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                id="password"
                type={showPwd ? "text" : "password"}
                required
                minLength={8}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="pl-10 pr-10 h-11 rounded-xl border-border bg-white shadow-sm focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-20"
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Minimum 8 caractères.</p>
          </div>

          {/* CV PDF Upload (Mandatory / Highly Recommended) */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              CV au format PDF *
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center transition-all bg-card ${
                cvFile ? "border-success bg-success/5" : "border-border hover:border-primary"
              }`}
            >
              <input
                ref={cvInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleCvChange}
              />
              {cvFile ? (
                <div className="flex items-center justify-between bg-white border border-success/30 rounded-lg p-2 max-w-sm mx-auto">
                  <div className="flex items-center gap-2 text-xs text-success font-semibold min-w-0">
                    <FileText className="h-4 w-4 shrink-0 text-success" />
                    <span className="truncate">{cvFile.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCvFile(null)}
                    className="text-xs text-muted-foreground hover:text-destructive font-bold ml-2"
                  >
                    Supprimer
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => cvInputRef.current?.click()}
                  className="cursor-pointer space-y-1.5"
                >
                  <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                  <div className="text-xs font-bold text-primary">Téléverser mon CV</div>
                  <div className="text-[10px] text-muted-foreground">PDF uniquement, max 5 Mo.</div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <button
              type="submit"
              className="w-full py-3 text-sm font-semibold text-white rounded-xl shadow-md transition-all hover:brightness-110 active:scale-[0.98] bg-primary cursor-pointer"
            >
              Continuer vers l'Étape 2
            </button>
            <button
              type="button"
              onClick={() => {
                if (!prenom || !nom || !email || !password || !telephone || !ville || !metierRecherche) {
                  toast.error("Veuillez remplir tous les champs requis pour finaliser.");
                  return;
                }
                handleSubmit(undefined, 1);
              }}
              className="w-full py-2.5 text-xs font-bold text-primary hover:underline bg-transparent text-center block"
            >
              Créer mon compte directement (avec l'Étape 1 uniquement)
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleStep2Next} className="space-y-4 animate-reveal">
          <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-xs text-[#1d3a6c] flex gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <strong>Recommandé</strong>: Ces champs enrichissent votre profil et facilitent le tri par les recruteurs.
            </div>
          </div>

          {/* Titre professionnel */}
          <div>
            <label htmlFor="titre" className="block text-xs font-semibold text-foreground mb-1.5">
              Titre professionnel
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                id="titre"
                type="text"
                placeholder="Ex: Développeur Full Stack Senior, Comptable..."
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                className="pl-9 h-11 rounded-xl border-border bg-white shadow-sm focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
              />
            </div>
          </div>

          {/* Diplôme / Formation */}
          <div>
            <label htmlFor="diplome" className="block text-xs font-semibold text-foreground mb-1.5">
              Dernier diplôme / Formation principale
            </label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                id="diplome"
                type="text"
                placeholder="Ex: Master Informatique, BTS Comptabilité..."
                value={diplome}
                onChange={(e) => setDiplome(e.target.value)}
                className="pl-9 h-11 rounded-xl border-border bg-white shadow-sm focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
              />
            </div>
          </div>

          {/* Compétences */}
          <div>
            <label htmlFor="competences" className="block text-xs font-semibold text-foreground mb-1.5">
              Compétences techniques (au moins 3, séparées par des virgules)
            </label>
            <div className="relative">
              <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                id="competences"
                type="text"
                placeholder="Ex: Laravel, React, Comptabilité, Leadership..."
                value={competences}
                onChange={(e) => setCompetences(e.target.value)}
                className="pl-9 h-11 rounded-xl border-border bg-white shadow-sm focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
              />
            </div>
            {competences && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {competences
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold"
                    >
                      {tag}
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* Disponibilité */}
          <div>
            <label htmlFor="disponibilite" className="block text-xs font-semibold text-foreground mb-1.5">
              Disponibilité
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Select value={disponibilite} onValueChange={setDisponibilite}>
                <SelectTrigger id="disponibilite" className="pl-9 rounded-xl border-border bg-white shadow-sm hover:border-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary h-11 text-sm font-medium">
                  <SelectValue placeholder="Sélectionnez votre disponibilité" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-white shadow-md z-50">
                  <SelectItem value="Immédiate">Immédiate</SelectItem>
                  <SelectItem value="Sous 15 jours">Sous 15 jours</SelectItem>
                  <SelectItem value="Sous 1 mois">Sous 1 mois</SelectItem>
                  <SelectItem value="Plus d'un mois">Plus d'un mois</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3 text-sm font-semibold text-foreground border border-border rounded-xl hover:bg-[#f4f5f7] transition-all cursor-pointer"
              >
                Retour
              </button>
              <button
                type="submit"
                className="col-span-2 py-3 text-sm font-semibold text-white rounded-xl shadow-md transition-all hover:brightness-110 active:scale-[0.98] bg-primary cursor-pointer"
              >
                Continuer (Étape 3)
              </button>
            </div>
            <button
              type="button"
              onClick={() => handleSubmit(undefined, 2)}
              className="w-full py-2 text-xs font-bold text-primary hover:underline bg-transparent text-center block"
            >
              Terminer l'inscription maintenant (ignorer l'Étape 3)
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={(e) => handleSubmit(e, 3)} className="space-y-4 animate-reveal">
          {/* Photo de profil */}
          <div className="flex items-center gap-4 p-3 rounded-xl border border-border/60 bg-[#1d3a6c]/[0.01]">
            <div className="w-16 h-16 rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/15 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              {photoPreviewUrl ? (
                <img
                  src={photoPreviewUrl}
                  alt="Aperçu"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl">👤</span>
              )}
            </div>
            <div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handlePhotoChange}
              />
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-primary/20 text-primary hover:bg-primary/5 transition-all cursor-pointer"
              >
                Ajouter une photo
              </button>
              <p className="text-[10px] text-muted-foreground mt-1">PNG, JPG (max 2 Mo).</p>
            </div>
          </div>

          {/* Langues & Certifications */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="langues" className="block text-xs font-semibold text-foreground mb-1.5">
                Langues (Niveau)
              </label>
              <div className="relative">
                <Languages className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                <Input
                  id="langues"
                  type="text"
                  placeholder="Ex: Français:Courant, Anglais:Débutant"
                  value={langues}
                  onChange={(e) => setLangues(e.target.value)}
                  className="pl-9 h-11 rounded-xl border-border bg-white shadow-sm focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                />
              </div>
            </div>
            <div>
              <label htmlFor="certifications" className="block text-xs font-semibold text-foreground mb-1.5">
                Certifications
              </label>
              <div className="relative">
                <Award className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                <Input
                  id="certifications"
                  type="text"
                  placeholder="Ex: PHRi, SCRUM, PMP..."
                  value={certifications}
                  onChange={(e) => setCertifications(e.target.value)}
                  className="pl-9 h-11 rounded-xl border-border bg-white shadow-sm focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                />
              </div>
            </div>
          </div>

          {/* Centres d'intérêt & Salaire */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="interets" className="block text-xs font-semibold text-foreground mb-1.5">
                Centres d'intérêt
              </label>
              <div className="relative">
                <Heart className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                <Input
                  id="interets"
                  type="text"
                  placeholder="Ex: Sport, Musique, Lecture"
                  value={interets}
                  onChange={(e) => setInterets(e.target.value)}
                  className="pl-9 h-11 rounded-xl border-border bg-white shadow-sm focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                />
              </div>
            </div>
            <div>
              <label htmlFor="pretentionSalariale" className="block text-xs font-semibold text-foreground mb-1.5">
                Prétention salariale
              </label>
              <div className="relative">
                <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                <Input
                  id="pretentionSalariale"
                  type="text"
                  placeholder="Ex: 800k FCFA"
                  value={pretentionSalariale}
                  onChange={(e) => setPretentionSalariale(e.target.value)}
                  className="pl-9 h-11 rounded-xl border-border bg-white shadow-sm focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                />
              </div>
            </div>
          </div>

          {/* Mobilité géographique */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Mobilité géographique & Télétravail
            </label>
            <div className="grid grid-cols-3 gap-3 p-3 border border-border bg-[#f8fafc] rounded-xl">
              <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground cursor-pointer select-none">
                <Checkbox
                  checked={mobiliteDemenagement}
                  onCheckedChange={(checked) => setMobiliteDemenagement(!!checked)}
                />
                Déménagement
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground cursor-pointer select-none">
                <Checkbox
                  checked={mobiliteTeletravail}
                  onCheckedChange={(checked) => setMobiliteTeletravail(!!checked)}
                />
                Télétravail
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground cursor-pointer select-none">
                <Checkbox
                  checked={mobiliteEtranger}
                  onCheckedChange={(checked) => setMobiliteEtranger(!!checked)}
                />
                Missions étranger
              </label>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-xs font-semibold text-foreground mb-1.5">
              Bio / Présentation libre
            </label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Textarea
                id="bio"
                rows={3}
                placeholder="Ex. Développeur passionné par le Web..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="pl-9 rounded-xl border-border bg-white shadow-sm focus:ring-primary/20 focus:border-primary text-sm min-h-[80px]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="py-3 text-sm font-semibold text-foreground border border-border rounded-xl hover:bg-[#f4f5f7] transition-all cursor-pointer"
            >
              Retour
            </button>
            <button
              type="submit"
              disabled={busy}
              className="col-span-2 py-3 text-sm font-semibold text-white rounded-xl shadow-md transition-all hover:brightness-110 active:scale-[0.98] bg-primary disabled:opacity-60 cursor-pointer"
            >
              {busy ? "Inscription..." : "Créer mon compte & Terminer"}
            </button>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
