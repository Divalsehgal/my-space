"use client";

import { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import * as THREE from "three";
import styles from "./styles.module.scss";

import { useScroll, useTransform } from "framer-motion";
import * as LightTokens from "@dival-sehgal/design-tokens/light";
import * as DarkTokens from "@dival-sehgal/design-tokens/dark";
import { useThemeContext } from "@/context/ThemeContext";

const TechObject = () => {
    const meshRef = useRef<THREE.Mesh>(null);
    const { scrollY } = useScroll();
    const { mode } = useThemeContext();
    const Tokens = mode === "light" ? LightTokens : DarkTokens;
    
    const yTransform = useTransform(scrollY, [0, 1000], [0, 0.5]);
    
    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        if (meshRef.current) {
            meshRef.current.rotation.x = Math.sin(time / 2);
            meshRef.current.rotation.y = Math.sin(time / 4);
            meshRef.current.position.y = Math.sin(time) * 0.1 + yTransform.get();
        }
    });

    return (
        <mesh ref={meshRef}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color={Tokens.TColorsPrimaryDefault} wireframe />
        </mesh>
    );
}

const StarsCanvas = () => {
    return (
        <div className={styles.canvasContainer}>
            <Canvas camera={{ position: [0, 0, 1] }}>
                <Suspense fallback={null}>
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} />
                    <TechObject />
                </Suspense>
                <Preload all />
            </Canvas>
        </div>
    );
};

export default StarsCanvas;
