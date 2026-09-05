import { Relic, Quest, WorldFeature, Weapon, Monster, MonsterType, BuildableStructureBlueprint, WeaponRecipe } from './types';

export const ALL_WEAPONS: Weapon[] = [
  {
    id: 'starter_club',
    name: 'Carved Oak Club',
    type: 'sword',
    damage: 18,
    range: 2.3,
    cooldown: 380,
    staminaCost: 8,
    icon: '🪵',
    color: '#854d0e',
    description: 'A hand-carved hardwood branch. Sturdy starter weapon for defending against low-level wilderness slimes.',
  },
  {
    id: 'iron_sword',
    name: 'Iron Nomad Blade',
    type: 'sword',
    damage: 34,
    range: 2.8,
    cooldown: 350,
    staminaCost: 12,
    icon: '⚔️',
    color: '#94a3b8',
    description: 'Forged from meteorite iron. Fast sweeping melee slash with sharp knockback.',
  },
  {
    id: 'nomad_bow',
    name: 'Yew Recurve Bow',
    type: 'bow',
    damage: 44,
    range: 22,
    cooldown: 520,
    staminaCost: 16,
    icon: '🏹',
    color: '#eab308',
    projectileSpeed: 24,
    projectileColor: '#facc15',
    description: 'Crafted from supple mountain yew and spider silk. Fires swift arrows to strike foes from distance.',
  },
  {
    id: 'celestial_staff',
    name: 'Celestial Runestaff',
    type: 'staff',
    damage: 60,
    range: 16,
    cooldown: 720,
    staminaCost: 22,
    icon: '🪄',
    color: '#06b6d4',
    projectileSpeed: 16,
    projectileColor: '#38bdf8',
    description: 'Imbued with azure starlight and arcane crystals. Hurls homing celestial plasma orbs that blast foes.',
  },
  {
    id: 'sunstone_halberd',
    name: 'Sunstone War Glaive',
    type: 'halberd',
    damage: 52,
    range: 3.8,
    cooldown: 500,
    staminaCost: 18,
    icon: '🔱',
    color: '#f97316',
    description: 'Heavy polearm capped with warm sunstone and monster bones. Wide sweeping reach striking multiple foes.',
  },
];

export const BUILDABLE_BLUEPRINTS: BuildableStructureBlueprint[] = [
  {
    type: 'house',
    name: 'Nomad Homestead (House)',
    category: 'shelter',
    icon: '🏡',
    description: 'A sturdy timber & cobblestone house with a warm fireplace, glass windows, and smoking chimney.',
    benefits: 'Regenerates +18 HP/s and +25 STM/s when near. Grants complete monster ward sanctuary and allows sleeping anytime.',
    cost: {
      wood: 12,
      stone: 8,
      iron: 2,
    },
  },
  {
    type: 'workbench',
    name: 'Carpentry & Weapon Forge',
    category: 'crafting',
    icon: '⚒️',
    description: 'A heavy carpentry bench outfitted with an iron anvil, vice, and hanging smithing tools.',
    benefits: 'Unlocks forging advanced weapons (Iron Blade, Recurve Bow, Runestaff, War Glaive) from monster drops!',
    cost: {
      wood: 6,
      stone: 4,
    },
  },
  {
    type: 'watchtower',
    name: 'Stone Sentinel Watchtower',
    category: 'defense',
    icon: '🏰',
    description: 'A tall crenelated cobblestone tower crowned with a blazing starlight beacon.',
    benefits: 'Illuminates night skies and radiates an aura that pushes hostile monsters back up to 24m away.',
    cost: {
      stone: 16,
      wood: 6,
      iron: 4,
    },
  },
  {
    type: 'turret',
    name: 'Automated Defense Ballista',
    category: 'defense',
    icon: '🏹',
    description: 'A swiveling mechanical ballista on a sturdy tripod that guards your camp.',
    benefits: 'Automatically detects and fires piercing arrows at hostile monsters within 16 meters.',
    cost: {
      wood: 8,
      bone: 4,
      silk: 3,
      iron: 2,
    },
  },
  {
    type: 'storage_chest',
    name: 'Reinforced Supply Stash',
    category: 'utility',
    icon: '📦',
    description: 'An iron-banded cedar chest built to safeguard your valuable wilderness bounties.',
    benefits: 'Stores materials and passively synthesizes +1 random material every day/night cycle.',
    cost: {
      wood: 5,
      iron: 2,
    },
  },
  {
    type: 'tent',
    name: 'Expedition Canvas Tent',
    category: 'shelter',
    icon: '⛺',
    description: 'A cozy triangular lean-to shelter with wood pegs, spun silk tarp, and a wool bedroll.',
    benefits: 'Gives companion +30% happiness boost and lets you rest safely through the night.',
    cost: {
      wood: 5,
      silk: 2,
    },
  },
  {
    type: 'arcane_conduit',
    name: 'Leyline Teleport Conduit',
    category: 'utility',
    icon: '⚡',
    description: 'An awakened runic waypoint that connects your outpost directly into the world leyline network.',
    benefits: 'Creates a custom Fast Travel waypoint you can instantly teleport to from anywhere in the Explorer Journal!',
    cost: {
      stone: 10,
      crystal: 4,
      iron: 4,
    },
  },
];

