import { supabase } from "@crm/database/rest-client";
import { getSessionUser } from "@/lib/auth";
import { PortfolioClient } from "./portfolio-client";

async function getPortfolioPhotos() {
  const user = await getSessionUser();

  // Get all galleries for tenant
  const { data: galleries } = await supabase
    .from("galleries")
    .select("id, title, slug")
    .eq("tenant_id", user.tenantId);

  if (!galleries || galleries.length === 0) return [];

  const galleryIds = galleries.map((g) => g.id);
  const galleryMap = new Map(galleries.map((g) => [g.id, g]));

  // Get sections for these galleries
  const { data: sections } = await supabase
    .from("gallery_sections")
    .select("id, gallery_id")
    .in("gallery_id", galleryIds);

  if (!sections || sections.length === 0) return [];

  const sectionIds = sections.map((s) => s.id);
  const sectionToGallery = new Map(sections.map((s) => [s.id, s.gallery_id]));

  // Get portfolio photos (4-5 stars)
  const { data: photos } = await supabase
    .from("gallery_photos")
    .select("*")
    .in("section_id", sectionIds)
    .eq("is_portfolio", true)
    .order("star_rating", { ascending: false });

  return (photos ?? []).map((p) => {
    const galleryId = sectionToGallery.get(p.section_id) ?? "";
    const gallery = galleryMap.get(galleryId);
    return {
      id: p.id,
      url: p.url,
      thumbnailUrl: p.thumbnail_url,
      width: p.width,
      height: p.height,
      originalFilename: p.original_filename,
      starRating: p.star_rating ?? 0,
      galleryId,
      galleryTitle: gallery?.title ?? "Unknown",
      gallerySlug: gallery?.slug ?? "",
    };
  });
}

export default async function PortfolioPage() {
  const photos = await getPortfolioPhotos();

  return (
    <div className="p-6">
      <PortfolioClient photos={photos} />
    </div>
  );
}
