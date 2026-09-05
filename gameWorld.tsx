import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WorldFeature, PlacedStructure, StructureType } from './types';

interface WorldObjectsProps {
  features: WorldFeature[];
  onInteractFeature: (feature: WorldFeature) => void;
  playerPos: { x: number; y: number };
  activeCampfirePos: { x: number; y: number } | null;
  getElevation: (x: number, z: number) => number;
  pulseRadius: number; // For Sonar expansion
  placedStructures?: PlacedStructure[];
  onInteractStructure?: (structure: PlacedStructure) => void;
  buildPreview?: {
    type: StructureType;
    x: number;
    y: number;
    elevation: number;
    rotation: number;
    canAfford: boolean;
  } | null;
}

// Single Obelisk Component
const ObeliskMesh: React.FC<{ feature: WorldFeature; isNearby: boolean; onInteract: () => void }> = ({
  feature,
  isNearby,
  onInteract,
}) => {
  const crystalRef = useRef<THREE.Mesh>(null);
  const runesRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    if (crystalRef.current) {
      crystalRef.current.rotation.y += 0.02;
      crystalRef.current.position.y = 4.2 + Math.sin(state.clock.elapsedTime * 2.5) * 0.2;
    }
  });

  return (
    <group position={[feature.x, feature.elevation, feature.y]} onClick={(e) => { e.stopPropagation(); onInteract(); }}>
      {/* Stone Base Steps */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.6, 2.4]} />
        <meshStandardMaterial color="#4a4d52" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.6, 1.8]} />
        <meshStandardMaterial color="#5a5e66" roughness={0.9} />
      </mesh>

      {/* Main Spire Shaft */}
      <mesh position={[0, 2.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 2.4, 1.1]} />
        <meshStandardMaterial color="#3a3c42" roughness={0.8} />
      </mesh>

      {/* Glowing Runic Bands */}
      <mesh position={[0, 2.2, 0]}>
        <boxGeometry args={[1.15, 0.3, 1.15]} />
        <meshStandardMaterial
          ref={runesRef}
          color={feature.active ? '#00e5ff' : '#223344'}
          emissive={feature.active ? '#00e5ff' : '#0a192f'}
          emissiveIntensity={feature.active ? 2.5 : 0.2}
          roughness={0.2}
        />
      </mesh>

      {/* Spire Top Pyramid */}
      <mesh position={[0, 3.6, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.7, 0.8, 4]} />
        <meshStandardMaterial color="#50545c" roughness={0.8} />
      </mesh>

      {/* Floating Floating Crystal At Peak */}
      <mesh ref={crystalRef} position={[0, 4.2, 0]} rotation={[Math.PI / 4, 0, Math.PI / 4]}>
        <octahedronGeometry args={[0.38, 0]} />
        <meshStandardMaterial
          color={feature.active ? '#00e5ff' : '#ffd700'}
          emissive={feature.active ? '#00e5ff' : '#b8860b'}
          emissiveIntensity={feature.active ? 3.0 : 1.0}
          roughness={0.1}
        />
      </mesh>

      {/* Active Light Pillar */}
      {feature.active && (
        <>
          <pointLight position={[0, 4.5, 0]} color="#00e5ff" intensity={4} distance={18} />
          {/* Vertical Beacon Beam */}
          <mesh position={[0, 18, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 30, 8]} />
            <meshBasicMaterial color="#00e5ff" transparent opacity={0.35} side={THREE.DoubleSide} />
          </mesh>
        </>
      )}

      {/* Nearby Interaction Highlight Halo */}
      {isNearby && !feature.active && (
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.6, 1.9, 16]} />
          <meshBasicMaterial color="#ffd700" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
};

