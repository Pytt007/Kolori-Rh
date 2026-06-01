# 🎨 Kolori RH — Plateforme de recrutement

> Cabinet conseil en recrutement & solutions RH basé à **Abidjan, Côte d'Ivoire**.  
> Plateforme web full-stack connectant candidats et recruteurs.

---

## 🚀 Démarrage rapide

### 1. Prérequis

- **Node.js** ≥ 18 ([télécharger](https://nodejs.org))
- **npm** ≥ 9 (inclus avec Node.js)
- Un compte **Supabase** (gratuit sur [supabase.com](https://supabase.com))

### 2. Cloner le dépôt

```bash
git clone https://github.com/VOTRE_USERNAME/kolori-rh.git
cd kolori-rh
```

### 3. Installer les dépendances

```bash
npm install
```

### 4. Configurer les variables d'environnement

```bash
# Copiez le fichier exemple
cp .env.example .env
```

Ouvrez `.env` et remplacez les valeurs par vos clés Supabase :

```env
VITE_SUPABASE_URL="https://VOTRE_PROJECT_ID.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="votre_anon_public_key"
VITE_SUPABASE_PROJECT_ID="votre_project_id"
```

> 🔑 **Où trouver vos clés ?**  
> Supabase Dashboard → Votre projet → **Settings** → **API**

### 5. Lancer le serveur de développement

```bash
npm run dev
```

Le site est disponible sur **http://localhost:5173**

---

## 🎮 Mode Démo (sans Supabase)

Le site dispose d'un **mode simulation complet** — aucune configuration Supabase nécessaire pour tester.

Sur la page `/connexion`, cliquez sur :
- **"Accès Candidat Démo"** → Espace candidat avec données fictives
- **"Accès Recruteur Démo"** → Espace recruteur avec données fictives

Les données sont stockées localement dans `localStorage` (aucune base de données requise).

---

## 🏗️ Architecture du projet

```
src/
├── components/
│   ├── site/
│   │   ├── AuthShell.tsx        # Layout connexion/inscription (split-screen)
│   │   ├── DashboardShell.tsx   # Layout sidebar des dashboards
│   │   ├── SiteHeader.tsx       # Navigation principale (scroll → bleue)
│   │   ├── SiteFooter.tsx       # Pied de page
│   │   ├── PostulerDialog.tsx   # Dialog candidature
│   │   └── OfferForm.tsx        # Formulaire offre d'emploi
│   └── ui/                      # Composants shadcn/ui
├── routes/
│   ├── index.tsx                # Page d'accueil (3 slides hero)
│   ├── offres.tsx               # Liste des offres
│   ├── offres.$offerId.tsx      # Détail d'une offre + postuler
│   ├── entreprises.tsx          # Liste des entreprises
│   ├── entreprises.$companyId.tsx # Fiche entreprise
│   ├── contact.tsx              # Page contact (map Abidjan)
│   ├── connexion.tsx            # Page connexion
│   ├── inscription.tsx          # Page inscription
│   └── _authenticated/
│       ├── candidat.index.tsx   # Dashboard candidat
│       ├── candidat.profil.tsx  # Profil candidat
│       ├── candidat.cv.tsx      # Gestion des CVs
│       ├── candidat.candidatures.tsx # Suivi candidatures
│       ├── candidat.messages.tsx     # Messagerie candidat
│       ├── recruteur.index.tsx       # Dashboard recruteur
│       ├── recruteur.entreprise.tsx  # Fiche entreprise
│       ├── recruteur.offres.tsx      # Gestion des offres
│       ├── recruteur.offres.nouvelle.tsx
│       ├── recruteur.offres.$offerId.tsx
│       ├── recruteur.candidatures.tsx # Gestion candidatures reçues
│       ├── recruteur.cvtheque.tsx     # CVthèque
│       ├── recruteur.favoris.tsx      # Candidats favoris
│       └── recruteur.messages.tsx    # Messagerie recruteur
├── lib/
│   ├── mockData.ts              # Données fictives complètes (demo mode)
│   ├── auth-context.tsx         # Gestion auth + mock auth
│   ├── candidate.ts             # Helpers candidat
│   └── recruiter.ts             # Helpers recruteur
└── styles.css                   # Design system (navy + rouge)
```

---

## 🛠️ Stack technique

| Technologie | Usage |
|-------------|-------|
| **React 18** | Framework UI |
| **TanStack Router** | Routing file-based |
| **Vite** | Build tool |
| **TypeScript** | Typage |
| **Tailwind CSS v4** | Styling |
| **shadcn/ui** | Composants UI |
| **Supabase** | Backend (auth, BDD, storage) |
| **Sonner** | Notifications toast |
| **Lucide React** | Icônes |

---

## 🗄️ Configuration Supabase

### Tables nécessaires

Le projet utilise les tables suivantes dans Supabase :

| Table | Description |
|-------|-------------|
| `profiles` | Profils utilisateurs (prénom, nom, téléphone) |
| `candidates` | Profils candidats (titre, bio, compétences) |
| `companies` | Fiches entreprises |
| `job_offers` | Offres d'emploi |
| `applications` | Candidatures |
| `cv_documents` | Documents CV |
| `messages` | Messagerie |
| `notifications` | Notifications in-app |
| `favorites` | Candidats favoris des recruteurs |

> 📁 Le schéma SQL complet est dans `supabase/` (si disponible) ou à recréer manuellement.

### Buckets Storage

- `cvs` — Stockage des fichiers CV (PDF/DOC)
- `company_logos` — Logos des entreprises

### Authentification

Activez dans Supabase > Authentication > Providers :
- **Email/Password** (obligatoire)
- **Google** (optionnel)

---

## 🎨 Design System

### Couleurs du thème

| Rôle | Couleur | HSL |
|------|---------|-----|
| **Primary** | Navy Blue (Kolori) | `hsl(219 51% 24%)` |
| **Accent** | Rouge Kolori | `hsl(359 70% 36%)` |
| **Background** | Blanc | `hsl(0 0% 100%)` |

### Polices

- **Titres** : Outfit (display)
- **Corps** : Inter (sans)
- **Monospace** : JetBrains Mono

---

## 📦 Scripts disponibles

```bash
npm run dev        # Serveur de développement (http://localhost:5173)
npm run build      # Build de production
npm run preview    # Prévisualiser le build
```

---

## 🚢 Déploiement

### Option 1 — Vercel (recommandé)

```bash
npm install -g vercel
vercel --prod
```

Ajoutez vos variables d'environnement dans Vercel Dashboard > Settings > Environment Variables.

### Option 2 — Netlify

```bash
npm run build
# Uploadez le dossier dist/ sur Netlify
```

### Option 3 — Hébergement classique

```bash
npm run build
# Le dossier dist/ contient les fichiers statiques
```

---

## 🔄 Continuer le développement

### Fonctionnalités à implémenter

- [ ] **Paiement** — Abonnements recruteurs (Cinetpay / Wave CI)
- [ ] **Notifications email** — Via Supabase Edge Functions + Resend
- [ ] **Tests psychométriques** — Module d'évaluation candidats
- [ ] **Tableau de bord admin** — Validation entreprises, modération
- [ ] **Mobile responsive** — Amélioration sur petits écrans
- [ ] **Recherche avancée** — Filtres secteur, salaire, contrat
- [ ] **Export PDF** — Génération de rapports recruteurs
- [ ] **Multi-langue** — Français / Anglais

### Variables d'env pour la production

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
```

---

## 📝 Données de démonstration

Le mode démo inclut :
- **5 entreprises** ivoiriennes fictives (Ivory Tech, BCI Finance, SCI Immobilier...)
- **6 offres d'emploi** (DRH, Développeur Full-Stack, Comptable...)
- **3 candidats** avec profils complets
- **Messagerie** simulée entre recruteur et candidat
- **Historique candidatures** avec statuts progressifs

---

## 🤝 Contribution

1. Forkez le repo
2. Créez une branche : `git checkout -b feature/ma-fonctionnalite`
3. Committez : `git commit -m "feat: description"`
4. Pushez : `git push origin feature/ma-fonctionnalite`
5. Ouvrez une Pull Request

---

## 📄 Licence

MIT © 2026 Kolori RH — Abidjan, Côte d'Ivoire
