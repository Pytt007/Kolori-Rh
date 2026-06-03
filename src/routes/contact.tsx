import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { type FormEvent } from "react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Kolori RH" },
      {
        name: "description",
        content: "Contactez l'équipe de Kolori RH pour toute question ou demande de partenariat.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    toast.success("Message envoyé.", { description: "Nous reviendrons vers vous sous 48h." });
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      <SiteHeader />
      <main className="flex-1">
        {/* Page Header */}
        <section className="bg-primary text-primary-foreground py-16 px-6 relative overflow-hidden mb-12">
          <div className="absolute right-0 bottom-0 w-96 h-96 bg-white/5 rounded-full -mr-32 -mb-32 pointer-events-none" />
          <div className="max-w-7xl mx-auto z-10 relative">
            <span className="text-xs uppercase tracking-widest text-accent-foreground/80 font-bold bg-white/10 px-3 py-1 rounded-full">
              Écrivez-nous
            </span>
            <h1 className="font-display font-black text-4xl md:text-5xl tracking-tight mt-6 mb-4">
              Contact.
            </h1>
            <p className="text-base md:text-lg opacity-90 max-w-2xl font-light leading-relaxed">
              Une question, un besoin en recrutement, ou une demande de partenariat ? Notre équipe
              basée à Abidjan répond sous 48h ouvrées.
            </p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-6 pb-24 w-full grid lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Contact Form */}
          <div className="lg:col-span-7 space-y-6">
            <form
              onSubmit={handleSubmit}
              className="space-y-4 bg-white border border-border p-6 md:p-8 rounded-3xl shadow-sm"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prenom" className="font-semibold text-xs text-muted-foreground">
                    Prénom
                  </Label>
                  <Input id="prenom" required className="rounded-xl border border-border mt-1" />
                </div>
                <div>
                  <Label htmlFor="nom" className="font-semibold text-xs text-muted-foreground">
                    Nom
                  </Label>
                  <Input id="nom" required className="rounded-xl border border-border mt-1" />
                </div>
              </div>
              <div>
                <Label htmlFor="email" className="font-semibold text-xs text-muted-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  className="rounded-xl border border-border mt-1"
                />
              </div>
              <div>
                <Label htmlFor="sujet" className="font-semibold text-xs text-muted-foreground">
                  Sujet
                </Label>
                <Input id="sujet" required className="rounded-xl border border-border mt-1" />
              </div>
              <div>
                <Label htmlFor="message" className="font-semibold text-xs text-muted-foreground">
                  Message
                </Label>
                <Textarea
                  id="message"
                  required
                  rows={5}
                  className="rounded-xl border border-border mt-1"
                />
              </div>
              <div className="pt-2">
                <Button
                  type="submit"
                  className="rounded-full px-8 py-3 bg-primary text-white font-semibold shadow-md hover:brightness-110"
                >
                  Envoyer le message
                </Button>
              </div>
            </form>
          </div>

          {/* Right Column: Office Image, Coordinates & Map */}
          <div className="lg:col-span-5 space-y-8">
            {/* Office Image */}
            <div className="rounded-3xl overflow-hidden shadow-md border border-border/60">
              <img
                src="/contact_office.png"
                alt="Bureaux Kolori RH"
                className="w-full h-[220px] object-cover"
              />
            </div>

            {/* Contact Details */}
            <div className="bg-white border border-border rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-display font-bold text-lg text-foreground pb-2 border-b border-border">
                Nos Coordonnées
              </h3>
              <ul className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <li>
                  <strong className="text-foreground">Adresse :</strong>
                  <br />
                  Cocody, Abidjan, Côte d'Ivoire
                </li>
                <li>
                  <strong className="text-foreground">Téléphone :</strong>
                  <br />
                  +225 27 22 40 00 00
                </li>
                <li>
                  <strong className="text-foreground">E-mail :</strong>
                  <br />
                  contact@kolorirh.com
                </li>
              </ul>
            </div>

            {/* Interactive Google Map */}
            <div className="rounded-3xl overflow-hidden shadow-md border border-border/60 h-[250px]">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d127113.82195038318!2d-4.081596700778644!3d5.348429381640822!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xffc1ec8e3b3e70d%3A0x1c8b36873dc2d1c6!2sAbidjan%2C%20C%C3%B4te%20d&#39;Ivoire!5e0!3m2!1sen!2sfr!4v1625682855012!5m2!1sen!2sfr"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                title="Carte localisation Kolori RH"
              ></iframe>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
