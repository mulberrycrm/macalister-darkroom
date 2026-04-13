"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@crm/ui/brand/badge";
import { Button } from "@crm/ui/brand/button";
import { Input } from "@crm/ui/brand/input";
import { toast } from "sonner";
import { submitToImagen } from "@/app/api/imagen/actions";
import {
  Wand2,
  FolderOpen,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Upload,
} from "lucide-react";
import type { ImagenJob } from "@/app/api/imagen/actions";
import type { ShootFolder } from "@/app/api/shoots/actions";

const STATUS_CONFIG: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  pending: { icon: Clock, color: "text-white/40", label: "Pending" },
  uploading: { icon: Upload, color: "text-blue-400", label: "Uploading" },
  processing: { icon: Loader2, color: "text-gold", label: "Processing" },
  downloading: { icon: Loader2, color: "text-blue-400", label: "Downloading XMPs" },
  complete: { icon: CheckCircle, color: "text-emerald-400", label: "Complete" },
  error: { icon: AlertCircle, color: "text-red-400", label: "Error" },
};

const AI_PROFILES = [
  { id: "natural", name: "Natural", description: "Clean, natural tones" },
  { id: "film", name: "Film", description: "Film-inspired color grading" },
  { id: "moody", name: "Moody", description: "Deep, dramatic tones" },
  { id: "bright", name: "Bright & Airy", description: "Light, airy look" },
];

export function ImagenClient({
  jobs,
  shoots,
}: {
  jobs: ImagenJob[];
  shoots: ShootFolder[];
}) {
  const [showSubmit, setShowSubmit] = useState(false);
  const [selectedShoot, setSelectedShoot] = useState("");
  const [selectedProfile, setSelectedProfile] = useState("natural");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = () => {
    if (!selectedShoot) return;
    startTransition(async () => {
      try {
        const { jobId } = await submitToImagen(selectedShoot, selectedProfile);
        toast.success("Imagen job created");
        setShowSubmit(false);
        setSelectedShoot("");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to submit");
      }
    });
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Imagen AI</h1>
          <p className="text-sm text-white/40">
            AI-powered photo editing pipeline
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setShowSubmit(!showSubmit)}
        >
          <Wand2 className="w-4 h-4" />
          New Job
        </Button>
      </div>

      {/* Submit form */}
      {showSubmit && (
        <div className="rounded-lg border border-white/[0.07] bg-dark-surface/50 p-5 mb-6 max-w-xl space-y-4">
          <h3 className="text-sm font-semibold text-white/80">Submit to Imagen</h3>

          <div>
            <label className="block text-xs text-white/50 mb-1.5">Shoot</label>
            <select
              value={selectedShoot}
              onChange={(e) => setSelectedShoot(e.target.value)}
              disabled={isPending}
              className="w-full rounded-md border border-white/[0.07] bg-dark-bg px-3 py-2 text-sm text-white/90 focus:border-gold focus:outline-none"
            >
              <option value="">Select a shoot...</option>
              {shoots.map((s) => {
                const rawCount = s.subfolders.find((f) => f.name === "catalog")?.fileCount ?? 0;
                return (
                  <option key={s.label} value={s.label}>
                    {s.label} ({rawCount} RAW files)
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1.5">AI Profile</label>
            <div className="grid grid-cols-2 gap-2">
              {AI_PROFILES.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => setSelectedProfile(profile.id)}
                  className={`text-left rounded-md border p-3 transition-colors ${
                    selectedProfile === profile.id
                      ? "border-gold bg-gold/10"
                      : "border-white/[0.07] hover:border-white/[0.15]"
                  }`}
                >
                  <p className="text-sm font-medium text-white/80">{profile.name}</p>
                  <p className="text-xs text-white/30">{profile.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={isPending || !selectedShoot}
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : (
                <Wand2 className="w-4 h-4 mr-1.5" />
              )}
              Submit
            </Button>
            <Button variant="outline" onClick={() => setShowSubmit(false)}>
              Cancel
            </Button>
          </div>

          <p className="text-[10px] text-amber-400/60">
            Note: Imagen API integration is not yet connected. Jobs will be created in pending state.
          </p>
        </div>
      )}

      {/* Jobs list */}
      {jobs.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <Wand2 className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>No Imagen jobs yet</p>
          <p className="text-xs mt-1">Submit a shoot to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => {
            const config = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.pending;
            const StatusIcon = config.icon;
            const progress = job.totalFiles > 0
              ? Math.round((job.processedFiles / job.totalFiles) * 100)
              : 0;

            return (
              <div
                key={job.id}
                className="rounded-lg border border-white/[0.07] bg-dark-surface/50 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-gold" />
                    <span className="font-medium text-white/90">{job.shootLabel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {job.profileName && (
                      <Badge variant="outline">{job.profileName}</Badge>
                    )}
                    <span className={`flex items-center gap-1 text-xs ${config.color}`}>
                      <StatusIcon className={`w-3.5 h-3.5 ${job.status === "processing" || job.status === "downloading" ? "animate-spin" : ""}`} />
                      {config.label}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                {(job.status === "processing" || job.status === "uploading") && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gold rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-white/30">
                      <span>{job.processedFiles} / {job.totalFiles} files</span>
                      <span>{progress}%</span>
                    </div>
                  </div>
                )}

                {job.errorMessage && (
                  <p className="text-xs text-red-400 mt-2">{job.errorMessage}</p>
                )}

                <div className="text-[10px] text-white/20 mt-2">
                  Created {new Date(job.createdAt).toLocaleDateString("en-NZ", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
