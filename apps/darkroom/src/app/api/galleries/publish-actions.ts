"use server";

import { randomUUID } from "crypto";
import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { supabase } from "@crm/database/rest-client";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";

function getR2Client() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

const BUCKET = () => process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = () => process.env.R2_PUBLIC_URL!;

/**
 * List JPEGs in a shoot's gallery/ folder
 */
async function listShootPhotos(shootLabel: string) {
  const s3 = getR2Client();
  const prefix = `shoots/${shootLabel}/gallery/`;
  const photos: { key: string; filename: string; size: number }[] = [];
  let token: string | undefined;

  do {
    const result = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET(),
        Prefix: prefix,
        ContinuationToken: token,
      })
    );

    for (const obj of result.Contents ?? []) {
      if (!obj.Key || obj.Key.endsWith("/.keep")) continue;
      const lower = obj.Key.toLowerCase();
      if (!lower.endsWith(".jpg") && !lower.endsWith(".jpeg") && !lower.endsWith(".png") && !lower.endsWith(".webp")) continue;
      photos.push({
        key: obj.Key,
        filename: obj.Key.split("/").pop() ?? obj.Key,
        size: obj.Size ?? 0,
      });
    }

    token = result.NextContinuationToken;
  } while (token);

  return photos.sort((a, b) => a.filename.localeCompare(b.filename));
}

/**
 * Preview what would be imported
 */
export async function previewShootPublish(shootLabel: string) {
  await getSessionUser();
  if (!shootLabel || /[/\\]|\.\./.test(shootLabel) || shootLabel.trim().length < 3) {
    throw new Error("Invalid shoot label");
  }
  const photos = await listShootPhotos(shootLabel.trim());
  return {
    total: photos.length,
    files: photos.map((p) => ({
      filename: p.filename,
      sizeMb: Math.round((p.size / 1024 / 1024) * 10) / 10,
    })),
  };
}

/**
 * Publish photos from R2 shoot folder into a gallery.
 * Downloads each photo, copies to gallery path, inserts DB record.
 * Note: Sharp-based image processing (thumbnails, star ratings) requires
 * the sharp module — if unavailable, photos are imported as-is.
 */
export async function publishFromShoot(
  galleryId: string,
  shootLabel: string
): Promise<{ published: number; errors: string[] }> {
  const user = await getSessionUser();

  // Verify gallery ownership
  const { data: gallery } = await supabase
    .from("galleries")
    .select("id, tenant_id, slug")
    .eq("id", galleryId)
    .eq("tenant_id", user.tenantId)
    .limit(1)
    .single();

  if (!gallery) throw new Error("Gallery not found");

  if (!shootLabel || /[/\\]|\.\./.test(shootLabel) || shootLabel.trim().length < 3) {
    throw new Error("Invalid shoot label");
  }

  const shootPhotos = await listShootPhotos(shootLabel.trim());
  if (shootPhotos.length === 0) {
    throw new Error(`No photos found in shoots/${shootLabel}/gallery/`);
  }

  // Get or create default section
  const { data: sections } = await supabase
    .from("gallery_sections")
    .select("id")
    .eq("gallery_id", galleryId)
    .order("sort_order", { ascending: true })
    .limit(1);

  let sectionId: string;
  if (sections && sections.length > 0) {
    sectionId = sections[0].id;
  } else {
    const { data: newSection } = await supabase
      .from("gallery_sections")
      .insert({ gallery_id: galleryId, title: "Photos", sort_order: 0 })
      .select()
      .single();

    if (!newSection) throw new Error("Failed to create section");
    sectionId = newSection.id;
  }

  const s3 = getR2Client();
  const bucket = BUCKET();
  const publicUrl = PUBLIC_URL();
  let published = 0;
  const errors: string[] = [];

  // Try to load sharp for thumbnail generation
  let sharpModule: any = null;
  try {
    sharpModule = require("sharp");
  } catch {
    // Sharp not available — import without thumbnails
  }

  // Process 3 at a time
  for (let i = 0; i < shootPhotos.length; i += 3) {
    const batch = shootPhotos.slice(i, i + 3);

    const results = await Promise.allSettled(
      batch.map(async (photo, idx) => {
        // Download original
        const response = await s3.send(
          new GetObjectCommand({ Bucket: bucket, Key: photo.key })
        );
        if (!response.Body) throw new Error(`Empty body for ${photo.key}`);
        const buffer = Buffer.from(await response.Body.transformToByteArray());

        // Read star rating from XMP if sharp available
        let starRating = 0;
        let width = 0;
        let height = 0;

        if (sharpModule) {
          try {
            const meta = await sharpModule(buffer).metadata();
            width = meta.width ?? 0;
            height = meta.height ?? 0;
            if (meta.xmp) {
              const xmp = meta.xmp.toString("utf8");
              const match = xmp.match(/xmp:Rating="(\d+)"/) || xmp.match(/<xmp:Rating>(\d+)<\/xmp:Rating>/);
              if (match) starRating = parseInt(match[1], 10);
            }
          } catch { /* ignore */ }
        }

        const filename = photo.filename;
        const originalKey = `galleries/${galleryId}/original/${filename}`;
        const thumbKey = `galleries/${galleryId}/thumb/${filename}`;
        const cacheControl = "public, max-age=31536000, immutable";

        // Upload original
        await s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: originalKey,
            Body: buffer,
            ContentType: "image/jpeg",
            CacheControl: cacheControl,
          })
        );

        // Generate and upload thumbnail if sharp available
        let thumbUrl = `${publicUrl}/${originalKey}`;
        if (sharpModule) {
          try {
            const thumbResult = await sharpModule(buffer)
              .rotate()
              .resize(400, 400, { fit: "inside", withoutEnlargement: true })
              .jpeg({ quality: 85 })
              .toBuffer({ resolveWithObject: true });

            await s3.send(
              new PutObjectCommand({
                Bucket: bucket,
                Key: thumbKey,
                Body: thumbResult.data,
                ContentType: "image/jpeg",
                CacheControl: cacheControl,
              })
            );
            thumbUrl = `${publicUrl}/${thumbKey}`;
          } catch { /* use original as thumb */ }
        }

        // Insert DB record
        const { error: insertError } = await supabase
          .from("gallery_photos")
          .insert({
            section_id: sectionId,
            r2_key: originalKey,
            url: `${publicUrl}/${originalKey}`,
            thumbnail_url: thumbUrl,
            width,
            height,
            original_filename: filename,
            star_rating: starRating,
            is_portfolio: starRating >= 4,
            sort_order: i + idx,
            thumbnail_status: "complete",
          });

        if (insertError) throw insertError;

        return { filename, starRating };
      })
    );

    for (const [idx, result] of results.entries()) {
      if (result.status === "fulfilled") {
        published++;
        // Set first photo as cover
        if (published === 1) {
          const photo = batch[idx];
          await supabase
            .from("galleries")
            .update({
              cover_image_url: `${publicUrl}/galleries/${galleryId}/thumb/${photo.filename}`,
            })
            .eq("id", galleryId);
        }
      } else {
        const msg = result.reason instanceof Error ? result.reason.message : "Unknown error";
        errors.push(`${batch[idx]?.filename ?? "unknown"}: ${msg}`);
      }
    }
  }

  revalidatePath(`/galleries/${galleryId}`);
  revalidatePath("/galleries");
  revalidatePath("/portfolio");

  return { published, errors };
}
