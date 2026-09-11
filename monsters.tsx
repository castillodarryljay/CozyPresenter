import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Monster, Projectile, LootDrop, DamageNumber } from './types';

// --- Helper: Floating Overhead Health Bar ---
const OverheadHealthBar: React.FC<{ hp: number; maxHp: number; yOffset: number; name: string }> = ({
  hp,
  maxHp,
  yOffset,
}) => {
  const hpRatio = Math.max(0, Math.min(1, hp / maxHp));
  if (hpRatio >= 1) return null; // Only show when engaged/damaged

  return (
    <group position={[0, yOffset, 0]}>
      {/* Background dark bar */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.0, 0.12, 0.04]} />
        <meshBasicMaterial color="#111827" />
      </mesh>
      {/* Foreground health bar */}
      <mesh position={[(hpRatio - 1) * 0.48, 0, 0.02]} scale={[hpRatio, 1, 1]}>
        <boxGeometry args={[0.96, 0.08, 0.04]} />
        <meshBasicMaterial color={hpRatio > 0.4 ? '#22c55e' : '#ef4444'} />
      </mesh>
    </group>
  );
};

// --- Slime Component ---
const SlimeMob: React.FC<{ monster: Monster; now: number }> = ({ monster, now }) => {
  const groupRef = useRef<THREE.Group>(null);
  const isHurt = monster.hurtUntilTime > now;

  useFrame((state, delta) => {
    if (groupRef.current) {
      if (monster.state === 'dead') {
        groupRef.current.scale.lerp(new THREE.Vector3(0.001, 0.001, 0.001), delta * 14);
        return;
      }
      // Bouncing hop motion
      const bounce = Math.abs(Math.sin(state.clock.elapsedTime * 6 + monster.x));
      const squash = 1 - bounce * 0.25;
      const stretch = 1 + bounce * 0.35;
      groupRef.current.scale.set(stretch, squash, stretch);
      
      const hurtStagger = isHurt ? Math.sin(state.clock.elapsedTime * 45) * 0.1 : 0;
      groupRef.current.position.set(monster.x + hurtStagger, monster.elevation + 0.4 + bounce * 0.5, monster.y);
      groupRef.current.rotation.y = monster.rotation;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[monster.x, monster.elevation + 0.4, monster.y]}
      rotation={[0, monster.rotation, 0]}
    >
      {/* Ground Contact Shadow */}
      <mesh position={[0, -0.38, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.45, 12]} />
        <meshBasicMaterial color="#0f172a" transparent opacity={0.35} depthWrite={false} />
      </mesh>

      {/* Translucent Jelly Outer Body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial
          color={isHurt ? '#ef4444' : '#10b981'}
          emissive={isHurt ? '#ef4444' : '#059669'}
          emissiveIntensity={isHurt ? 1.5 : 0.2}
          roughness={0.15}
          transparent
          opacity={0.82}
        />
      </mesh>

      {/* Dark Inner Core */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[0.42, 0.42, 0.42]} />
        <meshStandardMaterial color="#064e3b" roughness={0.6} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.18, 0.12, 0.42]}>
        <boxGeometry args={[0.1, 0.12, 0.04]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0.18, 0.12, 0.42]}>
        <boxGeometry args={[0.1, 0.12, 0.04]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>

      <OverheadHealthBar hp={monster.hp} maxHp={monster.maxHp} yOffset={0.9} name={monster.name} />
    </group>
  );
};

