import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/site/AuthShell";
import { toast } from "sonner";
import { Mail, Lock, User, Briefcase, MapPin, Globe, AlignLeft, Building2, Eye, EyeOff } from "lucide-react";

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

  // Form states
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const [nomEntreprise, setNomEntreprise] = useState("");
  const [secteur, setSecteur] = useState("");
  const [localisation, setLocalisation] = useState("");
  const [siteWeb, setSiteWeb] = useState("");
  const [description, setDescription] = useState("");

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

  const handleNext = (e: FormEvent) => {
    e.preventDefault();
    if (!prenom || !nom || !email || !password) {
      toast.error("Veuillez remplir tous les champs obligatoires de cette étape.");
      return;
    }
    if (password.length < 8) {
      toast.error("Mot de passe trop court (8 caractères minimum).");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nomEntreprise) {
      toast.error("Le nom de l'entreprise est obligatoire.");
      return;
    }
    setBusy(true);

    try {
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
            nom_entreprise: nomEntreprise,
            secteur,
            localisation,
            site_web: siteWeb,
            description,
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

        // Create company profile
        const { error: companyErr } = await supabase.from("companies").insert({
          owner_id: userId,
          nom: nomEntreprise,
          secteur: secteur || null,
          localisation: localisation || null,
          site_web: siteWeb || null,
          description: description || null,
          logo_url: publicLogoUrl,
          statut: "en_attente",
        });

        if (companyErr) throw companyErr;

        toast.success("Compte et entreprise créés avec succès ! Bienvenue.");
        navigate({ to: "/recruteur" });
      } else {
        toast.success("Compte créé.", {
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
      subtitle={`Étape ${step} sur 2 : ${step === 1 ? "Identité de l'interlocuteur" : "Fiche de l'entreprise"}`}
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
          style={{ width: `${step * 50}%` }}
        />
      </div>

      {step === 1 ? (
        <form onSubmit={handleNext} className="space-y-4">
          {/* Prénom & Nom */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="prenom" className="block text-xs font-semibold text-foreground mb-1.5">
                Prénom *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  id="prenom"
                  type="text"
                  required
                  placeholder="Ex: Kouassi"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669] transition-all placeholder:text-muted-foreground/60"
                />
              </div>
            </div>
            <div>
              <label htmlFor="nom" className="block text-xs font-semibold text-foreground mb-1.5">
                Nom *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  id="nom"
                  type="text"
                  required
                  placeholder="Ex: Koffi"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669] transition-all placeholder:text-muted-foreground/60"
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-foreground mb-1.5">
              Adresse email professionnelle *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                id="email"
                type="email"
                required
                placeholder="recrutement@entreprise.ci"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669] transition-all placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-foreground mb-1.5">
              Mot de passe *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                id="password"
                type={showPwd ? "text" : "password"}
                required
                minLength={8}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full pl-10 pr-10 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669] transition-all placeholder:text-muted-foreground/60"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
            Continuer
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 animate-reveal">
          {/* Logo de l'entreprise */}
          <div className="flex items-center gap-4 mb-5 p-3 rounded-xl border border-border/60 bg-[#059669]/[0.01]">
            <div className="w-16 h-16 rounded-xl border border-border bg-secondary flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              {logoPreviewUrl ? (
                <img
                  src={logoPreviewUrl}
                  alt="Aperçu"
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Logo</span>
              )}
            </div>
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleLogoChange}
              />
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
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                id="nomEntreprise"
                type="text"
                required
                placeholder="Ex: Ivory Tech Solutions"
                value={nomEntreprise}
                onChange={(e) => setNomEntreprise(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669] transition-all placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          {/* Secteur & Localisation */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="secteur" className="block text-xs font-semibold text-foreground mb-1.5">
                Secteur d'activité
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  id="secteur"
                  type="text"
                  placeholder="Ex: Technologies"
                  value={secteur}
                  onChange={(e) => setSecteur(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669] transition-all placeholder:text-muted-foreground/60"
                />
              </div>
            </div>
            <div>
              <label htmlFor="localisation" className="block text-xs font-semibold text-foreground mb-1.5">
                Localisation
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  id="localisation"
                  type="text"
                  placeholder="Ex: Abidjan, Cocody"
                  value={localisation}
                  onChange={(e) => setLocalisation(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669] transition-all placeholder:text-muted-foreground/60"
                />
              </div>
            </div>
          </div>

          {/* Site Web */}
          <div>
            <label htmlFor="siteWeb" className="block text-xs font-semibold text-foreground mb-1.5">
              Site web (facultatif)
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                id="siteWeb"
                type="url"
                placeholder="https://mon-entreprise.ci"
                value={siteWeb}
                onChange={(e) => setSiteWeb(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669] transition-all placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-xs font-semibold text-foreground mb-1.5">
              Description de l'entreprise
            </label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              <textarea
                id="description"
                rows={4}
                placeholder="Présentez votre entreprise, ses missions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669] transition-all placeholder:text-muted-foreground/60 resize-none"
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
              disabled={busy}
              className="col-span-2 py-3 text-sm font-semibold text-white rounded-xl shadow-md transition-all hover:brightness-110 active:scale-[0.98] bg-[#059669] disabled:opacity-60 cursor-pointer"
            >
              {busy ? "Inscription..." : "Créer mon compte"}
            </button>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
