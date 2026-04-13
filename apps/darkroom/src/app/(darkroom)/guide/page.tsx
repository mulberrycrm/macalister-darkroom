import { Scissors, Images, FolderOpen, Star, Settings, Wand2, Keyboard, Image } from "lucide-react";

export default function GuidePage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-semibold mb-2">Darkroom User Guide</h1>
        <p className="text-white/60">Photo production and gallery management for Macalister Photography</p>
      </div>

      {/* Quick Start */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <span>🚀</span> Quick Start
        </h2>
        <div className="space-y-3 text-white/80">
          <p>
            <strong>New to Darkroom?</strong> Start here:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-2">
            <li><strong>Cull:</strong> Select photos to keep/reject from your shoot</li>
            <li><strong>Upload:</strong> Send RAWs to the editor via R2</li>
            <li><strong>Gallery:</strong> Create galleries and add edited photos</li>
            <li><strong>Publish:</strong> Make galleries live for clients</li>
            <li><strong>Portfolio:</strong> Curate your best work (5★ images)</li>
          </ol>
        </div>
      </section>

      {/* Culling */}
      <section className="space-y-4 border-t border-white/[0.07] pt-6">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Scissors className="w-5 h-5 text-gold" />
          Cull — Select Photos
        </h2>
        <p className="text-white/80">
          Fullscreen interface for marking photos keep/reject/maybe and rating them.
        </p>

        <div className="bg-dark-surface/50 rounded-lg p-4 space-y-4">
          <div>
            <h3 className="font-semibold mb-2 text-gold">How to Start</h3>
            <ol className="list-decimal list-inside space-y-1 text-white/80">
              <li>Go to <code className="bg-black/30 px-2 py-1 rounded text-xs">/cull</code></li>
              <li>Select a shoot from the list</li>
              <li>Photos load automatically</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold mb-2 text-gold">Keyboard Controls</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <code className="bg-black/30 px-2 py-1 rounded text-xs font-mono">← →</code>
                  <span>Navigate photos</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="bg-black/30 px-2 py-1 rounded text-xs font-mono">Y</code>
                  <span>Keep</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="bg-black/30 px-2 py-1 rounded text-xs font-mono">N</code>
                  <span>Reject</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="bg-black/30 px-2 py-1 rounded text-xs font-mono">M</code>
                  <span>Maybe</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <code className="bg-black/30 px-2 py-1 rounded text-xs font-mono">1–5</code>
                  <span>Star rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="bg-black/30 px-2 py-1 rounded text-xs font-mono">0</code>
                  <span>Clear rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="bg-black/30 px-2 py-1 rounded text-xs font-mono">U</code>
                  <span>Undo last</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="bg-black/30 px-2 py-1 rounded text-xs font-mono">Z</code>
                  <span>Zoom</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2 text-gold">Workflow</h3>
            <p className="text-white/80 text-sm">
              Your decisions are saved automatically to the database. Go through each photo, mark keep/reject/maybe, and optionally star-rate your favorites. The interface auto-advances when you press Y/N/M.
            </p>
          </div>

          <div className="bg-gold/5 border border-gold/20 rounded p-3">
            <p className="text-sm text-white/70">
              <strong>Tip:</strong> Use 5★ for portfolio-worthy shots, 1–3★ for good keeps, reject the rest. You can always change ratings later.
            </p>
          </div>
        </div>
      </section>

      {/* R2 Shoots */}
      <section className="space-y-4 border-t border-white/[0.07] pt-6">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-gold" />
          Shoots — File Management
        </h2>
        <p className="text-white/80">
          Browse all your shoots on R2 (Cloudflare storage). See file structure and counts.
        </p>

        <div className="bg-dark-surface/50 rounded-lg p-4 space-y-4">
          <div>
            <h3 className="font-semibold mb-2 text-gold">Folder Structure</h3>
            <div className="text-sm text-white/80 space-y-1 font-mono bg-black/30 p-3 rounded">
              <div>shoots/</div>
              <div className="ml-4">2026-04-13-lizzy-isaac/</div>
              <div className="ml-8">catalog/       ← original RAWs</div>
              <div className="ml-8">gallery/       ← exported JPEGs from editor</div>
              <div className="ml-8">edited-xmp/    ← Imagen AI outputs</div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2 text-gold">What You Can Do</h3>
            <ul className="list-disc list-inside space-y-1 text-white/80 text-sm">
              <li>See total file counts per folder</li>
              <li>Monitor editor progress (gallery/ folder growing)</li>
              <li>Check for completed Imagen jobs (edited-xmp/)</li>
              <li>Use for archival planning</li>
            </ul>
          </div>

          <div className="bg-gold/5 border border-gold/20 rounded p-3">
            <p className="text-sm text-white/70">
              <strong>Note:</strong> This is read-only. To upload files, use Mountain Duck or Cyberduck (config in Settings).
            </p>
          </div>
        </div>
      </section>

      {/* Galleries */}
      <section className="space-y-4 border-t border-white/[0.07] pt-6">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Images className="w-5 h-5 text-gold" />
          Galleries — Create & Manage
        </h2>
        <p className="text-white/80">
          Create galleries for shoots, organize photos into sections, publish for clients.
        </p>

        <div className="bg-dark-surface/50 rounded-lg p-4 space-y-4">
          <div>
            <h3 className="font-semibold mb-2 text-gold">Create a Gallery</h3>
            <ol className="list-decimal list-inside space-y-1 text-white/80 text-sm">
              <li>Click "New Gallery"</li>
              <li>Enter gallery name (e.g., "Lizzy & Isaac Wedding")</li>
              <li>Choose project/contact</li>
              <li>Gallery created as draft (not visible to clients yet)</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold mb-2 text-gold">Add Photos</h3>
            <ol className="list-decimal list-inside space-y-1 text-white/80 text-sm">
              <li>Open gallery editor</li>
              <li>Click "Import from R2"</li>
              <li>Select shoot folder (e.g., 2026-04-13-lizzy-isaac)</li>
              <li>Photos imported with ★ ratings from XMP sidecar files</li>
              <li>Create sections (Ceremony, Reception, Details, etc.)</li>
              <li>Drag photos into sections</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold mb-2 text-gold">Publish</h3>
            <ol className="list-decimal list-inside space-y-1 text-white/80 text-sm">
              <li>Click "Publish" button</li>
              <li>Gallery goes live at galleries.macalister.nz/[id]</li>
              <li>Client receives password in email (or manually share URL)</li>
              <li>Clients can view, download, favorite photos</li>
            </ol>
          </div>

          <div className="bg-gold/5 border border-gold/20 rounded p-3">
            <p className="text-sm text-white/70">
              <strong>Tip:</strong> Keep working in draft mode. Publish when you've organized sections and are happy with the selection.
            </p>
          </div>
        </div>
      </section>

      {/* Portfolio */}
      <section className="space-y-4 border-t border-white/[0.07] pt-6">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Star className="w-5 h-5 text-gold" />
          Portfolio — Showcase Your Best
        </h2>
        <p className="text-white/80">
          Auto-curated collection of all 4–5★ photos across all galleries. Use for your website and marketing.
        </p>

        <div className="bg-dark-surface/50 rounded-lg p-4 space-y-4">
          <div>
            <h3 className="font-semibold mb-2 text-gold">How It Works</h3>
            <ul className="list-disc list-inside space-y-1 text-white/80 text-sm">
              <li>All published gallery photos with ★★★★★ or ★★★★ automatically appear</li>
              <li>Filter by wedding, engagement, portrait, etc.</li>
              <li>No manual management — just star rate in Cull</li>
              <li>New galleries automatically add their best photos</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2 text-gold">Use Cases</h3>
            <ul className="list-disc list-inside space-y-1 text-white/80 text-sm">
              <li>Embed in macalister.nz homepage carousel</li>
              <li>Share on Instagram/Facebook</li>
              <li>Use in sales presentations</li>
              <li>Track best-performing genres</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Imagen AI */}
      <section className="space-y-4 border-t border-white/[0.07] pt-6">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-gold" />
          Imagen AI — Automated Editing
        </h2>
        <p className="text-white/80">
          Send RAW photos to Imagen for AI-powered editing with custom profiles.
        </p>

        <div className="bg-dark-surface/50 rounded-lg p-4 space-y-4">
          <div>
            <h3 className="font-semibold mb-2 text-gold">Getting Started</h3>
            <ol className="list-decimal list-inside space-y-1 text-white/80 text-sm">
              <li>Go to Imagen AI page</li>
              <li>Select a shoot</li>
              <li>Choose AI profile: Natural, Film, Moody, Bright & Airy</li>
              <li>Submit batch of RAWs</li>
              <li>Monitor progress — jobs typically take 5–30 min</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold mb-2 text-gold">Profiles</h3>
            <div className="text-sm text-white/80 space-y-2">
              <div>
                <strong>Natural</strong> — minimal processing, true-to-life colors
              </div>
              <div>
                <strong>Film</strong> — vintage color grading, slightly desaturated
              </div>
              <div>
                <strong>Moody</strong> — darker, more saturated, cinematic
              </div>
              <div>
                <strong>Bright & Airy</strong> — light, airy, high-key
              </div>
            </div>
          </div>

          <div className="bg-gold/5 border border-gold/20 rounded p-3">
            <p className="text-sm text-white/70">
              <strong>Note:</strong> Output is XMP sidecar files that can be applied in Lightroom. Use as base, then fine-tune manually if needed.
            </p>
          </div>
        </div>
      </section>

      {/* Settings */}
      <section className="space-y-4 border-t border-white/[0.07] pt-6">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Settings className="w-5 h-5 text-gold" />
          Settings — Configuration
        </h2>
        <p className="text-white/80">
          Connect your R2 storage and configure editor tools.
        </p>

        <div className="bg-dark-surface/50 rounded-lg p-4 space-y-4">
          <div>
            <h3 className="font-semibold mb-2 text-gold">R2 Storage</h3>
            <p className="text-white/80 text-sm mb-2">
              View R2 bucket info and folder structure reference.
            </p>
            <ul className="list-disc list-inside space-y-1 text-white/80 text-sm">
              <li><strong>Bucket:</strong> macalister-images</li>
              <li><strong>Region:</strong> auto</li>
              <li><strong>Root URL:</strong> images.macalister.nz</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2 text-gold">Editor Tools</h3>
            <p className="text-white/80 text-sm mb-2">
              Configure Mountain Duck or rclone for local access to R2:
            </p>
            <div className="text-sm text-white/80 space-y-2">
              <div>
                <strong>Mountain Duck</strong> — macOS/Windows app, mounts R2 as a drive. Copy-paste files directly.
              </div>
              <div>
                <strong>rclone</strong> — Command-line tool for syncing folders to R2.
              </div>
            </div>
            <p className="text-white/60 text-xs mt-2">
              Settings page generates ready-to-use configs for both tools.
            </p>
          </div>
        </div>
      </section>

      {/* Image Lifecycle */}
      <section className="space-y-4 border-t border-white/[0.07] pt-6">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Image className="w-5 h-5 text-gold" />
          Image Lifecycle — How Photos Flow Through Darkroom
        </h2>
        <p className="text-white/80">
          Every photo gets a permanent identity and is tracked from capture through publication and beyond.
        </p>

        <div className="bg-dark-surface/50 rounded-lg p-4 space-y-4">
          <div className="space-y-3">
            <div className="border-l-2 border-gold/30 pl-4 py-2">
              <h4 className="font-semibold text-gold text-sm">1. Ingest</h4>
              <p className="text-white/70 text-sm">RAW file enters system (card, Mountain Duck, Lightroom). Metadata extracted (EXIF, capture date, camera, lens). Stored in <code className="bg-black/30 px-1 rounded text-xs">shoots/[label]/catalog/</code></p>
            </div>

            <div className="border-l-2 border-gold/30 pl-4 py-2">
              <h4 className="font-semibold text-gold text-sm">2. Cull</h4>
              <p className="text-white/70 text-sm">You mark keep/reject/maybe in Darkroom. Decisions saved to database. 5★ photos flagged for portfolio.</p>
            </div>

            <div className="border-l-2 border-gold/30 pl-4 py-2">
              <h4 className="font-semibold text-gold text-sm">3. Send to Editor</h4>
              <p className="text-white/70 text-sm">Selected RAWs uploaded to R2. Editor (Eri) downloads via Mountain Duck and edits in Lightroom. Exports JPEG with matching name (e.g., <code className="bg-black/30 px-1 rounded text-xs">LizzyIsaac-063.jpg</code>)</p>
            </div>

            <div className="border-l-2 border-gold/30 pl-4 py-2">
              <h4 className="font-semibold text-gold text-sm">4. Publish to Gallery</h4>
              <p className="text-white/70 text-sm">Edited JPEGs imported into gallery. Photo gets permanent name, thumbnails generated. Gallery published to galleries.macalister.nz</p>
            </div>

            <div className="border-l-2 border-gold/30 pl-4 py-2">
              <h4 className="font-semibold text-gold text-sm">5. Client Access</h4>
              <p className="text-white/70 text-sm">Client views gallery, downloads full-res, marks favorites. Analytics tracked (views, downloads)</p>
            </div>

            <div className="border-l-2 border-gold/30 pl-4 py-2">
              <h4 className="font-semibold text-gold text-sm">6. Portfolio & Marketing</h4>
              <p className="text-white/70 text-sm">5★ photos auto-add to Portfolio. Used on website, Instagram, award entries. Permanently tracked.</p>
            </div>
          </div>

          <div className="bg-gold/5 border border-gold/20 rounded p-3">
            <p className="text-sm text-white/70">
              <strong>Key:</strong> Every photo has one identity (UUID) that persists through all transformations. RAW → JPEG → Web size → award entry — all linked to the same image record.
            </p>
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="space-y-4 border-t border-white/[0.07] pt-6">
        <h2 className="text-2xl font-semibold">💡 Tips & Tricks</h2>
        <div className="space-y-3">
          <div className="bg-dark-surface/50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-gold">Culling Efficiency</h3>
            <ul className="list-disc list-inside space-y-1 text-white/80 text-sm">
              <li>Use Y/N/M to quickly sort. Don't overthink — you can re-rate later.</li>
              <li>Star-rate in a second pass. First pass: keep/reject. Second pass: refine the keeps.</li>
              <li>Use Undo (U) if you made a mistake. Changes save immediately.</li>
            </ul>
          </div>

          <div className="bg-dark-surface/50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-gold">Gallery Organization</h3>
            <ul className="list-disc list-inside space-y-1 text-white/80 text-sm">
              <li>Create sections that match the shoot flow (Ceremony, Details, Reception, Portraits, etc.)</li>
              <li>Within sections, order photos chronologically or by impact.</li>
              <li>Keep galleries focused — don't publish every photo. Curate.</li>
            </ul>
          </div>

          <div className="bg-dark-surface/50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-gold">Portfolio Curation</h3>
            <ul className="list-disc list-inside space-y-1 text-white/80 text-sm">
              <li>Only 5★ photos you'd want in your ads or pitch.</li>
              <li>Portfolio auto-updates as you publish new galleries — no manual work.</li>
              <li>Filter by genre to spot trends (which shoots produced the most portfolio-worthy work?).</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="border-t border-white/[0.07] pt-6 mt-8">
        <p className="text-white/40 text-sm">
          Questions? Check the Shoots page for folder structure details, or review the Settings page for tool setup.
        </p>
      </div>
    </div>
  );
}