// --- Skeleton Stalker Component ---
const SkeletonMob: React.FC<{ monster: Monster; now: number }> = ({ monster, now }) => {
  const groupRef = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Mesh>(null);
  const rightLeg = useRef<THREE.Mesh>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const isHurt = monster.hurtUntilTime > now;

  useFrame((state, delta) => {
    if (groupRef.current) {
      if (monster.state === 'dead') {
        groupRef.current.scale.lerp(new THREE.Vector3(0.001, 0.001, 0.001), delta * 12);
        return;
      }
      const hurtStagger = isHurt ? Math.sin(state.clock.elapsedTime * 45) * 0.1 : 0;
      groupRef.current.position.set(monster.x + hurtStagger, monster.elevation + 0.8, monster.y);
      groupRef.current.rotation.y = monster.rotation;

      const isWalking = monster.state === 'chase' || monster.state === 'patrol';
      if (isWalking && leftLeg.current && rightLeg.current && leftArm.current && rightArm.current) {
        const swing = Math.sin(state.clock.elapsedTime * 10);
        leftLeg.current.rotation.x = swing * 0.5;
        rightLeg.current.rotation.x = -swing * 0.5;
        leftArm.current.rotation.x = -swing * 0.5;
        rightArm.current.rotation.x = swing * 0.5;
      }
    }
  });

  return (
    <group
      ref={groupRef}
      position={[monster.x, monster.elevation + 0.8, monster.y]}
      rotation={[0, monster.rotation, 0]}
    >
      {/* Contact Shadow */}
      <mesh position={[0, -0.78, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.4, 12]} />
        <meshBasicMaterial color="#0f172a" transparent opacity={0.35} depthWrite={false} />
      </mesh>

      {/* Skull */}
      <group position={[0, 0.65, 0]}>
        <mesh>
          <boxGeometry args={[0.42, 0.42, 0.42]} />
          <meshStandardMaterial
            color={isHurt ? '#ef4444' : '#e2e8f0'}
            emissive={isHurt ? '#ef4444' : '#000000'}
            emissiveIntensity={isHurt ? 1.5 : 0}
            roughness={0.9}
          />
        </mesh>
        {/* Red Glowing Eye Sockets */}
        <mesh position={[-0.1, 0.05, 0.22]}>
          <boxGeometry args={[0.08, 0.08, 0.02]} />
          <meshBasicMaterial color="#dc2626" />
        </mesh>
        <mesh position={[0.1, 0.05, 0.22]}>
          <boxGeometry args={[0.08, 0.08, 0.02]} />
          <meshBasicMaterial color="#dc2626" />
        </mesh>
      </group>

      {/* Ribcage / Spine */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.34, 0.55, 0.2]} />
        <meshStandardMaterial
          color={isHurt ? '#ef4444' : '#cbd5e1'}
          emissive={isHurt ? '#ef4444' : '#000000'}
          emissiveIntensity={isHurt ? 1.5 : 0}
          roughness={0.9}
        />
      </mesh>

      {/* Left Arm */}
      <group ref={leftArm} position={[-0.26, 0.35, 0]}>
        <mesh position={[0, -0.25, 0]}>
          <boxGeometry args={[0.12, 0.55, 0.12]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
        </mesh>
      </group>

      {/* Right Arm (Wielding bone bow/blade) */}
      <group ref={rightArm} position={[0.26, 0.35, 0]}>
        <mesh position={[0, -0.25, 0]}>
          <boxGeometry args={[0.12, 0.55, 0.12]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
        </mesh>
        {/* Bone Bow in hand */}
        <group position={[0, -0.45, 0.25]}>
          <mesh>
            <boxGeometry args={[0.06, 0.75, 0.08]} />
            <meshStandardMaterial color="#78350f" roughness={0.8} />
          </mesh>
        </group>
      </group>

      {/* Legs */}
      <mesh ref={leftLeg} position={[-0.1, -0.45, 0]}>
        <boxGeometry args={[0.12, 0.65, 0.12]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.9} />
      </mesh>
      <mesh ref={rightLeg} position={[0.1, -0.45, 0]}>
        <boxGeometry args={[0.12, 0.65, 0.12]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.9} />
      </mesh>

      <OverheadHealthBar hp={monster.hp} maxHp={monster.maxHp} yOffset={1.15} name={monster.name} />
    </group>
  );
};

// --- Ancient Stone Golem Component ---
const GolemMob: React.FC<{ monster: Monster; now: number }> = ({ monster, now }) => {
  const groupRef = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const isHurt = monster.hurtUntilTime > now;

  useFrame((state, delta) => {
    if (groupRef.current) {
      if (monster.state === 'dead') {
        groupRef.current.scale.lerp(new THREE.Vector3(0.001, 0.001, 0.001), delta * 10);
        return;
      }
      const hurtStagger = isHurt ? Math.sin(state.clock.elapsedTime * 45) * 0.12 : 0;
      groupRef.current.position.set(monster.x + hurtStagger, monster.elevation + 1.2, monster.y);
      groupRef.current.rotation.y = monster.rotation;

      const t = state.clock.elapsedTime;
      // Stomping sway
      if (monster.state === 'chase' || monster.state === 'patrol') {
        const sway = Math.sin(t * 5);
        groupRef.current.rotation.z = sway * 0.08;
        if (leftArm.current && rightArm.current) {
          leftArm.current.rotation.x = sway * 0.4;
          rightArm.current.rotation.x = -sway * 0.4;
        }
      }
      // Glowing core pulse
      if (coreRef.current) {
        coreRef.current.rotation.y += 0.03;
      }
    }
  });

  return (
    <group
      ref={groupRef}
      position={[monster.x, monster.elevation + 1.2, monster.y]}
      rotation={[0, monster.rotation, 0]}
    >
      {/* Massive Contact Shadow */}
      <mesh position={[0, -1.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.8, 16]} />
        <meshBasicMaterial color="#0f172a" transparent opacity={0.45} depthWrite={false} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[0.55, 0.4, 0.5]} />
        <meshStandardMaterial
          color={isHurt ? '#ef4444' : '#475569'}
          emissive={isHurt ? '#ef4444' : '#000000'}
          emissiveIntensity={isHurt ? 1.5 : 0}
          roughness={0.9}
        />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.12, 0.85, 0.26]}>
        <boxGeometry args={[0.08, 0.06, 0.02]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
      <mesh position={[0.12, 0.85, 0.26]}>
        <boxGeometry args={[0.08, 0.06, 0.02]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* Massive Torso */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.95, 0.85, 0.65]} />
        <meshStandardMaterial
          color={isHurt ? '#ef4444' : '#334155'}
          emissive={isHurt ? '#ef4444' : '#000000'}
          emissiveIntensity={isHurt ? 1.5 : 0}
          roughness={0.9}
        />
      </mesh>

      {/* Runic Energy Chest Core */}
      <mesh ref={coreRef} position={[0, 0.25, 0.34]}>
        <boxGeometry args={[0.22, 0.22, 0.06]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={2.5}
          roughness={0.2}
        />
      </mesh>

      {/* Broad Shoulders & Heavy Arms */}
      <group ref={leftArm} position={[-0.65, 0.45, 0]}>
        <mesh position={[0, -0.45, 0]}>
          <boxGeometry args={[0.32, 1.0, 0.35]} />
          <meshStandardMaterial color="#475569" roughness={0.9} />
        </mesh>
      </group>
      <group ref={rightArm} position={[0.65, 0.45, 0]}>
        <mesh position={[0, -0.45, 0]}>
          <boxGeometry args={[0.32, 1.0, 0.35]} />
          <meshStandardMaterial color="#475569" roughness={0.9} />
        </mesh>
      </group>

      {/* Pillar Legs */}
      <mesh position={[-0.26, -0.65, 0]}>
        <boxGeometry args={[0.34, 0.9, 0.4]} />
        <meshStandardMaterial color="#1e293b" roughness={0.95} />
      </mesh>
      <mesh position={[0.26, -0.65, 0]}>
        <boxGeometry args={[0.34, 0.9, 0.4]} />
        <meshStandardMaterial color="#1e293b" roughness={0.95} />
      </mesh>

      <OverheadHealthBar hp={monster.hp} maxHp={monster.maxHp} yOffset={1.4} name={monster.name} />
    </group>
  );
};

