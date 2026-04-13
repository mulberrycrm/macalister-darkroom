"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@crm/ui/brand/button";
import { Input } from "@crm/ui/brand/input";
import { toast } from "sonner";
import { createGallery } from "@/app/api/galleries/create-action";

interface Props {
  shoots: { id: string; name: string; contactName: string }[];
}

export function GalleryCreateForm({ shoots }: Props) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [galleryType, setGalleryType] = useState("wedding");
  const [projectId, setProjectId] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 100);
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    // Auto-generate slug from title if slug hasn't been manually edited
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) return;

    startTransition(async () => {
      try {
        const gallery = await createGallery({
          title: title.trim(),
          slug: slug.trim(),
          galleryType,
          projectId: projectId || undefined,
          password: password || undefined,
        });
        toast.success("Gallery created");
        router.push(`/galleries/${gallery.id}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to create gallery");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-lg border border-white/[0.07] bg-dark-surface/50 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">Title</label>
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="e.g. Sarah & Tom — Wedding"
            disabled={isPending}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">Slug</label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/30">galleries.macalister.nz/</span>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              placeholder="sarah-tom-wedding"
              disabled={isPending}
              required
              className="flex-1 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">Type</label>
          <select
            value={galleryType}
            onChange={(e) => setGalleryType(e.target.value)}
            disabled={isPending}
            className="w-full rounded-md border border-white/[0.07] bg-dark-bg px-3 py-2 text-sm text-white/90 focus:border-gold focus:outline-none"
          >
            <option value="wedding">Wedding</option>
            <option value="portrait">Portrait</option>
            <option value="design_consultation">Design Consultation</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">
            Link to Shoot <span className="text-white/30">(optional)</span>
          </label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            disabled={isPending}
            className="w-full rounded-md border border-white/[0.07] bg-dark-bg px-3 py-2 text-sm text-white/90 focus:border-gold focus:outline-none"
          >
            <option value="">None</option>
            {shoots.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}{s.contactName ? ` — ${s.contactName}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">
            Password <span className="text-white/30">(optional)</span>
          </label>
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave empty for no password"
            disabled={isPending}
            type="text"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending || !title.trim() || !slug.trim()}>
          Create Gallery
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
