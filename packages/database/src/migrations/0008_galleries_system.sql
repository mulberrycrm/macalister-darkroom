-- Galleries system tables for photo gallery management and analytics

-- Main galleries table
CREATE TABLE galleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

  -- Core gallery metadata
  slug VARCHAR(255) NOT NULL UNIQUE,
  title TEXT NOT NULL,
  cover_image_url TEXT,

  -- Security and access control
  password TEXT,  -- Hashed bcrypt password (NULL = no password)
  is_published BOOLEAN NOT NULL DEFAULT false,
  allow_download BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,

  -- Customization
  accent_color TEXT,  -- Hex color for UI branding

  -- Analytics
  view_count INTEGER NOT NULL DEFAULT 0,
  first_viewed_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Gallery sections (grouping photos within a gallery)
CREATE TABLE gallery_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,

  -- Section metadata
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Gallery photos (individual photos)
CREATE TABLE gallery_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES gallery_sections(id) ON DELETE CASCADE,

  -- Image storage
  r2_key TEXT NOT NULL,  -- Cloudflare R2 object key
  url TEXT NOT NULL,  -- Public URL to image
  thumbnail_url TEXT,  -- Optional thumbnail URL

  -- Image metadata
  width INTEGER,
  height INTEGER,
  caption TEXT,  -- Optional photo description

  -- Display control
  is_hero BOOLEAN NOT NULL DEFAULT false,  -- Featured photo for section
  sort_order INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Gallery favorites (client-side bookmarks)
CREATE TABLE gallery_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES gallery_photos(id) ON DELETE CASCADE,

  -- Client tracking
  session_id TEXT NOT NULL,  -- Browser session identifier

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

  -- Uniqueness constraint
  UNIQUE(gallery_id, photo_id, session_id)
);

-- Gallery analytics (event tracking)
CREATE TABLE gallery_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  photo_id UUID REFERENCES gallery_photos(id) ON DELETE SET NULL,

  -- Event type
  event TEXT NOT NULL CHECK (event IN ('view', 'download', 'favorite', 'share')),

  -- Client tracking
  session_id TEXT,
  client_email TEXT,  -- Optional email if provided

  -- Additional metadata (IP, user agent, etc.)
  metadata JSONB,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Indexes for performance
-- Galleries: fast lookup by tenant and slug
CREATE INDEX galleries_tenant_id_idx ON galleries(tenant_id);
CREATE INDEX galleries_tenant_slug_idx ON galleries(tenant_id, slug);
CREATE INDEX galleries_is_published_idx ON galleries(is_published);
CREATE INDEX galleries_contact_id_idx ON galleries(contact_id);
CREATE INDEX galleries_project_id_idx ON galleries(project_id);
CREATE INDEX galleries_created_at_idx ON galleries(created_at);

-- Gallery sections: fast lookup by gallery
CREATE INDEX gallery_sections_gallery_id_idx ON gallery_sections(gallery_id);

-- Gallery photos: fast lookup by section and gallery
CREATE INDEX gallery_photos_section_id_idx ON gallery_photos(section_id);
CREATE INDEX gallery_photos_created_at_idx ON gallery_photos(created_at);

-- Gallery favorites: fast lookup by gallery and photo
CREATE INDEX gallery_favorites_gallery_id_idx ON gallery_favorites(gallery_id);
CREATE INDEX gallery_favorites_photo_id_idx ON gallery_favorites(photo_id);
CREATE INDEX gallery_favorites_session_id_idx ON gallery_favorites(session_id);

-- Gallery analytics: fast lookup by gallery and event type
CREATE INDEX gallery_analytics_gallery_id_idx ON gallery_analytics(gallery_id);
CREATE INDEX gallery_analytics_event_idx ON gallery_analytics(event);
CREATE INDEX gallery_analytics_created_at_idx ON gallery_analytics(created_at);
CREATE INDEX gallery_analytics_session_id_idx ON gallery_analytics(session_id);

-- Row Level Security (RLS) Policies

-- Galleries: only allow access to own tenant's galleries
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;

CREATE POLICY galleries_tenant_isolation
  ON galleries FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (SELECT tenant_id FROM auth.jwt() ->> 'tenant_id')::uuid);

-- Gallery sections: restrict to galleries in own tenant
ALTER TABLE gallery_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY gallery_sections_tenant_isolation
  ON gallery_sections FOR ALL
  USING (
    gallery_id IN (
      SELECT id FROM galleries WHERE tenant_id = (SELECT tenant_id FROM auth.jwt() ->> 'tenant_id')::uuid
    )
  )
  WITH CHECK (
    gallery_id IN (
      SELECT id FROM galleries WHERE tenant_id = (SELECT tenant_id FROM auth.jwt() ->> 'tenant_id')::uuid
    )
  );

-- Gallery photos: restrict to galleries in own tenant
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY gallery_photos_tenant_isolation
  ON gallery_photos FOR ALL
  USING (
    section_id IN (
      SELECT id FROM gallery_sections WHERE gallery_id IN (
        SELECT id FROM galleries WHERE tenant_id = (SELECT tenant_id FROM auth.jwt() ->> 'tenant_id')::uuid
      )
    )
  )
  WITH CHECK (
    section_id IN (
      SELECT id FROM gallery_sections WHERE gallery_id IN (
        SELECT id FROM galleries WHERE tenant_id = (SELECT tenant_id FROM auth.jwt() ->> 'tenant_id')::uuid
      )
    )
  );

-- Gallery favorites: restrict to galleries in own tenant (or allow public for published galleries)
ALTER TABLE gallery_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY gallery_favorites_public_read
  ON gallery_favorites FOR SELECT
  USING (
    gallery_id IN (
      SELECT id FROM galleries WHERE is_published = true
    )
  );

CREATE POLICY gallery_favorites_tenant_write
  ON gallery_favorites FOR INSERT
  USING (
    gallery_id IN (
      SELECT id FROM galleries WHERE tenant_id = (SELECT tenant_id FROM auth.jwt() ->> 'tenant_id')::uuid
    )
  );

-- Gallery analytics: restrict to galleries in own tenant (or allow public for published galleries)
ALTER TABLE gallery_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY gallery_analytics_public_read
  ON gallery_analytics FOR SELECT
  USING (
    gallery_id IN (
      SELECT id FROM galleries WHERE is_published = true
    )
  );

CREATE POLICY gallery_analytics_tenant_write
  ON gallery_analytics FOR INSERT
  USING (
    gallery_id IN (
      SELECT id FROM galleries WHERE tenant_id = (SELECT tenant_id FROM auth.jwt() ->> 'tenant_id')::uuid
    )
  );
