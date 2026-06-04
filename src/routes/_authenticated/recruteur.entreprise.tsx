import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { COMPANY_STATUS_LABELS } from "@/lib/recruiter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Building2,
  ShieldCheck,
  ChevronDown,
  Phone,
  Linkedin,
  Globe,
  MapPin,
  Mail,
  FileText,
  Upload,
  Trash2,
  Twitter,
  Facebook,
  AlertCircle
} from "lucide-react";
import { getMockRecruiterProfile, saveMockRecruiterProfile, type MockRecruiterProfile } from "@/lib/mockData";

export const Route = createFileRoute("/_authenticated/recruteur/entreprise")({
  component: RecruteurEntreprise,
});

function RecruteurEntreprise() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Accordion Sections State
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    recruiter: true,
    company: false,
    verification: false,
  });

  const toggleSection = (section: string) => {
    setExpanded((prev) => {
      const nextState = {
        recruiter: false,
        company: false,
        verification: false,
      };
      nextState[section as keyof typeof nextState] = !prev[section];
      return nextState;
    });
  };

  // Recruiter Info State
  const [recruiter, setRecruiter] = useState({
    prenom: "",
    nom: "",
    fonction: "",
    telephone: "",
    email: "",
    photo_url: null as string | null,
    whatsapp: "",
    linkedin: "",
  });

  // Company Info State
  const [company, setCompany] = useState({
    id: "",
    nom: "",
    secteur: "",
    pays: "",
    localisation: "", // Ville
    adresse: "",
    site_web: "",
    description: "",
    logo_url: null as string | null,
    nombre_employes: "",
    annee_creation: "",
    linkedin_entreprise: "",
    twitter_entreprise: "",
    facebook_entreprise: "",
    registre_commerce: "",
    numero_fiscal: "",
    docs_complementaires: [] as string[],
    statut: "en_attente",
  });

  const photoFileRef = useRef<HTMLInputElement>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const docFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      if (user.id.startsWith("mock-")) {
        const profileData = getMockRecruiterProfile("mock-recruiter-1");
        setRecruiter({
          prenom: profileData.prenom || "",
          nom: profileData.nom || "",
          fonction: profileData.fonction || "",
          telephone: profileData.telephone || "",
          email: profileData.email || "",
          photo_url: profileData.photo_url || null,
          whatsapp: profileData.whatsapp || "",
          linkedin: profileData.linkedin || "",
        });
        setCompany({
          id: "company-1",
          nom: profileData.nomEntreprise || "",
          secteur: profileData.secteur || "",
          pays: profileData.pays || "",
          localisation: profileData.ville || "",
          adresse: profileData.adresse || "",
          site_web: profileData.site_web || "",
          description: profileData.description || "",
          logo_url: profileData.logo_url || null,
          nombre_employes: profileData.nombre_employes || "",
          annee_creation: profileData.annee_creation || "",
          linkedin_entreprise: profileData.linkedin_entreprise || "",
          twitter_entreprise: profileData.twitter_entreprise || "",
          facebook_entreprise: profileData.facebook_entreprise || "",
          registre_commerce: profileData.registre_commerce || "",
          numero_fiscal: profileData.numero_fiscal || "",
          docs_complementaires: profileData.docs_complementaires || [],
          statut: "validee",
        });
        setLoading(false);
        return;
      }

      try {
        // Load Recruiter Profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (profileData) {
          setRecruiter({
            prenom: profileData.prenom || "",
            nom: profileData.nom || "",
            fonction: profileData.fonction || "",
            telephone: profileData.telephone || "",
            email: user.email || "",
            photo_url: profileData.photo_url || null,
            whatsapp: profileData.whatsapp || "",
            linkedin: profileData.linkedin || "",
          });
        } else {
          setRecruiter(prev => ({ ...prev, email: user.email || "" }));
        }

        // Load Company profile
        const { data: companyData } = await supabase
          .from("companies")
          .select("*")
          .eq("owner_id", user.id)
          .maybeSingle();

        if (companyData) {
          const nets = companyData.networks || {};
          setCompany({
            id: companyData.id,
            nom: companyData.nom || "",
            secteur: companyData.secteur || "",
            pays: companyData.pays || "",
            localisation: companyData.localisation || "",
            adresse: companyData.adresse || "",
            site_web: companyData.site_web || "",
            description: companyData.description || "",
            logo_url: companyData.logo_url || null,
            nombre_employes: companyData.nombre_employes ? String(companyData.nombre_employes) : "",
            annee_creation: companyData.annee_creation ? String(companyData.annee_creation) : "",
            linkedin_entreprise: nets.linkedin || "",
            twitter_entreprise: nets.twitter || "",
            facebook_entreprise: nets.facebook || "",
            registre_commerce: companyData.registre_commerce || "",
            numero_fiscal: companyData.numero_fiscal || "",
            docs_complementaires: companyData.docs_complementaires || [],
            statut: companyData.statut || "en_attente",
          });
        }
      } catch (err) {
        console.warn("Erreur chargement profil recruteur:", err);
      }
      setLoading(false);
    })();
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (!recruiter.nom || !recruiter.prenom || !recruiter.fonction || !recruiter.telephone) {
      toast.error("Veuillez remplir toutes les informations obligatoires du recruteur.");
      return;
    }

    if (!company.nom || !company.secteur || !company.pays || !company.localisation || !company.adresse || !company.description) {
      toast.error("Veuillez remplir toutes les informations obligatoires de l'entreprise.");
      return;
    }

    if (!company.registre_commerce) {
      toast.error("Le numéro de Registre de Commerce est obligatoire.");
      return;
    }

    if (user.id.startsWith("mock-")) {
      const updatedProfile: MockRecruiterProfile = {
        userId: user.id,
        prenom: recruiter.prenom,
        nom: recruiter.nom,
        fonction: recruiter.fonction,
        telephone: recruiter.telephone,
        email: recruiter.email,
        photo_url: recruiter.photo_url,
        whatsapp: recruiter.whatsapp,
        linkedin: recruiter.linkedin,
        nomEntreprise: company.nom,
        secteur: company.secteur,
        pays: company.pays,
        ville: company.localisation,
        adresse: company.adresse,
        description: company.description,
        logo_url: company.logo_url,
        site_web: company.site_web,
        nombre_employes: company.nombre_employes,
        annee_creation: company.annee_creation,
        linkedin_entreprise: company.linkedin_entreprise,
        twitter_entreprise: company.twitter_entreprise,
        facebook_entreprise: company.facebook_entreprise,
        registre_commerce: company.registre_commerce,
        numero_fiscal: company.numero_fiscal,
        docs_complementaires: company.docs_complementaires,
      };
      saveMockRecruiterProfile(updatedProfile);
      window.dispatchEvent(new Event("profile-updated"));
      toast.success("Profil et fiche d'entreprise mis à jour (Mode Démo).");
      return;
    }

    setSaving(true);
    try {
      // 1. Save Recruiter Profile Info
      const { error: profileErr } = await supabase.from("profiles").upsert({
        id: user.id,
        nom: recruiter.nom,
        prenom: recruiter.prenom,
        telephone: recruiter.telephone,
        fonction: recruiter.fonction,
        linkedin: recruiter.linkedin,
        photo_url: recruiter.photo_url,
        whatsapp: recruiter.whatsapp,
      });
      if (profileErr) throw profileErr;

      // 2. Save Company Info
      const companyPayload = {
        owner_id: user.id,
        nom: company.nom,
        secteur: company.secteur || null,
        pays: company.pays || null,
        localisation: company.localisation || null,
        adresse: company.adresse || null,
        site_web: company.site_web || null,
        description: company.description || null,
        logo_url: company.logo_url,
        nombre_employes: company.nombre_employes ? parseInt(company.nombre_employes, 10) : null,
        annee_creation: company.annee_creation ? parseInt(company.annee_creation, 10) : null,
        networks: {
          linkedin: company.linkedin_entreprise || null,
          twitter: company.twitter_entreprise || null,
          facebook: company.facebook_entreprise || null,
        },
        registre_commerce: company.registre_commerce || null,
        numero_fiscal: company.numero_fiscal || null,
        docs_complementaires: company.docs_complementaires || [],
      };

      const { data: savedComp, error: companyErr } = company.id
        ? await supabase.from("companies").update(companyPayload).eq("id", company.id).select().single()
        : await supabase.from("companies").insert(companyPayload).select().single();

      if (companyErr) throw companyErr;

      if (savedComp) {
        setCompany((prev) => ({
          ...prev,
          id: savedComp.id,
          statut: savedComp.statut || prev.statut,
        }));
      }

      window.dispatchEvent(new Event("profile-updated"));
      toast.success("Fiche recruteur et entreprise enregistrées.");
    } catch (err: any) {
      console.error(err);
      toast.error("Erreur lors de la sauvegarde : " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function uploadPhoto(file: File) {
    if (!user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La photo est trop grande (2 Mo maximum).");
      return;
    }

    if (user.id.startsWith("mock-")) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setRecruiter((r) => ({ ...r, photo_url: result }));
        toast.success("Photo de profil mise à jour (Mode Démo).");
      };
      reader.readAsDataURL(file);
      return;
    }

    try {
      const ext = file.name.split(".").pop() ?? "png";
      const path = `avatars/${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (error) throw error;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setRecruiter((r) => ({ ...r, photo_url: data.publicUrl }));
      toast.success("Photo de profil téléversée.");
    } catch (err: any) {
      toast.error("Impossible de téléverser la photo: " + err.message);
    }
  }

  async function uploadLogo(file: File) {
    if (!user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Le logo est trop grand (2 Mo maximum).");
      return;
    }

    if (user.id.startsWith("mock-")) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setCompany((f) => ({ ...f, logo_url: result }));
        toast.success("Logo mis à jour (Mode Démo).");
      };
      reader.readAsDataURL(file);
      return;
    }

    try {
      const ext = file.name.split(".").pop() ?? "png";
      const path = `logos/${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("company_logos")
        .upload(path, file, { upsert: true });
      if (error) throw error;

      const { data } = supabase.storage.from("company_logos").getPublicUrl(path);
      setCompany((f) => ({ ...f, logo_url: data.publicUrl }));
      toast.success("Logo téléversé.");
    } catch (err: any) {
      toast.error("Impossible de téléverser le logo: " + err.message);
    }
  }

  async function uploadVerificationDoc(file: File) {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Le document est trop grand (5 Mo maximum).");
      return;
    }

    if (user.id.startsWith("mock-")) {
      setCompany((prev) => ({
        ...prev,
        docs_complementaires: [...prev.docs_complementaires, file.name],
      }));
      toast.success("Document de vérification ajouté (Mode Démo).");
      return;
    }

    try {
      const ext = file.name.split(".").pop() ?? "pdf";
      const path = `docs/${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("company_logos")
        .upload(path, file, { upsert: true });
      if (error) throw error;

      const { data } = supabase.storage.from("company_logos").getPublicUrl(path);
      setCompany((prev) => ({
        ...prev,
        docs_complementaires: [...prev.docs_complementaires, data.publicUrl],
      }));
      toast.success("Document de vérification téléversé.");
    } catch (err: any) {
      toast.error("Impossible de téléverser le document: " + err.message);
    }
  }

  function deleteDoc(index: number) {
    setCompany((prev) => ({
      ...prev,
      docs_complementaires: prev.docs_complementaires.filter((_, idx) => idx !== index),
    }));
    toast.success("Document retiré.");
  }

  if (loading) return <div className="text-sm font-mono text-muted-foreground p-6">Chargement...</div>;

  return (
    <div className="max-w-5xl pb-20">
      {/* ── Hero Header ─────────────────────────────────────────────────── */}
      <div className="page-hero page-hero-recruteur animate-reveal mb-8">
        <div
          className="page-hero-blob"
          style={{ width: 280, height: 280, background: "#059669", top: -100, right: -80 }}
        />
        <div
          className="page-hero-blob"
          style={{ width: 160, height: 160, background: "#34D399", bottom: -60, left: 40 }}
        />
        <div className="hero-content">
          <div className="dash-section-title" style={{ color: "rgba(255,255,255,0.6)" }}>
            Espace Recruteur
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white mb-2">
            Fiche Entreprise
          </h1>
          <p className="text-white/70 text-xs mt-1">
            Gérez la fiche de votre entreprise, vos informations de contact et vos justificatifs réglementaires.
          </p>
        </div>
      </div>
      
      {company.id && (
        <div className="mb-6 flex items-center gap-3 bg-card border border-border/80 p-3 px-4 rounded-xl shadow-sm max-w-max">
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground font-semibold">
            Statut :
          </span>
          <span
            className={`text-xs font-mono uppercase tracking-widest px-2.5 py-1 rounded-md font-bold ${
              company.statut === "validee"
                ? "bg-emerald-100 text-emerald-800"
                : company.statut === "refusee"
                ? "bg-rose-100 text-rose-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {COMPANY_STATUS_LABELS[company.statut]?.label || "En attente"}
          </span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8 mt-8">
        
        {/* SECTION 1: RECRUITER INFO */}
        <div className="bg-white border border-border/60 rounded-2xl shadow-sm overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => toggleSection("recruiter")}
            className={`w-full px-6 py-6 flex items-center justify-between transition-all border-b border-border/40 border-l-4 ${
              expanded.recruiter
                ? "bg-slate-50 border-l-[#059669]"
                : "bg-white hover:bg-slate-50/50 border-l-transparent"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#059669]/10 text-[#059669]">
                <User className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h3 className="font-display font-bold text-sm text-foreground">Informations du recruteur</h3>
                <p className="text-[10px] text-muted-foreground font-medium">Votre profil, contact et réseaux professionnels</p>
              </div>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${
                expanded.recruiter ? "rotate-180" : ""
              }`}
            />
          </button>

          {expanded.recruiter && (
            <div className="p-8 space-y-8 animate-reveal">
              {/* Photo de profil upload */}
              <div className="flex items-center gap-6 p-4 rounded-xl border border-dashed border-border bg-[#f8fafc]">
                <div className="w-20 h-20 rounded-full border border-border bg-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                  {recruiter.photo_url ? (
                    <img src={recruiter.photo_url} alt="Profil" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-8 w-8 text-slate-400" />
                  )}
                </div>
                <div>
                  <input
                    ref={photoFileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])}
                  />
                  <Button type="button" variant="outline" className="rounded-lg h-9 text-xs" onClick={() => photoFileRef.current?.click()}>
                    <Upload className="h-3.5 w-3.5 mr-2" />
                    Charger une photo
                  </Button>
                  <p className="text-[10px] text-muted-foreground mt-1.5">PNG, JPG. Max 2 Mo.</p>
                </div>
              </div>

              {/* Grid fields */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="grid gap-1.5">
                  <Label htmlFor="recruiter_prenom" className="text-xs font-semibold text-foreground">Prénom *</Label>
                  <Input
                    id="recruiter_prenom"
                    required
                    value={recruiter.prenom}
                    onChange={(e) => setRecruiter({ ...recruiter, prenom: e.target.value })}
                    className="rounded-xl text-sm"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="recruiter_nom" className="text-xs font-semibold text-foreground">Nom *</Label>
                  <Input
                    id="recruiter_nom"
                    required
                    value={recruiter.nom}
                    onChange={(e) => setRecruiter({ ...recruiter, nom: e.target.value })}
                    className="rounded-xl text-sm"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="recruiter_fonction" className="text-xs font-semibold text-foreground">Fonction / Poste *</Label>
                  <Input
                    id="recruiter_fonction"
                    required
                    placeholder="Ex: Responsable Recrutement, DRH..."
                    value={recruiter.fonction}
                    onChange={(e) => setRecruiter({ ...recruiter, fonction: e.target.value })}
                    className="rounded-xl text-sm"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="recruiter_telephone" className="text-xs font-semibold text-foreground">Téléphone professionnel *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="recruiter_telephone"
                      required
                      placeholder="+225..."
                      value={recruiter.telephone}
                      onChange={(e) => setRecruiter({ ...recruiter, telephone: e.target.value })}
                      className="rounded-xl pl-9 text-sm"
                    />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="recruiter_email" className="text-xs font-semibold text-foreground">Email de contact</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="recruiter_email"
                      disabled
                      value={recruiter.email}
                      className="rounded-xl pl-9 text-sm bg-slate-50 text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="recruiter_whatsapp" className="text-xs font-semibold text-foreground">WhatsApp (optionnel)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="recruiter_whatsapp"
                      placeholder="Ex: +225 07..."
                      value={recruiter.whatsapp}
                      onChange={(e) => setRecruiter({ ...recruiter, whatsapp: e.target.value })}
                      className="rounded-xl pl-9 text-sm"
                    />
                  </div>
                </div>
                <div className="grid gap-1.5 sm:col-span-2">
                  <Label htmlFor="recruiter_linkedin" className="text-xs font-semibold text-foreground">Lien profil LinkedIn (optionnel)</Label>
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="recruiter_linkedin"
                      type="url"
                      placeholder="https://linkedin.com/in/..."
                      value={recruiter.linkedin}
                      onChange={(e) => setRecruiter({ ...recruiter, linkedin: e.target.value })}
                      className="rounded-xl pl-9 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: COMPANY INFO */}
        <div className="bg-white border border-border/60 rounded-2xl shadow-sm overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => toggleSection("company")}
            className={`w-full px-6 py-6 flex items-center justify-between transition-all border-b border-border/40 border-l-4 ${
              expanded.company
                ? "bg-slate-50 border-l-[#059669]"
                : "bg-white hover:bg-slate-50/50 border-l-transparent"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#059669]/10 text-[#059669]">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h3 className="font-display font-bold text-sm text-foreground">Fiche de l'entreprise</h3>
                <p className="text-[10px] text-muted-foreground font-medium">Présentation générale de la structure et logo</p>
              </div>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${
                expanded.company ? "rotate-180" : ""
              }`}
            />
          </button>

          {expanded.company && (
            <div className="p-8 space-y-8 animate-reveal">
              {/* Logo de l'entreprise upload */}
              <div className="flex items-center gap-6 p-4 rounded-xl border border-dashed border-border bg-[#f8fafc]">
                <div className="w-20 h-20 rounded-xl border border-border bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                  {company.logo_url ? (
                    <img src={company.logo_url} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Building2 className="h-8 w-8 text-slate-400" />
                  )}
                </div>
                <div>
                  <input
                    ref={logoFileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])}
                  />
                  <Button type="button" variant="outline" className="rounded-lg h-9 text-xs" onClick={() => logoFileRef.current?.click()}>
                    <Upload className="h-3.5 w-3.5 mr-2" />
                    Charger le logo
                  </Button>
                  <p className="text-[10px] text-muted-foreground mt-1.5">PNG, JPG. Max 2 Mo.</p>
                </div>
              </div>

              {/* Grid fields */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="grid gap-1.5">
                  <Label htmlFor="company_nom" className="text-xs font-semibold text-foreground">Nom de l'entreprise *</Label>
                  <Input
                    id="company_nom"
                    required
                    value={company.nom}
                    onChange={(e) => setCompany({ ...company, nom: e.target.value })}
                    className="rounded-xl text-sm"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="company_secteur" className="text-xs font-semibold text-foreground">Secteur d'activité *</Label>
                  <Input
                    id="company_secteur"
                    required
                    placeholder="Ex: Technologies, Agro-industrie..."
                    value={company.secteur}
                    onChange={(e) => setCompany({ ...company, secteur: e.target.value })}
                    className="rounded-xl text-sm"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="company_pays" className="text-xs font-semibold text-foreground">Pays *</Label>
                  <Input
                    id="company_pays"
                    required
                    value={company.pays}
                    onChange={(e) => setCompany({ ...company, pays: e.target.value })}
                    className="rounded-xl text-sm"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="company_localisation" className="text-xs font-semibold text-foreground">Ville *</Label>
                  <Input
                    id="company_localisation"
                    required
                    value={company.localisation}
                    onChange={(e) => setCompany({ ...company, localisation: e.target.value })}
                    className="rounded-xl text-sm"
                  />
                </div>
                <div className="grid gap-1.5 sm:col-span-2">
                  <Label htmlFor="company_adresse" className="text-xs font-semibold text-foreground">Adresse complète *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="company_adresse"
                      required
                      placeholder="Ex: Boulevard Latrille, Cocody"
                      value={company.adresse}
                      onChange={(e) => setCompany({ ...company, adresse: e.target.value })}
                      className="rounded-xl pl-9 text-sm"
                    />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="company_site" className="text-xs font-semibold text-foreground">Site web (facultatif)</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="company_site"
                      type="url"
                      placeholder="https://..."
                      value={company.site_web}
                      onChange={(e) => setCompany({ ...company, site_web: e.target.value })}
                      className="rounded-xl pl-9 text-sm"
                    />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="company_taille" className="text-xs font-semibold text-foreground">Taille de l'entreprise</Label>
                  <Select
                    value={company.nombre_employes || "none"}
                    onValueChange={(val) => setCompany({ ...company, nombre_employes: val === "none" ? "" : val })}
                  >
                    <SelectTrigger className="rounded-xl text-sm h-10">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-border shadow-md z-50">
                      <SelectItem value="none">Sélectionner</SelectItem>
                      <SelectItem value="1-10">1 - 10 employés</SelectItem>
                      <SelectItem value="11-50">11 - 50 employés</SelectItem>
                      <SelectItem value="51-200">51 - 200 employés</SelectItem>
                      <SelectItem value="201-500">201 - 500 employés</SelectItem>
                      <SelectItem value="500+">Plus de 500 employés</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="company_creation" className="text-xs font-semibold text-foreground">Année de création</Label>
                  <Input
                    id="company_creation"
                    type="number"
                    placeholder="Ex: 2015"
                    value={company.annee_creation}
                    onChange={(e) => setCompany({ ...company, annee_creation: e.target.value })}
                    className="rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="company_desc" className="text-xs font-semibold text-foreground">Description de l'entreprise *</Label>
                <Textarea
                  id="company_desc"
                  required
                  rows={4}
                  placeholder="Présentez brièvement les missions, valeurs et activités de votre entreprise..."
                  value={company.description}
                  onChange={(e) => setCompany({ ...company, description: e.target.value })}
                  className="rounded-xl text-sm min-h-[100px]"
                />
              </div>

              {/* Company networks */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Réseaux sociaux de l'entreprise</h4>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="LinkedIn (URL)"
                      value={company.linkedin_entreprise}
                      onChange={(e) => setCompany({ ...company, linkedin_entreprise: e.target.value })}
                      className="rounded-xl pl-9 text-xs"
                    />
                  </div>
                  <div className="relative">
                    <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Twitter (URL)"
                      value={company.twitter_entreprise}
                      onChange={(e) => setCompany({ ...company, twitter_entreprise: e.target.value })}
                      className="rounded-xl pl-9 text-xs"
                    />
                  </div>
                  <div className="relative">
                    <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Facebook (URL)"
                      value={company.facebook_entreprise}
                      onChange={(e) => setCompany({ ...company, facebook_entreprise: e.target.value })}
                      className="rounded-xl pl-9 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: VERIFICATION */}
        <div className="bg-white border border-border/60 rounded-2xl shadow-sm overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => toggleSection("verification")}
            className={`w-full px-6 py-6 flex items-center justify-between transition-all border-b border-border/40 border-l-4 ${
              expanded.verification
                ? "bg-slate-50 border-l-[#059669]"
                : "bg-white hover:bg-slate-50/50 border-l-transparent"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#059669]/10 text-[#059669]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h3 className="font-display font-bold text-sm text-foreground">Vérification de l'entreprise</h3>
                <p className="text-[10px] text-muted-foreground font-medium">Vérification de la légitimité pour sécuriser la plateforme</p>
              </div>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${
                expanded.verification ? "rotate-180" : ""
              }`}
            />
          </button>

          {expanded.verification && (
            <div className="p-8 space-y-8 animate-reveal">
              <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs text-[#059669] flex gap-2">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <div>
                  <strong>Sécurité anti-fraude</strong> : Nous validons manuellement chaque entreprise sur présentation d'un justificatif légal.
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="grid gap-1.5">
                  <Label htmlFor="company_rc" className="text-xs font-semibold text-foreground">N° Registre de Commerce (RC) *</Label>
                  <Input
                    id="company_rc"
                    required
                    placeholder="Ex: CI-ABJ-2015-B-1234"
                    value={company.registre_commerce}
                    onChange={(e) => setCompany({ ...company, registre_commerce: e.target.value })}
                    className="rounded-xl text-sm"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="company_fiscal" className="text-xs font-semibold text-foreground">Numéro fiscal / CC (si applicable)</Label>
                  <Input
                    id="company_fiscal"
                    placeholder="Ex: 1597531-M"
                    value={company.numero_fiscal}
                    onChange={(e) => setCompany({ ...company, numero_fiscal: e.target.value })}
                    className="rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Upload complementary files */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-foreground">Justificatifs réglementaires (PDF, PNG, JPG)</Label>
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-[#059669] transition-all bg-[#f8fafc]">
                  <input
                    ref={docFileRef}
                    type="file"
                    accept=".pdf,image/*"
                    hidden
                    onChange={(e) => e.target.files?.[0] && uploadVerificationDoc(e.target.files[0])}
                  />
                  <div onClick={() => docFileRef.current?.click()} className="cursor-pointer space-y-2">
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                    <div className="text-xs font-bold text-[#059669]">Téléverser un document justificatif</div>
                    <div className="text-[10px] text-muted-foreground">Registre de Commerce, Fiche de déclaration fiscale, etc. (Max 5 Mo)</div>
                  </div>
                </div>

                {/* List uploaded documents */}
                {company.docs_complementaires && company.docs_complementaires.length > 0 && (
                  <div className="grid gap-2 pt-2">
                    {company.docs_complementaires.map((doc, idx) => {
                      const docName = doc.includes("/") ? doc.split("/").pop() || "Document" : doc;
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 px-3 border border-border bg-slate-50 rounded-xl"
                        >
                          <div className="flex items-center gap-2 text-xs font-medium text-foreground min-w-0">
                            <FileText className="h-4 w-4 text-[#059669] shrink-0" />
                            {doc.startsWith("http") ? (
                              <a href={doc} target="_blank" rel="noreferrer" className="underline hover:text-[#059669] truncate">
                                {docName}
                              </a>
                            ) : (
                              <span className="truncate">{docName}</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteDoc(idx)}
                            className="text-destructive hover:text-red-700 transition-colors p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* STICKY FLOATING ACTION BAR FOR SAVING */}
        <div className="sticky bottom-4 z-40 bg-white/90 backdrop-blur-md border border-border/80 p-4 px-6 rounded-2xl shadow-xl flex items-center justify-between gap-4 mt-12 animate-reveal">
          <div className="text-xs text-muted-foreground flex items-center gap-2 font-medium">
            <AlertCircle className="h-4.5 w-4.5 text-[#059669] shrink-0" />
            <span>N'oubliez pas d'enregistrer vos modifications.</span>
          </div>
          <Button type="submit" disabled={saving} className="bg-[#059669] hover:bg-[#059669]/90 rounded-xl px-8 shadow-md h-11 text-xs font-semibold">
            {saving ? "Sauvegarde en cours..." : "Enregistrer les modifications"}
          </Button>
        </div>
      </form>
    </div>
  );
}
