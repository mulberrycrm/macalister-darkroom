import { listShootFolders } from "@/app/api/shoots/actions";
import Link from "next/link";
import { FolderOpen, Image } from "lucide-react";

export default async function CullLaunchPage() {
  const folders = await listShootFolders();

  // Only show shoots that have photos in gallery/ or catalog/
  const shootsWithPhotos = folders.filter(
    (f) => f.subfolders.some((s) => s.fileCount > 0)
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-1">Cull</h1>
      <p className="text-sm text-white/40 mb-6">
        Select a shoot to start culling
      </p>

      {shootsWithPhotos.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <Image className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>No shoots with photos found on R2</p>
        </div>
      ) : (
        <div className="space-y-2 max-w-2xl">
          {shootsWithPhotos.map((folder) => {
            const galleryCount = folder.subfolders.find((s) => s.name === "gallery")?.fileCount ?? 0;
            const catalogCount = folder.subfolders.find((s) => s.name === "catalog")?.fileCount ?? 0;
            const totalPhotos = galleryCount + catalogCount;

            return (
              <Link
                key={folder.label}
                href={`/cull/${encodeURIComponent(folder.label)}`}
                className="group flex items-center justify-between rounded-lg border border-white/[0.07] bg-dark-surface/50 hover:bg-dark-surface transition-colors p-4"
              >
                <div className="flex items-center gap-3">
                  <FolderOpen className="w-5 h-5 text-gold" />
                  <div>
                    <span className="font-medium text-white/90 group-hover:text-gold transition-colors">
                      {folder.label}
                    </span>
                    <div className="flex gap-3 text-xs text-white/30 mt-0.5">
                      {galleryCount > 0 && <span>{galleryCount} gallery</span>}
                      {catalogCount > 0 && <span>{catalogCount} catalog</span>}
                    </div>
                  </div>
                </div>
                <span className="text-sm text-white/30">{totalPhotos} photos</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
