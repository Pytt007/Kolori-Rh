
-- ============= ENUMS =============
CREATE TYPE public.app_role AS ENUM ('candidat', 'recruteur', 'admin');
CREATE TYPE public.company_status AS ENUM ('en_attente', 'validee', 'rejetee');
CREATE TYPE public.offer_status AS ENUM ('brouillon', 'publiee', 'suspendue', 'expiree');
CREATE TYPE public.contract_type AS ENUM ('CDI', 'CDD', 'Freelance', 'Stage', 'Alternance');
CREATE TYPE public.application_status AS ENUM ('brouillon','envoyee','recue','en_analyse','preselectionne','entretien','rejete','retenu');
CREATE TYPE public.document_type AS ENUM ('cv', 'lettre');

-- ============= PROFILES =============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT,
  prenom TEXT,
  telephone TEXT,
  photo_url TEXT,
  ville TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============= USER ROLES =============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS SETOF app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.user_roles WHERE user_id = _user_id $$;

-- ============= CANDIDATES =============
CREATE TABLE public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  titre TEXT,
  diplome TEXT,
  experiences JSONB DEFAULT '[]'::jsonb,
  competences TEXT[] DEFAULT '{}',
  langues JSONB DEFAULT '[]'::jsonb,
  pretention_salariale TEXT,
  disponibilite TEXT,
  bio TEXT,
  ville TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidates TO authenticated;
GRANT ALL ON public.candidates TO service_role;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- ============= CV DOCUMENTS =============
CREATE TABLE public.cv_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  nom_fichier TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  type document_type NOT NULL DEFAULT 'cv',
  taille INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cv_documents TO authenticated;
GRANT ALL ON public.cv_documents TO service_role;
ALTER TABLE public.cv_documents ENABLE ROW LEVEL SECURITY;

-- ============= COMPANIES =============
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  logo_url TEXT,
  secteur TEXT,
  description TEXT,
  localisation TEXT,
  site_web TEXT,
  statut company_status NOT NULL DEFAULT 'en_attente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT SELECT ON public.companies TO anon;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- ============= JOB OFFERS =============
CREATE TABLE public.job_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  contrat contract_type NOT NULL,
  secteur TEXT,
  localisation TEXT,
  teletravail TEXT,
  salaire_min INTEGER,
  salaire_max INTEGER,
  competences_requises TEXT[] DEFAULT '{}',
  statut offer_status NOT NULL DEFAULT 'brouillon',
  publiee_le TIMESTAMPTZ,
  expire_le TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_offers_statut ON public.job_offers(statut);
CREATE INDEX idx_offers_company ON public.job_offers(company_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_offers TO authenticated;
GRANT SELECT ON public.job_offers TO anon;
GRANT ALL ON public.job_offers TO service_role;
ALTER TABLE public.job_offers ENABLE ROW LEVEL SECURITY;

-- ============= APPLICATIONS =============
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  offer_id UUID NOT NULL REFERENCES public.job_offers(id) ON DELETE CASCADE,
  cv_id UUID REFERENCES public.cv_documents(id) ON DELETE SET NULL,
  lettre TEXT,
  statut application_status NOT NULL DEFAULT 'envoyee',
  notes_recruteur TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(candidate_id, offer_id)
);
CREATE INDEX idx_applications_offer ON public.applications(offer_id);
CREATE INDEX idx_applications_candidate ON public.applications(candidate_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- ============= FAVORITES =============
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(recruiter_id, candidate_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- ============= MESSAGES =============
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  contenu TEXT NOT NULL,
  lu BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============= NOTIFICATIONS =============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  titre TEXT NOT NULL,
  message TEXT,
  link TEXT,
  lu BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============= REFERENTIALS =============
CREATE TABLE public.referentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  valeur TEXT NOT NULL,
  ordre INTEGER NOT NULL DEFAULT 0,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(type, valeur)
);
GRANT SELECT ON public.referentials TO authenticated, anon;
GRANT ALL ON public.referentials TO service_role;
ALTER TABLE public.referentials ENABLE ROW LEVEL SECURITY;

-- ============= AUDIT LOG =============
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  ressource TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- ============= TRIGGERS =============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_candidates_updated BEFORE UPDATE ON public.candidates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_companies_updated BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_offers_updated BEFORE UPDATE ON public.job_offers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_applications_updated BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- handle_new_user : crée profil + rôle par défaut
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_role app_role;
BEGIN
  INSERT INTO public.profiles (id, nom, prenom)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'nom', NEW.raw_user_meta_data->>'prenom')
  ON CONFLICT (id) DO NOTHING;

  user_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'candidat');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, user_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  IF user_role = 'candidat' THEN
    INSERT INTO public.candidates (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============= RLS POLICIES =============

-- profiles
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- user_roles
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- candidates
CREATE POLICY "candidates_select_own_or_recruiter_or_admin" ON public.candidates FOR SELECT USING (
  auth.uid() = user_id OR public.has_role(auth.uid(), 'recruteur') OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "candidates_insert_own" ON public.candidates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "candidates_update_own" ON public.candidates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "candidates_delete_own_or_admin" ON public.candidates FOR DELETE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- cv_documents : owner ou recruteur ayant une candidature sur cette offre ou admin
CREATE POLICY "cv_select_own_or_admin" ON public.cv_documents FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.candidates c WHERE c.id = cv_documents.candidate_id AND c.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.job_offers o ON o.id = a.offer_id
    JOIN public.companies co ON co.id = o.company_id
    WHERE a.cv_id = cv_documents.id AND co.owner_id = auth.uid()
  )
);
CREATE POLICY "cv_insert_own" ON public.cv_documents FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.candidates c WHERE c.id = candidate_id AND c.user_id = auth.uid())
);
CREATE POLICY "cv_delete_own" ON public.cv_documents FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.candidates c WHERE c.id = cv_documents.candidate_id AND c.user_id = auth.uid())
);

