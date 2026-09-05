import React, { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Blackboard, MapSettings, TerrainType, Position } from './types';

export const WATER_LEVEL = -0.15;
export const BLOCK_STEP = 0.5;
export const CHUNK_SIZE = 24; // 24 units wide per chunk
export const GRID_PER_CHUNK = 16; // 16x16 grid per chunk = 1.5 unit block size
export const WORLD_SCALE = 1.0;

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
  return val / max;
}

/**
 * Global mathematical height function at any coordinate in the infinite world.
 */
export function getTerrainHeight(wx: number, wz: number, settings?: MapSettings): number {
  const terrainType: TerrainType = settings?.terrainType ?? 'hills';
  const heightMultiplier = settings?.terrainHeight ?? 1.0;
  const seed = settings?.seed ?? 42;
  const hasWater = settings?.hasWater ?? true;

  if (terrainType === 'flat' || heightMultiplier === 0) {
    return 0;
  }

  // Clear flat spawn area around origin (radius 9)
  const distFromCenter = Math.sqrt(wx * wx + wz * wz);
  const centerBlend = Math.min(1, Math.max(0, (distFromCenter - 4.5) / 5.5));

  let rawHeight = 0;

  if (terrainType === 'hills') {
    const n1 = fbm(wx * 0.04, wz * 0.04, 3, seed);
    const n2 = fbm(wx * 0.08 + 12.3, wz * 0.08 + 4.1, 2, seed + 11);
    const n3 = fbm(wx * 0.16 + 5.7, wz * 0.16 + 8.9, 1, seed + 23);
    rawHeight = (n1 * 2.2 + n2 * 1.0 + n3 * 0.4) - 1.5;

    // Natural ponds throughout the infinite landscape
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

    if (hasWater) {
      const oasisNoise = fbm(wx * 0.04 + 16, wz * 0.04 - 14, 2, seed + 91);
      if (oasisNoise < 0.23 && distFromCenter > 8) {
        rawHeight = -0.5;
      }
    }
  }

  // Center blend keeps the initial spawn level
  rawHeight = rawHeight * centerBlend * heightMultiplier;

  // Quantize to discrete Minecraft block steps
  const blockLevel = Math.round(rawHeight / BLOCK_STEP);
  return blockLevel * BLOCK_STEP;
}

// Geometry cache to reuse chunk geometries and avoid recalculating
const chunkCache = new Map<string, THREE.BufferGeometry>();
let lastCacheSettingsKey = '';

export function clearChunkCache() {
  chunkCache.forEach((geo) => geo.dispose());
  chunkCache.clear();
}

/**
 * Builds a watertight voxel geometry for a single chunk (cx, cz).
 */