// Single Ancient Chest Component
const ChestMesh: React.FC<{ feature: WorldFeature; isNearby: boolean; onInteract: () => void }> = ({
  feature,
  isNearby,
  onInteract,
}) => {
  return (
    <group position={[feature.x, feature.elevation, feature.y]} onClick={(e) => { e.stopPropagation(); onInteract(); }}>
      {/* Stone slab under chest */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[1.4, 0.16, 1.2]} />
        <meshStandardMaterial color="#555" roughness={0.9} />
      </mesh>

      {/* Chest Base Body */}
      <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.44, 0.7]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.7} />
      </mesh>

      {/* Iron / Gold Bandings */}
      <mesh position={[0, 0.36, 0]}>
        <boxGeometry args={[0.92, 0.46, 0.72]} />
        <meshStandardMaterial color="#2d2d2d" metalness={0.8} roughness={0.3} wireframe />
      </mesh>

      {/* Chest Lid */}
      <group position={[0, 0.58, -0.32]} rotation={feature.active ? [-0.9, 0, 0] : [0, 0, 0]}>
        <mesh position={[0, 0.12, 0.32]} castShadow>
          <boxGeometry args={[0.9, 0.24, 0.7]} />
          <meshStandardMaterial color="#a06535" roughness={0.7} />
        </mesh>
        {/* Latch */}
        <mesh position={[0, 0.04, 0.68]}>
          <boxGeometry args={[0.16, 0.18, 0.06]} />
          <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Golden Aura if unopened & nearby */}
      {!feature.active && (
        <pointLight position={[0, 0.7, 0]} color="#ffd700" intensity={isNearby ? 2.5 : 1.0} distance={6} />
      )}

      {isNearby && !feature.active && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 1.1, 16]} />
          <meshBasicMaterial color="#ffff00" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
};

// Buried Treasure Mound Component (Loose sand/dirt stones + sparkle)
const MoundMesh: React.FC<{ feature: WorldFeature; isNearby: boolean; onInteract: () => void }> = ({
  feature,
  isNearby,
  onInteract,
}) => {
  const sparkleRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (sparkleRef.current) {
      sparkleRef.current.position.y = 0.4 + Math.sin(state.clock.elapsedTime * 4) * 0.15;
      sparkleRef.current.rotation.y += 0.05;
    }
  });

  if (feature.active) {
    // Already excavated
    return (
      <group position={[feature.x, feature.elevation, feature.y]}>
        {/* Dug out dirt pit */}
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.7, 8]} />
          <meshStandardMaterial color="#3e2723" roughness={0.9} />
        </mesh>
      </group>
    );
  }

  return (
    <group position={[feature.x, feature.elevation, feature.y]} onClick={(e) => { e.stopPropagation(); onInteract(); }}>
      {/* Mound stones */}
      <mesh position={[0, 0.18, 0]} castShadow>
        <boxGeometry args={[0.8, 0.35, 0.8]} />
        <meshStandardMaterial color="#795548" roughness={0.9} />
      </mesh>
      <mesh position={[0.2, 0.28, -0.1]}>
        <boxGeometry args={[0.4, 0.25, 0.4]} />
        <meshStandardMaterial color="#8d6e63" roughness={0.9} />
      </mesh>

      {/* Glimmer / Sparkle */}
      <mesh ref={sparkleRef} position={[0, 0.4, 0]}>
        <octahedronGeometry args={[0.15, 0]} />
        <meshStandardMaterial color="#ffeb3b" emissive="#ffd700" emissiveIntensity={2.5} roughness={0.1} />
      </mesh>

      {isNearby && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.7, 0.95, 12]} />
          <meshBasicMaterial color="#ffcc00" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
};

// Cozy Campfire
const CampfireMesh: React.FC<{ x: number; z: number; elevation: number }> = ({ x, z, elevation }) => {
  const flameRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (flameRef.current) {
      const scale = 0.8 + Math.sin(state.clock.elapsedTime * 12) * 0.2;
      flameRef.current.scale.set(scale, scale * 1.2, scale);
    }
  });

  return (
    <group position={[x, elevation, z]}>
      {/* Stone Ring */}
      <mesh position={[0, 0.1, 0]}>
        <torusGeometry args={[0.7, 0.16, 6, 8]} />
        <meshStandardMaterial color="#555" roughness={0.9} />
      </mesh>

      {/* Crossed Charred Logs */}
      <mesh position={[0, 0.15, 0]} rotation={[0, 0.7, 0]}>
        <boxGeometry args={[1.1, 0.16, 0.2]} />
        <meshStandardMaterial color="#2b1704" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.15, 0]} rotation={[0, -0.7, 0]}>
        <boxGeometry args={[1.1, 0.16, 0.2]} />
        <meshStandardMaterial color="#2b1704" roughness={0.9} />
      </mesh>

      {/* Animated Fire Flame */}
      <mesh ref={flameRef} position={[0, 0.45, 0]}>
        <coneGeometry args={[0.3, 0.6, 6]} />
        <meshBasicMaterial color="#ff5722" />
      </mesh>
      <pointLight position={[0, 0.6, 0]} color="#ff9800" intensity={4} distance={12} />
    </group>
  );
};