// --- Crystalline Sand Spider Component ---
const SpiderMob: React.FC<{ monster: Monster; now: number }> = ({ monster, now }) => {
  const groupRef = useRef<THREE.Group>(null);
  const isHurt = monster.hurtUntilTime > now;

  useFrame((state, delta) => {
    if (groupRef.current) {
      if (monster.state === 'dead') {
        groupRef.current.scale.lerp(new THREE.Vector3(0.001, 0.001, 0.001), delta * 12);
        return;
      }
      const hurtStagger = isHurt ? Math.sin(state.clock.elapsedTime * 45) * 0.1 : 0;
      groupRef.current.position.set(monster.x + hurtStagger, monster.elevation + 0.3, monster.y);

      if (monster.state === 'chase' || monster.state === 'patrol') {
        const wiggle = Math.sin(state.clock.elapsedTime * 20);
        groupRef.current.rotation.y = monster.rotation + wiggle * 0.1;
      } else {
        groupRef.current.rotation.y = monster.rotation;
      }
    }
  });

  return (
    <group
      ref={groupRef}
      position={[monster.x, monster.elevation + 0.3, monster.y]}
      rotation={[0, monster.rotation, 0]}
    >
      {/* Contact Shadow */}
      <mesh position={[0, -0.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.55, 12]} />
        <meshBasicMaterial color="#0f172a" transparent opacity={0.35} depthWrite={false} />
      </mesh>

      {/* Head / Cephalothorax */}
      <mesh position={[0, 0, 0.2]}>
        <boxGeometry args={[0.42, 0.3, 0.35]} />
        <meshStandardMaterial
          color={isHurt ? '#ef4444' : '#3f1a24'}
          emissive={isHurt ? '#ef4444' : '#000000'}
          emissiveIntensity={isHurt ? 1.5 : 0}
          roughness={0.7}
        />
      </mesh>

      {/* Red Eyes */}
      <mesh position={[-0.12, 0.08, 0.38]}>
        <boxGeometry args={[0.06, 0.06, 0.02]} />
        <meshBasicMaterial color="#f43f5e" />
      </mesh>
      <mesh position={[0.12, 0.08, 0.38]}>
        <boxGeometry args={[0.06, 0.06, 0.02]} />
        <meshBasicMaterial color="#f43f5e" />
      </mesh>

      {/* Abdomen */}
      <mesh position={[0, 0.08, -0.25]}>
        <boxGeometry args={[0.55, 0.45, 0.6]} />
        <meshStandardMaterial
          color={isHurt ? '#ef4444' : '#27121b'}
          emissive={isHurt ? '#ef4444' : '#000000'}
          emissiveIntensity={isHurt ? 1.5 : 0}
          roughness={0.6}
        />
      </mesh>

      {/* Legs (6 articulated spider limbs) */}
      {[-0.3, 0, 0.3].map((zOffset, idx) => (
        <group key={idx}>
          {/* Left leg */}
          <mesh position={[-0.45, -0.05, zOffset]} rotation={[0, 0, 0.4]}>
            <boxGeometry args={[0.45, 0.08, 0.08]} />
            <meshStandardMaterial color="#1a0b12" roughness={0.9} />
          </mesh>
          {/* Right leg */}
          <mesh position={[0.45, -0.05, zOffset]} rotation={[0, 0, -0.4]}>
            <boxGeometry args={[0.45, 0.08, 0.08]} />
            <meshStandardMaterial color="#1a0b12" roughness={0.9} />
          </mesh>
        </group>
      ))}

      <OverheadHealthBar hp={monster.hp} maxHp={monster.maxHp} yOffset={0.75} name={monster.name} />
    </group>
  );
};

// --- Cow Passive Mob ---
const CowMob: React.FC<{ monster: Monster; now: number }> = ({ monster, now }) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const legFL = useRef<THREE.Mesh>(null);
  const legFR = useRef<THREE.Mesh>(null);
  const legBL = useRef<THREE.Mesh>(null);
  const legBR = useRef<THREE.Mesh>(null);
  const isHurt = monster.hurtUntilTime > now;

  useFrame((state, delta) => {
    if (groupRef.current) {
      if (monster.state === 'dead') {
        groupRef.current.scale.lerp(new THREE.Vector3(0.001, 0.001, 0.001), delta * 14);
        return;
      }
      const hurtShake = isHurt ? Math.sin(state.clock.elapsedTime * 40) * 0.08 : 0;
      groupRef.current.position.set(monster.x + hurtShake, monster.elevation + 0.45, monster.y);
      groupRef.current.rotation.y = monster.rotation;

      const isMoving = monster.state === 'chase' || isHurt;
      const speedMult = isHurt ? 14 : 6;
      const walkCycle = Math.sin(state.clock.elapsedTime * speedMult);

      if (legFL.current && legFR.current && legBL.current && legBR.current) {
        legFL.current.rotation.x = walkCycle * 0.45;
        legFR.current.rotation.x = -walkCycle * 0.45;
        legBL.current.rotation.x = -walkCycle * 0.45;
        legBR.current.rotation.x = walkCycle * 0.45;
      }

      if (headRef.current) {
        // Grazing dip animation when not panicking
        const graze = isHurt ? -0.2 : Math.sin(state.clock.elapsedTime * 1.5) * 0.25 - 0.1;
        headRef.current.rotation.x = graze;
      }
    }
  });

  const hideColor = isHurt ? '#ef4444' : '#451a03';

  return (
    <group ref={groupRef} position={[monster.x, monster.elevation + 0.45, monster.y]}>
      {/* Body */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.7, 0.55, 0.95]} />
        <meshStandardMaterial color={hideColor} roughness={0.8} />
      </mesh>
      {/* White patches */}
      <mesh position={[0.22, 0.42, 0.1]}>
        <boxGeometry args={[0.28, 0.3, 0.38]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.8} />
      </mesh>
      <mesh position={[-0.22, 0.32, -0.2]}>
        <boxGeometry args={[0.28, 0.28, 0.32]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.8} />
      </mesh>
      {/* Udder */}
      <mesh position={[0, 0.1, -0.25]}>
        <boxGeometry args={[0.25, 0.12, 0.25]} />
        <meshStandardMaterial color="#fbcfe8" roughness={0.7} />
      </mesh>

      {/* Head with Horns & Snout */}
      <group ref={headRef} position={[0, 0.55, 0.52]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.42, 0.42, 0.42]} />
          <meshStandardMaterial color={hideColor} roughness={0.8} />
        </mesh>
        {/* White forehead patch */}
        <mesh position={[0, 0.1, 0.18]}>
          <boxGeometry args={[0.18, 0.2, 0.08]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.8} />
        </mesh>
        {/* Snout */}
        <mesh position={[0, -0.1, 0.22]}>
          <boxGeometry args={[0.3, 0.18, 0.16]} />
          <meshStandardMaterial color="#fbcfe8" roughness={0.6} />
        </mesh>
        {/* Nostrils */}
        <mesh position={[-0.07, -0.1, 0.31]}>
          <boxGeometry args={[0.04, 0.04, 0.02]} />
          <meshBasicMaterial color="#334155" />
        </mesh>
        <mesh position={[0.07, -0.1, 0.31]}>
          <boxGeometry args={[0.04, 0.04, 0.02]} />
          <meshBasicMaterial color="#334155" />
        </mesh>
        {/* Horns */}
        <mesh position={[-0.22, 0.22, -0.05]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.08, 0.16, 0.08]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.4} />
        </mesh>
        <mesh position={[0.22, 0.22, -0.05]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.08, 0.16, 0.08]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.4} />
        </mesh>
      </group>

      {/* 4 Legs */}
      <mesh ref={legFL} position={[-0.24, 0, 0.3]}>
        <boxGeometry args={[0.16, 0.42, 0.16]} />
        <meshStandardMaterial color="#292524" roughness={0.9} />
      </mesh>
      <mesh ref={legFR} position={[0.24, 0, 0.3]}>
        <boxGeometry args={[0.16, 0.42, 0.16]} />
        <meshStandardMaterial color="#292524" roughness={0.9} />
      </mesh>
      <mesh ref={legBL} position={[-0.24, 0, -0.3]}>
        <boxGeometry args={[0.16, 0.42, 0.16]} />
        <meshStandardMaterial color="#292524" roughness={0.9} />
      </mesh>
      <mesh ref={legBR} position={[0.24, 0, -0.3]}>
        <boxGeometry args={[0.16, 0.42, 0.16]} />
        <meshStandardMaterial color="#292524" roughness={0.9} />
      </mesh>

      <OverheadHealthBar hp={monster.hp} maxHp={monster.maxHp} yOffset={0.95} name={monster.name} />
    </group>
  );
};