export const WEAPON_RECIPES: WeaponRecipe[] = [
  {
    weaponId: 'starter_club',
    name: 'Carved Oak Club',
    type: 'sword',
    icon: '🪵',
    description: 'Hand-carved branch. Default starting nomad weapon.',
    damage: 18,
    cost: {},
  },
  {
    weaponId: 'iron_sword',
    name: 'Iron Nomad Blade',
    type: 'sword',
    icon: '⚔️',
    description: 'Sharp forged iron blade with fast sweeping slashes.',
    damage: 34,
    cost: {
      wood: 6,
      iron: 4,
      gold: 20,
    },
    requiresWorkbench: true,
  },
  {
    weaponId: 'nomad_bow',
    name: 'Yew Recurve Bow',
    type: 'bow',
    icon: '🏹',
    description: 'High-tension bow strung with sturdy spider silk. High range.',
    damage: 44,
    cost: {
      wood: 8,
      silk: 4,
      gold: 30,
    },
    requiresWorkbench: true,
  },
  {
    weaponId: 'celestial_staff',
    name: 'Celestial Runestaff',
    type: 'staff',
    icon: '🪄',
    description: 'Arcane starlight catalyst firing seeking plasma bursts.',
    damage: 60,
    cost: {
      wood: 6,
      crystal: 4,
      gold: 60,
    },
    requiresWorkbench: true,
  },
  {
    weaponId: 'sunstone_halberd',
    name: 'Sunstone War Glaive',
    type: 'halberd',
    icon: '🔱',
    description: 'Devastating heavy polearm crafted from monster bone and sun iron.',
    damage: 52,
    cost: {
      iron: 8,
      bone: 6,
      crystal: 2,
      gold: 75,
    },
    requiresWorkbench: true,
  },
];

