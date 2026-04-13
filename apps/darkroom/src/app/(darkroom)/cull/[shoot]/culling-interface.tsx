"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveCullDecision } from "@/app/api/culling/actions";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  HelpCircle,
  Star,
  ArrowLeft,
  Maximize2,
  ZoomIn,
} from "lucide-react";
import type { CullPhoto } from "@/app/api/culling/actions";

interface Props {
  photos: CullPhoto[];
  shootLabel: string;
}

const DECISION_COLORS = {
  pending: "bg-white/10 text-white/50",
  keep: "bg-emerald-500/20 text-emerald-400",
  reject: "bg-red-500/20 text-red-400",
  maybe: "bg-amber-500/20 text-amber-400",
};

const DECISION_LABELS = {
  pending: "Pending",
  keep: "Keep",
  reject: "Reject",
  maybe: "Maybe",
};

export function CullingInterface({ photos: initialPhotos, shootLabel }: Props) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [saving, setSaving] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const current = photos[currentIndex];
  const total = photos.length;

  const counts = {
    keep: photos.filter((p) => p.decision === "keep").length,
    reject: photos.filter((p) => p.decision === "reject").length,
    maybe: photos.filter((p) => p.decision === "maybe").length,
    pending: photos.filter((p) => p.decision === "pending").length,
  };

  const goTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < total) {
        setCurrentIndex(index);
        setIsZoomed(false);
      }
    },
    [total]
  );

  const goNext = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
  const goPrev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

  const setDecision = useCallback(
    async (decision: CullPhoto["decision"]) => {
      if (!current) return;

      // Optimistic update
      setPhotos((prev) =>
        prev.map((p, i) => (i === currentIndex ? { ...p, decision } : p))
      );

      // Auto-advance on keep/reject
      if ((decision === "keep" || decision === "reject") && currentIndex < total - 1) {
        setCurrentIndex((i) => i + 1);
        setIsZoomed(false);
      }

      // Save to DB
      try {
        await saveCullDecision(current.r2Key, shootLabel, decision, current.starRating);
      } catch {
        toast.error("Failed to save decision");
      }
    },
    [current, currentIndex, total, shootLabel]
  );

  const setRating = useCallback(
    async (rating: number) => {
      if (!current) return;

      setPhotos((prev) =>
        prev.map((p, i) => (i === currentIndex ? { ...p, starRating: rating } : p))
      );

      try {
        await saveCullDecision(current.r2Key, shootLabel, current.decision, rating);
      } catch {
        toast.error("Failed to save rating");
      }
    },
    [current, currentIndex, shootLabel]
  );

  // Keyboard controls
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Prevent default for our keys
      if (["ArrowLeft", "ArrowRight", "y", "n", "m", "1", "2", "3", "4", "5", "0", "z", "?", "Escape"].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case "ArrowRight":
        case "l":
          goNext();
          break;
        case "ArrowLeft":
        case "h":
          goPrev();
          break;
        case "y":
          setDecision("keep");
          break;
        case "n":
          setDecision("reject");
          break;
        case "m":
          setDecision("maybe");
          break;
        case "u":
          setDecision("pending");
          break;
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
          setRating(parseInt(e.key));
          break;
        case "0":
          setRating(0);
          break;
        case "z":
          setIsZoomed((z) => !z);
          break;
        case "?":
          setShowHelp((h) => !h);
          break;
        case "Escape":
          if (isZoomed) setIsZoomed(false);
          else if (showHelp) setShowHelp(false);
          else router.push("/cull");
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, setDecision, setRating, isZoomed, showHelp, router]);

  // Zoom mouse tracking
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isZoomed || !imageRef.current) return;
      const rect = imageRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setZoomPos({ x, y });
    },
    [isZoomed]
  );

  // Preload adjacent images
  useEffect(() => {
    const preload = (index: number) => {
      if (index >= 0 && index < total) {
        const img = new Image();
        img.src = photos[index].url;
      }
    };
    preload(currentIndex + 1);
    preload(currentIndex + 2);
  }, [currentIndex, photos, total]);

  if (!current) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white/50">
        No photos to cull
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/80 border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/cull")}
            className="text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-sm font-medium text-white/80">{shootLabel}</span>
            <span className="text-xs text-white/30 ml-2">
              {currentIndex + 1} / {total}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Counts */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-emerald-400">{counts.keep} keep</span>
            <span className="text-red-400">{counts.reject} reject</span>
            <span className="text-amber-400">{counts.maybe} maybe</span>
            <span className="text-white/30">{counts.pending} pending</span>
          </div>

          {/* Help */}
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="text-white/30 hover:text-white/60"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main image area */}
      <div
        ref={imageRef}
        className="flex-1 relative overflow-hidden cursor-crosshair"
        onClick={() => setIsZoomed(!isZoomed)}
        onMouseMove={handleMouseMove}
      >
        <img
          src={current.url}
          alt={current.filename}
          className="absolute inset-0 w-full h-full transition-transform duration-150"
          style={
            isZoomed
              ? {
                  objectFit: "none",
                  objectPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                  transform: "scale(2)",
                }
              : { objectFit: "contain" }
          }
          draggable={false}
        />

        {/* Nav arrows */}
        {currentIndex > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white/50 hover:text-white hover:bg-black/80 transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {currentIndex < total - 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white/50 hover:text-white hover:bg-black/80 transition-all"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Decision badge */}
        <div className="absolute top-4 left-4">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${DECISION_COLORS[current.decision]}`}
          >
            {DECISION_LABELS[current.decision]}
          </span>
        </div>

        {/* Star rating */}
        <div className="absolute top-4 right-4 flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={(e) => {
                e.stopPropagation();
                setRating(current.starRating === n ? 0 : n);
              }}
              className="p-0.5"
            >
              <Star
                className={`w-5 h-5 transition-colors ${
                  n <= current.starRating
                    ? "text-gold fill-gold"
                    : "text-white/20 hover:text-white/40"
                }`}
              />
            </button>
          ))}
        </div>

        {/* Zoom indicator */}
        {isZoomed && (
          <div className="absolute bottom-4 right-4 text-xs text-white/30 bg-black/50 rounded px-2 py-1">
            2x zoom — click to exit
          </div>
        )}
      </div>

      {/* Bottom bar — decision buttons */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 border-t border-white/[0.05]">
        <div className="text-xs text-white/30 truncate max-w-[200px]">
          {current.filename}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDecision("reject")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              current.decision === "reject"
                ? "bg-red-500/30 text-red-300"
                : "bg-white/5 text-white/50 hover:bg-red-500/10 hover:text-red-400"
            }`}
          >
            <X className="w-4 h-4" />
            Reject
            <kbd className="ml-1 text-[10px] opacity-40 border border-current rounded px-1">N</kbd>
          </button>

          <button
            onClick={() => setDecision("maybe")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              current.decision === "maybe"
                ? "bg-amber-500/30 text-amber-300"
                : "bg-white/5 text-white/50 hover:bg-amber-500/10 hover:text-amber-400"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Maybe
            <kbd className="ml-1 text-[10px] opacity-40 border border-current rounded px-1">M</kbd>
          </button>

          <button
            onClick={() => setDecision("keep")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              current.decision === "keep"
                ? "bg-emerald-500/30 text-emerald-300"
                : "bg-white/5 text-white/50 hover:bg-emerald-500/10 hover:text-emerald-400"
            }`}
          >
            <Check className="w-4 h-4" />
            Keep
            <kbd className="ml-1 text-[10px] opacity-40 border border-current rounded px-1">Y</kbd>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            className="p-2 rounded text-white/30 hover:text-white/60"
            title="Toggle zoom (Z)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Help overlay */}
      {showHelp && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="bg-dark-surface rounded-lg border border-white/[0.07] p-6 max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Keyboard Shortcuts</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">Navigate</span>
                <span className="text-white/80">← → or H L</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Keep</span>
                <span className="text-emerald-400">Y</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Reject</span>
                <span className="text-red-400">N</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Maybe</span>
                <span className="text-amber-400">M</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Undo decision</span>
                <span className="text-white/80">U</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Star rating</span>
                <span className="text-gold">1-5 (0 to clear)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Zoom toggle</span>
                <span className="text-white/80">Z or click</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Help</span>
                <span className="text-white/80">?</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Exit</span>
                <span className="text-white/80">Esc</span>
              </div>
            </div>
            <p className="text-xs text-white/30 mt-4">
              Keep/Reject auto-advances to next photo
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
