import Hero from "@/containers/Home/Hero";
import Skills from "@/containers/Home/Skills";
import Experience from "@/containers/Home/Experience";
import Project from "@/containers/Home/Project";
import { flattenSkillNames, portfolioService } from "@/features/portfolio";
import ArchitectureWidget from "@/components/ArchitectureWidget";
import SocialDock from "@/components/SocialDock";
import Contact from "@/containers/Home/Contact";
import JsonLd from "@/components/JsonLd";
import ScrollReveals from "@/components/ScrollReveals";
import SectionSnap from "@/components/SectionSnap";
import HomeTopBar from "@/components/HomeTopBar";
import { getLatestContentfulPost } from "@/lib/services/contentful";
import { getRelativeTimeLabel } from "@/utils/date";
import { SITE_URL, AUTHOR } from "@/lib/config/site";
import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { splitParagraphs } from "@dival-sehgal/utils/string";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default async function HomePage() {
  const { config } = await portfolioService.getConfig();
  const latestPost = await getLatestContentfulPost();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: AUTHOR.name,
    url: SITE_URL,
    image: `${SITE_URL}${AUTHOR.image}`,
    jobTitle: AUTHOR.jobTitle,
    sameAs: config.socials.map((s) => s.href),
    description: splitParagraphs(getT()("about.body")).join(" "),
  };

  return (
    <div className="page-scroll" data-has-top-bar={latestPost ? "true" : undefined}>
      <JsonLd data={jsonLd} />
      <ScrollReveals />
      <SectionSnap />
      {latestPost && (
        <HomeTopBar
          latestPost={{
            slug: latestPost.slug,
            title: latestPost.title,
            relativeLabel: getRelativeTimeLabel(latestPost.date),
          }}
        />
      )}
      <Hero
        data={config.hero}
        highlights={{
          // The top bar already announces the latest post whenever there is one,
          // so the deck shows its "browse the blog" card instead of repeating it.
          currentRole: config.experience[0]
            ? { role: config.experience[0].role, company: config.experience[0].company }
            : undefined,
          skills: flattenSkillNames(config.skills),
        }}
        socials={config.socials}
      />
      <Skills categories={config.skills} />
      <Experience items={config.experience} />
      <Project items={config.projects} />
      <Contact socialItems={config.socials} />
      <ArchitectureWidget />
      <SocialDock socialItems={config.socials} />
    </div>
  );
}
