-- ============================================================
-- MIGRATION DE CORRECTION : colonnes manquantes (idempotente)
-- À exécuter dans l'éditeur SQL de Supabase si les migrations
-- précédentes n'ont pas encore été appliquées.
-- ============================================================

-- ---- TABLE: profiles ----------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='fonction') THEN
    ALTER TABLE public.profiles ADD COLUMN fonction TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='linkedin') THEN
    ALTER TABLE public.profiles ADD COLUMN linkedin TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='date_naissance') THEN
    ALTER TABLE public.profiles ADD COLUMN date_naissance DATE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='whatsapp') THEN
    ALTER TABLE public.profiles ADD COLUMN whatsapp TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='sexe') THEN
    ALTER TABLE public.profiles ADD COLUMN sexe TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='nationalite') THEN
    ALTER TABLE public.profiles ADD COLUMN nationalite TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='adresse') THEN
    ALTER TABLE public.profiles ADD COLUMN adresse TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='permis_conduire') THEN
    ALTER TABLE public.profiles ADD COLUMN permis_conduire TEXT;
  END IF;
END $$;

-- ---- TABLE: companies ----------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='companies' AND column_name='pays') THEN
    ALTER TABLE public.companies ADD COLUMN pays TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='companies' AND column_name='adresse') THEN
    ALTER TABLE public.companies ADD COLUMN adresse TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='companies' AND column_name='nombre_employes') THEN
    ALTER TABLE public.companies ADD COLUMN nombre_employes INTEGER;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='companies' AND column_name='annee_creation') THEN
    ALTER TABLE public.companies ADD COLUMN annee_creation INTEGER;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='companies' AND column_name='networks') THEN
    ALTER TABLE public.companies ADD COLUMN networks JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='companies' AND column_name='registre_commerce') THEN
    ALTER TABLE public.companies ADD COLUMN registre_commerce TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='companies' AND column_name='numero_fiscal') THEN
    ALTER TABLE public.companies ADD COLUMN numero_fiscal TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='companies' AND column_name='docs_complementaires') THEN
    ALTER TABLE public.companies ADD COLUMN docs_complementaires TEXT[];
  END IF;
END $$;

-- ---- TABLE: candidates ----------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='candidates' AND column_name='metier_recherche') THEN
    ALTER TABLE public.candidates ADD COLUMN metier_recherche TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='candidates' AND column_name='certifications') THEN
    ALTER TABLE public.candidates ADD COLUMN certifications JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='candidates' AND column_name='niveau_etudes') THEN
    ALTER TABLE public.candidates ADD COLUMN niveau_etudes TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='candidates' AND column_name='formations') THEN
    ALTER TABLE public.candidates ADD COLUMN formations JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='candidates' AND column_name='interets') THEN
    ALTER TABLE public.candidates ADD COLUMN interets TEXT[] DEFAULT '{}';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='candidates' AND column_name='mobilite') THEN
    ALTER TABLE public.candidates ADD COLUMN mobilite JSONB DEFAULT '{"demenagement": false, "teletravail": false, "etranger": false}'::jsonb;
  END IF;
END $$;

-- ---- TABLE: job_offers ----------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='job_offers' AND column_name='departement') THEN
    ALTER TABLE public.job_offers ADD COLUMN departement TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='job_offers' AND column_name='missions_principales') THEN
    ALTER TABLE public.job_offers ADD COLUMN missions_principales TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='job_offers' AND column_name='responsabilites') THEN
    ALTER TABLE public.job_offers ADD COLUMN responsabilites TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='job_offers' AND column_name='objectifs') THEN
    ALTER TABLE public.job_offers ADD COLUMN objectifs TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='job_offers' AND column_name='niveau_etudes_min') THEN
    ALTER TABLE public.job_offers ADD COLUMN niveau_etudes_min TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='job_offers' AND column_name='experience_min') THEN
    ALTER TABLE public.job_offers ADD COLUMN experience_min INTEGER;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='job_offers' AND column_name='competences_souhaitees') THEN
    ALTER TABLE public.job_offers ADD COLUMN competences_souhaitees TEXT[] DEFAULT '{}';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='job_offers' AND column_name='certifications_souhaitees') THEN
    ALTER TABLE public.job_offers ADD COLUMN certifications_souhaitees TEXT[] DEFAULT '{}';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='job_offers' AND column_name='langues_souhaitees') THEN
    ALTER TABLE public.job_offers ADD COLUMN langues_souhaitees TEXT[] DEFAULT '{}';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='job_offers' AND column_name='date_limite') THEN
    ALTER TABLE public.job_offers ADD COLUMN date_limite DATE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='job_offers' AND column_name='salaire_texte') THEN
    ALTER TABLE public.job_offers ADD COLUMN salaire_texte TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='job_offers' AND column_name='avantages') THEN
    ALTER TABLE public.job_offers ADD COLUMN avantages TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='job_offers' AND column_name='horaires') THEN
    ALTER TABLE public.job_offers ADD COLUMN horaires TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='job_offers' AND column_name='criteres_ia') THEN
    ALTER TABLE public.job_offers ADD COLUMN criteres_ia JSONB DEFAULT '{"ponderation": {"competences": 50, "experience": 25, "formation": 15, "langues": 5, "certifications": 5}}'::jsonb;
  END IF;
END $$;
