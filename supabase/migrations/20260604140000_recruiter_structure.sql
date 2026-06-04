-- Migration to add rich recruiter and company fields, verification docs, and advanced job offer criteria
ALTER TABLE public.profiles
ADD COLUMN fonction TEXT,
ADD COLUMN linkedin TEXT;

ALTER TABLE public.companies
ADD COLUMN pays TEXT,
ADD COLUMN adresse TEXT,
ADD COLUMN nombre_employes INTEGER,
ADD COLUMN annee_creation INTEGER,
ADD COLUMN networks JSONB DEFAULT '{}'::jsonb,
ADD COLUMN registre_commerce TEXT,
ADD COLUMN numero_fiscal TEXT,
ADD COLUMN docs_complementaires TEXT[];

ALTER TABLE public.job_offers
ADD COLUMN departement TEXT,
ADD COLUMN missions_principales TEXT,
ADD COLUMN responsabilites TEXT,
ADD COLUMN objectifs TEXT,
ADD COLUMN niveau_etudes_min TEXT,
ADD COLUMN experience_min INTEGER,
ADD COLUMN competences_souhaitees TEXT[] DEFAULT '{}',
ADD COLUMN certifications_souhaitees TEXT[] DEFAULT '{}',
ADD COLUMN langues_souhaitees TEXT[] DEFAULT '{}',
ADD COLUMN date_limite DATE,
ADD COLUMN salaire_texte TEXT,
ADD COLUMN avantages TEXT,
ADD COLUMN horaires TEXT,
ADD COLUMN criteres_ia JSONB DEFAULT '{"ponderation": {"competences": 50, "experience": 25, "formation": 15, "langues": 5, "certifications": 5}}'::jsonb;
