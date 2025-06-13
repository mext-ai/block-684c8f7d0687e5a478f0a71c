import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sky, Text } from '@react-three/drei';
import * as THREE from 'three';

interface BlockProps {
  title?: string;
  description?: string;
}

// Voxel component for individual cubes
const Voxel: React.FC<{ position: [number, number, number]; color: string }> = ({ position, color }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5 + position[0] + position[2]) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} position={position} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

// Water component
const Water: React.FC = () => {
  const waterRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (waterRef.current) {
      waterRef.current.position.y = -2 + Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  return (
    <mesh ref={waterRef} position={[0, -2, 0]} receiveShadow>
      <planeGeometry args={[30, 30]} />
      <meshStandardMaterial color="#4A90E2" transparent opacity={0.7} />
    </mesh>
  );
};

// Island generator
const VoxelIsland: React.FC = () => {
  const voxels = useMemo(() => {
    const result: Array<{ position: [number, number, number]; color: string }> = [];
    
    // Island base (dirt/stone)
    for (let x = -4; x <= 4; x++) {
      for (let z = -4; z <= 4; z++) {
        const distance = Math.sqrt(x * x + z * z);
        if (distance <= 4) {
          const height = Math.max(1, Math.floor(4 - distance));
          for (let y = 0; y < height; y++) {
            const color = y === height - 1 ? '#8B4513' : '#654321'; // Top layer brown, lower layers darker
            result.push({
              position: [x, y - 1, z],
              color
            });
          }
        }
      }
    }

    // Grass layer
    for (let x = -4; x <= 4; x++) {
      for (let z = -4; z <= 4; z++) {
        const distance = Math.sqrt(x * x + z * z);
        if (distance <= 3.5) {
          const height = Math.max(1, Math.floor(4 - distance));
          result.push({
            position: [x, height - 1, z],
            color: '#228B22'
          });
        }
      }
    }

    // Trees
    const treePositions = [
      [-2, 0, -2],
      [2, 0, 1],
      [0, 0, 2],
      [-1, 0, -3]
    ];

    treePositions.forEach(([tx, ty, tz]) => {
      const distance = Math.sqrt(tx * tx + tz * tz);
      if (distance <= 3) {
        const baseHeight = Math.max(1, Math.floor(4 - distance));
        
        // Tree trunk
        for (let y = 0; y < 3; y++) {
          result.push({
            position: [tx, baseHeight + y, tz],
            color: '#8B4513'
          });
        }
        
        // Tree leaves
        for (let x = -1; x <= 1; x++) {
          for (let z = -1; z <= 1; z++) {
            for (let y = 2; y <= 4; y++) {
              if (!(x === 0 && z === 0) || y > 2) {
                result.push({
                  position: [tx + x, baseHeight + y, tz + z],
                  color: '#228B22'
                });
              }
            }
          }
        }
      }
    });

    // Flowers and details
    const flowerPositions = [
      [1, 0, -1],
      [-3, 0, 1],
      [3, 0, -2],
      [0, 0, 3]
    ];

    flowerPositions.forEach(([fx, fy, fz]) => {
      const distance = Math.sqrt(fx * fx + fz * fz);
      if (distance <= 3) {
        const baseHeight = Math.max(1, Math.floor(4 - distance));
        result.push({
          position: [fx, baseHeight, fz],
          color: Math.random() > 0.5 ? '#FF69B4' : '#FFD700'
        });
      }
    });

    return result;
  }, []);

  return (
    <>
      {voxels.map((voxel, index) => (
        <Voxel key={index} position={voxel.position} color={voxel.color} />
      ))}
    </>
  );
};

// Floating camera controller
const CameraController: React.FC = () => {
  useFrame((state) => {
    state.camera.position.x = Math.sin(state.clock.elapsedTime * 0.1) * 10;
    state.camera.position.z = Math.cos(state.clock.elapsedTime * 0.1) * 10;
    state.camera.lookAt(0, 0, 0);
  });

  return null;
};

const Block: React.FC<BlockProps> = ({ title = "Voxel Island", description }) => {
  useEffect(() => {
    // Send completion event on first load
    const sendCompletion = () => {
      window.postMessage({ type: 'BLOCK_COMPLETION', blockId: 'voxel-island', completed: true }, '*');
      window.parent.postMessage({ type: 'BLOCK_COMPLETION', blockId: 'voxel-island', completed: true }, '*');
    };
    
    setTimeout(sendCompletion, 1000);
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh', background: '#87CEEB' }}>
      <Canvas
        shadows
        camera={{ position: [10, 8, 10], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        
        {/* Sky */}
        <Sky sunPosition={[10, 10, 5]} />
        
        {/* Controls */}
        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          enableRotate={true}
          maxDistance={20}
          minDistance={5}
        />
        
        {/* Water */}
        <Water />
        
        {/* Island */}
        <VoxelIsland />
        
        {/* Title */}
        <Text
          position={[0, 8, 0]}
          fontSize={1.5}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.1}
          outlineColor="#000000"
        >
          {title}
        </Text>
        
        {/* Auto-rotating camera */}
        <CameraController />
      </Canvas>
      
      {/* UI Overlay */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        background: 'rgba(0,0,0,0.5)',
        padding: '10px 15px',
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        🏝️ <strong>Voxel Island</strong><br />
        🖱️ Drag to rotate • 🔍 Scroll to zoom<br />
        🌊 Watch the water waves!
      </div>
    </div>
  );
};

export default Block;