// --- 3D PLACED STRUCTURES ---

// 1. Nomad Homestead (House)
const HouseMesh: React.FC<{ structure: PlacedStructure; isGhost?: boolean; canAfford?: boolean; onInteract?: () => void }> = ({
  structure,
  isGhost = false,
  canAfford = true,
  onInteract,
}) => {
  const smokeRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (smokeRef.current && !isGhost) {
      smokeRef.current.children.forEach((puff, idx) => {
        const offset = (state.clock.elapsedTime * 1.5 + idx * 0.8) % 2.5;
        puff.position.y = 3.6 + offset * 0.8;
        puff.position.x = 1.0 + Math.sin(state.clock.elapsedTime * 2 + idx) * 0.15;
        const scale = 0.15 + offset * 0.1;
        puff.scale.set(scale, scale, scale);
      });
    }
  });

  const matColor = isGhost ? (canAfford ? '#4ade80' : '#f87171') : undefined;
  const opacity = isGhost ? 0.6 : 1.0;
  const transparent = isGhost;

  return (
    <group
      position={[structure.x, structure.elevation, structure.y]}
      rotation={[0, structure.rotation, 0]}
      onClick={(e) => {
        if (!isGhost && onInteract) {
          e.stopPropagation();
          onInteract();
        }
      }}
    >
      {/* Stone Foundation */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.4, 0.4, 3.4]} />
        <meshStandardMaterial color={matColor || '#475569'} roughness={0.9} transparent={transparent} opacity={opacity} />
      </mesh>

      {/* Timber Log Walls */}
      <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.0, 1.7, 3.0]} />
        <meshStandardMaterial color={matColor || '#78350f'} roughness={0.8} transparent={transparent} opacity={opacity} />
      </mesh>

      {/* Front Door */}
      <mesh position={[0, 0.8, 1.51]}>
        <boxGeometry args={[0.7, 1.3, 0.08]} />
        <meshStandardMaterial color={matColor || '#451a03'} roughness={0.9} transparent={transparent} opacity={opacity} />
      </mesh>
      {/* Brass Doorknob */}
      <mesh position={[0.22, 0.8, 1.56]}>
        <boxGeometry args={[0.06, 0.06, 0.06]} />
        <meshStandardMaterial color={matColor || '#fbbf24'} metalness={0.9} roughness={0.2} transparent={transparent} opacity={opacity} />
      </mesh>

      {/* Glowing Warm Windows (Left & Right) */}
      <mesh position={[-1.51, 1.3, 0]}>
        <boxGeometry args={[0.08, 0.7, 0.7]} />
        <meshStandardMaterial
          color={matColor || '#fef08a'}
          emissive={isGhost ? '#000' : '#fef08a'}
          emissiveIntensity={isGhost ? 0 : 1.8}
          transparent={transparent}
          opacity={opacity}
        />
      </mesh>
      <mesh position={[1.51, 1.3, 0]}>
        <boxGeometry args={[0.08, 0.7, 0.7]} />
        <meshStandardMaterial
          color={matColor || '#fef08a'}
          emissive={isGhost ? '#000' : '#fef08a'}
          emissiveIntensity={isGhost ? 0 : 1.8}
          transparent={transparent}
          opacity={opacity}
        />
      </mesh>

      {/* Peaked Roof (Gable Roof) */}
      <mesh position={[0, 2.55, 0]} rotation={[0, 0, 0]} castShadow>
        <boxGeometry args={[3.4, 0.9, 3.4]} />
        <meshStandardMaterial color={matColor || '#451a03'} roughness={0.7} transparent={transparent} opacity={opacity} />
      </mesh>
      <mesh position={[0, 3.15, 0]} castShadow>
        <boxGeometry args={[2.4, 0.5, 3.42]} />
        <meshStandardMaterial color={matColor || '#3f1d0b'} roughness={0.7} transparent={transparent} opacity={opacity} />
      </mesh>

      {/* Cobblestone Chimney */}
      <mesh position={[1.0, 2.6, -0.8]} castShadow>
        <boxGeometry args={[0.6, 2.2, 0.6]} />
        <meshStandardMaterial color={matColor || '#334155'} roughness={0.9} transparent={transparent} opacity={opacity} />
      </mesh>

      {/* Cozy Hearth Smoke Puffs */}
      {!isGhost && (
        <group ref={smokeRef}>
          {[0, 1, 2].map((idx) => (
            <mesh key={idx} position={[1.0, 3.8 + idx * 0.4, -0.8]}>
              <sphereGeometry args={[0.16, 6, 6]} />
              <meshBasicMaterial color="#e2e8f0" transparent opacity={0.35} />
            </mesh>
          ))}
        </group>
      )}

      {/* Warm Porch & Interior Firelight */}
      {!isGhost && (
        <>
          <pointLight position={[0, 1.5, 1.8]} color="#ffedd5" intensity={2.5} distance={8} />
          <pointLight position={[0, 1.5, 0]} color="#f97316" intensity={3.5} distance={12} />
        </>
      )}
    </group>
  );
};

