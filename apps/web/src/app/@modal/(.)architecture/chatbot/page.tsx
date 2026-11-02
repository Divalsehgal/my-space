import Architecture from "@/containers/Architecture";
import { CHATBOT_LLD } from "@/containers/Architecture/data";
import RouteModal from "@/components/RouteModal";
import { getT } from "@/i18n/server";

const TITLE_ID = "chatbot-lld-modal-title";

/** /architecture/chatbot opened from inside the site (e.g. the HLD modal's link): same view, as a modal. */
export default function ChatbotLldModal() {
  const t = getT();
  return (
    <RouteModal labelledBy={TITLE_ID} closeLabel={t("toast.close")}>
      <Architecture data={CHATBOT_LLD} titleId={TITLE_ID} related={{ href: "/architecture", label: t("architecture.title") }} />
    </RouteModal>
  );
}
