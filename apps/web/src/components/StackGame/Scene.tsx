"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  AMBIENT_LIGHT,
  BASE_BLOCK,
  BLOCK_HEIGHT,
  CAMERA,
  CAMERA_START,
  DEBRIS,
  DEMO_TOWER,
  FILL_LIGHT,
  GRAVITY,
  KEY_LIGHT,
  MAX_DPR,
  MAX_FRAME_SECONDS,
  PERFECT,
  RANGE,
  SPEED,
  VISIBLE_BLOCKS,
  colorFor,
  debrisSpin,
  type Block,
  type Physics,
} from "./constants";

export type StackGameApi = { drop: () => void; reset: () => void };

interface GameProps {
  onReady: (api: StackGameApi) => void;
  onPlaced: (height: number, perfect: boolean) => void;
  onGameOver: (height: number) => void;
}

function Game({ onReady, onPlaced, onGameOver }: Readonly<GameProps>) {
  const [blocks, setBlocks] = useState<Block[]>(DEMO_TOWER);
  const [debris, setDebris] = useState<Block[]>([]);

  // Source of truth for the game loop; React state above is only for rendering.
  const blocksRef = useRef<Block[]>(DEMO_TOWER);
  const debrisRef = useRef<Block[]>([]);
  const running = useRef(false);
  const moving = useRef({ axis: "x" as "x" | "z", pos: -RANGE, dir: 1, speed: 3 });
  const movingMesh = useRef<THREE.Mesh>(null);
  const debrisMeshes = useRef(new Map<number, THREE.Mesh>());
  // Falling-piece physics, kept apart from the (immutable) render state.
  const physics = useRef(new Map<number, Physics>());
  const nextId = useRef(1);
  const cameraY = useRef(DEMO_TOWER[DEMO_TOWER.length - 1].y);

  const callbacks = useRef({ onPlaced, onGameOver });
  useEffect(() => {
    callbacks.current = { onPlaced, onGameOver };
  }, [onPlaced, onGameOver]);

  useEffect(() => {
    const top = () => blocksRef.current[blocksRef.current.length - 1];

    const spawnDebris = (piece: Omit<Block, "id">) => {
      const id = nextId.current++;
      // Deterministic tumble per piece (no RNG needed for a visual wobble).
      physics.current.set(id, { y: piece.y, vy: 0, spin: debrisSpin(id) });
      debrisRef.current = [...debrisRef.current, { ...piece, id }];
      setDebris(debrisRef.current);
    };

    const reset = () => {
      blocksRef.current = [BASE_BLOCK];
      debrisRef.current = [];
      physics.current.clear();
      setBlocks(blocksRef.current);
      setDebris([]);
      moving.current = { axis: "x", pos: -RANGE, dir: 1, speed: 3 };
      running.current = true;
    };

    const drop = () => {
      if (!running.current) {return;}
      const prev = top();
      const m = moving.current;
      const height = blocksRef.current.length;
      const y = prev.y + BLOCK_HEIGHT;
      const color = colorFor(height);
      const along = m.axis === "x" ? prev.w : prev.d;
      const delta = m.pos - (m.axis === "x" ? prev.x : prev.z);
      const overlap = along - Math.abs(delta);

      // Missed entirely: the whole block falls and the run ends.
      if (overlap <= 0) {
        running.current = false;
        spawnDebris({
          x: m.axis === "x" ? m.pos : prev.x,
          z: m.axis === "z" ? m.pos : prev.z,
          w: prev.w,
          d: prev.d,
          y,
          color,
        });
        callbacks.current.onGameOver(height - 1);
        return;
      }

      const perfect = Math.abs(delta) < PERFECT;
      let placed: Block;
      if (perfect) {
        placed = { ...prev, id: nextId.current++, y, color };
      } else {
        const offset = delta / 2;
        const cutCenter = (along / 2) * Math.sign(delta) + offset;
        if (m.axis === "x") {
          placed = { id: nextId.current++, x: prev.x + offset, z: prev.z, w: overlap, d: prev.d, y, color };
          spawnDebris({ x: prev.x + cutCenter, z: prev.z, w: Math.abs(delta), d: prev.d, y, color });
        } else {
          placed = { id: nextId.current++, x: prev.x, z: prev.z + offset, w: prev.w, d: overlap, y, color };
          spawnDebris({ x: prev.x, z: prev.z + cutCenter, w: prev.w, d: Math.abs(delta), y, color });
        }
      }

      blocksRef.current = [...blocksRef.current, placed];
      setBlocks(blocksRef.current);
      moving.current = {
        axis: m.axis === "x" ? "z" : "x",
        pos: -RANGE,
        dir: 1,
        speed: Math.min(SPEED.start + height * SPEED.perBlock, SPEED.max),
      };
      callbacks.current.onPlaced(height, perfect);
    };

    onReady({ drop, reset });
  }, [onReady]);

  useFrame(({ camera, size }, rawDelta) => {
    const delta = Math.min(rawDelta, MAX_FRAME_SECONDS); // avoid jumps after tab switches
    const prev = blocksRef.current[blocksRef.current.length - 1];

    // Slide the active block back and forth.
    const m = moving.current;
    if (running.current) {
      m.pos += m.dir * m.speed * delta;
      if (m.pos > RANGE) {
        m.pos = RANGE;
        m.dir = -1;
      } else if (m.pos < -RANGE) {
        m.pos = -RANGE;
        m.dir = 1;
      }
    }
    if (movingMesh.current) {
      movingMesh.current.visible = running.current;
      movingMesh.current.position.set(
        m.axis === "x" ? m.pos : prev.x,
        prev.y + BLOCK_HEIGHT,
        m.axis === "z" ? m.pos : prev.z,
      );
      movingMesh.current.scale.set(prev.w, 1, prev.d);
      (movingMesh.current.material as THREE.MeshStandardMaterial).color.set(colorFor(blocksRef.current.length));
    }

    // Falling offcuts.
    let expired = false;
    physics.current.forEach((body, id) => {
      body.vy -= GRAVITY * delta;
      body.y += body.vy * delta;
      const mesh = debrisMeshes.current.get(id);
      if (mesh) {
        mesh.position.y = body.y;
        mesh.rotation.x += body.spin * delta;
        mesh.rotation.z += body.spin * DEBRIS.secondarySpin * delta;
      }
      if (body.y < prev.y - DEBRIS.fallDistance) {
        physics.current.delete(id);
        expired = true;
      }
    });
    if (expired) {
      debrisRef.current = debrisRef.current.filter((piece) => physics.current.has(piece.id));
      setDebris(debrisRef.current);
    }

    // Camera follows the top of the tower (kept just above centre, clear of
    // the score above and the panel below); zoom fits the canvas.
    cameraY.current += (prev.y - cameraY.current) * (1 - Math.exp(-delta * CAMERA.followRate));
    camera.position.set(CAMERA.distance, cameraY.current + CAMERA.distance, CAMERA.distance);
    camera.lookAt(0, cameraY.current - CAMERA.lookBelowTop, 0);
    const zoom = Math.min(size.width, size.height) / CAMERA.viewUnits;
    if (Math.abs(camera.zoom - zoom) > CAMERA.zoomEpsilon) {
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
    }
  });

  return (
    <>
      {blocks.slice(-VISIBLE_BLOCKS).map((b) => (
        <mesh key={b.id} position={[b.x, b.y, b.z]} scale={[b.w, 1, b.d]}>
          <boxGeometry args={[1, BLOCK_HEIGHT, 1]} />
          <meshStandardMaterial color={b.color} roughness={0.45} metalness={0.1} />
        </mesh>
      ))}

      {debris.map((piece) => (
        <mesh
          key={piece.id}
          ref={(mesh) => {
            if (mesh) {debrisMeshes.current.set(piece.id, mesh);}
            else {debrisMeshes.current.delete(piece.id);}
          }}
          position={[piece.x, piece.y, piece.z]}
          scale={[piece.w, 1, piece.d]}
        >
          <boxGeometry args={[1, BLOCK_HEIGHT, 1]} />
          <meshStandardMaterial color={piece.color} roughness={0.45} transparent opacity={0.85} />
        </mesh>
      ))}

      <mesh ref={movingMesh}>
        <boxGeometry args={[1, BLOCK_HEIGHT, 1]} />
        <meshStandardMaterial roughness={0.45} metalness={0.1} />
      </mesh>
    </>
  );
}

export default function StackGameScene({ active, ...props }: Readonly<GameProps & { active: boolean }>) {
  return (
    <Canvas
      orthographic
      dpr={[1, MAX_DPR]}
      camera={{ ...CAMERA_START, position: [CAMERA.distance, CAMERA.distance, CAMERA.distance] }}
      gl={{ antialias: true, alpha: true }}
      frameloop={active ? "always" : "never"}
    >
      <ambientLight intensity={AMBIENT_LIGHT} />
      <directionalLight position={[KEY_LIGHT.x, KEY_LIGHT.y, KEY_LIGHT.z]} intensity={KEY_LIGHT.intensity} />
      <directionalLight position={[FILL_LIGHT.x, FILL_LIGHT.y, FILL_LIGHT.z]} intensity={FILL_LIGHT.intensity} color={FILL_LIGHT.color} />
      <Game {...props} />
    </Canvas>
  );
}