// 2. Field Workbench & Forge
const WorkbenchMesh: React.FC<{ structure: PlacedStructure; isGhost?: boolean; canAfford?: boolean; onInteract?: () => void }> = ({
  structure,
  isGhost = false,
  canAfford = true,
  onInteract,
}) => {
  const matColor = isGhost ? (canAfford ? '#4ade80' : '#f87171') : undefined;
  const opacity = isGhost ? 0.6 : 1.0;
  const transparent = isGhost;

  return (
    <group
      position={[structure.x, structure.elevation, structure.y]}
      rotation={[0, structure.rotation, 0]}
      onClick={(e) => {
        if (!isGhost && onInteract) {
          e.stopPropagation();
          onInteract();
        }
      }}
    >
      {/* Heavy Timber Table Top */}
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 0.22, 1.0]} />
        <meshStandardMaterial color={matColor || '#854d0e'} roughness={0.8} transparent={transparent} opacity={opacity} />
      </mesh>

      {/* 4 Wooden Legs */}
      {[[-0.7, -0.4], [0.7, -0.4], [-0.7, 0.4], [0.7, 0.4]].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.3, lz]} castShadow>
          <boxGeometry args={[0.18, 0.6, 0.18]} />
          <meshStandardMaterial color={matColor || '#713f12'} roughness={0.9} transparent={transparent} opacity={opacity} />
        </mesh>
      ))}

      {/* Iron Anvil on Bench */}
      <group position={[-0.4, 0.95, 0.1]}>
        <mesh castShadow>
          <boxGeometry args={[0.45, 0.28, 0.3]} />
          <meshStandardMaterial color={matColor || '#1e293b'} metalness={0.85} roughness={0.3} transparent={transparent} opacity={opacity} />
        </mesh>
        <mesh position={[-0.26, 0.08, 0]} castShadow>
          <boxGeometry args={[0.18, 0.12, 0.16]} />
          <meshStandardMaterial color={matColor || '#1e293b'} metalness={0.85} roughness={0.3} transparent={transparent} opacity={opacity} />
        </mesh>
      </group>

      {/* Rolled Blueprint & Tools */}
      <mesh position={[0.3, 0.84, -0.15]} rotation={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.4, 8]} />
        <meshStandardMaterial color={matColor || '#fef3c7'} roughness={0.9} transparent={transparent} opacity={opacity} />
      </mesh>
      <mesh position={[0.4, 0.83, 0.2]} rotation={[0, -0.6, 0]}>
        <boxGeometry args={[0.32, 0.06, 0.1]} />
        <meshStandardMaterial color={matColor || '#94a3b8'} metalness={0.9} roughness={0.2} transparent={transparent} opacity={opacity} />
      </mesh>

      {!isGhost && <pointLight position={[0, 1.2, 0]} color="#facc15" intensity={1.5} distance={5} />}
    </group>
  );
};

