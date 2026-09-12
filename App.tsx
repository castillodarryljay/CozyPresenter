import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
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
  Footprints,
  Sword,
  Swords,
  Shield,
  Crosshair,
  Skull,
  Coins,
  Package,
  Hammer,
  Home,
  Wrench,
} from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box } from '@react-three/drei';
import * as THREE from 'three';
import confetti from 'canvas-confetti';

import {
  Position,
  PlayerMotionState,
  TerrainType,
  Relic,
  WorldFeature,
  CompanionState,
  Quest,
  PlayerStats,
  MapSettings,
  CompanionType,
  Weapon,
  Monster,
  Projectile,
  LootDrop,
  PlacedStructure,
  BuildableStructureBlueprint,
  ResourceType,
  WeaponRecipe,
  CharacterCustomization,
  SavedWorld,
  GameScreen,
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
import {
  ALL_RELICS,
  INITIAL_QUESTS,
  ALL_WEAPONS,
  BUILDABLE_BLUEPRINTS,
  WEAPON_RECIPES,
  generateChunkFeatures,
  generateChunkMonsters,
} from './gameData';
import { VoxelCompanion } from './companion';
import { WorldFeaturesManager } from './gameWorld';
import { MonstersWorld, ProjectilesWorld, LootDropsWorld } from './monsters';
import { PWAInstallButton } from './PWAInstallUI';
import { BuildCraftDrawer } from './BuildCraftDrawer';
import { BuildPlacementHUD } from './BuildPlacementHUD';
import { CharacterSheetModal } from './CharacterSheetModal';
import { VillageTradeModal } from './VillageTradeModal';

// Minecraft Dungeons Architecture & UI Components
import {
  DungeonsPlayerStats,
  DungeonsItem,
  DungeonsGearItem,
  DungeonsArtifact,
  DungeonsMission,
} from './src/dungeons/types';
import {
  DUNGEONS_MISSIONS,
  ALL_MELEE_WEAPONS,
  ALL_RANGED_WEAPONS,
  ALL_ARMOR,
  ALL_ARTIFACTS,
  INITIAL_MELEE,
  INITIAL_RANGED,
  INITIAL_ARMOR,
  INITIAL_ARTIFACTS,
  ENCHANTMENT_DEFINITIONS,
  getRandomDrop,
} from './src/dungeons/dungeonsData';
import { dungeonsAudio } from './src/dungeons/dungeonsAudio';
import { DungeonsHUD } from './src/dungeons/DungeonsHUD';
import { DungeonsInventory } from './src/dungeons/DungeonsInventory';
import { DungeonsCamp } from './src/dungeons/DungeonsCamp';
import { DungeonsMissionMap } from './src/dungeons/DungeonsMissionMap';
import { MinecraftLandingPage } from './src/dungeons/MinecraftLandingPage';
import { MinecraftPauseMenu } from './src/dungeons/MinecraftPauseMenu';

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
  hp: 100,
  maxHp: 100,
  stamina: 100,
  maxStamina: 100,
  potions: 0,
  monstersDefeated: 0,
  gold: 0,
  relicsFound: 0,
  obelisksLit: 0,
  stepsWalked: 0,
  secretsDug: 0,
  resources: {
    wood: 0,
    stone: 0,
    iron: 0,
    bone: 0,
    silk: 0,
    crystal: 0,
  },
  unlockedWeapons: ['starter_club'],
  structuresBuilt: 0,
};

// --- 3D Scene Components ---

// 3D Player Character with Minecraft Swing, Ground Contact Shadow, Handheld Lantern, Visible Armor Suite & Weapons
const Player3D: React.FC<{
  playerPosRef: React.MutableRefObject<PlayerMotionState>;
  playerCombatRef?: React.MutableRefObject<{ hp: number; maxHp: number; stamina: number; maxStamina: number; dodgeEndTime: number; lastAttackTime: number }>;
  color: string;
  settings: MapSettings;
  isNight: boolean;
  activeWeapon?: Weapon;
  equippedMelee?: DungeonsGearItem;
  equippedRanged?: DungeonsGearItem;
  attackAnimRef: React.MutableRefObject<{
    isAttacking: boolean;
    startTime: number;
    duration: number;
    attackType?: 'melee' | 'ranged';
    comboStep?: number;
  }>;
  isHurtFlash?: boolean;
  customization?: CharacterCustomization;
  equippedArmor?: DungeonsGearItem;
}> = ({
  playerPosRef,
  playerCombatRef,
  color,
  settings,
  isNight,
  activeWeapon,
  equippedMelee,
  equippedRanged,
  attackAnimRef,
  isHurtFlash,
  customization,
  equippedArmor,
}) => {
  const group = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const capeRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (group.current) {
      const p = playerPosRef.current;
      const now = performance.now();
      const isDodging = Boolean(playerCombatRef && now < playerCombatRef.current.dodgeEndTime);

      if (isDodging && playerCombatRef) {
        // Dynamic 360-degree forward tumble acrobatic roll
        const rollDuration = 350;
        const elapsed = Math.max(0, rollDuration - (playerCombatRef.current.dodgeEndTime - now));
        const progress = Math.min(1, elapsed / rollDuration);
        group.current.rotation.x = progress * Math.PI * 2;
        group.current.rotation.y = p.rotation;
        group.current.position.set(p.x, p.elevation + 0.45 + Math.sin(progress * Math.PI) * 0.2, p.y);

        if (leftLeg.current && rightLeg.current && leftArm.current && rightArm.current) {
          leftLeg.current.rotation.x = Math.PI * 0.35;
          rightLeg.current.rotation.x = Math.PI * 0.35;
          leftArm.current.rotation.x = -Math.PI * 0.35;
          rightArm.current.rotation.x = -Math.PI * 0.35;
        }
      } else {
        group.current.rotation.x = 0;
        group.current.rotation.y = p.rotation;

        if (p.isMoving) {
          const t = state.clock.elapsedTime * 14;
          const swing = Math.sin(t);
          const bounce = Math.abs(Math.sin(t)) * 0.08;
          group.current.position.set(p.x, p.elevation + 0.75 + bounce, p.y);

          if (leftLeg.current && rightLeg.current && leftArm.current && rightArm.current) {
            leftLeg.current.rotation.x = swing * 0.65;
            rightLeg.current.rotation.x = -swing * 0.65;
            if (!attackAnimRef.current.isAttacking) {
              leftArm.current.rotation.x = -swing * 0.65;
              rightArm.current.rotation.x = swing * 0.65;
              rightArm.current.rotation.z = 0;
              rightArm.current.rotation.y = 0;
            }
          }

          if (capeRef.current) {
            capeRef.current.rotation.x = Math.PI * 0.16 + Math.sin(t) * 0.08;
          }
        } else {
          // Gentle idle breathing bob
          const breathe = Math.sin(state.clock.elapsedTime * 2.5) * 0.025;
          group.current.position.set(p.x, p.elevation + 0.75 + breathe, p.y);

          if (leftLeg.current && rightLeg.current && leftArm.current && rightArm.current) {
            leftLeg.current.rotation.x = THREE.MathUtils.lerp(leftLeg.current.rotation.x, 0, delta * 10);
            rightLeg.current.rotation.x = THREE.MathUtils.lerp(rightLeg.current.rotation.x, 0, delta * 10);
            if (!attackAnimRef.current.isAttacking) {
              leftArm.current.rotation.x = THREE.MathUtils.lerp(leftArm.current.rotation.x, 0, delta * 10);
              rightArm.current.rotation.x = THREE.MathUtils.lerp(rightArm.current.rotation.x, 0, delta * 10);
              rightArm.current.rotation.z = THREE.MathUtils.lerp(rightArm.current.rotation.z, 0, delta * 10);
              rightArm.current.rotation.y = THREE.MathUtils.lerp(rightArm.current.rotation.y, 0, delta * 10);
            }
          }

          if (capeRef.current) {
            capeRef.current.rotation.x = THREE.MathUtils.lerp(capeRef.current.rotation.x, Math.PI * 0.04, delta * 6);
          }
        }

        // Combat Attack Swing Override
        if (attackAnimRef.current.isAttacking && rightArm.current) {
          const elapsed = (now - attackAnimRef.current.startTime) / attackAnimRef.current.duration;
          if (elapsed < 1.0) {
            const attackType = attackAnimRef.current.attackType || 'melee';
            const comboStep = attackAnimRef.current.comboStep || 0;
            const swingProgress = Math.sin(elapsed * Math.PI);

            if (attackType === 'ranged') {
              // Ranged Bow Draw & Release
              if (leftArm.current) {
                leftArm.current.rotation.x = -Math.PI * 0.48;
                leftArm.current.rotation.y = Math.PI * 0.18;
                leftArm.current.rotation.z = 0;
              }
              rightArm.current.rotation.x = -Math.PI * 0.46;
              rightArm.current.rotation.y = -Math.PI * 0.22;
              rightArm.current.position.z = Math.sin(elapsed * Math.PI) * -0.15;
            } else if (equippedMelee?.subType === 'gauntlets') {
              // Fighter's Bindings: Rapid 1-2 punch flurry
              if (elapsed < 0.5) {
                const p1 = Math.sin(elapsed * 2 * Math.PI);
                if (leftArm.current) {
                  leftArm.current.rotation.x = -Math.PI * 0.55 * p1;
                  leftArm.current.rotation.z = p1 * 0.2;
                }
              } else {
                const p2 = Math.sin((elapsed - 0.5) * 2 * Math.PI);
                rightArm.current.rotation.x = -Math.PI * 0.6 * p2;
                rightArm.current.rotation.z = -p2 * 0.2;
              }
              group.current.rotation.z = Math.sin(elapsed * Math.PI * 2) * 0.08;
            } else if (equippedMelee?.subType === 'claymore') {
              // Great Claymore: Two-Handed Heavy Cleave
              const heavySwing = Math.sin(elapsed * Math.PI);
              rightArm.current.rotation.x = -Math.PI * 0.65 * heavySwing;
              rightArm.current.rotation.y = -Math.PI * 0.25 * heavySwing;
              if (leftArm.current) {
                leftArm.current.rotation.x = -Math.PI * 0.6 * heavySwing;
                leftArm.current.rotation.y = Math.PI * 0.2 * heavySwing;
              }
              group.current.rotation.z = Math.sin(elapsed * Math.PI) * 0.16;
              group.current.position.y += Math.sin(elapsed * Math.PI) * 0.08;
            } else {
              // 3-Step Combo Melee Swing
              if (comboStep === 0) {
                // Combo 1: Downward right-to-left cleave
                rightArm.current.rotation.x = -Math.PI * 0.55 * swingProgress;
                rightArm.current.rotation.y = -Math.PI * 0.35 * swingProgress;
                rightArm.current.rotation.z = swingProgress * 0.25;
                group.current.rotation.z = Math.sin(elapsed * Math.PI) * 0.1;
              } else if (comboStep === 1) {
                // Combo 2: Rising left-to-right slash
                rightArm.current.rotation.x = -Math.PI * 0.45 * swingProgress;
                rightArm.current.rotation.y = Math.PI * 0.4 * swingProgress;
                rightArm.current.rotation.z = -swingProgress * 0.25;
                group.current.rotation.z = -Math.sin(elapsed * Math.PI) * 0.1;
              } else {
                // Combo 3 (Finisher): Powerful overhead vertical smash
                rightArm.current.rotation.x = -Math.PI * 0.75 * swingProgress;
                rightArm.current.rotation.y = 0;
                rightArm.current.rotation.z = 0;
                group.current.position.y += Math.sin(elapsed * Math.PI) * 0.14;
                group.current.rotation.x = -Math.sin(elapsed * Math.PI) * 0.12;
              }
            }
          } else {
            attackAnimRef.current.isAttacking = false;
            group.current.rotation.z = 0;
            group.current.rotation.x = 0;
            if (rightArm.current) {
              rightArm.current.position.z = 0;
            }
          }
        }
      }
    }
  });

  const initP = playerPosRef.current;
  const skinColor = isHurtFlash ? '#fca5a5' : (customization?.skinColor || '#FACC9A');
  const torsoColor = isHurtFlash ? '#ef4444' : (customization?.shirtColor || color || '#15803d');
  const pantsColor = customization?.pantsColor || '#37305C';
  const hairColor = customization?.hairColor || '#3d2314';
  const hairStyle = customization?.hairStyle || 'explorer_hat';
  const capeStyle = customization?.capeStyle || 'royal_red';
  const showArmor = customization?.showArmor !== false;

  // Armor suite visual styling
  const armorHex = equippedArmor
    ? (equippedArmor.color || (equippedArmor.rarity === 'unique' ? '#f59e0b' : equippedArmor.rarity === 'rare' ? '#a855f7' : '#38bdf8'))
    : '#38bdf8';
  const isUniqueArmor = equippedArmor?.rarity === 'unique';
  const isRareArmor = equippedArmor?.rarity === 'rare';

  // Cape color map
  const capeColorMap: { [key: string]: string } = {
    royal_red: '#dc2626',
    emerald_ranger: '#059669',
    void_walker: '#7c3aed',
    golden_champion: '#d97706',
  };
  const capeColor = capeColorMap[capeStyle] || '#dc2626';

  return (
    <group ref={group} position={[initP.x, initP.elevation + 0.75, initP.y]}>
      {/* Soft circular ground contact shadow */}
      <mesh position={[0, -0.73, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.38, 16]} />
        <meshBasicMaterial color="#1a2e12" transparent opacity={0.35} depthWrite={false} />
      </mesh>

      {/* Head & Headgear */}
      <group position={[0, 0.75, 0]}>
        <Box args={[0.5, 0.5, 0.5]}>
          <meshStandardMaterial color={skinColor} roughness={1} />
        </Box>

        {/* Headgear Styles */}
        {hairStyle === 'explorer_hat' && (
          <>
            <Box position={[0, 0.28, 0]} args={[0.56, 0.1, 0.56]}>
              <meshStandardMaterial color="#5d4037" roughness={0.9} />
            </Box>
            <Box position={[0, 0.38, 0]} args={[0.38, 0.16, 0.38]}>
              <meshStandardMaterial color="#6d4c41" roughness={0.9} />
            </Box>
          </>
        )}

        {hairStyle === 'knight_helm' && (
          <group position={[0, 0.04, 0]}>
            <Box args={[0.54, 0.52, 0.54]}>
              <meshStandardMaterial color={armorHex} roughness={0.3} metalness={0.8} />
            </Box>
            {/* Visor Eye Slit */}
            <Box position={[0, 0, 0.28]} args={[0.42, 0.08, 0.04]}>
              <meshBasicMaterial color="#09090b" />
            </Box>
            {/* Crest Plume */}
            <Box position={[0, 0.32, -0.05]} args={[0.1, 0.18, 0.4]}>
              <meshStandardMaterial color={isUniqueArmor ? '#fbbf24' : '#ef4444'} roughness={0.7} />
            </Box>
          </group>
        )}

        {hairStyle === 'crown' && (
          <group position={[0, 0.28, 0]}>
            {/* Golden Circlet */}
            <Box args={[0.54, 0.1, 0.54]}>
              <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.2} />
            </Box>
            {/* 4 Golden Crown Points */}
            <Box position={[-0.24, 0.1, -0.24]} args={[0.08, 0.14, 0.08]}>
              <meshStandardMaterial color="#facc15" metalness={0.9} />
            </Box>
            <Box position={[0.24, 0.1, -0.24]} args={[0.08, 0.14, 0.08]}>
              <meshStandardMaterial color="#facc15" metalness={0.9} />
            </Box>
            <Box position={[-0.24, 0.1, 0.24]} args={[0.08, 0.14, 0.08]}>
              <meshStandardMaterial color="#facc15" metalness={0.9} />
            </Box>
            <Box position={[0.24, 0.1, 0.24]} args={[0.08, 0.14, 0.08]}>
              <meshStandardMaterial color="#facc15" metalness={0.9} />
            </Box>
            {/* Embedded Ruby */}
            <mesh position={[0, 0.06, 0.28]}>
              <boxGeometry args={[0.08, 0.08, 0.02]} />
              <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={2} />
            </mesh>
          </group>
        )}

        {hairStyle === 'hood' && (
          <group position={[0, 0.05, -0.02]}>
            <Box args={[0.56, 0.54, 0.56]}>
              <meshStandardMaterial color={torsoColor} roughness={0.9} />
            </Box>
          </group>
        )}

        {hairStyle === 'hair' && (
          <group position={[0, 0.22, -0.04]}>
            <Box args={[0.52, 0.22, 0.54]}>
              <meshStandardMaterial color={hairColor} roughness={0.8} />
            </Box>
          </group>
        )}

        {/* Eyes (Visible for all non-helmet styles) */}
        {hairStyle !== 'knight_helm' && (
          <>
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
          </>
        )}
      </group>

      {/* Torso & Armor Chestplate */}
      <group position={[0, 0.15, 0]}>
        <Box args={[0.5, 0.7, 0.25]}>
          <meshStandardMaterial color={torsoColor} roughness={1} />
        </Box>

        {/* Visible Armor Suite (Chestplate Layer) */}
        {showArmor && (
          <group>
            {/* Fitted Breastplate */}
            <Box position={[0, 0.02, 0]} args={[0.54, 0.68, 0.28]}>
              <meshStandardMaterial color={armorHex} roughness={0.4} metalness={0.7} />
            </Box>
            {/* Golden Belt */}
            <Box position={[0, -0.28, 0.01]} args={[0.55, 0.12, 0.29]}>
              <meshStandardMaterial color="#78350f" roughness={0.8} />
            </Box>
            {/* Belt Buckle */}
            <Box position={[0, -0.28, 0.16]} args={[0.14, 0.1, 0.04]}>
              <meshStandardMaterial color="#eab308" metalness={0.9} />
            </Box>

            {/* Glowing Gem for Rare/Unique Armor */}
            {(isUniqueArmor || isRareArmor) && (
              <mesh position={[0, 0.12, 0.16]}>
                <boxGeometry args={[0.08, 0.08, 0.04]} />
                <meshStandardMaterial
                  color={isUniqueArmor ? '#fef08a' : '#c084fc'}
                  emissive={isUniqueArmor ? '#f59e0b' : '#9333ea'}
                  emissiveIntensity={2.5}
                />
              </mesh>
            )}
          </group>
        )}

        {/* Flowing Back Cape */}
        {capeStyle !== 'none' && (
          <group ref={capeRef} position={[0, 0.32, -0.15]}>
            <Box position={[0, -0.42, 0]} args={[0.46, 0.82, 0.03]}>
              <meshStandardMaterial color={capeColor} roughness={0.7} />
            </Box>
            {/* Cape Clasp Trim */}
            <Box position={[0, 0, 0.02]} args={[0.48, 0.06, 0.04]}>
              <meshStandardMaterial color="#eab308" metalness={0.8} />
            </Box>
          </group>
        )}
      </group>

      {/* Left Arm (Holds Explorer Lantern & Shoulder Pauldron) */}
      <group ref={leftArm} position={[-0.38, 0.45, 0]}>
        <Box position={[0, -0.3, 0]} args={[0.2, 0.7, 0.25]}>
          <meshStandardMaterial color={torsoColor} roughness={1} />
        </Box>
        <Box position={[0, -0.7, 0]} args={[0.2, 0.2, 0.25]}>
          <meshStandardMaterial color={skinColor} roughness={1} />
        </Box>

        {/* Shoulder Pauldron */}
        {showArmor && (
          <group position={[-0.04, 0.02, 0]}>
            <Box args={[0.26, 0.22, 0.29]}>
              <meshStandardMaterial color={armorHex} roughness={0.4} metalness={0.7} />
            </Box>
          </group>
        )}

        {/* Gauntlet Wrist Guard & Fighter's Bindings on Left Hand */}
        {showArmor && (
          <Box position={[0, -0.55, 0]} args={[0.22, 0.2, 0.27]}>
            <meshStandardMaterial color={armorHex} roughness={0.4} metalness={0.7} />
          </Box>
        )}
        {equippedMelee?.subType === 'gauntlets' && (
          <group position={[0, -0.72, 0]}>
            <Box args={[0.24, 0.16, 0.28]}>
              <meshStandardMaterial color="#10b981" roughness={0.6} />
            </Box>
            <mesh position={[0, 0, 0.14]}>
              <boxGeometry args={[0.18, 0.08, 0.04]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        )}

        {/* Handheld Voxel Lantern */}
        <group position={[0, -0.85, 0.15]}>
          <mesh position={[0, 0.12, 0]}>
            <boxGeometry args={[0.04, 0.12, 0.04]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.16, 0.22, 0.16]} />
            <meshStandardMaterial
              color={isNight ? '#ffea70' : '#444'}
              emissive={isNight ? '#ffea70' : '#000'}
              emissiveIntensity={isNight ? 2.5 : 0}
              roughness={0.2}
            />
          </mesh>
          {isNight && (
            <pointLight position={[0, 0, 0]} color="#ffe890" intensity={3.5} distance={10} />
          )}
        </group>
      </group>

      {/* Right Arm (Wields Active Weapon & Shoulder Pauldron) */}
      <group ref={rightArm} position={[0.38, 0.45, 0]}>
        <Box position={[0, -0.3, 0]} args={[0.2, 0.7, 0.25]}>
          <meshStandardMaterial color={torsoColor} roughness={1} />
        </Box>
        <Box position={[0, -0.7, 0]} args={[0.2, 0.2, 0.25]}>
          <meshStandardMaterial color={skinColor} roughness={1} />
        </Box>

        {/* Shoulder Pauldron */}
        {showArmor && (
          <group position={[0.04, 0.02, 0]}>
            <Box args={[0.26, 0.22, 0.29]}>
              <meshStandardMaterial color={armorHex} roughness={0.4} metalness={0.7} />
            </Box>
          </group>
        )}

        {/* Gauntlet Wrist Guard */}
        {showArmor && (
          <Box position={[0, -0.55, 0]} args={[0.22, 0.2, 0.27]}>
            <meshStandardMaterial color={armorHex} roughness={0.4} metalness={0.7} />
          </Box>
        )}

        {/* Equipped 3D Weapon Model (High-Fidelity Voxel Craft) - Forward-Facing Grip */}
        <group position={[0, -0.68, 0.06]} rotation={[Math.PI * 0.35, -0.05, 0.05]}>
          {/* 1. Diamond Sword / Standard Sword */}
          {((equippedMelee && equippedMelee.subType === 'sword') || (!equippedMelee && activeWeapon?.type === 'sword')) && (
            <group position={[0, 0.12, 0]}>
              {/* Pommel */}
              <mesh position={[0, -0.22, 0]}>
                <boxGeometry args={[0.08, 0.08, 0.08]} />
                <meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.8} />
              </mesh>
              {/* Grip */}
              <mesh position={[0, -0.12, 0]}>
                <boxGeometry args={[0.05, 0.16, 0.05]} />
                <meshStandardMaterial color="#334155" roughness={0.8} />
              </mesh>
              {/* Crossguard with gold wing tips */}
              <mesh position={[0, -0.02, 0]}>
                <boxGeometry args={[0.26, 0.06, 0.09]} />
                <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.7} />
              </mesh>
              <mesh position={[-0.14, 0.01, 0]}>
                <boxGeometry args={[0.05, 0.08, 0.07]} />
                <meshStandardMaterial color="#f59e0b" roughness={0.2} metalness={0.9} />
              </mesh>
              <mesh position={[0.14, 0.01, 0]}>
                <boxGeometry args={[0.05, 0.08, 0.07]} />
                <meshStandardMaterial color="#f59e0b" roughness={0.2} metalness={0.9} />
              </mesh>
              {/* Diamond Blade Core */}
              <mesh position={[0, 0.42, 0]}>
                <boxGeometry args={[0.07, 0.84, 0.05]} />
                <meshStandardMaterial color="#0891b2" roughness={0.2} metalness={0.5} />
              </mesh>
              {/* Diamond Blade Cutting Edge (Luminescent cyan) */}
              <mesh position={[0, 0.42, 0]}>
                <boxGeometry args={[0.12, 0.8, 0.03]} />
                <meshStandardMaterial
                  color="#a5f3fc"
                  emissive="#22d3ee"
                  emissiveIntensity={1.2}
                  roughness={0.1}
                />
              </mesh>
              {/* Pointed Tip */}
              <mesh position={[0, 0.86, 0]} rotation={[0, 0, Math.PI / 4]}>
                <boxGeometry args={[0.07, 0.07, 0.03]} />
                <meshStandardMaterial color="#67e8f9" emissive="#22d3ee" emissiveIntensity={1.5} />
              </mesh>
            </group>
          )}

          {/* 2. Cursed Double-Headed Battleaxe */}
          {equippedMelee?.subType === 'axe' && (
            <group position={[0, 0.15, 0]}>
              {/* Dark Wood / Obsidian Haft */}
              <mesh position={[0, 0.1, 0]}>
                <boxGeometry args={[0.06, 1.05, 0.06]} />
                <meshStandardMaterial color="#1e1b18" roughness={0.9} />
              </mesh>
              {/* Spiked Pommel */}
              <mesh position={[0, -0.44, 0]}>
                <coneGeometry args={[0.05, 0.12, 4]} />
                <meshStandardMaterial color="#475569" metalness={0.8} />
              </mesh>
              {/* Left Crescent Blade */}
              <mesh position={[-0.15, 0.48, 0]}>
                <boxGeometry args={[0.24, 0.36, 0.04]} />
                <meshStandardMaterial color="#312e81" metalness={0.7} roughness={0.3} />
              </mesh>
              {/* Right Crescent Blade */}
              <mesh position={[0.15, 0.48, 0]}>
                <boxGeometry args={[0.24, 0.36, 0.04]} />
                <meshStandardMaterial color="#312e81" metalness={0.7} roughness={0.3} />
              </mesh>
              {/* Glowing Void Runes */}
              <mesh position={[0, 0.48, 0.02]}>
                <boxGeometry args={[0.12, 0.24, 0.05]} />
                <meshStandardMaterial
                  color="#c084fc"
                  emissive="#9333ea"
                  emissiveIntensity={2.5}
                  roughness={0.1}
                />
              </mesh>
            </group>
          )}

          {/* 3. Sun's Grace Radiant Solar Mace */}
          {equippedMelee?.subType === 'mace' && (
            <group position={[0, 0.15, 0]}>
              {/* Golden Shaft */}
              <mesh position={[0, 0.1, 0]}>
                <boxGeometry args={[0.07, 0.95, 0.07]} />
                <meshStandardMaterial color="#78350f" roughness={0.6} />
              </mesh>
              {/* Fluted Head Core */}
              <mesh position={[0, 0.52, 0]}>
                <boxGeometry args={[0.16, 0.24, 0.16]} />
                <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.2} />
              </mesh>
              {/* Glowing Radiant Solar Core */}
              <mesh position={[0, 0.52, 0]}>
                <sphereGeometry args={[0.12, 12, 12]} />
                <meshStandardMaterial
                  color="#fde047"
                  emissive="#f59e0b"
                  emissiveIntensity={3.0}
                  roughness={0.1}
                />
              </mesh>
              {/* Cross Flanges */}
              <mesh position={[0, 0.52, 0]}>
                <boxGeometry args={[0.26, 0.18, 0.05]} />
                <meshStandardMaterial color="#fbbf24" metalness={0.8} />
              </mesh>
              <mesh position={[0, 0.52, 0]}>
                <boxGeometry args={[0.05, 0.18, 0.26]} />
                <meshStandardMaterial color="#fbbf24" metalness={0.8} />
              </mesh>
            </group>
          )}

          {/* 4. Great Claymore (Colossal Two-Handed Blade) */}
          {equippedMelee?.subType === 'claymore' && (
            <group position={[0, 0.22, 0]}>
              {/* Long 2-Handed Grip */}
              <mesh position={[0, -0.22, 0]}>
                <boxGeometry args={[0.07, 0.32, 0.07]} />
                <meshStandardMaterial color="#451a03" roughness={0.8} />
              </mesh>
              {/* Heavy Crossguard */}
              <mesh position={[0, -0.04, 0]}>
                <boxGeometry args={[0.34, 0.07, 0.1]} />
                <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.3} />
              </mesh>
              {/* Massive Double-Edged Blade */}
              <mesh position={[0, 0.55, 0]}>
                <boxGeometry args={[0.16, 1.15, 0.05]} />
                <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
              </mesh>
              {/* Fuller Groove */}
              <mesh position={[0, 0.55, 0]}>
                <boxGeometry args={[0.04, 0.95, 0.06]} />
                <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.7} />
              </mesh>
            </group>
          )}

          {/* 5. Fighter's Bindings (Knuckle Gauntlets) */}
          {equippedMelee?.subType === 'gauntlets' && (
            <group position={[0, -0.04, -0.06]} rotation={[-Math.PI * 0.35, 0.05, -0.05]}>
              <Box args={[0.24, 0.16, 0.28]}>
                <meshStandardMaterial color="#10b981" roughness={0.6} />
              </Box>
              <mesh position={[0, 0, 0.14]}>
                <boxGeometry args={[0.18, 0.08, 0.04]} />
                <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.2} />
              </mesh>
            </group>
          )}

          {/* 6. Bow / Harp Crossbow / Firebolt Bow */}
          {(!equippedMelee && activeWeapon?.type === 'bow') && (
            <group position={[0, 0.05, 0]} rotation={[-Math.PI * 0.25, 0, 0.15]}>
              <mesh>
                <boxGeometry args={[0.06, 0.95, 0.06]} />
                <meshStandardMaterial color="#ca8a04" roughness={0.7} />
              </mesh>
              <mesh position={[-0.1, 0, 0]}>
                <boxGeometry args={[0.02, 0.9, 0.02]} />
                <meshBasicMaterial color="#fef08a" />
              </mesh>
            </group>
          )}

          {/* 7. Magic Staff */}
          {(!equippedMelee && activeWeapon?.type === 'staff') && (
            <group position={[0, 0.18, 0]}>
              <mesh>
                <boxGeometry args={[0.06, 1.15, 0.06]} />
                <meshStandardMaterial color="#334155" roughness={0.8} />
              </mesh>
              <mesh position={[0, 0.62, 0]}>
                <sphereGeometry args={[0.13, 12, 12]} />
                <meshStandardMaterial
                  color="#22d3ee"
                  emissive="#06b6d4"
                  emissiveIntensity={3}
                  roughness={0.1}
                />
              </mesh>
            </group>
          )}

          {/* 8. War Glaive / Halberd */}
          {((!equippedMelee && activeWeapon?.type === 'halberd') || (equippedMelee && equippedMelee.subType === 'glaive')) && (
            <group position={[0, 0.22, 0]}>
              <mesh>
                <boxGeometry args={[0.06, 1.35, 0.06]} />
                <meshStandardMaterial color="#57534e" roughness={0.9} />
              </mesh>
              <mesh position={[0.1, 0.6, 0]}>
                <boxGeometry args={[0.26, 0.35, 0.04]} />
                <meshStandardMaterial
                  color="#f97316"
                  emissive="#c2410c"
                  emissiveIntensity={1.5}
                  roughness={0.3}
                />
              </mesh>
            </group>
          )}
        </group>
      </group>

      {/* Legs & Armored Greaves */}
      <group ref={leftLeg} position={[-0.13, -0.2, 0]}>
        <Box position={[0, -0.35, 0]} args={[0.22, 0.7, 0.25]}>
          <meshStandardMaterial color={pantsColor} roughness={1} />
        </Box>
        {showArmor && (
          <Box position={[0, -0.45, 0]} args={[0.24, 0.35, 0.27]}>
            <meshStandardMaterial color={armorHex} roughness={0.4} metalness={0.7} />
          </Box>
        )}
      </group>

      <group ref={rightLeg} position={[0.13, -0.2, 0]}>
        <Box position={[0, -0.35, 0]} args={[0.22, 0.7, 0.25]}>
          <meshStandardMaterial color={pantsColor} roughness={1} />
        </Box>
        {showArmor && (
          <Box position={[0, -0.45, 0]} args={[0.24, 0.35, 0.27]}>
            <meshStandardMaterial color={armorHex} roughness={0.4} metalness={0.7} />
          </Box>
        )}
      </group>

      {/* Dynamic Melee Slash Arc Visual Effect */}
      {attackAnimRef.current.isAttacking && attackAnimRef.current.attackType !== 'ranged' && (
        <group
          position={[0, 0.2, 0.55]}
          rotation={[
            attackAnimRef.current.comboStep === 2 ? -Math.PI * 0.45 : -Math.PI * 0.25,
            0,
            attackAnimRef.current.comboStep === 1 ? Math.PI * 0.2 : -Math.PI * 0.2,
          ]}
        >
          <mesh>
            <ringGeometry args={[0.85, 1.4, 24, 1, Math.PI * 0.15, Math.PI * 0.75]} />
            <meshStandardMaterial
              color={
                equippedMelee?.element === 'void'
                  ? '#c084fc'
                  : equippedMelee?.element === 'radiant'
                  ? '#fde047'
                  : equippedMelee?.element === 'fire'
                  ? '#f97316'
                  : equippedMelee?.subType === 'sword' || equippedMelee?.id === 'diamond_sword'
                  ? '#38bdf8'
                  : '#f1f5f9'
              }
              emissive={
                equippedMelee?.element === 'void'
                  ? '#9333ea'
                  : equippedMelee?.element === 'radiant'
                  ? '#eab308'
                  : equippedMelee?.element === 'fire'
                  ? '#ea580c'
                  : '#0284c7'
              }
              emissiveIntensity={2.5}
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}
    </group>
  );
};

