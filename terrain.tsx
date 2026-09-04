import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Blackboard, MapSettings, TerrainType } from './types';

export const WATER_LEVEL = -0.15;
export const BLOCK_STEP = 0.5;

// Deterministic pseudo-random number generator
export function pseudoRandom(ix: number, iy: number, seed: number = 42): number {
  const n = Math.sin(ix * 374.23 + iy * 156.45 + seed * 92.13) * 43758.5453;
  return n - Math.floor(n);
}

// 2D Smooth interpolated noise
export function smoothNoise(x: number, y: number, seed: number = 42): number {
  const i = Math.floor(x);
  const j = Math.floor(y);
  const fx = x - i;
  const fy = y - j;

  // Cubic Hermite smoothstep
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);

  const n00 = pseudoRandom(i, j, seed);
  const n10 = pseudoRandom(i + 1, j, seed);
  const n01 = pseudoRandom(i, j + 1, seed);
  const n11 = pseudoRandom(i + 1, j + 1, seed);

  const nx0 = n00 + sx * (n10 - n00);
  const nx1 = n01 + sx * (n11 - n01);

  return nx0 + sy * (nx1 - nx0);
}

// Fractal Brownian Motion
export function fbm(x: number, y: number, octaves = 3, seed = 42): number {
  let val = 0;
  let amp = 0.5;
  let freq = 1;
  let max = 0;
  for (let o = 0; o < octaves; o++) {
    val += amp * smoothNoise(x * freq, y * freq, seed + o * 17);
    max += amp;
    amp *= 0.5;
    freq *= 2.0;
  }
  return val / max; // 0.0 to 1.0
}

/**
 * Calculates the stepped voxel terrain height at world coordinates (wx, wz).
 * World coordinates typically range from -50 to +50.
 */
export function getTerrainHeight(wx: number, wz: number, settings?: MapSettings): number {
  const terrainType: TerrainType = settings?.terrainType ?? 'hills';
  const heightMultiplier = settings?.terrainHeight ?? 1.0;
  const seed = settings?.seed ?? 42;
  const hasWater = settings?.hasWater ?? true;

  if (terrainType === 'flat' || heightMultiplier === 0) {
    return 0;
  }

  // Flatten the spawn/clearing area around origin (radius 9)
  const distFromCenter = Math.sqrt(wx * wx + wz * wz);
  const centerBlend = Math.min(1, Math.max(0, (distFromCenter - 4.5) / 5.5));

  let rawHeight = 0;

  if (terrainType === 'hills') {
    const n1 = fbm(wx * 0.04, wz * 0.04, 3, seed);
    const n2 = fbm(wx * 0.08 + 12.3, wz * 0.08 + 4.1, 2, seed + 11);
    const n3 = fbm(wx * 0.16 + 5.7, wz * 0.16 + 8.9, 1, seed + 23);
    rawHeight = (n1 * 2.2 + n2 * 1.0 + n3 * 0.4) - 1.5;

    // Carve pond basins if water is enabled
    if (hasWater) {
      const pondNoise = fbm(wx * 0.06 + 30, wz * 0.06 - 30, 2, seed + 77);
      if (pondNoise < 0.28 && distFromCenter > 8) {
        rawHeight = Math.min(rawHeight, -0.6);
      }
    }
  } else if (terrainType === 'mountains') {
    const n1 = fbm(wx * 0.035, wz * 0.035, 4, seed);
    const ridge = 1.0 - Math.abs(n1 * 2 - 1);
    const n2 = fbm(wx * 0.09 + 20, wz * 0.09 + 20, 2, seed + 19);
    rawHeight = (ridge * 3.5 + n2 * 1.2) - 1.8;

    if (hasWater) {
      const lakeNoise = fbm(wx * 0.05 - 15, wz * 0.05 + 25, 2, seed + 53);
      if (lakeNoise < 0.25 && distFromCenter > 10) {
        rawHeight = -0.6;
      }
    }
  } else if (terrainType === 'plains') {
    const n1 = fbm(wx * 0.03, wz * 0.03, 2, seed);
    rawHeight = (n1 * 1.2) - 0.5;

    if (hasWater) {
      const pondNoise = fbm(wx * 0.07 + 10, wz * 0.07 + 10, 2, seed + 31);
      if (pondNoise < 0.22 && distFromCenter > 7) {
        rawHeight = -0.5;
      }
    }
  } else if (terrainType === 'desert') {
    const dune = Math.sin(wx * 0.08 + wz * 0.03) * 0.8 + Math.cos(wz * 0.07 - wx * 0.02) * 0.6;
    const n = fbm(wx * 0.05, wz * 0.05, 2, seed);
    rawHeight = (dune + n * 0.8) - 0.6;

    // Oasis pool in desert
    if (hasWater) {
      const oasisDist = Math.hypot(wx - 16, wz + 14);
      if (oasisDist < 7) {
        rawHeight = -0.5;
      }
    }
  }

  // Apply center blend
  rawHeight = rawHeight * centerBlend * heightMultiplier;

  // Quantize to discrete Minecraft block steps
  const blockLevel = Math.round(rawHeight / BLOCK_STEP);
  return blockLevel * BLOCK_STEP;
}

