"use server";

import { supabase } from "@crm/database/rest-client";
import { getSessionUser } from "@/lib/auth";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

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

export interface ImagenJob {
  id: string;
  shootLabel: string;
  status: "pending" | "uploading" | "processing" | "downloading" | "complete" | "error";
  totalFiles: number;
  processedFiles: number;
  profileName: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * List RAW files in a shoot's catalog/ folder that could be sent to Imagen
 */
export async function listRawsForImagen(shootLabel: string) {
  await getSessionUser();

  const s3 = getR2Client();
  const prefix = `shoots/${shootLabel}/catalog/`;
  const files: { key: string; filename: string; size: number }[] = [];
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
      // RAW formats + DNG
      if (
        lower.endsWith(".cr3") || lower.endsWith(".cr2") ||
        lower.endsWith(".raf") || lower.endsWith(".arw") ||
        lower.endsWith(".nef") || lower.endsWith(".dng") ||
        lower.endsWith(".orf") || lower.endsWith(".rw2")
      ) {
        files.push({
          key: obj.Key,
          filename: obj.Key.split("/").pop() ?? obj.Key,
          size: obj.Size ?? 0,
        });
      }
    }
    token = result.NextContinuationToken;
  } while (token);

  return files.sort((a, b) => a.filename.localeCompare(b.filename));
}

/**
 * List Imagen jobs from the database
 */
export async function listImagenJobs(): Promise<ImagenJob[]> {
  const user = await getSessionUser();

  const { data, error } = await supabase
    .from("imagen_jobs")
    .select("*")
    .eq("tenant_id", user.tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    // Table may not exist yet — return empty
    console.warn("[listImagenJobs] Query failed (table may not exist):", error.message);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    shootLabel: row.shoot_label,
    status: row.status,
    totalFiles: row.total_files,
    processedFiles: row.processed_files,
    profileName: row.profile_name,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Submit a shoot to Imagen AI for processing.
 * TODO: Implement actual Imagen API integration when API docs/credentials are available.
 *
 * Expected flow:
 * 1. Upload RAW files to Imagen API
 * 2. Apply selected AI profile
 * 3. Poll for completion
 * 4. Download XMP sidecar files
 * 5. Save XMP files to R2: shoots/{label}/catalog/{filename}.xmp
 * 6. Update status in database
 * 7. Notify SM that editing is complete
 */
export async function submitToImagen(
  shootLabel: string,
  profileName: string
): Promise<{ jobId: string }> {
  const user = await getSessionUser();

  // Check for RAW files
  const rawFiles = await listRawsForImagen(shootLabel);
  if (rawFiles.length === 0) {
    throw new Error(`No RAW files found in shoots/${shootLabel}/catalog/`);
  }

  // TODO: Create actual Imagen API job
  // For now, create a tracking record in pending state
  const { data, error } = await supabase
    .from("imagen_jobs")
    .insert({
      tenant_id: user.tenantId,
      shoot_label: shootLabel,
      status: "pending",
      total_files: rawFiles.length,
      processed_files: 0,
      profile_name: profileName,
    })
    .select()
    .single();

  if (error) {
    console.error("[submitToImagen] Failed to create job:", error);
    throw new Error("Failed to create Imagen job. The imagen_jobs table may not exist yet.");
  }

  // TODO: Start actual upload to Imagen API
  // await uploadToImagenAPI(rawFiles, profileName);

  return { jobId: data.id };
}
