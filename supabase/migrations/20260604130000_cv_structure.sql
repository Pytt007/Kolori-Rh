-- Migration to add rich CV fields to profiles and candidates

ALTER TABLE public.profiles
ADD COLUMN whatsapp TEXT,
ADD COLUMN date_naissance DATE,
ADD COLUMN sexe TEXT,
ADD COLUMN nationalite TEXT,
ADD COLUMN adresse TEXT,
ADD COLUMN permis_conduire TEXT;

ALTER TABLE public.candidates
ADD COLUMN metier_recherche TEXT,
ADD COLUMN certifications JSONB DEFAULT '[]'::jsonb,
ADD COLUMN interets TEXT[] DEFAULT '{}',
ADD COLUMN mobilite JSONB DEFAULT '{"demenagement": false, "teletravail": false, "etranger": false}'::jsonb;