// 3. Stone Sentinel Watchtower
const WatchtowerMesh: React.FC<{ structure: PlacedStructure; isGhost?: boolean; canAfford?: boolean; onInteract?: () => void }> = ({
  structure,
  isGhost = false,
  canAfford = true,
  onInteract,
}) => {
  const beaconRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (beaconRef.current && !isGhost) {
      beaconRef.current.rotation.y += 0.03;
      beaconRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  const matColor = isGhost ? (canAfford ? '#4ade80' : '#f87171') : undefined;
  const opacity = isGhost ? 0.6 : 1.0;
  const transparent = isGhost;

  return (
    <group
      position={[structure.x, structure.elevation, structure.y]}
      rotation={[0, structure.rotation, 0]}
      onClick={(e) => {
        if (!isGhost && onInteract) {
          e.stopPropagation();
          onInteract();
        }
      }}
    >
      {/* Cobblestone Stepped Base */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 0.8, 2.6]} />
        <meshStandardMaterial color={matColor || '#475569'} roughness={0.9} transparent={transparent} opacity={opacity} />
      </mesh>

      {/* 4 Timber Corner Uprights */}
      {[[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]].map(([x, z], i) => (
        <mesh key={i} position={[x, 2.3, z]} castShadow>
          <boxGeometry args={[0.24, 3.2, 0.24]} />
          <meshStandardMaterial color={matColor || '#78350f'} roughness={0.8} transparent={transparent} opacity={opacity} />
        </mesh>
      ))}

      {/* Upper Observation Deck */}
      <mesh position={[0, 3.8, 0]} castShadow>
        <boxGeometry args={[2.4, 0.24, 2.4]} />
        <meshStandardMaterial color={matColor || '#92400e'} roughness={0.8} transparent={transparent} opacity={opacity} />
      </mesh>
      {/* Railings */}
      <mesh position={[0, 4.15, 1.15]}>
        <boxGeometry args={[2.4, 0.45, 0.08]} />
        <meshStandardMaterial color={matColor || '#78350f'} roughness={0.9} transparent={transparent} opacity={opacity} />
      </mesh>
      <mesh position={[0, 4.15, -1.15]}>
        <boxGeometry args={[2.4, 0.45, 0.08]} />
        <meshStandardMaterial color={matColor || '#78350f'} roughness={0.9} transparent={transparent} opacity={opacity} />
      </mesh>

      {/* Peaked Canopy Roof */}
      <mesh position={[0, 4.9, 0]} castShadow>
        <boxGeometry args={[2.7, 0.4, 2.7]} />
        <meshStandardMaterial color={matColor || '#3f1d0b'} roughness={0.7} transparent={transparent} opacity={opacity} />
      </mesh>

      {/* Blazing Starlight Beacon Lantern */}
      <mesh ref={beaconRef} position={[0, 4.25, 0]}>
        <octahedronGeometry args={[0.32, 0]} />
        <meshStandardMaterial
          color={matColor || '#38bdf8'}
          emissive={isGhost ? '#000' : '#0284c7'}
          emissiveIntensity={isGhost ? 0 : 3.5}
          roughness={0.1}
          transparent={transparent}
          opacity={opacity}
        />
      </mesh>

      {!isGhost && (
        <>
          <pointLight position={[0, 4.3, 0]} color="#38bdf8" intensity={4} distance={24} />
          {/* Vertical Sky Beacon Beam */}
          <mesh position={[0, 16, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 26, 8]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.25} side={THREE.DoubleSide} />
          </mesh>
        </>
      )}
    </group>
  );
};

