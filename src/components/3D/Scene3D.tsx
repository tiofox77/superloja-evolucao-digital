import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Stars } from '@react-three/drei';
import { FloatingProduct } from './FloatingProduct';

interface Scene3DProps {
  slideIndex: number;
}

export const Scene3D = ({ slideIndex }: Scene3DProps) => {
  const getSceneConfig = () => {
    switch (slideIndex) {
      case 0: // Tech
        return [
          { position: [2, 1, -2], color: "#3b82f6" },
          { position: [-2, -1, -1], color: "#8b5cf6" },
          { position: [0, 2, -3], color: "#06b6d4" }
        ];
      case 1: // Audio
        return [
          { position: [1.5, 0.5, -2], color: "#f59e0b" },
          { position: [-1.5, -0.5, -1], color: "#ef4444" },
          { position: [0, 1.5, -3], color: "#f97316" }
        ];
      case 2: // Health
        return [
          { position: [2, 0, -2], color: "#10b981" },
          { position: [-2, 1, -1], color: "#ec4899" },
          { position: [0, -1, -3], color: "#8b5cf6" }
        ];
      default:
        return [
          { position: [1, 1, -2], color: "#6366f1" },
          { position: [-1, -1, -1], color: "#84cc16" }
        ];
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <Environment preset="sunset" />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        {getSceneConfig().map((config, index) => (
          <FloatingProduct
            key={`${slideIndex}-${index}`}
            position={config.position as [number, number, number]}
            color={config.color}
            speed={1 + index * 0.2}
          />
        ))}
        
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
};