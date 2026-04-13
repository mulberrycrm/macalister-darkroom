-- Email Templates for Gallery and other communications

CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  slug text NOT NULL,
  name text NOT NULL,
  subject text NOT NULL,
  body_html text NOT NULL,
  body_text text,
  category text NOT NULL DEFAULT 'gallery', -- 'gallery', 'booking', 'general', etc.
  variables text[] DEFAULT ARRAY[]::text[], -- Template variable names like {{firstName}}, {{galleryUrl}}
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_templates_tenant_id ON public.email_templates(tenant_id);
CREATE INDEX idx_email_templates_category ON public.email_templates(category);
CREATE UNIQUE INDEX idx_email_templates_tenant_slug ON public.email_templates(tenant_id, slug);

-- RLS Policies
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Email templates readable by tenant" ON public.email_templates
  FOR SELECT
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "Email templates insertable by tenant" ON public.email_templates
  FOR INSERT
  WITH CHECK (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "Email templates updatable by tenant" ON public.email_templates
  FOR UPDATE
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "Email templates deletable by tenant" ON public.email_templates
  FOR DELETE
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);
