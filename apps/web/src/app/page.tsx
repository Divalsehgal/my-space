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
import { getContentfulPosts } from "@/lib/services/contentful";
import FluidContainer from "@/components/FluidContainer";
import RelatedPosts from "@/components/RelatedPosts";
import { getRelativeTimeLabel } from "@/utils/date";
import { SITE_URL, AUTHOR, PERSON_ID, WEBSITE_ID } from "@/lib/config/site";
import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { splitParagraphs } from "@dival-sehgal/utils/string";

const RECENT_POST_COUNT = 3;

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default async function HomePage() {
  const { config } = await portfolioService.getConfig();
  // Newest first; linking several posts here passes homepage authority to the blog.
  const recentPosts = await getContentfulPosts(RECENT_POST_COUNT);
  const latestPost = recentPosts[0];
  const currentJob = config.experience[0];
  // One linked graph (WebSite -> ProfilePage -> Person) so answer engines can
  // resolve "who is this" to a single entity; blog posts point at the same @id.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: SITE_URL,
        name: AUTHOR.name,
        inLanguage: "en",
        publisher: { "@id": PERSON_ID },
      },
      {
        "@type": "ProfilePage",
        "@id": `${SITE_URL}/#profile`,
        url: SITE_URL,
        isPartOf: { "@id": WEBSITE_ID },
        mainEntity: { "@id": PERSON_ID },
      },
      {
        "@type": "Person",
        "@id": PERSON_ID,
        name: AUTHOR.name,
        url: SITE_URL,
        image: `${SITE_URL}${AUTHOR.image}`,
        jobTitle: AUTHOR.jobTitle,
        email: config.contact?.email ? `mailto:${config.contact.email}` : undefined,
        // The config's company can carry a note ("EPAM Systems — Clients: …"); the org is the part before it.
        worksFor: currentJob ? { "@type": "Organization", name: currentJob.company.split(" — ")[0] } : undefined,
        knowsAbout: flattenSkillNames(config.skills),
        sameAs: config.socials.map((s) => s.href),
        description: splitParagraphs(getT()("about.body")).join(" "),
      },
    ],
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
      {recentPosts.length > 0 && (
        <FluidContainer as="section" id="writing" className="section">
          <RelatedPosts posts={recentPosts} />
        </FluidContainer>
      )}
      <Contact socialItems={config.socials} />
      <ArchitectureWidget />
      <SocialDock socialItems={config.socials} />
    </div>
  );
}
