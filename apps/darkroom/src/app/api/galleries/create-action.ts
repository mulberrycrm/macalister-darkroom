"use server";

import { supabase } from "@crm/database/rest-client";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";

export async function createGallery(input: {
  title: string;
  slug: string;
  galleryType?: string;
  projectId?: string;
  password?: string;
}) {
  const user = await getSessionUser();

  // Check slug uniqueness
  const { data: existing } = await supabase
    .from("galleries")
    .select("id")
    .eq("tenant_id", user.tenantId)
    .eq("slug", input.slug)
    .limit(1);

  if (existing && existing.length > 0) {
    throw new Error("A gallery with this slug already exists");
  }

  // Hash password if provided
  let hashedPassword: string | null = null;
  if (input.password) {
    const { default: bcryptjs } = await import("bcryptjs");
    hashedPassword = await bcryptjs.hash(input.password, 10);
  }

  const { data, error } = await supabase
    .from("galleries")
    .insert({
      tenant_id: user.tenantId,
      title: input.title,
      slug: input.slug,
      gallery_type: input.galleryType ?? "other",
      project_id: input.projectId ?? null,
      password: hashedPassword,
    })
    .select();

  if (error) {
    console.error("[Darkroom:createGallery] Failed:", error);
    throw new Error("Failed to create gallery");
  }

  if (!data || data.length === 0) throw new Error("Failed to create gallery");

  revalidatePath("/galleries");

  return { id: data[0].id, slug: data[0].slug };
}
