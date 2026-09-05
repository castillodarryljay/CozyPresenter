import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CompanionType, CompanionMood } from './types';

interface CompanionProps {
  playerPos: { x: number; y: number };
  playerElevation: number;
  type?: CompanionType;
  mood?: CompanionMood;
  nearbyFeaturePos?: { x: number; y: number } | null;
  happiness?: number;
  getElevation: (x: number, z: number) => number;
}

export const VoxelCompanion: React.FC<CompanionProps> = ({
  playerPos,
  playerElevation,
  type = 'fox',
  mood = 'happy',
  nearbyFeaturePos = null,
  getElevation
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const posRef = useRef<THREE.Vector3>(new THREE.Vector3(playerPos.x + 1.2, playerElevation, playerPos.y + 1.2));
  const rotRef = useRef<number>(0);

  // Body parts refs for walking & tail wag
  const legFLRef = useRef<THREE.Mesh>(null);
  const legFRRef = useRef<THREE.Mesh>(null);
  const legBLRef = useRef<THREE.Mesh>(null);
  const legBRRef = useRef<THREE.Mesh>(null);
  const tailRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);

  // Colors based on pet type
  const isFox = type === 'fox';
  const isDog = type === 'dog';
  
  const mainColor = isFox ? '#e65c00' : (isDog ? '#d4a373' : '#8d6e63'); // fox orange, dog golden, capybara mocha
  const underColor = isFox ? '#f7f7f7' : (isDog ? '#faedcd' : '#6d4c41');
  const noseColor = '#1a1a1a';
  const earColor = isFox ? '#2b1d0c' : (isDog ? '#b08968' : '#5d4037');

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Determine target location:
    // If companion sniffs nearby treasure, it moves slightly ahead toward the treasure!
    let targetX = playerPos.x - 1.2;
    let targetZ = playerPos.y - 1.2;

    if (nearbyFeaturePos) {
      // Guide player toward feature
      const dirX = nearbyFeaturePos.x - playerPos.x;
      const dirZ = nearbyFeaturePos.y - playerPos.y;
      const dist = Math.sqrt(dirX * dirX + dirZ * dirZ);
      if (dist > 0.5) {
        targetX = playerPos.x + (dirX / dist) * Math.min(dist * 0.7, 3.5);
        targetZ = playerPos.y + (dirZ / dist) * Math.min(dist * 0.7, 3.5);
      }
    }

    const currentPos = posRef.current;
    const dx = targetX - currentPos.x;
    const dz = targetZ - currentPos.z;
    const distToTarget = Math.sqrt(dx * dx + dz * dz);

    const speed = Math.min(distToTarget * 4.5, 9.0);
    const isMoving = distToTarget > 0.3;

    if (isMoving) {
      currentPos.x += (dx / distToTarget) * speed * delta;
      currentPos.z += (dz / distToTarget) * speed * delta;
      const targetAngle = Math.atan2(dx, dz);
      
      // Smooth rotation
      let diff = targetAngle - rotRef.current;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      rotRef.current += diff * 8 * delta;
    }

    // Elevation on stepped terrain
    const groundY = getElevation(currentPos.x, currentPos.z);
    currentPos.y += (groundY - currentPos.y) * 10 * delta;

    groupRef.current.position.copy(currentPos);
    groupRef.current.rotation.y = rotRef.current;

    // Leg walking cycle
    const walkTime = Date.now() * 0.012;
    if (isMoving) {
      const legAngle = Math.sin(walkTime) * 0.5;
      if (legFLRef.current) legFLRef.current.rotation.x = legAngle;
      if (legFRRef.current) legFRRef.current.rotation.x = -legAngle;
      if (legBLRef.current) legBLRef.current.rotation.x = -legAngle;
      if (legBRRef.current) legBRRef.current.rotation.x = legAngle;
    } else {
      if (legFLRef.current) legFLRef.current.rotation.x = 0;
      if (legFRRef.current) legFRRef.current.rotation.x = 0;
      if (legBLRef.current) legBLRef.current.rotation.x = 0;
      if (legBRRef.current) legBRRef.current.rotation.x = 0;
    }

    // Tail wagging (excited when near secret or happy)
    if (tailRef.current) {
      const wagSpeed = nearbyFeaturePos ? 0.025 : 0.012;
      tailRef.current.rotation.y = Math.sin(Date.now() * wagSpeed) * 0.45;
      tailRef.current.rotation.z = Math.sin(Date.now() * (wagSpeed * 0.5)) * 0.15;
    }

    // Head bobbing/sniffing
    if (headRef.current) {
      if (nearbyFeaturePos) {
        headRef.current.position.y = 0.45 + Math.sin(Date.now() * 0.015) * 0.05;
        headRef.current.rotation.x = 0.2 + Math.sin(Date.now() * 0.01) * 0.1; // sniffing down
      } else {
        headRef.current.position.y = 0.45;
        headRef.current.rotation.x = 0;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Companion Body */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.4, 0.32, 0.6]} />
        <meshStandardMaterial color={mainColor} roughness={0.8} />
      </mesh>

      {/* Underbelly Accent */}
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[0.38, 0.12, 0.58]} />
        <meshStandardMaterial color={underColor} roughness={0.8} />
      </mesh>

      {/* Head Group */}
      <group ref={headRef} position={[0, 0.45, 0.3]}>
        {/* Head base */}
        <mesh castShadow>
          <boxGeometry args={[0.34, 0.3, 0.32]} />
          <meshStandardMaterial color={mainColor} roughness={0.8} />
        </mesh>

        {/* Snout */}
        <mesh position={[0, -0.06, 0.2]}>
          <boxGeometry args={[0.2, 0.14, 0.18]} />
          <meshStandardMaterial color={underColor} roughness={0.8} />
        </mesh>

        {/* Nose */}
        <mesh position={[0, -0.02, 0.3]}>
          <boxGeometry args={[0.08, 0.06, 0.05]} />
          <meshStandardMaterial color={noseColor} roughness={0.5} />
        </mesh>

        {/* Eyes */}
        <mesh position={[-0.1, 0.04, 0.16]}>
          <boxGeometry args={[0.04, 0.06, 0.02]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        <mesh position={[0.1, 0.04, 0.16]}>
          <boxGeometry args={[0.04, 0.06, 0.02]} />
          <meshStandardMaterial color="#000000" />
        </mesh>

        {/* Ears */}
        <mesh position={[-0.11, 0.2, -0.04]}>
          <boxGeometry args={[0.09, 0.14, 0.06]} />
          <meshStandardMaterial color={earColor} roughness={0.8} />
        </mesh>
        <mesh position={[0.11, 0.2, -0.04]}>
          <boxGeometry args={[0.09, 0.14, 0.06]} />
          <meshStandardMaterial color={earColor} roughness={0.8} />
        </mesh>
      </group>

      {/* 4 Legs */}
      <mesh ref={legFLRef} position={[-0.14, 0.1, 0.18]}>
        <boxGeometry args={[0.1, 0.22, 0.1]} />
        <meshStandardMaterial color={mainColor} roughness={0.8} />
      </mesh>
      <mesh ref={legFRRef} position={[0.14, 0.1, 0.18]}>
        <boxGeometry args={[0.1, 0.22, 0.1]} />
        <meshStandardMaterial color={mainColor} roughness={0.8} />
      </mesh>
      <mesh ref={legBLRef} position={[-0.14, 0.1, -0.18]}>
        <boxGeometry args={[0.1, 0.22, 0.1]} />
        <meshStandardMaterial color={mainColor} roughness={0.8} />
      </mesh>
      <mesh ref={legBRRef} position={[0.14, 0.1, -0.18]}>
        <boxGeometry args={[0.1, 0.22, 0.1]} />
        <meshStandardMaterial color={mainColor} roughness={0.8} />
      </mesh>

      {/* Tail Group */}
      <group ref={tailRef} position={[0, 0.35, -0.3]}>
        <mesh position={[0, 0.1, -0.14]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[0.14, 0.16, 0.32]} />
          <meshStandardMaterial color={isFox ? underColor : mainColor} roughness={0.8} />
        </mesh>
      </group>

      {/* Floating Emote Icon Billboard when excited or sniffing */}
      {nearbyFeaturePos && (
        <group position={[0, 1.1, 0]}>
          <mesh>
            <planeGeometry args={[0.4, 0.4]} />
            <meshBasicMaterial color="#ffeb3b" transparent opacity={0.85} side={THREE.DoubleSide} />
          </mesh>
          <pointLight color="#ffeb3b" distance={2.5} intensity={1.5} />
        </group>
      )}
    </group>
  );
};
