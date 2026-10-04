import Architecture from "@/containers/Architecture";
import { getArchitecture } from "@/containers/Architecture/data";
import RouteModal from "@/components/RouteModal";
import { getT } from "@/i18n/server";

const TITLE_ID = "architecture-modal-title";

/** /architecture opened from inside the site: the same view, as a modal over the current page. */
export default async function ArchitectureModal() {
  const t = getT();
  const data = await getArchitecture();
  return (
    <RouteModal labelledBy={TITLE_ID} closeLabel={t("toast.close")}>
      <Architecture data={data} titleId={TITLE_ID} />
    </RouteModal>
  );
}
