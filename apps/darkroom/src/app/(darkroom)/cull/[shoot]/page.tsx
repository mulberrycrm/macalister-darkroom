import { loadShootForCulling } from "@/app/api/culling/actions";
import { CullingInterface } from "./culling-interface";

export default async function CullShootPage({
  params,
}: {
  params: Promise<{ shoot: string }>;
}) {
  const { shoot } = await params;
  const shootLabel = decodeURIComponent(shoot);

  const { photos } = await loadShootForCulling(shootLabel, "gallery");

  return <CullingInterface photos={photos} shootLabel={shootLabel} />;
}