// --- Sheep Passive Mob ---
const SheepMob: React.FC<{ monster: Monster; now: number }> = ({ monster, now }) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const legFL = useRef<THREE.Mesh>(null);
  const legFR = useRef<THREE.Mesh>(null);
  const legBL = useRef<THREE.Mesh>(null);
  const legBR = useRef<THREE.Mesh>(null);
  const isHurt = monster.hurtUntilTime > now;

  useFrame((state, delta) => {
    if (groupRef.current) {
      if (monster.state === 'dead') {
        groupRef.current.scale.lerp(new THREE.Vector3(0.001, 0.001, 0.001), delta * 14);
        return;
      }
      const hurtShake = isHurt ? Math.sin(state.clock.elapsedTime * 40) * 0.08 : 0;
      groupRef.current.position.set(monster.x + hurtShake, monster.elevation + 0.4, monster.y);
      groupRef.current.rotation.y = monster.rotation;

      const speedMult = isHurt ? 14 : 6;
      const walkCycle = Math.sin(state.clock.elapsedTime * speedMult);

      if (legFL.current && legFR.current && legBL.current && legBR.current) {
        legFL.current.rotation.x = walkCycle * 0.45;
        legFR.current.rotation.x = -walkCycle * 0.45;
        legBL.current.rotation.x = -walkCycle * 0.45;
        legBR.current.rotation.x = walkCycle * 0.45;
      }

      if (headRef.current) {
        const graze = isHurt ? -0.15 : Math.sin(state.clock.elapsedTime * 1.8) * 0.28 - 0.12;
        headRef.current.rotation.x = graze;
      }
    }
  });

  const woolColor = isHurt ? '#fca5a5' : '#f8fafc';

  return (
    <group ref={groupRef} position={[monster.x, monster.elevation + 0.4, monster.y]}>
      {/* Puffy Wool Coat */}
      <mesh position={[0, 0.32, 0]}>
        <boxGeometry args={[0.72, 0.58, 0.9]} />
        <meshStandardMaterial color={woolColor} roughness={1.0} />
      </mesh>

      {/* Head with Wool Cap */}
      <group ref={headRef} position={[0, 0.48, 0.5]}>
        {/* Face */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.32, 0.35, 0.38]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
        </mesh>
        {/* Wool tuft on top of head */}
        <mesh position={[0, 0.18, -0.05]}>
          <boxGeometry args={[0.34, 0.16, 0.32]} />
          <meshStandardMaterial color={woolColor} roughness={1.0} />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.13, 0.04, 0.18]}>
          <boxGeometry args={[0.05, 0.05, 0.04]} />
          <meshBasicMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0.13, 0.04, 0.18]}>
          <boxGeometry args={[0.05, 0.05, 0.04]} />
          <meshBasicMaterial color="#1e293b" />
        </mesh>
      </group>

      {/* Legs */}
      <mesh ref={legFL} position={[-0.22, 0, 0.28]}>
        <boxGeometry args={[0.14, 0.38, 0.14]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </mesh>
      <mesh ref={legFR} position={[0.22, 0, 0.28]}>
        <boxGeometry args={[0.14, 0.38, 0.14]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </mesh>
      <mesh ref={legBL} position={[-0.22, 0, -0.28]}>
        <boxGeometry args={[0.14, 0.38, 0.14]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </mesh>
      <mesh ref={legBR} position={[0.22, 0, -0.28]}>
        <boxGeometry args={[0.14, 0.38, 0.14]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </mesh>

      <OverheadHealthBar hp={monster.hp} maxHp={monster.maxHp} yOffset={0.88} name={monster.name} />
    </group>
  );
};

// --- Pig Passive Mob ---
const PigMob: React.FC<{ monster: Monster; now: number }> = ({ monster, now }) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const legFL = useRef<THREE.Mesh>(null);
  const legFR = useRef<THREE.Mesh>(null);
  const legBL = useRef<THREE.Mesh>(null);
  const legBR = useRef<THREE.Mesh>(null);
  const isHurt = monster.hurtUntilTime > now;

  useFrame((state, delta) => {
    if (groupRef.current) {
      if (monster.state === 'dead') {
        groupRef.current.scale.lerp(new THREE.Vector3(0.001, 0.001, 0.001), delta * 14);
        return;
      }
      const hurtShake = isHurt ? Math.sin(state.clock.elapsedTime * 40) * 0.08 : 0;
      groupRef.current.position.set(monster.x + hurtShake, monster.elevation + 0.36, monster.y);
      groupRef.current.rotation.y = monster.rotation;

      const speedMult = isHurt ? 16 : 8;
      const walkCycle = Math.sin(state.clock.elapsedTime * speedMult);

      if (legFL.current && legFR.current && legBL.current && legBR.current) {
        legFL.current.rotation.x = walkCycle * 0.5;
        legFR.current.rotation.x = -walkCycle * 0.5;
        legBL.current.rotation.x = -walkCycle * 0.5;
        legBR.current.rotation.x = walkCycle * 0.5;
      }

      if (headRef.current) {
        headRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 4) * 0.15;
      }
    }
  });

  const pigColor = isHurt ? '#ef4444' : '#f472b6';

  return (
    <group ref={groupRef} position={[monster.x, monster.elevation + 0.36, monster.y]}>
      {/* Body */}
      <mesh position={[0, 0.28, 0]}>
        <boxGeometry args={[0.55, 0.45, 0.75]} />
        <meshStandardMaterial color={pigColor} roughness={0.7} />
      </mesh>
      {/* Curly Tail */}
      <mesh position={[0, 0.36, -0.4]}>
        <boxGeometry args={[0.08, 0.1, 0.08]} />
        <meshStandardMaterial color="#db2777" />
      </mesh>

      {/* Head with Snout */}
      <group ref={headRef} position={[0, 0.4, 0.42]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.38, 0.36, 0.36]} />
          <meshStandardMaterial color={pigColor} roughness={0.7} />
        </mesh>
        {/* Snout */}
        <mesh position={[0, -0.06, 0.2]}>
          <boxGeometry args={[0.22, 0.14, 0.1]} />
          <meshStandardMaterial color="#f9a8d4" roughness={0.5} />
        </mesh>
        {/* Nostrils */}
        <mesh position={[-0.05, -0.06, 0.26]}>
          <boxGeometry args={[0.03, 0.03, 0.02]} />
          <meshBasicMaterial color="#9d174d" />
        </mesh>
        <mesh position={[0.05, -0.06, 0.26]}>
          <boxGeometry args={[0.03, 0.03, 0.02]} />
          <meshBasicMaterial color="#9d174d" />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.12, 0.06, 0.16]}>
          <boxGeometry args={[0.04, 0.04, 0.04]} />
          <meshBasicMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0.12, 0.06, 0.16]}>
          <boxGeometry args={[0.04, 0.04, 0.04]} />
          <meshBasicMaterial color="#1e293b" />
        </mesh>
      </group>

      {/* 4 Stubby Legs */}
      <mesh ref={legFL} position={[-0.18, 0, 0.24]}>
        <boxGeometry args={[0.14, 0.26, 0.14]} />
        <meshStandardMaterial color={pigColor} roughness={0.8} />
      </mesh>
      <mesh ref={legFR} position={[0.18, 0, 0.24]}>
        <boxGeometry args={[0.14, 0.26, 0.14]} />
        <meshStandardMaterial color={pigColor} roughness={0.8} />
      </mesh>
      <mesh ref={legBL} position={[-0.18, 0, -0.24]}>
        <boxGeometry args={[0.14, 0.26, 0.14]} />
        <meshStandardMaterial color={pigColor} roughness={0.8} />
      </mesh>
      <mesh ref={legBR} position={[0.18, 0, -0.24]}>
        <boxGeometry args={[0.14, 0.26, 0.14]} />
        <meshStandardMaterial color={pigColor} roughness={0.8} />
      </mesh>

      <OverheadHealthBar hp={monster.hp} maxHp={monster.maxHp} yOffset={0.8} name={monster.name} />
    </group>
  );
};

