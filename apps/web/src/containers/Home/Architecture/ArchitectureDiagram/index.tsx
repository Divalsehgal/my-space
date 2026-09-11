"use client";

import { useMemo, useState } from "react";
import { ReactFlow, Background, Controls, MarkerType, type Edge } from "@xyflow/react";
// No CSS import from "@xyflow/react/dist/*.css" here on purpose: this
// project's Turbopack dev build silently collapses those chunks (and even a
// locally vendored copy of the same file) down to a couple of stray rules,
// dropping essentials like `.react-flow__node { position: absolute }`. The
// required subset of React Flow's base styles is inlined into
// styles.module.scss instead, which - unlike a plain .css import - compiles
// reliably in this setup.
import { AnimatePresence, motion } from "framer-motion";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import ArchitectureNode, { type ArchitectureFlowNode } from "../ArchitectureNode";
import styles from "./styles.module.scss";
import { type ArchitectureNodeConfig, type ArchitectureEdgeConfig } from "@/features/portfolio";
import { useThemeContext } from "@/context/ThemeContext";
import { TColorsTextSecondaryMuted as EDGE_COLOR_LIGHT } from "@dival-sehgal/design-tokens/light";
import { TColorsTextSecondaryMuted as EDGE_COLOR_DARK } from "@dival-sehgal/design-tokens/dark";

// One presentational component reused for every node type - the visual
// variant comes from the `type`/`data-type` attribute, not a different component.
const nodeTypes = {
  frontend: ArchitectureNode,
  backend: ArchitectureNode,
  external: ArchitectureNode,
  data: ArchitectureNode,
  default: ArchitectureNode,
};

interface ArchitectureDiagramProps {
  nodes: ArchitectureNodeConfig[];
  edges: ArchitectureEdgeConfig[];
}

export default function ArchitectureDiagram({ nodes, edges }: ArchitectureDiagramProps) {
  const [selectedNode, setSelectedNode] = useState<ArchitectureNodeConfig | null>(null);
  const { mode } = useThemeContext();
  // React Flow's arrowhead marker takes its fill/stroke from an inline style
  // computed from this `color`, which always wins over a CSS override - so
  // the theme-aware color has to be supplied here, matching the edge-path
  // color set in styles.module.scss.
  const edgeColor = mode === "dark" ? EDGE_COLOR_DARK : EDGE_COLOR_LIGHT;

  const flowNodes: ArchitectureFlowNode[] = useMemo(
    () =>
      nodes.map((node) => ({
        id: node.id,
        position: node.position,
        type: node.type ?? "default",
        data: node.data,
      })),
    [nodes],
  );

  const flowEdges: Edge[] = useMemo(
    () =>
      edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        animated: edge.animated,
        markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: edgeColor },
        pathOptions: edge.curvature !== undefined ? { curvature: edge.curvature } : undefined,
      })),
    [edges, edgeColor],
  );

  return (
    <div className={styles.canvas}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        fitView
        // This graph is much wider than it is tall - fitting its full width
        // into the canvas needs a smaller scale than React Flow's default
        // minZoom (0.5) allows, which otherwise clips the outermost nodes
        // right out of the initial view.
        minZoom={0.15}
        fitViewOptions={{ padding: 0.15 }}
        nodesDraggable={false}
        nodesConnectable={false}
        panOnScroll
        zoomOnScroll
        onNodeClick={(_, node) => {
          setSelectedNode(nodes.find((n) => n.id === node.id) ?? null);
        }}
        onPaneClick={() => setSelectedNode(null)}
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>

      <AnimatePresence>
        {selectedNode && (
          <motion.div
            key="architecture-detail"
            className={styles.detail}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
          >
            <div className={styles["detail__header"]}>
              <span className={styles["detail__title"]}>{selectedNode.data.label}</span>
              <IconButton size="small" aria-label="Close details" onClick={() => setSelectedNode(null)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </div>
            {selectedNode.data.description && (
              <p className={styles["detail__copy"]}>{selectedNode.data.description}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
