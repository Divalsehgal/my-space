"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import styles from "./styles.module.scss";
import { ICON_BY_TYPE, type ArchitectureNodeType, type ArchitectureFlowNode } from "./constants";

export type { ArchitectureNodeType, ArchitectureNodeData, ArchitectureFlowNode } from "./constants";

export default function ArchitectureNode({ data, type, selected }: NodeProps<ArchitectureFlowNode>) {
  const nodeType = (type ?? "default") as ArchitectureNodeType;
  const Icon = ICON_BY_TYPE[nodeType];

  return (
    <div className={styles.node} data-type={nodeType} data-selected={selected}>
      <Handle type="target" position={Position.Top} className={styles.handle} />
      <Icon className={styles.icon} fontSize="small" />
      <span className={styles.label}>{data.label}</span>
      <Handle type="source" position={Position.Bottom} className={styles.handle} />
    </div>
  );
}
