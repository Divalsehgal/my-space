"use client";

import Carousel from "@/components/Carousel";
import ExperienceCard from "@/components/ExperienceCard";
import { type ExperienceConfig } from "@/features/portfolio";

export default function ExperienceCarousel({ items }: { items: ExperienceConfig[] }) {
    return (
        <Carousel
            items={items}
            progressLabelPrefix="Role"
            renderItem={(item) => <ExperienceCard experience={item} />}
        />
    );
}