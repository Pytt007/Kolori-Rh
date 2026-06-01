import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import { Building2, Award, ShieldCheck, Heart } from "lucide-react";

export const Route = createFileRoute("/a-propos")({
  head: () => ({
    meta: [
      { title: "À propos — Kolori RH" },
      { name: "description", content: "Découvrez l'histoire, la mission et les valeurs de Kolori RH, la plateforme de recrutement et de solutions RH de référence." },
    ],
  }),
  component: AProposPage,
});

function AProposPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      <SiteHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-primary text-primary-foreground border-b border-border/10 py-24 px-6 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 w-96 h-96 bg-white/5 rounded-full -mr-32 -mb-32 pointer-events-none" />
          <div className="max-w-4xl mx-auto text-center animate-reveal relative z-10">
            <div className="text-xs font-mono uppercase tracking-widest text-white/70 font-bold mb-4">Notre Manifeste</div>
            <h1 className="font-display font-black text-5xl md:text-6xl text-white mb-6 animate-reveal">
              Écrire de nouveaux <span className="text-red-400">chapitres professionnels</span>.
            </h1>
            <p className="text-white/80 text-lg max-w-2xl mx-auto leading-relaxed">
              Kolori RH est né d'une conviction simple : le recrutement ne doit pas être un algorithme froid, mais un processus transparent, humain et rigoureusement structuré.
            </p>
          </div>
        </section>

        {/* Vision & Mission */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-reveal [animation-delay:100ms]">
              <h2 className="font-display font-bold text-3xl">Pourquoi <span className="text-primary">Kolori RH</span> ?</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Dans un marché du travail en constante mutation, trouver la bonne adéquation entre un projet de vie et les ambitions d'une entreprise est un défi. Les plateformes traditionnelles privilégient la quantité à la qualité, noyant les recruteurs sous des flux de CV non qualifiés et laissant les candidats dans l'incertitude.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Nous proposons une approche structurée où chaque entreprise est validée manuellement, chaque offre est modérée, et chaque étape du recrutement est claire et tracée. C'est cela, Kolori RH.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 animate-reveal [animation-delay:200ms]">
              {[
                { icon: ShieldCheck, title: "Rigueur", desc: "Modération stricte de chaque offre d'emploi." },
                { icon: Award, title: "Qualité", desc: "Des entreprises partenaires de confiance." },
                { icon: Building2, title: "Transparence", desc: "Suivi en temps réel de chaque candidature." },
                { icon: Heart, title: "Humain", desc: "La mise en relation de projets partagés." },
              ].map((item, idx) => (
                <div key={idx} className="p-5 border border-border bg-card rounded-2xl">
                  <item.icon className="h-6 w-6 text-primary mb-3" />
                  <h3 className="font-display font-bold text-lg mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-muted/30 border-y border-border py-16 px-6">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="font-display font-bold text-3xl">Prêt à rejoindre notre réseau ?</h2>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto">
              Que vous cherchiez votre prochain emploi ou que vous souhaitiez recruter les meilleurs talents, nous vous accompagnons dans vos démarches.
            </p>
            <div className="flex justify-center gap-4 pt-2">
              <Link to="/inscription" search={{ role: "candidat" } as never}>
                <Button className="rounded-full px-8 py-3 bg-primary text-white font-semibold">Espace Candidat</Button>
              </Link>
              <Link to="/inscription" search={{ role: "recruteur" } as never}>
                <Button variant="outline" className="rounded-full px-8 py-3 font-semibold">Espace Recruteur</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
