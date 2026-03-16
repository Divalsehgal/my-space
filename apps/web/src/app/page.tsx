
import Hero from "@/containers/Home/Hero";
import About from "@/containers/Home/About";
import Experience from "@/containers/Home/Experience";
import Project from "@/containers/Home/Project";
import { getPortfolioConfig } from "@/lib/config/portfolio";
import Contact from "@/containers/Home/Contact";
import ScrollSnapControl from "@/components/ScrollSnapControl";
import { submitContact } from "./actions";

export default async function HomePage() {
  const { config } = await getPortfolioConfig();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Dival Sehgal",
    "url": "https://divalsehgal.com",
    "jobTitle": "Senior Software Engineer",
    "sameAs": config.socials?.map((s) => s.href) || [],
    "description": config.about?.paragraphs.join(" "),
  };

  return (
    <div className="page-scroll">
      <ScrollSnapControl />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero data={config.hero} />
      <About data={config.about} socials={config.socials} />
      <Experience items={config.experience} />
      <Project items={config.projects} />
      <Contact data={config.contact} action={submitContact} />
    </div>
  );
}
