-- ============= EXTENSIONS =============
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

-- ============= ADVANCED AUDIT LOG =============
CREATE TABLE IF NOT EXISTS public.audit_log_advanced (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_role TEXT,
  action TEXT NOT NULL,          -- ex: 'user.suspend', 'company.approve', 'offer.create'
  ressource TEXT NOT NULL,       -- ex: 'profiles', 'companies', 'job_offers'
  ressource_id TEXT,             -- ID de l'entité modifiée
  payload_before JSONB,          -- État avant modification
  payload_after JSONB,           -- État après modification
  client_ip TEXT,                -- IP de l'auteur
  user_agent TEXT,               -- Agent utilisateur
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_action ON public.audit_log_advanced(action);
CREATE INDEX IF NOT EXISTS idx_audit_ressource ON public.audit_log_advanced(ressource, ressource_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_log_advanced(created_at DESC);

-- Grant permissions for advanced audit logs
GRANT SELECT, INSERT ON public.audit_log_advanced TO authenticated;
GRANT ALL ON public.audit_log_advanced TO service_role;
ALTER TABLE public.audit_log_advanced ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to advanced audit logs"
  ON public.audit_log_advanced
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============= FRAUD ALERTS =============
CREATE TABLE IF NOT EXISTS public.fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,                -- 'duplicate_candidate', 'duplicate_company', 'suspicious_offer'
  ressource_id TEXT NOT NULL,        -- ID de l'entité (candidat, entreprise, offre)
  score INTEGER NOT NULL,            -- Score de risque/similarité de 0 à 100
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  statut TEXT NOT NULL DEFAULT 'nouveau', -- 'nouveau', 'en_cours', 'resolu', 'ignore'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fraud_alerts_type ON public.fraud_alerts(type);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_statut ON public.fraud_alerts(statut);

GRANT SELECT, INSERT, UPDATE ON public.fraud_alerts TO authenticated;
GRANT ALL ON public.fraud_alerts TO service_role;
ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to fraud alerts"
  ON public.fraud_alerts
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Recruiters can view risk scores for their own offers"
  ON public.fraud_alerts
  FOR SELECT
  TO authenticated
  USING (
    type = 'suspicious_offer' AND 
    EXISTS (
      SELECT 1 FROM public.job_offers o
      JOIN public.companies c ON c.id = o.company_id
      WHERE o.id::text = ressource_id AND c.owner_id = auth.uid()
    )
  );

-- ============= FRAUD DETECTION FUNCTIONS =============

-- 1. Candidate similarity score
CREATE OR REPLACE FUNCTION public.calculate_candidate_similarity(
  p_nom1 TEXT, p_prenom1 TEXT, p_tel1 TEXT, p_dnaiss1 DATE,
  p_nom2 TEXT, p_prenom2 TEXT, p_tel2 TEXT, p_dnaiss2 DATE
) RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
BEGIN
  -- Match exact sur téléphone (+40 points)
  IF p_tel1 IS NOT NULL AND p_tel1 <> '' AND p_tel1 = p_tel2 THEN
    score := score + 40;
  END IF;

  -- Match exact sur date de naissance (+20 points)
  IF p_dnaiss1 IS NOT NULL AND p_dnaiss1 = p_dnaiss2 THEN
    score := score + 20;
  END IF;

  -- Similarité sur le Nom (+20 points max)
  IF p_nom1 IS NOT NULL AND p_nom2 IS NOT NULL THEN
    IF levenshtein(lower(p_nom1), lower(p_nom2)) <= 2 THEN
      score := score + 20;
    ELSIF levenshtein(lower(p_nom1), lower(p_nom2)) <= 4 THEN
      score := score + 10;
    END IF;
  END IF;

  -- Similarité sur le Prénom (+20 points max)
  IF p_prenom1 IS NOT NULL AND p_prenom2 IS NOT NULL THEN
    IF levenshtein(lower(p_prenom1), lower(p_prenom2)) <= 2 THEN
      score := score + 20;
    ELSIF levenshtein(lower(p_prenom1), lower(p_prenom2)) <= 4 THEN
      score := score + 10;
    END IF;
  END IF;

  RETURN score;
END;
$$ LANGUAGE plpgsql;

-- 2. Company similarity score
CREATE OR REPLACE FUNCTION public.calculate_company_similarity(
  p_nom1 TEXT, p_email1 TEXT, p_rccm1 TEXT, p_tel1 TEXT,
  p_nom2 TEXT, p_email2 TEXT, p_rccm2 TEXT, p_tel2 TEXT
) RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
BEGIN
  -- Match exact RCCM (+50 points)
  IF p_rccm1 IS NOT NULL AND p_rccm1 <> '' AND p_rccm1 = p_rccm2 THEN
    score := score + 50;
  END IF;

  -- Match exact téléphone (+20 points)
  IF p_tel1 IS NOT NULL AND p_tel1 <> '' AND p_tel1 = p_tel2 THEN
    score := score + 20;
  END IF;

  -- Match email domaine (+15 points)
  IF p_email1 IS NOT NULL AND p_email2 IS NOT NULL THEN
    DECLARE
      dom1 TEXT := split_part(p_email1, '@', 2);
      dom2 TEXT := split_part(p_email2, '@', 2);
    BEGIN
      IF dom1 = dom2 AND dom1 NOT IN ('gmail.com', 'yahoo.com', 'yahoo.fr', 'hotmail.com', 'hotmail.fr', 'outlook.com', 'outlook.fr', 'live.com', 'live.fr', 'icloud.com') THEN
        score := score + 15;
      END IF;
    END;
  END IF;

  -- Similarité Nom (+15 points max)
  IF p_nom1 IS NOT NULL AND p_nom2 IS NOT NULL THEN
    IF levenshtein(lower(p_nom1), lower(p_nom2)) <= 2 THEN
      score := score + 15;
    ELSIF levenshtein(lower(p_nom1), lower(p_nom2)) <= 4 THEN
      score := score + 8;
    END IF;
  END IF;

  RETURN score;
END;
$$ LANGUAGE plpgsql;

-- 3. Suspicious Job Offer risk score
CREATE OR REPLACE FUNCTION public.calculate_offer_risk_score(
  p_description TEXT, p_titre TEXT
) RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  forbidden_words TEXT[] := ARRAY['argent facile', 'gagner vite', 'sans experience', 'revenu garanti', 'recrutement immediat', 'travailler a domicile', 'whatsapp direct', 'bitcoin', 'crypto'];
  word TEXT;
BEGIN
  -- Description trop courte (+20 points)
  IF char_length(p_description) < 150 THEN
    score := score + 20;
  END IF;

  -- Mots interdits (+25 points par occurrence, max 50)
  FOREACH word IN ARRAY forbidden_words
  LOOP
    IF lower(p_description) LIKE '%' || word || '%' OR lower(p_titre) LIKE '%' || word || '%' THEN
      score := score + 25;
    END IF;
  END LOOP;

  -- Liens externes suspects (+20 points)
  IF p_description ~ 'bit\.ly|t\.co|tinyurl|wa\.me' THEN
    score := score + 20;
  END IF;

  -- Répétition excessive de points d'exclamation (+15 points)
  IF char_length(p_description) - char_length(replace(p_description, '!', '')) > 5 THEN
    score := score + 15;
  END IF;

  RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql;

-- ============= TRIGGERS DE SECURITE & FRAUDE =============

-- Trigger Company Fraud Check
CREATE OR REPLACE FUNCTION public.trg_check_company_fraud()
RETURNS TRIGGER AS $$
DECLARE
  r RECORD;
  sim_score INTEGER;
  email_new TEXT;
  tel_new TEXT;
  email_r TEXT;
  tel_r TEXT;
BEGIN
  -- Get email and phone for NEW company owner
  SELECT email, telephone INTO email_new, tel_new FROM public.profiles WHERE id = NEW.owner_id;

  FOR r IN (
    SELECT * FROM public.companies WHERE id <> NEW.id
  ) LOOP
    SELECT email, telephone INTO email_r, tel_r FROM public.profiles WHERE id = r.owner_id;
    
    sim_score := public.calculate_company_similarity(
      NEW.nom, email_new, NEW.registre_commerce, tel_new,
      r.nom, email_r, r.registre_commerce, tel_r
    );
    
    IF sim_score >= 50 THEN
      INSERT INTO public.fraud_alerts (type, ressource_id, score, details)
      VALUES (
        'duplicate_company',
        NEW.id::text,
        sim_score,
        jsonb_build_object(
          'duplicate_with_id', r.id,
          'duplicate_with_name', r.nom,
          'similarity_score', sim_score
        )
      );
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_company_fraud_check
  AFTER INSERT OR UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.trg_check_company_fraud();

-- Trigger Candidate Fraud Check
CREATE OR REPLACE FUNCTION public.trg_check_candidate_fraud()
RETURNS TRIGGER AS $$
DECLARE
  r RECORD;
  sim_score INTEGER;
  p_new RECORD;
BEGIN
  SELECT * INTO p_new FROM public.profiles WHERE id = NEW.user_id;
  
  FOR r IN (
    SELECT c.*, p.nom, p.prenom, p.telephone, p.date_naissance FROM public.candidates c
    JOIN public.profiles p ON p.id = c.user_id
    WHERE c.id <> NEW.id
  ) LOOP
    sim_score := public.calculate_candidate_similarity(
      p_new.nom, p_new.prenom, p_new.telephone, p_new.date_naissance,
      r.nom, r.prenom, r.telephone, r.date_naissance
    );
    
    IF sim_score >= 60 THEN
      INSERT INTO public.fraud_alerts (type, ressource_id, score, details)
      VALUES (
        'duplicate_candidate',
        NEW.id::text,
        sim_score,
        jsonb_build_object(
          'duplicate_with_candidate_id', r.id,
          'duplicate_with_name', r.prenom || ' ' || r.nom,
          'similarity_score', sim_score
        )
      );
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_candidate_fraud_check
  AFTER INSERT OR UPDATE ON public.candidates
  FOR EACH ROW EXECUTE FUNCTION public.trg_check_candidate_fraud();

-- Trigger Offer Risk Check
CREATE OR REPLACE FUNCTION public.trg_check_offer_fraud()
RETURNS TRIGGER AS $$
DECLARE
  v_risk INTEGER;
BEGIN
  v_risk := public.calculate_offer_risk_score(NEW.description, NEW.titre);
  
  IF v_risk > 30 THEN
    -- Supprimer l'ancienne alerte pour cette offre si existante
    DELETE FROM public.fraud_alerts WHERE type = 'suspicious_offer' AND ressource_id = NEW.id::text;
    
    INSERT INTO public.fraud_alerts (type, ressource_id, score, details)
    VALUES (
      'suspicious_offer',
      NEW.id::text,
      v_risk,
      jsonb_build_object(
        'title', NEW.titre,
        'risk_score', v_risk
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_offer_fraud_check
  AFTER INSERT OR UPDATE ON public.job_offers
  FOR EACH ROW EXECUTE FUNCTION public.trg_check_offer_fraud();

-- ============= STATE MACHINES AND BUSINESS RULES =============

-- Enforce company status transition rules
CREATE OR REPLACE FUNCTION public.trg_enforce_company_status()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.statut <> NEW.statut THEN
    -- Transitions autorisées
    IF OLD.statut = 'en_attente' AND NEW.statut NOT IN ('en_attente', 'validee', 'rejetee') THEN
      RAISE EXCEPTION 'Transition de statut d''entreprise invalide.';
    END IF;
    
    -- Si suspendue, suspendre toutes les offres publiées
    IF NEW.statut = 'rejetee' OR NEW.statut = 'en_attente' THEN
      UPDATE public.job_offers SET statut = 'suspendue' WHERE company_id = NEW.id AND statut = 'publiee';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_company_status_control
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.trg_enforce_company_status();

-- ============= AI MATCHING CALCULATION FUNCTION =============
CREATE OR REPLACE FUNCTION public.calculate_matching_score(
  p_offer_id UUID,
  p_candidate_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_offer RECORD;
  v_candidate RECORD;
  v_profile RECORD;
  v_score_skills NUMERIC := 100;
  v_score_exp NUMERIC := 100;
  v_score_edu NUMERIC := 100;
  v_score_lang NUMERIC := 100;
  v_score_cert NUMERIC := 100;
  v_final_score INTEGER := 0;
  
  v_w_skills INTEGER := 50;
  v_w_exp INTEGER := 25;
  v_w_edu INTEGER := 15;
  v_w_lang INTEGER := 5;
  v_w_cert INTEGER := 5;
  
  v_checked_req_skills TEXT[] := '{}';
  v_missing_req_skills TEXT[] := '{}';
  v_matched_skills TEXT[] := '{}';
  v_missing_skills TEXT[] := '{}';
  
  v_strengths TEXT[] := '{}';
  v_weaknesses TEXT[] := '{}';
  
  v_req_exp INTEGER := 0;
  v_cand_exp INTEGER := 0;
  v_req_edu TEXT := 'Aucun';
  v_cand_edu TEXT := 'Aucun';
  
  v_req_langs TEXT[] := '{}';
  v_cand_langs TEXT[] := '{}';
  
  v_req_certs TEXT[] := '{}';
  v_cand_certs TEXT[] := '{}';
  
  edu_map JSONB := '{"Aucun": 0, "Bac": 1, "Bac+2": 2, "Bac+3": 3, "Bac+4": 4, "Bac+5": 5, "Bac+8": 6}'::jsonb;
  v_req_edu_val INTEGER := 0;
  v_cand_edu_val INTEGER := 0;
BEGIN
  -- 1. Fetch Job Offer and Candidate / Profile records
  SELECT * INTO v_offer FROM public.job_offers WHERE id = p_offer_id;
  SELECT * INTO v_candidate FROM public.candidates WHERE id = p_candidate_id;
  SELECT * INTO v_profile FROM public.profiles WHERE id = v_candidate.user_id;
  
  IF v_offer IS NULL OR v_candidate IS NULL THEN
    RETURN jsonb_build_object('error', 'Offre ou candidat introuvable');
  END IF;
  
  -- 2. Extract IA weightings
  IF v_offer.criteres_ia IS NOT NULL AND v_offer.criteres_ia ? 'ponderation' THEN
    v_w_skills := COALESCE((v_offer.criteres_ia->'ponderation'->>'competences')::integer, 50);
    v_w_exp := COALESCE((v_offer.criteres_ia->'ponderation'->>'experience')::integer, 25);
    v_w_edu := COALESCE((v_offer.criteres_ia->'ponderation'->>'formation')::integer, 15);
    v_w_lang := COALESCE((v_offer.criteres_ia->'ponderation'->>'langues')::integer, 5);
    v_w_cert := COALESCE((v_offer.criteres_ia->'ponderation'->>'certifications')::integer, 5);
  END IF;

  -- 3. Calculate Skills score
  -- Competences requises (indispensables)
  IF array_length(v_offer.competences_requises, 1) > 0 THEN
    SELECT ARRAY(
      SELECT s FROM unnest(v_offer.competences_requises) s
      WHERE s = ANY(v_candidate.competences)
    ) INTO v_checked_req_skills;
    
    SELECT ARRAY(
      SELECT s FROM unnest(v_offer.competences_requises) s
      WHERE NOT (s = ANY(v_candidate.competences))
    ) INTO v_missing_req_skills;
  END IF;
  
  -- Competences souhaitees (bonus)
  IF array_length(v_offer.competences_souhaitees, 1) > 0 THEN
    SELECT ARRAY(
      SELECT s FROM unnest(v_offer.competences_souhaitees) s
      WHERE s = ANY(v_candidate.competences)
    ) INTO v_matched_skills;
    
    SELECT ARRAY(
      SELECT s FROM unnest(v_offer.competences_souhaitees) s
      WHERE NOT (s = ANY(v_candidate.competences))
    ) INTO v_missing_skills;
  END IF;
  
  DECLARE
    req_len INTEGER := COALESCE(array_length(v_offer.competences_requises, 1), 0);
    des_len INTEGER := COALESCE(array_length(v_offer.competences_souhaitees, 1), 0);
    req_pct NUMERIC := 100;
    des_pct NUMERIC := 100;
  BEGIN
    IF req_len > 0 THEN
      req_pct := (array_length(v_checked_req_skills, 1)::numeric / req_len) * 100;
    END IF;
    IF des_len > 0 THEN
      des_pct := (array_length(v_matched_skills, 1)::numeric / des_len) * 100;
    END IF;
    
    IF req_len > 0 AND des_len > 0 THEN
      v_score_skills := (req_pct * 0.7) + (des_pct * 0.3);
    ELSIF req_len > 0 THEN
      v_score_skills := req_pct;
    ELSIF des_len > 0 THEN
      v_score_skills := des_pct;
    ELSE
      v_score_skills := 100;
    END IF;
  END;
  
  -- Strengths & Weaknesses skills diagnostic
  IF array_length(v_checked_req_skills, 1) > 0 THEN
    v_strengths := array_cat(v_strengths, ARRAY['Possède des compétences indispensables clés : ' || array_to_string(v_checked_req_skills, ', ')]);
  END IF;
  IF array_length(v_missing_req_skills, 1) > 0 THEN
    v_weaknesses := array_cat(v_weaknesses, ARRAY['Manque des compétences requises : ' || array_to_string(v_missing_req_skills, ', ')]);
  END IF;

  -- 4. Experience Score
  v_req_exp := COALESCE(v_offer.experience_min, 0);
  -- Cumulate candidate experience months
  DECLARE
    exp_record RECORD;
    total_months INTEGER := 0;
  BEGIN
    IF v_candidate.experiences IS NOT NULL AND jsonb_array_length(v_candidate.experiences) > 0 THEN
      FOR exp_record IN (
        SELECT 
          (val->>'debut') as debut, 
          (val->>'fin') as fin, 
          (val->>'actuel')::boolean as actuel
        FROM jsonb_array_elements(v_candidate.experiences) as val
      ) LOOP
        DECLARE
          d_start DATE := COALESCE(exp_record.debut::date, CURRENT_DATE);
          d_end DATE := CASE WHEN exp_record.actuel THEN CURRENT_DATE ELSE COALESCE(exp_record.fin::date, CURRENT_DATE) END;
        BEGIN
          total_months := total_months + ((extract(year from d_end) - extract(year from d_start)) * 12 + (extract(month from d_end) - extract(month from d_start)))::integer;
        EXCEPTION WHEN OTHERS THEN
          total_months := total_months + 12;
        END;
      END LOOP;
    END IF;
    
    v_cand_exp := total_months / 12;
  END;

  IF v_req_exp > 0 THEN
    IF v_cand_exp >= v_req_exp THEN
      v_score_exp := 100;
      v_strengths := array_cat(v_strengths, ARRAY['Expérience professionnelle suffisante (' || v_cand_exp || ' ans pour ' || v_req_exp || ' ans requis)']);
    ELSE
      v_score_exp := (v_cand_exp::numeric / v_req_exp) * 100;
      v_weaknesses := array_cat(v_weaknesses, ARRAY['Expérience inférieure aux attentes (' || v_cand_exp || ' ans pour ' || v_req_exp || ' ans requis)']);
    END IF;
  ELSE
    v_score_exp := 100;
  END IF;

  -- 5. Education Score
  v_req_edu := COALESCE(v_offer.niveau_etudes_min, 'Aucun');
  v_cand_edu := COALESCE(v_candidate.diplome, 'Aucun');
  
  v_req_edu_val := COALESCE((edu_map->>v_req_edu)::integer, 0);
  v_cand_edu_val := COALESCE((edu_map->>v_cand_edu)::integer, 0);
  
  IF v_req_edu_val > 0 THEN
    IF v_cand_edu_val >= v_req_edu_val THEN
      v_score_edu := 100;
      v_strengths := array_cat(v_strengths, ARRAY['Niveau d''études adéquat (' || v_cand_edu || ')']);
    ELSE
      v_score_edu := v_cand_edu_val::numeric / v_req_edu_val * 100;
      v_weaknesses := array_cat(v_weaknesses, ARRAY['Diplôme inférieur à celui demandé (' || v_cand_edu || ' pour ' || v_req_edu || ' requis)']);
    END IF;
  ELSE
    v_score_edu := 100;
  END IF;

  -- 6. Languages & Certifications
  v_req_langs := COALESCE(v_offer.langues_souhaitees, '{}');
  IF array_length(v_req_langs, 1) > 0 AND v_candidate.langues IS NOT NULL THEN
    DECLARE
      lang_item RECORD;
      matched_langs_count INTEGER := 0;
    BEGIN
      FOR lang_item IN (
        SELECT (val->>'langue') as langue FROM jsonb_array_elements(v_candidate.langues) val
      ) LOOP
        IF lang_item.langue = ANY(v_req_langs) THEN
          matched_langs_count := matched_langs_count + 1;
        END IF;
      END LOOP;
      v_score_lang := (matched_langs_count::numeric / array_length(v_req_langs, 1)) * 100;
    END;
  ELSE
    v_score_lang := 100;
  END IF;
  
  v_req_certs := COALESCE(v_offer.certifications_souhaitees, '{}');
  IF array_length(v_req_certs, 1) > 0 THEN
    v_score_cert := 50; -- default simulator placeholder
  ELSE
    v_score_cert := 100;
  END IF;

  -- 7. Final Score
  v_final_score := round(
    ((v_score_skills * v_w_skills) +
    (v_score_exp * v_w_exp) +
    (v_score_edu * v_w_edu) +
    (v_score_lang * v_w_lang) +
    (v_score_cert * v_w_cert)) / 100
  )::integer;

  RETURN jsonb_build_object(
    'score', v_final_score,
    'matched_skills', array_to_json(v_checked_req_skills),
    'missing_skills', array_to_json(v_missing_req_skills),
    'strengths', array_to_json(v_strengths),
    'weaknesses', array_to_json(v_weaknesses)
  );
END;
$$ LANGUAGE plpgsql;
