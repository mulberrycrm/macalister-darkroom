"use server";

import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { supabase } from "@crm/database/rest-client";
import { getSessionUser } from "@/lib/auth";

function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

const BUCKET = () => process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = () => process.env.R2_PUBLIC_URL!;

export interface CullPhoto {
  r2Key: string;
  filename: string;
  url: string;
  size: number;
  decision: "pending" | "keep" | "reject" | "maybe";
  starRating: number;
  notes: string | null;
}

/**
 * Load all photos from a shoot's catalog/ or gallery/ folder for culling,
 * merged with any existing decisions from the database.
 */
export async function loadShootForCulling(
  shootLabel: string,
  subfolder: "catalog" | "gallery" = "gallery"
): Promise<{ photos: CullPhoto[]; shootLabel: string }> {
  const user = await getSessionUser();

  if (!shootLabel || /[/\\]|\.\./.test(shootLabel)) {
    throw new Error("Invalid shoot label");
  }

  const s3 = getR2Client();
  const prefix = `shoots/${shootLabel}/${subfolder}/`;
  const publicUrl = PUBLIC_URL();
  const photos: { r2Key: string; filename: string; size: number }[] = [];
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
      if (
        !lower.endsWith(".jpg") &&
        !lower.endsWith(".jpeg") &&
        !lower.endsWith(".png") &&
        !lower.endsWith(".webp") &&
        !lower.endsWith(".cr3") &&
        !lower.endsWith(".raf") &&
        !lower.endsWith(".arw")
      ) continue;

      photos.push({
        r2Key: obj.Key,
        filename: obj.Key.split("/").pop() ?? obj.Key,
        size: obj.Size ?? 0,
      });
    }

    token = result.NextContinuationToken;
  } while (token);

  photos.sort((a, b) => a.filename.localeCompare(b.filename));

  // Load existing decisions
  const r2Keys = photos.map((p) => p.r2Key);
  let decisions = new Map<string, { decision: string; starRating: number; notes: string | null }>();

  if (r2Keys.length > 0) {
    // Batch query in chunks of 100
    for (let i = 0; i < r2Keys.length; i += 100) {
      const chunk = r2Keys.slice(i, i + 100);
      const { data } = await supabase
        .from("cull_selections")
        .select("r2_key, decision, star_rating, notes")
        .eq("tenant_id", user.tenantId)
        .in("r2_key", chunk);

      for (const row of data ?? []) {
        decisions.set(row.r2_key, {
          decision: row.decision,
          starRating: row.star_rating,
          notes: row.notes,
        });
      }
    }
  }

  return {
    shootLabel,
    photos: photos.map((p) => {
      const d = decisions.get(p.r2Key);
      return {
        r2Key: p.r2Key,
        filename: p.filename,
        url: `${publicUrl}/${p.r2Key}`,
        size: p.size,
        decision: (d?.decision as CullPhoto["decision"]) ?? "pending",
        starRating: d?.starRating ?? 0,
        notes: d?.notes ?? null,
      };
    }),
  };
}

/**
 * Save a culling decision for a photo.
 */
export async function saveCullDecision(
  r2Key: string,
  shootLabel: string,
  decision: "pending" | "keep" | "reject" | "maybe",
  starRating: number = 0,
  notes: string | null = null
) {
  const user = await getSessionUser();
  const filename = r2Key.split("/").pop() ?? r2Key;

  const { error } = await supabase
    .from("cull_selections")
    .upsert(
      {
        tenant_id: user.tenantId,
        r2_key: r2Key,
        shoot_label: shootLabel,
        filename,
        decision,
        star_rating: Math.min(5, Math.max(0, starRating)),
        notes,
        decided_by: user.id,
        decided_at: decision !== "pending" ? new Date().toISOString() : null,
      },
      { onConflict: "tenant_id,r2_key" }
    );

  if (error) {
    console.error("[saveCullDecision] Failed:", error);
    throw new Error("Failed to save decision");
  }
}

/**
 * Batch save star ratings (e.g., from keyboard rapid-fire rating)
 */
export async function batchSaveRatings(
  shootLabel: string,
  ratings: { r2Key: string; starRating: number }[]
) {
  const user = await getSessionUser();

  for (const { r2Key, starRating } of ratings) {
    const filename = r2Key.split("/").pop() ?? r2Key;
    await supabase
      .from("cull_selections")
      .upsert(
        {
          tenant_id: user.tenantId,
          r2_key: r2Key,
          shoot_label: shootLabel,
          filename,
          star_rating: Math.min(5, Math.max(0, starRating)),
          decided_by: user.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "tenant_id,r2_key" }
      );
  }
}

/**
 * Get culling summary for a shoot
 */
export async function getCullingSummary(shootLabel: string) {
  const user = await getSessionUser();

  const { data } = await supabase
    .from("cull_selections")
    .select("decision")
    .eq("tenant_id", user.tenantId)
    .eq("shoot_label", shootLabel);

  const counts = { pending: 0, keep: 0, reject: 0, maybe: 0 };
  for (const row of data ?? []) {
    const d = row.decision as keyof typeof counts;
    if (d in counts) counts[d]++;
  }

  return { total: (data ?? []).length, ...counts };
}
