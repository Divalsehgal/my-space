import { fetchWithRetry } from "@/utils/fetchWithRetry";

export type ExperienceDescriptionItem = {
    id: string;
    text: string;
};
export type ExperienceConfig = {
    company: string;
    role: string;
    period: string;
    location?: string;
    description: ExperienceDescriptionItem[];  
    techStack?: string[];
};

export type ProjectConfig = {
    name: string;
    description: string;
    techStack?: string[];
    link?: string;
    repo?: string;
    image?: string;
};

export type PortfolioConfig = {
    hero: {
        title: string;
        subtitle: string;
        primaryCtaLabel?: string;
        primaryCtaHref?: string;
        secondaryCtaLabel?: string;
        secondaryCtaHref?: string;
    };
    about: {
        title: string;
        paragraphs: string[];
        facts: { label: string; value: string }[];
        resumeUrl?: string;
    };
    experience: ExperienceConfig[];
    projects: ProjectConfig[];
    contact: {
        title: string;
        subtitle: string;
        email: string;
    };
};

const CONFIG_URL =
    "https://raw.githubusercontent.com/Divalsehgal/portfolio-config/main/config.json";

export const getPortfolioConfig = async () => {
    const res = await fetchWithRetry(() =>
        fetch(CONFIG_URL, {
            next: { revalidate: 60 },
        })
    );

    if (!res.ok) {
        console.error("GitHub fetch failed:", res.status, res.statusText);
        throw new Error("Failed to fetch GitHub JSON");
    }

    const json = (await res.json()) as PortfolioConfig;
    return { config: json };
};
