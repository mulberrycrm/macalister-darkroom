"use server";

import { supabase } from "@crm/database/rest-client";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";

function transformGallery(row: Record<string, any>) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    contactId: row.contact_id,
    projectId: row.project_id,
    slug: row.slug,
    title: row.title,
    galleryType: row.gallery_type ?? "other",
    coverImageUrl: row.cover_image_url,
    hasPassword: row.password !== null,
    isPublished: row.is_published,
    allowDownload: row.allow_download,
    viewCount: row.view_count,
    accentColor: row.accent_color,
    firstViewedAt: row.first_viewed_at ? new Date(row.first_viewed_at) : null,
    createdAt: row.created_at ? new Date(row.created_at) : null,
  };
}

function transformSection(row: Record<string, any>) {
  return {
    id: row.id,
    galleryId: row.gallery_id,
    title: row.title,
    sortOrder: row.sort_order,
    createdAt: row.created_at ? new Date(row.created_at) : null,
  };
}

function transformPhoto(row: Record<string, any>) {
  return {
    id: row.id,
    sectionId: row.section_id,
    r2Key: row.r2_key,
    url: row.url,
    thumbnailUrl: row.thumbnail_url,
    width: row.width,
    height: row.height,
    isHero: row.is_hero,
    sortOrder: row.sort_order,
    originalFilename: row.original_filename,
    starRating: row.star_rating ?? 0,
    isPortfolio: row.is_portfolio ?? false,
    caption: row.caption,
    createdAt: row.created_at ? new Date(row.created_at) : null,
  };
}

export async function getGalleryWithSections(galleryId: string) {
  const user = await getSessionUser();

  const { data: galleries, error: galleryError } = await supabase
    .from("galleries")
    .select("*")
    .eq("id", galleryId)
    .eq("tenant_id", user.tenantId)
    .limit(1);

  if (galleryError) throw galleryError;
  if (!galleries || galleries.length === 0) throw new Error("Gallery not found");

  const gallery = transformGallery(galleries[0]);

  const { data: sections, error: sectionsError } = await supabase
    .from("gallery_sections")
    .select("*")
    .eq("gallery_id", galleryId)
    .order("sort_order", { ascending: true });

  if (sectionsError) throw sectionsError;

  const sectionIds = (sections ?? []).map((s) => s.id);
  let allPhotos: any[] = [];
  if (sectionIds.length > 0) {
    const { data: photos, error: photosError } = await supabase
      .from("gallery_photos")
      .select("*")
      .in("section_id", sectionIds)
      .order("sort_order", { ascending: true });

    if (photosError) throw photosError;
    allPhotos = photos ?? [];
  }

  const photosBySection = new Map<string, any[]>();
  for (const photo of allPhotos) {
    const sid = photo.section_id;
    if (!photosBySection.has(sid)) photosBySection.set(sid, []);
    photosBySection.get(sid)!.push(transformPhoto(photo));
  }

  const sectionsWithPhotos = (sections ?? []).map((section) => ({
    ...transformSection(section),
    photos: photosBySection.get(section.id) ?? [],
  }));

  return { ...gallery, sections: sectionsWithPhotos };
}

export async function updateGallery(
  galleryId: string,
  updates: {
    title?: string;
    galleryType?: string;
    isPublished?: boolean;
    allowDownload?: boolean;
    coverImageUrl?: string | null;
    accentColor?: string | null;
    projectId?: string | null;
    contactId?: string | null;
  }
) {
  const user = await getSessionUser();

  const dbUpdates: Record<string, any> = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.galleryType !== undefined) dbUpdates.gallery_type = updates.galleryType;
  if (updates.isPublished !== undefined) dbUpdates.is_published = updates.isPublished;
  if (updates.allowDownload !== undefined) dbUpdates.allow_download = updates.allowDownload;
  if (updates.coverImageUrl !== undefined) dbUpdates.cover_image_url = updates.coverImageUrl;
  if (updates.accentColor !== undefined) dbUpdates.accent_color = updates.accentColor;
  if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId;
  if (updates.contactId !== undefined) dbUpdates.contact_id = updates.contactId;

  const { error } = await supabase
    .from("galleries")
    .update(dbUpdates)
    .eq("id", galleryId)
    .eq("tenant_id", user.tenantId);

  if (error) throw new Error("Failed to update gallery");

  revalidatePath("/galleries");
  revalidatePath(`/galleries/${galleryId}`);
}

