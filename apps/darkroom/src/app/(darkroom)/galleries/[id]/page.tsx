import { getGalleryWithSections, listProjects } from "@/app/api/galleries/admin-actions";
import { GalleryEditorClient } from "./gallery-editor-client";

export default async function GalleryEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [gallery, allProjects] = await Promise.all([
    getGalleryWithSections(id),
    listProjects({ projectType: "shoot" }),
  ]);

  const shoots = allProjects.map((p) => ({
    id: p.id,
    name: p.name || "Unnamed shoot",
    contactName: p.contactName || "",
  }));

  let projectName: string | null = null;
  let contactName: string | null = null;
  if (gallery.projectId) {
    const linked = allProjects.find((p) => p.id === gallery.projectId);
    if (linked) {
      projectName = linked.name || "Unnamed shoot";
      contactName = linked.contactName || null;
    }
  }

  return (
    <div className="h-full overflow-auto">
      <GalleryEditorClient
        gallery={{ ...gallery, projectName, contactName }}
        shoots={shoots}
      />
    </div>
  );
}