// --- Chicken Passive Mob ---
const ChickenMob: React.FC<{ monster: Monster; now: number }> = ({ monster, now }) => {
  const groupRef = useRef<THREE.Group>(null);
  const wingL = useRef<THREE.Mesh>(null);
  const wingR = useRef<THREE.Mesh>(null);
  const isHurt = monster.hurtUntilTime > now;

  useFrame((state, delta) => {
    if (groupRef.current) {
      if (monster.state === 'dead') {
        groupRef.current.scale.lerp(new THREE.Vector3(0.001, 0.001, 0.001), delta * 14);
        return;
      }
      const hurtShake = isHurt ? Math.sin(state.clock.elapsedTime * 45) * 0.06 : 0;
      const hop = Math.abs(Math.sin(state.clock.elapsedTime * (isHurt ? 14 : 7))) * 0.12;
      groupRef.current.position.set(monster.x + hurtShake, monster.elevation + 0.25 + hop, monster.y);
      groupRef.current.rotation.y = monster.rotation;

      // Wing flapping animation
      if (wingL.current && wingR.current) {
        const flap = Math.sin(state.clock.elapsedTime * (isHurt ? 22 : 10)) * 0.5;
        wingL.current.rotation.z = 0.2 + flap;
        wingR.current.rotation.z = -0.2 - flap;
      }
    }
  });

  const bodyColor = isHurt ? '#ef4444' : '#ffffff';

  return (
    <group ref={groupRef} position={[monster.x, monster.elevation + 0.25, monster.y]}>
      {/* Body */}
      <mesh position={[0, 0.16, 0]}>
        <boxGeometry args={[0.32, 0.28, 0.4]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} />
      </mesh>
      {/* Wings */}
      <mesh ref={wingL} position={[-0.18, 0.18, 0]}>
        <boxGeometry args={[0.06, 0.2, 0.26]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.7} />
      </mesh>
      <mesh ref={wingR} position={[0.18, 0.18, 0]}>
        <boxGeometry args={[0.06, 0.2, 0.26]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.7} />
      </mesh>

      {/* Head with Beak and Comb */}
      <group position={[0, 0.34, 0.18]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.2, 0.24, 0.22]} />
          <meshStandardMaterial color={bodyColor} roughness={0.7} />
        </mesh>
        {/* Yellow Beak */}
        <mesh position={[0, -0.02, 0.14]}>
          <boxGeometry args={[0.1, 0.08, 0.1]} />
          <meshStandardMaterial color="#eab308" roughness={0.5} />
        </mesh>
        {/* Red Wattle under beak */}
        <mesh position={[0, -0.1, 0.1]}>
          <boxGeometry args={[0.06, 0.1, 0.06]} />
          <meshStandardMaterial color="#dc2626" />
        </mesh>
        {/* Red Comb on top of head */}
        <mesh position={[0, 0.14, 0]}>
          <boxGeometry args={[0.06, 0.08, 0.16]} />
          <meshStandardMaterial color="#dc2626" />
        </mesh>
      </group>

      {/* Yellow Legs */}
      <mesh position={[-0.08, 0, 0]}>
        <boxGeometry args={[0.06, 0.2, 0.06]} />
        <meshStandardMaterial color="#eab308" />
      </mesh>
      <mesh position={[0.08, 0, 0]}>
        <boxGeometry args={[0.06, 0.2, 0.06]} />
        <meshStandardMaterial color="#eab308" />
      </mesh>

      <OverheadHealthBar hp={monster.hp} maxHp={monster.maxHp} yOffset={0.65} name={monster.name} />
    </group>
  );
};

