-- Client Questionnaires
-- Public forms for collecting client preferences and information during booking

CREATE TABLE IF NOT EXISTS public.questionnaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  description text,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_questionnaires_tenant_id ON public.questionnaires(tenant_id);
CREATE INDEX idx_questionnaires_project_id ON public.questionnaires(project_id);
CREATE UNIQUE INDEX idx_questionnaires_tenant_slug ON public.questionnaires(tenant_id, slug);

CREATE TABLE IF NOT EXISTS public.questionnaire_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id uuid NOT NULL REFERENCES public.questionnaires(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_questionnaire_responses_questionnaire_id ON public.questionnaire_responses(questionnaire_id);
CREATE INDEX idx_questionnaire_responses_contact_id ON public.questionnaire_responses(contact_id);

-- RLS Policies
ALTER TABLE public.questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Questionnaires readable by tenant" ON public.questionnaires
  FOR SELECT
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "Questionnaires insertable by tenant" ON public.questionnaires
  FOR INSERT
  WITH CHECK (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "Questionnaires updatable by tenant" ON public.questionnaires
  FOR UPDATE
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

-- Responses accessible by tenant (tenant can view all responses) and by anon with correct slug (write-only)
CREATE POLICY "Responses readable by tenant" ON public.questionnaire_responses
  FOR SELECT
  USING (
    (auth.jwt()->>'tenant_id')::uuid = (
      SELECT tenant_id FROM public.questionnaires WHERE id = questionnaire_id
    )
  );

CREATE POLICY "Responses insertable by anyone" ON public.questionnaire_responses
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Responses updatable by tenant" ON public.questionnaire_responses
  FOR UPDATE
  USING (
    (auth.jwt()->>'tenant_id')::uuid = (
      SELECT tenant_id FROM public.questionnaires WHERE id = questionnaire_id
    )
  )
  WITH CHECK (
    (auth.jwt()->>'tenant_id')::uuid = (
      SELECT tenant_id FROM public.questionnaires WHERE id = questionnaire_id
    )
  );
