-- ============================================================
-- AI RECRUITMENT ASSISTANT — Table de résultats d'analyses IA
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_candidacy_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.job_offers(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE SET NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  match_level TEXT NOT NULL CHECK (match_level IN ('excellent', 'moyen', 'faible')),
  summary TEXT NOT NULL DEFAULT '',
  strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
  weaknesses JSONB NOT NULL DEFAULT '[]'::jsonb,
  anomalies JSONB NOT NULL DEFAULT '[]'::jsonb,
  interview_questions JSONB NOT NULL DEFAULT '{}'::jsonb,
  mode TEXT NOT NULL DEFAULT 'candidatures',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(offer_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_analyses_offer ON public.ai_candidacy_analyses(offer_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_candidate ON public.ai_candidacy_analyses(candidate_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_candidacy_analyses TO authenticated;
GRANT ALL ON public.ai_candidacy_analyses TO service_role;
ALTER TABLE public.ai_candidacy_analyses ENABLE ROW LEVEL SECURITY;

-- Seul le propriétaire de l'offre (ou son entreprise) peut lire/écrire les analyses IA
CREATE POLICY "recruiters_manage_their_own_ai_analyses"
  ON public.ai_candidacy_analyses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.job_offers o
      JOIN public.companies c ON c.id = o.company_id
      WHERE o.id = ai_candidacy_analyses.offer_id AND c.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.job_offers o
      JOIN public.companies c ON c.id = o.company_id
      WHERE o.id = ai_candidacy_analyses.offer_id AND c.owner_id = auth.uid()
    )
  );
