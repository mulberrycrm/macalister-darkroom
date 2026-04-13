"use server";

import { supabase } from "@crm/database/rest-client";
import { getSessionUser } from "@/lib/auth";

function transformGallery(row: Record<string, any>) {
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    galleryType: (row.gallery_type ?? "other") as string,
    coverImageUrl: row.cover_image_url as string | null,
    hasPassword: row.password !== null,
    isPublished: row.is_published as boolean,
    allowDownload: row.allow_download as boolean,
    viewCount: row.view_count as number,
    projectId: row.project_id as string | null,
    contactId: row.contact_id as string | null,
    createdAt: row.created_at ? new Date(row.created_at) : null,
  };
}

export async function listGalleries() {
  const user = await getSessionUser();

  const { data, error } = await supabase
    .from("galleries")
    .select("*")
    .eq("tenant_id", user.tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Darkroom:listGalleries] Failed:", error);
    throw new Error("Failed to load galleries");
  }

  return data?.map(transformGallery) ?? [];
}

export async function getGalleryPhotoCounts() {
  const user = await getSessionUser();

  // Get all galleries for this tenant
  const { data: galleries } = await supabase
    .from("galleries")
    .select("id")
    .eq("tenant_id", user.tenantId);

  if (!galleries || galleries.length === 0) return {};

  const galleryIds = galleries.map((g) => g.id);

  // Get sections for these galleries
  const { data: sections } = await supabase
    .from("gallery_sections")
    .select("id, gallery_id")
    .in("gallery_id", galleryIds);

  if (!sections || sections.length === 0) return {};

  const sectionIds = sections.map((s) => s.id);

  // Count photos per section
  const { data: photos } = await supabase
    .from("gallery_photos")
    .select("id, section_id")
    .in("section_id", sectionIds);

  // Map section_id -> gallery_id, then count per gallery
  const sectionToGallery = new Map(sections.map((s) => [s.id, s.gallery_id]));
  const counts: Record<string, number> = {};

  for (const photo of photos ?? []) {
    const galleryId = sectionToGallery.get(photo.section_id);
    if (galleryId) {
      counts[galleryId] = (counts[galleryId] ?? 0) + 1;
    }
  }

  return counts;
}
