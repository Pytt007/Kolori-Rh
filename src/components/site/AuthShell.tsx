import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

const AVATARS = [
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&h=150&fit=crop&crop=face",
];

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  role,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  role?: "candidat" | "recruteur" | "admin";
}) {
  const brandConfig = {
    candidat: {
      gradient: "linear-gradient(145deg, #0b1a30 0%, #173360 40%, #0c1c38 100%)",
      glow: "#2563eb",
      bgImage: "/candidate_success.png",
      title: "Propulsez votre carrière.",
      description: "Trouvez l'emploi qui correspond à vos aspirations en Côte d'Ivoire. Mettez en valeur votre profil et attirez les meilleurs recruteurs.",
      socialTitle: "Des opportunités quotidiennes",
      socialSubtitle: "Postulez en un clic et suivez vos candidatures en temps réel."
    },
    recruteur: {
      gradient: "linear-gradient(145deg, #022c22 0%, #064e3b 40%, #022c22 100%)",
      glow: "#10b981",
      bgImage: "/hero_recruitment.png",
      title: "Trouvez vos futurs collaborateurs.",
      description: "Publiez vos offres d'emploi, gérez les candidatures reçues et explorez notre CVthèque de profils qualifiés pour faire grandir votre entreprise.",
      socialTitle: "Recrutement ultra-simplifié",
      socialSubtitle: "Trouvez, filtrez et contactez directement les futurs collaborateurs de votre entreprise."
    },
    admin: {
      gradient: "linear-gradient(145deg, #1e1b4b 0%, #311042 40%, #180828 100%)",
      glow: "#a855f7",
      bgImage: "/mission_collaboration.png",
      title: "Console de supervision globale.",
      description: "Accès réservé aux administrateurs de Kolori RH. Gérez les utilisateurs, modérez les offres d'emploi et assurez la sécurité du système.",
      socialTitle: "Supervision en temps réel",
      socialSubtitle: "Surveillez les statistiques d'activité globale et les configurations système."
    },
    default: {
      gradient: "linear-gradient(145deg, #0d1b2e 0%, #1a2f4a 40%, #0e1e34 100%)",
      glow: "var(--primary)",
      bgImage: "/auth_hero.png",
      title: "Trouvez le bon talent, au bon moment.",
      description: "Kolori RH connecte les entreprises ivoiriennes aux meilleurs profils. Rejoignez des centaines d'entreprises et de candidats qui nous font confiance.",
      socialTitle: "Postulez au bon emploi, au bon endroit",
      socialSubtitle: "Soyez parmi les premiers à vivre l'expérience de recrutement la plus simple de Côte d'Ivoire."
    }
  };

  const currentBrand = role ? brandConfig[role] : brandConfig.default;
  return (
    <div className="min-h-screen flex bg-[#f4f5f7]">
      {/* ── Left: Form Panel ── */}
      <div className="relative flex flex-col justify-center w-full md:w-1/2 px-6 sm:px-8 py-12 md:px-16 lg:px-24 bg-white">
        {/* Back button to home */}
        <Link
          to="/"
          className="absolute top-4 left-4 md:top-8 md:left-8 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-border shadow-sm hover:shadow-md text-foreground hover:text-primary hover:border-primary/30 transition-all duration-300 group cursor-pointer z-10"
          title="Retour à l'accueil"
        >
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 transform group-hover:-translate-x-0.5 transition-transform text-foreground group-hover:text-primary" />
        </Link>

        <div className="w-full max-w-md mx-auto">
          {/* Logo — extra top margin on mobile to clear the back button */}
          <Link to="/" className="flex justify-center md:inline-flex items-center gap-2 mt-14 md:mt-0 mb-8 md:mb-10 group">
            <img src="/logo.png" alt="Kolori RH" className="h-16 sm:h-20 md:h-24 object-contain" />
          </Link>

          {/* Eyebrow + Title */}
          <div className="mb-1 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            {eyebrow}
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-1 font-display">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mb-8">{subtitle}</p>}
          {!subtitle && <div className="mb-6" />}

          {/* Form content */}
          <div className="space-y-1">{children}</div>

          {/* Footer */}
          {footer && <div className="mt-6 text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>

      {/* ── Right: Brand Panel ── */}
      <div
        className="hidden md:flex flex-col justify-between w-1/2 relative overflow-hidden rounded-l-3xl"
        style={{
          background: currentBrand.gradient,
        }}
      >
        {/* Hero image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 transition-all duration-500"
          style={{ backgroundImage: `url('${currentBrand.bgImage}')` }}
        />

        {/* Decorative glow */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-500"
          style={{ background: currentBrand.glow }}
        />

        {/* Wall branding overlay (only for recruiter space) */}
        {role === "recruteur" && (
          <div className="absolute inset-0 flex flex-col items-center justify-start pt-32 pointer-events-none opacity-25 select-none">
            <span className="text-3xl font-extrabold tracking-widest text-white font-display">KOLORI RH</span>
            <span className="text-[10px] tracking-[0.2em] text-white/80 uppercase mt-2 font-mono">Abidjan, Côte d'Ivoire</span>
          </div>
        )}

        {/* Top bar */}
        <div className="relative z-10 flex items-center gap-2 p-8">
          <img
            src="/logo.png"
            alt="Kolori RH"
            className="h-20 object-contain brightness-0 invert"
          />
        </div>

        {/* Center content */}
        <div className="relative z-10 px-10 pb-6">
          <p className="text-xs font-mono uppercase tracking-widest text-white/50 mb-4">
            Bienvenue sur Kolori RH
          </p>
          <h2 className="text-3xl font-bold text-white leading-snug mb-3 font-display">
            {currentBrand.title}
          </h2>
          <p className="text-sm text-white/60 leading-relaxed max-w-xs mb-8">
            {currentBrand.description}
          </p>

          {/* Social proof card */}
          <div
            className="rounded-2xl p-5 max-w-xs"
            style={{
              background: "rgba(255,255,255,0.07)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <p className="text-white font-semibold text-sm leading-snug mb-1">
              {currentBrand.socialTitle}
            </p>
            <p className="text-white/55 text-xs mb-4">
              {currentBrand.socialSubtitle}
            </p>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {AVATARS.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="w-8 h-8 rounded-full border-2 object-cover"
                    style={{ borderColor: "rgba(255,255,255,0.15)" }}
                  />
                ))}
                <div
                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold text-white"
                  style={{
                    borderColor: "rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.15)",
                  }}
                >
                  +2k
                </div>
              </div>
              <span className="text-white/50 text-[11px] font-mono">utilisateurs actifs</span>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="relative z-10 px-10 pb-8">
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
            © 2026 Kolori RH — Abidjan, Côte d'Ivoire
          </p>
        </div>
      </div>
    </div>
  );
}