-- companies
CREATE POLICY "companies_select_public_or_owner_or_admin" ON public.companies FOR SELECT USING (
  statut = 'validee' OR owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "companies_insert_recruiter" ON public.companies FOR INSERT WITH CHECK (
  auth.uid() = owner_id AND public.has_role(auth.uid(), 'recruteur')
);
CREATE POLICY "companies_update_owner_or_admin" ON public.companies FOR UPDATE USING (
  auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "companies_delete_admin" ON public.companies FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- job_offers
CREATE POLICY "offers_select_published_or_owner_or_admin" ON public.job_offers FOR SELECT USING (
  statut = 'publiee'
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.companies c WHERE c.id = job_offers.company_id AND c.owner_id = auth.uid())
);
CREATE POLICY "offers_insert_owner" ON public.job_offers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND c.owner_id = auth.uid() AND c.statut = 'validee')
);
CREATE POLICY "offers_update_owner_or_admin" ON public.job_offers FOR UPDATE USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.companies c WHERE c.id = job_offers.company_id AND c.owner_id = auth.uid())
);
CREATE POLICY "offers_delete_owner_or_admin" ON public.job_offers FOR DELETE USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.companies c WHERE c.id = job_offers.company_id AND c.owner_id = auth.uid())
);

-- applications
CREATE POLICY "apps_select_owner_recruiter_admin" ON public.applications FOR SELECT USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.candidates c WHERE c.id = applications.candidate_id AND c.user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.job_offers o
    JOIN public.companies co ON co.id = o.company_id
    WHERE o.id = applications.offer_id AND co.owner_id = auth.uid()
  )
);
CREATE POLICY "apps_insert_candidate" ON public.applications FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.candidates c WHERE c.id = candidate_id AND c.user_id = auth.uid())
);
CREATE POLICY "apps_update_owner_or_recruiter" ON public.applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.candidates c WHERE c.id = applications.candidate_id AND c.user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.job_offers o
    JOIN public.companies co ON co.id = o.company_id
    WHERE o.id = applications.offer_id AND co.owner_id = auth.uid()
  )
);
CREATE POLICY "apps_delete_own_or_admin" ON public.applications FOR DELETE USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.candidates c WHERE c.id = applications.candidate_id AND c.user_id = auth.uid())
);

-- favorites
CREATE POLICY "fav_select_own" ON public.favorites FOR SELECT USING (auth.uid() = recruiter_id);
CREATE POLICY "fav_insert_own" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = recruiter_id AND public.has_role(auth.uid(), 'recruteur'));
CREATE POLICY "fav_delete_own" ON public.favorites FOR DELETE USING (auth.uid() = recruiter_id);

-- messages
CREATE POLICY "msg_select_participant" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "msg_insert_sender" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "msg_update_recipient" ON public.messages FOR UPDATE USING (auth.uid() = recipient_id);

-- notifications
CREATE POLICY "notif_select_own" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_update_own" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- referentials
CREATE POLICY "ref_select_all" ON public.referentials FOR SELECT USING (true);
CREATE POLICY "ref_admin_all" ON public.referentials FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- audit_log
CREATE POLICY "audit_admin_select" ON public.audit_log FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "audit_insert_any" ON public.audit_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============= STORAGE BUCKETS =============
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('company_logos', 'company_logos', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('cvs', 'cvs', false) ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_upload_own" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "avatars_update_own" ON storage.objects FOR UPDATE USING (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "avatars_delete_own" ON storage.objects FOR DELETE USING (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "logos_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'company_logos');
CREATE POLICY "logos_upload_own" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'company_logos' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "logos_update_own" ON storage.objects FOR UPDATE USING (
  bucket_id = 'company_logos' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "cvs_select_owner_or_admin" ON storage.objects FOR SELECT USING (
  bucket_id = 'cvs' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'recruteur')
  )
);
CREATE POLICY "cvs_insert_own" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "cvs_delete_own" ON storage.objects FOR DELETE USING (
  bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============= SEED REFERENTIALS =============
INSERT INTO public.referentials (type, valeur, ordre) VALUES
  ('secteur', 'Technologie & Informatique', 1),
  ('secteur', 'Marketing & Communication', 2),
  ('secteur', 'Finance & Comptabilité', 3),
  ('secteur', 'Ressources Humaines', 4),
  ('secteur', 'Santé & Médical', 5),
  ('secteur', 'Vente & Commerce', 6),
  ('secteur', 'Industrie & Production', 7),
  ('secteur', 'Éducation & Formation', 8),
  ('localisation', 'Abidjan', 1),
  ('localisation', 'Bouaké', 2),
  ('localisation', 'Daloa', 3),
  ('localisation', 'Yamoussoukro', 4),
  ('localisation', 'San-Pédro', 5),
  ('localisation', 'Korhogo', 6),
  ('localisation', 'Man', 7),
  ('localisation', 'Télétravail', 8),
  ('contrat', 'CDI', 1),
  ('contrat', 'CDD', 2),
  ('contrat', 'Freelance', 3),
  ('contrat', 'Stage', 4),
  ('contrat', 'Alternance', 5)
ON CONFLICT DO NOTHING;
