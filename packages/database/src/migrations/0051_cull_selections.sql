CREATE TABLE IF NOT EXISTS "cull_selections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id"),
  "shoot_label" text NOT NULL,
  "r2_key" text NOT NULL,
  "filename" text NOT NULL,
  "decision" text NOT NULL DEFAULT 'pending',
  "star_rating" integer NOT NULL DEFAULT 0,
  "notes" text,
  "decided_by" uuid REFERENCES "users"("id"),
  "decided_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "cull_selections_tenant_shoot_idx" ON "cull_selections" ("tenant_id", "shoot_label");
CREATE UNIQUE INDEX IF NOT EXISTS "cull_selections_tenant_r2key_idx" ON "cull_selections" ("tenant_id", "r2_key");