// 4. Automated Defense Ballista Turret
const TurretMesh: React.FC<{ structure: PlacedStructure; isGhost?: boolean; canAfford?: boolean; onInteract?: () => void }> = ({
  structure,
  isGhost = false,
  canAfford = true,
  onInteract,
}) => {
  const swivelRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (swivelRef.current && !isGhost) {
      swivelRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.7;
    }
  });

  const matColor = isGhost ? (canAfford ? '#4ade80' : '#f87171') : undefined;
  const opacity = isGhost ? 0.6 : 1.0;
  const transparent = isGhost;

  return (
    <group
      position={[structure.x, structure.elevation, structure.y]}
      rotation={[0, structure.rotation, 0]}
      onClick={(e) => {
        if (!isGhost && onInteract) {
          e.stopPropagation();
          onInteract();
        }
      }}
    >
      {/* Stone / Timber Tripod Base */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.6, 0.8, 0.4, 6]} />
        <meshStandardMaterial color={matColor || '#475569'} roughness={0.9} transparent={transparent} opacity={opacity} />
      </mesh>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.6, 8]} />
        <meshStandardMaterial color={matColor || '#78350f'} roughness={0.8} transparent={transparent} opacity={opacity} />
      </mesh>

      {/* Swiveling Ballista Head */}
      <group ref={swivelRef} position={[0, 0.95, 0]}>
        {/* Ballista Stock */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.18, 0.16, 1.2]} />
          <meshStandardMaterial color={matColor || '#854d0e'} roughness={0.8} transparent={transparent} opacity={opacity} />
        </mesh>
        {/* Crossbow Bow Arms */}
        <mesh position={[0, 0.05, 0.4]} rotation={[0, 0, 0]} castShadow>
          <boxGeometry args={[1.3, 0.1, 0.12]} />
          <meshStandardMaterial color={matColor || '#a16207'} roughness={0.7} transparent={transparent} opacity={opacity} />
        </mesh>
        {/* Loaded Piercing Arrow */}
        <mesh position={[0, 0.1, 0.35]}>
          <boxGeometry args={[0.05, 0.05, 0.9]} />
          <meshStandardMaterial color={matColor || '#e2e8f0'} metalness={0.8} roughness={0.3} transparent={transparent} opacity={opacity} />
        </mesh>
      </group>

      {!isGhost && <pointLight position={[0, 1.2, 0]} color="#facc15" intensity={1} distance={6} />}
    </group>
  );
};

// 5. Reinforced Supply Stash (Storage Chest)
const StorageChestMesh: React.FC<{ structure: PlacedStructure; isGhost?: boolean; canAfford?: boolean; onInteract?: () => void }> = ({
  structure,
  isGhost = false,
  canAfford = true,
  onInteract,
}) => {
  const matColor = isGhost ? (canAfford ? '#4ade80' : '#f87171') : undefined;
  const opacity = isGhost ? 0.6 : 1.0;
  const transparent = isGhost;

  return (
    <group
      position={[structure.x, structure.elevation, structure.y]}
      rotation={[0, structure.rotation, 0]}
      onClick={(e) => {
        if (!isGhost && onInteract) {
          e.stopPropagation();
          onInteract();
        }
      }}
    >
      {/* Wood Base Box */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.55, 0.75]} />
        <meshStandardMaterial color={matColor || '#92400e'} roughness={0.8} transparent={transparent} opacity={opacity} />
      </mesh>
      {/* Iron Straps & Reinforcements */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[1.12, 0.57, 0.77]} />
        <meshStandardMaterial color={matColor || '#334155'} metalness={0.85} roughness={0.3} wireframe transparent={transparent} opacity={opacity} />
      </mesh>
      {/* Golden Padlock */}
      <mesh position={[0, 0.38, 0.4]}>
        <boxGeometry args={[0.14, 0.16, 0.08]} />
        <meshStandardMaterial color={matColor || '#f59e0b'} metalness={0.9} roughness={0.2} transparent={transparent} opacity={opacity} />
      </mesh>
    </group>
  );
};