export async function addSection(galleryId: string, title: string) {
  const user = await getSessionUser();

  // Verify ownership
  const { data: galleries } = await supabase
    .from("galleries")
    .select("id")
    .eq("id", galleryId)
    .eq("tenant_id", user.tenantId)
    .limit(1);

  if (!galleries || galleries.length === 0) throw new Error("Gallery not found");

  // Get next sort order
  const { data: existing } = await supabase
    .from("gallery_sections")
    .select("sort_order")
    .eq("gallery_id", galleryId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("gallery_sections")
    .insert({ gallery_id: galleryId, title, sort_order: nextOrder })
    .select();

  if (error) throw new Error("Failed to create section");
  if (!data || data.length === 0) throw new Error("Failed to create section");

  revalidatePath("/galleries");
  revalidatePath(`/galleries/${galleryId}`);
  return transformSection(data[0]);
}

export async function deleteSection(sectionId: string) {
  const user = await getSessionUser();

  const { data: sections } = await supabase
    .from("gallery_sections")
    .select("gallery_id")
    .eq("id", sectionId)
    .limit(1);

  if (!sections || sections.length === 0) throw new Error("Section not found");
  const galleryId = sections[0].gallery_id;

  // Verify ownership
  const { data: galleries } = await supabase
    .from("galleries")
    .select("id")
    .eq("id", galleryId)
    .eq("tenant_id", user.tenantId)
    .limit(1);

  if (!galleries || galleries.length === 0) throw new Error("Gallery not found");

  const { error } = await supabase
    .from("gallery_sections")
    .delete()
    .eq("id", sectionId);

  if (error) throw new Error("Failed to delete section");

  revalidatePath("/galleries");
  revalidatePath(`/galleries/${galleryId}`);
}

export async function deletePhoto(photoId: string) {
  await getSessionUser();

  const { error } = await supabase
    .from("gallery_photos")
    .delete()
    .eq("id", photoId);

  if (error) throw new Error("Failed to delete photo");

  revalidatePath("/galleries");
}

export async function deletePhotos(photoIds: string[]) {
  await getSessionUser();

  const { error } = await supabase
    .from("gallery_photos")
    .delete()
    .in("id", photoIds);

  if (error) throw new Error("Failed to delete photos");

  revalidatePath("/galleries");
}

export async function clearAllPhotos(galleryId: string) {
  const user = await getSessionUser();

  // Verify ownership
  const { data: galleries } = await supabase
    .from("galleries")
    .select("id")
    .eq("id", galleryId)
    .eq("tenant_id", user.tenantId)
    .limit(1);

  if (!galleries || galleries.length === 0) throw new Error("Gallery not found");

  // Get all section IDs
  const { data: sections } = await supabase
    .from("gallery_sections")
    .select("id")
    .eq("gallery_id", galleryId);

  if (!sections || sections.length === 0) return;

  const sectionIds = sections.map((s) => s.id);

  const { error } = await supabase
    .from("gallery_photos")
    .delete()
    .in("section_id", sectionIds);

  if (error) throw new Error("Failed to clear photos");

  revalidatePath("/galleries");
  revalidatePath(`/galleries/${galleryId}`);
}

export async function listProjects(filter?: { projectType?: string }) {
  const user = await getSessionUser();

  let query = supabase
    .from("projects")
    .select("id, name, contact_id, contacts:contact_id(display_name)")
    .eq("tenant_id", user.tenantId)
    .order("created_at", { ascending: false });

  if (filter?.projectType) {
    query = query.eq("project_type", filter.projectType);
  }

  const { data, error } = await query;
  if (error) throw new Error("Failed to list projects");

  return (data ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    contactName: p.contacts?.display_name ?? "",
  }));
}
