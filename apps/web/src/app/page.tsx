import Hero from "@/containers/Home/Hero";
import About from "@/containers/Home/About";
import Skills from "@/containers/Home/Skills";
import Architecture from "@/containers/Home/Architecture";
import Experience from "@/containers/Home/Experience";
import Project from "@/containers/Home/Project";
import { portfolioService } from "@/features/portfolio";
import Contact from "@/containers/Home/Contact";
import ScrollSnapControl from "@/components/ScrollSnapControl";
import JsonLd from "@/components/JsonLd";
import HomeTopBar from "@/components/HomeTopBar";
import { getLatestContentfulPost } from "@/lib/services/contentful";
import { getRelativeTimeLabel } from "@/utils/date";

// TEMP: local preview fixture describing this repo's actual architecture, so
// the Architecture section can be visually verified before this same JSON is
// copied into the remote portfolio-config repo's config.json. Remove this
// fallback (and the ternary below) once that remote config carries the real
// `architecture` block.
const SAMPLE_ARCHITECTURE = {
  title: "Architecture",
  subtitle: "How this site is actually built and served, end to end.",
  nodes: [
    {
      id: "browser",
      position: { x: 1250, y: 0 },
      type: "frontend" as const,
      data: {
        label: "Browser (Client)",
        description:
          "The visitor's browser. Renders the client components - contact form, chatbot widget, blog view tracker, GA scripts - and calls the Cloudflare Worker directly for chat, bypassing the Next.js server entirely.",
      },
    },
    {
      id: "nextjs-server",
      position: { x: 300, y: 300 },
      type: "backend" as const,
      data: {
        label: "Next.js Server",
        description:
          "React 19 + Next.js App Router on Turbopack, deployed to Vercel. Server Components, API routes, and Server Actions - the hub that talks to Contentful, the portfolio config repo, Notion, and Redis.",
      },
    },
    {
      id: "chatbot-worker",
      position: { x: 1400, y: 300 },
      type: "backend" as const,
      data: {
        label: "AI Chatbot Worker",
        description:
          "A separate Cloudflare Worker the chat widget calls directly from the browser. Runs retrieval-augmented chat via Workers AI + Vectorize, can submit a contact form to the Next.js server on the visitor's behalf, and re-embeds its knowledge whenever a new blog post is published.",
      },
    },
    {
      id: "google-analytics",
      position: { x: 2300, y: 300 },
      type: "external" as const,
      data: {
        label: "Google Analytics / GTM",
        description:
          "GA4 loaded via gtag.js/GTM, client-side only. Skipped entirely when the site owner's local \"owner mode\" flag is set, so the owner's own visits aren't tracked.",
      },
    },
    {
      id: "contentful",
      position: { x: -460, y: 600 },
      type: "external" as const,
      data: {
        label: "Contentful CMS",
        description:
          "Headless CMS for blog posts and rich content, queried over GraphQL. A publish webhook hits /api/revalidate to bust the Next.js cache by tag.",
      },
    },
    {
      id: "portfolio-config",
      position: { x: 0, y: 600 },
      type: "data" as const,
      data: {
        label: "Portfolio Config",
        description:
          "A JSON file hosted in a separate GitHub repo, fetched at request time (2-minute ISR) and validated with Zod - the source of truth for hero, experience, skills, and projects copy.",
      },
    },
    {
      id: "notion",
      position: { x: 460, y: 600 },
      type: "data" as const,
      data: {
        label: "Notion",
        description:
          "Contact submissions land here as new database rows. Both the contact form's Server Action and the chatbot's forwarded messages go through the same server-side Notion API call.",
      },
    },
    {
      id: "redis",
      position: { x: 920, y: 600 },
      type: "data" as const,
      data: {
        label: "Upstash Redis",
        description:
          "Serverless Redis used for blog view counts, unique-visitor tracking, referrer/country breakdowns, and per-IP rate limiting. Reads/writes silently no-op if credentials aren't configured.",
      },
    },
    {
      id: "workers-ai",
      position: { x: 1400, y: 600 },
      type: "external" as const,
      data: {
        label: "Workers AI",
        description:
          "Cloudflare's hosted model runtime. Runs the llama-3.3-70b-instruct chat model for replies and the bge-base-en-v1.5 embedding model, used both to answer questions and to build the Vectorize index.",
      },
    },
    {
      id: "vectorize",
      position: { x: 1820, y: 600 },
      type: "data" as const,
      data: {
        label: "Vectorize Index",
        description: "Cloudflare's vector database - holds content embeddings for retrieval-augmented chatbot answers.",
      },
    },
    {
      id: "chat-sessions-kv",
      position: { x: 2240, y: 600 },
      type: "data" as const,
      data: {
        label: "Workers KV (Sessions)",
        description:
          "Cloudflare Workers KV - stores each visitor's chat history behind a session cookie, per-IP rate-limit counters, and daily chat-usage stats.",
      },
    },
  ],
  edges: [
    // Node pairs with more than one edge between them only carry a label on
    // ONE edge: React Flow places every edge's label at the straight-line
    // midpoint between the two nodes regardless of curvature or direction, so
    // a second label on the same pair would always land exactly on top of
    // the first. The unlabeled edge is still real (see that node's own
    // description) - distinguished visually by direction, animation, and curvature.
    { id: "e-browser-server", source: "browser", target: "nextjs-server", label: "contact + view requests" },
    { id: "e-browser-chat", source: "browser", target: "chatbot-worker", label: "chat queries", animated: true },
    { id: "e-browser-ga", source: "browser", target: "google-analytics", label: "page views" },

    { id: "e-server-contentful", source: "nextjs-server", target: "contentful", label: "GraphQL query", curvature: 0.5 },
    { id: "e-contentful-server", source: "contentful", target: "nextjs-server", animated: true, curvature: -0.5 },
    { id: "e-server-config", source: "nextjs-server", target: "portfolio-config", label: "fetches JSON" },
    { id: "e-server-notion", source: "nextjs-server", target: "notion", label: "creates entry" },
    { id: "e-server-redis", source: "nextjs-server", target: "redis", label: "views + rate limit" },

    { id: "e-chat-server", source: "chatbot-worker", target: "nextjs-server", label: "submits contact (via chat)", curvature: 0.5 },
    { id: "e-server-chat-seed", source: "nextjs-server", target: "chatbot-worker", animated: true, curvature: -0.5 },
    { id: "e-chat-ai", source: "chatbot-worker", target: "workers-ai", label: "LLM + embeddings" },
    { id: "e-chat-vectorize", source: "chatbot-worker", target: "vectorize", label: "RAG lookup" },
    { id: "e-chat-kv", source: "chatbot-worker", target: "chat-sessions-kv", label: "sessions + rate limit" },
  ],
};

export default async function HomePage() {
  const { config } = await portfolioService.getConfig();
  const latestPost = await getLatestContentfulPost();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Dival Sehgal",
    url: "https://divalsehgal.vercel.app",
    jobTitle: "Senior Software Engineer",
    sameAs: config.socials.map((s) => s.href),
    description: config.about.paragraphs.join(" "),
  };

  return (
    <div className="page-scroll" data-has-top-bar={latestPost ? "true" : undefined}>
      <ScrollSnapControl />
      <JsonLd data={jsonLd} />
      {latestPost && (
        <HomeTopBar
          latestPost={{
            slug: latestPost.slug,
            title: latestPost.title,
            relativeLabel: getRelativeTimeLabel(latestPost.date),
          }}
        />
      )}
      <Hero data={config.hero} />
      <About data={config.about} socials={config.socials} />
      <Skills categories={config.skills} />
      <Architecture data={config.architecture.nodes.length ? config.architecture : SAMPLE_ARCHITECTURE} />
      <Experience items={config.experience} />
      <Project items={config.projects} />
      <Contact socialItems={config.socials} data={config.contact} />
    </div>
  );
}
