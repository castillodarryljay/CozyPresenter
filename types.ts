
export interface Position {
  x: number;
  y: number;
}

export interface PlayerMotionState {
  x: number;
  y: number;
  elevation: number;
  targetX: number;
  targetY: number;
  rotation: number;
  isMoving: boolean;
  chunk: { cx: number; cz: number };
}

export interface Blackboard {
  id?: string;
  x: number;
  y: number;
}

export type TerrainType = 'hills' | 'mountains' | 'plains' | 'desert' | 'flat';

export type RelicRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Relic {
  id: string;
  name: string;
  rarity: RelicRarity;
  icon: string;
  description: string;
  lore: string;
  biome: string;
  perkTitle?: string;
  perkEffect?: string;
  foundAt?: { x: number; z: number; date: string };
}

export type FeatureType = 'obelisk' | 'chest' | 'buried_mound' | 'campfire' | 'ancient_shrine';

export interface WorldFeature {
  id: string;
  type: FeatureType;
  x: number; // in world coords
  y: number; // in world coords (z in 3D)
  elevation: number;
  active: boolean; // whether activated / dug
  relicId?: string;
  riddle?: string;
  discovered: boolean;
}

export type CompanionType = 'fox' | 'dog' | 'capybara';
export type CompanionMood = 'happy' | 'sniffing' | 'excited' | 'sleepy' | 'curious';

export interface CompanionState {
  type: CompanionType;
  name: string;
  happiness: number; // 0 to 100
  mood: CompanionMood;
  detectedFeatureId?: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  completed: boolean;
  xpReward: number;
}

export interface PlayerStats {
  level: number;
  xp: number;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  potions: number;
  monstersDefeated: number;
  gold: number;
  relicsFound: number;
  obelisksLit: number;
  stepsWalked: number;
  secretsDug: number;
  resources: ResourceInventory;
  unlockedWeapons: string[];
  structuresBuilt: number;
}

export type ResourceType = 'wood' | 'stone' | 'iron' | 'bone' | 'silk' | 'crystal';

export interface ResourceInventory {
  wood: number;
  stone: number;
  iron: number;
  bone: number;
  silk: number;
  crystal: number;
}

export type StructureType =
  | 'house'
  | 'workbench'
  | 'watchtower'
  | 'turret'
  | 'storage_chest'
  | 'tent'
  | 'arcane_conduit';

export interface PlacedStructure {
  id: string;
  type: StructureType;
  x: number;
  y: number; // z in 3D
  elevation: number;
  rotation: number;
  createdAt: number;
  customName?: string;
  lastActionTime?: number;
}

export interface BuildableStructureBlueprint {
  type: StructureType;
  name: string;
  category: 'shelter' | 'crafting' | 'defense' | 'utility';
  icon: string;
  description: string;
  benefits: string;
  cost: Partial<Record<ResourceType, number>> & { gold?: number };
}

export interface WeaponRecipe {
  weaponId: string;
  name: string;
  type: WeaponType;
  icon: string;
  description: string;
  damage: number;
  cost: Partial<Record<ResourceType, number>> & { gold?: number };
  requiresWorkbench?: boolean;
}

export type WeaponType = 'sword' | 'bow' | 'staff' | 'halberd';

export interface Weapon {
  id: string;
  name: string;
  type: WeaponType;
  damage: number;
  range: number;
  cooldown: number; // milliseconds between attacks
  icon: string;
  color: string;
  description: string;
  staminaCost?: number;
  projectileSpeed?: number;
  projectileColor?: string;
}

export type MonsterType = 'slime' | 'skeleton' | 'golem' | 'spider';

export interface Monster {
  id: string;
  type: MonsterType;
  name: string;
  x: number;
  y: number; // z in 3D
  elevation: number;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  aggroRange: number;
  attackRange: number;
  xpReward: number;
  lastAttackTime: number;
  hurtUntilTime: number;
  rotation: number;
  state: 'idle' | 'patrol' | 'chase' | 'attack' | 'dead';
  patrolCenter: { x: number; y: number };
  deathTime?: number;
}

export interface Projectile {
  id: string;
  type: 'arrow' | 'magic' | 'slash';
  x: number;
  y: number; // z in 3D
  z: number; // elevation in 3D
  vx: number;
  vy: number; // vz in 3D
  vz: number;
  damage: number;
  color: string;
  distanceTraveled: number;
  maxDistance: number;
}

export interface DamageNumber {
  id: string;
  text: string;
  x: number;
  y: number; // z in 3D
  z: number; // elevation
  color: string;
  isCrit?: boolean;
  createdAt: number;
}

export type LootType = 'xp' | 'gold' | 'potion' | 'shard' | 'wood' | 'stone' | 'iron' | 'bone' | 'silk' | 'crystal';

export interface LootDrop {
  id: string;
  type: LootType;
  name: string;
  icon: string;
  x: number;
  y: number; // z in 3D
  z: number; // elevation
  value: number;
  color: string;
  createdAt: number;
}

export interface MapSettings {
  backgroundColor: string;
  characterColor: string;
  terrainType: TerrainType;
  terrainHeight?: number;
  hasTrees?: boolean;
  hasWater?: boolean;
  hasClouds?: boolean;
  seed: number;
  renderDistance?: number;
  soundEnabled?: boolean;
  dayNightCycle?: boolean;
  companionType?: CompanionType;
}
