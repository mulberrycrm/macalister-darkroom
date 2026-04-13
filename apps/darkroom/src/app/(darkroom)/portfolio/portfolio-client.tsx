"use client";

import { useState } from "react";
import { Star, Images } from "lucide-react";

interface PortfolioPhoto {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  originalFilename: string | null;
  starRating: number;
  galleryId: string;
  galleryTitle: string;
  gallerySlug: string;
}

export function PortfolioClient({ photos }: { photos: PortfolioPhoto[] }) {
  const [filter, setFilter] = useState<"all" | "5" | "4">("all");

  const filtered = photos.filter((p) => {
    if (filter === "5") return p.starRating === 5;
    if (filter === "4") return p.starRating === 4;
    return true;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Portfolio</h1>
        <p className="text-sm text-white/40">
          {photos.length} portfolio photos across all galleries
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 mb-6">
        {(["all", "5", "4"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === f
                ? "bg-gold text-dark-bg"
                : "border border-white/[0.07] text-white/40 hover:text-white/70"
            }`}
          >
            {f === "all" ? "All" : (
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                {f}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <Star className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>No portfolio photos yet</p>
          <p className="text-xs mt-1">Photos with 4-5 star ratings are automatically included</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
          {filtered.map((photo) => (
            <div
              key={photo.id}
              className="group relative aspect-[3/2] rounded-lg overflow-hidden bg-dark-bg"
            >
              <img
                src={photo.thumbnailUrl || photo.url}
                alt={photo.originalFilename || ""}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <p className="text-xs text-white/90 truncate">{photo.galleryTitle}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {Array.from({ length: photo.starRating }).map((_, i) => (
                      <Star key={i} className="w-2.5 h-2.5 text-gold fill-gold" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
