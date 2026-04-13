export type GalleryAnalyticsEvent = "view" | "download" | "favorite" | "share";

export interface Gallery {
  id: string;
  tenantId: string;
  contactId: string | null;
  slug: string;
  title: string;
  coverImageUrl: string | null;
  password: string | null;
  isPublished: boolean;
  allowDownload: boolean;
  viewCount: number;
  projectId: string | null;
  accentColor: string | null;
  firstViewedAt: Date | null;
  createdAt: Date;
}

export interface GallerySection {
  id: string;
  galleryId: string;
  title: string;
  sortOrder: number;
  createdAt: Date;
}

export interface GalleryPhoto {
  id: string;
  sectionId: string;
  r2Key: string;
  url: string;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  isHero: boolean;
  sortOrder: number;
  createdAt: Date;
}

export interface GalleryFavorite {
  id: string;
  galleryId: string;
  photoId: string;
  sessionId: string;
  createdAt: Date;
}

export interface GalleryAnalytics {
  id: string;
  galleryId: string;
  event: GalleryAnalyticsEvent;
  photoId: string | null;
  sessionId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}