export const ALL_RELICS: Relic[] = [
  // Plains & Forest
  {
    id: 'oak_heart_seed',
    name: 'Ancient Oak Heart Seed',
    rarity: 'common',
    icon: '🌱',
    description: 'A petrified acorn humming with primordial forest magic.',
    lore: 'Elder nomads say planting this in rich loamy soil causes trees to whisper secrets of past wanderers.',
    biome: 'Plains & Hills',
    perkTitle: 'Verdant Vitality',
    perkEffect: '+25 Max HP & campfire healing rate increased by 50%.',
  },
  {
    id: 'verdant_compass',
    name: 'Verdant Moss Compass',
    rarity: 'rare',
    icon: '🧭',
    description: 'A magnetic needle encased in enchanted amber and moss.',
    lore: 'Never points toward magnetic north, but always toward the nearest natural wonder or underground stream.',
    biome: 'Plains',
    perkTitle: 'Leyline Acoustic',
    perkEffect: 'Sonar pulse radar range expanded by 50% (reveals secrets from 45m away).',
  },
  {
    id: 'lunar_moth_amber',
    name: 'Lunar Moth in Amber',
    rarity: 'epic',
    icon: '🦋',
    description: 'A perfectly preserved moth that glows with faint phosphorescence.',
    lore: 'Attracted by starlight, nomadic cartographers used these to navigate dense cloud cover during moonless nights.',
    biome: 'Universal',
    perkTitle: 'Starlight Luminescence',
    perkEffect: 'Doubles lantern radiance at night and wards off shadow spiders from lunging.',
  },

  // Mountains & Peaks
  {
    id: 'frost_quartz_core',
    name: 'Frost Quartz Core',
    rarity: 'rare',
    icon: '💎',
    description: 'A geometric mineral that never melts, even when held near an open campfire.',
    lore: 'Mined from the highest crags where the winds chant ancient forgotten hymns.',
    biome: 'Mountains',
    perkTitle: 'Enduring Vigor',
    perkEffect: '+30 Max Stamina & stamina recovers 35% faster.',
  },
  {
    id: 'cloud_feather_talisman',
    name: 'Cloud Feather Talisman',
    rarity: 'legendary',
    icon: '🪶',
    description: 'Weightless plumed relic blessed by the great sky condors.',
    lore: 'Carrying this feather makes stepped mountain ascents feel like walking on morning fog.',
    biome: 'Mountains',
    perkTitle: 'Zephyr Stride',
    perkEffect: '+20% movement speed; dodge dash moves 35% farther and costs 40% less stamina.',
  },
  {
    id: 'echoing_geode',
    name: 'Echoing Geode',
    rarity: 'common',
    icon: '🔮',
    description: 'A hollow cracked stone that rings like a distant temple bell when tapped.',
    lore: 'Nomad children held these to their ears to listen to storms hundreds of leagues away.',
    biome: 'Hills & Mountains',
    perkTitle: 'Subterranean Echo',
    perkEffect: 'Compass chimes when within 30m of unexcavated ruins or chests.',
  },

  // Desert Dunes
  {
    id: 'sunstone_scarab',
    name: 'Sunstone Scarab',
    rarity: 'rare',
    icon: '🪲',
    description: 'Carved from deep gold-flecked sandstone, warm to the touch even at midnight.',
    lore: 'Ancient dune pilgrims placed these around desert obelisks to ward off shifting quicksand.',
    biome: 'Desert',
    perkTitle: 'Midas Touch',
    perkEffect: '+60% extra Gold coins dropped by all monsters and excavated chests.',
  },
  {
    id: 'oasis_teardrop_vial',
    name: 'Vial of the First Oasis',
    rarity: 'epic',
    icon: '💧',
    description: 'A sealed glass phial holding pure, luminescent desert water.',
    lore: 'Legend claims a single drop can turn barren sand into a flowering wildflower meadow.',
    biome: 'Desert',
    perkTitle: 'Nectar of Life',
    perkEffect: 'Healing flasks restore +30 extra HP (+85 HP total) and instantly restore 50 Stamina.',
  },
  {
    id: 'chronos_hourglass',
    name: 'Hourglass of the Red Sands',
    rarity: 'legendary',
    icon: '⏳',
    description: 'An ornate brass hourglass filled with iridescent crimson dust.',
    lore: 'The sand inside flows upward during a full moon. Whispers of the ancient kings echo within its glass.',
    biome: 'Desert',
    perkTitle: 'Temporal Reflexes',
    perkEffect: 'All weapon attack and firing cooldowns reduced by 25%.',
  },

  // Celestial / Night Mystery
  {
    id: 'fallen_star_shard',
    name: 'Fallen Star Shard',
    rarity: 'legendary',
    icon: '⭐',
    description: 'A cosmic mineral that fell from the celestial sphere during an ancient meteor shower.',
    lore: 'Emits a soothing ultraviolet chime. It resonates violently when an ancient obelisk is nearby.',
    biome: 'Night Sky',
    perkTitle: 'Astral Cleave',
    perkEffect: '+25% Critical Hit strike chance dealing 2.0x devastating damage.',
  },
  {
    id: 'celestial_astrolabe',
    name: 'Nomad Astrolabe',
    rarity: 'epic',
    icon: '✨',
    description: 'Intricate brass concentric rings mapping forgotten constellations.',
    lore: 'Used by the first cartographers to chart the infinite stepped horizons before memory began.',
    biome: 'Universal',
    perkTitle: 'Cosmic Cartography',
    perkEffect: 'Grants +50% XP from all exploration and combat discoveries.',
  },
  {
    id: 'petrified_bone_flute',
    name: 'Petrified Bone Flute',
    rarity: 'common',
    icon: '🦴',
    description: 'An ancient carved whistle that your animal companion loves unconditionally.',
    lore: 'When played, all wildlife pauses in quiet reverie.',
    biome: 'Universal',
    perkTitle: 'Pack Harmony',
    perkEffect: 'Loyal companion magnetically vacuums and retrieves distant loot drops up to 12m away.',
  }
];

