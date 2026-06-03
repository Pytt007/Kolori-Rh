import { Link } from "@tanstack/react-router";
import { Facebook, Linkedin, Instagram } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="bg-[#121212] text-[#a3a3a3] border-t border-neutral-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-neutral-800">
        {/* Brand column */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="flex items-center gap-2 group">
            <img
              src="/logo.png"
              alt="Kolori RH"
              className="h-14 object-contain brightness-0 invert"
            />
          </div>
          <p className="text-xs text-[#737373] leading-relaxed">
            Cabinet conseil en recrutement et gestion globale des ressources humaines. Votre avenir,
            nos couleurs.
          </p>
        </div>

        {/* Column 1: Recrutement de Cadres */}
        <div>
          <h3 className="font-semibold text-white text-sm mb-4">Recrutement de Cadres</h3>
          <ul className="space-y-2.5 text-xs">
            <li>
              <Link
                to="/services/$serviceId"
                params={{ serviceId: "chasse-de-tetes" }}
                className="hover:text-white transition-colors"
              >
                Chasse de têtes
              </Link>
            </li>
            <li>
              <Link
                to="/services/$serviceId"
                params={{ serviceId: "profils-candidats" }}
                className="hover:text-white transition-colors"
              >
                Profils candidats
              </Link>
            </li>
            <li>
              <Link
                to="/services/$serviceId"
                params={{ serviceId: "tests-psychometriques" }}
                className="hover:text-white transition-colors"
              >
                Tests psychométriques
              </Link>
            </li>
            <li>
              <Link
                to="/services/$serviceId"
                params={{ serviceId: "services-de-placement" }}
                className="hover:text-white transition-colors"
              >
                Services de placement
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 2: Solutions RH */}
        <div>
          <h3 className="font-semibold text-white text-sm mb-4">Solutions RH</h3>
          <ul className="space-y-2.5 text-xs">
            <li>
              <Link
                to="/services/$serviceId"
                params={{ serviceId: "systemes-rh" }}
                className="hover:text-white transition-colors"
              >
                Systèmes RH
              </Link>
            </li>
            <li>
              <Link
                to="/services/$serviceId"
                params={{ serviceId: "conseil-rh" }}
                className="hover:text-white transition-colors"
              >
                Conseil RH
              </Link>
            </li>
            <li>
              <Link
                to="/services/$serviceId"
                params={{ serviceId: "enquetes-salariales" }}
                className="hover:text-white transition-colors"
              >
                Enquêtes salariales
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Services RH */}
        <div>
          <h3 className="font-semibold text-white text-sm mb-4">Services RH</h3>
          <ul className="space-y-2.5 text-xs">
            <li>
              <Link
                to="/services/$serviceId"
                params={{ serviceId: "externalisation" }}
                className="hover:text-white transition-colors"
              >
                Externalisation
              </Link>
            </li>
            <li>
              <Link
                to="/services/$serviceId"
                params={{ serviceId: "gestion-de-la-paie" }}
                className="hover:text-white transition-colors"
              >
                Gestion de la paie
              </Link>
            </li>
            <li>
              <Link
                to="/services/$serviceId"
                params={{ serviceId: "droit-du-travail" }}
                className="hover:text-white transition-colors"
              >
                Conseil en droit du travail
              </Link>
            </li>
            <li>
              <Link
                to="/services/$serviceId"
                params={{ serviceId: "relations-gouvernementales" }}
                className="hover:text-white transition-colors"
              >
                Relations gouvernementales
              </Link>
            </li>
            <li>
              <Link
                to="/services/$serviceId"
                params={{ serviceId: "marque-employeur" }}
                className="hover:text-white transition-colors"
              >
                Marque employeur
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Partners and Socials */}
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-6 border-b border-neutral-800/60">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#737373] font-bold block mb-4 md:mb-2">
            Nos Partenaires
          </span>
          <div className="flex flex-wrap gap-6 items-center opacity-40 grayscale hover:opacity-75 transition-opacity">
            <span className="font-bold tracking-tight text-white text-sm">ISO 9001</span>
            <span className="font-bold tracking-tight text-white text-sm">GPA</span>
            <span className="font-bold tracking-tight text-white text-sm">CORE</span>
            <span className="font-bold tracking-tight text-white text-sm">SAP</span>
            <span className="font-bold tracking-tight text-white text-sm">AMCHAM</span>
          </div>
        </div>

        <div>
          <span className="text-xs uppercase tracking-widest text-[#737373] font-bold block mb-3 md:text-right">
            Suivez-nous
          </span>
          <div className="flex gap-4">
            <a
              href="#"
              className="p-2 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white transition-colors"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="p-2 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white transition-colors"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="p-2 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white transition-colors"
            >
              <Instagram className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto px-6 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#525252]">
        <div>© 2026 Kolori RH. Tous droits réservés.</div>
        <div className="flex gap-6">
          <Link to="/confidentialite" className="hover:text-[#a3a3a3] transition-colors">
            Politique de confidentialité
          </Link>
          <Link to="/mentions-legales" className="hover:text-[#a3a3a3] transition-colors">
            Mentions légales
          </Link>
          <Link to="/contact" className="hover:text-[#a3a3a3] transition-colors">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
