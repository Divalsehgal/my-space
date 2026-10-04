import { ArchitectureConfigSchema, type ArchitectureConfig, portfolioService } from "@/features/portfolio";
import generatedArchitecture from "@/generated/architecture.json";

// Generated from the codebase on every dev/build run (scripts/generate-architecture.mjs),
// so the diagram tracks the real system. A remote config can still override it.
const GENERATED_ARCHITECTURE = ArchitectureConfigSchema.parse(generatedArchitecture);

export async function getArchitecture(): Promise<ArchitectureConfig> {
  const { config } = await portfolioService.getConfig();
  return config.architecture.nodes.length ? config.architecture : GENERATED_ARCHITECTURE;
}
