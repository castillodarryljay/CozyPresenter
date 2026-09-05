import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import {
  Compass,
  Radio,
  Flame,
  Heart,
  BookOpen,
  Sparkles,
  Sun,
  Moon,
  RefreshCw,
  Settings,
  X,
  Volume2,
  VolumeX,
  Trophy,
  Zap,
  Mountain,
  TreePine,
  Droplets,
  Cloud,
  CheckCircle2,
  Search,
  Check,
  Share2,
  Copy,
  Layers,
  HelpCircle,
  Footprints
} from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box } from '@react-three/drei';
import * as THREE from 'three';
import confetti from 'canvas-confetti';

import {
  Position,
  TerrainType,
  Relic,
  WorldFeature,
  CompanionState,
  Quest,
  PlayerStats,
  MapSettings,
  CompanionType,
} from './types';
import {
  getTerrainHeight,
  VoxelTerrainMesh,
  WaterMesh,
  NatureInstances,
  VoxelClouds,
  WORLD_SCALE,
} from './terrain';
import { sounds } from './audio';
import { ALL_RELICS, INITIAL_QUESTS, generateChunkFeatures } from './gameData';
import { VoxelCompanion } from './companion';
import { WorldFeaturesManager } from './gameWorld';
import { PWAInstallButton } from './PWAInstallUI';

// Game Constants
const STORAGE_KEY = 'voxel_nomad_save_v1';
const ZOOM_DEFAULT = 14;

const INITIAL_SETTINGS: MapSettings = {
  backgroundColor: '#5C9E57',
  characterColor: '#3B82F6',
  terrainType: 'hills',
  terrainHeight: 1.0,
  hasTrees: true,
  hasWater: true,
  hasClouds: true,
  seed: 1337,
  renderDistance: 2, // 5x5 chunks
  soundEnabled: true,
  dayNightCycle: true,
  companionType: 'fox',
};

const INITIAL_STATS: PlayerStats = {
  level: 1,
  xp: 0,
  relicsFound: 0,
  obelisksLit: 0,
  stepsWalked: 0,
  secretsDug: 0,
};

// --- 3D Scene Components ---

// 3D Player Character with Minecraft Swing & Handheld Lantern
const Player3D: React.FC<{
  position: Position;
  color: string;
  settings: MapSettings;
  isNight: boolean;
}> = ({ position, color, settings, isNight }) => {
  const group = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);

  const initY = getTerrainHeight(position.x * WORLD_SCALE, position.y * WORLD_SCALE, settings);
  const prevPos = useRef(new THREE.Vector3(position.x * WORLD_SCALE, initY, position.y * WORLD_SCALE));

  useFrame((state, delta) => {
    if (group.current) {
      const targetX = position.x * WORLD_SCALE;
      const targetZ = position.y * WORLD_SCALE;

      const x = THREE.MathUtils.lerp(group.current.position.x, targetX, delta * 12);
      const z = THREE.MathUtils.lerp(group.current.position.z, targetZ, delta * 12);
      const groundY = getTerrainHeight(x, z, settings);
      const targetY = groundY + 0.75;
      const y = THREE.MathUtils.lerp(group.current.position.y, targetY, delta * 14);

      group.current.position.x = x;
      group.current.position.y = y;
      group.current.position.z = z;

      const vx = x - prevPos.current.x;
      const vz = z - prevPos.current.z;
      const speed = Math.sqrt(vx * vx + vz * vz);

      if (speed > 0.0001) {
        group.current.lookAt(x + vx, y, z + vz);
      }

      const isMoving = speed > 0.001;

      // Walking cycle
      if (leftLeg.current && rightLeg.current && leftArm.current && rightArm.current) {
        if (isMoving) {
          const t = state.clock.elapsedTime * 15;
          const swing = Math.sin(t);

          leftLeg.current.rotation.x = swing * 0.6;
          rightLeg.current.rotation.x = -swing * 0.6;

          leftArm.current.rotation.x = -swing * 0.6;
          rightArm.current.rotation.x = swing * 0.6;
        } else {
          leftLeg.current.rotation.x = THREE.MathUtils.lerp(leftLeg.current.rotation.x, 0, delta * 10);
          rightLeg.current.rotation.x = THREE.MathUtils.lerp(rightLeg.current.rotation.x, 0, delta * 10);
          leftArm.current.rotation.x = THREE.MathUtils.lerp(leftArm.current.rotation.x, 0, delta * 10);
          rightArm.current.rotation.x = THREE.MathUtils.lerp(rightArm.current.rotation.x, 0, delta * 10);
        }
      }

      prevPos.current.set(x, y, z);
    }
  });

  return (
    <group ref={group} position={[position.x * WORLD_SCALE, initY + 0.75, position.y * WORLD_SCALE]}>
      {/* Head */}
      <group position={[0, 0.75, 0]}>
        <Box args={[0.5, 0.5, 0.5]} castShadow>
          <meshStandardMaterial color="#FACC9A" roughness={1} />
        </Box>
        {/* Explorer Hat */}
        <Box position={[0, 0.28, 0]} args={[0.56, 0.1, 0.56]} castShadow>
          <meshStandardMaterial color="#5d4037" roughness={0.9} />
        </Box>
        <Box position={[0, 0.38, 0]} args={[0.38, 0.16, 0.38]} castShadow>
          <meshStandardMaterial color="#6d4c41" roughness={0.9} />
        </Box>
        {/* Eyes */}
        <Box position={[-0.1, 0, 0.26]} args={[0.08, 0.08, 0.05]}>
          <meshStandardMaterial color="white" />
        </Box>
        <Box position={[0.1, 0, 0.26]} args={[0.08, 0.08, 0.05]}>
          <meshStandardMaterial color="white" />
        </Box>
        <Box position={[-0.08, 0, 0.29]} args={[0.04, 0.04, 0.05]}>
          <meshStandardMaterial color="#4A4A4A" />
        </Box>
        <Box position={[0.12, 0, 0.29]} args={[0.04, 0.04, 0.05]}>
          <meshStandardMaterial color="#4A4A4A" />
        </Box>
      </group>

      {/* Torso */}
      <Box position={[0, 0.15, 0]} args={[0.5, 0.7, 0.25]} castShadow>
        <meshStandardMaterial color={color} roughness={1} />
      </Box>

      {/* Left Arm */}
      <group ref={leftArm} position={[-0.38, 0.45, 0]}>
        <Box position={[0, -0.3, 0]} args={[0.2, 0.7, 0.25]} castShadow>
          <meshStandardMaterial color={color} roughness={1} />
        </Box>
        <Box position={[0, -0.7, 0]} args={[0.2, 0.2, 0.25]}>
          <meshStandardMaterial color="#FACC9A" roughness={1} />
        </Box>
      </group>

      {/* Right Arm (Holds Nomad Lantern) */}
      <group ref={rightArm} position={[0.38, 0.45, 0]}>
        <Box position={[0, -0.3, 0]} args={[0.2, 0.7, 0.25]} castShadow>
          <meshStandardMaterial color={color} roughness={1} />
        </Box>
        <Box position={[0, -0.7, 0]} args={[0.2, 0.2, 0.25]}>
          <meshStandardMaterial color="#FACC9A" roughness={1} />
        </Box>

        {/* Handheld Voxel Lantern */}
        <group position={[0, -0.95, 0.2]}>
          <mesh position={[0, 0.15, 0]}>
            <boxGeometry args={[0.04, 0.15, 0.04]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.18, 0.24, 0.18]} />
            <meshStandardMaterial
              color={isNight ? '#ffea70' : '#444'}
              emissive={isNight ? '#ffea70' : '#000'}
              emissiveIntensity={isNight ? 2.5 : 0}
              roughness={0.2}
            />
          </mesh>
          {isNight && (
            <pointLight position={[0, 0, 0]} color="#ffe890" intensity={3.5} distance={10} castShadow />
          )}
        </group>
      </group>

      {/* Legs */}
      <group ref={leftLeg} position={[-0.13, -0.2, 0]}>
        <Box position={[0, -0.35, 0]} args={[0.22, 0.7, 0.25]} castShadow>
          <meshStandardMaterial color="#37305C" roughness={1} />
        </Box>
      </group>
      <group ref={rightLeg} position={[0.13, -0.2, 0]}>
        <Box position={[0, -0.35, 0]} args={[0.22, 0.7, 0.25]} castShadow>
          <meshStandardMaterial color="#37305C" roughness={1} />
        </Box>
      </group>
    </group>
  );
};