// Isometric Camera Rig with Synchronized Smooth Follow & Title Screen Panorama Orbit
const CameraRig: React.FC<{
  playerPosRef: React.MutableRefObject<PlayerMotionState>;
  zoom: number;
  pan: { x: number; y: number };
  settings: MapSettings;
  isTitleScreen?: boolean;
}> = ({ playerPosRef, zoom, pan, settings, isTitleScreen }) => {
  useFrame((state, delta) => {
    if (isTitleScreen) {
      const time = state.clock.getElapsedTime();
      const p = playerPosRef.current;
      const tX = isNaN(p.x) ? 0 : p.x;
      const tZ = isNaN(p.y) ? 0 : p.y;
      const tY = isNaN(p.elevation) ? 6 : p.elevation;
      // Majestic slow cinematic panoramic camera orbit around the voxel world
      const radius = 26;
      const camX = tX + Math.sin(time * 0.1) * radius;
      const camZ = tZ + Math.cos(time * 0.1) * radius;
      const camY = tY + 15 + Math.sin(time * 0.05) * 2.5;
      state.camera.position.lerp(new THREE.Vector3(camX, camY, camZ), Math.min(1, delta * 3));
      state.camera.lookAt(tX, tY + 1.2, tZ);
      return;
    }

    const p = playerPosRef.current;
    if (isNaN(p.x) || isNaN(p.y) || isNaN(pan.x) || isNaN(pan.y)) return;

    const tX = p.x + pan.x;
    const tZ = p.y + pan.y;
    const tY = p.elevation;

    const offsetH = zoom * 0.95;
    const offsetV = zoom * 1.15;

    // Authentic Minecraft Dungeons 45-degree elevated diagonal isometric perspective
    const desiredPos = new THREE.Vector3(tX - offsetH * 0.72, tY + offsetV, tZ + offsetH * 0.72);
    state.camera.position.lerp(desiredPos, Math.min(1, delta * 8));
    state.camera.lookAt(tX, tY + 0.6, tZ);
  });
  return null;
};

