const ACRONYMS: Record<string, string> = {
  ai: "AI",
  api: "API",
  aws: "AWS",
  mcp: "MCP",
  rag: "RAG",
  llm: "LLM",
};

/**
 * Turns a config key like "aiEngineering" or "qualityAndTesting" into a
 * display label ("AI Engineering", "Quality & Testing"), preserving known
 * acronyms and treating "and" as "&".
 */
export function humanizeSkillKey(key: string): string {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[\s_-]+/)
    .filter(Boolean);

  return words
    .map((word) => {
      const lower = word.toLowerCase();
      if (ACRONYMS[lower]) {
        return ACRONYMS[lower];
      }
      if (lower === "and") {
        return "&";
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}
