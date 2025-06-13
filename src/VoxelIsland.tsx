import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D, Color } from 'three';
import * as THREE from 'three';

interface VoxelIslandProps {
  size: number;
}

// Noise function for terrain generation
const noise = (x: number, z: number): number => {
  return (
    Math.sin(x * 0.1) * Math.cos(z * 0.1) * 5 +
    Math.sin(x * 0.05) * Math.cos(z * 0.05) * 10 +
    Math.sin(x * 0.02) * Math.cos(z * 0.02) * 15
  );
};

const VoxelIsland: React.FC<VoxelIslandProps> = ({ size }) => {
  const meshRef = useRef<InstancedMesh>(null);
  const treeMeshRef = useRef<InstancedMesh>(null);
  
  // Generate voxel data
  const { voxels, trees } = useMemo(() => {
    const voxelData: Array<{ position: [number, number, number]; color: string }> = [];
    const treeData: Array<{ position: [number, number, number] }> = [];
    
    const halfSize = size / 2;
    
    for (let x = -halfSize; x < halfSize; x++) {
      for (let z = -halfSize; z < halfSize; z++) {
        // Calculate distance from center for island shape
        const distFromCenter = Math.sqrt(x * x + z * z);
        const maxDist = halfSize * 0.8;
        
        if (distFromCenter < maxDist) {
          // Generate height using noise
          const baseHeight = noise(x, z);
          const heightFalloff = 1 - (distFromCenter / maxDist);
          const height = Math.max(0, Math.floor(baseHeight * heightFalloff * 0.3 + 3));
          
          // Create voxels from sea level to height
          for (let y = 0; y <= height; y++) {
            let color = '#4a5d23'; // Grass green
            
            if (y === 0) {
              color = '#8b7355'; // Sand
            } else if (y === 1 && height > 1) {
              color = '#654321'; // Dirt
            } else if (height > 8) {
              color = '#808080'; // Stone for mountains
            }
            
            voxelData.push({
              position: [x, y, z],
              color
            });
          }
          
          // Add trees occasionally on grass
          if (height > 2 && height < 8 && Math.random() < 0.15) {
            treeData.push({
              position: [x, height + 1, z]
            });
          }
        }
      }
    }
    
    return { voxels: voxelData, trees: treeData };
  }, [size]);

  // Set up instanced mesh for voxels
  React.useLayoutEffect(() => {
    if (!meshRef.current) return;
    
    const tempObject = new Object3D();
    const tempColor = new Color();
    
    voxels.forEach((voxel, index) => {
      tempObject.position.set(...voxel.position);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(index, tempObject.matrix);
      
      tempColor.set(voxel.color);
      meshRef.current!.setColorAt(index, tempColor);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [voxels]);

  // Set up instanced mesh for trees
  React.useLayoutEffect(() => {
    if (!treeMeshRef.current) return;
    
    const tempObject = new Object3D();
    
    trees.forEach((tree, index) => {
      tempObject.position.set(...tree.position);
      tempObject.scale.set(0.8, 2, 0.8);
      tempObject.updateMatrix();
      treeMeshRef.current!.setMatrixAt(index, tempObject.matrix);
    });
    
    treeMeshRef.current.instanceMatrix.needsUpdate = true;
  }, [trees]);

  return (
    <group>
      {/* Terrain voxels */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, voxels.length]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial />
      </instancedMesh>
      
      {/* Trees */}
      <instancedMesh
        ref={treeMeshRef}
        args={[undefined, undefined, trees.length]}
        castShadow
      >
        <cylinderGeometry args={[0.3, 0.3, 1, 8]} />
        <meshLambertMaterial color="#4a5d23" />
      </instancedMesh>
      
      {/* Water plane */}
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[size * 2, size * 2]} />
        <meshLambertMaterial color="#4a90e2" transparent opacity={0.7} />
      </mesh>
    </group>
  );
};

export default VoxelIsland;