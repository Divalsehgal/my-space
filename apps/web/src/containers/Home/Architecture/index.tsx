import FluidContainer from "@/components/FluidContainer";
import SectionHeader from "@/components/SectionHeader";
import ArchitectureDiagram from "./ArchitectureDiagram";
import { type ArchitectureConfig } from "@/features/portfolio";

interface ArchitectureProps {
  data?: ArchitectureConfig;
}

export default function Architecture({ data }: ArchitectureProps) {
  if (!data?.nodes?.length) {
    return null;
  }

  return (
    <FluidContainer as="section" id="architecture" className="section">
      <SectionHeader
        title={data.title ?? "Architecture"}
        subtitle={data.subtitle ?? "How this site is built, end to end."}
        align="left"
      />

      <ArchitectureDiagram nodes={data.nodes} edges={data.edges} />
    </FluidContainer>
  );
}