export const INITIAL_QUESTS: Quest[] = [
  {
    id: 'quest_sonar',
    title: 'Echoes in the Wilderness',
    description: 'Use your Sonar Pulse to scan the surrounding terrain for hidden ruins.',
    progress: 0,
    target: 3,
    completed: false,
    xpReward: 50,
  },
  {
    id: 'quest_first_relic',
    title: 'The Relic Hunter',
    description: 'Unearth a buried treasure mound or open an ancient chest.',
    progress: 0,
    target: 1,
    completed: false,
    xpReward: 100,
  },
  {
    id: 'quest_awaken_obelisk',
    title: 'Awakener of Monoliths',
    description: 'Find and awaken an ancient runic obelisk to illuminate the horizon.',
    progress: 0,
    target: 1,
    completed: false,
    xpReward: 200,
  },
  {
    id: 'quest_wanderlust',
    title: 'Infinite Wanderer',
    description: 'Walk 250 paces into unexplored territory with your companion.',
    progress: 0,
    target: 250,
    completed: false,
    xpReward: 75,
  },
  {
    id: 'quest_pet_love',
    title: 'Nomad\'s Best Friend',
    description: 'Praise and whistle for your loyal companion to raise their happiness.',
    progress: 0,
    target: 3,
    completed: false,
    xpReward: 50,
  },
  {
    id: 'quest_monster_hunter',
    title: 'Wilderness Defender',
    description: 'Defeat hostile beasts roaming the uncharted lands.',
    progress: 0,
    target: 4,
    completed: false,
    xpReward: 120,
  },
  {
    id: 'quest_sharpshooter',
    title: 'Eagle Eye Archer',
    description: 'Strike monsters from a distance using the Recurve Bow or Arcane Staff.',
    progress: 0,
    target: 5,
    completed: false,
    xpReward: 150,
  },
  {
    id: 'quest_golem_slayer',
    title: 'Titan Breaker',
    description: 'Vanquish an Ancient Stone Golem guarding ancient monoliths.',
    progress: 0,
    target: 1,
    completed: false,
    xpReward: 250,
  },
  {
    id: 'quest_gather_loot',
    title: 'Wilderness Scavenger',
    description: 'Defeat monsters and collect 6 crafting resources (wood, stone, iron, bone, silk, crystal).',
    progress: 0,
    target: 6,
    completed: false,
    xpReward: 100,
  },
  {
    id: 'quest_build_first',
    title: 'Pioneer Architect',
    description: 'Gather required looted materials and construct your first structure (House, Workbench, Tent, or Watchtower).',
    progress: 0,
    target: 1,
    completed: false,
    xpReward: 180,
  },
  {
    id: 'quest_forge_weapon',
    title: 'Master of the Forge',
    description: 'Craft an advanced weapon (Iron Blade, Recurve Bow, Staff, or Glaive) using monster drops.',
    progress: 0,
    target: 1,
    completed: false,
    xpReward: 200,
  }
];

