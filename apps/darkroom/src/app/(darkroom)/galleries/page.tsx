import { listGalleries, getGalleryPhotoCounts } from "@/app/api/galleries/actions";
import { GalleryListClient } from "./gallery-list-client";

export default async function GalleriesPage() {
  const [galleries, photoCounts] = await Promise.all([
    listGalleries(),
    getGalleryPhotoCounts(),
  ]);

  return (
    <div className="p-6">
      <GalleryListClient galleries={galleries} photoCounts={photoCounts} />
    </div>
  );
}
