"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@crm/ui/brand/badge";
import { Input } from "@crm/ui/brand/input";
import { Button } from "@crm/ui/brand/button";
import { Eye, Images, ExternalLink, Plus } from "lucide-react";

type GalleryType = "design_consultation" | "portrait" | "wedding" | "other";

const TYPE_LABELS: Record<string, string> = {
  design_consultation: "Design",
  portrait: "Portrait",
  wedding: "Wedding",
  other: "Other",
};

interface GalleryRow {
  id: string;
  slug: string;
  title: string;
  galleryType: string;
  coverImageUrl: string | null;
  isPublished: boolean;
  hasPassword: boolean;
  viewCount: number;
  projectId: string | null;
  createdAt: Date | null;
}

interface Props {
  galleries: GalleryRow[];
  photoCounts: Record<string, number>;
}

export function GalleryListClient({ galleries, photoCounts }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");

  const filtered = galleries.filter((g) => {
    const matchesSearch =
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.slug.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "published" && g.isPublished) ||
      (filter === "draft" && !g.isPublished);
    return matchesSearch && matchesFilter;
  });

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-NZ", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Galleries</h1>
          <p className="text-sm text-white/40">
            {filtered.length} of {galleries.length} galleries
          </p>
        </div>
        <Link href="/galleries/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" />
            New Gallery
          </Button>
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search by name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "published", "draft"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === s
                  ? "bg-gold text-dark-bg"
                  : "border border-white/[0.07] text-white/40 hover:text-white/70"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <Images className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>{search ? "No matching galleries" : "No galleries yet"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((gallery) => {
            const count = photoCounts[gallery.id] ?? 0;
            return (
              <Link
                key={gallery.id}
                href={`/galleries/${gallery.id}`}
                className="group block rounded-lg border border-white/[0.07] bg-dark-surface/50 hover:bg-dark-surface transition-colors overflow-hidden"
              >
                {/* Cover Image */}
                <div className="aspect-[16/9] bg-dark-bg relative overflow-hidden">
                  {gallery.coverImageUrl ? (
                    <img
                      src={gallery.coverImageUrl}
                      alt={gallery.title}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Images className="w-8 h-8 text-white/10" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <Badge variant={gallery.isPublished ? "success" : "default"}>
                      {gallery.isPublished ? "Published" : "Draft"}
                    </Badge>
                    <Badge variant="outline">
                      {TYPE_LABELS[gallery.galleryType] ?? "Other"}
                    </Badge>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="font-medium text-white/90 truncate group-hover:text-gold transition-colors">
                    {gallery.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-white/30">
                    <span className="flex items-center gap-1">
                      <Images className="w-3 h-3" />
                      {count} photos
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {gallery.viewCount} views
                    </span>
                    {gallery.createdAt && (
                      <span>{formatDate(gallery.createdAt)}</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
