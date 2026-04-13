import { getSessionUser } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await getSessionUser();

  const r2Endpoint = process.env.CLOUDFLARE_ACCOUNT_ID
    ? `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : "Not configured";
  const bucketName = process.env.R2_BUCKET_NAME ?? "Not configured";

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-1">Settings</h1>
      <p className="text-sm text-white/40 mb-6">Editor setup and configuration</p>

      {/* Mountain Duck / Cyberduck */}
      <div className="space-y-6">
        <div className="rounded-lg border border-white/[0.07] bg-dark-surface/50 p-5">
          <h2 className="text-sm font-semibold text-white/80 mb-3">Mountain Duck / Cyberduck</h2>
          <p className="text-xs text-white/40 mb-4">
            Use Mountain Duck to mount R2 as a drive. Editors (Eri) can drag-and-drop
            edited JPEGs directly into the shoot's gallery/ folder.
          </p>
          <div className="space-y-3 font-mono text-xs">
            <div>
              <label className="block text-white/50 mb-1">Protocol</label>
              <div className="bg-dark-bg border border-white/[0.05] rounded px-3 py-2 text-white/70">
                S3 (Amazon S3 compatible)
              </div>
            </div>
            <div>
              <label className="block text-white/50 mb-1">Server</label>
              <div className="bg-dark-bg border border-white/[0.05] rounded px-3 py-2 text-white/70 select-all">
                {r2Endpoint}
              </div>
            </div>
            <div>
              <label className="block text-white/50 mb-1">Bucket</label>
              <div className="bg-dark-bg border border-white/[0.05] rounded px-3 py-2 text-white/70 select-all">
                {bucketName}
              </div>
            </div>
            <div>
              <label className="block text-white/50 mb-1">Path</label>
              <div className="bg-dark-bg border border-white/[0.05] rounded px-3 py-2 text-white/70">
                shoots/
              </div>
            </div>
            <p className="text-white/30 text-[10px]">
              Access Key and Secret provided separately — do not share in Darkroom.
            </p>
          </div>
        </div>

        {/* rclone config */}
        <div className="rounded-lg border border-white/[0.07] bg-dark-surface/50 p-5">
          <h2 className="text-sm font-semibold text-white/80 mb-3">rclone Config</h2>
          <p className="text-xs text-white/40 mb-4">
            For CLI-based file management. Copy this into ~/.config/rclone/rclone.conf
          </p>
          <pre className="bg-dark-bg border border-white/[0.05] rounded p-3 text-xs text-white/60 overflow-x-auto select-all">
{`[macalister-r2]
type = s3
provider = Cloudflare
endpoint = ${r2Endpoint}
access_key_id = <your-access-key>
secret_access_key = <your-secret-key>
acl = private

# Usage:
# rclone ls macalister-r2:${bucketName}/shoots/
# rclone copy ./edited macalister-r2:${bucketName}/shoots/2026-04-12 Smith/gallery/`}
          </pre>
        </div>

        {/* Folder Structure */}
        <div className="rounded-lg border border-white/[0.07] bg-dark-surface/50 p-5">
          <h2 className="text-sm font-semibold text-white/80 mb-3">R2 Folder Structure</h2>
          <pre className="text-xs text-white/50 leading-relaxed">
{`shoots/
  {YYYY-MM-DD Name}/
    catalog/    ← Lightroom catalog exports
    raw/        ← RAW files
    gallery/    ← Final JPEGs from editor → imported to gallery

galleries/
  {gallery-id}/
    original/   ← Full-res originals
    web/        ← 2048px web size
    medium/     ← 800px gallery display
    thumb/      ← 400px thumbnails`}
          </pre>
        </div>

        {/* User info */}
        <div className="rounded-lg border border-white/[0.07] bg-dark-surface/50 p-5">
          <h2 className="text-sm font-semibold text-white/80 mb-3">Current User</h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-white/40">Name</span>
              <span className="text-white/70">{user.displayName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Email</span>
              <span className="text-white/70">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Role</span>
              <span className="text-white/70">{user.role}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