// 6. Expedition Canvas Tent
const TentMesh: React.FC<{ structure: PlacedStructure; isGhost?: boolean; canAfford?: boolean; onInteract?: () => void }> = ({
  structure,
  isGhost = false,
  canAfford = true,
  onInteract,
}) => {
  const matColor = isGhost ? (canAfford ? '#4ade80' : '#f87171') : undefined;
  const opacity = isGhost ? 0.6 : 1.0;
  const transparent = isGhost;

  return (
    <group
      position={[structure.x, structure.elevation, structure.y]}
      rotation={[0, structure.rotation, 0]}
      onClick={(e) => {
        if (!isGhost && onInteract) {
          e.stopPropagation();
          onInteract();
        }
      }}
    >
      {/* Ground Sheet / Rug */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[1.8, 0.06, 2.1]} />
        <meshStandardMaterial color={matColor || '#0284c7'} roughness={0.9} transparent={transparent} opacity={opacity} />
      </mesh>

      {/* A-Frame Peaked Canvas Roof */}
      <mesh position={[-0.45, 0.7, 0]} rotation={[0, 0, 0.55]} castShadow>
        <boxGeometry args={[0.1, 1.6, 2.0]} />
        <meshStandardMaterial color={matColor || '#f8fafc'} roughness={0.9} transparent={transparent} opacity={opacity} />
      </mesh>
      <mesh position={[0.45, 0.7, 0]} rotation={[0, 0, -0.55]} castShadow>
        <boxGeometry args={[0.1, 1.6, 2.0]} />
        <meshStandardMaterial color={matColor || '#f8fafc'} roughness={0.9} transparent={transparent} opacity={opacity} />
      </mesh>

      {/* Ridgepole & Front Poles */}
      <mesh position={[0, 1.4, 0]}>
        <boxGeometry args={[0.12, 0.12, 2.2]} />
        <meshStandardMaterial color={matColor || '#78350f'} roughness={0.8} transparent={transparent} opacity={opacity} />
      </mesh>

      {/* Cozy Warm Lantern inside */}
      {!isGhost && <pointLight position={[0, 0.6, 0]} color="#fbbf24" intensity={2.0} distance={6} />}
    </group>
  );
};

// 7. Leyline Teleport Conduit
const ArcaneConduitMesh: React.FC<{ structure: PlacedStructure; isGhost?: boolean; canAfford?: boolean; onInteract?: () => void }> = ({
  structure,
  isGhost = false,
  canAfford = true,
  onInteract,
}) => {
  const crystalRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (crystalRef.current && !isGhost) {
      crystalRef.current.rotation.y += 0.04;
      crystalRef.current.position.y = 1.4 + Math.sin(state.clock.elapsedTime * 3) * 0.12;
    }
  });

  const matColor = isGhost ? (canAfford ? '#4ade80' : '#f87171') : undefined;
  const opacity = isGhost ? 0.6 : 1.0;
  const transparent = isGhost;

  return (
    <group
      position={[structure.x, structure.elevation, structure.y]}
      rotation={[0, structure.rotation, 0]}
      onClick={(e) => {
        if (!isGhost && onInteract) {
          e.stopPropagation();
          onInteract();
        }
      }}
    >
      {/* Stone Runic Ring */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.2, 1.4, 0.3, 8]} />
        <meshStandardMaterial color={matColor || '#334155'} roughness={0.8} transparent={transparent} opacity={opacity} />
      </mesh>
      {/* Glowing Inner Leyline Circle */}
      <mesh position={[0, 0.32, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.9, 16]} />
        <meshBasicMaterial color={matColor || '#c084fc'} transparent opacity={isGhost ? 0.4 : 0.85} side={THREE.DoubleSide} />
      </mesh>

      {/* Floating Rotating Amethyst Crystal */}
      <mesh ref={crystalRef} position={[0, 1.4, 0]}>
        <octahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial
          color={matColor || '#c084fc'}
          emissive={isGhost ? '#000' : '#9333ea'}
          emissiveIntensity={isGhost ? 0 : 3.5}
          roughness={0.1}
          transparent={transparent}
          opacity={opacity}
        />
      </mesh>

      {!isGhost && (
        <>
          <pointLight position={[0, 1.5, 0]} color="#c084fc" intensity={3.5} distance={14} />
          {/* Beacon Column */}
          <mesh position={[0, 12, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 22, 8]} />
            <meshBasicMaterial color="#c084fc" transparent opacity={0.3} side={THREE.DoubleSide} />
          </mesh>
        </>
      )}
    </group>
  );
};

