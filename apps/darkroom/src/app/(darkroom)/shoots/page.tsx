import { listShootFolders } from "@/app/api/shoots/actions";
import { ShootsClient } from "./shoots-client";

export default async function ShootsPage() {
  const folders = await listShootFolders();

  return (
    <div className="p-6">
      <ShootsClient folders={folders} />
    </div>
  );
}
