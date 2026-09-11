// Minecraft Dungeons Core Types and Schemas

export type DungeonsRarity = 'common' | 'rare' | 'unique';

export type DungeonsItemCategory = 'melee' | 'ranged' | 'armor' | 'artifact';

export type MeleeType = 'sword' | 'gauntlets' | 'axe' | 'mace' | 'glaive' | 'dagger' | 'claymore' | 'katana';
export type RangedType = 'bow' | 'shortbow' | 'crossbow' | 'longbow' | 'power_bow' | 'scatter_crossbow';
export type ArmorType = 'light' | 'medium' | 'heavy' | 'robe';

export type EnchantmentId =
  // Melee enchantments
  | 'radiance'
  | 'critical_hit'
  | 'sharpness'
  | 'leeching'
  | 'fire_aspect'
  | 'swirling'
  | 'committed'
  // Ranged enchantments
  | 'multi_shot'
  | 'power'
  | 'ricochet'
  | 'piercing'
  | 'fuse_shot'
  | 'infinity'
  // Armor enchantments
  | 'protection'
  | 'thorns'
  | 'swiftfooted'
  | 'deflect'
  | 'chilling'
  | 'potion_barrier'
  | 'snowball';

export interface EnchantmentDefinition {
  id: EnchantmentId;
  name: string;
  icon: string;
  category: 'melee' | 'ranged' | 'armor';
  description: string;
  tierEffects: [string, string, string]; // Descriptions for Tier 1, 2, 3
  tierCosts: [number, number, number]; // Points required: usually 1, 2, 3
}

export interface AppliedEnchantment {
  id: EnchantmentId;
  tier: number; // 0 = unlearned, 1..3
}

export interface DungeonsGearItem {
  id: string;
  name: string;
  category: 'melee' | 'ranged' | 'armor';
  subType: MeleeType | RangedType | ArmorType;
  rarity: DungeonsRarity;
  power: number;
  icon: string;
  color: string;
  description: string;
  uniquePerk?: string; // Special innate perk for Unique items
  
  // Combat stats
  damage?: number; // for weapons
  range?: number;
  attackSpeed?: number; // attacks per second multiplier
  arrowCost?: number; // for bows
  hpBonus?: number; // for armor
  damageReduction?: number; // percentage (0.15 = 15%)
  soulGathering?: number; // e.g. +1, +2
  moveSpeedBonus?: number; // percentage
  
  // Available enchantment slots (up to 3)
  enchantmentSlots: AppliedEnchantment[];
  salvageEmeralds: number;
}

export type ArtifactEffect =
  | 'death_cap_mushroom'
  | 'fireworks_arrow'
  | 'corrupted_beacon'
  | 'boots_of_swiftness'
  | 'iron_hide_amulet'
  | 'harvester'
  | 'wind_horn'
  | 'tasty_bone'
  | 'golem_kit';

export interface DungeonsArtifact {
  id: string;
  name: string;
  category: 'artifact';
  rarity: DungeonsRarity;
  power: number;
  icon: string;
  color: string;
  description: string;
  effect: ArtifactEffect;
  cooldownSec: number;
  soulCost?: number;
  durationSec?: number;
  salvageEmeralds: number;
}

export type DungeonsItem = DungeonsGearItem | DungeonsArtifact;

export type DungeonsInventoryState = DungeonsItem[];

export interface DungeonsMission {
  id: string;
  name: string;
  icon: string;
  region: string;
  description: string;
  recommendedPower: number;
  difficulty: 'Default' | 'Adventure' | 'Apocalypse';
  targetKills: number;
  targetChests: number;
  potentialDrops: string[];
  rewardEmeralds?: number;
  bossName?: string;
  completed?: boolean;
}

export interface DungeonsPlayerStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  enchantmentPoints: number;
  emeralds: number;
  arrows: number;
  souls: number;
  maxSouls: number;
  hp: number;
  maxHp: number;
  
  // Cooldowns
  potionCooldownRemaining: number; // in seconds
  potionCooldownMax: number; // 25s
  rollCooldownRemaining: number;
  rollCooldownMax: number; // 2.5s
  
  // Equipped Gear
  equippedMelee: DungeonsGearItem;
  equippedRanged: DungeonsGearItem;
  equippedArmor: DungeonsGearItem;
  equippedArtifacts: [DungeonsArtifact | null, DungeonsArtifact | null, DungeonsArtifact | null];
  artifactCooldowns: [number, number, number]; // seconds remaining
  
  // Computed overall gear power level
  powerLevel: number;
  
  // Inventory storage
  inventory: DungeonsItem[];
  
  // Active temporary buffs
  buffs: {
    mushroomEndTime: number;
    ironHideEndTime: number;
    bootsEndTime: number;
    fireworkLoaded: boolean;
    potionBarrierEndTime: number;
  };
  
  // Tracking
  mobsKilled: number;
  chestsOpened: number;
  emeraldsCollected: number;
}