/**
 * Builds a watertight, stepped Minecraft voxel BufferGeometry
 */
export function generateVoxelTerrainGeometry(
  settings: MapSettings,
  floorSize: number = 100,
  gridCount: number = 70
): THREE.BufferGeometry {
  const cellSize = floorSize / gridCount;
  const halfSize = floorSize / 2;
  const terrainType = settings.terrainType ?? 'hills';
  const hasWater = settings.hasWater ?? true;

  // Colors
  const baseGrassColor = new THREE.Color(settings.backgroundColor || '#5C9E57');
  const sandColor = new THREE.Color('#D6C687');
  const stoneColor = new THREE.Color('#787878');
  const snowColor = new THREE.Color('#F0F4F8');
  const dirtColor = new THREE.Color('#866043');
  const darkDirtColor = new THREE.Color('#674830');
  const deepBedrockColor = new THREE.Color('#2C2C2C');
  const desertSandColor = new THREE.Color('#DEB887');

  // Precompute heights for all cells
  const heights: number[][] = [];
  for (let i = 0; i <= gridCount; i++) {
    heights[i] = [];
    const wx = -halfSize + i * cellSize;
    for (let j = 0; j <= gridCount; j++) {
      const wz = -halfSize + j * cellSize;
      heights[i][j] = getTerrainHeight(wx, wz, settings);
    }
  }

  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];

  const addQuad = (
    v1: [number, number, number],
    v2: [number, number, number],
    v3: [number, number, number],
    v4: [number, number, number],
    normal: [number, number, number],
    c: THREE.Color
  ) => {
    // Triangle 1: v1, v2, v3
    positions.push(...v1, ...v2, ...v3);
    normals.push(...normal, ...normal, ...normal);
    colors.push(c.r, c.g, c.b, c.r, c.g, c.b, c.r, c.g, c.b);

    // Triangle 2: v1, v3, v4
    positions.push(...v1, ...v3, ...v4);
    normals.push(...normal, ...normal, ...normal);
    colors.push(c.r, c.g, c.b, c.r, c.g, c.b, c.r, c.g, c.b);
  };

  // Helper for subtle color variation
  const tint = (c: THREE.Color, factor: number) => {
    return new THREE.Color(
      Math.max(0, Math.min(1, c.r * factor)),
      Math.max(0, Math.min(1, c.g * factor)),
      Math.max(0, Math.min(1, c.b * factor))
    );
  };

  // Build top faces and side walls
  for (let i = 0; i < gridCount; i++) {
    const x0 = -halfSize + i * cellSize;
    const x1 = x0 + cellSize;

    for (let j = 0; j < gridCount; j++) {
      const z0 = -halfSize + j * cellSize;
      const z1 = z0 + cellSize;

      const h = heights[i][j];
      const noiseVariation = 0.95 + pseudoRandom(i, j, (settings.seed ?? 42) + 5) * 0.1;

      // Determine top face color
      let faceColor: THREE.Color;
      if (terrainType === 'desert') {
        faceColor = tint(desertSandColor, noiseVariation);
      } else if (hasWater && h <= WATER_LEVEL) {
        faceColor = tint(sandColor, noiseVariation);
      } else if (h >= 2.0 && (terrainType === 'mountains' || terrainType === 'hills')) {
        faceColor = h >= 2.5 ? snowColor : tint(stoneColor, noiseVariation);
      } else {
        faceColor = tint(baseGrassColor, noiseVariation);
      }

      // Top face
      addQuad(
        [x0, h, z0],
        [x0, h, z1],
        [x1, h, z1],
        [x1, h, z0],
        [0, 1, 0],
        faceColor
      );

      // East side (i+1)
      const hEast = i + 1 < gridCount ? heights[i + 1][j] : -2.5;
      if (h > hEast) {
        const sideColor = h >= 2.0 && terrainType === 'mountains'
          ? stoneColor
          : (terrainType === 'desert' ? desertSandColor : dirtColor);
        addQuad(
          [x1, hEast, z0],
          [x1, hEast, z1],
          [x1, h, z1],
          [x1, h, z0],
          [1, 0, 0],
          tint(sideColor, 0.9)
        );
      }

      // West side (i-1)
      const hWest = i - 1 >= 0 ? heights[i - 1][j] : -2.5;
      if (h > hWest) {
        const sideColor = h >= 2.0 && terrainType === 'mountains'
          ? stoneColor
          : (terrainType === 'desert' ? desertSandColor : dirtColor);
        addQuad(
          [x0, h, z0],
          [x0, h, z1],
          [x0, hWest, z1],
          [x0, hWest, z0],
          [-1, 0, 0],
          tint(sideColor, 0.85)
        );
      }

      // South side (j+1)
      const hSouth = j + 1 < gridCount ? heights[i][j + 1] : -2.5;
      if (h > hSouth) {
        const sideColor = h >= 2.0 && terrainType === 'mountains'
          ? stoneColor
          : (terrainType === 'desert' ? desertSandColor : dirtColor);
        addQuad(
          [x0, h, z1],
          [x0, hSouth, z1],
          [x1, hSouth, z1],
          [x1, h, z1],
          [0, 0, 1],
          tint(sideColor, 0.95)
        );
      }

      // North side (j-1)
      const hNorth = j - 1 >= 0 ? heights[i][j - 1] : -2.5;
      if (h > hNorth) {
        const sideColor = h >= 2.0 && terrainType === 'mountains'
          ? stoneColor
          : (terrainType === 'desert' ? desertSandColor : dirtColor);
        addQuad(
          [x0, hNorth, z0],
          [x0, h, z0],
          [x1, h, z0],
          [x1, hNorth, z0],
          [0, 0, -1],
          tint(sideColor, 0.8)
        );
      }
    }
  }

  // Skirt bottom walls around the perimeter down to bedrock
  const bedrockY = -3.0;

  // North border (z = -halfSize)
  for (let i = 0; i < gridCount; i++) {
    const x0 = -halfSize + i * cellSize;
    const x1 = x0 + cellSize;
    const h = heights[i][0];
    addQuad(
      [x0, bedrockY, -halfSize],
      [x1, bedrockY, -halfSize],
      [x1, h, -halfSize],
      [x0, h, -halfSize],
      [0, 0, -1],
      deepBedrockColor
    );
  }

  // South border (z = halfSize)
  for (let i = 0; i < gridCount; i++) {
    const x0 = -halfSize + i * cellSize;
    const x1 = x0 + cellSize;
    const h = heights[i][gridCount - 1];
    addQuad(
      [x0, h, halfSize],
      [x1, h, halfSize],
      [x1, bedrockY, halfSize],
      [x0, bedrockY, halfSize],
      [0, 0, 1],
      deepBedrockColor
    );
  }

  // West border (x = -halfSize)
  for (let j = 0; j < gridCount; j++) {
    const z0 = -halfSize + j * cellSize;
    const z1 = z0 + cellSize;
    const h = heights[0][j];
    addQuad(
      [-halfSize, h, z0],
      [-halfSize, h, z1],
      [-halfSize, bedrockY, z1],
      [-halfSize, bedrockY, z0],
      [-1, 0, 0],
      deepBedrockColor
    );
  }

  // East border (x = halfSize)
  for (let j = 0; j < gridCount; j++) {
    const z0 = -halfSize + j * cellSize;
    const z1 = z0 + cellSize;
    const h = heights[gridCount - 1][j];
    addQuad(
      [halfSize, bedrockY, z0],
      [halfSize, bedrockY, z1],
      [halfSize, h, z1],
      [halfSize, h, z0],
      [1, 0, 0],
      deepBedrockColor
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  return geometry;
}

/**
 * Procedural generation for Trees, Rocks, Lily Pads, and Reeds
 */
export function getNatureData(
  settings: MapSettings,
  blackboards: Blackboard[],
  floorSize: number = 100
) {
  const seed = settings.seed ?? 42;
  const terrainType = settings.terrainType ?? 'hills';
  const hasTrees = settings.hasTrees ?? true;
  const hasWater = settings.hasWater ?? true;

  const trunks: { x: number; y: number; z: number; color?: string }[] = [];
  const leaves: { x: number; y: number; z: number; color?: string }[] = [];
  const rocks: { x: number; y: number; z: number; scale: number; color: string }[] = [];
  const lilypads: { x: number; y: number; z: number; rotation: number }[] = [];
  const reeds: { x: number; y: number; z: number; height: number }[] = [];

  if (terrainType === 'flat' && !hasTrees) {
    return { trunks, leaves, rocks, lilypads, reeds };
  }

  const WORLD_SCALE = 0.05;
  const isNearBoard = (x: number, z: number, dist = 3.0) => {
    for (const b of blackboards) {
      const bx = b.x * WORLD_SCALE;
      const bz = b.y * WORLD_SCALE;
      if (Math.hypot(x - bx, z - bz) < dist) return true;
    }
    return false;
  };

  const isNearCenter = (x: number, z: number, dist = 5.0) => {
    return Math.hypot(x, z) < dist;
  };

  // 1. Trees (Oak, Birch, Pine, or Cacti)
  if (hasTrees && terrainType !== 'flat') {
    const treeCount = terrainType === 'plains' ? 24 : terrainType === 'mountains' ? 30 : 42;
    const boundary = floorSize / 2 - 5;

    for (let i = 0; i < 220 && trunks.length < treeCount * 4; i++) {
      const rx = (pseudoRandom(i, 11, seed) - 0.5) * 2 * boundary;
      const rz = (pseudoRandom(i, 23, seed + 100) - 0.5) * 2 * boundary;

      if (isNearCenter(rx, rz, 6.0) || isNearBoard(rx, rz, 3.2)) continue;

      const y = getTerrainHeight(rx, rz, settings);
      // Trees only on dry ground above water
      if (y <= WATER_LEVEL) continue;
      // High mountain snow caps don't have dense oak trees
      if (y >= 2.5 && terrainType === 'mountains') continue;

      const treeType = pseudoRandom(i, 45, seed) > 0.75 ? 'birch' : pseudoRandom(i, 45, seed) > 0.5 ? 'pine' : 'oak';

      if (terrainType === 'desert') {
        // Desert Cactus!
        const cactusHeight = 2 + Math.floor(pseudoRandom(i, 77, seed) * 2);
        for (let h = 0; h < cactusHeight; h++) {
          trunks.push({ x: rx, y: y + 0.35 + h * 0.6, z: rz, color: '#4A7C38' });
        }
        continue;
      }

      // Trunk blocks (height 3 to 4)
      const trunkHeight = treeType === 'pine' ? 4 : 3;
      const trunkColor = treeType === 'birch' ? '#D6D6D6' : '#654321';
      for (let h = 0; h < trunkHeight; h++) {
        trunks.push({ x: rx, y: y + 0.25 + h * 0.5, z: rz, color: trunkColor });
      }

      // Foliage blocks
      const leafColor = treeType === 'birch' ? '#68A842' : treeType === 'pine' ? '#27582B' : '#4C9141';
      const leafBaseY = y + 0.25 + (trunkHeight - 1) * 0.5;

      if (treeType === 'pine') {
        // Conical tiered pine canopy
        const layers = [
          { r: 1.1, dy: 0.2 },
          { r: 0.8, dy: 0.6 },
          { r: 0.4, dy: 1.0 },
        ];
        layers.forEach(({ r, dy }) => {
          for (let dx = -r; dx <= r; dx += 0.5) {
            for (let dz = -r; dz <= r; dz += 0.5) {
              if (Math.hypot(dx, dz) <= r) {
                leaves.push({ x: rx + dx, y: leafBaseY + dy, z: rz + dz, color: leafColor });
              }
            }
          }
        });
      } else {
        // Classic Minecraft Oak/Birch Canopy (3x3 lower, 2x2 upper, 1x1 cap)
        for (let dx = -0.9; dx <= 0.9; dx += 0.45) {
          for (let dz = -0.9; dz <= 0.9; dz += 0.45) {
            // Trim corners for rounded voxel feel
            if (Math.abs(dx) > 0.8 && Math.abs(dz) > 0.8) continue;
            leaves.push({ x: rx + dx, y: leafBaseY + 0.2, z: rz + dz, color: leafColor });
            leaves.push({ x: rx + dx, y: leafBaseY + 0.6, z: rz + dz, color: leafColor });
          }
        }
        // Top cap
        for (let dx = -0.45; dx <= 0.45; dx += 0.45) {
          for (let dz = -0.45; dz <= 0.45; dz += 0.45) {
            leaves.push({ x: rx + dx, y: leafBaseY + 1.0, z: rz + dz, color: leafColor });
          }
        }
      }
    }
  }

  // 2. Rocks / Boulders on hillsides
  if (terrainType !== 'flat') {
    const rockCount = 18;
    for (let i = 0; i < 60 && rocks.length < rockCount; i++) {
      const rx = (pseudoRandom(i, 37, seed + 200) - 0.5) * 80;
      const rz = (pseudoRandom(i, 89, seed + 300) - 0.5) * 80;

      if (isNearCenter(rx, rz, 5) || isNearBoard(rx, rz, 2.5)) continue;

      const y = getTerrainHeight(rx, rz, settings);
      if (y > WATER_LEVEL && (y >= 1.0 || pseudoRandom(i, 99, seed) > 0.6)) {
        rocks.push({
          x: rx,
          y: y + 0.2,
          z: rz,
          scale: 0.6 + pseudoRandom(i, 102, seed) * 0.5,
          color: pseudoRandom(i, 103, seed) > 0.85 ? '#4A4A4A' : '#7D7D7D', // Coal ore accent
        });
      }
    }
  }

  // 3. Lily pads and Reeds in/near water
  if (hasWater && terrainType !== 'flat') {
    for (let i = 0; i < 40; i++) {
      const rx = (pseudoRandom(i, 51, seed + 400) - 0.5) * 80;
      const rz = (pseudoRandom(i, 67, seed + 500) - 0.5) * 80;
      const y = getTerrainHeight(rx, rz, settings);

      // In water: Lily pad
      if (y <= WATER_LEVEL && lilypads.length < 12) {
        lilypads.push({
          x: rx,
          y: WATER_LEVEL + 0.02,
          z: rz,
          rotation: pseudoRandom(i, 81, seed) * Math.PI * 2,
        });
      }

      // Shoreline: Reeds
      if (y === 0 && reeds.length < 16) {
        // Check if neighboring water exists
        const nearWater = [
          getTerrainHeight(rx + 1.5, rz, settings),
          getTerrainHeight(rx - 1.5, rz, settings),
          getTerrainHeight(rx, rz + 1.5, settings),
          getTerrainHeight(rx, rz - 1.5, settings),
        ].some((h) => h <= WATER_LEVEL);

        if (nearWater) {
          reeds.push({
            x: rx,
            y: y + 0.35,
            z: rz,
            height: 0.7 + pseudoRandom(i, 92, seed) * 0.4,
          });
        }
      }
    }
  }

  return { trunks, leaves, rocks, lilypads, reeds };
}

/**
 * 3D Component: Voxel Terrain
 */
export const VoxelTerrainMesh: React.FC<{
  settings: MapSettings;
  floorSize?: number;
  onPointerDown?: (e: any) => void;
  onPointerUp?: (e: any) => void;
  onPointerMove?: (e: any) => void;
}> = ({ settings, floorSize = 100, onPointerDown, onPointerUp, onPointerMove }) => {
  const geometry = useMemo(() => {
    return generateVoxelTerrainGeometry(settings, floorSize, 70);
  }, [settings.terrainType, settings.terrainHeight, settings.seed, settings.backgroundColor, settings.hasWater, floorSize]);

  return (
    <mesh
      geometry={geometry}
      receiveShadow
      castShadow
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerMove={onPointerMove}
    >
      <meshStandardMaterial
        vertexColors
        roughness={0.9}
        metalness={0.05}
        flatShading={false}
      />
    </mesh>
  );
};

/**
 * 3D Component: Animated Shimmering Water Layer
 */
export const WaterMesh: React.FC<{ floorSize?: number; visible?: boolean }> = ({
  floorSize = 100,
  visible = true,
}) => {
  const waterRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (waterRef.current) {
      // Gentle surface shimmer
      waterRef.current.position.y = WATER_LEVEL + Math.sin(clock.elapsedTime * 1.5) * 0.015;
    }
  });

  if (!visible) return null;

  return (
    <mesh
      ref={waterRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, WATER_LEVEL, 0]}
      receiveShadow
    >
      <planeGeometry args={[floorSize, floorSize]} />
      <meshStandardMaterial
        color="#3478E3"
        transparent
        opacity={0.78}
        roughness={0.15}
        metalness={0.1}
      />
    </mesh>
  );
};

