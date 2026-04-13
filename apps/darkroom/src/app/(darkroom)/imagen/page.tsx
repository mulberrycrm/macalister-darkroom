import { listImagenJobs } from "@/app/api/imagen/actions";
import { listShootFolders } from "@/app/api/shoots/actions";
import { ImagenClient } from "./imagen-client";

export default async function ImagenPage() {
  const [jobs, shoots] = await Promise.all([
    listImagenJobs(),
    listShootFolders(),
  ]);

  // Only show shoots with files in catalog/
  const shootsWithRaws = shoots.filter(
    (s) => (s.subfolders.find((f) => f.name === "catalog")?.fileCount ?? 0) > 0
  );

  return (
    <div className="p-6">
      <ImagenClient jobs={jobs} shoots={shootsWithRaws} />
    </div>
  );
}
