"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, OrbitControls, Edges } from "@react-three/drei";
import { motion } from "motion/react";
import { useRef } from "react";
import * as THREE from "three";

function CoreGeometry() {
  const group = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.y = state.clock.elapsedTime * 0.05;
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
  });

  return (
    <group ref={group}>
      {/* DIŞ CAM KAFES - Daha seffaf ve cizgileri belirgin */}
      <mesh>
        <icosahedronGeometry args={[2.5, 1]} />
        <meshPhysicalMaterial
          color="#02050A"
          metalness={0.8}
          roughness={0.2}
          transparent
          opacity={0.15} /* Karanlik kutle olmamasi icin opacity dusuruldu */
        />
        <Edges scale={1} threshold={15} color="#1c8cff" opacity={0.3} transparent />
      </mesh>
      
      {/* İÇ PARLAYAN ÇEKİRDEK ÇİZGİLERİ */}
      <mesh scale={0.65}>
        <icosahedronGeometry args={[2, 0]} />
        <meshBasicMaterial color="#0878ff" wireframe transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

// Logo artik HTML uzerinde tam merkezde, Canvas'in uzerinde duruyor
function CoreLogo() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      <div className="relative flex items-center justify-center">
        {/* Arkasindaki mavi parlama */}
        <div className="absolute w-[80px] h-[80px] md:w-[120px] md:h-[120px] bg-[#0878ff] rounded-full blur-[40px] md:blur-[60px] opacity-50"></div>
        {/* Gercek Logo - Public klasorunden */}
        <img 
          src="/brand/aegisora-logo-blue.png" 
          alt="Aegisora Core" 
          className="relative z-10 w-16 h-16 md:w-28 md:h-28 object-contain drop-shadow-[0_0_20px_rgba(8,120,255,1)]"
        />
      </div>
    </div>
  );
}

export function AegisoraCore() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      /* Mobilde kucuk, Desktopta buyuk - Responsive ayarlandi */
      className="relative w-full aspect-square max-w-[320px] sm:max-w-[450px] lg:max-w-[750px] mx-auto flex items-center justify-center"
    >
      {/* En arkadaki devasa ortam isigi */}
      <div className="absolute left-1/2 top-1/2 h-[200px] w-[200px] lg:h-[500px] lg:w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0878ff]/10 blur-[80px] lg:blur-[150px] pointer-events-none" />
      
      <Canvas
        camera={{ position: [0, 0, 8], fov: 40 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        className="z-10"
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={10} color="#0878ff" />
        <Environment preset="night" />
        <Float speed={1} rotationIntensity={0.1} floatIntensity={0.2}>
          <CoreGeometry />
        </Float>
        <OrbitControls enablePan={false} enableZoom={false} enableRotate={false} />
      </Canvas>
      
      <CoreLogo />
    </motion.div>
  );
}
