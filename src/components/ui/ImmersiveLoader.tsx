import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, OrbitControls, Sphere, Box, Torus } from '@react-three/drei';
import { cn } from '@/lib/utils';
import * as THREE from 'three';

interface FloatingElementProps {
  position: [number, number, number];
  color: string;
  delay: number;
}

const FloatingElement: React.FC<FloatingElementProps> = ({ position, color, delay }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime;
      meshRef.current.position.y = position[1] + Math.sin(time * 2 + delay) * 0.5;
      meshRef.current.rotation.x = time * 0.5 + delay;
      meshRef.current.rotation.y = time * 0.3 + delay;
      meshRef.current.scale.setScalar(1 + Math.sin(time * 3 + delay) * 0.1);
    }
  });

  return (
    <Box ref={meshRef} position={position} args={[0.5, 0.5, 0.5]}>
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
    </Box>
  );
};

const CentralSphere: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime;
      meshRef.current.rotation.y = time * 0.5;
      meshRef.current.rotation.x = Math.sin(time * 0.3) * 0.2;
    }
  });

  return (
    <Sphere ref={meshRef} args={[1, 32, 32]} position={[0, 0, 0]}>
      <meshStandardMaterial 
        color="#4F46E5" 
        emissive="#4F46E5" 
        emissiveIntensity={0.3}
        metalness={0.7}
        roughness={0.2}
      />
    </Sphere>
  );
};

const LoadingRing: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = state.clock.elapsedTime * 2;
    }
  });

  return (
    <Torus ref={meshRef} args={[2, 0.1, 16, 100]} position={[0, 0, 0]}>
      <meshStandardMaterial 
        color="#F59E0B" 
        emissive="#F59E0B" 
        emissiveIntensity={0.4}
      />
    </Torus>
  );
};

const AnimatedCamera: React.FC = () => {
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    // Efeito de zoom in com movimento suave
    const targetZ = 5 + Math.sin(time * 0.5) * 1;
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, 0.02);
    
    // Movimento orbital suave
    state.camera.position.x = Math.cos(time * 0.1) * 0.5;
    state.camera.position.y = Math.sin(time * 0.15) * 0.3;
    state.camera.lookAt(0, 0, 0);
  });

  return null;
};

const ParticleField: React.FC = () => {
  const points = useRef<THREE.Points>(null);
  
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(200 * 3);
    for (let i = 0; i < 200; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={200}
          array={particlesPosition}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#8B5CF6" size={0.05} />
    </points>
  );
};

interface ImmersiveLoaderProps {
  className?: string;
  showText?: boolean;
  text?: string;
}

export const ImmersiveLoader: React.FC<ImmersiveLoaderProps> = ({
  className,
  showText = true,
  text = 'Carregando experiência imersiva...'
}) => {
  const floatingElements = [
    { position: [3, 1, -2] as [number, number, number], color: "#EF4444", delay: 0 },
    { position: [-3, -1, -1] as [number, number, number], color: "#10B981", delay: 1 },
    { position: [0, 3, -3] as [number, number, number], color: "#3B82F6", delay: 2 },
    { position: [2, -2, 1] as [number, number, number], color: "#F59E0B", delay: 3 },
    { position: [-2, 2, 2] as [number, number, number], color: "#8B5CF6", delay: 4 },
  ];

  return (
    <div className={cn("relative w-full h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden", className)}>
      {/* Efeito de luz de fundo */}
      <div className="absolute inset-0 bg-gradient-radial from-purple-600/20 via-transparent to-transparent animate-pulse"></div>
      
      {/* Canvas 3D */}
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        className="absolute inset-0"
      >
        <color attach="background" args={['#0F0F23']} />
        
        {/* Luzes */}
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#4F46E5" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#F59E0B" />
        <spotLight 
          position={[0, 5, 5]} 
          angle={0.3} 
          intensity={1} 
          color="#8B5CF6"
          castShadow
        />

        {/* Elementos 3D */}
        <CentralSphere />
        <LoadingRing />
        <ParticleField />
        
        {/* Elementos flutuantes */}
        {floatingElements.map((element, index) => (
          <FloatingElement
            key={index}
            position={element.position}
            color={element.color}
            delay={element.delay}
          />
        ))}

        {/* Texto 3D */}
        <Text
          position={[0, -4, 0]}
          fontSize={0.5}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
          font="/fonts/helvetiker_regular.typeface.json"
        >
          SuperLoja
        </Text>

        {/* Câmera animada */}
        <AnimatedCamera />
        
        {/* Controles opcionais (desabilitados para loading) */}
        <OrbitControls 
          enabled={false}
          autoRotate={false}
        />
      </Canvas>

      {/* Interface overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center z-10">
          {/* Indicador de loading circular */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 border-4 border-purple-300/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-purple-400 rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-2 border-transparent border-t-blue-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>

          {showText && (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4 animate-fade-in">
                {text}
              </h2>
              <div className="flex justify-center space-x-2">
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Efeitos de borda */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse"></div>
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-purple-400 to-transparent animate-pulse"></div>
        <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-transparent via-blue-400 to-transparent animate-pulse"></div>
      </div>
    </div>
  );
};