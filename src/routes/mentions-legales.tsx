import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/mentions-legales")({
  head: () => ({
    meta: [
      { title: "Mentions légales — L'Alternative" },
      { name: "description", content: "Mentions légales de la plateforme L'Alternative." },
    ],
  }),
  component: MentionsPage,
});

function MentionsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 w-full">
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Cadre juridique</div>
        <h1 className="font-display italic text-5xl mb-10">Mentions légales.</h1>
        <div className="prose prose-stone max-w-none space-y-6 text-sm">
          <section>
            <h2 className="font-display italic text-2xl mb-2">Éditeur</h2>
            <p>L'Alternative RH — Société par actions simplifiée<br />Siège social : à compléter<br />SIREN : à compléter<br />Directeur de la publication : à compléter</p>
          </section>
          <section>
            <h2 className="font-display italic text-2xl mb-2">Hébergement</h2>
            <p>Plateforme hébergée par Supabase.</p>
          </section>
          <section>
            <h2 className="font-display italic text-2xl mb-2">Propriété intellectuelle</h2>
            <p>L'ensemble du site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle. Toute reproduction est interdite sans autorisation préalable.</p>
          </section>
          <section>
            <h2 className="font-display italic text-2xl mb-2">Contact</h2>
            <p>Pour toute question : contact@lalternative-rh.example</p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
