import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/site/AuthShell";
import { toast } from "sonner";
import {
  Mail,
  Lock,
  User,
  Briefcase,
  MapPin,
  Globe,
  AlignLeft,
  Building2,
  Eye,
  EyeOff,
  Phone,
  UserCheck,
  FileText,
  FileDigit,
  Upload,
  Check,
  AlertCircle
} from "lucide-react";
import { saveMockRecruiterProfile } from "@/lib/mockData";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/inscription/recruteur")({
  head: () => ({
    meta: [
      { title: "Inscription Recruteur — Kolori RH" },
      { name: "description", content: "Créez votre compte recruteur et la fiche de votre entreprise sur Kolori RH." },
    ],
  }),
  component: InscriptionRecruteurPage,
});

function InscriptionRecruteurPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);

  // Logo file states
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Verification document states
  const [rcFile, setRcFile] = useState<File | null>(null);
  const rcInputRef = useRef<HTMLInputElement>(null);

  // Form states - Step 1: Informations du recruteur
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [fonction, setFonction] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  // Form states - Step 2: Informations de l'entreprise
  const [nomEntreprise, setNomEntreprise] = useState("");
  const [secteur, setSecteur] = useState("");
  const [pays, setPays] = useState("");
  const [ville, setVille] = useState("");
  const [adresse, setAdresse] = useState("");
  const [siteWeb, setSiteWeb] = useState("");
  const [description, setDescription] = useState("");

  // Form states - Step 3: Vérification de l'entreprise
  const [registreCommerce, setRegistreCommerce] = useState("");
  const [numeroFiscal, setNumeroFiscal] = useState("");

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Le logo est trop grand (2 Mo maximum).");
        return;
      }
      setLogoFile(file);
      setLogoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRcFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Le document est trop grand (5 Mo maximum).");
        return;
      }
      setRcFile(file);
    }
  };

  const handleStep1Next = (e: FormEvent) => {
    e.preventDefault();
    if (!prenom || !nom || !fonction || !telephone || !email || !password) {
      toast.error("Veuillez remplir tous les champs obligatoires du recruteur.");
      return;
    }
    if (password.length < 8) {
      toast.error("Le mot de passe doit comporter au moins 8 caractères.");
      return;
    }
    setStep(2);
  };

  const handleStep2Next = (e: FormEvent) => {
    e.preventDefault();
    if (!nomEntreprise || !secteur || !pays || !ville || !adresse || !description) {
      toast.error("Veuillez remplir toutes les informations obligatoires de l'entreprise.");
      return;
    }
    setStep(3);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!registreCommerce) {
      toast.error("Le Registre de commerce est obligatoire pour valider l'entreprise.");
      return;
    }
    setBusy(true);

    try {
      // 0. Support local mock simulation
      if (email === "recruteur@demo.ci" || email.includes("demo")) {
        const mockProfile = {
          userId: "mock-recruiter-1",
          prenom,
          nom,
          fonction,
          telephone,
          email,
          photo_url: null,
          whatsapp: telephone,
          linkedin: "",
          nomEntreprise,
          secteur,
          pays,
          ville,
          adresse,
          description,
          logo_url: logoPreviewUrl,
          site_web: siteWeb,
          nombre_employes: "50-150 employés",
          annee_creation: "2015",
          linkedin_entreprise: "",
          twitter_entreprise: "",
          facebook_entreprise: "",
          registre_commerce: registreCommerce,
          numero_fiscal: numeroFiscal,
          docs_complementaires: rcFile ? [rcFile.name] : [],
        };
        saveMockRecruiterProfile(mockProfile);
        localStorage.setItem(
          "mock_auth_user",
          JSON.stringify({ id: "mock-recruiter-1", email }),
        );
        localStorage.setItem("mock_auth_roles", JSON.stringify(["recruteur"]));
        localStorage.setItem("mock_recruiter_nom", nomEntreprise);
        toast.success("Compte démo créé avec succès ! Bienvenue.");
        navigate({ to: "/recruteur" });
        return;
      }

      // 1. Convert logo to Base64 in case email confirmation is required
      let pendingLogoBase64: string | null = null;
      if (logoFile) {
        pendingLogoBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(logoFile);
        });
      }

      // 2. SignUp user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/connexion`,
          data: {
            prenom,
            nom,
            role: "recruteur",
            fonction,
            telephone,
            nom_entreprise: nomEntreprise,
            secteur,
            pays,
            ville,
            adresse,
            description,
            registre_commerce: registreCommerce,
            numero_fiscal: numeroFiscal,
          },
        },
      });

      if (error) throw error;

      // 3. Save pending logo to localStorage for first login sync
      if (pendingLogoBase64) {
        localStorage.setItem("signup_pending_logo", pendingLogoBase64);
      }

      // 4. If logged in immediately (email confirmation disabled)
      if (data?.session && data.user) {
        const userId = data.user.id;

        // Upload logo immediately if possible
        let publicLogoUrl = null;
        if (logoFile) {
          try {
            const ext = logoFile.name.split(".").pop() ?? "png";
            const path = `${userId}/${Date.now()}.${ext}`;
            const { error: uploadErr } = await supabase.storage
              .from("company_logos")
              .upload(path, logoFile, { upsert: true });

            if (!uploadErr) {
              const { data: publicUrlData } = supabase.storage
                .from("company_logos")
                .getPublicUrl(path);
              publicLogoUrl = publicUrlData.publicUrl;
              localStorage.removeItem("signup_pending_logo");
            }
          } catch (uploadErr) {
            console.error("Erreur de téléversement logo:", uploadErr);
          }
        }

        // Create company profile in Database
        const { error: companyErr } = await supabase.from("companies").insert({
          owner_id: userId,
          nom: nomEntreprise,
          secteur: secteur || null,
          pays: pays || null,
          localisation: ville || null,
          adresse: adresse || null,
          description: description || null,
          logo_url: publicLogoUrl,
          registre_commerce: registreCommerce,
          numero_fiscal: numeroFiscal || null,
          statut: "en_attente",
        });

        if (companyErr) throw companyErr;

        // Update recruiter functional info in user profile
        const { error: profileErr } = await supabase.from("profiles").upsert({
          id: userId,
          nom,
          prenom,
          telephone,
          fonction,
        });

        if (profileErr) throw profileErr;

        toast.success("Compte et entreprise créés avec succès ! Bienvenue.");
        navigate({ to: "/recruteur" });
      } else {
        toast.success("Compte créé avec succès.", {
          description: "Vérifiez votre boîte mail pour confirmer votre inscription.",
        });
        navigate({ to: "/connexion" });
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Impossible de créer le compte", { description: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Espace Recruteur"
      title="Créer un compte recruteur."
      subtitle={`Étape ${step} sur 3 : ${
        step === 1
          ? "Identité de l'interlocuteur"
          : step === 2
            ? "Fiche de l'entreprise"
            : "Vérification réglementaire"
      }`}
      role="recruteur"
      footer={
        <>
          Déjà inscrit ?{" "}
          <Link to="/connexion/recruteur" className="text-[#059669] font-semibold hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      {/* Progress Bar */}
      <div className="w-full bg-[#f4f5f7] h-1.5 rounded-full overflow-hidden mb-6">
        <div
          className="bg-[#059669] h-full transition-all duration-300"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      {step === 1 && (
        <form onSubmit={handleStep1Next} className="space-y-4">
          {/* Prénom & Nom */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  placeholder="Ex: Kouassi"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  className="pl-9 h-11 rounded-xl border-border bg-white shadow-sm focus:ring-[#059669]/20 focus:border-[#059669] transition-all text-sm font-medium"
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
                  placeholder="Ex: Koffi"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="pl-9 h-11 rounded-xl border-border bg-white shadow-sm focus:ring-[#059669]/20 focus:border-[#059669] transition-all text-sm font-medium"
                />
              </div>
            </div>
          </div>

          {/* Fonction / Titre */}
          <div>
            <label htmlFor="fonction" className="block text-xs font-semibold text-foreground mb-1.5">
              Fonction / Titre *
            </label>
            <div className="relative">
              <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                id="fonction"
                type="text"
                required
                placeholder="Ex: Responsable Recrutement, DRH..."
                value={fonction}
                onChange={(e) => setFonction(e.target.value)}
                className="pl-9 h-11 rounded-xl border-border bg-white shadow-sm focus:ring-[#059669]/20 focus:border-[#059669] transition-all text-sm font-medium"
              />
            </div>
          </div>

          {/* Téléphone */}
          <div>
            <label htmlFor="telephone" className="block text-xs font-semibold text-foreground mb-1.5">
              Téléphone professionnel *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                id="telephone"
                type="tel"
                required
                placeholder="Ex: +225 07 00..."
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                className="pl-9 h-11 rounded-xl border-border bg-white shadow-sm focus:ring-[#059669]/20 focus:border-[#059669] transition-all text-sm font-medium"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-foreground mb-1.5">
              Adresse email professionnelle *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                id="email"
                type="email"
                required
                placeholder="recrutement@entreprise.ci"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="pl-10 h-11 rounded-xl border-border bg-white shadow-sm focus:ring-[#059669]/20 focus:border-[#059669] transition-all text-sm font-medium"
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
                className="pl-10 pr-10 h-11 rounded-xl border-border bg-white shadow-sm focus:ring-[#059669]/20 focus:border-[#059669] transition-all text-sm font-medium"
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

          {/* Suivant */}
          <button
            type="submit"
            className="w-full py-3 text-sm font-semibold text-white rounded-xl shadow-md transition-all hover:brightness-110 active:scale-[0.98] bg-[#059669] cursor-pointer"
          >
            Continuer (Étape 2)
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleStep2Next} className="space-y-4 animate-reveal">
          {/* Logo de l'entreprise */}
          <div className="flex items-center gap-4 mb-3 p-3 rounded-xl border border-border/60 bg-[#059669]/[0.01]">
            <div className="w-16 h-16 rounded-xl border border-border bg-secondary flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              {logoPreviewUrl ? (
                <img src={logoPreviewUrl} alt="Aperçu" className="w-full h-full object-contain" />
              ) : (
                <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Logo</span>
              )}
            </div>
            <div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleLogoChange} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-[#059669]/20 text-[#059669] hover:bg-[#059669]/5 transition-all cursor-pointer"
              >
                Téléverser un logo
              </button>
              <p className="text-[10px] text-muted-foreground mt-1">PNG, JPG. Max 2 Mo conseillé.</p>
            </div>
          </div>

          {/* Nom de l'entreprise */}
          <div>
            <label htmlFor="nomEntreprise" className="block text-xs font-semibold text-foreground mb-1.5">
              Nom de l'entreprise *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                id="nomEntreprise"
                type="text"
                required
                placeholder="Ex: Ivory Tech Solutions"
                value={nomEntreprise}
                onChange={(e) => setNomEntreprise(e.target.value)}
                className="pl-9 h-11 rounded-xl border-border bg-white shadow-sm focus:ring-[#059669]/20 focus:border-[#059669] transition-all text-sm font-medium"
              />
            </div>
          </div>

          {/* Secteur d'activité */}
          <div>
            <label htmlFor="secteur" className="block text-xs font-semibold text-foreground mb-1.5">
              Secteur d'activité *
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                id="secteur"
                type="text"
                required
                placeholder="Ex: Technologies, Services financiers..."
                value={secteur}
                onChange={(e) => setSecteur(e.target.value)}
                className="pl-9 h-11 rounded-xl border-border bg-white shadow-sm focus:ring-[#059669]/20 focus:border-[#059669] transition-all text-sm font-medium"
              />
            </div>
          </div>

          {/* Pays & Ville */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="pays" className="block text-xs font-semibold text-foreground mb-1.5">
                Pays *
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                <Input
                  id="pays"
                  type="text"
                  required
                  placeholder="Ex: Côte d'Ivoire"
                  value={pays}
                  onChange={(e) => setPays(e.target.value)}
                  className="pl-9 h-11 rounded-xl border-border bg-white shadow-sm focus:ring-[#059669]/20 focus:border-[#059669] transition-all text-sm font-medium"
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
                  placeholder="Ex: Abidjan"
                  value={ville}
                  onChange={(e) => setVille(e.target.value)}
                  className="pl-9 h-11 rounded-xl border-border bg-white shadow-sm focus:ring-[#059669]/20 focus:border-[#059669] transition-all text-sm font-medium"
                />
              </div>
            </div>
          </div>

          {/* Adresse complète */}
          <div>
            <label htmlFor="adresse" className="block text-xs font-semibold text-foreground mb-1.5">
              Adresse complète *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                id="adresse"
                type="text"
                required
                placeholder="Ex: Boulevard Latrille, Cocody"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                className="pl-9 h-11 rounded-xl border-border bg-white shadow-sm focus:ring-[#059669]/20 focus:border-[#059669] transition-all text-sm font-medium"
              />
            </div>
          </div>

          {/* Site Web */}
          <div>
            <label htmlFor="siteWeb" className="block text-xs font-semibold text-foreground mb-1.5">
              Site web (facultatif)
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                id="siteWeb"
                type="url"
                placeholder="https://mon-entreprise.ci"
                value={siteWeb}
                onChange={(e) => setSiteWeb(e.target.value)}
                className="pl-9 h-11 rounded-xl border-border bg-white shadow-sm focus:ring-[#059669]/20 focus:border-[#059669] transition-all text-sm font-medium"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-xs font-semibold text-foreground mb-1.5">
              Description de l'entreprise *
            </label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Textarea
                id="description"
                required
                rows={3}
                placeholder="Présentez votre entreprise, ses missions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="pl-9 rounded-xl border-border bg-white shadow-sm focus:ring-[#059669]/20 focus:border-[#059669] text-sm min-h-[80px]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="py-3 text-sm font-semibold text-foreground border border-border rounded-xl hover:bg-secondary/50 transition-all cursor-pointer"
            >
              Retour
            </button>
            <button
              type="submit"
              className="col-span-2 py-3 text-sm font-semibold text-white rounded-xl shadow-md transition-all hover:brightness-110 active:scale-[0.98] bg-[#059669] cursor-pointer"
            >
              Continuer (Étape 3)
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-4 animate-reveal">
          <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs text-[#059669] flex gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <strong>Sécurité des offres</strong> : Ces documents permettent à notre équipe de vérifier la légitimité de votre structure afin de limiter les fausses offres.
            </div>
          </div>

          {/* Numéro de Registre de Commerce */}
          <div>
            <label htmlFor="registreCommerce" className="block text-xs font-semibold text-foreground mb-1.5">
              N° du Registre de Commerce *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                id="registreCommerce"
                type="text"
                required
                placeholder="Ex: CI-ABJ-2015-B-1234"
                value={registreCommerce}
                onChange={(e) => setRegistreCommerce(e.target.value)}
                className="pl-9 h-11 rounded-xl border-border bg-white shadow-sm focus:ring-[#059669]/20 focus:border-[#059669] transition-all text-sm font-medium"
              />
            </div>
          </div>

          {/* Numéro Fiscal */}
          <div>
            <label htmlFor="numeroFiscal" className="block text-xs font-semibold text-foreground mb-1.5">
              Numéro fiscal / CC (si applicable)
            </label>
            <div className="relative">
              <FileDigit className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                id="numeroFiscal"
                type="text"
                placeholder="Ex: 1597531-M"
                value={numeroFiscal}
                onChange={(e) => setNumeroFiscal(e.target.value)}
                className="pl-9 h-11 rounded-xl border-border bg-white shadow-sm focus:ring-[#059669]/20 focus:border-[#059669] transition-all text-sm font-medium"
              />
            </div>
          </div>

          {/* Document Registre de commerce upload */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Justificatif d'enregistrement (PDF / Image) *
            </label>
            <div
              className={`border-2 border-dashed rounded-xl p-4 text-center transition-all bg-card ${
                rcFile ? "border-emerald-500 bg-emerald-50/5" : "border-border hover:border-[#059669]"
              }`}
            >
              <input
                ref={rcInputRef}
                type="file"
                accept=".pdf,image/*"
                className="hidden"
                onChange={handleRcFileChange}
              />
              {rcFile ? (
                <div className="flex items-center justify-between bg-white border border-emerald-500/30 rounded-lg p-2 max-w-sm mx-auto shadow-sm">
                  <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold min-w-0">
                    <FileText className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="truncate">{rcFile.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRcFile(null)}
                    className="text-xs text-muted-foreground hover:text-destructive font-bold ml-2"
                  >
                    Supprimer
                  </button>
                </div>
              ) : (
                <div onClick={() => rcInputRef.current?.click()} className="cursor-pointer space-y-1.5">
                  <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                  <div className="text-xs font-bold text-[#059669]">Téléverser le justificatif</div>
                  <div className="text-[10px] text-muted-foreground">PDF, JPG, PNG, max 5 Mo.</div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="py-3 text-sm font-semibold text-foreground border border-border rounded-xl hover:bg-secondary/50 transition-all cursor-pointer"
            >
              Retour
            </button>
            <button
              type="submit"
              disabled={busy}
              className="col-span-2 py-3 text-sm font-semibold text-white rounded-xl shadow-md transition-all hover:brightness-110 active:scale-[0.98] bg-[#059669] disabled:opacity-60 cursor-pointer"
            >
              {busy ? "Finalisation..." : "Créer mon compte & Terminer"}
            </button>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
