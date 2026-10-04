import Carousel from "@/components/Carousel";
import ExperienceCard from "@/components/ExperienceCard";
import { type ExperienceConfig } from "@/features/portfolio";
import { getT } from "@/i18n/server";

/** Server-rendered cards; only the paging inside <Carousel> runs on the client. */
export default function ExperienceCarousel({ items }: Readonly<{ items: ExperienceConfig[] }>) {
  const t = getT();
  return (
    <Carousel
      progressLabelPrefix={t("carousel.role")}
      slides={items.map((item) => (
        <ExperienceCard key={`${item.company}-${item.period}`} experience={item} />
      ))}
    />
  );
}