/**
 * 3D Component: Instanced Nature (Trees, Rocks, Lilypads, Reeds)
 */
export const NatureInstances: React.FC<{
  settings: MapSettings;
  blackboards: Blackboard[];
  floorSize?: number;
}> = ({ settings, blackboards, floorSize = 100 }) => {
  const { trunks, leaves, rocks, lilypads, reeds } = useMemo(() => {
    return getNatureData(settings, blackboards, floorSize);
  }, [settings.terrainType, settings.hasTrees, settings.hasWater, settings.seed, blackboards, floorSize]);

  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const leavesRef = useRef<THREE.InstancedMesh>(null);
  const rocksRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Update Instanced matrices & colors
  React.useLayoutEffect(() => {
    if (trunkRef.current && trunks.length > 0) {
      trunks.forEach((t, i) => {
        dummy.position.set(t.x, t.y, t.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        trunkRef.current!.setMatrixAt(i, dummy.matrix);
        if (t.color) {
          trunkRef.current!.setColorAt(i, new THREE.Color(t.color));
        }
      });
      trunkRef.current.instanceMatrix.needsUpdate = true;
      if (trunkRef.current.instanceColor) trunkRef.current.instanceColor.needsUpdate = true;
    }

    if (leavesRef.current && leaves.length > 0) {
      leaves.forEach((l, i) => {
        dummy.position.set(l.x, l.y, l.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        leavesRef.current!.setMatrixAt(i, dummy.matrix);
        if (l.color) {
          leavesRef.current!.setColorAt(i, new THREE.Color(l.color));
        }
      });
      leavesRef.current.instanceMatrix.needsUpdate = true;
      if (leavesRef.current.instanceColor) leavesRef.current.instanceColor.needsUpdate = true;
    }

    if (rocksRef.current && rocks.length > 0) {
      rocks.forEach((r, i) => {
        dummy.position.set(r.x, r.y, r.z);
        dummy.rotation.set(0, (i * 0.7) % Math.PI, 0);
        dummy.scale.set(r.scale, r.scale * 0.7, r.scale);
        dummy.updateMatrix();
        rocksRef.current!.setMatrixAt(i, dummy.matrix);
        rocksRef.current!.setColorAt(i, new THREE.Color(r.color));
      });
      rocksRef.current.instanceMatrix.needsUpdate = true;
      if (rocksRef.current.instanceColor) rocksRef.current.instanceColor.needsUpdate = true;
    }
  }, [trunks, leaves, rocks, dummy]);

  return (
    <>
      {/* Tree Trunks */}
      {trunks.length > 0 && (
        <instancedMesh
          ref={trunkRef}
          args={[undefined, undefined, trunks.length]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.42, 0.52, 0.42]} />
          <meshStandardMaterial roughness={0.9} />
        </instancedMesh>
      )}

      {/* Tree Leaves */}
      {leaves.length > 0 && (
        <instancedMesh
          ref={leavesRef}
          args={[undefined, undefined, leaves.length]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.48, 0.48, 0.48]} />
          <meshStandardMaterial roughness={0.8} />
        </instancedMesh>
      )}

      {/* Rocks / Boulders */}
      {rocks.length > 0 && (
        <instancedMesh
          ref={rocksRef}
          args={[undefined, undefined, rocks.length]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.7, 0.6, 0.7]} />
          <meshStandardMaterial roughness={0.95} />
        </instancedMesh>
      )}

      {/* Lily pads on water */}
      {lilypads.map((lp, i) => (
        <mesh
          key={`lp-${i}`}
          position={[lp.x, lp.y, lp.z]}
          rotation={[-Math.PI / 2, 0, lp.rotation]}
          receiveShadow
        >
          <circleGeometry args={[0.3, 7]} />
          <meshStandardMaterial color="#2E7D32" roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Reeds on shore */}
      {reeds.map((rd, i) => (
        <mesh key={`rd-${i}`} position={[rd.x, rd.y, rd.z]} castShadow receiveShadow>
          <boxGeometry args={[0.08, rd.height, 0.08]} />
          <meshStandardMaterial color="#8BC34A" roughness={0.9} />
        </mesh>
      ))}
    </>
  );
};

/**
 * 3D Component: Drifting Minecraft Voxel Clouds
 */
export const VoxelClouds: React.FC<{ visible?: boolean }> = ({ visible = true }) => {
  const groupRef = useRef<THREE.Group>(null);

  const clouds = useMemo(() => {
    return [
      { x: -35, y: 22, z: -25, sx: 18, sy: 1.5, sz: 12 },
      { x: 15, y: 24, z: -35, sx: 24, sy: 1.5, sz: 14 },
      { x: -10, y: 21, z: 15, sx: 16, sy: 1.5, sz: 10 },
      { x: 30, y: 23, z: 25, sx: 22, sy: 1.5, sz: 15 },
      { x: -40, y: 25, z: 30, sx: 20, sy: 1.5, sz: 12 },
    ];
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.position.x += delta * 0.8;
      // Wrap around seamlessly
      if (groupRef.current.position.x > 70) {
        groupRef.current.position.x = -70;
      }
    }
  });

  if (!visible) return null;

  return (
    <group ref={groupRef}>
      {clouds.map((c, i) => (
        <mesh key={`cloud-${i}`} position={[c.x, c.y, c.z]}>
          <boxGeometry args={[c.sx, c.sy, c.sz]} />
          <meshBasicMaterial
            color="#FFFFFF"
            transparent
            opacity={0.82}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
};
