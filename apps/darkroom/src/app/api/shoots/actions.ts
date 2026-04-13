"use server";

import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSessionUser } from "@/lib/auth";

function getR2Client() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials not configured");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function getBucketName() {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error("R2_BUCKET_NAME not configured");
  return bucket;
}

export interface ShootFolder {
  label: string;
  subfolders: {
    name: string;
    fileCount: number;
    totalSizeBytes: number;
  }[];
  totalFiles: number;
  totalSizeBytes: number;
}

export async function listShootFolders(): Promise<ShootFolder[]> {
  await getSessionUser();

  const s3 = getR2Client();
  const bucket = getBucketName();

  // List top-level prefixes under shoots/
  const result = await s3.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: "shoots/",
      Delimiter: "/",
    })
  );

  const prefixes = (result.CommonPrefixes ?? [])
    .map((p) => p.Prefix)
    .filter((p): p is string => !!p)
    .map((p) => p.replace("shoots/", "").replace(/\/$/, ""))
    .filter((p) => p.length > 0)
    .sort()
    .reverse(); // newest first (date-prefixed)

  const folders: ShootFolder[] = [];

  for (const label of prefixes) {
    const subfolderNames = ["catalog", "raw", "gallery"];
    const subfolders: ShootFolder["subfolders"] = [];

    for (const sub of subfolderNames) {
      const subPrefix = `shoots/${label}/${sub}/`;
      let fileCount = 0;
      let totalSize = 0;
      let token: string | undefined;

      do {
        const subResult = await s3.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: subPrefix,
            ContinuationToken: token,
          })
        );

        for (const obj of subResult.Contents ?? []) {
          if (obj.Key?.endsWith("/.keep")) continue;
          fileCount++;
          totalSize += obj.Size ?? 0;
        }

        token = subResult.NextContinuationToken;
      } while (token);

      subfolders.push({ name: sub, fileCount, totalSizeBytes: totalSize });
    }

    folders.push({
      label,
      subfolders,
      totalFiles: subfolders.reduce((s, f) => s + f.fileCount, 0),
      totalSizeBytes: subfolders.reduce((s, f) => s + f.totalSizeBytes, 0),
    });
  }

  return folders;
}

export async function getShootFiles(shootLabel: string, subfolder: string) {
  await getSessionUser();

  const s3 = getR2Client();
  const bucket = getBucketName();
  const prefix = `shoots/${shootLabel}/${subfolder}/`;

  const files: { key: string; filename: string; size: number; lastModified: string | null }[] = [];
  let token: string | undefined;

  do {
    const result = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: token,
      })
    );

    for (const obj of result.Contents ?? []) {
      if (!obj.Key || obj.Key.endsWith("/.keep")) continue;
      files.push({
        key: obj.Key,
        filename: obj.Key.split("/").pop() ?? obj.Key,
        size: obj.Size ?? 0,
        lastModified: obj.LastModified?.toISOString() ?? null,
      });
    }

    token = result.NextContinuationToken;
  } while (token);

  return files.sort((a, b) => a.filename.localeCompare(b.filename));
}
