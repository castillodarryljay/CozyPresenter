import { Relic, Quest, WorldFeature } from './types';

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
  },
  {
    id: 'verdant_compass',
    name: 'Verdant Moss Compass',
    rarity: 'rare',
    icon: '🧭',
    description: 'A magnetic needle encased in enchanted amber and moss.',
    lore: 'Never points toward magnetic north, but always toward the nearest natural wonder or underground stream.',
    biome: 'Plains',
  },
  {
    id: 'lunar_moth_amber',
    name: 'Lunar Moth in Amber',
    rarity: 'epic',
    icon: '🦋',
    description: 'A perfectly preserved moth that glows with faint phosphorescence.',
    lore: 'Attracted by starlight, nomadic cartographers used these to navigate dense cloud cover during moonless nights.',
    biome: 'Universal',
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
  },
  {
    id: 'cloud_feather_talisman',
    name: 'Cloud Feather Talisman',
    rarity: 'legendary',
    icon: '🪶',
    description: 'Weightless plumed relic blessed by the great sky condors.',
    lore: 'Carrying this feather makes stepped mountain ascents feel like walking on morning fog.',
    biome: 'Mountains',
  },
  {
    id: 'echoing_geode',
    name: 'Echoing Geode',
    rarity: 'common',
    icon: '🔮',
    description: 'A hollow cracked stone that rings like a distant temple bell when tapped.',
    lore: 'Nomad children held these to their ears to listen to storms hundreds of leagues away.',
    biome: 'Hills & Mountains',
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
  },
  {
    id: 'oasis_teardrop_vial',
    name: 'Vial of the First Oasis',
    rarity: 'epic',
    icon: '💧',
    description: 'A sealed glass phial holding pure, luminescent desert water.',
    lore: 'Legend claims a single drop can turn barren sand into a flowering wildflower meadow.',
    biome: 'Desert',
  },
  {
    id: 'chronos_hourglass',
    name: 'Hourglass of the Red Sands',
    rarity: 'legendary',
    icon: '⏳',
    description: 'An ornate brass hourglass filled with iridescent crimson dust.',
    lore: 'The sand inside flows upward during a full moon. Whispers of the ancient kings echo within its glass.',
    biome: 'Desert',
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
  },
  {
    id: 'celestial_astrolabe',
    name: 'Nomad Astrolabe',
    rarity: 'epic',
    icon: '✨',
    description: 'Intricate brass concentric rings mapping forgotten constellations.',
    lore: 'Used by the first cartographers to chart the infinite stepped horizons before memory began.',
    biome: 'Universal',
  },
  {
    id: 'petrified_bone_flute',
    name: 'Petrified Bone Flute',
    rarity: 'common',
    icon: '🦴',
    description: 'An ancient carved whistle that your animal companion loves unconditionally.',
    lore: 'When played, all wildlife pauses in quiet reverie.',
    biome: 'Universal',
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