export function generateChunkGeometry(
  cx: number,
  cz: number,
  settings: MapSettings
): THREE.BufferGeometry {
  // Bump cache key to v3 to immediately invalidate any legacy cached geometry
  const currentKey = `${settings.terrainType}_${settings.terrainHeight}_${settings.seed}_${settings.backgroundColor}_${settings.hasWater}_v3`;
  if (currentKey !== lastCacheSettingsKey) {
    clearChunkCache();
    lastCacheSettingsKey = currentKey;
  }

  const cacheKey = `${cx},${cz}_${currentKey}`;
  if (chunkCache.has(cacheKey)) {
    return chunkCache.get(cacheKey)!;
  }

  const cellSize = CHUNK_SIZE / GRID_PER_CHUNK;
  const minX = cx * CHUNK_SIZE;
  const minZ = cz * CHUNK_SIZE;

  const terrainType = settings.terrainType ?? 'hills';
  const hasWater = settings.hasWater ?? true;

  // Palette colors
  const baseGrassColor = new THREE.Color(settings.backgroundColor || '#5C9E57');
  const sandColor = new THREE.Color('#D6C687');
  const stoneColor = new THREE.Color('#787878');
  const snowColor = new THREE.Color('#F0F4F8');
  const dirtColor = new THREE.Color('#866043');
  const desertSandColor = new THREE.Color('#DEB887');

  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];

  const addQuad = (
    v1: [number, number, number],
    v2: [number, number, number],
    v3: [number, number, number],
    v4: [number, number, number],
    norm: [number, number, number],
    c: THREE.Color
  ) => {
    // Triangle 1
    positions.push(...v1, ...v2, ...v3);
    normals.push(...norm, ...norm, ...norm);
    colors.push(c.r, c.g, c.b, c.r, c.g, c.b, c.r, c.g, c.b);

    // Triangle 2
    positions.push(...v1, ...v3, ...v4);
    normals.push(...norm, ...norm, ...norm);
    colors.push(c.r, c.g, c.b, c.r, c.g, c.b, c.r, c.g, c.b);
  };

  const tint = (c: THREE.Color, factor: number) => {
    return new THREE.Color(
      Math.max(0, Math.min(1, c.r * factor)),
      Math.max(0, Math.min(1, c.g * factor)),
      Math.max(0, Math.min(1, c.b * factor))
    );
  };

  // Pre-fetch heights with 1-cell border for seamless step edges
  const hGrid: number[][] = [];
  for (let i = -1; i <= GRID_PER_CHUNK; i++) {
    hGrid[i] = [];
    const wx = minX + i * cellSize + cellSize * 0.5;
    for (let j = -1; j <= GRID_PER_CHUNK; j++) {
      const wz = minZ + j * cellSize + cellSize * 0.5;
      hGrid[i][j] = getTerrainHeight(wx, wz, settings);
    }
  }

  for (let i = 0; i < GRID_PER_CHUNK; i++) {
    const x0 = minX + i * cellSize;
    const x1 = x0 + cellSize;

    for (let j = 0; j < GRID_PER_CHUNK; j++) {
      const z0 = minZ + j * cellSize;
      const z1 = z0 + cellSize;

      const h = hGrid[i][j];
      const noiseVariation = 0.95 + pseudoRandom(cx * 16 + i, cz * 16 + j, (settings.seed ?? 42) + 5) * 0.1;

      // Surface color based on biome and altitude
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

      // East step wall (x1) - faces outward +X
      const hEast = hGrid[i + 1][j];
      if (h > hEast) {
        const sideColor = h >= 2.0 && terrainType === 'mountains'
          ? stoneColor
          : (terrainType === 'desert' ? desertSandColor : dirtColor);
        addQuad(
          [x1, h, z0],
          [x1, h, z1],
          [x1, hEast, z1],
          [x1, hEast, z0],
          [1, 0, 0],
          tint(sideColor, 0.9)
        );
      }

      // West step wall (x0) - faces outward -X
      const hWest = hGrid[i - 1][j];
      if (h > hWest) {
        const sideColor = h >= 2.0 && terrainType === 'mountains'
          ? stoneColor
          : (terrainType === 'desert' ? desertSandColor : dirtColor);
        addQuad(
          [x0, hWest, z0],
          [x0, hWest, z1],
          [x0, h, z1],
          [x0, h, z0],
          [-1, 0, 0],
          tint(sideColor, 0.85)
        );
      }

      // North step wall (z0) - faces outward -Z
      const hNorth = hGrid[i][j - 1];
      if (h > hNorth) {
        const sideColor = h >= 2.0 && terrainType === 'mountains'
          ? stoneColor
          : (terrainType === 'desert' ? desertSandColor : dirtColor);
        addQuad(
          [x1, hNorth, z0],
          [x0, hNorth, z0],
          [x0, h, z0],
          [x1, h, z0],
          [0, 0, -1],
          tint(sideColor, 0.8)
        );
      }

      // South step wall (z1) - faces outward +Z
      const hSouth = hGrid[i][j + 1];
      if (h > hSouth) {
        const sideColor = h >= 2.0 && terrainType === 'mountains'
          ? stoneColor
          : (terrainType === 'desert' ? desertSandColor : dirtColor);
        addQuad(
          [x0, hSouth, z1],
          [x1, hSouth, z1],
          [x1, h, z1],
          [x0, h, z1],
          [0, 0, 1],
          tint(sideColor, 0.95)
        );
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeBoundingBox();

  // Cap cache size to 120 chunks to prevent memory buildup
  if (chunkCache.size > 120) {
    const oldestKey = chunkCache.keys().next().value;
    if (oldestKey) {
      chunkCache.get(oldestKey)?.dispose();
      chunkCache.delete(oldestKey);
    }
  }

  chunkCache.set(cacheKey, geometry);
  return geometry;
}

/**
 * Deterministic procedural nature generation for a single chunk
 */
interface NatureData {
  trunks: { x: number; y: number; z: number; color?: string }[];
  leaves: { x: number; y: number; z: number; color?: string }[];
  rocks: { x: number; y: number; z: number; scale: number; color: string }[];
  lilypads: { x: number; y: number; z: number; rotation: number }[];
  reeds: { x: number; y: number; z: number; height: number }[];
  grass: { x: number; y: number; z: number; s: number }[];
  flowers: { x: number; y: number; z: number; color: string }[];
}

const natureCache = new Map<string, NatureData>();

export function getChunkNature(
  cx: number,
  cz: number,
  settings: MapSettings,
  blackboards: Blackboard[]
): NatureData {
  const currentKey = `${settings.terrainType}_${settings.seed}_${settings.hasTrees}_${settings.hasWater}`;
  const cacheKey = `${cx},${cz}_${currentKey}`;
  if (natureCache.has(cacheKey)) {
    return natureCache.get(cacheKey)!;
  }

  const seed = (settings.seed ?? 42) + cx * 1013 + cz * 2017;
  const terrainType = settings.terrainType ?? 'hills';
  const hasTrees = settings.hasTrees ?? true;
  const hasWater = settings.hasWater ?? true;

  const trunks: NatureData['trunks'] = [];
  const leaves: NatureData['leaves'] = [];
  const rocks: NatureData['rocks'] = [];
  const lilypads: NatureData['lilypads'] = [];
  const reeds: NatureData['reeds'] = [];
  const grass: NatureData['grass'] = [];
  const flowers: NatureData['flowers'] = [];

  const minX = cx * CHUNK_SIZE;
  const minZ = cz * CHUNK_SIZE;

  const isNearBoard = (x: number, z: number, dist = 2.8) => {
    return blackboards.some((b) => Math.hypot(b.x * WORLD_SCALE - x, b.y * WORLD_SCALE - z) < dist);
  };

  const isNearCenter = (x: number, z: number, dist = 5.0) => {
    return Math.hypot(x, z) < dist;
  };

  // 1. Trees / Cacti
  if (hasTrees && terrainType !== 'flat') {
    const treeChance = terrainType === 'plains' ? 0.35 : terrainType === 'mountains' ? 0.45 : 0.65;
    const treeCount = Math.floor(pseudoRandom(cx, cz, seed) * 3) + (pseudoRandom(cx, cz, seed + 1) < treeChance ? 1 : 0);

    for (let t = 0; t < treeCount; t++) {
      const rx = minX + 3 + pseudoRandom(t, 11, seed) * (CHUNK_SIZE - 6);
      const rz = minZ + 3 + pseudoRandom(t, 23, seed + 10) * (CHUNK_SIZE - 6);

      if (isNearCenter(rx, rz, 6.0) || isNearBoard(rx, rz, 3.2)) continue;

      const y = getTerrainHeight(rx, rz, settings);
      if (y <= WATER_LEVEL) continue;
      if (y >= 2.5 && terrainType === 'mountains') continue;

      const treeType = pseudoRandom(t, 45, seed) > 0.75 ? 'birch' : pseudoRandom(t, 45, seed) > 0.5 ? 'pine' : 'oak';

      if (terrainType === 'desert') {
        const cactusHeight = 2 + Math.floor(pseudoRandom(t, 77, seed) * 2);
        for (let h = 0; h < cactusHeight; h++) {
          trunks.push({ x: rx, y: y + 0.35 + h * 0.6, z: rz, color: '#4A7C38' });
        }
        continue;
      }

      const trunkHeight = treeType === 'pine' ? 4 : 3;
      const trunkColor = treeType === 'birch' ? '#D6D6D6' : '#654321';
      for (let h = 0; h < trunkHeight; h++) {
        trunks.push({ x: rx, y: y + 0.25 + h * 0.5, z: rz, color: trunkColor });
      }

      const leafColor = treeType === 'birch' ? '#68A842' : treeType === 'pine' ? '#27582B' : '#4C9141';
      const leafBaseY = y + 0.25 + (trunkHeight - 1) * 0.5;

      if (treeType === 'pine') {
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
        for (let dx = -0.9; dx <= 0.9; dx += 0.45) {
          for (let dz = -0.9; dz <= 0.9; dz += 0.45) {
            if (Math.abs(dx) > 0.8 && Math.abs(dz) > 0.8) continue;
            leaves.push({ x: rx + dx, y: leafBaseY + 0.2, z: rz + dz, color: leafColor });
            leaves.push({ x: rx + dx, y: leafBaseY + 0.6, z: rz + dz, color: leafColor });
          }
        }
        for (let dx = -0.45; dx <= 0.45; dx += 0.45) {
          for (let dz = -0.45; dz <= 0.45; dz += 0.45) {
            leaves.push({ x: rx + dx, y: leafBaseY + 1.0, z: rz + dz, color: leafColor });
          }
        }
      }
    }
  }

  // 2. Rocks on hills
  if (terrainType !== 'flat' && pseudoRandom(cx, cz, seed + 99) > 0.45) {
    const rx = minX + 4 + pseudoRandom(cx, cz, seed + 33) * (CHUNK_SIZE - 8);
    const rz = minZ + 4 + pseudoRandom(cx, cz, seed + 44) * (CHUNK_SIZE - 8);
    if (!isNearCenter(rx, rz, 5) && !isNearBoard(rx, rz, 2.5)) {
      const y = getTerrainHeight(rx, rz, settings);
      if (y > WATER_LEVEL) {
        rocks.push({
          x: rx,
          y: y + 0.2,
          z: rz,
          scale: 0.6 + pseudoRandom(cx, cz, seed + 55) * 0.5,
          color: pseudoRandom(cx, cz, seed + 66) > 0.85 ? '#4A4A4A' : '#7D7D7D',
        });
      }
    }
  }

  // 3. Water flora
  if (hasWater && terrainType !== 'flat') {
    for (let i = 0; i < 3; i++) {
      const rx = minX + 2 + pseudoRandom(i, 51, seed + 80) * (CHUNK_SIZE - 4);
      const rz = minZ + 2 + pseudoRandom(i, 67, seed + 90) * (CHUNK_SIZE - 4);
      const y = getTerrainHeight(rx, rz, settings);

      if (y <= WATER_LEVEL && lilypads.length < 2) {
        lilypads.push({
          x: rx,
          y: WATER_LEVEL + 0.02,
          z: rz,
          rotation: pseudoRandom(i, 81, seed) * Math.PI * 2,
        });
      }

      if (y === 0 && reeds.length < 3) {
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

  // 4. Grass tufts and wildflowers per chunk
  if (terrainType !== 'desert') {
    const grassCount = 14;
    for (let g = 0; g < grassCount; g++) {
      const gx = minX + 1.5 + pseudoRandom(g, 101, seed) * (CHUNK_SIZE - 3);
      const gz = minZ + 1.5 + pseudoRandom(g, 102, seed) * (CHUNK_SIZE - 3);
      if (!isNearBoard(gx, gz, 1.8)) {
        const gy = getTerrainHeight(gx, gz, settings);
        if (gy > WATER_LEVEL) {
          grass.push({ x: gx, y: gy, z: gz, s: 0.6 + pseudoRandom(g, 103, seed) * 0.4 });
        }
      }
    }

    // Flowers (1-3 per chunk)
    const flowerCount = Math.floor(pseudoRandom(cx, cz, seed + 110) * 3);
    for (let f = 0; f < flowerCount; f++) {
      const fx = minX + 2 + pseudoRandom(f, 111, seed) * (CHUNK_SIZE - 4);
      const fz = minZ + 2 + pseudoRandom(f, 112, seed) * (CHUNK_SIZE - 4);
      if (!isNearBoard(fx, fz, 1.8)) {
        const fy = getTerrainHeight(fx, fz, settings);
        if (fy > WATER_LEVEL) {
          flowers.push({
            x: fx,
            y: fy,
            z: fz,
            color: pseudoRandom(f, 113, seed) > 0.5 ? '#ffff00' : '#ff5555',
          });
        }
      }
    }
  }

  const res: NatureData = { trunks, leaves, rocks, lilypads, reeds, grass, flowers };
  if (natureCache.size > 120) {
    const oldestKey = natureCache.keys().next().value;
    if (oldestKey) natureCache.delete(oldestKey);
  }
  natureCache.set(cacheKey, res);
  return res;
}

/**
 * 3D Component: Infinite Chunk-based Voxel Terrain Mesh
 * Renders an active window of chunks around the player, recycling memory seamlessly.
 */
export const VoxelTerrainMesh: React.FC<{
  settings: MapSettings;
  playerPos: Position;
  onPointerDown?: (e: any) => void;
  onPointerUp?: (e: any) => void;
  onPointerMove?: (e: any) => void;
}> = ({ settings, playerPos, onPointerDown, onPointerUp, onPointerMove }) => {
  // Determine player's current chunk
  const currentChunkX = Math.floor((playerPos.x * WORLD_SCALE) / CHUNK_SIZE);
  const currentChunkZ = Math.floor((playerPos.y * WORLD_SCALE) / CHUNK_SIZE);

  // Render distance: 1 = 3x3 (Fast), 2 = 5x5 (Normal), 3 = 7x7 (Far)
  const renderRadius = Math.min(3, Math.max(1, settings.renderDistance ?? 2));

  // Compute active chunk list
  const activeChunks = useMemo(() => {
    const chunks: { cx: number; cz: number; key: string }[] = [];
    for (let dx = -renderRadius; dx <= renderRadius; dx++) {
      for (let dz = -renderRadius; dz <= renderRadius; dz++) {
        const cx = currentChunkX + dx;
        const cz = currentChunkZ + dz;
        chunks.push({ cx, cz, key: `${cx},${cz}` });
      }
    }
    return chunks;
  }, [currentChunkX, currentChunkZ, renderRadius]);

  return (
    <group>
      {activeChunks.map(({ cx, cz, key }) => {
        const geo = generateChunkGeometry(cx, cz, settings);
        return (
          <mesh
            key={key}
            geometry={geo}
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
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}

      {/* Infinite Invisible Floor Plane for Raycasting anywhere clicked outside mesh */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[currentChunkX * CHUNK_SIZE + CHUNK_SIZE / 2, -0.01, currentChunkZ * CHUNK_SIZE + CHUNK_SIZE / 2]}
        visible={false}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerMove={onPointerMove}
      >
        <planeGeometry args={[CHUNK_SIZE * (renderRadius * 2 + 3), CHUNK_SIZE * (renderRadius * 2 + 3)]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
};

/**
 * 3D Component: Infinite Water Layer centered on the player's active region
 */
export const WaterMesh: React.FC<{
  playerPos: Position;
  settings: MapSettings;
  visible?: boolean;
}> = ({ playerPos, settings, visible = true }) => {
  const waterRef = useRef<THREE.Mesh>(null);
  const currentChunkX = Math.floor((playerPos.x * WORLD_SCALE) / CHUNK_SIZE);
  const currentChunkZ = Math.floor((playerPos.y * WORLD_SCALE) / CHUNK_SIZE);
  const renderRadius = Math.min(3, Math.max(1, settings.renderDistance ?? 2));
  const waterSize = CHUNK_SIZE * (renderRadius * 2 + 2);

  useFrame(({ clock }) => {
    if (waterRef.current) {
      waterRef.current.position.y = WATER_LEVEL + Math.sin(clock.elapsedTime * 1.5) * 0.015;
    }
  });

  if (!visible) return null;

  return (
    <mesh
      ref={waterRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[
        currentChunkX * CHUNK_SIZE + CHUNK_SIZE / 2,
        WATER_LEVEL,
        currentChunkZ * CHUNK_SIZE + CHUNK_SIZE / 2,
      ]}
      receiveShadow
    >
      <planeGeometry args={[waterSize, waterSize]} />
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
 * 3D Component: Instanced Nature (Trees, Rocks, Reeds, Lilypads, Grass, Flowers) for active chunks
 */
export const NatureInstances: React.FC<{
  settings: MapSettings;
  blackboards: Blackboard[];
  playerPos: Position;
}> = ({ settings, blackboards, playerPos }) => {
  const currentChunkX = Math.floor((playerPos.x * WORLD_SCALE) / CHUNK_SIZE);
  const currentChunkZ = Math.floor((playerPos.y * WORLD_SCALE) / CHUNK_SIZE);
  const renderRadius = Math.min(3, Math.max(1, settings.renderDistance ?? 2));

  // Collect data across all active chunks
  const { trunks, leaves, rocks, lilypads, reeds, grass, flowers } = useMemo(() => {
    const allTrunks: NatureData['trunks'] = [];
    const allLeaves: NatureData['leaves'] = [];
    const allRocks: NatureData['rocks'] = [];
    const allLilypads: NatureData['lilypads'] = [];
    const allReeds: NatureData['reeds'] = [];
    const allGrass: NatureData['grass'] = [];
    const allFlowers: NatureData['flowers'] = [];

    for (let dx = -renderRadius; dx <= renderRadius; dx++) {
      for (let dz = -renderRadius; dz <= renderRadius; dz++) {
        const cx = currentChunkX + dx;
        const cz = currentChunkZ + dz;
        const chunkData = getChunkNature(cx, cz, settings, blackboards);
        allTrunks.push(...chunkData.trunks);
        allLeaves.push(...chunkData.leaves);
        allRocks.push(...chunkData.rocks);
        allLilypads.push(...chunkData.lilypads);
        allReeds.push(...chunkData.reeds);
        allGrass.push(...chunkData.grass);
        allFlowers.push(...chunkData.flowers);
      }
    }

    return {
      trunks: allTrunks,
      leaves: allLeaves,
      rocks: allRocks,
      lilypads: allLilypads,
      reeds: allReeds,
      grass: allGrass,
      flowers: allFlowers,
    };
  }, [currentChunkX, currentChunkZ, renderRadius, settings, blackboards]);

  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const leavesRef = useRef<THREE.InstancedMesh>(null);
  const rocksRef = useRef<THREE.InstancedMesh>(null);
  const grassRef = useRef<THREE.InstancedMesh>(null);
  const flowerRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Update instanced matrices when active chunk contents change
  React.useLayoutEffect(() => {
    if (trunkRef.current && trunks.length > 0) {
      trunks.forEach((t, i) => {
        dummy.position.set(t.x, t.y, t.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        trunkRef.current!.setMatrixAt(i, dummy.matrix);
        if (t.color) trunkRef.current!.setColorAt(i, new THREE.Color(t.color));
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
        if (l.color) leavesRef.current!.setColorAt(i, new THREE.Color(l.color));
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

    if (grassRef.current && grass.length > 0) {
      grass.forEach((g, i) => {
        dummy.position.set(g.x, g.y + 0.15, g.z);
        dummy.rotation.set(0, (i * 0.8) % Math.PI, 0);
        dummy.scale.set(1, g.s, 1);
        dummy.updateMatrix();
        grassRef.current!.setMatrixAt(i, dummy.matrix);
      });
      grassRef.current.instanceMatrix.needsUpdate = true;
    }

    if (flowerRef.current && flowers.length > 0) {
      flowers.forEach((fl, i) => {
        dummy.position.set(fl.x, fl.y + 0.175, fl.z);
        dummy.rotation.set(0, (i * 1.1) % Math.PI, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        flowerRef.current!.setMatrixAt(i, dummy.matrix);
        flowerRef.current!.setColorAt(i, new THREE.Color(fl.color));
      });
      flowerRef.current.instanceMatrix.needsUpdate = true;
      if (flowerRef.current.instanceColor) flowerRef.current.instanceColor.needsUpdate = true;
    }
  }, [trunks, leaves, rocks, grass, flowers, dummy]);

  return (
    <>
      {/* Tree Trunks */}
      {trunks.length > 0 && (
        <instancedMesh
          key={`trunks-${trunks.length}`}
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
          key={`leaves-${leaves.length}`}
          ref={leavesRef}
          args={[undefined, undefined, leaves.length]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.48, 0.48, 0.48]} />
          <meshStandardMaterial roughness={0.8} />
        </instancedMesh>
      )}

      {/* Rocks */}
      {rocks.length > 0 && (
        <instancedMesh
          key={`rocks-${rocks.length}`}
          ref={rocksRef}
          args={[undefined, undefined, rocks.length]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.7, 0.6, 0.7]} />
          <meshStandardMaterial roughness={0.95} />
        </instancedMesh>
      )}

      {/* Grass Tufts */}
      {grass.length > 0 && (
        <instancedMesh
          key={`grass-${grass.length}`}
          ref={grassRef}
          args={[undefined, undefined, grass.length]}
          receiveShadow
        >
          <boxGeometry args={[0.15, 0.3, 0.15]} />
          <meshStandardMaterial color="#4d8544" roughness={0.9} />
        </instancedMesh>
      )}

      {/* Wildflowers */}
      {flowers.length > 0 && (
        <instancedMesh
          key={`flowers-${flowers.length}`}
          ref={flowerRef}
          args={[undefined, undefined, flowers.length]}
          receiveShadow
        >
          <boxGeometry args={[0.2, 0.35, 0.2]} />
          <meshStandardMaterial roughness={0.7} />
        </instancedMesh>
      )}

      {/* Lily pads */}
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
 * 3D Component: Infinite drifting clouds that follow the player overhead
 */
export const VoxelClouds: React.FC<{
  playerPos: Position;
  visible?: boolean;
}> = ({ playerPos, visible = true }) => {
  const groupRef = useRef<THREE.Group>(null);
  const px = playerPos.x * WORLD_SCALE;
  const pz = playerPos.y * WORLD_SCALE;

  const clouds = useMemo(() => {
    return [
      { x: -35, y: 22, z: -25, sx: 18, sy: 1.5, sz: 12 },
      { x: 15, y: 24, z: -35, sx: 24, sy: 1.5, sz: 14 },
      { x: -10, y: 21, z: 15, sx: 16, sy: 1.5, sz: 10 },
      { x: 30, y: 23, z: 25, sx: 22, sy: 1.5, sz: 15 },
      { x: -40, y: 25, z: 30, sx: 20, sy: 1.5, sz: 12 },
      { x: 45, y: 22, z: -10, sx: 26, sy: 1.5, sz: 16 },
      { x: -20, y: 23, z: -55, sx: 20, sy: 1.5, sz: 14 },
    ];
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current) {
      // Gentle drift + follow player chunk
      groupRef.current.position.x = px + ((Date.now() * 0.0008) % 120) - 60;
      groupRef.current.position.z = pz;
    }
  });

  if (!visible) return null;

  return (
    <group ref={groupRef} position={[px, 0, pz]}>
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
