import { CloudIcon, DnsIcon, LanguageIcon, StorageIcon, WidgetsIcon } from "@dival-sehgal/ui/icons";
import { type Node } from "@xyflow/react";

export type ArchitectureNodeType = "frontend" | "backend" | "external" | "data" | "default";

export type ArchitectureNodeData = {
  label: string;
  description?: string;
};

export type ArchitectureFlowNode = Node<ArchitectureNodeData, ArchitectureNodeType>;

export const ICON_BY_TYPE: Record<ArchitectureNodeType, typeof LanguageIcon> = {
  frontend: LanguageIcon,
  backend: DnsIcon,
  external: CloudIcon,
  data: StorageIcon,
  default: WidgetsIcon,
};