// Isometric Camera Rig
const CameraRig: React.FC<{
  target: Position;
  zoom: number;
  pan: { x: number; y: number };
  settings: MapSettings;
}> = ({ target, zoom, pan, settings }) => {
  useFrame((state, delta) => {
    if (isNaN(target.x) || isNaN(target.y) || isNaN(pan.x) || isNaN(pan.y)) return;

    const tX = target.x * WORLD_SCALE + pan.x;
    const tZ = target.y * WORLD_SCALE + pan.y;
    const tY = getTerrainHeight(tX, tZ, settings);

    const offsetH = zoom;
    const offsetV = zoom * 0.85;

    const desiredPos = new THREE.Vector3(tX, tY + offsetV, tZ + offsetH);
    state.camera.position.lerp(desiredPos, delta * 5);
    state.camera.lookAt(tX, tY, tZ);
  });
  return null;
};

// UI Button
const McButton = ({
  onClick,
  children,
  className = '',
  disabled = false,
  title,
}: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`mc-btn select-none active:translate-y-0.5 transition-transform disabled:opacity-50 disabled:pointer-events-none ${className}`}
    style={{ fontFamily: "'VT323', monospace" }}
  >
    {children}
  </button>
);

// Virtual Joystick for Mobile
const Joystick = ({ onMove }: { onMove: (x: number, y: number) => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);

  const updateJoystick = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDist = rect.width / 2 - 8;
    if (distance > maxDist) {
      dx = (dx / distance) * maxDist;
      dy = (dy / distance) * maxDist;
    }
    setKnobPos({ x: dx, y: dy });
    onMove(dx / maxDist, dy / maxDist);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (touchIdRef.current === null && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      touchIdRef.current = touch.identifier;
      updateJoystick(touch.clientX, touch.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (touchIdRef.current !== null) {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchIdRef.current) {
          updateJoystick(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
          break;
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (touchIdRef.current !== null) {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchIdRef.current) {
          touchIdRef.current = null;
          setKnobPos({ x: 0, y: 0 });
          onMove(0, 0);
          break;
        }
      }
    }
  };

  return (
    <div
      className="fixed bottom-3 left-3 sm:bottom-5 sm:left-5 z-40 w-20 h-20 sm:w-24 sm:h-24 md:hidden touch-none select-none pointer-events-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div
        ref={containerRef}
        className="w-full h-full bg-black/50 border-2 border-white/80 relative shadow-[2px_2px_0px_#000] flex items-center justify-center rounded-sm"
      >
        <div className="w-2 h-2 bg-white/20 pointer-events-none" />
        <div
          className="absolute w-8 h-8 bg-[#888] border-2 border-white shadow-md pointer-events-none"
          style={{
            left: '50%',
            top: '50%',
            transform: `translate(calc(-50% + ${knobPos.x}px), calc(-50% + ${knobPos.y}px))`,
          }}
        />
      </div>
    </div>
  );
};

// --- Main App Game Engine ---

export const App: React.FC = () => {
  // Game Settings & Progression
  const [settings, setSettings] = useState<MapSettings>(INITIAL_SETTINGS);
  const [stats, setStats] = useState<PlayerStats>(INITIAL_STATS);
  const [inventory, setInventory] = useState<Relic[]>([]);
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [unlockedRelicModal, setUnlockedRelicModal] = useState<Relic | null>(null);

  // Day / Night Cycle (0.0 to 1.0, 0.25 = noon, 0.75 = midnight)
  const [timeOfDay, setTimeOfDay] = useState<number>(0.2); // Starts in clear morning
  const isNight = timeOfDay > 0.55 && timeOfDay < 0.95;

  // Companion State
  const [companion, setCompanion] = useState<CompanionState>({
    type: 'fox',
    name: 'Rune',
    happiness: 85,
    mood: 'happy',
  });

  // World Features Cache & Active Features
  const [features, setFeatures] = useState<WorldFeature[]>([]);
  const generatedChunksRef = useRef<Set<string>>(new Set());
  const [activeCampfirePos, setActiveCampfirePos] = useState<Position | null>(null);

  // Sonar Pulse
  const [pulseRadius, setPulseRadius] = useState<number>(0);
  const [pulseActive, setPulseActive] = useState<boolean>(false);

  // Modals & Panels
  const [isJournalOpen, setIsJournalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'relics' | 'quests' | 'stats'>('relics');
  const [selectedRelicDetail, setSelectedRelicDetail] = useState<Relic | null>(null);

  // Floating Banner notification
  const [notification, setNotification] = useState<{ text: string; sub?: string } | null>(null);

  // Player Navigation & Movement
  const [charPos, setCharPos] = useState<Position>({ x: 0, y: 0 });
  const [targetPos, setTargetPos] = useState<Position>({ x: 0, y: 0 });
  const [cameraZoom, setCameraZoom] = useState<number>(ZOOM_DEFAULT);
  const [cameraPan, setCameraPan] = useState<Position>({ x: 0, y: 0 });

  const charPosRef = useRef<Position>({ x: 0, y: 0 });
  const targetPosRef = useRef<Position>({ x: 0, y: 0 });
  const inputVector = useRef({ x: 0, y: 0 });
  const keysPressed = useRef<Set<string>>(new Set());

  // Touch & Pointer interaction
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);
  const pointerDownWorld = useRef<{ x: number; y: number } | null>(null);
  const isDraggingMap = useRef(false);
  const lastCursorPos = useRef<{ x: number; y: number } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const lastPinchDist = useRef<number | null>(null);

  // Load Saved Game
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.stats) setStats(parsed.stats);
        if (parsed.inventory) setInventory(parsed.inventory);
        if (parsed.quests) setQuests(parsed.quests);
        if (parsed.settings) {
          setSettings(s => ({ ...s, ...parsed.settings }));
          sounds.enabled = parsed.settings.soundEnabled ?? true;
        }
        if (parsed.charPos) {
          setCharPos(parsed.charPos);
          charPosRef.current = parsed.charPos;
          targetPosRef.current = parsed.charPos;
        }
      }
    } catch (e) {
      console.error('Failed to load save', e);
    }
  }, []);

  // Auto-Save
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          stats,
          inventory,
          quests,
          settings,
          charPos,
        })
      );
    } catch (e) {
      // Ignore
    }
  }, [stats, inventory, quests, settings, charPos]);

  // Sync Audio Setting
  useEffect(() => {
    sounds.enabled = settings.soundEnabled ?? true;
  }, [settings.soundEnabled]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        triggerSonarPulse();
      } else if (e.key.toLowerCase() === 'e') {
        interactContextAction();
      } else if (e.key.toLowerCase() === 'f') {
        toggleCampfire();
      } else if (e.key.toLowerCase() === 'r' || e.key.toLowerCase() === 'c') {
        petCompanion();
      } else if (e.key.toLowerCase() === 'j') {
        setIsJournalOpen(prev => !prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [charPos, features]);

  // Day/Night Cycle Timer
  useEffect(() => {
    if (settings.dayNightCycle === false) return;
    const interval = setInterval(() => {
      setTimeOfDay(prev => (prev + 0.001) % 1.0);
    }, 400);
    return () => clearInterval(interval);
  }, [settings.dayNightCycle]);

  // Sonar Pulse Animation loop
  useEffect(() => {
    if (!pulseActive) return;
    let animId: number;
    const startTime = performance.now();

    const step = (time: number) => {
      const elapsed = (time - startTime) / 1000;
      const rad = elapsed * 32; // Expands outward
      if (rad <= 50) {
        setPulseRadius(rad);
        animId = requestAnimationFrame(step);
      } else {
        setPulseRadius(0);
        setPulseActive(false);
      }
    };
    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [pulseActive]);

  // Dynamic Chunk Features Generator
  useEffect(() => {
    const currentChunkX = Math.floor((charPos.x * WORLD_SCALE) / 24);
    const currentChunkZ = Math.floor((charPos.y * WORLD_SCALE) / 24);
    const renderDist = settings.renderDistance ?? 2;

    const newFeatures: WorldFeature[] = [];

    for (let cx = currentChunkX - renderDist; cx <= currentChunkX + renderDist; cx++) {
      for (let cz = currentChunkZ - renderDist; cz <= currentChunkZ + renderDist; cz++) {
        const key = `${cx}_${cz}`;
        if (!generatedChunksRef.current.has(key)) {
          generatedChunksRef.current.add(key);
          const chunkFeats = generateChunkFeatures(cx, cz, settings.seed, (wx, wz) =>
            getTerrainHeight(wx, wz, settings)
          );
          newFeatures.push(...chunkFeats);
        }
      }
    }

    if (newFeatures.length > 0) {
      setFeatures(prev => [...prev, ...newFeatures]);
    }
  }, [charPos, settings]);

  // Check Nearby Features for Companion and Compass
  const nearbyFeature = useMemo(() => {
    let closest: WorldFeature | null = null;
    let minDist = Infinity;

    features.forEach(f => {
      if (f.active) return; // already solved
      const dx = f.x - charPos.x;
      const dz = f.y - charPos.y;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d < minDist) {
        minDist = d;
        closest = f;
      }
    });

    return { feature: closest, dist: minDist };
  }, [features, charPos]);

  // Update Companion Alert
  useEffect(() => {
    if (nearbyFeature.feature && nearbyFeature.dist < 18) {
      setCompanion(prev => ({
        ...prev,
        mood: 'excited',
        detectedFeatureId: nearbyFeature.feature!.id,
      }));
    } else {
      setCompanion(prev => ({
        ...prev,
        mood: 'happy',
        detectedFeatureId: undefined,
      }));
    }
  }, [nearbyFeature]);

  // Main Movement Loop
  useEffect(() => {
    let frameId: number;
    let lastTime = performance.now();
    const moveSpeed = 4.2;

    const update = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (isJournalOpen || isSettingsOpen || unlockedRelicModal) {
        frameId = requestAnimationFrame(update);
        return;
      }

      let kx = 0;
      let ky = 0;
      const k = keysPressed.current;
      if (k.has('w') || k.has('arrowup')) ky -= 1;
      if (k.has('s') || k.has('arrowdown')) ky += 1;
      if (k.has('a') || k.has('arrowleft')) kx -= 1;
      if (k.has('d') || k.has('arrowright')) kx += 1;

      let dx = kx + inputVector.current.x;
      let dy = ky + inputVector.current.y;
      const mag = Math.sqrt(dx * dx + dy * dy);
      if (mag > 1) {
        dx /= mag;
        dy /= mag;
      }

      const hasInput = mag > 0.1;
      const currentPos = charPosRef.current;
      const currentTarget = targetPosRef.current;

      let nextX = currentPos.x;
      let nextY = currentPos.y;

      if (hasInput) {
        if (Math.abs(cameraPan.x) > 0.1 || Math.abs(cameraPan.y) > 0.1) {
          setCameraPan(p => ({ x: p.x * 0.9, y: p.y * 0.9 }));
        }

        const step = moveSpeed * dt * 50;
        nextX += dx * step;
        nextY += dy * step;

        charPosRef.current = { x: nextX, y: nextY };
        targetPosRef.current = { x: nextX, y: nextY };

        setCharPos({ x: nextX, y: nextY });
        setTargetPos({ x: nextX, y: nextY });

        // Update steps walked
        setStats(s => ({ ...s, stepsWalked: s.stepsWalked + 1 }));
        updateQuestProgress('quest_wanderlust', 1);
      } else {
        const distToTargetX = currentTarget.x - currentPos.x;
        const distToTargetY = currentTarget.y - currentPos.y;
        const dist = Math.sqrt(distToTargetX * distToTargetX + distToTargetY * distToTargetY);

        if (dist > 0.5) {
          const step = Math.min(dist, moveSpeed * dt * 50);
          nextX = currentPos.x + (distToTargetX / dist) * step;
          nextY = currentPos.y + (distToTargetY / dist) * step;

          charPosRef.current = { x: nextX, y: nextY };
          setCharPos({ x: nextX, y: nextY });

          setStats(s => ({ ...s, stepsWalked: s.stepsWalked + 1 }));
          updateQuestProgress('quest_wanderlust', 1);
        }
      }

      frameId = requestAnimationFrame(update);
    };

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [isJournalOpen, isSettingsOpen, unlockedRelicModal, cameraPan]);

  // Show Toast Notification
  const showToast = (text: string, sub?: string) => {
    setNotification({ text, sub });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Add XP and level up if threshold crossed
  const addXP = (amount: number) => {
    setStats(prev => {
      const newXP = prev.xp + amount;
      const nextLevelThreshold = prev.level * 150;
      if (newXP >= nextLevelThreshold) {
        sounds.playLevelUp();
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
        showToast(`🎉 Level Up! You are now Level ${prev.level + 1} Nomad!`);
        return {
          ...prev,
          level: prev.level + 1,
          xp: newXP - nextLevelThreshold,
        };
      }
      return { ...prev, xp: newXP };
    });
  };

  // Update Quest Progress helper
  const updateQuestProgress = (questId: string, amount: number) => {
    setQuests(prev =>
      prev.map(q => {
        if (q.id === questId && !q.completed) {
          const nextVal = q.progress + amount;
          if (nextVal >= q.target) {
            sounds.playLevelUp();
            addXP(q.xpReward);
            showToast(`🏆 Quest Completed: ${q.title}!`, `+${q.xpReward} XP awarded`);
            return { ...q, progress: q.target, completed: true };
          }
          return { ...q, progress: nextVal };
        }
        return q;
      })
    );
  };

  // Sonar Pulse Action
  const triggerSonarPulse = () => {
    sounds.playSonarPing();
    setPulseActive(true);
    updateQuestProgress('quest_sonar', 1);

    // Reveal nearby hidden features within 45m
    let foundCount = 0;
    setFeatures(prev =>
      prev.map(f => {
        const dx = f.x - charPos.x;
        const dz = f.y - charPos.y;
        const d = Math.sqrt(dx * dx + dz * dz);
        if (d < 45 && !f.discovered) {
          foundCount++;
          return { ...f, discovered: true };
        }
        return f;
      })
    );

    if (foundCount > 0) {
      showToast(`📡 Sonar echo pinged ${foundCount} ancient signal(s)!`);
    } else {
      showToast('📡 Sonar pulse sent... no new echoes in immediate range.');
    }
  };

  // Award Relic helper
  const awardRelic = (relicId?: string) => {
    const relicObj = ALL_RELICS.find(r => r.id === relicId) || ALL_RELICS[0];
    const alreadyFound = inventory.some(r => r.id === relicObj.id);

    const updatedRelic: Relic = {
      ...relicObj,
      foundAt: {
        x: Math.round(charPos.x),
        z: Math.round(charPos.y),
        date: new Date().toLocaleDateString(),
      },
    };

    if (!alreadyFound) {
      setInventory(prev => [...prev, updatedRelic]);
      setStats(s => ({ ...s, relicsFound: s.relicsFound + 1 }));
      setUnlockedRelicModal(updatedRelic);
      confetti({ particleCount: 75, spread: 80, origin: { y: 0.5 } });
      sounds.playRelicFound();
      addXP(100);
      updateQuestProgress('quest_first_relic', 1);
    } else {
      showToast(`✨ Found another ${relicObj.name}!`, '+25 Exploration XP');
      addXP(25);
    }
  };

  // Interact Feature (Chest, Obelisk, Buried Mound)
  const handleInteractFeature = (feature: WorldFeature) => {
    if (feature.active) return;

    if (feature.type === 'obelisk') {
      sounds.playObeliskIgnite();
      setFeatures(prev => prev.map(f => (f.id === feature.id ? { ...f, active: true, discovered: true } : f)));
      setStats(s => ({ ...s, obelisksLit: s.obelisksLit + 1 }));
      addXP(150);
      updateQuestProgress('quest_awaken_obelisk', 1);
      showToast('⚡ Ancient Monolith Awakened!', 'Ley lines reconnected with the stars');
      if (feature.relicId) awardRelic(feature.relicId);
    } else if (feature.type === 'chest') {
      sounds.playChestOpen();
      setFeatures(prev => prev.map(f => (f.id === feature.id ? { ...f, active: true, discovered: true } : f)));
      awardRelic(feature.relicId);
    } else if (feature.type === 'buried_mound') {
      sounds.playDig();
      setFeatures(prev => prev.map(f => (f.id === feature.id ? { ...f, active: true, discovered: true } : f)));
      setStats(s => ({ ...s, secretsDug: s.secretsDug + 1 }));
      awardRelic(feature.relicId);
    }
  };

  // Contextual Dig / Interact Button
  const interactContextAction = () => {
    if (nearbyFeature.feature && nearbyFeature.dist < 3.0) {
      handleInteractFeature(nearbyFeature.feature);
    } else {
      // General ground dig
      sounds.playDig();
      setStats(s => ({ ...s, secretsDug: s.secretsDug + 1 }));
      showToast('⛏️ Dug the earth...', 'Unearthed fossilized pebble and wild loam.');
      addXP(5);
    }
  };

  // Campfire Toggle
  const toggleCampfire = () => {
    sounds.playCampfireRest();
    if (activeCampfirePos) {
      setActiveCampfirePos(null);
      showToast('🏕️ Camp packed up. Ready to wander.');
    } else {
      setActiveCampfirePos({ x: charPos.x, y: charPos.y });
      // Warms companion, speeds time to morning if night
      setCompanion(prev => ({ ...prev, happiness: Math.min(100, prev.happiness + 20), mood: 'happy' }));
      if (isNight) {
        setTimeOfDay(0.2); // Dawn
        showToast('🏕️ Campfire pitched!', 'Rested until dawn. Companion is warmly rested.');
      } else {
        showToast('🏕️ Cozy Campfire lit!', 'Rested by the warm flames. Companion happiness +20%');
      }
    }
  };

  // Pet Companion
  const petCompanion = () => {
    sounds.playPetSound(settings.companionType ?? 'fox');
    setCompanion(prev => ({
      ...prev,
      happiness: Math.min(100, prev.happiness + 15),
      mood: 'excited',
    }));
    updateQuestProgress('quest_pet_love', 1);
    showToast(`❤️ Petted ${companion.name}!`, 'Companion loves your company!');
  };

  // Floor Pointer handlers for tap-to-move & drag-to-pan
  const handleFloorPointerDown = (e: any) => {
    e.stopPropagation();
    if (isJournalOpen || isSettingsOpen || unlockedRelicModal) return;

    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 1) {
      pointerDownPos.current = { x: e.clientX, y: e.clientY };
      pointerDownWorld.current = { x: e.point.x / WORLD_SCALE, y: e.point.z / WORLD_SCALE };
      isDraggingMap.current = false;
      lastCursorPos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleFloorPointerMove = (e: any) => {
    if (isJournalOpen || isSettingsOpen || unlockedRelicModal) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const points = Array.from(pointers.current.values());
      const p1 = points[0] as { x: number; y: number };
      const p2 = points[1] as { x: number; y: number };
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

      if (lastPinchDist.current !== null) {
        const delta = dist - lastPinchDist.current;
        setCameraZoom(prev => Math.max(6, Math.min(30, prev - delta * 0.05)));
      }
      lastPinchDist.current = dist;
      isDraggingMap.current = true;
      return;
    } else {
      lastPinchDist.current = null;
    }

    if (pointers.current.size === 1 && pointerDownPos.current) {
      const dist = Math.hypot(e.clientX - pointerDownPos.current.x, e.clientY - pointerDownPos.current.y);
      if (dist > 8) {
        isDraggingMap.current = true;
      }

      if (isDraggingMap.current) {
        const lastX = lastCursorPos.current?.x ?? e.clientX;
        const lastY = lastCursorPos.current?.y ?? e.clientY;

        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        const factor = (cameraZoom * 1.5) / window.innerHeight;

        setCameraPan(prev => ({
          x: prev.x - dx * factor * 2,
          y: prev.y - dy * factor * 2,
        }));
      }
    }
    lastCursorPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleFloorPointerUp = (e: any) => {
    pointers.current.delete(e.pointerId);

    if (pointers.current.size === 0) {
      if (!isDraggingMap.current && pointerDownWorld.current) {
        const { x, y } = pointerDownWorld.current;
        targetPosRef.current = { x, y };
        setTargetPos({ x, y });
      }

      pointerDownPos.current = null;
      pointerDownWorld.current = null;
      isDraggingMap.current = false;
      lastCursorPos.current = null;
      lastPinchDist.current = null;
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY * 0.01;
    setCameraZoom(prev => Math.max(6, Math.min(30, prev + delta)));
  };

  // Sky & Lighting colors based on Day/Night
  const skyColor = useMemo(() => {
    if (isNight) return '#0d1326'; // Deep midnight navy
    if (timeOfDay > 0.45 && timeOfDay <= 0.55) return '#e07a5f'; // Sunset crimson
    if (timeOfDay < 0.25) return '#f4a261'; // Sunrise amber
    if (settings.terrainType === 'desert') return '#dfc08f';
    if (settings.terrainType === 'mountains') return '#9ec7e8';
    return '#87ceeb'; // Day blue
  }, [isNight, timeOfDay, settings.terrainType]);

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-black select-none text-white font-['VT323']"
      onWheel={handleWheel}
    >
      {/* 3D Exploration World */}
      <Canvas shadows camera={{ fov: 40, far: 1000 }}>
        <color attach="background" args={[skyColor]} />
        <fog
          attach="fog"
          args={[
            skyColor,
            (settings.renderDistance ?? 2) * 18,
            (settings.renderDistance ?? 2) * 36 + 18,
          ]}
        />

        {/* Dynamic Sun & Moon Lighting */}
        <ambientLight intensity={isNight ? 0.25 : 0.75} />
        <directionalLight
          position={isNight ? [-40, 60, -40] : [50, 80, 50]}
          intensity={isNight ? 0.4 : 1.3}
          color={isNight ? '#8bb4e8' : '#fff5eb'}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-60}
          shadow-camera-right={60}
          shadow-camera-top={60}
          shadow-camera-bottom={-60}
        />

        <Suspense fallback={null}>
          <CameraRig target={charPos} zoom={cameraZoom} pan={cameraPan} settings={settings} />

          {/* Infinite Voxel Terrain with Solid Watertight Normals */}
          <VoxelTerrainMesh
            settings={settings}
            playerPos={charPos}
            onPointerDown={handleFloorPointerDown}
            onPointerUp={handleFloorPointerUp}
            onPointerMove={handleFloorPointerMove}
          />

          {/* Infinite Procedural Water */}
          <WaterMesh
            playerPos={charPos}
            settings={settings}
            visible={settings.hasWater !== false && settings.terrainType !== 'flat'}
          />

          {/* Instanced Nature (Trees, Rocks, Wildflowers, Reeds) */}
          <NatureInstances
            settings={settings}
            blackboards={[]}
            playerPos={charPos}
          />

          {/* Animated Voxel Player */}
          <Player3D
            position={charPos}
            color={settings.characterColor}
            settings={settings}
            isNight={isNight}
          />

          {/* Voxel Faithful Companion */}
          <VoxelCompanion
            playerPos={charPos}
            playerElevation={getTerrainHeight(charPos.x * WORLD_SCALE, charPos.y * WORLD_SCALE, settings)}
            type={settings.companionType ?? 'fox'}
            mood={companion.mood}
            nearbyFeaturePos={
              nearbyFeature.feature && nearbyFeature.dist < 20
                ? { x: nearbyFeature.feature.x, y: nearbyFeature.feature.y }
                : null
            }
            getElevation={(wx, wz) => getTerrainHeight(wx, wz, settings)}
          />

          {/* World Objects: Obelisks, Chests, Relic Mounds, Campfire, Sonar Pulse */}
          <WorldFeaturesManager
            features={features}
            onInteractFeature={handleInteractFeature}
            playerPos={charPos}
            activeCampfirePos={activeCampfirePos}
            getElevation={(wx, wz) => getTerrainHeight(wx, wz, settings)}
            pulseRadius={pulseRadius}
          />

          {/* Minecraft Clouds */}
          <VoxelClouds playerPos={charPos} visible={settings.hasClouds !== false} />
        </Suspense>
      </Canvas>

      {/* --- UI HUD LAYER --- */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Virtual Joystick for Mobile (Bottom Left) */}
        {!isJournalOpen && !isSettingsOpen && !unlockedRelicModal && (
          <Joystick onMove={(x, y) => { inputVector.current = { x, y }; }} />
        )}

        {/* Top Responsive Navigation & Compass Bar */}
        <header className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 flex justify-between items-center pointer-events-none z-30 gap-2">
          {/* Coordinates & Level Badge */}
          <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 flex-shrink min-w-0">
            {/* Level Pill */}
            <div className="mc-panel px-2 sm:px-3 py-1 bg-[#d4af37] text-black font-bold text-xs sm:text-base flex items-center gap-1 shadow-md border-2 border-[#fff8a0] whitespace-nowrap">
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black flex-shrink-0" />
              <span>Lv.{stats.level} Nomad</span>
            </div>

            {/* Coordinates */}
            <div className="mc-panel px-2 sm:px-2.5 py-1 bg-[#c6c6c6] text-black font-bold text-xs sm:text-base flex items-center gap-1 sm:gap-1.5 shadow-md whitespace-nowrap">
              <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2d5a27] flex-shrink-0" />
              <span className="font-mono">X:{Math.round(charPos.x)} Z:{Math.round(charPos.y)}</span>
            </div>

            {/* Nearest Secret Compass Radar */}
            {nearbyFeature.feature && (
              <div
                className={`mc-panel px-2 py-0.5 sm:py-1 text-xs sm:text-sm flex items-center gap-1 shadow-md whitespace-nowrap ${
                  nearbyFeature.dist < 8
                    ? 'bg-[#ffe066] text-black border-[#ffff99] animate-pulse font-bold'
                    : 'bg-[#555] text-white border-[#777]'
                }`}
                title="Nearest ancient structure or buried relic"
              >
                <Radio className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                <span>
                  {nearbyFeature.feature.type === 'obelisk'
                    ? 'Spire'
                    : nearbyFeature.feature.type === 'chest'
                    ? 'Chest'
                    : 'Relic'}{' '}
                  {Math.round(nearbyFeature.dist)}m
                </span>
              </div>
            )}

            <PWAInstallButton variant="hud" />
          </div>

          {/* Top Right: Day/Night, Journal, Settings */}
          <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Time of Day Indicator */}
            <div className="mc-panel px-2 py-1 bg-[#444] text-white flex items-center gap-1 text-xs sm:text-sm border-2">
              {isNight ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#9ec7e8]" />
                  <span className="hidden sm:inline">Night</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-[#ffd700]" />
                  <span className="hidden sm:inline">Day</span>
                </>
              )}
            </div>

            {/* Journal / Compendium Button */}
            <McButton
              onClick={() => setIsJournalOpen(true)}
              className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-base bg-[#4f46e5]! border-[#818cf8]! text-white flex items-center gap-1 sm:gap-1.5 shadow-md"
              title="Open Explorer Journal (J)"
            >
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Journal</span>
              <span className="bg-white/30 text-white rounded px-1 text-[10px] sm:text-xs">
                {inventory.length}
              </span>
            </McButton>

            {/* Game Settings */}
            <McButton
              onClick={() => setIsSettingsOpen(true)}
              className="px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs sm:text-base flex items-center gap-1"
              title="Settings"
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            </McButton>
          </div>
        </header>

        {/* Floating Toast Notification */}
        {notification && (
          <div className="fixed top-14 sm:top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-auto max-w-[90vw] animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="mc-panel px-4 py-2 bg-[#2d3748] text-white border-2 border-[#ffd700] shadow-[0_4px_12px_rgba(0,0,0,0.5)] flex flex-col items-center text-center">
              <span className="text-base sm:text-xl font-bold text-[#ffd700]">{notification.text}</span>
              {notification.sub && (
                <span className="text-xs sm:text-sm text-gray-300 font-mono">{notification.sub}</span>
              )}
            </div>
          </div>
        )}

        {/* Action Hotbar (Bottom Center / Right) */}
        <div className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-40 pointer-events-auto flex items-center gap-1.5 sm:gap-2">
          {/* Sonar Scan Button */}
          <McButton
            onClick={triggerSonarPulse}
            className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-lg bg-[#0ea5e9]! border-[#38bdf8]! text-white flex items-center gap-1 shadow-lg"
            title="Send Sonar Pulse Echo (Space)"
          >
            <Radio className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Pulse</span>
          </McButton>

          {/* Dig / Interact Button */}
          <McButton
            onClick={interactContextAction}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-lg text-white flex items-center gap-1 shadow-lg ${
              nearbyFeature.dist < 3.0
                ? 'bg-[#16a34a]! border-[#4ade80]! animate-bounce'
                : 'bg-[#b45309]! border-[#f59e0b]!'
            }`}
            title="Dig Ground or Open Treasure (E)"
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>
              {nearbyFeature.dist < 3.0
                ? nearbyFeature.feature?.type === 'obelisk'
                  ? 'Awaken'
                  : 'Open'
                : 'Dig'}
            </span>
          </McButton>

          {/* Campfire Button */}
          <McButton
            onClick={toggleCampfire}
            className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-base text-white flex items-center gap-1 shadow-md ${
              activeCampfirePos ? 'bg-[#ea580c]! border-[#fdba74]!' : 'bg-[#4b5563]!'
            }`}
            title="Pitch or pack Campfire (F)"
          >
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#ffedd5]" />
            <span className="hidden sm:inline">Camp</span>
          </McButton>

          {/* Pet Whistle Button */}
          <McButton
            onClick={petCompanion}
            className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-base bg-[#db2777]! border-[#f472b6]! text-white flex items-center gap-1 shadow-md"
            title="Whistle & Pet Companion (R)"
          >
            <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#ffe4e6]" />
            <span className="hidden sm:inline">Pet</span>
          </McButton>
        </div>

        {/* Desktop Controls Hint (Center Bottom) */}
        <div className="hidden md:flex absolute bottom-5 left-1/2 -translate-x-1/2 mc-panel px-4 py-1 items-center gap-4 pointer-events-auto text-black shadow-lg text-xs sm:text-sm font-bold whitespace-nowrap z-20">
          <div className="flex items-center gap-1.5">
            <Footprints className="w-4 h-4 text-[#2d5a27]" />
            <span>[WASD] MOVE</span>
          </div>
          <div className="w-px h-3 bg-gray-500" />
          <div className="flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-[#0284c7]" />
            <span>[SPACE] SONAR</span>
          </div>
          <div className="w-px h-3 bg-gray-500" />
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#b45309]" />
            <span>[E] DIG/ACT</span>
          </div>
          <div className="w-px h-3 bg-gray-500" />
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-[#ea580c]" />
            <span>[F] CAMP</span>
          </div>
        </div>
      </div>

      {/* --- MODALS & PANELS --- */}

      {/* 1. Explorer Journal & Compendium Modal */}
      {isJournalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 pointer-events-auto bg-black/80 backdrop-blur-xs"
          onClick={() => setIsJournalOpen(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] mc-panel p-4 sm:p-6 bg-[#c6c6c6]! border-4! border-white! shadow-[0_0_0_4px_black] flex flex-col gap-4 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b-2 border-black/20 pb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-[#2d5a27]" />
                <h2 className="text-2xl sm:text-3xl text-black">Explorer's Compendium</h2>
              </div>
              <button
                onClick={() => setIsJournalOpen(false)}
                className="mc-btn w-8 h-8 flex items-center justify-center"
              >
                <X />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-[#888] pb-1">
              {[
                { id: 'relics', label: `Relics (${inventory.length}/${ALL_RELICS.length})` },
                { id: 'quests', label: 'Quests' },
                { id: 'stats', label: 'Stats' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`mc-btn px-3 py-1 text-base sm:text-xl ${
                    activeTab === tab.id ? 'bg-[#55aa55]! text-white border-[#88ff88]!' : ''
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Relics Collection Grid */}
            {activeTab === 'relics' && (
              <div className="overflow-y-auto flex-1 pr-1 space-y-4">
                <p className="text-sm sm:text-base text-[#333]">
                  Ancient relics unearthed from ruins, chests, and mountain peaks. Tap a relic to read its forgotten lore.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {ALL_RELICS.map(r => {
                    const found = inventory.find(item => item.id === r.id);
                    return (
                      <div
                        key={r.id}
                        onClick={() => setSelectedRelicDetail(found ? found : r)}
                        className={`p-2.5 sm:p-3 border-2 cursor-pointer transition-transform hover:scale-102 flex flex-col items-center text-center ${
                          found
                            ? 'bg-[#dedede] border-[#333] shadow-sm'
                            : 'bg-[#9e9e9e] border-[#777] opacity-60'
                        }`}
                      >
                        <span className="text-3xl sm:text-4xl mb-1">{found ? r.icon : '❓'}</span>
                        <span className="text-base sm:text-lg font-bold text-black truncate w-full">
                          {found ? r.name : 'Unknown Relic'}
                        </span>
                        <span
                          className={`text-xs uppercase px-1.5 py-0.2 rounded mt-1 ${
                            r.rarity === 'legendary'
                              ? 'bg-[#ffd700] text-black font-bold'
                              : r.rarity === 'epic'
                              ? 'bg-[#a855f7] text-white'
                              : r.rarity === 'rare'
                              ? 'bg-[#3b82f6] text-white'
                              : 'bg-[#6b7280] text-white'
                          }`}
                        >
                          {r.rarity}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 2: Quests */}
            {activeTab === 'quests' && (
              <div className="overflow-y-auto flex-1 pr-1 space-y-3">
                {quests.map(q => (
                  <div
                    key={q.id}
                    className={`p-3 border-2 ${
                      q.completed
                        ? 'bg-[#d1fae5] border-[#10b981]'
                        : 'bg-[#dedede] border-[#555]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-lg sm:text-xl font-bold text-black flex items-center gap-1.5">
                        {q.completed ? <CheckCircle2 className="w-5 h-5 text-[#059669]" /> : '📍'}
                        {q.title}
                      </span>
                      <span className="text-xs sm:text-sm font-mono bg-[#ffd700] text-black px-1.5 py-0.5 border border-[#c69214]">
                        +{q.xpReward} XP
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-[#333] mb-2">{q.description}</p>
                    <div className="w-full bg-[#bbb] h-3 border border-[#444] overflow-hidden">
                      <div
                        className="bg-[#22c55e] h-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (q.progress / q.target) * 100)}%` }}
                      />
                    </div>
                    <div className="text-right text-xs font-mono text-[#333] mt-1">
                      {q.progress} / {q.target} {q.completed && '(Done!)'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 3: Explorer Stats */}
            {activeTab === 'stats' && (
              <div className="overflow-y-auto flex-1 pr-1 space-y-3 text-black">
                <div className="bg-[#dedede] p-3 border-2 border-[#555] space-y-2">
                  <h3 className="text-xl font-bold border-b border-[#888] pb-1">Wanderer Record</h3>
                  <div className="grid grid-cols-2 gap-2 text-base sm:text-lg">
                    <div>
                      Level: <span className="font-bold">{stats.level}</span>
                    </div>
                    <div>
                      Experience: <span className="font-bold">{stats.xp} XP</span>
                    </div>
                    <div>
                      Relics Unearthed:{' '}
                      <span className="font-bold">
                        {stats.relicsFound} / {ALL_RELICS.length}
                      </span>
                    </div>
                    <div>
                      Monoliths Awakened:{' '}
                      <span className="font-bold text-[#0284c7]">{stats.obelisksLit}</span>
                    </div>
                    <div>
                      Paces Explored:{' '}
                      <span className="font-bold">{stats.stepsWalked}</span>
                    </div>
                    <div>
                      Secrets Dug: <span className="font-bold">{stats.secretsDug}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#dedede] p-3 border-2 border-[#555] space-y-1">
                  <h3 className="text-xl font-bold border-b border-[#888] pb-1">Nomad Companion</h3>
                  <div className="flex justify-between items-center text-base sm:text-lg">
                    <span>Name: {companion.name} ({settings.companionType ?? 'fox'})</span>
                    <span className="text-[#db2777] font-bold">Happiness: {companion.happiness}%</span>
                  </div>
                  <p className="text-xs text-[#555]">
                    Keep your companion happy by petting them and resting at campfires. Happy companions sniff out buried treasures from farther away!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Unlocked Relic Discovery Modal (With Confetti celebration) */}
      {unlockedRelicModal && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 pointer-events-auto bg-black/90 animate-in fade-in"
          onClick={() => setUnlockedRelicModal(null)}
        >
          <div
            className="w-full max-w-md mc-panel p-6 bg-[#dedede]! border-4! border-[#ffd700]! shadow-[0_0_0_4px_black] flex flex-col items-center text-center gap-3 relative"
            onClick={e => e.stopPropagation()}
          >
            <span className="text-6xl animate-bounce">{unlockedRelicModal.icon}</span>
            <span className="text-xs uppercase font-bold px-2 py-0.5 bg-[#ffd700] text-black">
              New {unlockedRelicModal.rarity} Relic Discovered!
            </span>
            <h2 className="text-3xl text-black font-bold">{unlockedRelicModal.name}</h2>
            <p className="text-lg text-black font-mono leading-tight bg-white/70 p-3 border border-black/20">
              "{unlockedRelicModal.description}"
            </p>
            <p className="text-sm text-[#444] italic">
              {unlockedRelicModal.lore}
            </p>
            <div className="text-xs font-mono text-[#555] mt-1">
              Recorded into Explorer Journal (+100 XP)
            </div>
            <McButton
              onClick={() => setUnlockedRelicModal(null)}
              className="mt-2 px-6 py-1.5 text-xl bg-[#55aa55]! text-white border-[#88ff88]!"
            >
              Collect Relic
            </McButton>
          </div>
        </div>
      )}

      {/* 3. Single Relic Detail View */}
      {selectedRelicDetail && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 pointer-events-auto bg-black/80"
          onClick={() => setSelectedRelicDetail(null)}
        >
          <div
            className="w-full max-w-sm mc-panel p-5 bg-[#dedede]! border-4! border-white! shadow-[0_0_0_4px_black] flex flex-col items-center text-center gap-2"
            onClick={e => e.stopPropagation()}
          >
            <span className="text-5xl">{selectedRelicDetail.icon}</span>
            <h3 className="text-2xl text-black font-bold">{selectedRelicDetail.name}</h3>
            <span className="text-xs uppercase px-2 py-0.5 bg-[#333] text-white">
              {selectedRelicDetail.rarity} • {selectedRelicDetail.biome}
            </span>
            <p className="text-base text-black bg-white/70 p-2.5 border border-black/20 text-left w-full mt-2 font-mono">
              {selectedRelicDetail.description}
            </p>
            <p className="text-xs text-[#555] italic text-left w-full">
              {selectedRelicDetail.lore}
            </p>
            {selectedRelicDetail.foundAt && (
              <div className="text-xs font-mono text-[#444] w-full text-left pt-1 border-t border-[#aaa]">
                Unearthed at X: {selectedRelicDetail.foundAt.x}, Z: {selectedRelicDetail.foundAt.z} on{' '}
                {selectedRelicDetail.foundAt.date}
              </div>
            )}
            <McButton onClick={() => setSelectedRelicDetail(null)} className="w-full mt-2 py-1 text-lg">
              Close
            </McButton>
          </div>
        </div>
      )}

      {/* 4. Game Settings Modal */}
      {isSettingsOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 pointer-events-auto bg-black/75 backdrop-blur-xs"
          onClick={() => setIsSettingsOpen(false)}
        >
          <div
            className="w-full max-w-md max-h-[92vh] overflow-y-auto mc-panel p-4 sm:p-6 bg-[#c6c6c6]! border-4! border-white! shadow-[0_0_0_4px_black] flex flex-col gap-4 text-black"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b-2 border-black/20 pb-2">
              <h2 className="text-2xl sm:text-3xl text-black flex items-center gap-2">
                <Settings className="w-6 h-6" /> Game Settings
              </h2>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="mc-btn w-8 h-8 flex items-center justify-center"
              >
                <X />
              </button>
            </div>

            {/* Audio Toggle */}
            <div className="bg-[#dedede] p-3 border-2 border-[#555] flex justify-between items-center">
              <div className="flex items-center gap-2 text-lg sm:text-xl">
                {settings.soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-[#2d5a27]" />
                ) : (
                  <VolumeX className="w-5 h-5 text-[#c53030]" />
                )}
                <span>Sound FX</span>
              </div>
              <McButton
                onClick={() =>
                  setSettings(s => ({ ...s, soundEnabled: !s.soundEnabled }))
                }
                className={`px-3 py-1 text-base ${
                  settings.soundEnabled !== false ? 'bg-[#55aa55]! text-white' : 'opacity-60'
                }`}
              >
                {settings.soundEnabled !== false ? 'ENABLED' : 'MUTED'}
              </McButton>
            </div>

            {/* Companion Choice */}
            <div className="bg-[#dedede] p-3 border-2 border-[#555] space-y-2">
              <span className="text-lg font-bold block">Nomad Companion</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'fox', label: '🦊 Fox' },
                  { id: 'dog', label: '🐶 Dog' },
                  { id: 'capybara', label: '🦫 Capybara' },
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() =>
                      setSettings(s => ({ ...s, companionType: p.id as CompanionType }))
                    }
                    className={`mc-btn text-base py-1.5 text-center ${
                      (settings.companionType ?? 'fox') === p.id
                        ? 'bg-[#55aa55]! text-white border-[#88ff88]!'
                        : ''
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Biome Presets */}
            <div className="bg-[#dedede] p-3 border-2 border-[#555] space-y-2">
              <span className="text-lg font-bold block">Biome Presets</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'hills', label: 'Rolling Hills' },
                  { id: 'mountains', label: 'Mountain Peaks' },
                  { id: 'plains', label: 'Flat Plains' },
                  { id: 'desert', label: 'Desert Dunes' },
                ].map(b => (
                  <button
                    key={b.id}
                    onClick={() =>
                      setSettings(s => ({ ...s, terrainType: b.id as TerrainType }))
                    }
                    className={`mc-btn text-sm py-1.5 ${
                      settings.terrainType === b.id ? 'bg-[#55aa55]! text-white border-[#88ff88]!' : ''
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Day/Night Cycle Toggle */}
            <div className="bg-[#dedede] p-3 border-2 border-[#555] flex justify-between items-center">
              <span className="text-lg font-bold">Day & Night Cycle</span>
              <McButton
                onClick={() =>
                  setSettings(s => ({ ...s, dayNightCycle: !s.dayNightCycle }))
                }
                className={`px-3 py-1 text-base ${
                  settings.dayNightCycle !== false ? 'bg-[#55aa55]! text-white' : 'opacity-60'
                }`}
              >
                {settings.dayNightCycle !== false ? 'DYNAMIC' : 'FROZEN'}
              </McButton>
            </div>

            {/* Render Distance */}
            <div className="bg-[#dedede] p-3 border-2 border-[#555] space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">Infinite Render Chunks</span>
                <span className="text-xs font-mono text-[#444]">
                  {settings.renderDistance === 1
                    ? '3x3 (Fast)'
                    : settings.renderDistance === 3
                    ? '7x7 (Far)'
                    : '5x5 (Balanced)'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { d: 1, l: 'Fast (3x3)' },
                  { d: 2, l: 'Balanced' },
                  { d: 3, l: 'Far (7x7)' },
                ].map(opt => (
                  <button
                    key={opt.d}
                    onClick={() => setSettings(s => ({ ...s, renderDistance: opt.d }))}
                    className={`mc-btn text-xs py-1 ${
                      (settings.renderDistance ?? 2) === opt.d
                        ? 'bg-[#55aa55]! text-white border-[#88ff88]!'
                        : ''
                    }`}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset / Warp to Origin */}
            <div className="pt-1 flex gap-2">
              <McButton
                onClick={() => {
                  charPosRef.current = { x: 0, y: 0 };
                  targetPosRef.current = { x: 0, y: 0 };
                  setCharPos({ x: 0, y: 0 });
                  setTargetPos({ x: 0, y: 0 });
                  setCameraPan({ x: 0, y: 0 });
                  setIsSettingsOpen(false);
                  showToast('🧭 Teleported back to Origin (0, 0)');
                }}
                className="flex-1 py-1.5 bg-[#3b82f6]! text-white border-[#93c5fd]! text-base"
              >
                <Compass className="w-4 h-4 inline mr-1" /> Return to Origin (0, 0)
              </McButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