// Helper to determine procedural features in a chunk based on chunk coordinates & seed
export function generateChunkFeatures(
  chunkX: number,
  chunkZ: number,
  seed: number,
  getElevation: (x: number, z: number) => number
): WorldFeature[] {
  const features: WorldFeature[] = [];

  // Deterministic pseudo-random based on chunk coordinates and seed
  const hash = Math.sin(chunkX * 374761393 + chunkZ * 668265263 + seed) * 43758.5453;
  const randVal = hash - Math.floor(hash);

  const hash2 = Math.sin(chunkX * 1234567 + chunkZ * 7654321 + seed * 2) * 12345.678;
  const randVal2 = hash2 - Math.floor(hash2);

  // Center chunk (0, 0) always has a starter welcoming Ancient Obelisk at (0, 30)
  if (chunkX === 0 && chunkZ === 0) {
    features.push({
      id: 'obelisk_origin',
      type: 'obelisk',
      x: 0,
      y: 25,
      elevation: getElevation(0, 25),
      active: false,
      discovered: true,
      riddle: 'Touch the Primordial Monolith to awaken the ley lines of the realm.',
      relicId: 'oak_heart_seed'
    });

    features.push({
      id: 'starter_chest',
      type: 'chest',
      x: 18,
      y: -15,
      elevation: getElevation(18, -15),
      active: false,
      discovered: false,
      riddle: 'Beside the blue waters, a gilded box holds relics of ancient explorers.',
      relicId: 'verdant_compass'
    });

    features.push({
      id: 'starter_mound',
      type: 'buried_mound',
      x: -20,
      y: -20,
      elevation: getElevation(-20, -20),
      active: false,
      discovered: false,
      relicId: 'petrified_bone_flute'
    });

    return features;
  }

  // General procedural feature placement:
  // Every ~4-5 chunks has an ancient obelisk
  const isObeliskChunk = (Math.abs(chunkX * 7 + chunkZ * 13 + seed) % 5 === 0);
  if (isObeliskChunk) {
    const localX = (chunkX * 24) + ((randVal - 0.5) * 14);
    const localZ = (chunkZ * 24) + ((randVal2 - 0.5) * 14);
    const elev = getElevation(localX, localZ);

    const relicPick = ALL_RELICS[Math.floor(randVal * ALL_RELICS.length)];

    features.push({
      id: `obelisk_${chunkX}_${chunkZ}`,
      type: 'obelisk',
      x: localX,
      y: localZ,
      elevation: elev,
      active: false,
      discovered: false,
      riddle: `The silent spire of chunk [${chunkX}, ${chunkZ}] waits in slumber.`,
      relicId: relicPick.id
    });
  }

  // Chests appear in ~40% of chunks
  if (randVal > 0.6) {
    const localX = (chunkX * 24) + ((randVal2 - 0.5) * 16);
    const localZ = (chunkZ * 24) + (((randVal * 1.5) % 1 - 0.5) * 16);
    const elev = getElevation(localX, localZ);
    const relicPick = ALL_RELICS[Math.floor(randVal2 * ALL_RELICS.length)];

    features.push({
      id: `chest_${chunkX}_${chunkZ}`,
      type: 'chest',
      x: localX,
      y: localZ,
      elevation: elev,
      active: false,
      discovered: false,
      relicId: relicPick.id
    });
  }

  // Buried treasure mounds appear in ~50% of chunks
  if (randVal2 > 0.5) {
    const localX = (chunkX * 24) + (((randVal2 * 3.3) % 1 - 0.5) * 16);
    const localZ = (chunkZ * 24) + (((randVal * 2.7) % 1 - 0.5) * 16);
    const elev = getElevation(localX, localZ);
    const relicPick = ALL_RELICS[Math.floor(((randVal + randVal2) * 2) % ALL_RELICS.length)];

    features.push({
      id: `mound_${chunkX}_${chunkZ}`,
      type: 'buried_mound',
      x: localX,
      y: localZ,
      elevation: elev,
      active: false,
      discovered: false,
      relicId: relicPick.id
    });
  }

  return features;
}

