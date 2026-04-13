import { z } from "zod";

export const galleryInsertSchema = z.object({
  contactId: z.string().uuid().nullable().optional(),
  slug: z.string().min(1).max(200),
  title: z.string().min(1).max(200),
  coverImageUrl: z.string().url().nullable().optional(),
  password: z.string().max(200).nullable().optional(),
  isPublished: z.boolean().optional(),
  allowDownload: z.boolean().optional(),
  projectId: z.string().uuid().nullable().optional(),
  accentColor: z.string().max(50).nullable().optional(),
});

export const galleryUpdateSchema = galleryInsertSchema.partial();

export const gallerySectionInsertSchema = z.object({
  galleryId: z.string().uuid(),
  title: z.string().min(1).max(200),
  sortOrder: z.number().int().min(0).optional(),
});

export const gallerySectionUpdateSchema = gallerySectionInsertSchema.partial().omit({ galleryId: true });

export const galleryPhotoInsertSchema = z.object({
  sectionId: z.string().uuid(),
  r2Key: z.string().min(1),
  url: z.string().url(),
  thumbnailUrl: z.string().url().nullable().optional(),
  width: z.number().int().nullable().optional(),
  height: z.number().int().nullable().optional(),
  isHero: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const galleryPhotoUpdateSchema = galleryPhotoInsertSchema.partial().omit({ sectionId: true });

export type GalleryInsert = z.infer<typeof galleryInsertSchema>;
export type GalleryUpdate = z.infer<typeof galleryUpdateSchema>;
export type GallerySectionInsert = z.infer<typeof gallerySectionInsertSchema>;
export type GallerySectionUpdate = z.infer<typeof gallerySectionUpdateSchema>;
export type GalleryPhotoInsert = z.infer<typeof galleryPhotoInsertSchema>;
export type GalleryPhotoUpdate = z.infer<typeof galleryPhotoUpdateSchema>;
