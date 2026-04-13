import { listProjects } from "@/app/api/galleries/admin-actions";
import { GalleryCreateForm } from "./gallery-create-form";

export default async function NewGalleryPage() {
  const projects = await listProjects({ projectType: "shoot" });

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">New Gallery</h1>
      <GalleryCreateForm shoots={projects} />
    </div>
  );
}
