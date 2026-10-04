import type { PointerEvent, RefObject } from "react";
import { SPHERE } from "./constants";

/** The sphere's live rotation and input state, mutated every frame (never React state). */
export type SphereMotion = {
  rotX: number;
  rotY: number;
  velX: number;
  velY: number;
  dragging: boolean;
  moved: boolean;
  lastX: number;
  lastY: number;
  hovering: boolean;
  target: null | { x: number; y: number };
};

/** Drag to spin: pointer movement becomes angular velocity; a real drag cancels any glide. */
export function useSphereDrag(state: RefObject<SphereMotion>) {
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    Object.assign(state.current, { dragging: true, moved: false, lastX: event.clientX, lastY: event.clientY });
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const s = state.current;
    if (!s.dragging) {return;}
    const dx = event.clientX - s.lastX;
    const dy = event.clientY - s.lastY;
    if (Math.abs(dx) + Math.abs(dy) > SPHERE.dragThreshold) {
      s.moved = true;
      s.target = null;
    }
    s.velY = dx * SPHERE.dragSensitivity;
    s.velX = -dy * SPHERE.dragSensitivity;
    s.lastX = event.clientX;
    s.lastY = event.clientY;
  };
  const endDrag = () => {
    state.current.dragging = false;
  };

  return { onPointerDown, onPointerMove, endDrag };
}