// --- Villager Friendly NPC ---
const VillagerMob: React.FC<{ monster: Monster; now: number }> = ({ monster, now }) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      if (monster.state === 'dead') {
        groupRef.current.scale.lerp(new THREE.Vector3(0.001, 0.001, 0.001), delta * 14);
        return;
      }
      groupRef.current.position.set(monster.x, monster.elevation + 0.65, monster.y);
      groupRef.current.rotation.y = monster.rotation;

      if (headRef.current) {
        // Friendly conversational head tilt
        headRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 1.8) * 0.15;
        headRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 1.2) * 0.08;
      }
    }
  });

  const robeColor =
    monster.villagerRole === 'blacksmith'
      ? '#374151'
      : monster.villagerRole === 'librarian'
      ? '#ef4444'
      : '#78350f'; // Farmer default

  return (
    <group ref={groupRef} position={[monster.x, monster.elevation + 0.65, monster.y]}>
      {/* Robe Torso */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.5, 0.75, 0.35]} />
        <meshStandardMaterial color={robeColor} roughness={0.9} />
      </mesh>
      {/* Folded Arms Sleeve */}
      <mesh position={[0, 0.1, 0.2]}>
        <boxGeometry args={[0.54, 0.22, 0.18]} />
        <meshStandardMaterial color={robeColor} roughness={0.9} />
      </mesh>

      {/* Head with Characteristic Villager Nose */}
      <group ref={headRef} position={[0, 0.72, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.42, 0.5, 0.42]} />
          <meshStandardMaterial color="#fcd34d" roughness={0.8} />
        </mesh>
        {/* Big Nose */}
        <mesh position={[0, -0.06, 0.25]}>
          <boxGeometry args={[0.12, 0.22, 0.14]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.8} />
        </mesh>
        {/* Monobrow */}
        <mesh position={[0, 0.12, 0.22]}>
          <boxGeometry args={[0.3, 0.05, 0.04]} />
          <meshBasicMaterial color="#451a03" />
        </mesh>
        {/* Emerald Eyes */}
        <mesh position={[-0.1, 0.04, 0.22]}>
          <boxGeometry args={[0.06, 0.06, 0.03]} />
          <meshBasicMaterial color="#10b981" />
        </mesh>
        <mesh position={[0.1, 0.04, 0.22]}>
          <boxGeometry args={[0.06, 0.06, 0.03]} />
          <meshBasicMaterial color="#10b981" />
        </mesh>
        {/* Straw Hat for Farmer */}
        {monster.villagerRole === 'farmer' && (
          <mesh position={[0, 0.28, 0]}>
            <boxGeometry args={[0.62, 0.08, 0.62]} />
            <meshStandardMaterial color="#fef08a" roughness={0.9} />
          </mesh>
        )}
      </group>

      {/* Robe Skirt/Legs */}
      <mesh position={[0, -0.4, 0]}>
        <boxGeometry args={[0.46, 0.4, 0.32]} />
        <meshStandardMaterial color={robeColor} roughness={0.9} />
      </mesh>

      {/* Floating Emerald Badge / Trade Icon */}
      <group position={[0, 1.25, 0]}>
        <mesh rotation={[0, performance.now() * 0.002, 0]}>
          <octahedronGeometry args={[0.15]} />
          <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={1.5} />
        </mesh>
      </group>
    </group>
  );
};

// --- Wandering Trader NPC ---
const TraderMob: React.FC<{ monster: Monster; now: number }> = ({ monster, now }) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      if (monster.state === 'dead') {
        groupRef.current.scale.lerp(new THREE.Vector3(0.001, 0.001, 0.001), delta * 14);
        return;
      }
      groupRef.current.position.set(monster.x, monster.elevation + 0.65, monster.y);
      groupRef.current.rotation.y = monster.rotation;

      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.2;
      }
    }
  });

  return (
    <group ref={groupRef} position={[monster.x, monster.elevation + 0.65, monster.y]}>
      {/* Royal Blue Robe with Gold Trim */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.52, 0.75, 0.36]} />
        <meshStandardMaterial color="#1d4ed8" roughness={0.8} />
      </mesh>
      {/* Golden Sash */}
      <mesh position={[0, 0.05, 0.19]}>
        <boxGeometry args={[0.3, 0.1, 0.05]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Heavy Traveling Backpack with Lantern */}
      <group position={[0, 0.22, -0.28]}>
        <mesh>
          <boxGeometry args={[0.42, 0.52, 0.26]} />
          <meshStandardMaterial color="#78350f" roughness={0.9} />
        </mesh>
        {/* Bedroll on top */}
        <mesh position={[0, 0.32, 0]}>
          <boxGeometry args={[0.44, 0.14, 0.18]} />
          <meshStandardMaterial color="#dc2626" roughness={0.8} />
        </mesh>
        {/* Small Lantern */}
        <mesh position={[0.26, 0.1, 0]}>
          <boxGeometry args={[0.1, 0.16, 0.1]} />
          <meshStandardMaterial color="#fef08a" emissive="#eab308" emissiveIntensity={2} />
        </mesh>
      </group>

      {/* Head with Trader Cowl */}
      <group ref={headRef} position={[0, 0.72, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.42, 0.5, 0.42]} />
          <meshStandardMaterial color="#fcd34d" roughness={0.8} />
        </mesh>
        {/* Blue Hood / Cowl */}
        <mesh position={[0, 0.12, -0.04]}>
          <boxGeometry args={[0.48, 0.36, 0.46]} />
          <meshStandardMaterial color="#1e40af" roughness={0.8} />
        </mesh>
        {/* Big Nose */}
        <mesh position={[0, -0.06, 0.25]}>
          <boxGeometry args={[0.12, 0.22, 0.14]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.8} />
        </mesh>
        {/* Blue Eyes */}
        <mesh position={[-0.1, 0.04, 0.22]}>
          <boxGeometry args={[0.06, 0.06, 0.03]} />
          <meshBasicMaterial color="#0284c7" />
        </mesh>
        <mesh position={[0.1, 0.04, 0.22]}>
          <boxGeometry args={[0.06, 0.06, 0.03]} />
          <meshBasicMaterial color="#0284c7" />
        </mesh>
      </group>

      {/* Floating Sparkle / Gold Ring Indicator */}
      <group position={[0, 1.35, 0]}>
        <mesh rotation={[Math.PI / 4, performance.now() * 0.003, 0]}>
          <torusGeometry args={[0.16, 0.03, 8, 16]} />
          <meshStandardMaterial color="#facc15" emissive="#ca8a04" emissiveIntensity={2} />
        </mesh>
      </group>
    </group>
  );
};

