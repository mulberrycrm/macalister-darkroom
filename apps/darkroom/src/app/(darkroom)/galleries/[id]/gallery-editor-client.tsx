"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@crm/ui/brand/badge";
import { Button } from "@crm/ui/brand/button";
import { Input } from "@crm/ui/brand/input";
import {
  updateGallery,
  addSection,
  deleteSection,
  deletePhoto,
  deletePhotos,
  clearAllPhotos,
} from "@/app/api/galleries/admin-actions";
import { publishFromShoot } from "@/app/api/galleries/publish-actions";
import {
  ChevronLeft,
  Settings,
  Loader2,
  Images,
  BarChart3,
  Plus,
  Trash2,
  Star,
  Eye,
  EyeOff,
  Download,
  ExternalLink,
  Upload,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface Photo {
  id: string;
  r2Key: string;
  url: string;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  isHero: boolean;
  sortOrder: number;
  originalFilename?: string;
  starRating?: number;
  isPortfolio?: boolean;
  caption?: string;
}

interface Section {
  id: string;
  title: string;
  sortOrder: number;
  photos: Photo[];
}

interface GalleryData {
  id: string;
  slug: string;
  title: string;
  galleryType: string;
  isPublished: boolean;
  allowDownload: boolean;
  hasPassword: boolean;
  coverImageUrl: string | null;
  sections: Section[];
  viewCount: number;
  accentColor: string | null;
  createdAt: Date | null;
  contactId: string | null;
  projectId: string | null;
  projectName: string | null;
  contactName: string | null;
}

type TabType = "settings" | "photos";

interface Props {
  gallery: GalleryData;
  shoots?: { id: string; name: string; contactName: string }[];
}

export function GalleryEditorClient({ gallery: initialGallery, shoots }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("photos");
  const [gallery, setGallery] = useState(initialGallery);
  const [editTitle, setEditTitle] = useState(initialGallery.title);
  const [isPending, startTransition] = useTransition();
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [importLabel, setImportLabel] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [publishProgress, setPublishProgress] = useState<string | null>(null);
  const router = useRouter();

  // Sync when server data changes
  if (initialGallery !== gallery && !isPending) {
    setGallery(initialGallery);
  }

  const totalPhotos = gallery.sections.reduce((sum, s) => sum + s.photos.length, 0);
  const portfolioCount = gallery.sections.reduce(
    (sum, s) => sum + s.photos.filter((p) => p.isPortfolio).length,
    0
  );

  const handleUpdate = (updates: Parameters<typeof updateGallery>[1]) => {
    startTransition(async () => {
      try {
        await updateGallery(gallery.id, updates);
        router.refresh();
      } catch {
        toast.error("Failed to save");
      }
    });
  };

  const handleSaveTitle = () => {
    if (!editTitle.trim()) return;
    handleUpdate({ title: editTitle.trim() });
  };

  const handleAddSection = () => {
    if (!newSectionTitle.trim()) return;
    startTransition(async () => {
      try {
        await addSection(gallery.id, newSectionTitle.trim());
        setNewSectionTitle("");
        router.refresh();
      } catch {
        toast.error("Failed to add section");
      }
    });
  };

  const handleDeletePhoto = (photoId: string) => {
    setGallery((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => ({
        ...s,
        photos: s.photos.filter((p) => p.id !== photoId),
      })),
    }));
    startTransition(async () => {
      try {
        await deletePhoto(photoId);
        router.refresh();
      } catch {
        toast.error("Failed to delete photo");
        router.refresh();
      }
    });
  };

  const handleImportFromR2 = (label: string) => {
    if (!confirm(`Import all photos from shoots/${label}/gallery/ into this gallery?`)) return;
    setPublishProgress("Importing...");
    startTransition(async () => {
      try {
        const result = await publishFromShoot(gallery.id, label);
        setPublishProgress(null);
        setShowImport(false);
        toast.success(
          `Imported ${result.published} photos` +
            (result.errors.length > 0 ? ` — ${result.errors.length} failed` : "")
        );
        router.refresh();
      } catch (err) {
        setPublishProgress(null);
        toast.error(err instanceof Error ? err.message : "Import failed");
      }
    });
  };

  const handleClearAll = () => {
    if (!confirm("Clear all photos from this gallery?")) return;
    setGallery((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => ({ ...s, photos: [] })),
    }));
    startTransition(async () => {
      try {
        await clearAllPhotos(gallery.id);
        router.refresh();
        toast.success("All photos cleared");
      } catch {
        toast.error("Failed to clear photos");
        router.refresh();
      }
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/galleries"
          className="inline-flex items-center gap-1 text-white/40 hover:text-white/70 text-sm mb-3"
        >
          <ChevronLeft className="w-4 h-4" />
          Galleries
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{gallery.title}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-white/40">
              <a
                href={`https://galleries.macalister.nz/${gallery.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-gold transition-colors"
              >
                /{gallery.slug}
                <ExternalLink className="w-3 h-3" />
              </a>
              <span>{totalPhotos} photos</span>
              {portfolioCount > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-gold" />
                  {portfolioCount} portfolio
                </span>
              )}
              <span>
                <Eye className="w-3 h-3 inline mr-1" />
                {gallery.viewCount} views
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={gallery.isPublished ? "success" : "default"}>
              {gallery.isPublished ? "Published" : "Draft"}
            </Badge>
            <Button
              size="sm"
              variant={gallery.isPublished ? "outline" : "default"}
              onClick={() => handleUpdate({ isPublished: !gallery.isPublished })}
              disabled={isPending}
            >
              {gallery.isPublished ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 mr-1.5" />
                  Unpublish
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                  Publish
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/[0.07] mb-6">
        <div className="flex gap-1">
          {[
            { id: "photos" as TabType, label: "Photos", icon: Images },
            { id: "settings" as TabType, label: "Settings", icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-gold text-gold"
                    : "border-transparent text-white/40 hover:text-white/70"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {activeTab === "photos" && (
        <div className="space-y-6">
          {/* Actions bar */}
          {totalPhotos > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/40">
                {totalPhotos} photos across {gallery.sections.length} section{gallery.sections.length !== 1 ? "s" : ""}
              </p>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-400 hover:text-red-300"
                onClick={handleClearAll}
                disabled={isPending}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Clear All
              </Button>
            </div>
          )}

          {/* Sections */}
          {gallery.sections.map((section) => (
            <SectionBlock
              key={section.id}
              section={section}
              onDeletePhoto={handleDeletePhoto}
              onDeleteSection={() => {
                if (!confirm(`Delete section "${section.title}" and all its photos?`)) return;
                setGallery((prev) => ({
                  ...prev,
                  sections: prev.sections.filter((s) => s.id !== section.id),
                }));
                startTransition(async () => {
                  try {
                    await deleteSection(section.id);
                    router.refresh();
                  } catch {
                    toast.error("Failed to delete section");
                    router.refresh();
                  }
                });
              }}
              isPending={isPending}
            />
          ))}

          {/* Add section */}
          <div className="flex gap-2">
            <Input
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddSection()}
              placeholder="New section name..."
              disabled={isPending}
              className="flex-1"
            />
            <Button onClick={handleAddSection} disabled={isPending || !newSectionTitle.trim()}>
              <Plus className="w-4 h-4 mr-1.5" />
              Add Section
            </Button>
          </div>

          {gallery.sections.length === 0 && totalPhotos === 0 && (
            <div className="text-center py-12 text-white/20">
              <Images className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No photos yet. Add a section and import from R2.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "settings" && (
        <div className="space-y-6 max-w-2xl">
          {/* Title */}
          <div className="rounded-lg border border-white/[0.07] bg-dark-surface/50 p-5">
            <label className="block text-sm font-medium text-white/70 mb-2">Title</label>
            <div className="flex gap-2">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                disabled={isPending}
                className="flex-1"
              />
              <Button
                onClick={handleSaveTitle}
                disabled={isPending || editTitle === gallery.title}
              >
                Save
              </Button>
            </div>
          </div>

          {/* Gallery Type */}
          <div className="rounded-lg border border-white/[0.07] bg-dark-surface/50 p-5">
            <label className="block text-sm font-medium text-white/70 mb-2">Gallery Type</label>
            <select
              value={gallery.galleryType}
              onChange={(e) => handleUpdate({ galleryType: e.target.value })}
              disabled={isPending}
              className="w-full rounded-md border border-white/[0.07] bg-dark-bg px-3 py-2 text-sm text-white/90 focus:border-gold focus:outline-none"
            >
              <option value="wedding">Wedding</option>
              <option value="portrait">Portrait</option>
              <option value="design_consultation">Design Consultation</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Downloads */}
          <div className="rounded-lg border border-white/[0.07] bg-dark-surface/50 p-5">
            <button
              onClick={() => handleUpdate({ allowDownload: !gallery.allowDownload })}
              disabled={isPending}
              className="w-full flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-white/70">Downloads</p>
                <p className="text-xs text-white/30 mt-0.5">
                  {gallery.allowDownload ? "Clients can download photos" : "Downloads are disabled"}
                </p>
              </div>
              <Badge variant={gallery.allowDownload ? "success" : "default"}>
                {gallery.allowDownload ? "Enabled" : "Disabled"}
              </Badge>
            </button>
          </div>

          {/* Linked Shoot */}
          <div className="rounded-lg border border-white/[0.07] bg-dark-surface/50 p-5">
            <label className="block text-sm font-medium text-white/70 mb-2">Linked Shoot</label>
            {gallery.projectId ? (
              <div className="flex items-center justify-between p-3 rounded-md border border-white/[0.07] bg-dark-bg">
                <div>
                  <p className="text-sm text-white/80">{gallery.projectName || "Unknown"}</p>
                  {gallery.contactName && (
                    <p className="text-xs text-white/40">{gallery.contactName}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpdate({ projectId: null })}
                  disabled={isPending}
                >
                  Unlink
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-white/30 mb-2">No shoot linked</p>
                {shoots && shoots.length > 0 && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) handleUpdate({ projectId: e.target.value });
                    }}
                    disabled={isPending}
                    className="w-full rounded-md border border-white/[0.07] bg-dark-bg px-3 py-2 text-sm text-white/90 focus:border-gold focus:outline-none"
                    defaultValue=""
                  >
                    <option value="">Select a shoot...</option>
                    {shoots.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}{s.contactName ? ` — ${s.contactName}` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* Import from R2 */}
          <div className="rounded-lg border border-white/[0.07] bg-dark-surface/50 p-5">
            <label className="block text-sm font-medium text-white/70 mb-2">Import from R2</label>
            <p className="text-xs text-white/30 mb-3">
              Import photos from a shoot's gallery/ folder. Star ratings are read from XMP metadata.
            </p>
            {publishProgress ? (
              <div className="flex items-center gap-2 py-1">
                <Loader2 className="w-4 h-4 animate-spin text-gold" />
                <span className="text-sm text-gold">{publishProgress}</span>
              </div>
            ) : showImport ? (
              <div className="flex gap-2">
                <Input
                  value={importLabel}
                  onChange={(e) => setImportLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && importLabel.trim()) handleImportFromR2(importLabel.trim());
                    if (e.key === "Escape") setShowImport(false);
                  }}
                  placeholder="e.g. 2026-04-10 Smith"
                  autoFocus
                  disabled={isPending}
                  className="flex-1 font-mono text-sm"
                />
                <Button
                  size="sm"
                  onClick={() => importLabel.trim() && handleImportFromR2(importLabel.trim())}
                  disabled={isPending || !importLabel.trim()}
                >
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  Import
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowImport(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  const today = new Date().toISOString().slice(0, 10);
                  setImportLabel(gallery.contactName ? `${today} ${gallery.contactName}` : today);
                  setShowImport(true);
                }}
                disabled={isPending}
              >
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                Import from R2
              </Button>
            )}
          </div>

          {/* URL */}
          <div className="rounded-lg border border-white/[0.07] bg-dark-surface/50 p-5">
            <label className="block text-sm font-medium text-white/70 mb-2">Gallery URL</label>
            <a
              href={`https://galleries.macalister.nz/${gallery.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-gold hover:text-gold/80"
            >
              galleries.macalister.nz/{gallery.slug}
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionBlock({
  section,
  onDeletePhoto,
  onDeleteSection,
  isPending,
}: {
  section: Section;
  onDeletePhoto: (id: string) => void;
  onDeleteSection: () => void;
  isPending: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="rounded-lg border border-white/[0.07] bg-dark-surface/30">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
          {section.title}
          <span className="text-white/30 font-normal">({section.photos.length})</span>
        </button>
        <Button
          size="sm"
          variant="ghost"
          className="text-red-400/60 hover:text-red-400"
          onClick={onDeleteSection}
          disabled={isPending}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Photo grid */}
      {!collapsed && (
        <div className="p-3">
          {section.photos.length === 0 ? (
            <p className="text-sm text-white/20 text-center py-6">No photos in this section</p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1.5">
              {section.photos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative aspect-square rounded overflow-hidden bg-dark-bg"
                >
                  <img
                    src={photo.thumbnailUrl || photo.url}
                    alt={photo.originalFilename || ""}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Star rating badge */}
                  {(photo.starRating ?? 0) > 0 && (
                    <div className="absolute bottom-0.5 left-0.5 flex items-center gap-0.5 bg-black/60 rounded px-1 py-0.5">
                      <Star className={`w-2.5 h-2.5 ${(photo.starRating ?? 0) >= 4 ? "text-gold fill-gold" : "text-white/50"}`} />
                      <span className="text-[9px] text-white/70">{photo.starRating}</span>
                    </div>
                  )}
                  {/* Hover overlay with delete */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => onDeletePhoto(photo.id)}
                      className="p-1.5 rounded-full bg-red-500/80 hover:bg-red-500 text-white"
                      disabled={isPending}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
