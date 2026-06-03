import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/site/AuthShell";
import { ensureCandidate } from "@/lib/candidate";
import { toast } from "sonner";
import { Mail, Lock, User, Phone, MapPin, Briefcase, GraduationCap, Sparkles, Clock, CircleDollarSign, AlignLeft, Eye, EyeOff } from "lucide-react";

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

  // Profile image states
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Form states
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [telephone, setTelephone] = useState("");
  const [ville, setVille] = useState("");

  const [titre, setTitre] = useState("");
  const [diplome, setDiplome] = useState("");
  const [competences, setCompetences] = useState("");
  const [disponibilite, setDisponibilite] = useState("");
  const [pretentionSalariale, setPretentionSalariale] = useState("");
  const [bio, setBio] = useState("");

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

  const handleNext = (e: FormEvent) => {
    e.preventDefault();
    if (!prenom || !nom || !email || !password || !telephone || !ville) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
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
    setBusy(true);

    try {
      // 1. Convert photo to Base64 if confirmation might be needed
      let pendingPhotoBase64: string | null = null;
      if (photoFile) {
        pendingPhotoBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(photoFile);
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
            role: "candidat",
            telephone,
            ville,
            titre,
            diplome,
            competences,
            disponibilite,
            pretention_salariale: pretentionSalariale,
            bio,
          },
        },
      });

      if (error) throw error;

      // 3. Save pending photo to localStorage in case email confirmation is required
      if (pendingPhotoBase64) {
        localStorage.setItem("signup_pending_photo", pendingPhotoBase64);
      }

      // 4. If logged in immediately (email confirmation disabled)
      if (data?.session && data.user) {
        const userId = data.user.id;

        // Upload photo to Storage immediately if possible
        let publicPhotoUrl = null;
        if (photoFile) {
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
          })
          .eq("id", userId);

        // Ensure candidate row exists
        const cid = await ensureCandidate(userId);

        // Update candidate details
        const competencesArray = competences
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        await supabase
          .from("candidates")
          .update({
            titre,
            diplome,
            competences: competencesArray,
            disponibilite,
            pretention_salariale: pretentionSalariale,
            bio,
            ville,
          })
          .eq("id", cid);

        toast.success("Compte créé avec succès ! Bienvenue.");
        navigate({ to: "/candidat" });
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
      eyebrow="Espace Candidat"
      title="Créer mon compte."
      subtitle={`Étape ${step} sur 2 : ${step === 1 ? "Identité & Connexion" : "Profil Professionnel"}`}
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
      <div className="w-full bg-[#f4f5f7] h-1.5 rounded-full overflow-hidden mb-6">
        <div
          className="bg-primary h-full transition-all duration-300"
          style={{ width: `${step * 50}%` }}
        />
      </div>

      {step === 1 ? (
        <form onSubmit={handleNext} className="space-y-4">
          {/* Photo de profil */}
          <div className="flex items-center gap-4 mb-5 p-3 rounded-xl border border-border/60 bg-[#1d3a6c]/[0.01]">
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
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handlePhotoChange}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-primary/20 text-primary hover:bg-primary/5 transition-all cursor-pointer"
              >
                Téléverser une photo
              </button>
              <p className="text-[10px] text-muted-foreground mt-1">PNG, JPG. Max 2 Mo conseillé.</p>
            </div>
          </div>

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
                  placeholder="Jean"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60"
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
                  placeholder="Koné"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60"
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
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  id="telephone"
                  type="tel"
                  required
                  placeholder="+225 07 00..."
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60"
                />
              </div>
            </div>
            <div>
              <label htmlFor="ville" className="block text-xs font-semibold text-foreground mb-1.5">
                Ville *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  id="ville"
                  type="text"
                  required
                  placeholder="Abidjan"
                  value={ville}
                  onChange={(e) => setVille(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60"
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-foreground mb-1.5">
              Adresse email *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                id="email"
                type="email"
                required
                placeholder="johndoe@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60"
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
                className="w-full pl-10 pr-10 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60"
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
            className="w-full py-3 text-sm font-semibold text-white rounded-xl shadow-md transition-all hover:brightness-110 active:scale-[0.98] bg-primary cursor-pointer"
          >
            Continuer
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 animate-reveal">
          {/* Titre du poste & Diplôme */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="titre" className="block text-xs font-semibold text-foreground mb-1.5">
                Titre recherché
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  id="titre"
                  type="text"
                  placeholder="Ex: Développeur React"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60"
                />
              </div>
            </div>
            <div>
              <label htmlFor="diplome" className="block text-xs font-semibold text-foreground mb-1.5">
                Diplôme principal
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  id="diplome"
                  type="text"
                  placeholder="Ex: Master RH"
                  value={diplome}
                  onChange={(e) => setDiplome(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60"
                />
              </div>
            </div>
          </div>

          {/* Compétences */}
          <div>
            <label htmlFor="competences" className="block text-xs font-semibold text-foreground mb-1.5">
              Compétences (séparées par des virgules)
            </label>
            <div className="relative">
              <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                id="competences"
                type="text"
                placeholder="Ex: React, TypeScript, Node.js"
                value={competences}
                onChange={(e) => setCompetences(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          {/* Disponibilité & Salaire */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="disponibilite" className="block text-xs font-semibold text-foreground mb-1.5">
                Disponibilité
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  id="disponibilite"
                  type="text"
                  placeholder="Ex: Immédiate"
                  value={disponibilite}
                  onChange={(e) => setDisponibilite(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60"
                />
              </div>
            </div>
            <div>
              <label htmlFor="pretentionSalariale" className="block text-xs font-semibold text-foreground mb-1.5">
                Prétention salariale
              </label>
              <div className="relative">
                <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  id="pretentionSalariale"
                  type="text"
                  placeholder="Ex: 800k - 1M FCFA"
                  value={pretentionSalariale}
                  onChange={(e) => setPretentionSalariale(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60"
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-xs font-semibold text-foreground mb-1.5">
              Bio / Présentation
            </label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              <textarea
                id="bio"
                rows={4}
                placeholder="Racontez-nous un peu votre parcours..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60 resize-none"
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
              className="col-span-2 py-3 text-sm font-semibold text-white rounded-xl shadow-md transition-all hover:brightness-110 active:scale-[0.98] bg-primary disabled:opacity-60 cursor-pointer"
            >
              {busy ? "Inscription..." : "Créer mon compte"}
            </button>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