// --- Monsters Scene Container ---
export const MonstersWorld: React.FC<{
  monsters: Monster[];
}> = ({ monsters }) => {
  const now = performance.now();

  return (
    <group>
      {monsters.map((mob) => {
        if (mob.state === 'dead') return null;

        if (mob.type === 'slime') {
          return <SlimeMob key={mob.id} monster={mob} now={now} />;
        }
        if (mob.type === 'skeleton') {
          return <SkeletonMob key={mob.id} monster={mob} now={now} />;
        }
        if (mob.type === 'golem') {
          return <GolemMob key={mob.id} monster={mob} now={now} />;
        }
        if (mob.type === 'spider') {
          return <SpiderMob key={mob.id} monster={mob} now={now} />;
        }
        if (mob.type === 'cow') {
          return <CowMob key={mob.id} monster={mob} now={now} />;
        }
        if (mob.type === 'sheep') {
          return <SheepMob key={mob.id} monster={mob} now={now} />;
        }
        if (mob.type === 'pig') {
          return <PigMob key={mob.id} monster={mob} now={now} />;
        }
        if (mob.type === 'chicken') {
          return <ChickenMob key={mob.id} monster={mob} now={now} />;
        }
        if (mob.type === 'villager') {
          return <VillagerMob key={mob.id} monster={mob} now={now} />;
        }
        if (mob.type === 'trader') {
          return <TraderMob key={mob.id} monster={mob} now={now} />;
        }
        return null;
      })}
    </group>
  );
};

// --- Single Projectile Item with Smooth 60fps Position Sync ---
const ProjectileItem: React.FC<{ p: Projectile }> = ({ p }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.set(p.x, p.z, p.y);
      if (p.type === 'arrow') {
        groupRef.current.rotation.set(
          0,
          Math.atan2(p.vx, p.vy),
          -Math.atan2(p.vz, Math.hypot(p.vx, p.vy))
        );
      } else if (p.type === 'magic') {
        groupRef.current.rotation.y += 0.08;
      }
    }
  });

  if (p.type === 'arrow') {
    return (
      <group
        ref={groupRef}
        position={[p.x, p.z, p.y]}
        rotation={[0, Math.atan2(p.vx, p.vy), -Math.atan2(p.vz, Math.hypot(p.vx, p.vy))]}
      >
        {/* Wooden shaft */}
        <mesh>
          <boxGeometry args={[0.06, 0.06, 0.7]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>
        {/* Iron Arrowhead */}
        <mesh position={[0, 0, 0.4]}>
          <boxGeometry args={[0.14, 0.14, 0.18]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.3} metalness={0.8} />
        </mesh>
        {/* Feather Fletching */}
        <mesh position={[0, 0, -0.32]}>
          <boxGeometry args={[0.18, 0.18, 0.12]} />
          <meshStandardMaterial color={p.color || '#eab308'} roughness={0.9} />
        </mesh>
      </group>
    );
  }

  if (p.type === 'magic') {
    return (
      <group ref={groupRef} position={[p.x, p.z, p.y]}>
        {/* Glowing core */}
        <mesh>
          <sphereGeometry args={[0.26, 12, 12]} />
          <meshStandardMaterial
            color="#22d3ee"
            emissive="#06b6d4"
            emissiveIntensity={3.5}
            roughness={0.1}
          />
        </mesh>
        {/* Orbiting celestial halo */}
        <mesh>
          <boxGeometry args={[0.38, 0.38, 0.38]} />
          <meshBasicMaterial color="#a5f3fc" wireframe />
        </mesh>
      </group>
    );
  }

  if (p.type === 'slash') {
    return (
      <group ref={groupRef} position={[p.x, p.z, p.y]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.6, 1.1, 16, 1, 0, Math.PI]} />
          <meshBasicMaterial color="#f8fafc" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      </group>
    );
  }

  return null;
};

// --- Projectiles Scene Container ---
export const ProjectilesWorld: React.FC<{
  projectiles: Projectile[];
}> = ({ projectiles }) => {
  return (
    <group>
      {projectiles.map((p) => (
        <ProjectileItem key={p.id} p={p} />
      ))}
    </group>
  );
};

