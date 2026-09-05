import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WorldFeature } from './types';

interface WorldObjectsProps {
  features: WorldFeature[];
  onInteractFeature: (feature: WorldFeature) => void;
  playerPos: { x: number; y: number };
  activeCampfirePos: { x: number; y: number } | null;
  getElevation: (x: number, z: number) => number;
  pulseRadius: number; // For Sonar expansion
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

export const WorldFeaturesManager: React.FC<WorldObjectsProps> = ({
  features,
  onInteractFeature,
  playerPos,
  activeCampfirePos,
  getElevation,
  pulseRadius,
}) => {
  return (
    <group>
      {/* World Objects */}
      {features.map((feature) => {
        const dx = feature.x - playerPos.x;
        const dz = feature.y - playerPos.y;
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