// Procedural monster generation per chunk
export function generateChunkMonsters(
  chunkX: number,
  chunkZ: number,
  seed: number,
  getElevation: (x: number, z: number) => number,
  isNight: boolean
): Monster[] {
  const monsters: Monster[] = [];

  // Deterministic hash based on chunk coordinates and world seed
  const hash = Math.sin(chunkX * 782451653 + chunkZ * 333494437 + seed * 5) * 43758.5453;
  const randVal = hash - Math.floor(hash);

  // Spawn 1 to 3 monsters per chunk (increased at night or in wilder terrain)
  const isSpawnChunk = (chunkX === 0 && chunkZ === 0) ? true : randVal > 0.35;
  if (!isSpawnChunk) return monsters;

  const count = (chunkX === 0 && chunkZ === 0)
    ? 2 // Starter chunk has a couple of friendly practice slimes far from center
    : (isNight ? Math.floor(randVal * 3) + 1 : Math.floor(randVal * 2) + 1);

  for (let i = 0; i < count; i++) {
    const subHash = Math.sin(chunkX * 919 + chunkZ * 541 + i * 733 + seed) * 12345.67;
    const r1 = subHash - Math.floor(subHash);
    const r2 = (subHash * 3.7) - Math.floor(subHash * 3.7);

    let localX = (chunkX * 24) + ((r1 - 0.5) * 18);
    let localZ = (chunkZ * 24) + ((r2 - 0.5) * 18);

    // Keep spawn at safe distance from origin (0, 0)
    if (chunkX === 0 && chunkZ === 0) {
      if (Math.hypot(localX, localZ) < 12) {
        localX += localX >= 0 ? 12 : -12;
        localZ += localZ >= 0 ? 12 : -12;
      }
    }

    const elev = getElevation(localX, localZ);

    let type: MonsterType = 'slime';
    let name = 'Emerald Slime';
    let hp = 45;
    let damage = 8;
    let speed = 2.3;
    let xp = 30;

    if (r2 > 0.78) {
      type = 'golem';
      name = 'Ancient Stone Golem';
      hp = 140;
      damage = 22;
      speed = 1.6;
      xp = 100;
    } else if (r2 > 0.48) {
      type = 'skeleton';
      name = 'Shadow Nomad Stalker';
      hp = 70;
      damage = 13;
      speed = 3.0;
      xp = 50;
    } else if (r2 > 0.22) {
      type = 'spider';
      name = 'Crystalline Sand Spider';
      hp = 55;
      damage = 10;
      speed = 3.8;
      xp = 40;
    }

    monsters.push({
      id: `mob_${chunkX}_${chunkZ}_${i}`,
      type,
      name,
      x: localX,
      y: localZ,
      elevation: elev,
      hp,
      maxHp: hp,
      damage,
      speed,
      aggroRange: type === 'golem' ? 11 : 14,
      attackRange: type === 'slime' ? 1.6 : (type === 'golem' ? 2.3 : 1.9),
      xpReward: xp,
      lastAttackTime: 0,
      hurtUntilTime: 0,
      rotation: Math.PI * 2 * r1,
      state: 'patrol',
      patrolCenter: { x: localX, y: localZ }
    });
  }

  return monsters;
}
