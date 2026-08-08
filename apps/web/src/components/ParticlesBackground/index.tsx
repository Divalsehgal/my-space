"use client";

import { useEffect, useId, useMemo, useState, type CSSProperties } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { RecursivePartial, IOptions } from "@tsparticles/engine";
import * as LightTokens from "@dival-sehgal/design-tokens/light";
import * as DarkTokens from "@dival-sehgal/design-tokens/dark";
import { useThemeContext } from "@/context/ThemeContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";

/**
 * Cap on the number of particles rendered per frame. The previous value
 * (7000) forced the engine to allocate and redraw thousands of objects every
 * animation frame, dominating main-thread script-evaluation time. A starfield
 * background only needs a light sprinkle, so we keep this deliberately small
 * and let the `density` option scale it down further on smaller viewports.
 */
const PARTICLE_COUNT = 90;

type ParticlesBackgroundProps = {
  className?: string;
  style?: CSSProperties;
  id?: string;
  /** Set false when particles must remain inside the parent element. */
  fullScreen?: boolean;
};

export default function ParticlesBackground({
  className,
  style,
  id,
  fullScreen = true,
}: Readonly<ParticlesBackgroundProps>) {
  const [init, setInit] = useState(false);
  const generatedId = useId().replaceAll(":", "");
  const { mode } = useThemeContext();
  const Tokens = mode === "light" ? LightTokens : DarkTokens;

  // Honor the user's reduced-motion preference: skip the animated engine
  // entirely so we don't burn main-thread time on a decorative effect.
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  useEffect(() => {
    if (prefersReducedMotion) {return;}

    const initEngine = async () => {
      try {
        await initParticlesEngine(async (engine) => {
          await loadSlim(engine);
        });
        setInit(true);
      } catch (error) {
        console.error("Failed to initialize particles engine:", error);
        setInit(true); // Still set to true to render canvas
      }
    };

    initEngine();
  }, [prefersReducedMotion]);

  const options: RecursivePartial<IOptions> = useMemo(
    () => ({
      // Full-screen preserves the Hero's existing behavior. Nested uses can
      // opt out so their parent controls the canvas bounds.
      fullScreen: { enable: fullScreen },
      background: {
        color: { value: "transparent" },
      },
      // 60fps matches the browser's default paint cadence; 120 doubled the
      // per-frame work for no perceptible gain on most displays.
      fpsLimit: 60,
      interactivity: {
        events: {
          onClick: { enable: true, mode: "push" },
          onHover: {
            enable: true,
            mode: "repulse",
            parallax: { enable: true, force: 60, smooth: 10 },
          },
          resize: { enable: true, delay: 0.5 },
        },
        modes: {
          push: { quantity: 4 },
          grab: { distance: 100 },
          repulse: { distance: 100 },
        },
      },
      particles: {
        color: { value: Tokens.TColorsPrimaryDefault },
        // No links — stars only, no connecting lines
        links: { enable: false },
        move: {
          direction: "none",
          enable: true,
          outModes: { default: "bounce" },
          random: true,
          speed: 0.5,
          straight: false,
        },
        number: {
          density: { enable: true },
          value: PARTICLE_COUNT,
          // Hard ceiling so density scaling on very large / high-DPI
          // viewports can never balloon the object count again.
          limit: { value: PARTICLE_COUNT },
        },
        opacity: {
          value: { min: 0.1, max: 0.5 },
          animation: { enable: true, speed: 1, sync: false },
        },
        shape: { type: "circle" },
        size: { value: { min: 1, max: 3 } },
      },
      detectRetina: true,
    }),
    [fullScreen, Tokens.TColorsPrimaryDefault],
  );

  if (init) {
    return (
      <Particles
        id={id ?? `particles-${generatedId}`}
        options={options}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 2,
          pointerEvents: "none",
          ...style,
        }}
        className={className}
      />
    );
  }

  return null;
}
