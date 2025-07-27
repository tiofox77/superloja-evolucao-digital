import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface FloatingProductProps {
  position: [number, number, number];
  color: string;
  speed?: number;
}

export const FloatingProduct = ({ position, color, speed = 1 }: FloatingProductProps) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * speed) * 0.2;
      meshRef.current.rotation.y += 0.01 * speed;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={1} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position} scale={[0.8, 0.8, 0.8]}>
        <boxGeometry args={[1, 1, 1]} />
        <MeshDistortMaterial
          color={color}
          speed={2}
          distort={0.3}
          radius={1}
          transparent
          opacity={0.8}
        />
      </mesh>
    </Float>
  );
};