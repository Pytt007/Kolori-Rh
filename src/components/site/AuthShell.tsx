import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const AVATARS = [
  "https://i.pravatar.cc/40?img=47",
  "https://i.pravatar.cc/40?img=12",
  "https://i.pravatar.cc/40?img=33",
  "https://i.pravatar.cc/40?img=56",
];

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-[#f4f5f7]">
      {/* ── Left: Form Panel ── */}
      <div className="flex flex-col justify-center w-full md:w-1/2 px-8 py-12 md:px-16 lg:px-24 bg-white">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-2 mb-10 group">
            <img src="/logo.png" alt="Kolori RH" className="h-12 object-contain" />
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
          background: "linear-gradient(145deg, #0d1b2e 0%, #1a2f4a 40%, #0e1e34 100%)",
        }}
      >
        {/* Hero image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url('/auth_hero.png')" }}
        />

        {/* Decorative glow */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: "var(--primary)" }}
        />

        {/* Top bar */}
        <div className="relative z-10 flex items-center gap-2 p-8">
          <img
            src="/logo.png"
            alt="Kolori RH"
            className="h-10 object-contain brightness-0 invert"
          />
        </div>

        {/* Center content */}
        <div className="relative z-10 px-10 pb-6">
          <p className="text-xs font-mono uppercase tracking-widest text-white/50 mb-4">
            Bienvenue sur Kolori RH
          </p>
          <h2 className="text-3xl font-bold text-white leading-snug mb-3 font-display">
            Trouvez le bon talent,
            <br />
            au bon moment.
          </h2>
          <p className="text-sm text-white/60 leading-relaxed max-w-xs mb-8">
            Kolori RH connecte les entreprises ivoiriennes aux meilleurs profils. Rejoignez des
            centaines d'entreprises et de candidats qui nous font confiance.
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
              Postulez au bon emploi,
              <br />
              au bon endroit
            </p>
            <p className="text-white/55 text-xs mb-4">
              Soyez parmi les premiers à vivre l'expérience de recrutement la plus simple de Côte
              d'Ivoire.
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