// --- Loot Drops Scene Container ---
export const LootDropsWorld: React.FC<{
  lootDrops: LootDrop[];
}> = ({ lootDrops }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime;
      groupRef.current.children.forEach((child, i) => {
        child.rotation.y = t * 2.5 + i;
        child.position.y = (child.userData.baseY || 0) + Math.sin(t * 4 + i) * 0.12;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {lootDrops.map((drop) => {
        const baseY = drop.z + 0.35;
        return (
          <group
            key={drop.id}
            position={[drop.x, baseY, drop.y]}
            userData={{ baseY }}
          >
            {/* Ground Contact Shadow */}
            <mesh position={[0, -0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.22, 10]} />
              <meshBasicMaterial color="#0f172a" transparent opacity={0.3} depthWrite={false} />
            </mesh>

            {drop.type === 'xp' && (
              <mesh>
                <octahedronGeometry args={[0.22]} />
                <meshStandardMaterial
                  color="#22c55e"
                  emissive="#15803d"
                  emissiveIntensity={2.5}
                  roughness={0.2}
                />
              </mesh>
            )}

            {drop.type === 'gold' && (
              <mesh>
                <cylinderGeometry args={[0.18, 0.18, 0.08, 12]} />
                <meshStandardMaterial
                  color="#eab308"
                  emissive="#ca8a04"
                  emissiveIntensity={1.8}
                  roughness={0.3}
                  metalness={0.8}
                />
              </mesh>
            )}

            {drop.type === 'potion' && (
              <group>
                <mesh position={[0, 0, 0]}>
                  <boxGeometry args={[0.18, 0.24, 0.18]} />
                  <meshStandardMaterial
                    color="#ef4444"
                    emissive="#b91c1c"
                    emissiveIntensity={2}
                    roughness={0.2}
                  />
                </mesh>
                <mesh position={[0, 0.15, 0]}>
                  <boxGeometry args={[0.08, 0.08, 0.08]} />
                  <meshStandardMaterial color="#78350f" roughness={0.9} />
                </mesh>
              </group>
            )}

            {drop.type === 'shard' && (
              <mesh>
                <dodecahedronGeometry args={[0.2]} />
                <meshStandardMaterial
                  color="#a855f7"
                  emissive="#7e22ce"
                  emissiveIntensity={2}
                  roughness={0.2}
                />
              </mesh>
            )}

            {drop.type === 'wood' && (
              <group rotation={[0, 0, Math.PI / 4]}>
                {/* Wood Timber Log */}
                <mesh>
                  <cylinderGeometry args={[0.12, 0.12, 0.36, 8]} />
                  <meshStandardMaterial color="#854d0e" roughness={0.8} />
                </mesh>
                {/* Rings top and bottom */}
                <mesh position={[0, 0.181, 0]}>
                  <circleGeometry args={[0.1, 8]} />
                  <meshStandardMaterial color="#fef08a" roughness={0.9} />
                </mesh>
                <mesh position={[0, -0.181, 0]} rotation={[Math.PI, 0, 0]}>
                  <circleGeometry args={[0.1, 8]} />
                  <meshStandardMaterial color="#fef08a" roughness={0.9} />
                </mesh>
              </group>
            )}

            {drop.type === 'stone' && (
              <group>
                <mesh rotation={[0.4, 0.3, 0.2]}>
                  <dodecahedronGeometry args={[0.19]} />
                  <meshStandardMaterial color="#64748b" roughness={0.9} />
                </mesh>
              </group>
            )}

            {drop.type === 'iron' && (
              <group>
                <mesh rotation={[0.2, 0.4, 0]}>
                  <boxGeometry args={[0.28, 0.12, 0.16]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.25} />
                </mesh>
              </group>
            )}

            {drop.type === 'bone' && (
              <group rotation={[0, 0, 0.4]}>
                {/* Bone shaft */}
                <mesh>
                  <boxGeometry args={[0.07, 0.32, 0.07]} />
                  <meshStandardMaterial color="#f8fafc" roughness={0.7} />
                </mesh>
                {/* Bone knobbies top and bottom */}
                <mesh position={[-0.05, 0.16, 0]}>
                  <sphereGeometry args={[0.06, 6, 6]} />
                  <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
                </mesh>
                <mesh position={[0.05, 0.16, 0]}>
                  <sphereGeometry args={[0.06, 6, 6]} />
                  <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
                </mesh>
                <mesh position={[-0.05, -0.16, 0]}>
                  <sphereGeometry args={[0.06, 6, 6]} />
                  <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
                </mesh>
                <mesh position={[0.05, -0.16, 0]}>
                  <sphereGeometry args={[0.06, 6, 6]} />
                  <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
                </mesh>
              </group>
            )}

            {drop.type === 'silk' && (
              <group>
                <mesh>
                  <sphereGeometry args={[0.17, 8, 8]} />
                  <meshStandardMaterial
                    color="#e0f2fe"
                    emissive="#bae6fd"
                    emissiveIntensity={0.8}
                    roughness={0.9}
                  />
                </mesh>
              </group>
            )}

            {drop.type === 'crystal' && (
              <group>
                <mesh rotation={[0.3, 0.5, 0.2]}>
                  <octahedronGeometry args={[0.22, 0]} />
                  <meshStandardMaterial
                    color="#c084fc"
                    emissive="#9333ea"
                    emissiveIntensity={3.0}
                    roughness={0.1}
                  />
                </mesh>
              </group>
            )}

            {/* Minecraft Dungeons Emerald Gem */}
            {drop.type === 'emerald' && (
              <group rotation={[0.2, 0.6, 0.1]}>
                <mesh>
                  <octahedronGeometry args={[0.24, 0]} />
                  <meshStandardMaterial
                    color="#22c55e"
                    emissive="#15803d"
                    emissiveIntensity={3.5}
                    roughness={0.1}
                    metalness={0.2}
                  />
                </mesh>
              </group>
            )}

            {/* Quiver Arrows Bundle */}
            {drop.type === 'arrows' && (
              <group rotation={[0.6, 0.2, 0.4]}>
                <mesh position={[0, 0, 0]}>
                  <cylinderGeometry args={[0.03, 0.03, 0.4, 6]} />
                  <meshStandardMaterial color="#ca8a04" roughness={0.7} />
                </mesh>
                <mesh position={[0.04, 0, 0.04]}>
                  <cylinderGeometry args={[0.03, 0.03, 0.38, 6]} />
                  <meshStandardMaterial color="#ca8a04" roughness={0.7} />
                </mesh>
                <mesh position={[0, 0.18, 0]}>
                  <coneGeometry args={[0.07, 0.12, 4]} />
                  <meshStandardMaterial color="#f8fafc" roughness={0.3} />
                </mesh>
              </group>
            )}

            {/* Minecraft Dungeons Soul Wisp */}
            {drop.type === 'soul' && (
              <group>
                <mesh>
                  <sphereGeometry args={[0.2, 8, 8]} />
                  <meshStandardMaterial
                    color="#c084fc"
                    emissive="#a855f7"
                    emissiveIntensity={4.5}
                    transparent
                    opacity={0.85}
                  />
                </mesh>
              </group>
            )}

            {/* Mystery Gear Drop Chest/Cube */}
            {drop.type === 'gear' && (
              <group rotation={[0.2, 0.4, 0.1]}>
                <mesh>
                  <boxGeometry args={[0.32, 0.32, 0.32]} />
                  <meshStandardMaterial
                    color="#f59e0b"
                    emissive="#d97706"
                    emissiveIntensity={3.5}
                    metalness={0.6}
                    roughness={0.2}
                  />
                </mesh>
              </group>
            )}

            {/* Food (Porkchop) */}
            {drop.type === 'food' && (
              <group rotation={[0.4, 0.2, 0.5]}>
                <mesh>
                  <boxGeometry args={[0.26, 0.16, 0.12]} />
                  <meshStandardMaterial color="#b91c1c" roughness={0.6} />
                </mesh>
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
};
