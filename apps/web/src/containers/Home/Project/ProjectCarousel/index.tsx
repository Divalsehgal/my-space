"use client";

import Carousel from "@/components/Carousel";
import ProjectCard from "@/components/ProjectCard";
import { type ProjectConfig } from "@/features/portfolio";

export default function ProjectCarousel({ items }: { items: ProjectConfig[] }) {
    return (
        <Carousel
            items={items}
            progressLabelPrefix="Project"
            renderItem={(item) => <ProjectCard project={item} />}
        />
    );
}