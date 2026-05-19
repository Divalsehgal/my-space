"use client";

import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { RecursivePartial, IOptions } from "@tsparticles/engine";
import * as LightTokens from "@dival-sehgal/design-tokens/light";
import * as DarkTokens from "@dival-sehgal/design-tokens/dark";
import { useThemeContext } from "@/context/ThemeContext";

export default function ParticlesBackground() {
  const [init, setInit] = useState(false);
  const { mode } = useThemeContext();
  const Tokens = mode === "light" ? LightTokens : DarkTokens;

  useEffect(() => {
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
  }, []);

  const options: RecursivePartial<IOptions> = {
    background: {
      color: { value: "transparent" },
    },
    fpsLimit: 120,
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
        value: 7000,
      },
      opacity: {
        value: { min: 0.1, max: 0.5 },
        animation: { enable: true, speed: 1, sync: false },
      },
      shape: { type: "circle" },
      size: { value: { min: 1, max: 3 } },
    },
    detectRetina: true,
  };

  if (init) {
    return (
      <Particles
        id="tsparticles"
        options={options}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />
    );
  }

  return null;
}
