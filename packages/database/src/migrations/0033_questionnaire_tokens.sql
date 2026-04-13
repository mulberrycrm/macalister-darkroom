-- Questionnaire tokens for pre-fill and contact linking
CREATE TABLE IF NOT EXISTS public.questionnaire_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  questionnaire_id uuid NOT NULL REFERENCES public.questionnaires(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_questionnaire_tokens_token ON public.questionnaire_tokens(token);
CREATE INDEX idx_questionnaire_tokens_questionnaire_id ON public.questionnaire_tokens(questionnaire_id);
CREATE UNIQUE INDEX idx_questionnaire_tokens_q_contact ON public.questionnaire_tokens(questionnaire_id, contact_id);