// Game Loop Controller - Native 60 FPS update with Combat Physics & AI inside WebGL render pipeline
const GameLoopController: React.FC<{
  playerPosRef: React.MutableRefObject<PlayerMotionState>;
  inputVectorRef: React.MutableRefObject<{ x: number; y: number }>;
  keysPressedRef: React.MutableRefObject<Set<string>>;
  cameraPanRef: React.MutableRefObject<{ x: number; y: number }>;
  setCameraPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  settings: MapSettings;
  isPaused: boolean;
  monstersRef: React.MutableRefObject<Monster[]>;
  projectilesRef: React.MutableRefObject<Projectile[]>;
  lootDropsRef: React.MutableRefObject<LootDrop[]>;
  playerCombatRef: React.MutableRefObject<{
    hp: number;
    maxHp: number;
    stamina: number;
    maxStamina: number;
    isDodging: boolean;
    dodgeEndTime: number;
    lastAttackTime: number;
    lastHurtTime?: number;
  }>;
  activeCampfirePos: Position | null;
  activePerks?: {
    maxHpBonus: number;
    campfireHealMultiplier: number;
    sonarRangeMultiplier: number;
    lanternBoost: boolean;
    maxStaminaBonus: number;
    staminaRegenMultiplier: number;
    speedMultiplier: number;
    dashCostMultiplier: number;
    chimeSecrets: boolean;
    goldMultiplier: number;
    potionHealBonus: number;
    cooldownMultiplier: number;
    critChanceBonus: number;
    xpMultiplier: number;
    companionVacuum: boolean;
  };
  awakenedObelisks?: WorldFeature[];
  placedStructuresRef?: React.MutableRefObject<PlacedStructure[]>;
  onPlayerHurt: (dmg: number, newHp: number) => void;
  onMonsterDefeated: (m: Monster) => void;
  onProjectileHitMonster?: (proj: Projectile, m: Monster) => void;
  onCollectLoot: (l: LootDrop) => void;
  onCombatTick: (hp: number, stamina: number) => void;
  onSyncUI: (pos: { x: number; y: number }, steps: number) => void;
  onChunkChange: (chunk: { cx: number; cz: number }) => void;
  onSyncProjectiles?: (projs: Projectile[]) => void;
}> = ({
  playerPosRef,
  inputVectorRef,
  keysPressedRef,
  cameraPanRef,
  setCameraPan,
  settings,
  isPaused,
  monstersRef,
  projectilesRef,
  lootDropsRef,
  playerCombatRef,
  activeCampfirePos,
  activePerks,
  awakenedObelisks,
  placedStructuresRef,
  onPlayerHurt,
  onMonsterDefeated,
  onProjectileHitMonster,
  onCollectLoot,
  onCombatTick,
  onSyncUI,
  onChunkChange,
  onSyncProjectiles,
}) => {
  const distWalkedAcc = useRef(0);
  const lastSyncTime = useRef(0);
  const lastProjCount = useRef(0);

  useFrame((_, delta) => {
    if (isPaused) return;

    const dt = Math.min(delta, 0.05);
    const now = performance.now();
    const p = playerPosRef.current;
    const isDodging = now < playerCombatRef.current.dodgeEndTime;

    // Dynamically synchronize stats with active relic perks
    playerCombatRef.current.maxHp = 100 + (activePerks?.maxHpBonus || 0);
    playerCombatRef.current.maxStamina = 100 + (activePerks?.maxStaminaBonus || 0);

    // Movement speed (with dodge roll burst multiplier and Zephyr Stride perk)
    const speedBonus = activePerks?.speedMultiplier || 1.0;
    const baseMoveSpeed = isDodging ? 11.5 * speedBonus : 5.2 * speedBonus;

    // Stamina Natural Regeneration (boosted by Enduring Vigor perk)
    const stamRegenRate = 20 * (activePerks?.staminaRegenMultiplier || 1.0);
    playerCombatRef.current.stamina = Math.min(
      playerCombatRef.current.maxStamina,
      playerCombatRef.current.stamina + stamRegenRate * dt
    );

    // Campfire Warmth Health Regeneration (+2.5 HP / sec boosted by Verdant Vitality)
    // Anti-exploit: Suppressed if player took damage within the last 4 seconds
    if (activeCampfirePos) {
      const dCamp = Math.hypot(p.x - activeCampfirePos.x, p.y - activeCampfirePos.y);
      const isCombatSuppressed = (now - (playerCombatRef.current.lastHurtTime || 0)) < 4000;
      if (dCamp < 4.5 && !isCombatSuppressed) {
        const campHealRate = 2.5 * (activePerks?.campfireHealMultiplier || 1.0);
        playerCombatRef.current.hp = Math.min(
          playerCombatRef.current.maxHp,
          playerCombatRef.current.hp + campHealRate * dt
        );
      }
    }

    // Awakened Obelisk Celestial Sanctuary (+5 HP/s, +10 Stamina/s, monsters cannot attack)
    let inSanctuary = false;
    if (awakenedObelisks && awakenedObelisks.length > 0) {
      for (const ob of awakenedObelisks) {
        const dOb = Math.hypot(p.x - ob.x, p.y - ob.y);
        if (dOb < 18) {
          inSanctuary = true;
          playerCombatRef.current.hp = Math.min(
            playerCombatRef.current.maxHp,
            playerCombatRef.current.hp + 5 * dt
          );
          playerCombatRef.current.stamina = Math.min(
            playerCombatRef.current.maxStamina,
            playerCombatRef.current.stamina + 10 * dt
          );
          break;
        }
      }
    }

    // Built Structures Field Effects (Homestead sanctuary, Turret automated ballista)
    if (placedStructuresRef?.current) {
      for (const struct of placedStructuresRef.current) {
        const dStruct = Math.hypot(p.x - struct.x, p.y - struct.y);
        if (struct.type === 'house' && dStruct < 5.5) {
          inSanctuary = true;
          playerCombatRef.current.hp = Math.min(
            playerCombatRef.current.maxHp,
            playerCombatRef.current.hp + 18 * dt
          );
          playerCombatRef.current.stamina = Math.min(
            playerCombatRef.current.maxStamina,
            playerCombatRef.current.stamina + 25 * dt
          );
        } else if (struct.type === 'watchtower' && dStruct < 24.0) {
          inSanctuary = true;
        } else if (struct.type === 'tent' && dStruct < 4.0) {
          playerCombatRef.current.hp = Math.min(
            playerCombatRef.current.maxHp,
            playerCombatRef.current.hp + 8 * dt
          );
          playerCombatRef.current.stamina = Math.min(
            playerCombatRef.current.maxStamina,
            playerCombatRef.current.stamina + 15 * dt
          );
        } else if (struct.type === 'turret') {
          const lastFire = struct.lastActionTime || 0;
          if (now - lastFire > 2200) {
            let closestMob: Monster | null = null;
            let closestDist = 16.0;
            for (const mob of monstersRef.current) {
              if (mob.state === 'dead') continue;
              const dm = Math.hypot(mob.x - struct.x, mob.y - struct.y);
              if (dm < closestDist) {
                closestDist = dm;
                closestMob = mob;
              }
            }
            if (closestMob) {
              struct.lastActionTime = now;
              const angle = Math.atan2(closestMob.x - struct.x, closestMob.y - struct.y);
              projectilesRef.current.push({
                id: `turret_arrow_${now}`,
                type: 'arrow',
                x: struct.x,
                y: struct.y,
                z: struct.elevation + 1.2,
                vx: Math.sin(angle) * 24,
                vy: Math.cos(angle) * 24,
                vz: 0,
                damage: 32,
                color: '#facc15',
                distanceTraveled: 0,
                maxDistance: 18,
              });
              sounds.playBowShoot();
            }
          }
        }
      }
    }

    let kx = 0;
    let ky = 0;
    const k = keysPressedRef.current;
    if (k.has('w') || k.has('arrowup')) ky -= 1;
    if (k.has('s') || k.has('arrowdown')) ky += 1;
    if (k.has('a') || k.has('arrowleft')) kx -= 1;
    if (k.has('d') || k.has('arrowright')) kx += 1;

    let dx = kx + inputVectorRef.current.x;
    let dy = ky + inputVectorRef.current.y;
    const mag = Math.hypot(dx, dy);
    if (mag > 1) {
      dx /= mag;
      dy /= mag;
    }

    const hasInput = mag > 0.08;
    let nextX = p.x;
    let nextY = p.y;
    let hasMoved = false;
    let stepDistance = 0;

    if (hasInput) {
      if (Math.abs(cameraPanRef.current.x) > 0.1 || Math.abs(cameraPanRef.current.y) > 0.1) {
        setCameraPan(cp => ({ x: cp.x * 0.9, y: cp.y * 0.9 }));
      }

      const step = baseMoveSpeed * dt;
      nextX += dx * step;
      nextY += dy * step;
      stepDistance = step;
      hasMoved = true;
      p.targetX = nextX;
      p.targetY = nextY;
      p.rotation = Math.atan2(dx, dy);
    } else {
      const distToTargetX = p.targetX - p.x;
      const distToTargetY = p.targetY - p.y;
      const dist = Math.hypot(distToTargetX, distToTargetY);

      if (dist > 0.15) {
        const step = Math.min(dist, baseMoveSpeed * dt);
        const dirX = distToTargetX / dist;
        const dirY = distToTargetY / dist;
        nextX += dirX * step;
        nextY += dirY * step;
        stepDistance = step;
        hasMoved = true;
        p.rotation = Math.atan2(dirX, dirY);
      }
    }

    p.x = nextX;
    p.y = nextY;
    p.elevation = getTerrainHeight(nextX, nextY, settings);
    p.isMoving = hasMoved;

    if (hasMoved) {
      distWalkedAcc.current += stepDistance;

      // Check chunk change - Only triggers when crossing 24-block chunk boundaries
      const newCx = Math.floor(nextX / 24);
      const newCz = Math.floor(nextY / 24);
      if (newCx !== p.chunk.cx || newCz !== p.chunk.cz) {
        p.chunk = { cx: newCx, cz: newCz };
        onChunkChange({ cx: newCx, cz: newCz });
      }
    }

    // --- PROJECTILES SIMULATION ---
    const projs = projectilesRef.current;
    for (let i = projs.length - 1; i >= 0; i--) {
      const proj = projs[i];
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.z += proj.vz * dt;
      proj.distanceTraveled += Math.hypot(proj.vx * dt, proj.vy * dt);

      let hitMonster = false;
      for (const m of monstersRef.current) {
        if (m.state === 'dead') continue;
        const distSq = (m.x - proj.x) ** 2 + (m.y - proj.y) ** 2;
        if (distSq < 1.8 && Math.abs(m.elevation + 0.6 - proj.z) < 1.8) {
          hitMonster = true;
          m.hp -= proj.damage;
          m.hurtUntilTime = now + 240;

          // Knockback along projectile line
          const pMag = Math.hypot(proj.vx, proj.vy) || 1;
          m.x += (proj.vx / pMag) * 1.4;
          m.y += (proj.vy / pMag) * 1.4;
          sounds.playMonsterHit();
          onProjectileHitMonster?.(proj, m);

          if (m.hp <= 0) {
            m.state = 'dead';
            sounds.playMonsterDeath();
            onMonsterDefeated(m);
          }
          break;
        }
      }

      const floorElev = getTerrainHeight(proj.x, proj.y, settings);
      if (hitMonster || proj.z < floorElev || proj.distanceTraveled >= proj.maxDistance) {
        projs.splice(i, 1);
        if (onSyncProjectiles) {
          onSyncProjectiles([...projs]);
        }
      }
    }

    // --- MONSTERS AI & COMBAT ---
    const px = p.x;
    const py = p.y;
    for (const m of monstersRef.current) {
      if (m.state === 'dead') continue;

      const dist = Math.hypot(px - m.x, py - m.y);

      if (dist < m.aggroRange && !inSanctuary) {
        m.state = 'chase';
        m.rotation = Math.atan2(px - m.x, py - m.y);

        if (dist > m.attackRange) {
          const dirX = (px - m.x) / dist;
          const dirY = (py - m.y) / dist;
          m.x += dirX * m.speed * dt;
          m.y += dirY * m.speed * dt;
          m.elevation = getTerrainHeight(m.x, m.y, settings);
        } else {
          // In Attack Range: Strike Player
          if (now - m.lastAttackTime > 1300) {
            m.lastAttackTime = now;
            if (!isDodging) {
              playerCombatRef.current.lastHurtTime = now;
              const newHp = Math.max(0, playerCombatRef.current.hp - m.damage);
              playerCombatRef.current.hp = newHp;
              onPlayerHurt(m.damage, newHp);
              sounds.playPlayerHurt();

              // Knockback push away from monster
              const kbDirX = (px - m.x) / (dist || 1);
              const kbDirY = (py - m.y) / (dist || 1);
              p.x += kbDirX * 1.5;
              p.y += kbDirY * 1.5;
              p.targetX = p.x;
              p.targetY = p.y;
            }
          }
        }
      } else {
        // Patrol near original spawn center (or retreat if player is in holy sanctuary)
        const distPatrol = Math.hypot(m.patrolCenter.x - m.x, m.patrolCenter.y - m.y);
        if (distPatrol > 4) {
          const dirX = (m.patrolCenter.x - m.x) / distPatrol;
          const dirY = (m.patrolCenter.y - m.y) / distPatrol;
          m.x += dirX * (m.speed * 0.45) * dt;
          m.y += dirY * (m.speed * 0.45) * dt;
          m.elevation = getTerrainHeight(m.x, m.y, settings);
          m.rotation = Math.atan2(dirX, dirY);
        }
      }

      // Ward off monsters from placed house & watchtower safe zones
      if (placedStructuresRef?.current) {
        for (const struct of placedStructuresRef.current) {
          if (struct.type === 'house' || struct.type === 'watchtower') {
            const wardRadius = struct.type === 'watchtower' ? 22.0 : 10.0;
            const ds = Math.hypot(m.x - struct.x, m.y - struct.y);
            if (ds < wardRadius && ds > 0.1) {
              const repelX = (m.x - struct.x) / ds;
              const repelY = (m.y - struct.y) / ds;
              m.x += repelX * 5.0 * dt;
              m.y += repelY * 5.0 * dt;
              m.elevation = getTerrainHeight(m.x, m.y, settings);
            }
          }
        }
      }
    }

    // --- LOOT DROPS VACUUM ATTRACTION (Enhanced by Pack Harmony / Bone Flute perk) ---
    const drops = lootDropsRef.current;
    const vacuumDist = activePerks?.companionVacuum ? 9.5 : 4.0;
    const vacuumSpeed = activePerks?.companionVacuum ? 11.0 : 7.5;
    for (let i = drops.length - 1; i >= 0; i--) {
      const drop = drops[i];
      const dist = Math.hypot(px - drop.x, py - drop.y);
      if (dist < vacuumDist) {
        drop.x += (px - drop.x) * vacuumSpeed * dt;
        drop.y += (py - drop.y) * vacuumSpeed * dt;
        drop.z = getTerrainHeight(drop.x, drop.y, settings);
        if (dist < 0.9) {
          onCollectLoot(drop);
          sounds.playLootPickup();
          drops.splice(i, 1);
        }
      }
    }

    // --- SYNC REACT UI OVERLAY AT 10 FPS ---
    if (now - lastSyncTime.current > 100) {
      lastSyncTime.current = now;
      const steps = Math.floor(distWalkedAcc.current);
      if (steps > 0) distWalkedAcc.current -= steps;
      onSyncUI({ x: p.x, y: p.y }, steps);
      onCombatTick(playerCombatRef.current.hp, playerCombatRef.current.stamina);

      if (projectilesRef.current.length !== lastProjCount.current) {
        lastProjCount.current = projectilesRef.current.length;
        onSyncProjectiles?.([...projectilesRef.current]);
      }
    }
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

  // --- Minecraft Dungeons Architecture & Progression State ---
  const [dungeonsStats, setDungeonsStats] = useState<DungeonsPlayerStats>(() => {
    return {
      level: 1,
      xp: 0,
      xpToNextLevel: 120,
      enchantmentPoints: 2,
      emeralds: 180,
      arrows: 45,
      souls: 0,
      maxSouls: 50,
      hp: 180,
      maxHp: 180,
      potionCooldownRemaining: 0,
      potionCooldownMax: 25,
      rollCooldownRemaining: 0,
      rollCooldownMax: 2.5,
      equippedMelee: INITIAL_MELEE,
      equippedRanged: INITIAL_RANGED,
      equippedArmor: INITIAL_ARMOR,
      equippedArtifacts: INITIAL_ARTIFACTS,
      artifactCooldowns: [0, 0, 0],
      powerLevel: 22,
      inventory: [
        ALL_MELEE_WEAPONS.find(w => w.id === 'diamond_sword')!,
        ALL_RANGED_WEAPONS.find(w => w.id === 'firebolt_bow')!,
        ALL_ARTIFACTS.find(a => a.id === 'corrupted_beacon')!,
        ALL_ARTIFACTS.find(a => a.id === 'harvester')!,
        ALL_ARTIFACTS.find(a => a.id === 'iron_hide_amulet')!,
      ].filter(Boolean),
      buffs: {
        mushroomEndTime: 0,
        ironHideEndTime: 0,
        bootsEndTime: 0,
        fireworkLoaded: false,
        potionBarrierEndTime: 0,
      },
      mobsKilled: 0,
      chestsOpened: 0,
      emeraldsCollected: 0,
    };
  });

  const [currentMission, setCurrentMission] = useState<DungeonsMission>(DUNGEONS_MISSIONS[1]); // Creeper Woods
  const [isDungeonsInventoryOpen, setIsDungeonsInventoryOpen] = useState<boolean>(false);
  const [isDungeonsCampOpen, setIsDungeonsCampOpen] = useState<boolean>(false);
  const [isDungeonsMapOpen, setIsDungeonsMapOpen] = useState<boolean>(false);

  // Minecraft Landing Page & Game Screen States
  const [gameScreen, setGameScreen] = useState<GameScreen>('title');
  const [isPauseMenuOpen, setIsPauseMenuOpen] = useState<boolean>(false);
  const [savedWorlds, setSavedWorlds] = useState<SavedWorld[]>(() => {
    try {
      const saved = localStorage.getItem('voxel_nomad_saved_worlds_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    const defaultWorld: SavedWorld = {
      id: 'world_survival_main',
      name: 'My Survival World',
      seed: 1337,
      gameMode: 'survival',
      biome: 'hills',
      difficulty: 'normal',
      dayNightCycle: true,
      powerLevel: 1,
      level: 1,
      lastPlayed: Date.now(),
      createdDate: new Date().toISOString().split('T')[0],
    };
    return [defaultWorld];
  });
  const [currentWorld, setCurrentWorld] = useState<SavedWorld | null>(() => {
    try {
      const saved = localStorage.getItem('voxel_nomad_saved_worlds_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      }
    } catch (e) {}
    return null;
  });

  // Character Customization & Stats Sheet Modal State
  const [characterCustomization, setCharacterCustomization] = useState<CharacterCustomization>(() => {
    try {
      const saved = localStorage.getItem('voxel_nomad_character_customization');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      skinColor: '#FACC9A',
      shirtColor: '#15803d',
      pantsColor: '#37305C',
      hairColor: '#3d2314',
      hairStyle: 'explorer_hat',
      capeStyle: 'royal_red',
      showArmor: true,
      title: 'Hero of the Realm',
    };
  });
  const [isCharacterSheetOpen, setIsCharacterSheetOpen] = useState<boolean>(false);

  // Village Trading State & Modals
  const [isVillageTradeOpen, setIsVillageTradeOpen] = useState<boolean>(false);
  const [activeTradeVillager, setActiveTradeVillager] = useState<Monster | null>(null);

  // Save Character Customization when updated
  useEffect(() => {
    try {
      localStorage.setItem('voxel_nomad_character_customization', JSON.stringify(characterCustomization));
    } catch (e) {}
  }, [characterCustomization]);

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
  const [settingsTab, setSettingsTab] = useState<'options' | 'tutorial'>('options');
  const [activeTab, setActiveTab] = useState<'relics' | 'armory' | 'waystones' | 'camp' | 'quests' | 'stats'>('relics');
  const [selectedRelicDetail, setSelectedRelicDetail] = useState<Relic | null>(null);

  // Permanent campfire forge upgrade bonus
  const [weaponBonusDmg, setWeaponBonusDmg] = useState<number>(0);

  // Floating Banner notification
  const [notification, setNotification] = useState<{ text: string; sub?: string } | null>(null);

  // Active Relic Blessings Calculation (Interconnected game passives)
  const activePerks = useMemo(() => {
    const has = (id: string) => inventory.some(r => r.id === id);
    return {
      maxHpBonus: has('oak_heart_seed') ? 25 : 0,
      campfireHealMultiplier: has('oak_heart_seed') ? 1.5 : 1.0,
      sonarRangeMultiplier: has('verdant_compass') ? 1.5 : 1.0,
      lanternBoost: has('lunar_moth_amber'),
      maxStaminaBonus: has('frost_quartz_core') ? 30 : 0,
      staminaRegenMultiplier: has('frost_quartz_core') ? 1.35 : 1.0,
      speedMultiplier: has('cloud_feather_talisman') ? 1.2 : 1.0,
      dashCostMultiplier: has('cloud_feather_talisman') ? 0.6 : 1.0,
      chimeSecrets: has('echoing_geode'),
      goldMultiplier: has('sunstone_scarab') ? 1.6 : 1.0,
      potionHealBonus: has('oasis_teardrop_vial') ? 30 : 0,
      cooldownMultiplier: has('chronos_hourglass') ? 0.75 : 1.0,
      critChanceBonus: has('fallen_star_shard') ? 0.25 : 0.0,
      xpMultiplier: has('celestial_astrolabe') ? 1.5 : 1.0,
      companionVacuum: has('petrified_bone_flute') || companion.happiness >= 60,
    };
  }, [inventory, companion.happiness]);

  // Awakened Obelisks (Waystones for Fast Travel & Sanctuary)
  const awakenedObelisks = useMemo(() => {
    return features.filter(f => f.type === 'obelisk' && f.active);
  }, [features]);

  // Player Navigation & Movement
  const [charPos, setCharPos] = useState<Position>({ x: 0, y: 0 });
  const [playerChunk, setPlayerChunk] = useState<{ cx: number; cz: number }>({ cx: 0, cz: 0 });
  const [targetPos, setTargetPos] = useState<Position>({ x: 0, y: 0 });
  const [cameraZoom, setCameraZoom] = useState<number>(ZOOM_DEFAULT);
  const [cameraPan, setCameraPan] = useState<Position>({ x: 0, y: 0 });

  const playerMotionRef = useRef<PlayerMotionState>({
    x: 0,
    y: 0,
    elevation: 0,
    targetX: 0,
    targetY: 0,
    rotation: 0,
    isMoving: false,
    chunk: { cx: 0, cz: 0 },
  });
  const cameraPanRef = useRef<Position>({ x: 0, y: 0 });
  cameraPanRef.current = cameraPan;

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

  // Combat State & Weapons
  const [activeWeaponIndex, setActiveWeaponIndex] = useState<number>(0);
  const activeWeapon = ALL_WEAPONS[activeWeaponIndex] || ALL_WEAPONS[0];

  // Progressive Structures & Building State
  const [placedStructures, setPlacedStructures] = useState<PlacedStructure[]>([]);
  const placedStructuresRef = useRef<PlacedStructure[]>([]);
  placedStructuresRef.current = placedStructures;

  const [isBuildDrawerOpen, setIsBuildDrawerOpen] = useState<boolean>(false);
  const [activeBuildTab, setActiveBuildTab] = useState<'structures' | 'forge' | 'resources'>('structures');
  const [selectedBlueprint, setSelectedBlueprint] = useState<BuildableStructureBlueprint | null>(null);
  const [buildMode, setBuildMode] = useState<boolean>(false);
  const [buildRotation, setBuildRotation] = useState<number>(0);

  // Check if player has required materials for a structure blueprint
  const canAffordBlueprint = useCallback((bp: BuildableStructureBlueprint | null) => {
    if (!bp) return false;
    const res = stats.resources || { wood: 0, stone: 0, iron: 0, bone: 0, silk: 0, crystal: 0 };
    const cost = bp.cost || (bp as any).requirements || {};
    if (cost.wood && (res.wood || 0) < cost.wood) return false;
    if (cost.stone && (res.stone || 0) < cost.stone) return false;
    if (cost.iron && (res.iron || 0) < cost.iron) return false;
    if (cost.bone && (res.bone || 0) < cost.bone) return false;
    if (cost.silk && (res.silk || 0) < cost.silk) return false;
    if (cost.crystal && (res.crystal || 0) < cost.crystal) return false;
    if (cost.gold && stats.gold < cost.gold) return false;
    return true;
  }, [stats.resources, stats.gold]);

  // Check if player has required materials for weapon recipe
  const canAffordRecipe = useCallback((recipe: WeaponRecipe) => {
    const res = stats.resources || { wood: 0, stone: 0, iron: 0, bone: 0, silk: 0, crystal: 0 };
    if (recipe.cost.wood && (res.wood || 0) < recipe.cost.wood) return false;
    if (recipe.cost.stone && (res.stone || 0) < recipe.cost.stone) return false;
    if (recipe.cost.iron && (res.iron || 0) < recipe.cost.iron) return false;
    if (recipe.cost.bone && (res.bone || 0) < recipe.cost.bone) return false;
    if (recipe.cost.silk && (res.silk || 0) < recipe.cost.silk) return false;
    if (recipe.cost.crystal && (res.crystal || 0) < recipe.cost.crystal) return false;
    if (recipe.cost.gold && stats.gold < recipe.cost.gold) return false;
    return true;
  }, [stats.resources, stats.gold]);

  // Check if player is near any placed structure (for interactive prompts)
  const nearbyPlacedStructure = useMemo(() => {
    let closest: PlacedStructure | null = null;
    let minDist = Infinity;
    for (const struct of placedStructures) {
      const dist = Math.hypot(struct.x - charPos.x, struct.y - charPos.y);
      if (dist < minDist) {
        minDist = dist;
        closest = struct;
      }
    }
    return { structure: closest, dist: minDist };
  }, [placedStructures, Math.round(charPos.x * 2) / 2, Math.round(charPos.y * 2) / 2]);

  // Build Preview Calculation for holographic placement in WorldFeaturesManager
  const buildPreview = useMemo(() => {
    if (!buildMode || !selectedBlueprint) return null;
    const p = playerMotionRef.current;
    const forwardX = Math.sin(p.rotation);
    const forwardY = Math.cos(p.rotation);
    const placeDist = 3.5;
    const px = Math.round((p.x + forwardX * placeDist) * 2) / 2;
    const py = Math.round((p.y + forwardY * placeDist) * 2) / 2;
    const pelev = getTerrainHeight(px, py, settings);
    return {
      type: selectedBlueprint.type,
      x: px,
      y: py,
      elevation: pelev,
      rotation: buildRotation,
      canAfford: canAffordBlueprint(selectedBlueprint),
    };
  }, [buildMode, selectedBlueprint, Math.round(charPos.x), Math.round(charPos.y), buildRotation, canAffordBlueprint, settings]);

  // Equip weapon checking unlock state
  const selectWeaponByIndex = (idx: number) => {
    const targetWeapon = ALL_WEAPONS[idx];
    if (!targetWeapon) return;
    const unlocked = stats.unlockedWeapons || ['starter_club'];
    if (!unlocked.includes(targetWeapon.id)) {
      showToast(`🔒 ${targetWeapon.name} is Locked!`, 'Forge it at a Workbench using looted monster drops');
      setIsBuildDrawerOpen(true);
      setActiveBuildTab('forge');
      return;
    }
    setActiveWeaponIndex(idx);
    showToast(`⚔️ Equipped: ${targetWeapon.name}`);
  };

  // Procedural Monsters & Bosses
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const monstersRef = useRef<Monster[]>([]);
  const chunkMonstersMap = useRef<Map<string, Monster[]>>(new Map());

  // Nearest Friendly Villager or Trader for Trade Interaction
  const nearVillager = useMemo(() => {
    let closest: Monster | null = null;
    let minDist = Infinity;
    for (const m of monsters) {
      if (m.state === 'dead') continue;
      if (m.type !== 'villager' && m.type !== 'trader') continue;
      const d = Math.hypot(m.x - charPos.x, m.y - charPos.y);
      if (d < 4.5 && d < minDist) {
        minDist = d;
        closest = m;
      }
    }
    return closest;
  }, [monsters, Math.round(charPos.x * 2) / 2, Math.round(charPos.y * 2) / 2]);

  // Projectiles & Combat FX
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);

  // Loot Drops (XP Crystals, Gold Coins, Health Potions)
  const [lootDrops, setLootDrops] = useState<LootDrop[]>([]);
  const lootDropsRef = useRef<LootDrop[]>([]);

  // Player Real-time Combat Status (Runs lockstep at 60 FPS in Three.js)
  const playerCombatRef = useRef({
    hp: 100,
    maxHp: 100,
    stamina: 100,
    maxStamina: 100,
    isDodging: false,
    dodgeEndTime: 0,
    lastAttackTime: 0,
    lastHurtTime: 0,
  });

  // Anti-Cheat & Anti-Exploit Cooldown Tracking
  const lastPotionTimeRef = useRef<number>(0);
  const lastCampfirePitchTimeRef = useRef<number>(0);
  const lastShelterRestTimeRef = useRef<number>(0);

  // Weapon Attack Swing Animation Ref
  const attackAnimRef = useRef<{
    isAttacking: boolean;
    startTime: number;
    duration: number;
    attackType?: 'melee' | 'ranged';
    comboStep?: number;
  }>({
    isAttacking: false,
    startTime: 0,
    duration: 250,
    attackType: 'melee',
    comboStep: 0,
  });
  const comboStepRef = useRef<number>(0);
  const lastAttackTimeRef = useRef(0);

  // Screen Hurt Flash Vignette
  const [isHurtFlash, setIsHurtFlash] = useState<boolean>(false);

  // Load Saved Game
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.stats) {
          const loadedStats = { ...INITIAL_STATS, ...parsed.stats };
          loadedStats.resources = {
            ...INITIAL_STATS.resources,
            ...(parsed.stats.resources || {}),
          };
          loadedStats.unlockedWeapons = parsed.stats.unlockedWeapons || ['starter_club'];
          setStats(loadedStats);
          playerCombatRef.current.hp = loadedStats.hp ?? 100;
          playerCombatRef.current.maxHp = loadedStats.maxHp ?? 100;
          playerCombatRef.current.stamina = loadedStats.stamina ?? 100;
          playerCombatRef.current.maxStamina = loadedStats.maxStamina ?? 100;
        }
        if (parsed.placedStructures) setPlacedStructures(parsed.placedStructures);
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
          const initialChunk = {
            cx: Math.floor(parsed.charPos.x / 24),
            cz: Math.floor(parsed.charPos.y / 24),
          };
          setPlayerChunk(initialChunk);
          playerMotionRef.current = {
            x: parsed.charPos.x,
            y: parsed.charPos.y,
            elevation: getTerrainHeight(parsed.charPos.x, parsed.charPos.y, settings),
            targetX: parsed.charPos.x,
            targetY: parsed.charPos.y,
            rotation: 0,
            isMoving: false,
            chunk: initialChunk,
          };
        }
      }
    } catch (e) {
      console.error('Failed to load save', e);
    }
  }, []);

  // Debounced Auto-Save to localStorage
  useEffect(() => {
    const handler = setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            stats: {
              ...stats,
              hp: Math.round(playerCombatRef.current.hp),
              stamina: Math.round(playerCombatRef.current.stamina),
            },
            inventory,
            quests,
            settings,
            charPos,
            placedStructures,
          })
        );
      } catch (e) {
        // Ignore
      }
    }, 1500);
    return () => clearTimeout(handler);
  }, [stats, inventory, quests, settings, charPos, placedStructures]);

  // Sync Audio Setting
  useEffect(() => {
    sounds.enabled = settings.soundEnabled ?? true;
  }, [settings.soundEnabled]);

  // Minecraft World Management Handlers
  const handlePlayWorld = (world: SavedWorld) => {
    dungeonsAudio.playButtonClick();
    setCurrentWorld(world);
    setSettings(prev => ({
      ...prev,
      seed: world.seed,
      terrainType: world.biome as any,
      dayNightCycle: world.dayNightCycle,
    }));
    const updated = savedWorlds.map(w =>
      w.id === world.id
        ? {
            ...w,
            lastPlayed: Date.now(),
            level: dungeonsStats.level,
            powerLevel: dungeonsStats.powerLevel,
          }
        : w
    );
    setSavedWorlds(updated);
    try {
      localStorage.setItem('voxel_nomad_saved_worlds_v1', JSON.stringify(updated));
    } catch (e) {}
    setGameScreen('playing');
    setIsPauseMenuOpen(false);
    showToast(`⚔️ Entered: ${world.name}`, `Mode: ${world.gameMode.toUpperCase()} • Biome: ${world.biome.toUpperCase()}`);
  };

  const handleCreateWorld = (newWorldData: Omit<SavedWorld, 'id' | 'lastPlayed' | 'createdDate'>) => {
    const newWorld: SavedWorld = {
      ...newWorldData,
      id: `world_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      lastPlayed: Date.now(),
      createdDate: new Date().toISOString().split('T')[0],
      level: 1,
      powerLevel: 1,
    };
    const updated = [newWorld, ...savedWorlds];
    setSavedWorlds(updated);
    try {
      localStorage.setItem('voxel_nomad_saved_worlds_v1', JSON.stringify(updated));
    } catch (e) {}
    handlePlayWorld(newWorld);
  };

  const handleDeleteWorld = (worldId: string) => {
    const updated = savedWorlds.filter(w => w.id !== worldId);
    setSavedWorlds(updated);
    try {
      localStorage.setItem('voxel_nomad_saved_worlds_v1', JSON.stringify(updated));
    } catch (e) {}
    if (currentWorld?.id === worldId) {
      setCurrentWorld(updated[0] || null);
    }
  };

  const handleSaveAndQuit = () => {
    dungeonsAudio.playButtonClick();
    if (currentWorld) {
      const updated = savedWorlds.map(w =>
        w.id === currentWorld.id
          ? {
              ...w,
              lastPlayed: Date.now(),
              level: dungeonsStats.level,
              powerLevel: dungeonsStats.powerLevel,
            }
          : w
      );
      setSavedWorlds(updated);
      try {
        localStorage.setItem('voxel_nomad_saved_worlds_v1', JSON.stringify(updated));
      } catch (e) {}
    }
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          stats: {
            ...stats,
            hp: Math.round(playerCombatRef.current.hp),
            stamina: Math.round(playerCombatRef.current.stamina),
          },
          inventory,
          quests,
          settings,
          charPos,
          placedStructures,
          dungeonsStats,
        })
      );
    } catch (e) {}
    setIsPauseMenuOpen(false);
    setGameScreen('title');
    showToast('💾 World Saved', 'Returned to Title Screen');
  };

  // Dynamic Chunk Features & Monsters Generator - Runs when entering a new chunk!
  useEffect(() => {
    const currentChunkX = playerChunk.cx;
    const currentChunkZ = playerChunk.cz;
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

          // Generate Mobs & Monsters for this chunk
          const chunkMobs = generateChunkMonsters(
            cx,
            cz,
            settings.seed,
            (wx, wz) => getTerrainHeight(wx, wz, settings),
            isNight
          );
          chunkMonstersMap.current.set(key, chunkMobs);
        }
      }
    }

    if (newFeatures.length > 0) {
      setFeatures(prev => [...prev, ...newFeatures]);
    }

    // Refresh active live monsters in player chunk horizon
    const activeMobs: Monster[] = [];
    for (let cx = currentChunkX - renderDist; cx <= currentChunkX + renderDist; cx++) {
      for (let cz = currentChunkZ - renderDist; cz <= currentChunkZ + renderDist; cz++) {
        const key = `${cx}_${cz}`;
        const cached = chunkMonstersMap.current.get(key);
        if (cached) {
          activeMobs.push(...cached.filter(m => m.state !== 'dead'));
        }
      }
    }
    monstersRef.current = activeMobs;
    setMonsters([...activeMobs]);
  }, [playerChunk.cx, playerChunk.cz, settings.renderDistance, settings.seed, isNight]);

  // Check Nearby Features for Companion and Compass
  const nearbyFeature = useMemo(() => {
    let closest: WorldFeature | null = null;
    let minDist = Infinity;

    for (let i = 0; i < features.length; i++) {
      const f = features[i];
      if (f.active) continue; // already solved
      const dx = f.x - charPos.x;
      const dz = f.y - charPos.y;
      const d = Math.hypot(dx, dz);
      if (d < minDist) {
        minDist = d;
        closest = f;
      }
    }

    return { feature: closest, dist: minDist };
  }, [features, Math.round(charPos.x * 2) / 2, Math.round(charPos.y * 2) / 2]);

  // Update Companion Alert only when entering or leaving vicinity
  useEffect(() => {
    const hasNearby = nearbyFeature.feature && nearbyFeature.dist < 18;
    const detectedId = hasNearby ? nearbyFeature.feature!.id : undefined;

    setCompanion(prev => {
      if (prev.detectedFeatureId === detectedId) return prev;
      return {
        ...prev,
        mood: detectedId ? 'excited' : 'happy',
        detectedFeatureId: detectedId,
      };
    });
  }, [nearbyFeature.feature?.id, nearbyFeature.dist < 18]);

  // Show Toast Notification
  const showToast = useCallback((text: string, sub?: string) => {
    setNotification({ text, sub });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  }, []);

  // --- PROGRESSION & QUEST ENGINE ---

  // Add XP and level up both Wilderness Nomad & Minecraft Dungeons Hero
  const addXP = useCallback((amount: number, reason?: string) => {
    if (amount <= 0) return;

    // 1. Update stats (Nomad Explorer level)
    setStats(prev => {
      const newXP = prev.xp + amount;
      const nextLevelThreshold = prev.level * 120;
      if (newXP >= nextLevelThreshold) {
        sounds.playLevelUp();
        return {
          ...prev,
          level: prev.level + 1,
          xp: newXP - nextLevelThreshold,
        };
      }
      return { ...prev, xp: newXP };
    });

    // 2. Update dungeonsStats (Dungeons Hero Level, XP bar & Enchantment Points)
    setDungeonsStats(prev => {
      let curXp = prev.xp + amount;
      let curLevel = prev.level;
      let curXpNeeded = prev.xpToNextLevel;
      let curEnchantPts = prev.enchantmentPoints;
      let leveledUp = false;

      while (curXp >= curXpNeeded) {
        curXp -= curXpNeeded;
        curLevel += 1;
        curEnchantPts += 1;
        curXpNeeded = Math.round(curLevel * 120);
        leveledUp = true;
      }

      if (leveledUp) {
        sounds.playLevelUp();
        dungeonsAudio.playLevelUp();
        confetti({
          particleCount: 80,
          spread: 85,
          origin: { y: 0.6 },
          colors: ['#22c55e', '#ffd700', '#38bdf8', '#c084fc', '#f59e0b'],
        });
        showToast(
          `⭐ HERO LEVEL UP! Reached Level ${curLevel}!`,
          `+1 Enchantment Point awarded (Total: ${curEnchantPts} pt)`
        );

        if (playerCombatRef.current) {
          playerCombatRef.current.hp = prev.maxHp;
          playerCombatRef.current.stamina = playerCombatRef.current.maxStamina;
        }

        return {
          ...prev,
          level: curLevel,
          xp: curXp,
          xpToNextLevel: curXpNeeded,
          enchantmentPoints: curEnchantPts,
          hp: prev.maxHp,
        };
      }

      return {
        ...prev,
        xp: curXp,
      };
    });
  }, [showToast]);

  // Update Quest Progress helper with reward distribution
  const updateQuestProgress = useCallback((questId: string, amount: number) => {
    setQuests(prev =>
      prev.map(q => {
        if (q.id === questId && !q.completed) {
          const nextVal = Math.min(q.target, q.progress + amount);
          if (nextVal >= q.target) {
            sounds.playChestOpen();
            dungeonsAudio.playMissionComplete();
            confetti({
              particleCount: 75,
              spread: 80,
              origin: { y: 0.5 },
              colors: ['#ffd700', '#22c55e', '#38bdf8'],
            });
            addXP(q.xpReward, `Quest: ${q.title}`);

            const bonusEmeralds = Math.round(q.xpReward * 0.75);
            setDungeonsStats(d => ({ ...d, emeralds: d.emeralds + bonusEmeralds }));

            showToast(
              `🏆 Quest Completed: ${q.title}!`,
              `+${q.xpReward} XP & +${bonusEmeralds} 💎 Emeralds awarded!`
            );
            return { ...q, progress: q.target, completed: true };
          }
          return { ...q, progress: nextVal };
        }
        return q;
      })
    );
  }, [addXP, showToast]);

  // Stable UI and Chunk synchronization callbacks for GameLoopController
  const handleSyncUI = useCallback((pos: { x: number; y: number }, steps: number) => {
    setCharPos({ x: pos.x, y: pos.y });
    if (steps > 0) {
      setStats(s => ({
        ...s,
        stepsWalked: s.stepsWalked + steps,
        xp: s.xp + steps,
        level: Math.floor((s.xp + steps) / 100) + 1,
      }));
      updateQuestProgress('quest_wanderlust', steps);
    }
  }, [updateQuestProgress]);

  const handleCombatTick = useCallback((hp: number, stamina: number) => {
    setStats(prev => {
      if (Math.abs(prev.hp - hp) > 0.5 || Math.abs(prev.stamina - stamina) > 1) {
        return { ...prev, hp: Math.round(hp), stamina: Math.round(stamina) };
      }
      return prev;
    });
  }, []);

  const handleChunkChange = useCallback((chunk: { cx: number; cz: number }) => {
    setPlayerChunk(chunk);
  }, []);

  // --- MINECRAFT DUNGEONS POWER LEVEL & COOLDOWNS ---

  // Dynamic Power Level calculation
  const calculatePowerLevel = useCallback((
    melee: DungeonsGearItem,
    ranged: DungeonsGearItem,
    armor: DungeonsGearItem,
    artifacts: [DungeonsArtifact | null, DungeonsArtifact | null, DungeonsArtifact | null]
  ) => {
    let sum = melee.power + ranged.power + armor.power;
    let count = 3;
    artifacts.forEach(a => {
      if (a) {
        sum += a.power;
        count++;
      }
    });
    return Math.max(1, Math.round(sum / count));
  }, []);

  // Sync Power Level & Max HP
  useEffect(() => {
    const pLvl = calculatePowerLevel(
      dungeonsStats.equippedMelee,
      dungeonsStats.equippedRanged,
      dungeonsStats.equippedArmor,
      dungeonsStats.equippedArtifacts
    );
    const bonusHp = (dungeonsStats.equippedArmor.hpBonus || 0) + dungeonsStats.level * 15;
    const targetMaxHp = 180 + bonusHp;

    if (dungeonsStats.powerLevel !== pLvl || dungeonsStats.maxHp !== targetMaxHp) {
      setDungeonsStats(prev => ({
        ...prev,
        powerLevel: pLvl,
        maxHp: targetMaxHp,
      }));
      if (playerCombatRef.current) {
        playerCombatRef.current.maxHp = targetMaxHp;
      }
    }
  }, [
    dungeonsStats.equippedMelee,
    dungeonsStats.equippedRanged,
    dungeonsStats.equippedArmor,
    dungeonsStats.equippedArtifacts,
    dungeonsStats.level,
    calculatePowerLevel,
  ]);

  // Continuous Cooldown Countdown Timer (Potion, Roll, Artifacts)
  useEffect(() => {
    const timer = setInterval(() => {
      setDungeonsStats(prev => {
        let changed = false;
        let newPotCd = prev.potionCooldownRemaining;
        let newRollCd = prev.rollCooldownRemaining;
        const newArtCds = [...prev.artifactCooldowns] as [number, number, number];

        if (newPotCd > 0) {
          newPotCd = Math.max(0, newPotCd - 0.2);
          changed = true;
        }
        if (newRollCd > 0) {
          newRollCd = Math.max(0, newRollCd - 0.2);
          changed = true;
        }
        for (let i = 0; i < 3; i++) {
          if (newArtCds[i] > 0) {
            newArtCds[i] = Math.max(0, newArtCds[i] - 0.2);
            changed = true;
          }
        }

        const curHp = playerCombatRef.current ? Math.round(playerCombatRef.current.hp) : prev.hp;
        if (curHp !== prev.hp) {
          changed = true;
        }

        if (!changed) return prev;
        return {
          ...prev,
          hp: curHp,
          potionCooldownRemaining: Number(newPotCd.toFixed(1)),
          rollCooldownRemaining: Number(newRollCd.toFixed(1)),
          artifactCooldowns: [
            Number(newArtCds[0].toFixed(1)),
            Number(newArtCds[1].toFixed(1)),
            Number(newArtCds[2].toFixed(1)),
          ],
        };
      });
    }, 200);

    return () => clearInterval(timer);
  }, []);

  // 1. Artifact Activation (Slots 1, 2, 3)
  const handleActivateArtifact = useCallback((slotIndex: number) => {
    const artifact = dungeonsStats.equippedArtifacts[slotIndex];
    if (!artifact) {
      setIsDungeonsInventoryOpen(true);
      showToast('Open Inventory (I) to equip an Artifact!');
      return;
    }
    if (dungeonsStats.artifactCooldowns[slotIndex] > 0) {
      showToast(`⏳ ${artifact.name} is on cooldown (${Math.ceil(dungeonsStats.artifactCooldowns[slotIndex])}s)!`);
      return;
    }
    if (artifact.soulCost && dungeonsStats.souls < artifact.soulCost) {
      showToast(`👻 Not enough Souls! Required: ${artifact.soulCost} souls.`);
      return;
    }

    const now = performance.now();

    setDungeonsStats(prev => {
      const nextCds = [...prev.artifactCooldowns] as [number, number, number];
      nextCds[slotIndex] = artifact.cooldownSec;
      return {
        ...prev,
        souls: artifact.soulCost ? Math.max(0, prev.souls - artifact.soulCost) : prev.souls,
        artifactCooldowns: nextCds,
      };
    });

    dungeonsAudio.playArtifactCast();

    const p = playerMotionRef.current;
    const forwardX = Math.sin(p.rotation);
    const forwardY = Math.cos(p.rotation);

    if (artifact.id === 'death_cap_mushroom') {
      setDungeonsStats(prev => ({
        ...prev,
        buffs: { ...prev.buffs, mushroomEndTime: now + 9000 },
      }));
      confetti({ particleCount: 30, spread: 50, colors: ['#ef4444', '#f97316'] });
      showToast('🍄 Frenzy Spores Unleashed!', '+100% Attack Speed for 9s!');
    } else if (artifact.id === 'fireworks_arrow') {
      setDungeonsStats(prev => ({
        ...prev,
        buffs: { ...prev.buffs, fireworkLoaded: true },
      }));
      showToast('🎆 Fireworks Rocket Loaded!', 'Next bow shot explodes in a massive radius!');
    } else if (artifact.id === 'boots_of_swiftness') {
      setDungeonsStats(prev => ({
        ...prev,
        buffs: { ...prev.buffs, bootsEndTime: now + 4500 },
      }));
      showToast('👢 Swiftness Surge!', '+80% Movement Speed for 4.5s!');
    } else if (artifact.id === 'iron_hide_amulet') {
      setDungeonsStats(prev => ({
        ...prev,
        buffs: { ...prev.buffs, ironHideEndTime: now + 10000 },
      }));
      showToast('🛡️ Iron Hide Protective Aura!', '+50% Armor Defense for 10s!');
    } else if (artifact.id === 'harvester') {
      let hitCount = 0;
      for (const m of monstersRef.current) {
        if (m.state === 'dead') continue;
        const dist = Math.hypot(m.x - p.x, m.y - p.y);
        if (dist <= 6.5) {
          hitCount++;
          m.hp -= 95;
          m.hurtUntilTime = now + 400;
          m.x += ((m.x - p.x) / (dist || 1)) * 3.5;
          m.y += ((m.y - p.y) / (dist || 1)) * 3.5;
          if (m.hp <= 0) {
            m.state = 'dead';
            handleMonsterDefeated(m);
          }
        }
      }
      dungeonsAudio.playFireworkExplosion();
      confetti({ particleCount: 50, spread: 360, colors: ['#a855f7', '#38bdf8'] });
      showToast('🔮 Soul Shockwave Detonated!', 'Enemies blasted with high knockback!');
      if (hitCount > 0) setMonsters([...monstersRef.current]);
    } else if (artifact.id === 'corrupted_beacon') {
      projectilesRef.current.push({
        id: `beacon_${now}`,
        type: 'magic',
        x: p.x + forwardX * 1.0,
        y: p.y + forwardY * 1.0,
        z: p.elevation + 0.8,
        vx: forwardX * 30,
        vy: forwardY * 30,
        vz: 0,
        damage: 110,
        color: '#d946ef',
        distanceTraveled: 0,
        maxDistance: 16,
      });
      setProjectiles([...projectilesRef.current]);
      showToast('⚡ Corrupted Beacon Beam Fired!');
    } else if (artifact.id === 'wind_horn') {
      for (const m of monstersRef.current) {
        if (m.state === 'dead') continue;
        const dist = Math.hypot(m.x - p.x, m.y - p.y);
        if (dist <= 8.0) {
          m.x += ((m.x - p.x) / (dist || 1)) * 4.0;
          m.y += ((m.y - p.y) / (dist || 1)) * 4.0;
          m.hurtUntilTime = now + 300;
        }
      }
      setMonsters([...monstersRef.current]);
      showToast('📯 Wind Horn Blast!', 'Enemies knocked back and staggered!');
    } else if (artifact.id === 'tasty_bone') {
      showToast('🦴 Wolf Companion Rallied!', 'Loyal wolf joined the fray!');
    }
  }, [dungeonsStats.equippedArtifacts, dungeonsStats.artifactCooldowns, dungeonsStats.souls]);

  // 2. Upgrades, Enchantments, Equipping & Salvage Handlers
  const handleUpgradeEnchantment = useCallback((gearId: string, slotIndex: number) => {
    if (dungeonsStats.enchantmentPoints <= 0) {
      showToast('⚠️ No Enchantment Points available! Level up to earn points.');
      return;
    }

    setDungeonsStats(prev => {
      let found = false;
      const updateGear = (gear: DungeonsGearItem): DungeonsGearItem => {
        if (gear.id !== gearId) return gear;
        found = true;
        const ench = gear.enchantmentSlots[slotIndex];
        if (!ench || ench.tier >= 3) return gear;
        const nextEnch = [...gear.enchantmentSlots];
        nextEnch[slotIndex] = { ...ench, tier: ench.tier + 1 };
        return { ...gear, enchantmentSlots: nextEnch };
      };

      const newMelee = updateGear(prev.equippedMelee);
      const newRanged = updateGear(prev.equippedRanged);
      const newArmor = updateGear(prev.equippedArmor);
      const newInv = prev.inventory.map(item => {
        if ('enchantmentSlots' in item && item.id === gearId) {
          return updateGear(item as DungeonsGearItem);
        }
        return item;
      });

      if (!found) return prev;
      dungeonsAudio.playEnchantUpgrade();
      confetti({ particleCount: 30, spread: 60, colors: ['#c084fc', '#a855f7'] });
      showToast('✨ Enchantment Upgraded!');

      return {
        ...prev,
        enchantmentPoints: prev.enchantmentPoints - 1,
        equippedMelee: newMelee,
        equippedRanged: newRanged,
        equippedArmor: newArmor,
        inventory: newInv,
      };
    });
  }, [dungeonsStats.enchantmentPoints]);

  const handleRefundEnchantment = useCallback((gearId: string, slotIndex: number) => {
    setDungeonsStats(prev => {
      let pointsReturned = 0;
      const updateGear = (gear: DungeonsGearItem): DungeonsGearItem => {
        if (gear.id !== gearId) return gear;
        const ench = gear.enchantmentSlots[slotIndex];
        if (!ench || ench.tier <= 0) return gear;
        pointsReturned = ench.tier;
        const nextEnch = [...gear.enchantmentSlots];
        nextEnch[slotIndex] = { ...ench, tier: 0 };
        return { ...gear, enchantmentSlots: nextEnch };
      };

      const newMelee = updateGear(prev.equippedMelee);
      const newRanged = updateGear(prev.equippedRanged);
      const newArmor = updateGear(prev.equippedArmor);
      const newInv = prev.inventory.map(item => {
        if ('enchantmentSlots' in item && item.id === gearId) {
          return updateGear(item as DungeonsGearItem);
        }
        return item;
      });

      if (pointsReturned <= 0) return prev;
      showToast(`🟣 Refunded +${pointsReturned} Enchantment Points!`);
      return {
        ...prev,
        enchantmentPoints: prev.enchantmentPoints + pointsReturned,
        equippedMelee: newMelee,
        equippedRanged: newRanged,
        equippedArmor: newArmor,
        inventory: newInv,
      };
    });
  }, []);

  const handleSalvageItem = useCallback((item: DungeonsItem) => {
    setDungeonsStats(prev => {
      let pointsReturned = 0;
      if ('enchantmentSlots' in item) {
        (item as DungeonsGearItem).enchantmentSlots.forEach(e => {
          pointsReturned += e.tier;
        });
      }

      dungeonsAudio.playEmeraldPickup();
      showToast(`♻️ Salvaged ${item.name} for +${item.salvageEmeralds} Emeralds!`);

      return {
        ...prev,
        emeralds: prev.emeralds + item.salvageEmeralds,
        enchantmentPoints: prev.enchantmentPoints + pointsReturned,
        inventory: prev.inventory.filter(i => i.id !== item.id),
      };
    });
  }, []);

  const handleEquipItem = useCallback((item: DungeonsItem, slotIndex?: number) => {
    setDungeonsStats(prev => {
      const curInv = [...prev.inventory];
      const nextInv = curInv.filter(i => i.id !== item.id);

      if (item.category === 'melee') {
        nextInv.push(prev.equippedMelee);
        dungeonsAudio.playEquipSound();
        showToast(`⚔️ Equipped ${item.name}!`);
        return { ...prev, equippedMelee: item as DungeonsGearItem, inventory: nextInv };
      } else if (item.category === 'ranged') {
        nextInv.push(prev.equippedRanged);
        dungeonsAudio.playEquipSound();
        showToast(`🏹 Equipped ${item.name}!`);
        return { ...prev, equippedRanged: item as DungeonsGearItem, inventory: nextInv };
      } else if (item.category === 'armor') {
        nextInv.push(prev.equippedArmor);
        dungeonsAudio.playEquipSound();
        showToast(`🛡️ Equipped ${item.name}!`);
        return { ...prev, equippedArmor: item as DungeonsGearItem, inventory: nextInv };
      } else if (item.category === 'artifact') {
        const slot = slotIndex !== undefined ? slotIndex : 0;
        const curArt = prev.equippedArtifacts[slot];
        if (curArt) nextInv.push(curArt);
        const nextArtifacts = [...prev.equippedArtifacts] as [DungeonsArtifact | null, DungeonsArtifact | null, DungeonsArtifact | null];
        nextArtifacts[slot] = item as DungeonsArtifact;
        dungeonsAudio.playEquipSound();
        showToast(`✨ Equipped ${item.name} to Artifact Slot ${slot + 1}!`);
        return { ...prev, equippedArtifacts: nextArtifacts, inventory: nextInv };
      }
      return prev;
    });
  }, []);

  // Handle trading with Village Merchants and Peddlers
  const handleExecuteTrade = useCallback((trade: any) => {
    if (trade.type === 'buy_item') {
      if (dungeonsStats.emeralds < (trade.costEmeralds || 0)) {
        showToast('⚠️ Not enough Emeralds to purchase this item!');
        return;
      }
      setDungeonsStats(prev => ({
        ...prev,
        emeralds: prev.emeralds - trade.costEmeralds,
        ...(trade.rewardType === 'arrows'
          ? { arrows: Math.min(150, prev.arrows + (trade.rewardAmount || 30)) }
          : {}),
        ...(trade.rewardType === 'gear' && trade.gearItem
          ? { inventory: [...prev.inventory, trade.gearItem] }
          : {}),
      }));

      if (trade.rewardType === 'food') {
        if (playerCombatRef.current) {
          playerCombatRef.current.hp = Math.min(playerCombatRef.current.maxHp, playerCombatRef.current.hp + 55);
        }
        setDungeonsStats(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + 55) }));
        sounds.playPotionDrink();
        showToast('🍞 Restored +55 HP!');
      } else if (trade.rewardType === 'arrows') {
        sounds.playLootPickup();
        showToast(`🏹 +${trade.rewardAmount || 30} Arrows stocked!`);
      } else if (trade.rewardType === 'gear') {
        sounds.playChestOpen();
        confetti({ particleCount: 35, spread: 60 });
        showToast(`🎁 Acquired Gear: ${trade.gearItem.name}!`);
      } else if (trade.rewardType === 'potion') {
        setStats(prev => ({ ...prev, potions: prev.potions + 1 }));
        sounds.playPotionDrink();
        showToast('🧪 Restocked Healing Flask!');
      } else if (trade.rewardType === 'artifact') {
        sounds.playChestOpen();
        showToast(`✨ Acquired Relic: ${trade.name}!`);
      }
      dungeonsAudio.playEmeraldPickup();
    } else if (trade.type === 'sell_material' && trade.costMaterial) {
      const matKey = trade.costMaterial.key;
      const curAmt = stats.resources?.[matKey] || 0;
      if (curAmt < trade.costMaterial.amount) {
        showToast(`⚠️ Need at least ${trade.costMaterial.amount}x ${trade.costMaterial.name}!`);
        return;
      }
      setStats(prev => ({
        ...prev,
        resources: {
          ...prev.resources,
          [matKey]: (prev.resources[matKey] || 0) - trade.costMaterial.amount,
        },
      }));
      setDungeonsStats(prev => ({
        ...prev,
        emeralds: prev.emeralds + (trade.rewardEmeralds || 5),
      }));
      dungeonsAudio.playEmeraldPickup();
      showToast(`🪙 Sold ${trade.costMaterial.name} for +${trade.rewardEmeralds} Emeralds!`);
    }
  }, [dungeonsStats.emeralds, stats.resources]);

  // --- COMBAT ACTIONS ---

  // 1. Primary Weapon Attack Action with Dungeons Melee Weapon Scaling, Combo Swings & Special Perks
  const handlePlayerAttack = useCallback(() => {
    const now = performance.now();
    const equippedMelee = dungeonsStats.equippedMelee;
    const fallbackWeapon = ALL_WEAPONS[activeWeaponIndex] || ALL_WEAPONS[0];

    // Compute effective attack speed and cooldown
    const baseCooldown = equippedMelee
      ? Math.max(160, 1000 / (equippedMelee.attackSpeed || 1.6))
      : fallbackWeapon.cooldown;
    const effectiveCooldown = baseCooldown * (activePerks.cooldownMultiplier || 1.0);
    if (now - lastAttackTimeRef.current < effectiveCooldown) return;

    const stamCost = equippedMelee?.subType === 'claymore' ? 12 : equippedMelee?.subType === 'gauntlets' ? 4 : 7;
    if (playerCombatRef.current.stamina < stamCost) {
      showToast('⚠️ Out of Stamina! Rest a moment.');
      return;
    }

    // Reset combo if idle > 1.2s
    if (now - lastAttackTimeRef.current > 1200) {
      comboStepRef.current = 0;
    }
    const currentCombo = comboStepRef.current;
    comboStepRef.current = (currentCombo + 1) % 3;

    // Deduct stamina & record attack time
    playerCombatRef.current.stamina -= stamCost;
    lastAttackTimeRef.current = now;

    // Trigger arm swing & slash animation
    attackAnimRef.current = {
      isAttacking: true,
      startTime: now,
      duration: Math.min(320, effectiveCooldown * 0.9),
      attackType: 'melee',
      comboStep: currentCombo,
    };

    const p = playerMotionRef.current;
    const rot = p.rotation;
    const forwardX = Math.sin(rot);
    const forwardY = Math.cos(rot);

    // Compute weapon damage based on equipped melee gear + power level + perks
    const baseDmg = equippedMelee
      ? (equippedMelee.damage || 35) * (1 + (dungeonsStats.powerLevel - 1) * 0.05) + weaponBonusDmg
      : fallbackWeapon.damage + weaponBonusDmg;

    // Combo step 2 finisher deals +40% damage
    const comboMult = currentCombo === 2 ? 1.4 : currentCombo === 1 ? 1.15 : 1.0;
    const totalWeaponDmg = baseDmg * comboMult;
    const weaponRange = equippedMelee ? (equippedMelee.range || 3.2) : fallbackWeapon.range;

    sounds.playSwordSwing();

    // Hit detection in front cone
    let hitCount = 0;
    const isSwirlingFinisher = currentCombo === 2 && equippedMelee?.enchantmentSlots?.some(s => s.id === 'swirling');

    for (const m of monstersRef.current) {
      if (m.state === 'dead') continue;
      const dx = m.x - p.x;
      const dy = m.y - p.y;
      const dist = Math.hypot(dx, dy);

      // Swirling finisher hits 360 degrees around the player
      const inRange = isSwirlingFinisher ? dist <= 3.6 : dist <= weaponRange;
      const dot = (dx * forwardX + dy * forwardY) / (dist || 1);

      if (inRange && (isSwirlingFinisher || dot > -0.25 || dist < 1.4)) {
        hitCount++;
        const isCrit = Math.random() < (0.22 + (activePerks.critChanceBonus || 0));
        const critMult = isCrit ? 2.2 : 1.0;
        const dmg = Math.round(
          (totalWeaponDmg + (Math.random() * 8 - 4)) * critMult
        );
        m.hp -= dmg;
        m.hurtUntilTime = now + 250;

        // Knockback push away from player (stronger on finisher)
        const kbStrength = currentCombo === 2 ? 2.4 : 1.5;
        const kbDist = dist || 1;
        m.x += (dx / kbDist) * kbStrength;
        m.y += (dy / kbDist) * kbStrength;
        sounds.playMonsterHit();

        // Radiance healing burst perk
        if (Math.random() < 0.25 && (equippedMelee?.id === 'suns_grace' || equippedMelee?.enchantmentSlots?.some(s => s.id === 'radiance'))) {
          setDungeonsStats(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + 18) }));
          playerCombatRef.current.hp = Math.min(playerCombatRef.current.maxHp, playerCombatRef.current.hp + 18);
          showToast('✨ Radiance! Healed +18 HP');
        }

        if (m.hp <= 0) {
          m.state = 'dead';
          sounds.playMonsterDeath();
          handleMonsterDefeated(m);

          // Cursed Axe exploding mob perk
          if (equippedMelee?.id === 'cursed_axe') {
            for (const other of monstersRef.current) {
              if (other.state === 'dead' || other.id === m.id) continue;
              const ox = other.x - m.x;
              const oy = other.y - m.y;
              if (Math.hypot(ox, oy) < 4.0) {
                other.hp -= 45;
                other.hurtUntilTime = now + 300;
              }
            }
            showToast('💥 Cursed Blast! Nearby foes damaged');
          }
        }
      }
    }

    if (hitCount > 0) {
      setMonsters([...monstersRef.current]);
    }
  }, [activeWeaponIndex, weaponBonusDmg, activePerks, dungeonsStats.equippedMelee, dungeonsStats.powerLevel]);

  // 1b. Dungeons Ranged Weapon Attack Action (Bow / Crossbow)
  const handleRangedAttack = useCallback(() => {
    if (dungeonsStats.arrows <= 0) {
      showToast('⚠️ Out of Arrows! Defeat monsters or gather supply crates.');
      return;
    }

    const now = performance.now();
    const equippedBow = dungeonsStats.equippedRanged;
    const isFirework = dungeonsStats.buffs.fireworkLoaded;

    // Trigger bow drawing & release animation
    attackAnimRef.current = {
      isAttacking: true,
      startTime: now,
      duration: 320,
      attackType: 'ranged',
      comboStep: 0,
    };

    // Deduct 1 arrow
    setDungeonsStats(prev => ({
      ...prev,
      arrows: Math.max(0, prev.arrows - 1),
      buffs: isFirework ? { ...prev.buffs, fireworkLoaded: false } : prev.buffs,
    }));

    if (isFirework) {
      dungeonsAudio.playFireworkExplosion();
      confetti({ particleCount: 45, spread: 70, colors: ['#f43f5e', '#eab308', '#38bdf8'] });
      showToast('🎆 Fireworks Rocket Launched!', 'Massive area of effect impact!');
    } else {
      dungeonsAudio.playArrowShoot();
    }

    const p = playerMotionRef.current;
    const rot = p.rotation;
    const forwardX = Math.sin(rot);
    const forwardY = Math.cos(rot);

    const baseDmg = (equippedBow.damage || 35) + dungeonsStats.powerLevel * 3;
    const finalDmg = isFirework ? baseDmg * 2.8 : baseDmg;

    projectilesRef.current.push({
      id: `dungeons_arrow_${now}`,
      type: 'arrow',
      x: p.x + forwardX * 0.8,
      y: p.y + forwardY * 0.8,
      z: p.elevation + 0.8,
      vx: forwardX * 28,
      vy: forwardY * 28,
      vz: 0,
      damage: Math.round(finalDmg),
      color: isFirework ? '#f43f5e' : (equippedBow.color || '#facc15'),
      distanceTraveled: 0,
      maxDistance: equippedBow.range || 22,
    });
    setProjectiles([...projectilesRef.current]);
  }, [dungeonsStats.arrows, dungeonsStats.equippedRanged, dungeonsStats.buffs.fireworkLoaded, dungeonsStats.powerLevel]);

  // 2. Dodge Roll / Dash Evade
  const handleDodgeRoll = useCallback(() => {
    const now = performance.now();
    const dashCost = Math.round(20 * (activePerks.dashCostMultiplier || 1.0));
    if (playerCombatRef.current.stamina < dashCost) {
      showToast('⚠️ Not enough Stamina to Dash!');
      return;
    }
    if (now < playerCombatRef.current.dodgeEndTime) return;

    playerCombatRef.current.stamina -= dashCost;
    playerCombatRef.current.dodgeEndTime = now + 350;
    sounds.playDodgeRoll();
  }, [activePerks.dashCostMultiplier]);

  // 3. Drink Health Potion
  const handleDrinkPotion = useCallback(() => {
    if (stats.potions <= 0) {
      showToast('⚠️ Out of Healing Flasks! Defeat monsters or brew at Campfire.');
      return;
    }
    const now = performance.now();
    if (now - lastPotionTimeRef.current < 3500) {
      const cdLeft = ((3500 - (now - lastPotionTimeRef.current)) / 1000).toFixed(1);
      showToast(`⚠️ Healing Flask on cooldown (${cdLeft}s)`);
      return;
    }
    if (playerCombatRef.current.hp >= playerCombatRef.current.maxHp) {
      showToast('✨ Health is already full!');
      return;
    }

    lastPotionTimeRef.current = now;
    const healAmount = 55 + (activePerks.potionHealBonus || 0);
    const restoredHp = Math.min(playerCombatRef.current.maxHp, playerCombatRef.current.hp + healAmount);
    playerCombatRef.current.hp = restoredHp;
    if (activePerks.potionHealBonus > 0) {
      playerCombatRef.current.stamina = Math.min(
        playerCombatRef.current.maxStamina,
        playerCombatRef.current.stamina + 50
      );
    }
    setStats(prev => ({
      ...prev,
      hp: Math.round(restoredHp),
      potions: Math.max(0, prev.potions - 1),
    }));
    sounds.playPotionDrink();
    showToast(
      `🧪 Drank Healing Flask! Restored +${healAmount} HP${activePerks.potionHealBonus > 0 ? ' & +50 STM' : ''}`
    );
  }, [stats.potions, activePerks.potionHealBonus]);

  // 4. Monster Defeated Callback
  const handleMonsterDefeated = useCallback((m: Monster) => {
    const xpBonusMult = activePerks.xpMultiplier || 1.0;
    const goldBonusMult = activePerks.goldMultiplier || 1.0;

    setStats(prev => {
      const newMonstersDefeated = prev.monstersDefeated + 1;
      const baseGold = Math.floor(Math.random() * 10) + 5;
      const newGold = prev.gold + Math.round(baseGold * goldBonusMult);
      const earnedXp = Math.round(m.xpReward * xpBonusMult);
      const newXp = prev.xp + earnedXp;
      const xpNeeded = prev.level * 150;
      let newLevel = prev.level;
      let finalXp = newXp;

      if (newXp >= xpNeeded) {
        newLevel += 1;
        finalXp = newXp - xpNeeded;
        sounds.playLevelUp();
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        showToast(`⭐ LEVEL UP! You reached Level ${newLevel}!`);
      }

      return {
        ...prev,
        monstersDefeated: newMonstersDefeated,
        xp: finalXp,
        gold: newGold,
        level: newLevel,
      };
    });

    // Drop physical progressive loot tailored to monster type
    const newDrops: LootDrop[] = [];

    // Experience Crystal
    newDrops.push({
      id: `loot_xp_${Date.now()}_${Math.random()}`,
      type: 'xp',
      name: 'Experience Crystal',
      icon: '💎',
      x: m.x + (Math.random() - 0.5) * 0.8,
      y: m.y + (Math.random() - 0.5) * 0.8,
      z: m.elevation,
      value: Math.round(m.xpReward * xpBonusMult),
      color: '#22c55e',
      createdAt: performance.now(),
    });

    // Gold Coins (60% chance)
    if (Math.random() > 0.4) {
      newDrops.push({
        id: `loot_gold_${Date.now()}_${Math.random()}`,
        type: 'gold',
        name: 'Gold Coins',
        icon: '🪙',
        x: m.x + (Math.random() - 0.5) * 0.8,
        y: m.y + (Math.random() - 0.5) * 0.8,
        z: m.elevation,
        value: Math.round((Math.floor(Math.random() * 8) + 4) * goldBonusMult),
        color: '#eab308',
        createdAt: performance.now(),
      });
    }

    // Differentiated Progressive Monster Resource Drops
    if (m.type === 'slime') {
      // Slimes drop Wood (digested timber debris) and Healing Flasks
      newDrops.push({
        id: `loot_wood_${Date.now()}_${Math.random()}`,
        type: 'wood',
        name: 'Timber Log',
        icon: '🪵',
        x: m.x + (Math.random() - 0.5) * 0.8,
        y: m.y + (Math.random() - 0.5) * 0.8,
        z: m.elevation,
        value: Math.floor(Math.random() * 2) + 2, // 2-3 Wood
        color: '#854d0e',
        createdAt: performance.now(),
      });
      if (Math.random() > 0.55) {
        newDrops.push({
          id: `loot_pot_${Date.now()}_${Math.random()}`,
          type: 'potion',
          name: 'Healing Flask',
          icon: '🧪',
          x: m.x + (Math.random() - 0.5) * 0.8,
          y: m.y + (Math.random() - 0.5) * 0.8,
          z: m.elevation,
          value: 1,
          color: '#ef4444',
          createdAt: performance.now(),
        });
      }
    } else if (m.type === 'skeleton') {
      // Skeletons drop Sturdy Bone, Quarried Stone, and Iron Ore
      newDrops.push({
        id: `loot_bone_${Date.now()}_${Math.random()}`,
        type: 'bone',
        name: 'Sturdy Bone',
        icon: '🦴',
        x: m.x + (Math.random() - 0.5) * 0.8,
        y: m.y + (Math.random() - 0.5) * 0.8,
        z: m.elevation,
        value: Math.floor(Math.random() * 2) + 2, // 2-3 Bone
        color: '#e2e8f0',
        createdAt: performance.now(),
      });
      newDrops.push({
        id: `loot_iron_${Date.now()}_${Math.random()}`,
        type: 'iron',
        name: 'Iron Ore',
        icon: '⛓️',
        x: m.x + (Math.random() - 0.5) * 0.8,
        y: m.y + (Math.random() - 0.5) * 0.8,
        z: m.elevation,
        value: Math.floor(Math.random() * 2) + 1, // 1-2 Iron
        color: '#94a3b8',
        createdAt: performance.now(),
      });
      if (Math.random() > 0.4) {
        newDrops.push({
          id: `loot_stone_${Date.now()}_${Math.random()}`,
          type: 'stone',
          name: 'Quarried Stone',
          icon: '🪨',
          x: m.x + (Math.random() - 0.5) * 0.8,
          y: m.y + (Math.random() - 0.5) * 0.8,
          z: m.elevation,
          value: 2,
          color: '#64748b',
          createdAt: performance.now(),
        });
      }
    } else if (m.type === 'spider') {
      // Spiders drop Arachnid Silk and Timber
      newDrops.push({
        id: `loot_silk_${Date.now()}_${Math.random()}`,
        type: 'silk',
        name: 'Arachnid Silk',
        icon: '🕸️',
        x: m.x + (Math.random() - 0.5) * 0.8,
        y: m.y + (Math.random() - 0.5) * 0.8,
        z: m.elevation,
        value: Math.floor(Math.random() * 2) + 2, // 2-3 Silk
        color: '#f8fafc',
        createdAt: performance.now(),
      });
      newDrops.push({
        id: `loot_wood_${Date.now()}_${Math.random()}`,
        type: 'wood',
        name: 'Timber Log',
        icon: '🪵',
        x: m.x + (Math.random() - 0.5) * 0.8,
        y: m.y + (Math.random() - 0.5) * 0.8,
        z: m.elevation,
        value: 1,
        color: '#854d0e',
        createdAt: performance.now(),
      });
    } else if (m.type === 'golem') {
      // Ancient Stone Golems drop Iron, Stone, and Arcane Crystal
      newDrops.push({
        id: `loot_iron_${Date.now()}_${Math.random()}`,
        type: 'iron',
        name: 'Iron Ingot',
        icon: '⛓️',
        x: m.x + (Math.random() - 0.5) * 0.8,
        y: m.y + (Math.random() - 0.5) * 0.8,
        z: m.elevation,
        value: Math.floor(Math.random() * 2) + 3, // 3-4 Iron
        color: '#94a3b8',
        createdAt: performance.now(),
      });
      newDrops.push({
        id: `loot_stone_${Date.now()}_${Math.random()}`,
        type: 'stone',
        name: 'Quarried Stone',
        icon: '🪨',
        x: m.x + (Math.random() - 0.5) * 0.8,
        y: m.y + (Math.random() - 0.5) * 0.8,
        z: m.elevation,
        value: Math.floor(Math.random() * 3) + 4, // 4-6 Stone
        color: '#64748b',
        createdAt: performance.now(),
      });
      newDrops.push({
        id: `loot_crystal_${Date.now()}_${Math.random()}`,
        type: 'crystal',
        name: 'Arcane Crystal',
        icon: '🔮',
        x: m.x + (Math.random() - 0.5) * 0.8,
        y: m.y + (Math.random() - 0.5) * 0.8,
        z: m.elevation,
        value: Math.floor(Math.random() * 2) + 2, // 2-3 Crystal
        color: '#c084fc',
        createdAt: performance.now(),
      });
    }

    lootDropsRef.current.push(...newDrops);
    setLootDrops([...lootDropsRef.current]);

    // Award XP to player and Hero
    addXP(m.xpReward, `Vanquished ${m.name}`);

    // Update Dungeons Hero state (souls, mobs killed for current mission)
    setDungeonsStats(prev => {
      const nextMobsKilled = prev.mobsKilled + 1;
      const nextSouls = Math.min(prev.maxSouls, prev.souls + 3);

      // Check Mission Completion
      const rewardEm = currentMission?.rewardEmeralds ?? 120;
      if (currentMission && nextMobsKilled >= currentMission.targetKills && prev.mobsKilled < currentMission.targetKills) {
        dungeonsAudio.playMissionComplete();
        confetti({
          particleCount: 90,
          spread: 85,
          origin: { y: 0.5 },
          colors: ['#22c55e', '#ffd700', '#f59e0b', '#38bdf8'],
        });
        showToast(
          `🏆 MISSION VICTORY: ${currentMission.name}!`,
          `+${rewardEm} 💎 Emeralds & +250 XP earned!`
        );
        addXP(250, `Mission Complete: ${currentMission.name}`);
        return {
          ...prev,
          mobsKilled: nextMobsKilled,
          souls: nextSouls,
          emeralds: prev.emeralds + rewardEm,
        };
      }

      return {
        ...prev,
        mobsKilled: nextMobsKilled,
        souls: nextSouls,
      };
    });

    // Update Quests
    updateQuestProgress('quest_monster_hunter', 1);
    if (m.type === 'golem') {
      updateQuestProgress('quest_golem_slayer', 1);
    }

    showToast(`⚔️ Vanquished ${m.name}!`, `+${m.xpReward} XP gained`);
  }, [addXP, updateQuestProgress, currentMission]);

  // 5. Player Hurt Feedback & Respawn
  const handlePlayerHurt = useCallback((amount: number, newHp: number) => {
    playerCombatRef.current.lastHurtTime = performance.now();
    setIsHurtFlash(true);
    setTimeout(() => setIsHurtFlash(false), 240);

    const safeHp = Math.max(0, Math.round(newHp));
    setDungeonsStats(prev => ({ ...prev, hp: safeHp }));

    if (newHp <= 0) {
      // Fallen in battle: Respawn at origin with full vitality
      playerCombatRef.current.hp = playerCombatRef.current.maxHp;
      playerCombatRef.current.stamina = playerCombatRef.current.maxStamina;
      playerMotionRef.current.x = 0;
      playerMotionRef.current.y = 0;
      playerMotionRef.current.targetX = 0;
      playerMotionRef.current.targetY = 0;
      setCharPos({ x: 0, y: 0 });
      setDungeonsStats(prev => ({ ...prev, hp: playerCombatRef.current.maxHp }));
      showToast('☠️ Fallen in battle!', 'The Ancient Monolith restored your spirit at Origin.');
    }
  }, []);

  // 6. Collect Loot Vacuum
  const handleCollectLoot = useCallback((loot: LootDrop) => {
    // Immediately remove from React state and ref so 3D model and particles vanish upon pickup
    lootDropsRef.current = lootDropsRef.current.filter(d => d.id !== loot.id);
    setLootDrops(prev => prev.filter(d => d.id !== loot.id));

    if (loot.type === 'xp') {
      addXP(loot.value, 'XP Crystal');
      sounds.playLootPickup();
      showToast(`⭐ Gathered +${loot.value} XP!`);
    } else if (loot.type === 'emerald') {
      setDungeonsStats(prev => ({ ...prev, emeralds: prev.emeralds + loot.value }));
      sounds.playChestOpen();
      showToast(`💎 Picked up +${loot.value} Emeralds!`);
    } else if (loot.type === 'arrows') {
      setDungeonsStats(prev => ({ ...prev, arrows: Math.min(150, prev.arrows + loot.value) }));
      sounds.playLootPickup();
      showToast(`🏹 Gathered +${loot.value} Arrows!`);
    } else if (loot.type === 'soul') {
      setDungeonsStats(prev => ({ ...prev, souls: Math.min(prev.maxSouls, prev.souls + loot.value) }));
      showToast('👻 Absorbed Soul Wisp!');
    } else if (loot.type === 'gold') {
      setStats(prev => ({ ...prev, gold: prev.gold + loot.value }));
      sounds.playLootPickup();
      showToast(`🪙 Picked up +${loot.value} Gold!`);
    } else if (loot.type === 'potion') {
      setStats(prev => ({ ...prev, potions: prev.potions + 1 }));
      setDungeonsStats(prev => ({ ...prev, potionCooldownRemaining: 0 }));
      sounds.playLootPickup();
      showToast('🧪 Picked up a Healing Flask!');
    } else if (loot.type === 'food') {
      const healAmount = 35;
      if (playerCombatRef.current) {
        playerCombatRef.current.hp = Math.min(playerCombatRef.current.maxHp, playerCombatRef.current.hp + healAmount);
      }
      setDungeonsStats(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + healAmount) }));
      sounds.playPotionDrink();
      showToast(`🍖 Savored Savory Feast! Restored +${healAmount} HP`);
    } else if (loot.type === 'gear') {
      const randomGear = getRandomDrop(dungeonsStats.powerLevel);
      setDungeonsStats(prev => ({
        ...prev,
        inventory: [...prev.inventory, randomGear],
      }));
      sounds.playChestOpen();
      confetti({ particleCount: 30, spread: 45 });
      showToast(`🎁 Found Mystery Gear: ${randomGear.name}!`, `Power: ◆${randomGear.power} (${randomGear.rarity.toUpperCase()})`);
    } else if (
      loot.type === 'wood' ||
      loot.type === 'stone' ||
      loot.type === 'iron' ||
      loot.type === 'bone' ||
      loot.type === 'silk' ||
      loot.type === 'crystal'
    ) {
      const resType = loot.type as ResourceType;
      setStats(prev => {
        const curRes = prev.resources || { wood: 0, stone: 0, iron: 0, bone: 0, silk: 0, crystal: 0 };
        return {
          ...prev,
          resources: {
            ...curRes,
            [resType]: (curRes[resType] || 0) + loot.value,
          },
        };
      });
      sounds.playLootPickup();
      showToast(`${loot.icon} Collected +${loot.value} ${loot.name}!`, 'Resource stored for building & crafting');
      updateQuestProgress('quest_gather_loot', 1);
    }
  }, [addXP, updateQuestProgress, dungeonsStats.powerLevel]);

  // Keyboard controls with fresh ref pattern to avoid any stale closures
  const actionHandlersRef = useRef<{ [key: string]: any }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when inside input/textarea
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;

      keysPressed.current.add(e.key.toLowerCase());

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (actionHandlersRef.current.isBuildMode?.()) {
          actionHandlersRef.current.confirmBuild?.();
        } else {
          actionHandlersRef.current.attack();
        }
      } else if (e.key === 'Escape') {
        if (actionHandlersRef.current.isBuildMode?.()) {
          actionHandlersRef.current.cancelBuild?.();
        } else {
          actionHandlersRef.current.closeModals?.();
        }
      } else if (e.key.toLowerCase() === 'i') {
        setIsDungeonsInventoryOpen(prev => !prev);
      } else if (e.key.toLowerCase() === 'm') {
        setIsDungeonsMapOpen(prev => !prev);
      } else if (e.key.toLowerCase() === 'c' || e.key.toLowerCase() === 'k') {
        setIsCharacterSheetOpen(prev => !prev);
      } else if (e.key.toLowerCase() === 't') {
        actionHandlersRef.current.openTrade?.();
      } else if (e.key === '1') {
        actionHandlersRef.current.artifact?.(0);
      } else if (e.key === '2') {
        actionHandlersRef.current.artifact?.(1);
      } else if (e.key === '3') {
        actionHandlersRef.current.artifact?.(2);
      } else if (e.key.toLowerCase() === 'e') {
        actionHandlersRef.current.interact?.();
      } else if (e.key.toLowerCase() === 'f') {
        actionHandlersRef.current.rangedAttack?.();
      } else if (e.key.toLowerCase() === 'b') {
        actionHandlersRef.current.toggleBuild?.();
      } else if (e.key.toLowerCase() === 'r') {
        if (actionHandlersRef.current.isBuildMode?.()) {
          actionHandlersRef.current.rotateBuild?.(1);
        } else {
          actionHandlersRef.current.pet?.();
        }
      } else if (e.key.toLowerCase() === 'q') {
        actionHandlersRef.current.potion?.();
      } else if (e.key === 'Shift' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        e.preventDefault();
        actionHandlersRef.current.dodge?.();
      } else if (e.key.toLowerCase() === 'j') {
        actionHandlersRef.current.toggleJournal?.();
      } else if (e.key.toLowerCase() === 'h' || e.key === '?') {
        actionHandlersRef.current.openTutorial?.();
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
  }, []);

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



  // Sonar Pulse Action
  const triggerSonarPulse = () => {
    sounds.playSonarPing();
    setPulseActive(true);
    updateQuestProgress('quest_sonar', 1);

    // Reveal nearby hidden features within enhanced range
    const maxSonarDist = 45 * (activePerks.sonarRangeMultiplier || 1.0);
    let foundCount = 0;
    setFeatures(prev =>
      prev.map(f => {
        const dx = f.x - charPos.x;
        const dz = f.y - charPos.y;
        const d = Math.sqrt(dx * dx + dz * dz);
        if (d < maxSonarDist && !f.discovered) {
          foundCount++;
          return { ...f, discovered: true };
        }
        return f;
      })
    );

    if (foundCount > 0) {
      sounds.playObeliskIgnite();
      showToast(`📡 Sonar echo pinged ${foundCount} ancient signal(s)!`, `Leyline resonance reached ${Math.round(maxSonarDist)}m`);
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
      playerCombatRef.current.hp = playerCombatRef.current.maxHp;
      playerCombatRef.current.stamina = playerCombatRef.current.maxStamina;
      setStats(s => ({
        ...s,
        hp: playerCombatRef.current.maxHp,
        stamina: playerCombatRef.current.maxStamina,
        obelisksLit: s.obelisksLit + 1,
      }));
      addXP(150);
      updateQuestProgress('quest_awaken_obelisk', 1);
      showToast('⚡ Ancient Monolith Awakened!', 'Celestial Sanctuary activated & Leyline Fast Travel unlocked!');
      if (feature.relicId) awardRelic(feature.relicId);
    } else if (feature.type === 'chest') {
      sounds.playChestOpen();
      setFeatures(prev => prev.map(f => (f.id === feature.id ? { ...f, active: true, discovered: true } : f)));
      // Award progressive building materials from chest
      setStats(prev => {
        const r = { ...(prev.resources || { wood: 0, stone: 0, iron: 0, bone: 0, silk: 0, crystal: 0 }) };
        r.wood = (r.wood || 0) + 6;
        r.stone = (r.stone || 0) + 4;
        r.iron = (r.iron || 0) + 2;
        r.crystal = (r.crystal || 0) + 1;
        return {
          ...prev,
          gold: prev.gold + 25,
          resources: r,
        };
      });
      showToast('📦 Opened Treasure Cache!', '+6 Wood, +4 Stone, +2 Iron, +1 Crystal, +25 Gold');
      updateQuestProgress('quest_gather_loot', 13);
      if (feature.relicId) awardRelic(feature.relicId);
    } else if (feature.type === 'buried_mound') {
      sounds.playDig();
      setFeatures(prev => prev.map(f => (f.id === feature.id ? { ...f, active: true, discovered: true } : f)));
      setStats(s => {
        const r = { ...(s.resources || { wood: 0, stone: 0, iron: 0, bone: 0, silk: 0, crystal: 0 }) };
        r.stone = (r.stone || 0) + 4;
        r.bone = (r.bone || 0) + 3;
        r.iron = (r.iron || 0) + 1;
        return {
          ...s,
          secretsDug: s.secretsDug + 1,
          gold: s.gold + 12,
          resources: r,
        };
      });
      showToast('⛏️ Excavated Ancient Mound!', '+4 Stone, +3 Bone, +1 Iron, +12 Gold');
      updateQuestProgress('quest_gather_loot', 8);
      if (feature.relicId) awardRelic(feature.relicId);
    }
  };

  // Start building structure from blueprint
  const handleStartBuilding = (blueprint: BuildableStructureBlueprint) => {
    if (!canAffordBlueprint(blueprint)) {
      showToast(`⚠️ Insufficient resources for ${blueprint.name}!`, 'Defeat monsters to loot missing materials');
      return;
    }
    setSelectedBlueprint(blueprint);
    setBuildMode(true);
    setBuildRotation(0);
    setIsBuildDrawerOpen(false);
    showToast(`🏗️ Placement Mode: ${blueprint.name}`, 'Move to position. Press SPACE to build, R to rotate, ESC to cancel.');
  };

  // Confirm building placement
  const handleConfirmPlacement = () => {
    if (!selectedBlueprint || !buildPreview) return;
    if (!canAffordBlueprint(selectedBlueprint)) {
      showToast(`⚠️ Missing materials for ${selectedBlueprint.name}!`);
      return;
    }

    // Deduct resources
    setStats(prev => {
      const curRes = { ...(prev.resources || { wood: 0, stone: 0, iron: 0, bone: 0, silk: 0, crystal: 0 }) };
      const req = selectedBlueprint.cost;
      if (req.wood) curRes.wood = Math.max(0, (curRes.wood || 0) - req.wood);
      if (req.stone) curRes.stone = Math.max(0, (curRes.stone || 0) - req.stone);
      if (req.iron) curRes.iron = Math.max(0, (curRes.iron || 0) - req.iron);
      if (req.bone) curRes.bone = Math.max(0, (curRes.bone || 0) - req.bone);
      if (req.silk) curRes.silk = Math.max(0, (curRes.silk || 0) - req.silk);
      if (req.crystal) curRes.crystal = Math.max(0, (curRes.crystal || 0) - req.crystal);
      const newGold = Math.max(0, prev.gold - (req.gold || 0));
      return {
        ...prev,
        resources: curRes,
        gold: newGold,
        structuresBuilt: (prev.structuresBuilt || 0) + 1,
      };
    });

    const newStruct: PlacedStructure = {
      id: `struct_${selectedBlueprint.type}_${Date.now()}`,
      type: selectedBlueprint.type,
      x: buildPreview.x,
      y: buildPreview.y,
      elevation: buildPreview.elevation,
      rotation: buildPreview.rotation,
      createdAt: Date.now(),
      customName: selectedBlueprint.name,
    };

    setPlacedStructures(prev => [...prev, newStruct]);
    sounds.playBuildPlace();
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    showToast(`🏗️ Constructed: ${selectedBlueprint.name}!`, selectedBlueprint.description);

    // Update Quests
    updateQuestProgress('quest_build_first', 1);
    addXP(100, `Constructed ${selectedBlueprint.name}`);

    setBuildMode(false);
    setSelectedBlueprint(null);
  };

  // Demolish a placed structure (refunds 50% materials)
  const handleDemolishStructure = (structId: string) => {
    const struct = placedStructures.find(s => s.id === structId);
    if (!struct) return;
    const blueprint = BUILDABLE_BLUEPRINTS.find(b => b.type === struct.type);
    if (blueprint) {
      setStats(prev => {
        const r = { ...(prev.resources || { wood: 0, stone: 0, iron: 0, bone: 0, silk: 0, crystal: 0 }) };
        const req = blueprint.cost;
        if (req.wood) r.wood = (r.wood || 0) + Math.ceil(req.wood * 0.5);
        if (req.stone) r.stone = (r.stone || 0) + Math.ceil(req.stone * 0.5);
        if (req.iron) r.iron = (r.iron || 0) + Math.ceil(req.iron * 0.5);
        if (req.bone) r.bone = (r.bone || 0) + Math.ceil(req.bone * 0.5);
        if (req.silk) r.silk = (r.silk || 0) + Math.ceil(req.silk * 0.5);
        if (req.crystal) r.crystal = (r.crystal || 0) + Math.ceil(req.crystal * 0.5);
        return { ...prev, resources: r };
      });
      showToast(`🔨 Salvaged ${struct.customName || struct.type}`, 'Recovered 50% construction materials');
    }
    setPlacedStructures(prev => prev.filter(s => s.id !== structId));
    sounds.playDig();
  };

  // Forge weapon from monster loot recipe
  const handleForgeWeapon = (recipe: WeaponRecipe) => {
    if (!canAffordRecipe(recipe)) {
      showToast('⚠️ Missing required materials!', 'Loot monsters across the realm to gather components');
      return;
    }
    const alreadyUnlocked = (stats.unlockedWeapons || ['starter_club']).includes(recipe.weaponId);
    if (alreadyUnlocked) {
      showToast('Already forged this weapon!');
      return;
    }

    setStats(prev => {
      const curRes = { ...(prev.resources || { wood: 0, stone: 0, iron: 0, bone: 0, silk: 0, crystal: 0 }) };
      const req = recipe.cost;
      if (req.wood) curRes.wood = Math.max(0, (curRes.wood || 0) - req.wood);
      if (req.stone) curRes.stone = Math.max(0, (curRes.stone || 0) - req.stone);
      if (req.iron) curRes.iron = Math.max(0, (curRes.iron || 0) - req.iron);
      if (req.bone) curRes.bone = Math.max(0, (curRes.bone || 0) - req.bone);
      if (req.silk) curRes.silk = Math.max(0, (curRes.silk || 0) - req.silk);
      if (req.crystal) curRes.crystal = Math.max(0, (curRes.crystal || 0) - req.crystal);
      const newGold = Math.max(0, prev.gold - (req.gold || 0));
      const newUnlocked = [...(prev.unlockedWeapons || ['starter_club']), recipe.weaponId];
      return {
        ...prev,
        resources: curRes,
        gold: newGold,
        unlockedWeapons: newUnlocked,
      };
    });

    sounds.playCraftSuccess();
    confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
    showToast(`⚔️ Forged: ${recipe.name}!`, 'Equipped and added to your Armory!');
    updateQuestProgress('quest_forge_weapon', 1);
    addXP(150);

    const weaponIdx = ALL_WEAPONS.findIndex(w => w.id === recipe.weaponId);
    if (weaponIdx >= 0) {
      setActiveWeaponIndex(weaponIdx);
    }
  };

  // Fast Travel via Awakened Obelisk Waystones
  const handleFastTravel = (targetX: number, targetY: number) => {
    charPosRef.current = { x: targetX, y: targetY };
    targetPosRef.current = { x: targetX, y: targetY };
    setCharPos({ x: targetX, y: targetY });
    setTargetPos({ x: targetX, y: targetY });
    setCameraPan({ x: 0, y: 0 });
    const chunk = { cx: Math.floor(targetX / 24), cz: Math.floor(targetY / 24) };
    setPlayerChunk(chunk);
    playerMotionRef.current = {
      x: targetX,
      y: targetY,
      elevation: getTerrainHeight(targetX, targetY, settings),
      targetX,
      targetY,
      rotation: 0,
      isMoving: false,
      chunk,
    };
    sounds.playObeliskIgnite();
    showToast('⚡ Leyline Fast Travel!', `Warped to Awakened Monolith at (${Math.round(targetX)}, ${Math.round(targetY)})`);
    setIsJournalOpen(false);
  };

  // Campfire Rest & Alchemy actions
  const handleSleepUntilDawn = () => {
    // Anti-cheat: Can only sleep at night
    if (!isNight && (timeOfDay < 0.75 && timeOfDay > 0.25)) {
      showToast('⚠️ You can only sleep at night!');
      return;
    }
    // Anti-cheat: Check for nearby hostile monsters
    const nearbyHostile = monstersRef.current.some(
      m => m.hp > 0 && m.state !== 'dead' && m.type !== 'villager' && m.type !== 'trader' &&
           Math.hypot(m.x - charPos.x, m.y - charPos.y) < 16
    );
    if (nearbyHostile) {
      showToast('⚠️ You may not rest now; there are monsters nearby!');
      return;
    }
    // Anti-cheat: Out of combat check
    const now = performance.now();
    if (now - playerCombatRef.current.lastHurtTime < 5000) {
      showToast('⚠️ You cannot sleep while under attack!');
      return;
    }
    // Anti-cheat: Cooldown check (45s)
    if (now - lastShelterRestTimeRef.current < 45000) {
      const waitSec = Math.ceil((45000 - (now - lastShelterRestTimeRef.current)) / 1000);
      showToast(`⚠️ You are not tired yet. Sleep available in ${waitSec}s.`);
      return;
    }

    lastShelterRestTimeRef.current = now;
    setTimeOfDay(0.2); // Morning dawn
    playerCombatRef.current.hp = playerCombatRef.current.maxHp;
    playerCombatRef.current.stamina = playerCombatRef.current.maxStamina;
    setStats(prev => ({
      ...prev,
      hp: playerCombatRef.current.maxHp,
      stamina: playerCombatRef.current.maxStamina,
    }));
    setDungeonsStats(prev => ({ ...prev, hp: playerCombatRef.current.maxHp }));
    sounds.playCampfireIgnite();
    showToast('🌅 Slept until Dawn!', 'Awoke fully rested with complete vitality.');
  };

  const handleBrewPotion = () => {
    if (stats.gold < 15) {
      showToast('⚠️ Need 15 Gold to brew a Healing Flask!');
      return;
    }
    setStats(prev => ({
      ...prev,
      gold: prev.gold - 15,
      potions: prev.potions + 1,
    }));
    sounds.playPotionDrink();
    showToast('🧪 Brewed 1 Healing Flask!', '-15 Gold');
  };

  const handleFeedCompanionTreat = () => {
    if (stats.gold < 10) {
      showToast('⚠️ Need 10 Gold to roast a Companion Treat!');
      return;
    }
    setStats(prev => ({
      ...prev,
      gold: prev.gold - 10,
    }));
    setCompanion(c => ({
      ...c,
      happiness: 100,
      mood: 'excited',
    }));
    sounds.playPetWhistle();
    addXP(25);
    showToast(`🍖 Fed ${companion.name} a delicious roast!`, 'Happiness 100%! +25 XP');
  };

  const handleHoneWeapons = () => {
    const cost = 35 + weaponBonusDmg * 20;
    if (stats.gold < cost) {
      showToast(`⚠️ Need ${cost} Gold to hone weapons!`);
      return;
    }
    setStats(prev => ({
      ...prev,
      gold: prev.gold - cost,
    }));
    setWeaponBonusDmg(prev => prev + 4);
    sounds.playLevelUp();
    showToast('⚔️ Weapons Honed at Campfire Forge!', `+4 Base Damage permanently across all weapons! (-${cost} Gold)`);
  };

  // Contextual Dig / Interact Button
  const interactContextAction = () => {
    // 0. Friendly Villager or Wandering Trader interaction
    if (nearVillager) {
      setActiveTradeVillager(nearVillager);
      setIsVillageTradeOpen(true);
      sounds.playChestOpen();
      showToast(`🛒 Trading with ${nearVillager.name || 'Villager'}!`, 'Browse wares or sell materials for Emeralds');
      return;
    }

    // 1. Placed structure interaction
    if (nearbyPlacedStructure.structure && nearbyPlacedStructure.dist < 3.2) {
      const st = nearbyPlacedStructure.structure;
      if (st.type === 'workbench') {
        setIsBuildDrawerOpen(true);
        setActiveBuildTab('forge');
        sounds.playBuildPlace();
        showToast('⚒️ Anvil & Workbench', 'Craft and upgrade weapons using monster loot');
        return;
      } else if (st.type === 'storage_chest') {
        setIsBuildDrawerOpen(true);
        setActiveBuildTab('resources');
        sounds.playChestOpen();
        showToast('📦 Storage Cache', 'Review gathered looted materials and construction supplies');
        return;
      } else if (st.type === 'house' || st.type === 'tent') {
        const nearbyHostile = monstersRef.current.some(
          m => m.hp > 0 && m.state !== 'dead' && m.type !== 'villager' && m.type !== 'trader' &&
               Math.hypot(m.x - charPos.x, m.y - charPos.y) < 16
        );
        if (nearbyHostile) {
          showToast('⚠️ You may not rest now; there are monsters nearby!');
          return;
        }
        const now = performance.now();
        if (now - playerCombatRef.current.lastHurtTime < 5000) {
          showToast('⚠️ You cannot rest while under attack!');
          return;
        }
        if (now - lastShelterRestTimeRef.current < 30000) {
          const waitSec = Math.ceil((30000 - (now - lastShelterRestTimeRef.current)) / 1000);
          showToast(`⚠️ You are not tired yet. Shelter rest ready in ${waitSec}s.`);
          return;
        }
        lastShelterRestTimeRef.current = now;
        const healAmount = Math.round(playerCombatRef.current.maxHp * 0.5);
        const restoredHp = Math.min(playerCombatRef.current.maxHp, playerCombatRef.current.hp + healAmount);
        playerCombatRef.current.hp = restoredHp;
        playerCombatRef.current.stamina = playerCombatRef.current.maxStamina;
        setStats(prev => ({
          ...prev,
          hp: Math.round(restoredHp),
          stamina: playerCombatRef.current.maxStamina,
        }));
        setDungeonsStats(prev => ({ ...prev, hp: Math.round(restoredHp) }));
        sounds.playCampfireRest();
        showToast(`🏡 Rested in ${st.customName || 'Shelter'}!`, `Recovered +${healAmount} HP & full Stamina.`);
        return;
      }
    }

    // 2. World feature interaction (Chest, Obelisk, Buried Mound)
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
    if (activeCampfirePos) {
      setActiveCampfirePos(null);
      // Packing up camp returns 1 wood
      setStats(prev => ({
        ...prev,
        resources: {
          ...prev.resources,
          wood: (prev.resources?.wood || 0) + 1,
        },
      }));
      sounds.playCampfireRest();
      showToast('🏕️ Camp packed up (+1 Wood recovered). Ready to wander.');
    } else {
      // Anti-cheat: Check nearby monsters
      const nearbyHostile = monstersRef.current.some(
        m => m.hp > 0 && m.state !== 'dead' && m.type !== 'villager' && m.type !== 'trader' &&
             Math.hypot(m.x - charPos.x, m.y - charPos.y) < 16
      );
      if (nearbyHostile) {
        showToast('⚠️ You may not rest now; there are monsters nearby!');
        return;
      }
      // Anti-cheat: Check combat damage
      const now = performance.now();
      if (now - playerCombatRef.current.lastHurtTime < 4000) {
        showToast('⚠️ You cannot pitch camp while under attack!');
        return;
      }
      // Anti-cheat: Cooldown
      if (now - lastCampfirePitchTimeRef.current < 30000) {
        const waitSec = Math.ceil((30000 - (now - lastCampfirePitchTimeRef.current)) / 1000);
        showToast(`⚠️ Campfire pitch recharging. Available in ${waitSec}s.`);
        return;
      }
      // Anti-cheat: Resource cost (2 wood)
      const woodCount = stats.resources?.wood || 0;
      if (woodCount < 2) {
        showToast('⚠️ Need 2 Wood to pitch a Campfire! Chop trees or gather logs.');
        return;
      }

      lastCampfirePitchTimeRef.current = now;
      setStats(prev => ({
        ...prev,
        resources: {
          ...prev.resources,
          wood: Math.max(0, woodCount - 2),
        },
      }));
      setActiveCampfirePos({ x: charPos.x, y: charPos.y });
      sounds.playCampfireRest();
      // Warms companion, speeds time to morning if night
      setCompanion(prev => ({ ...prev, happiness: Math.min(100, prev.happiness + 20), mood: 'happy' }));
      if (isNight) {
        setTimeOfDay(0.2); // Dawn
        showToast('🏕️ Campfire pitched (-2 Wood)!', 'Rested until dawn. Companion is warmly rested.');
      } else {
        showToast('🏕️ Cozy Campfire lit (-2 Wood)!', 'Warm flames kindle. Companion happiness +20%');
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

  // Keep action handlers ref updated with latest closures
  actionHandlersRef.current = {
    attack: handlePlayerAttack,
    rangedAttack: handleRangedAttack,
    dodge: handleDodgeRoll,
    potion: handleDrinkPotion,
    artifact: (idx: number) => handleActivateArtifact(idx),
    interact: interactContextAction,
    sonar: triggerSonarPulse,
    camp: toggleCampfire,
    pet: petCompanion,
    setWeapon: (idx: number) => selectWeaponByIndex(idx),
    toggleJournal: () => setIsJournalOpen(prev => !prev),
    toggleBuild: () => setIsBuildDrawerOpen(prev => !prev),
    isBuildMode: () => buildMode,
    rotateBuild: (dir: number) => setBuildRotation(r => r + dir * (Math.PI / 4)),
    confirmBuild: () => handleConfirmPlacement(),
    cancelBuild: () => {
      setBuildMode(false);
      setSelectedBlueprint(null);
      showToast('Build placement cancelled');
    },
    closeModals: () => {
      if (isSettingsOpen) {
        setIsSettingsOpen(false);
        return;
      }
      if (isJournalOpen) {
        setIsJournalOpen(false);
        return;
      }
      if (isPauseMenuOpen) {
        setIsPauseMenuOpen(false);
        return;
      }
      const anyOpen =
        isBuildDrawerOpen ||
        isDungeonsInventoryOpen ||
        isDungeonsCampOpen ||
        isDungeonsMapOpen ||
        isCharacterSheetOpen ||
        isVillageTradeOpen;

      if (anyOpen) {
        setIsBuildDrawerOpen(false);
        setIsDungeonsInventoryOpen(false);
        setIsDungeonsCampOpen(false);
        setIsDungeonsMapOpen(false);
        setIsCharacterSheetOpen(false);
        setIsVillageTradeOpen(false);
      } else if (gameScreen === 'playing') {
        setIsPauseMenuOpen(true);
      }
    },
    openTrade: () => {
      if (nearVillager) setActiveTradeVillager(nearVillager);
      setIsVillageTradeOpen(true);
    },
    toggleCharacterSheet: () => setIsCharacterSheetOpen(prev => !prev),
    openTutorial: () => {
      setSettingsTab('tutorial');
      setIsSettingsOpen(true);
    },
  };

  // Floor Pointer handlers for tap-to-move & drag-to-pan
  const handleFloorPointerDown = (e: any) => {
    e.stopPropagation();
    if (isJournalOpen || isSettingsOpen || unlockedRelicModal) return;

    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 1) {
      pointerDownPos.current = { x: e.clientX, y: e.clientY };
      pointerDownWorld.current = { x: e.point.x, y: e.point.z };
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
        playerMotionRef.current.targetX = x;
        playerMotionRef.current.targetY = y;
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
      <Canvas
        camera={{ fov: 40, far: 1000 }}
        dpr={[1, Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.75)]}
        gl={{ powerPreference: 'high-performance', antialias: true, stencil: false }}
      >
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
        <ambientLight intensity={isNight ? 0.35 : 0.8} />
        <directionalLight
          position={isNight ? [-35, 55, -35] : [45, 65, 45]}
          intensity={isNight ? 0.45 : 1.25}
          color={isNight ? '#8bb4e8' : '#fff8ee'}
        />

        <Suspense fallback={null}>
          <GameLoopController
            playerPosRef={playerMotionRef}
            inputVectorRef={inputVector}
            keysPressedRef={keysPressed}
            cameraPanRef={cameraPanRef}
            setCameraPan={setCameraPan}
            settings={settings}
            isPaused={isJournalOpen || isSettingsOpen || Boolean(unlockedRelicModal) || gameScreen !== 'playing' || isPauseMenuOpen}
            monstersRef={monstersRef}
            projectilesRef={projectilesRef}
            lootDropsRef={lootDropsRef}
            playerCombatRef={playerCombatRef}
            activeCampfirePos={activeCampfirePos}
            activePerks={activePerks}
            awakenedObelisks={awakenedObelisks}
            placedStructuresRef={placedStructuresRef}
            onPlayerHurt={handlePlayerHurt}
            onMonsterDefeated={handleMonsterDefeated}
            onProjectileHitMonster={() => updateQuestProgress('quest_sharpshooter', 1)}
            onCollectLoot={handleCollectLoot}
            onCombatTick={handleCombatTick}
            onSyncUI={handleSyncUI}
            onChunkChange={handleChunkChange}
            onSyncProjectiles={setProjectiles}
          />

          <CameraRig
            playerPosRef={playerMotionRef}
            zoom={cameraZoom}
            pan={cameraPan}
            settings={settings}
            isTitleScreen={gameScreen !== 'playing'}
          />

          {/* Infinite Voxel Terrain - Only re-evaluates when crossing chunk boundaries */}
          <VoxelTerrainMesh
            settings={settings}
            playerChunk={playerChunk}
            onPointerDown={handleFloorPointerDown}
            onPointerUp={handleFloorPointerUp}
          />

          {/* Infinite Procedural Water - Zero Z-fighting */}
          <WaterMesh
            playerChunk={playerChunk}
            settings={settings}
            visible={settings.hasWater !== false && settings.terrainType !== 'flat'}
          />

          {/* Instanced Nature (Trees, Rocks, Wildflowers, Reeds) - Static GPU Buffers, Zero Flicker */}
          <NatureInstances
            settings={settings}
            playerChunk={playerChunk}
          />

          {/* Active Procedural Monsters & Bosses */}
          <MonstersWorld monsters={monsters} />

          {/* Active Projectiles (Arrows, Spells, Slashing Waves) */}
          <ProjectilesWorld projectiles={projectiles} />

          {/* Physical Loot Drops (XP Crystals, Gold Coins, Potions) */}
          <LootDropsWorld lootDrops={lootDrops} />

          {/* Animated Voxel Player */}
          <Player3D
            playerPosRef={playerMotionRef}
            playerCombatRef={playerCombatRef}
            color={settings.characterColor}
            settings={settings}
            isNight={isNight}
            activeWeapon={activeWeapon}
            equippedMelee={dungeonsStats.equippedMelee}
            equippedRanged={dungeonsStats.equippedRanged}
            attackAnimRef={attackAnimRef}
            isHurtFlash={isHurtFlash}
            customization={characterCustomization}
            equippedArmor={dungeonsStats.equippedArmor}
          />

          {/* Voxel Faithful Companion */}
          <VoxelCompanion
            playerPos={charPos}
            playerPosRef={playerMotionRef}
            playerElevation={playerMotionRef.current.elevation}
            type={settings.companionType ?? 'fox'}
            mood={companion.mood}
            nearbyFeaturePos={
              nearbyFeature.feature && nearbyFeature.dist < 20
                ? { x: nearbyFeature.feature.x, y: nearbyFeature.feature.y }
                : null
            }
            getElevation={(wx, wz) => getTerrainHeight(wx, wz, settings)}
          />

          {/* World Objects: Obelisks, Chests, Relic Mounds, Campfire, Sonar Pulse & Built Structures */}
          <WorldFeaturesManager
            features={features}
            onInteractFeature={handleInteractFeature}
            playerPos={charPos}
            activeCampfirePos={activeCampfirePos}
            getElevation={(wx, wz) => getTerrainHeight(wx, wz, settings)}
            pulseRadius={pulseRadius}
            placedStructures={placedStructures}
            buildPreview={buildPreview}
            onInteractStructure={(s) => {
              if (s.type === 'workbench') {
                setIsBuildDrawerOpen(true);
                setActiveBuildTab('forge');
              } else if (s.type === 'storage_chest') {
                setIsBuildDrawerOpen(true);
                setActiveBuildTab('resources');
              }
            }}
          />

          {/* Minecraft Clouds - Static GPU mesh */}
          <VoxelClouds playerChunk={playerChunk} visible={settings.hasClouds !== false} />
        </Suspense>
      </Canvas>

      {/* Screen Hurt Vignette Flash */}
      {isHurtFlash && (
        <div className="fixed inset-0 pointer-events-none z-50 border-8 border-red-600/70 bg-red-950/20 animate-pulse transition-opacity duration-75" />
      )}

      {/* --- UI HUD LAYER --- */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Ancient Radar Compass (Clean positioning below top header on both portrait & landscape) */}
        {nearbyFeature.feature && (
          <div className="pointer-events-auto absolute top-13 sm:top-15 left-1/2 -translate-x-1/2 z-25 animate-in fade-in">
            <div
              className={`mc-panel px-2.5 py-0.5 sm:px-3 sm:py-1 flex items-center gap-1.5 shadow-xl border-2 whitespace-nowrap transition-all ${
                nearbyFeature.dist < 3.5
                  ? 'bg-[#16a34a] text-white border-[#86efac] animate-bounce font-bold shadow-[0_0_12px_rgba(34,197,94,0.7)]'
                  : nearbyFeature.dist < 14
                  ? 'bg-[#f59e0b] text-black border-[#fde047] animate-pulse font-bold'
                  : 'bg-[#1e293b]/95 text-gray-200 border-[#475569]'
              }`}
              title="Nearest secret"
            >
              <Radio className={`w-3.5 h-3.5 flex-shrink-0 ${nearbyFeature.dist < 14 ? 'animate-ping' : ''}`} />
              <span className="text-xs sm:text-sm font-mono font-bold tracking-wide">
                {nearbyFeature.feature.type === 'obelisk'
                  ? 'SPIRE'
                  : nearbyFeature.feature.type === 'chest'
                  ? 'CHEST'
                  : 'RELIC'}{' '}
                • {Math.round(nearbyFeature.dist)}m
              </span>
            </div>
          </div>
        )}

        {/* Floating Toast Notification */}
        {notification && (
          <div className="fixed top-24 sm:top-26 left-1/2 -translate-x-1/2 z-50 pointer-events-auto max-w-[92vw] animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="mc-panel px-3 py-1.5 sm:px-4 sm:py-2 bg-[#2d3748] text-white border-2 border-[#ffd700] shadow-[0_4px_12px_rgba(0,0,0,0.5)] flex flex-col items-center text-center">
              <span className="text-sm sm:text-xl font-bold text-[#ffd700]">{notification.text}</span>
              {notification.sub && (
                <span className="text-[11px] sm:text-sm text-gray-300 font-mono">{notification.sub}</span>
              )}
            </div>
          </div>
        )}

        {/* Responsive Minecraft Dungeons HUD (Only shown when actively playing) */}
        {gameScreen === 'playing' && (
          <DungeonsHUD
            stats={dungeonsStats}
            currentMission={currentMission}
            onOpenInventory={() => setIsDungeonsInventoryOpen(true)}
            onOpenMissionMap={() => setIsDungeonsMapOpen(true)}
            onOpenCamp={() => setIsDungeonsCampOpen(true)}
            onOpenCharacterSheet={() => setIsCharacterSheetOpen(true)}
            onOpenBuildDrawer={() => setIsBuildDrawerOpen(true)}
            onOpenVillageTrade={() => {
              if (nearVillager) setActiveTradeVillager(nearVillager);
              setIsVillageTradeOpen(true);
            }}
            isNearVillager={Boolean(nearVillager)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenPauseMenu={() => setIsPauseMenuOpen(true)}
            onMeleeAttack={handlePlayerAttack}
            onRangedAttack={handleRangedAttack}
            onDodgeRoll={handleDodgeRoll}
            onDrinkPotion={handleDrinkPotion}
            onActivateArtifact={handleActivateArtifact}
            soundEnabled={settings.soundEnabled}
            onToggleSound={() => {
              const next = !settings.soundEnabled;
              setSettings(s => ({ ...s, soundEnabled: next }));
              sounds.enabled = next;
              dungeonsAudio.enabled = next;
            }}
            onMoveJoystick={(x, y) => {
              inputVector.current = { x, y };
            }}
            onInteract={interactContextAction}
            canInteract={Boolean(
              nearVillager ||
              (nearbyPlacedStructure.structure && nearbyPlacedStructure.dist < 3.2) ||
              (nearbyFeature.feature && nearbyFeature.dist < 3.0)
            )}
            interactLabel={
              nearVillager
                ? 'TRADE'
                : nearbyPlacedStructure.structure && nearbyPlacedStructure.dist < 3.2
                ? nearbyPlacedStructure.structure.type === 'workbench'
                  ? 'FORGE'
                  : nearbyPlacedStructure.structure.type === 'storage_chest'
                  ? 'CHEST'
                  : 'REST'
                : nearbyFeature.feature && nearbyFeature.dist < 3.0
                ? nearbyFeature.feature.type === 'obelisk'
                  ? 'AWAKEN'
                  : nearbyFeature.feature.type === 'chest'
                  ? 'OPEN'
                  : 'EXCAVATE'
                : 'DIG'
            }
          />
        )}
      </div>

      {/* --- MINECRAFT LANDING PAGE (TITLE / WORLD SELECT / CREATE WORLD) --- */}
      {gameScreen !== 'playing' && (
        <MinecraftLandingPage
          currentWorld={currentWorld}
          savedWorlds={savedWorlds}
          onPlayWorld={handlePlayWorld}
          onCreateWorld={handleCreateWorld}
          onDeleteWorld={handleDeleteWorld}
          onOpenSettings={() => {
            setSettingsTab('options');
            setIsSettingsOpen(true);
          }}
          onOpenGuide={() => {
            setSettingsTab('tutorial');
            setIsSettingsOpen(true);
          }}
          soundEnabled={settings.soundEnabled ?? true}
          onToggleSound={() => {
            const next = !settings.soundEnabled;
            setSettings(s => ({ ...s, soundEnabled: next }));
            sounds.enabled = next;
            dungeonsAudio.enabled = next;
          }}
        />
      )}

      {/* --- MINECRAFT IN-GAME PAUSE MENU --- */}
      <MinecraftPauseMenu
        isOpen={isPauseMenuOpen && gameScreen === 'playing'}
        onResume={() => setIsPauseMenuOpen(false)}
        onOpenInventory={() => {
          setIsPauseMenuOpen(false);
          setIsDungeonsInventoryOpen(true);
        }}
        onOpenMap={() => {
          setIsPauseMenuOpen(false);
          setIsDungeonsMapOpen(true);
        }}
        onOpenCamp={() => {
          setIsPauseMenuOpen(false);
          setIsDungeonsCampOpen(true);
        }}
        onOpenJournal={() => {
          setIsPauseMenuOpen(false);
          setIsJournalOpen(true);
        }}
        onOpenSettings={() => {
          setIsPauseMenuOpen(false);
          setIsSettingsOpen(true);
        }}
        onSaveAndQuit={handleSaveAndQuit}
        worldName={currentWorld?.name || 'Survival Realm'}
      />

      {/* --- MINECRAFT DUNGEONS MODALS --- */}

      {/* 1. Dungeons Hero Inventory & Enchantments Modal */}
      <DungeonsInventory
        isOpen={isDungeonsInventoryOpen}
        onClose={() => setIsDungeonsInventoryOpen(false)}
        stats={dungeonsStats}
        onEquipItem={handleEquipItem}
        onUpgradeEnchantment={handleUpgradeEnchantment}
        onRefundEnchantment={handleRefundEnchantment}
        onSalvageItem={handleSalvageItem}
      />

      {/* 2. Dungeons Camp Base & Blacksmith Forge Modal */}
      <DungeonsCamp
        isOpen={isDungeonsCampOpen}
        onClose={() => setIsDungeonsCampOpen(false)}
        stats={dungeonsStats}
        onObtainItem={(item) => {
          setDungeonsStats(prev => ({
            ...prev,
            inventory: [item, ...prev.inventory],
          }));
          dungeonsAudio.playLevelUp();
          showToast(`📦 Obtained ${item.name}!`, `Power ◆${item.power}`);
        }}
        onDeductEmeralds={(amount) => {
          if (dungeonsStats.emeralds < amount) {
            showToast(`⚠️ Need ${amount} Emeralds!`);
            return false;
          }
          setDungeonsStats(prev => ({
            ...prev,
            emeralds: prev.emeralds - amount,
          }));
          return true;
        }}
        onRestAtCamp={() => {
          if (playerCombatRef.current) {
            playerCombatRef.current.hp = dungeonsStats.maxHp;
          }
          setDungeonsStats(prev => ({ ...prev, hp: prev.maxHp }));
          dungeonsAudio.playCampfireRest();
          showToast('🏕️ Rested at Campfire!', 'Full vitality restored to hero.');
        }}
        onOpenMissionMap={() => {
          setIsDungeonsCampOpen(false);
          setIsDungeonsMapOpen(true);
        }}
      />

      {/* 3. Dungeons Mission Map & Difficulty Selector Modal */}
      <DungeonsMissionMap
        isOpen={isDungeonsMapOpen}
        onClose={() => setIsDungeonsMapOpen(false)}
        stats={dungeonsStats}
        currentMission={currentMission}
        onSelectMission={(m) => {
          setCurrentMission(m);
          setIsDungeonsMapOpen(false);
          setDungeonsStats(prev => ({ ...prev, mobsKilled: 0 }));
          dungeonsAudio.playLevelUp();
          showToast(`🗺️ Embarked on ${m.name}!`, `Difficulty: ${m.difficulty.toUpperCase()} • Recommended Power ◆${m.recommendedPower}`);
        }}
      />

      {/* --- MODALS & PANELS --- */}

      {/* 1. Explorer Journal & Compendium Modal */}
      {/* --- EXPLORER COMPENDIUM (JOURNAL) MODAL --- */}
      {isJournalOpen && (
        <div
          id="explorer-compendium-overlay"
          className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-4 md:p-6 pointer-events-auto bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsJournalOpen(false)}
        >
          <div
            id="explorer-compendium-modal"
            className="w-full max-w-3xl max-h-[92vh] mc-panel-dark text-white flex flex-col overflow-hidden"
            style={{ fontFamily: "'VT323', monospace" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center px-4 py-3 bg-[#181818] border-b-2 border-black">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 mc-slot-dark flex items-center justify-center text-xl text-emerald-400">
                  📖
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-wider text-emerald-400 leading-tight">
                    EXPLORER'S COMPENDIUM
                  </h2>
                  <p className="text-xs text-gray-400 font-mono">
                    Ancient relics, monoliths, alchemy & wilderness field notes
                  </p>
                </div>
              </div>
              <button
                id="close-compendium-btn"
                onClick={() => setIsJournalOpen(false)}
                className="mc-btn px-2.5 py-1 text-sm cursor-pointer"
                title="Close (ESC)"
              >
                <X className="w-5 h-5 inline" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b-2 border-black bg-[#151515] px-3 pt-2 gap-1.5 overflow-x-auto text-sm">
              {[
                { id: 'relics', label: `Relics (${inventory.length}/${ALL_RELICS.length})`, icon: '💎' },
                { id: 'armory', label: `Arsenal & Mobs`, icon: '⚔️' },
                { id: 'waystones', label: `Waystones (${awakenedObelisks.length})`, icon: '⚡' },
                { id: 'camp', label: `Camp Forge`, icon: '🏕️' },
                { id: 'quests', label: 'Quests', icon: '📜' },
                { id: 'stats', label: 'Stats', icon: '📊' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-base font-bold border-t-2 border-x-2 cursor-pointer transition-none whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'mc-panel text-black border-black font-bold'
                      : 'mc-btn text-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab 1: Relics Collection Grid */}
            {activeTab === 'relics' && (
              <div className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-4">
                {/* Active Perks Banner */}
                <div className="mc-slot-dark p-3.5 border-2 border-amber-600/60 bg-[#1e1a12]">
                  <div className="flex items-center gap-2 font-bold text-lg text-amber-400 mb-2">
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    <span>ACTIVE RELIC BLESSINGS ({inventory.length} Relics Discovered)</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm font-mono">
                    <div className="mc-slot-dark p-2 text-gray-200">
                      ❤️ Max HP: <span className="font-bold text-red-400">+{activePerks.maxHpBonus}</span>
                    </div>
                    <div className="mc-slot-dark p-2 text-gray-200">
                      ⚡ Max Stamina: <span className="font-bold text-yellow-400">+{activePerks.maxStaminaBonus}</span>
                    </div>
                    <div className="mc-slot-dark p-2 text-gray-200">
                      👟 Move Speed: <span className="font-bold text-emerald-400">{Math.round(activePerks.speedMultiplier * 100)}%</span>
                    </div>
                    <div className="mc-slot-dark p-2 text-gray-200">
                      🪙 Gold Yield: <span className="font-bold text-amber-400">{Math.round(activePerks.goldMultiplier * 100)}%</span>
                    </div>
                    <div className="mc-slot-dark p-2 text-gray-200">
                      🧪 Flask Boost: <span className="font-bold text-rose-400">+{activePerks.potionHealBonus} HP</span>
                    </div>
                    <div className="mc-slot-dark p-2 text-gray-200">
                      🎯 Crit Bonus: <span className="font-bold text-indigo-400">+{Math.round(activePerks.critChanceBonus * 100)}%</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-400 font-mono">
                  Ancient relics unearthed from ruins, chests, and mountain peaks. Select any discovered relic to inspect its lore:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {ALL_RELICS.map(r => {
                    const found = inventory.find(item => item.id === r.id);
                    return (
                      <div
                        key={r.id}
                        onClick={() => setSelectedRelicDetail(found ? found : r)}
                        className={`p-3 border-2 cursor-pointer transition-transform hover:scale-102 flex flex-col items-center text-center ${
                          found
                            ? 'mc-slot-dark border-[#555] hover:border-amber-400'
                            : 'mc-slot-dark opacity-40 border-black'
                        }`}
                      >
                        <span className="text-4xl mb-1.5">{found ? r.icon : '❓'}</span>
                        <span className="text-base font-bold text-white truncate w-full">
                          {found ? r.name : 'Undiscovered'}
                        </span>
                        <span
                          className={`text-xs uppercase px-2 py-0.5 mt-1 font-mono font-bold ${
                            r.rarity === 'legendary'
                              ? 'bg-yellow-500 text-black'
                              : r.rarity === 'epic'
                              ? 'bg-purple-600 text-white'
                              : r.rarity === 'rare'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-600 text-white'
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

            {/* Tab: Waystones (Celestial Monolith Fast Travel Network) */}
            {activeTab === 'waystones' && (
              <div className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-4">
                <div className="mc-slot-dark p-3.5 border-2 border-sky-600/60 bg-[#121c24]">
                  <h3 className="text-xl font-bold text-sky-400 flex items-center gap-2">
                    <Radio className="w-5 h-5 text-sky-400" />
                    <span>CELESTIAL MONOLITH LEYLINE NETWORK</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 font-mono mt-1">
                    Awakened monoliths cast a protective sanctuary aura (+5 HP/s, +10 STM/s, monsters cannot enter) and link to ancient leyline wormholes for instant Fast Travel!
                  </p>
                </div>

                {features.filter(f => f.type === 'obelisk').length === 0 ? (
                  <div className="text-center py-10 text-gray-500 font-mono text-base">
                    No Monoliths sighted yet. Explore further or use Sonar Pulse [C] to ping ancient signals!
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {features
                      .filter(f => f.type === 'obelisk')
                      .map((ob, idx) => {
                        const dist = Math.hypot(ob.x - charPos.x, ob.y - charPos.y);
                        return (
                          <div
                            key={ob.id}
                            className={`p-3 border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              ob.active
                                ? 'mc-slot-dark border-emerald-500/80 bg-[#122416]'
                                : 'mc-slot-dark border-gray-700 opacity-80'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2.5">
                                <span className="text-3xl">{ob.active ? '⚡' : '🗿'}</span>
                                <div>
                                  <h4 className="font-bold text-lg text-white">
                                    Monolith Sanctuary #{idx + 1}
                                  </h4>
                                  <span className="text-xs font-mono text-gray-400">
                                    Coordinates: ({Math.round(ob.x)}, {Math.round(ob.y)}) • {Math.round(dist)}m away
                                  </span>
                                </div>
                              </div>
                              <div className="text-xs mt-1.5 font-mono">
                                Status:{' '}
                                {ob.active ? (
                                  <span className="text-emerald-400 font-bold">
                                    ✓ Awakened Sanctuary (Fast Travel Linked)
                                  </span>
                                ) : (
                                  <span className="text-amber-400 font-bold">
                                    ⚠️ Dormant (Approach in world and press [E] to awaken)
                                  </span>
                                )}
                              </div>
                            </div>

                            {ob.active ? (
                              <button
                                onClick={() => handleFastTravel(ob.x, ob.y)}
                                className="mc-btn px-4 py-2 text-base font-bold bg-[#16a34a]! text-white border-[#86efac]! flex items-center justify-center gap-2 cursor-pointer shadow-md"
                              >
                                <Zap className="w-4 h-4" /> Fast Travel
                              </button>
                            ) : (
                              <span className="text-xs font-mono text-gray-500 italic px-2 py-1">
                                Awaken in world to activate
                              </span>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Campfire Forge & Alchemy */}
            {activeTab === 'camp' && (
              <div className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-4">
                <div className="mc-slot-dark p-3.5 border-2 border-orange-600/60 bg-[#241a12]">
                  <h3 className="text-xl font-bold text-orange-400 flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-400" />
                    <span>CAMPFIRE FORGE & FIELD ALCHEMY</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 font-mono mt-1">
                    Harness the warm embers of your campfire to brew restorative draughts, roast companion delicacies, or permanently hone weapon blades!
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Rest Until Dawn */}
                  <div className="p-3.5 mc-slot-dark border-2 border-gray-700 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="text-3xl">🌅</span>
                        <div>
                          <h4 className="font-bold text-lg text-yellow-400">Sleep Until Dawn</h4>
                          <span className="text-xs text-gray-400 font-mono">Night rest (Requires campfire & safety)</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-300 font-mono mb-3">
                        Sleep peacefully until morning. Restores 100% HP and Stamina. Cannot sleep with monsters nearby or during combat.
                      </p>
                    </div>
                    <button
                      onClick={handleSleepUntilDawn}
                      className="mc-btn w-full py-2 text-base font-bold bg-[#2563eb]! text-white border-[#93c5fd]!"
                    >
                      Sleep Until Dawn
                    </button>
                  </div>

                  {/* Brew Healing Flask */}
                  <div className="p-3.5 mc-slot-dark border-2 border-gray-700 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="text-3xl">🧪</span>
                        <div>
                          <h4 className="font-bold text-lg text-red-400">Brew Healing Flask</h4>
                          <span className="text-xs text-amber-400 font-mono font-bold">Cost: 15 Gold</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-300 font-mono mb-3">
                        Concoct a potent restorative draught from wild herbs and gold reagents (+55 HP).
                      </p>
                    </div>
                    <button
                      onClick={handleBrewPotion}
                      className="mc-btn w-full py-2 text-base font-bold bg-[#dc2626]! text-white border-[#fca5a5]!"
                    >
                      Brew Flask (15 🪙)
                    </button>
                  </div>

                  {/* Roast Companion Treat */}
                  <div className="p-3.5 mc-slot-dark border-2 border-gray-700 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="text-3xl">🍖</span>
                        <div>
                          <h4 className="font-bold text-lg text-amber-400">Roast Companion Feast</h4>
                          <span className="text-xs text-amber-400 font-mono font-bold">Cost: 10 Gold</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-300 font-mono mb-3">
                        Roast a succulent campfire meal for {companion.name}. Maxes out companion happiness (100%) and grants +25 XP.
                      </p>
                    </div>
                    <button
                      onClick={handleFeedCompanionTreat}
                      className="mc-btn w-full py-2 text-base font-bold bg-[#d97706]! text-white border-[#fde047]!"
                    >
                      Roast Treat (10 🪙)
                    </button>
                  </div>

                  {/* Forge & Hone Weapons */}
                  <div className="p-3.5 mc-slot-dark border-2 border-gray-700 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="text-3xl">⚔️</span>
                        <div>
                          <h4 className="font-bold text-lg text-emerald-400">Hone Weapons</h4>
                          <span className="text-xs text-emerald-400 font-mono font-bold">
                            Cost: {35 + weaponBonusDmg * 20} Gold
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-300 font-mono mb-3">
                        Quench and sharpen all blades on the campfire forge. Adds +4 damage permanently! (Current bonus: +{weaponBonusDmg})
                      </p>
                    </div>
                    <button
                      onClick={handleHoneWeapons}
                      className="mc-btn w-full py-2 text-base font-bold bg-[#059669]! text-white border-[#6ee7b7]!"
                    >
                      Hone Blades ({35 + weaponBonusDmg * 20} 🪙)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Quests */}
            {activeTab === 'quests' && (
              <div className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-3">
                {quests.map(q => (
                  <div
                    key={q.id}
                    className={`p-3.5 border-2 ${
                      q.completed
                        ? 'mc-slot-dark border-emerald-500/80 bg-[#122416]'
                        : 'mc-slot-dark border-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-xl font-bold text-white flex items-center gap-2">
                        {q.completed ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : '📍'}
                        {q.title}
                      </span>
                      <span className="text-xs font-mono font-bold bg-yellow-500 text-black px-2 py-0.5 border border-yellow-300">
                        +{q.xpReward} XP
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 font-mono mb-2.5">{q.description}</p>
                    <div className="w-full bg-[#111] h-3.5 border-2 border-black overflow-hidden">
                      <div
                        className="bg-[#22c55e] h-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (q.progress / q.target) * 100)}%` }}
                      />
                    </div>
                    <div className="text-right text-xs font-mono text-gray-400 mt-1">
                      {q.progress} / {q.target} {q.completed && '(Completed!)'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 3: Explorer Stats */}
            {activeTab === 'stats' && (
              <div className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-4">
                <div className="mc-slot-dark p-4 border-2 border-gray-700 space-y-3">
                  <h3 className="text-xl font-bold text-yellow-400 border-b-2 border-black pb-1.5">
                    Wanderer Record
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-lg font-mono">
                    <div className="mc-slot-dark p-2 text-gray-200">
                      Level: <span className="font-bold text-emerald-400">{stats.level}</span>
                    </div>
                    <div className="mc-slot-dark p-2 text-gray-200">
                      Experience: <span className="font-bold text-yellow-400">{stats.xp} XP</span>
                    </div>
                    <div className="mc-slot-dark p-2 text-gray-200">
                      Relics Unearthed:{' '}
                      <span className="font-bold text-cyan-400">
                        {stats.relicsFound} / {ALL_RELICS.length}
                      </span>
                    </div>
                    <div className="mc-slot-dark p-2 text-gray-200">
                      Monoliths Awakened:{' '}
                      <span className="font-bold text-sky-400">{stats.obelisksLit}</span>
                    </div>
                    <div className="mc-slot-dark p-2 text-gray-200">
                      Paces Explored:{' '}
                      <span className="font-bold text-white">{stats.stepsWalked}</span>
                    </div>
                    <div className="mc-slot-dark p-2 text-gray-200">
                      Secrets Dug: <span className="font-bold text-amber-400">{stats.secretsDug}</span>
                    </div>
                  </div>
                </div>

                <div className="mc-slot-dark p-4 border-2 border-gray-700 space-y-2">
                  <h3 className="text-xl font-bold text-pink-400 border-b-2 border-black pb-1.5">
                    Nomad Companion
                  </h3>
                  <div className="flex justify-between items-center text-lg font-mono">
                    <span className="text-gray-200">Name: {companion.name} ({settings.companionType ?? 'fox'})</span>
                    <span className="text-pink-400 font-bold">Happiness: {companion.happiness}%</span>
                  </div>
                  <p className="text-xs text-gray-400 font-mono">
                    Keep your companion happy by petting them [R] and resting at campfires. Happy companions sniff out buried treasures and vacuum dropped gems!
                  </p>
                </div>
              </div>
            )}

            {/* Tab 4: Armory & Bestiary */}
            {activeTab === 'armory' && (
              <div className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-5">
                {/* Weapons Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b-2 border-black pb-1.5">
                    <Sword className="w-5 h-5 text-red-400" />
                    <h3 className="text-xl font-bold text-yellow-400">Explorer's Arsenal</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ALL_WEAPONS.map((w, idx) => {
                      const isEquipped = activeWeaponIndex === idx;
                      return (
                        <div
                          key={w.id}
                          className={`p-3.5 border-2 flex flex-col justify-between ${
                            isEquipped
                              ? 'mc-slot-dark border-yellow-500 bg-[#242012]'
                              : 'mc-slot-dark border-gray-700'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="text-3xl">{w.icon}</span>
                              <div>
                                <h4 className="font-bold text-lg text-white leading-tight">{w.name}</h4>
                                <span className="text-xs uppercase px-1.5 py-0.5 bg-black/40 text-gray-300 font-mono">
                                  {w.type} • Key [{idx + 1}]
                                </span>
                              </div>
                            </div>
                            {isEquipped && (
                              <span className="text-xs font-bold bg-[#16a34a] text-white px-2 py-0.5 rounded font-mono">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-300 font-mono my-2 italic">{w.description}</p>
                          <div className="grid grid-cols-2 gap-1.5 text-xs font-mono mc-slot-dark p-2 border-black mb-2.5">
                            <div>Damage: <span className="font-bold text-red-400">{w.damage}</span></div>
                            <div>Range: <span className="font-bold text-blue-400">{w.range}m</span></div>
                            <div>Cooldown: <span className="font-bold text-yellow-400">{w.cooldown}s</span></div>
                            <div>Stamina: <span className="font-bold text-amber-400">{w.staminaCost}</span></div>
                          </div>
                          {!isEquipped && (
                            <button
                              onClick={() => {
                                setActiveWeaponIndex(idx);
                                showToast(`⚔️ Equipped: ${w.name}`);
                              }}
                              className="mc-btn w-full py-1.5 text-base font-bold bg-[#16a34a]! text-white border-[#86efac]!"
                            >
                              Equip Weapon [{idx + 1}]
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bestiary Section */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 border-b-2 border-black pb-1.5">
                    <Skull className="w-5 h-5 text-gray-400" />
                    <h3 className="text-xl font-bold text-red-400">Wilderness Bestiary</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      {
                        name: 'Bouncing Slime',
                        type: 'slime',
                        icon: '🟢',
                        hp: 45,
                        damage: 10,
                        speed: 'Medium Leap',
                        range: 'Melee Bump',
                        lore: 'Gelatinous organisms roaming lush grasslands. They leap toward intruders and drop slime gel.',
                        loot: 'Slime Gel, Small Gems, Health Potions',
                      },
                      {
                        name: 'Skeleton Sharpshooter',
                        type: 'skeleton',
                        icon: '💀',
                        hp: 55,
                        damage: 14,
                        speed: 'Kiting Distance',
                        range: '14m Arrow Sniping',
                        lore: 'Ancient guardians animated by moonlight. They keep distance and volley piercing bone arrows.',
                        loot: 'Bone Shards, Gold, Stamina Elixirs',
                      },
                      {
                        name: 'Iron Sentinel Golem',
                        type: 'golem',
                        icon: '🗿',
                        hp: 160,
                        damage: 28,
                        speed: 'Heavy Stride',
                        range: 'Shockwave Ground Slam',
                        lore: 'Ancient stone monolith automatons constructed by forgotten kings. Hits with shattering force.',
                        loot: 'Ancient Relics, Titan Cores, Huge Gold Stash',
                      },
                      {
                        name: 'Shadow Spider',
                        type: 'spider',
                        icon: '🕷️',
                        hp: 50,
                        damage: 12,
                        speed: 'Rapid Skitter',
                        range: 'Poison Fang Strike',
                        lore: 'Lurks around shadowed crags and night groves. Fast skittering stride and venomous sting.',
                        loot: 'Spider Silk, Venom Sacs, Gold',
                      },
                    ].map(mob => (
                      <div key={mob.name} className="p-3.5 mc-slot-dark border-2 border-gray-700 flex flex-col justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-3xl">{mob.icon}</span>
                          <div>
                            <h4 className="font-bold text-lg text-white leading-tight">{mob.name}</h4>
                            <span className="text-xs uppercase px-1.5 py-0.5 bg-black/40 text-gray-300 font-mono">
                              HP: {mob.hp} • Atk: {mob.damage}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-300 font-mono my-2">{mob.lore}</p>
                        <div className="text-xs font-mono mc-slot-dark p-2 border-black space-y-1">
                          <div><span className="font-bold text-gray-400">Combat Style:</span> {mob.range} ({mob.speed})</div>
                          <div><span className="font-bold text-amber-400">Drops:</span> {mob.loot}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Unlocked Relic Discovery Modal (With Confetti celebration) */}
      {unlockedRelicModal && (
        <div
          id="relic-discovery-overlay"
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 pointer-events-auto bg-black/90 animate-in fade-in"
          onClick={() => setUnlockedRelicModal(null)}
        >
          <div
            id="relic-discovery-modal"
            className="w-full max-w-md mc-panel-dark text-white p-6 border-4 border-yellow-400 flex flex-col items-center text-center gap-3 relative shadow-[0_0_20px_rgba(234,179,8,0.4)]"
            style={{ fontFamily: "'VT323', monospace" }}
            onClick={e => e.stopPropagation()}
          >
            <span className="text-6xl animate-bounce">{unlockedRelicModal.icon}</span>
            <span className="text-sm uppercase font-bold px-3 py-0.5 bg-yellow-500 text-black font-mono">
              New {unlockedRelicModal.rarity} Relic Discovered!
            </span>
            <h2 className="text-3xl text-yellow-400 font-bold tracking-wider">{unlockedRelicModal.name}</h2>
            <p className="text-base text-gray-200 font-mono leading-tight mc-slot-dark p-3 border-black w-full">
              "{unlockedRelicModal.description}"
            </p>
            <p className="text-sm text-gray-400 italic">
              {unlockedRelicModal.lore}
            </p>
            <div className="text-xs font-mono text-emerald-400 mt-1">
              ✓ Recorded into Explorer Journal (+100 XP)
            </div>
            <button
              onClick={() => setUnlockedRelicModal(null)}
              className="mc-btn w-full mt-2 py-2 text-xl font-bold bg-[#16a34a]! text-white border-[#86efac]! cursor-pointer"
            >
              Collect Relic
            </button>
          </div>
        </div>
      )}

      {/* 3. Single Relic Detail View */}
      {selectedRelicDetail && (
        <div
          id="relic-detail-overlay"
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 pointer-events-auto bg-black/80 animate-in fade-in duration-100"
          onClick={() => setSelectedRelicDetail(null)}
        >
          <div
            id="relic-detail-modal"
            className="w-full max-w-sm mc-panel-dark text-white p-5 border-4 border-black flex flex-col items-center text-center gap-2.5"
            style={{ fontFamily: "'VT323', monospace" }}
            onClick={e => e.stopPropagation()}
          >
            <span className="text-5xl">{selectedRelicDetail.icon}</span>
            <h3 className="text-2xl text-yellow-400 font-bold tracking-wider">{selectedRelicDetail.name}</h3>
            <span className="text-xs uppercase px-2 py-0.5 bg-black/60 text-gray-300 font-mono">
              {selectedRelicDetail.rarity} • {selectedRelicDetail.biome}
            </span>
            <p className="text-sm text-gray-200 mc-slot-dark p-3 border-black text-left w-full mt-1 font-mono">
              {selectedRelicDetail.description}
            </p>
            <p className="text-xs text-gray-400 italic text-left w-full font-mono">
              {selectedRelicDetail.lore}
            </p>
            {selectedRelicDetail.foundAt && (
              <div className="text-xs font-mono text-gray-400 w-full text-left pt-1.5 border-t border-gray-700">
                Unearthed at X: {selectedRelicDetail.foundAt.x}, Z: {selectedRelicDetail.foundAt.z} on{' '}
                {selectedRelicDetail.foundAt.date}
              </div>
            )}
            <button
              onClick={() => setSelectedRelicDetail(null)}
              className="mc-btn w-full mt-2 py-1.5 text-lg font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 4. Game Settings & Options Modal */}
      {isSettingsOpen && (
        <div
          id="game-settings-overlay"
          className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-4 md:p-6 pointer-events-auto bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsSettingsOpen(false)}
        >
          <div
            id="game-settings-modal"
            className="w-full max-w-xl max-h-[92vh] mc-panel-dark text-white flex flex-col overflow-hidden"
            style={{ fontFamily: "'VT323', monospace" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header with Title & Close */}
            <div className="flex justify-between items-center px-4 py-3 bg-[#181818] border-b-2 border-black">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 mc-slot-dark flex items-center justify-center text-xl text-yellow-400">
                  {settingsTab === 'tutorial' ? '📖' : '⚙️'}
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-wider text-yellow-400 leading-tight">
                    {settingsTab === 'tutorial' ? 'FIELD GUIDE & TUTORIAL' : 'GAME OPTIONS & SETTINGS'}
                  </h2>
                  <p className="text-xs text-gray-400 font-mono">
                    Controls, gameplay options, world configuration & biome controls
                  </p>
                </div>
              </div>
              <button
                id="close-settings-btn"
                onClick={() => setIsSettingsOpen(false)}
                className="mc-btn px-2.5 py-1 text-sm cursor-pointer"
                title="Close (ESC)"
              >
                <X className="w-5 h-5 inline" />
              </button>
            </div>

            {/* Modal Sub-Tabs */}
            <div className="flex border-b-2 border-black bg-[#151515] px-3 pt-2 gap-1.5 overflow-x-auto text-sm">
              <button
                onClick={() => setSettingsTab('options')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-base font-bold border-t-2 border-x-2 cursor-pointer transition-none ${
                  settingsTab === 'options'
                    ? 'mc-panel text-black border-black font-bold'
                    : 'mc-btn text-gray-300'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>PREFERENCES</span>
              </button>
              <button
                onClick={() => setSettingsTab('tutorial')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-base font-bold border-t-2 border-x-2 cursor-pointer transition-none ${
                  settingsTab === 'tutorial'
                    ? 'mc-panel text-black border-black font-bold'
                    : 'mc-btn text-gray-300'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>CONTROLS & GUIDE</span>
              </button>
            </div>

            {/* TAB 1: TUTORIAL VIEW */}
            {settingsTab === 'tutorial' ? (
              <div className="space-y-4 overflow-y-auto p-4 sm:p-5 flex-1 text-white">
                {/* Mobile Touch & Gesture Controls */}
                <div className="mc-slot-dark p-3.5 border-2 border-gray-700 space-y-2.5">
                  <h3 className="text-xl font-bold border-b-2 border-black pb-1 flex items-center gap-2 text-sky-400">
                    <span>📱 Mobile Touch Controls</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm font-mono">
                    <div className="mc-slot-dark p-2 border-black">
                      <span className="font-bold text-yellow-400 block mb-1">🕹️ Virtual Joystick (Bottom Left)</span>
                      Drag your thumb across the bottom-left disk to smoothly run in any 360° direction.
                    </div>
                    <div className="mc-slot-dark p-2 border-black">
                      <span className="font-bold text-yellow-400 block mb-1">🖐️ Camera Pan & Pinch Zoom</span>
                      Drag across the terrain to pan your view. Pinch with two fingers (or scroll wheel) to zoom camera in/out.
                    </div>
                    <div className="mc-slot-dark p-2 border-black">
                      <span className="font-bold text-yellow-400 block mb-1">⚔️ Action Pads (Bottom Right)</span>
                      Tap <b className="text-red-400">ATTACK</b> to strike, <b className="text-amber-400">DASH</b> to evade, and <b className="text-emerald-400">DIG / ACT</b> to open chests, unearth relics, or light monoliths.
                    </div>
                    <div className="mc-slot-dark p-2 border-black">
                      <span className="font-bold text-yellow-400 block mb-1">🎒 Hotbar & Secondary Actions</span>
                      Tap any weapon slot in the bottom hotbar to equip it. Tap <b className="text-rose-400">HEAL</b>, <b className="text-sky-400">PULSE</b>, or <b className="text-orange-400">CAMP</b> for rapid field survival.
                    </div>
                  </div>
                </div>

                {/* PC Keyboard & Mouse Reference */}
                <div className="mc-slot-dark p-3.5 border-2 border-gray-700 space-y-2.5">
                  <h3 className="text-xl font-bold border-b-2 border-black pb-1 flex items-center gap-2 text-emerald-400">
                    <span>⌨️ Keyboard & Mouse Controls</span>
                  </h3>
                  <div className="space-y-1.5 text-xs sm:text-sm font-mono">
                    <div className="flex justify-between items-center mc-slot-dark p-2 border-black">
                      <span className="text-gray-200">Wanderer Movement</span>
                      <span className="bg-black/60 px-2 py-0.5 font-bold text-yellow-400 rounded">[W] [A] [S] [D] / Click Ground</span>
                    </div>
                    <div className="flex justify-between items-center mc-slot-dark p-2 border-black">
                      <span className="text-gray-200">Primary Weapon Strike</span>
                      <span className="bg-black/60 px-2 py-0.5 font-bold text-yellow-400 rounded">[Spacebar]</span>
                    </div>
                    <div className="flex justify-between items-center mc-slot-dark p-2 border-black">
                      <span className="text-gray-200">Dodge Dash (Invulnerable Evade)</span>
                      <span className="bg-black/60 px-2 py-0.5 font-bold text-yellow-400 rounded">[Shift]</span>
                    </div>
                    <div className="flex justify-between items-center mc-slot-dark p-2 border-black">
                      <span className="text-gray-200">Switch Weapons (Blade, Bow, Staff, Glaive)</span>
                      <span className="bg-black/60 px-2 py-0.5 font-bold text-yellow-400 rounded">[1] [2] [3] [4]</span>
                    </div>
                    <div className="flex justify-between items-center mc-slot-dark p-2 border-black">
                      <span className="text-gray-200">Drink Healing Flask</span>
                      <span className="bg-black/60 px-2 py-0.5 font-bold text-yellow-400 rounded">[Q]</span>
                    </div>
                    <div className="flex justify-between items-center mc-slot-dark p-2 border-black">
                      <span className="text-gray-200">Dig Ground / Loot Chest / Awaken Monolith</span>
                      <span className="bg-black/60 px-2 py-0.5 font-bold text-yellow-400 rounded">[E]</span>
                    </div>
                    <div className="flex justify-between items-center mc-slot-dark p-2 border-black">
                      <span className="text-gray-200">Sonar Pulse Echo (Detect Nearby Secrets)</span>
                      <span className="bg-black/60 px-2 py-0.5 font-bold text-yellow-400 rounded">[C]</span>
                    </div>
                    <div className="flex justify-between items-center mc-slot-dark p-2 border-black">
                      <span className="text-gray-200">Pitch / Pack Cozy Campfire</span>
                      <span className="bg-black/60 px-2 py-0.5 font-bold text-yellow-400 rounded">[F]</span>
                    </div>
                    <div className="flex justify-between items-center mc-slot-dark p-2 border-black">
                      <span className="text-gray-200">Pet Faithful Companion</span>
                      <span className="bg-black/60 px-2 py-0.5 font-bold text-yellow-400 rounded">[R]</span>
                    </div>
                    <div className="flex justify-between items-center mc-slot-dark p-2 border-black">
                      <span className="text-gray-200">Wilderness Build & Craft Forge</span>
                      <span className="bg-black/60 px-2 py-0.5 font-bold text-yellow-400 rounded">[B]</span>
                    </div>
                    <div className="flex justify-between items-center mc-slot-dark p-2 border-black">
                      <span className="text-gray-200">Open Explorer Compendium</span>
                      <span className="bg-black/60 px-2 py-0.5 font-bold text-yellow-400 rounded">[J]</span>
                    </div>
                    <div className="flex justify-between items-center mc-slot-dark p-2 border-black">
                      <span className="text-gray-200">Field Guide & Tutorial</span>
                      <span className="bg-black/60 px-2 py-0.5 font-bold text-yellow-400 rounded">[H]</span>
                    </div>
                  </div>
                </div>

                {/* Interconnected Game Mechanics Guide */}
                <div className="mc-slot-dark p-3.5 border-2 border-gray-700 space-y-2.5">
                  <h3 className="text-xl font-bold border-b-2 border-black pb-1 flex items-center gap-2 text-orange-400">
                    <span>✨ Interconnected Game Systems</span>
                  </h3>
                  <div className="space-y-2 text-xs sm:text-sm font-mono">
                    <div className="mc-slot-dark p-2.5 border-black">
                      <b className="text-emerald-400 block text-sm mb-1">🏗️ Progressive Monster Looting & Construction</b>
                      You start with simple survival gear. Vanquish slimes, skeletons, spiders, and ancient golems to harvest Wood, Stone, Iron, Bone, Silk, and Arcane Crystals. Press <kbd className="px-1.5 py-0.5 bg-black/60 border rounded font-mono text-yellow-400">[B]</kbd> to build houses, watchtowers, workbenches, defense turrets, and forge mighty armaments!
                    </div>
                    <div className="mc-slot-dark p-2.5 border-black">
                      <b className="text-amber-400 block text-sm mb-1">🌟 Relic Perks & Passives</b>
                      Every discovered relic permanently enchants your character! Relics grant extra Max HP, stamina regeneration, movement speed, critical hit chance, and loot multipliers. Check your Journal to view active passives.
                    </div>
                    <div className="mc-slot-dark p-2.5 border-black">
                      <b className="text-sky-400 block text-sm mb-1">⚡ Monolith Sanctuaries & Fast Travel</b>
                      Awakening ancient monoliths protects you in a celestial sanctuary (+5 HP/s, +10 STM/s, monsters cannot enter) and connects to the Leyline network for 1-tap Fast Travel via your Journal.
                    </div>
                    <div className="mc-slot-dark p-2.5 border-black">
                      <b className="text-orange-400 block text-sm mb-1">🏕️ Campfire Forge & Field Alchemy</b>
                      Pitch a campfire to sleep until dawn, brew Healing Flasks, roast feasts for your companion, and permanently hone weapon base damage on the field forge!
                    </div>
                    <div className="mc-slot-dark p-2.5 border-black">
                      <b className="text-pink-400 block text-sm mb-1">🦊 Faithful Companion Synergies</b>
                      Your companion barks and flashes a radar ping whenever buried treasures or monoliths are near. A happy companion vacuums dropped gems and gold coins straight into your pouch!
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* TAB 2: SETTINGS OPTIONS VIEW */
              <div className="space-y-4 overflow-y-auto p-4 sm:p-5 flex-1 text-white">
                {/* Audio Toggle */}
                <div className="mc-slot-dark p-3.5 border-2 border-gray-700 flex justify-between items-center">
                  <div className="flex items-center gap-2.5 text-lg sm:text-xl">
                    {settings.soundEnabled ? (
                      <Volume2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-red-400" />
                    )}
                    <span>Sound Effects</span>
                  </div>
                  <button
                    onClick={() =>
                      setSettings(s => ({ ...s, soundEnabled: !s.soundEnabled }))
                    }
                    className={`mc-btn px-4 py-1.5 text-base font-bold ${
                      settings.soundEnabled !== false ? 'bg-[#16a34a]! text-white border-[#86efac]!' : 'opacity-60'
                    }`}
                  >
                    {settings.soundEnabled !== false ? 'ENABLED' : 'MUTED'}
                  </button>
                </div>

                {/* Companion Choice */}
                <div className="mc-slot-dark p-3.5 border-2 border-gray-700 space-y-2.5">
                  <span className="text-lg font-bold text-yellow-400 block">Nomad Companion</span>
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
                        className={`mc-btn text-base py-2 text-center font-bold ${
                          (settings.companionType ?? 'fox') === p.id
                            ? 'bg-[#16a34a]! text-white border-[#86efac]!'
                            : 'text-gray-300'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Biome Presets */}
                <div className="mc-slot-dark p-3.5 border-2 border-gray-700 space-y-2.5">
                  <span className="text-lg font-bold text-yellow-400 block">Biome Presets</span>
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
                        className={`mc-btn text-base py-2 font-bold ${
                          settings.terrainType === b.id ? 'bg-[#16a34a]! text-white border-[#86efac]!' : 'text-gray-300'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Day/Night Cycle Toggle */}
                <div className="mc-slot-dark p-3.5 border-2 border-gray-700 flex justify-between items-center">
                  <span className="text-lg font-bold">Day & Night Cycle</span>
                  <button
                    onClick={() =>
                      setSettings(s => ({ ...s, dayNightCycle: !s.dayNightCycle }))
                    }
                    className={`mc-btn px-4 py-1.5 text-base font-bold ${
                      settings.dayNightCycle !== false ? 'bg-[#16a34a]! text-white border-[#86efac]!' : 'opacity-60'
                    }`}
                  >
                    {settings.dayNightCycle !== false ? 'DYNAMIC' : 'FROZEN'}
                  </button>
                </div>

                {/* Render Distance */}
                <div className="mc-slot-dark p-3.5 border-2 border-gray-700 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Infinite Render Chunks</span>
                    <span className="text-xs font-mono text-gray-400">
                      {settings.renderDistance === 1
                        ? '3x3 (Fast)'
                        : settings.renderDistance === 3
                        ? '7x7 (Far)'
                        : '5x5 (Balanced)'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { d: 1, l: 'Fast (3x3)' },
                      { d: 2, l: 'Balanced' },
                      { d: 3, l: 'Far (7x7)' },
                    ].map(opt => (
                      <button
                        key={opt.d}
                        onClick={() => setSettings(s => ({ ...s, renderDistance: opt.d }))}
                        className={`mc-btn text-sm py-1.5 font-bold ${
                          (settings.renderDistance ?? 2) === opt.d
                            ? 'bg-[#16a34a]! text-white border-[#86efac]!'
                            : 'text-gray-300'
                        }`}
                      >
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reset / Warp to Origin */}
                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => {
                      charPosRef.current = { x: 0, y: 0 };
                      targetPosRef.current = { x: 0, y: 0 };
                      setCharPos({ x: 0, y: 0 });
                      setTargetPos({ x: 0, y: 0 });
                      setCameraPan({ x: 0, y: 0 });
                      setPlayerChunk({ cx: 0, cz: 0 });
                      playerMotionRef.current = {
                        x: 0,
                        y: 0,
                        elevation: getTerrainHeight(0, 0, settings),
                        targetX: 0,
                        targetY: 0,
                        rotation: 0,
                        isMoving: false,
                        chunk: { cx: 0, cz: 0 },
                      };
                      setIsSettingsOpen(false);
                      showToast('🧭 Teleported back to Origin (0, 0)');
                    }}
                    className="mc-btn flex-1 py-2 bg-[#2563eb]! text-white border-[#93c5fd]! text-base font-bold cursor-pointer"
                  >
                    <Compass className="w-4 h-4 inline mr-1.5" /> Return to Origin (0, 0)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Wilderness Build & Craft Forge Drawer */}
      <BuildCraftDrawer
        isOpen={isBuildDrawerOpen}
        onClose={() => setIsBuildDrawerOpen(false)}
        activeTab={activeBuildTab}
        setActiveTab={setActiveBuildTab}
        resources={stats.resources || { wood: 0, stone: 0, iron: 0, bone: 0, silk: 0, crystal: 0 }}
        gold={stats.gold}
        stats={stats}
        blueprints={BUILDABLE_BLUEPRINTS}
        weaponRecipes={WEAPON_RECIPES}
        allWeapons={ALL_WEAPONS}
        unlockedWeapons={stats.unlockedWeapons || ['starter_club']}
        activeWeaponIndex={activeWeaponIndex}
        placedStructures={placedStructures}
        charPos={charPos}
        onStartBuilding={handleStartBuilding}
        onForgeWeapon={handleForgeWeapon}
        onDemolishStructure={handleDemolishStructure}
        onSelectWeapon={selectWeaponByIndex}
        canAffordBlueprint={canAffordBlueprint}
        canAffordRecipe={canAffordRecipe}
      />

      {/* 6. Active Building Placement Mode Banner */}
      {buildMode && selectedBlueprint && (
        <BuildPlacementHUD
          blueprint={selectedBlueprint}
          buildPreview={buildPreview}
          onConfirm={handleConfirmPlacement}
          onCancel={() => {
            setBuildMode(false);
            setSelectedBlueprint(null);
            showToast('Build placement cancelled');
          }}
          onRotate={dir => setBuildRotation(r => r + dir * (Math.PI / 4))}
        />
      )}

      {/* 7. Character Stats & Customization Sheet Modal */}
      <CharacterSheetModal
        isOpen={isCharacterSheetOpen}
        onClose={() => setIsCharacterSheetOpen(false)}
        customization={characterCustomization}
        onUpdateCustomization={newConfig => setCharacterCustomization(newConfig)}
        equippedArmor={dungeonsStats.equippedArmor}
        onEquipArmor={armor => handleEquipItem(armor)}
        dungeonsInventory={dungeonsStats.inventory}
        playerCombatStats={{
          hp: Math.round(playerCombatRef.current.hp),
          maxHp: dungeonsStats.maxHp,
          stamina: Math.round(playerCombatRef.current.stamina),
          maxStamina: playerCombatRef.current.maxStamina,
        }}
        level={stats.level}
        xp={stats.xp}
        xpToNextLevel={stats.level * 120}
        dungeonsLevel={dungeonsStats.level}
        emeralds={dungeonsStats.emeralds}
        monstersSlainCount={dungeonsStats.mobsKilled || 0}
        structuresBuiltCount={placedStructures.length}
      />

      {/* 8. Village Merchant & Trader Trade Modal */}
      <VillageTradeModal
        isOpen={isVillageTradeOpen}
        onClose={() => {
          setIsVillageTradeOpen(false);
          setActiveTradeVillager(null);
        }}
        activeVillager={activeTradeVillager || nearVillager}
        emeralds={dungeonsStats.emeralds}
        resources={{
          wood: stats.resources?.wood || 0,
          stone: stats.resources?.stone || 0,
          iron: stats.resources?.iron || 0,
          crystals: stats.resources?.crystal || 0,
        }}
        onExecuteTrade={handleExecuteTrade}
      />
    </div>
  );
};

export default App;
