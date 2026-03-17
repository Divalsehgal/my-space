
import Hero from "@/containers/Home/Hero";
import About from "@/containers/Home/About";
import Experience from "@/containers/Home/Experience";
import Project from "@/containers/Home/Project";
import { portfolioService } from "@/features/portfolio";
import Contact from "@/containers/Home/Contact";
import ScrollSnapControl from "@/components/ScrollSnapControl";
import JsonLd from "@/components/JsonLd";
import { submitContact } from "./actions";

export default async function HomePage() {
  const { config } = await portfolioService.getConfig();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Dival Sehgal",
    "url": "https://divalsehgal.vercel.app",
    "jobTitle": "Senior Software Engineer",
    "sameAs": config.socials?.map((s) => s.href) || [],
    "description": config.about?.paragraphs.join(" "),
  };

  return (
    <div className="page-scroll">
      <ScrollSnapControl />
      <JsonLd data={jsonLd} />
      <Hero data={config.hero} />
      <About data={config.about} socials={config.socials} />
      <Experience items={config.experience} />
      <Project items={config.projects} />
      <Contact data={config.contact} action={submitContact} />
    </div>
  );
}
