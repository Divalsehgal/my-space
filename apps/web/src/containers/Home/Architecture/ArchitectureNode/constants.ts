import LanguageIcon from "@mui/icons-material/Language";
import DnsIcon from "@mui/icons-material/Dns";
import CloudIcon from "@mui/icons-material/Cloud";
import StorageIcon from "@mui/icons-material/Storage";
import WidgetsIcon from "@mui/icons-material/Widgets";
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
