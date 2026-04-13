"use client";

import { useState } from "react";
import { Input } from "@crm/ui/brand/input";
import { FolderOpen, HardDrive, Image, FileText } from "lucide-react";
import type { ShootFolder } from "@/app/api/shoots/actions";

const SUBFOLDER_ICONS: Record<string, typeof FolderOpen> = {
  catalog: FileText,
  raw: HardDrive,
  gallery: Image,
};

function formatSize(bytes: number) {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function ShootsClient({ folders }: { folders: ShootFolder[] }) {
  const [search, setSearch] = useState("");

  const filtered = folders.filter((f) =>
    f.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Shoots</h1>
        <p className="text-sm text-white/40">
          {folders.length} shoot folders on R2
        </p>
      </div>

      <div className="mb-6 max-w-md">
        <Input
          placeholder="Search shoots..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>{search ? "No matching shoots" : "No shoot folders found"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((folder) => (
            <div
              key={folder.label}
              className="rounded-lg border border-white/[0.07] bg-dark-surface/50 hover:bg-dark-surface transition-colors p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-gold" />
                  <span className="font-medium text-white/90">{folder.label}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-white/30">
                  <span>{folder.totalFiles} files</span>
                  <span>{formatSize(folder.totalSizeBytes)}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {folder.subfolders.map((sub) => {
                  const Icon = SUBFOLDER_ICONS[sub.name] ?? FolderOpen;
                  return (
                    <div
                      key={sub.name}
                      className="rounded-md border border-white/[0.05] bg-dark-bg px-3 py-2"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className="w-3 h-3 text-white/30" />
                        <span className="text-xs font-medium text-white/50">{sub.name}/</span>
                      </div>
                      <div className="text-xs text-white/30">
                        {sub.fileCount} files &middot; {formatSize(sub.totalSizeBytes)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
