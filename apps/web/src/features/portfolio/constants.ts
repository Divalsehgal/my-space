import { type PortfolioConfig } from "./schema";

export const FALLBACK_CONFIG: PortfolioConfig = {
  hero: {
    title: "Hi, I’m Dival Sehgal",
    subtitle: "Senior Frontend Engineer — I build high-performance, scalable web applications using Next.js, React, and TypeScript.",
    primaryCtaLabel: "Projects",
    primaryCtaHref: "#projects",
    secondaryCtaLabel: "Contact",
    secondaryCtaHref: "#contact",
    badge: {
      label: "Available for Opportunities",
      enabled: true,
    },
    resumeLabel: "View Resume",
    resumeUrl: "https://drive.google.com/file/d/1ZIXNdo4AEoXM5o0ujwQN82kNnTU24kFC/view?usp=drive_link"
  },
  about: {
    title: "About Me",
    paragraphs: [
      "I'm a Senior Frontend Engineer with 5+ years of experience building performant and scalable web applications using React, Next.js, and TypeScript.",
      "I specialize in building data-driven dashboards, scalable design systems, and optimizing frontend performance using real-world analytics and user behavior insights.",
      "Outside of work, I love hiking, exploring national parks and wildlife sanctuaries, and spending time in nature — it helps me reset and think more clearly about complex problems."
    ],
    facts: [
      "5+ years of experience",
      "Focus: Performance & UX",
      "Interests: Nature Explorer 🌿"
    ],
    resumeUrl: "https://drive.google.com/file/d/1ZIXNdo4AEoXM5o0ujwQN82kNnTU24kFC/view?usp=drive_link"
  },
  experience: [
    {
      id: "exp-ingenio",
      company: "Ingenio",
      role: "Senior Frontend Engineer",
      period: "05/2024 - Present",
      location: "Bengaluru, IN",
      description: [
        {
          id: "ingenio-1",
          text: "Transformed the Advisor Dashboard into a data-driven insights platform with charts and analytics, improving engagement by 25% using Hotjar-driven optimizations."
        },
        {
          id: "ingenio-2",
          text: "Revamped the Advisor Onboarding flow from Ember.js to Next.js, improving performance and UX while integrating Tipalti and Jumio for tax verification."
        }
      ],
      techStack: ["Next.js", "React", "Node.js", "Sass", "RTK Query"]
    }
  ],
  projects: [
    {
      name: "Travel Template Generator",
      description: "Generates structured travel itineraries and templates for trips, helping users plan journeys efficiently with reusable formats.",
      techStack: ["Next.js", "React", "TypeScript"],
      repo: "https://github.com/Divalsehgal/travel-template-generator"
    },
    {
      name: "Excel Clone",
      description: "Spreadsheet application supporting cell editing, formulas, and formatting with a performant React architecture.",
      techStack: ["React", "JavaScript", "CSS"],
      link: "https://dival-excel.vercel.app",
      image: "https://images.unsplash.com/photo-1587620962725-abab7fe55159"
    }
  ],
  metadata: {
    title: "Dival Sehgal | Senior Frontend Engineer",
    description: "Portfolio of Dival Sehgal, a Senior Frontend Engineer specializing in Next.js, React, and high-performance UI architecture.",
    keywords: ["Frontend Engineer", "Next.js", "React", "TypeScript", "Bangalore"]
  },
  socials: [
    {
      label: "Github",
      href: "https://github.com/Divalsehgal",
      icon: "github"
    },
    {
      label: "Linkedin",
      href: "https://linkedin.com/in/divalsehgal",
      icon: "linkedin"
    }
  ],
  contact: {
    title: "Get in Touch",
    subtitle: "Have a project in mind or just want to chat? Feel free to reach out!",
    email: "sehgaldival@gmail.com"
  }
};
