import Navbar from "@/components/Navbar";

import Hero from "@/section/Hero";
import About from "@/section/About";
import Experience from "@/section/Experience";
import Project from "@/section/Project";
import { getPortfolioConfig } from "@/lib/config/portfolio";
import Contact from "@/section/Contact";
import styles from "./page.module.scss";
export default async function HomePage() {
  const { config } = await getPortfolioConfig();

  return (
    <>
      <header>
        <Navbar />
      </header>

      <main className={styles["page-scroll"]}>
        <Hero data={config.hero} />
        <About data={config.about} />
        <Experience items={config.experience} />
        <Project items={config.projects} />
        <Contact data={config.contact} />
      </main>
    </>
  );
}