// Dispatcher for any placed structure model
export const StructureModel: React.FC<{
  structure: PlacedStructure;
  isGhost?: boolean;
  canAfford?: boolean;
  onInteract?: () => void;
}> = ({ structure, isGhost, canAfford, onInteract }) => {
  switch (structure.type) {
    case 'house':
      return <HouseMesh structure={structure} isGhost={isGhost} canAfford={canAfford} onInteract={onInteract} />;
    case 'workbench':
      return <WorkbenchMesh structure={structure} isGhost={isGhost} canAfford={canAfford} onInteract={onInteract} />;
    case 'watchtower':
      return <WatchtowerMesh structure={structure} isGhost={isGhost} canAfford={canAfford} onInteract={onInteract} />;
    case 'turret':
      return <TurretMesh structure={structure} isGhost={isGhost} canAfford={canAfford} onInteract={onInteract} />;
    case 'storage_chest':
      return <StorageChestMesh structure={structure} isGhost={isGhost} canAfford={canAfford} onInteract={onInteract} />;
    case 'tent':
      return <TentMesh structure={structure} isGhost={isGhost} canAfford={canAfford} onInteract={onInteract} />;
    case 'arcane_conduit':
      return <ArcaneConduitMesh structure={structure} isGhost={isGhost} canAfford={canAfford} onInteract={onInteract} />;
    default:
      return null;
  }
};

export const WorldFeaturesManager: React.FC<WorldObjectsProps> = ({
  features,
  onInteractFeature,
  playerPos,
  activeCampfirePos,
  getElevation,
  pulseRadius,
  placedStructures = [],
  onInteractStructure,
  buildPreview,
}) => {
  return (
    <group>
      {/* World Features with distance culling */}
      {features.map((feature) => {
        const dx = feature.x - playerPos.x;
        const dz = feature.y - playerPos.y;
        if (Math.abs(dx) > 65 || Math.abs(dz) > 65) return null; // Cull distant features outside view
        const dist = Math.sqrt(dx * dx + dz * dz);
        const isNearby = dist < 2.5;

        if (feature.type === 'obelisk') {
          return (
            <ObeliskMesh
              key={feature.id}
              feature={feature}
              isNearby={isNearby}
              onInteract={() => onInteractFeature(feature)}
            />
          );
        }
        if (feature.type === 'chest') {
          return (
            <ChestMesh
              key={feature.id}
              feature={feature}
              isNearby={isNearby}
              onInteract={() => onInteractFeature(feature)}
            />
          );
        }
        if (feature.type === 'buried_mound') {
          return (
            <MoundMesh
              key={feature.id}
              feature={feature}
              isNearby={isNearby}
              onInteract={() => onInteractFeature(feature)}
            />
          );
        }
        return null;
      })}

      {/* Built Structures placed by player in the world */}
      {placedStructures.map((struct) => {
        const dx = struct.x - playerPos.x;
        const dz = struct.y - playerPos.y;
        if (Math.abs(dx) > 70 || Math.abs(dz) > 70) return null;
        return (
          <StructureModel
            key={struct.id}
            structure={struct}
            onInteract={() => onInteractStructure && onInteractStructure(struct)}
          />
        );
      })}

      {/* Real-time Holographic Build Preview */}
      {buildPreview && (
        <StructureModel
          structure={{
            id: 'preview_ghost',
            type: buildPreview.type,
            x: buildPreview.x,
            y: buildPreview.y,
            elevation: buildPreview.elevation,
            rotation: buildPreview.rotation,
            createdAt: 0,
          }}
          isGhost={true}
          canAfford={buildPreview.canAfford}
        />
      )}

      {/* Active Campfire */}
      {activeCampfirePos && (
        <CampfireMesh
          x={activeCampfirePos.x}
          z={activeCampfirePos.y}
          elevation={getElevation(activeCampfirePos.x, activeCampfirePos.y)}
        />
      )}

      {/* Expanding Sonar Pulse Ring */}
      {pulseRadius > 0 && (
        <mesh
          position={[playerPos.x, getElevation(playerPos.x, playerPos.y) + 0.1, playerPos.y]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[Math.max(0.1, pulseRadius - 1.5), pulseRadius, 48]} />
          <meshBasicMaterial color="#00ffff" transparent opacity={Math.max(0, 1 - pulseRadius / 50)} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
};
