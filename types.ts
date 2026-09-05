
export interface Position {
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
  relicsFound: number;
  obelisksLit: number;
  stepsWalked: number;
  secretsDug: number;
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
