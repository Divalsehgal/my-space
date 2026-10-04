import Carousel from "@/components/Carousel";
import ProjectCard from "@/components/ProjectCard";
import { type ProjectConfig } from "@/features/portfolio";
import { getT } from "@/i18n/server";

/** Server-rendered cards; only the paging inside <Carousel> runs on the client. */
export default function ProjectCarousel({ items }: Readonly<{ items: ProjectConfig[] }>) {
  const t = getT();
  return (
    <Carousel
      progressLabelPrefix={t("carousel.project")}
      slides={items.map((item) => <ProjectCard key={item.name} project={item} />)}
    />
  );
}
