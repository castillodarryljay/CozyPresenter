import React, { useState } from 'react';
import {
  Shield,
  Swords,
  Heart,
  Zap,
  Sparkles,
  Coins,
  X,
  Check,
  Crown,
  Shirt,
  Flame,
  Award,
  Footprints,
  Compass,
  Hammer,
} from 'lucide-react';
import { CharacterCustomization } from './types';
import { DungeonsGearItem, DungeonsInventoryState } from './src/dungeons/types';
import { ALL_ARMOR } from './src/dungeons/dungeonsData';

interface CharacterSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  customization: CharacterCustomization;
  onUpdateCustomization: (newConfig: CharacterCustomization) => void;
  equippedArmor?: DungeonsGearItem;
  onEquipArmor?: (armor: DungeonsGearItem) => void;
  dungeonsInventory: DungeonsInventoryState;
  playerCombatStats: {
    hp: number;
    maxHp: number;
    stamina: number;
    maxStamina: number;
  };
  level: number;
  xp: number;
  xpToNextLevel: number;
  dungeonsLevel: number;
  emeralds: number;
  monstersSlainCount?: number;
  structuresBuiltCount?: number;
}

const SKIN_TONES = [
  { name: 'Sunlight Peach', hex: '#ffd1a4' },
  { name: 'Warm Tan', hex: '#e0a96d' },
  { name: 'Desert Bronze', hex: '#a26a42' },
  { name: 'Rich Mahogany', hex: '#5c3822' },
  { name: 'Moonlit Pale', hex: '#fdf2e9' },
  { name: 'Mystic Night Elf', hex: '#94a3b8' },
];

const HAIR_COLORS = [
  { name: 'Espresso Brown', hex: '#3d2314' },
  { name: 'Raven Black', hex: '#18181b' },
  { name: 'Golden Honey', hex: '#eab308' },
  { name: 'Crimson Flame', hex: '#dc2626' },
  { name: 'Platinum Frost', hex: '#f1f5f9' },
  { name: 'Void Violet', hex: '#9333ea' },
];

const TUNIC_COLORS = [
  { name: 'Forest Emerald', hex: '#15803d' },
  { name: 'Ocean Cobalt', hex: '#1d4ed8' },
  { name: 'Crimson Velvet', hex: '#b91c1c' },
  { name: 'Twilight Purple', hex: '#7e22ce' },
  { name: 'Desert Sand', hex: '#d97706' },
  { name: 'Charcoal Shadow', hex: '#27272a' },
];

const PANTS_COLORS = [
  { name: 'Indigo Denim', hex: '#1e3a8a' },
  { name: 'Leather Saddle', hex: '#78350f' },
  { name: 'Slate Knight', hex: '#334155' },
  { name: 'Raven Jet', hex: '#0f172a' },
];

const CAPES: Array<{ id: CharacterCustomization['capeStyle']; name: string; color: string }> = [
  { id: 'none', name: 'No Cape', color: '#475569' },
  { id: 'royal_red', name: 'Royal Crimson Cape', color: '#dc2626' },
  { id: 'emerald_ranger', name: 'Emerald Ranger Cloak', color: '#10b981' },
  { id: 'void_walker', name: 'Void Walker Shroud', color: '#8b5cf6' },
  { id: 'golden_champion', name: 'Golden Champion Mantle', color: '#f59e0b' },
];

const HEADGEARS: Array<{ id: CharacterCustomization['hairStyle']; name: string; icon: string }> = [
  { id: 'explorer_hat', name: 'Explorer Hat', icon: '🤠' },
  { id: 'knight_helm', name: 'Knight Helmet', icon: '⛑️' },
  { id: 'crown', name: 'Imperial Crown', icon: '👑' },
  { id: 'hood', name: 'Ranger Hood', icon: '🥷' },
  { id: 'hair', name: 'Hairstyle', icon: '💇' },
  { id: 'none', name: 'Bare Head', icon: '👤' },
];

export const CharacterSheetModal: React.FC<CharacterSheetModalProps> = ({
  isOpen,
  onClose,
  customization,
  onUpdateCustomization,
  equippedArmor,
  onEquipArmor,
  dungeonsInventory,
  playerCombatStats,
  level,
  xp,
  xpToNextLevel,
  dungeonsLevel,
  emeralds,
  monstersSlainCount = 0,
  structuresBuiltCount = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'appearance' | 'armory'>('stats');
  const [draftConfig, setDraftConfig] = useState<CharacterCustomization>(customization);

  if (!isOpen) return null;

  // Calculate combat rating
  const armorReductionPct = Math.round(((equippedArmor?.damageReduction || 0.1) + (level * 0.01)) * 100);
  const totalHp = playerCombatStats.maxHp + (equippedArmor?.hpBonus || 0);
  const meleeWeapon = Array.isArray(dungeonsInventory)
    ? (dungeonsInventory.find(i => i.category === 'melee') as DungeonsGearItem | undefined)
    : undefined;
  const rangedWeapon = Array.isArray(dungeonsInventory)
    ? (dungeonsInventory.find(i => i.category === 'ranged') as DungeonsGearItem | undefined)
    : undefined;
  const powerLevel = (meleeWeapon?.power || 15) + (equippedArmor?.power || 10) + Math.floor(dungeonsLevel * 1.5);

  const handleSaveAppearance = () => {
    onUpdateCustomization(draftConfig);
  };

  return (
    <div
      id="character-sheet-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="character-sheet-modal"
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col mc-panel-dark text-white overflow-hidden"
        style={{ fontFamily: "'VT323', monospace" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-2.5 sm:px-4 py-2 sm:py-3 bg-[#181818] border-b-2 border-black">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-7 h-7 sm:w-9 sm:h-9 mc-slot-dark flex items-center justify-center text-base sm:text-xl text-yellow-400 flex-shrink-0">
              👑
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-2xl font-bold tracking-wider text-yellow-400 leading-tight truncate">
                HERO SHEET
              </h2>
              <p className="hidden sm:block text-xs text-gray-400 font-mono">Combat Attributes, Gear Progression & Appearance</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Quick Emeralds display */}
            <div className="mc-slot-dark px-2 sm:px-2.5 py-1 flex items-center gap-1 text-emerald-400 text-xs sm:text-sm font-bold">
              <span>💎</span>
              <span className="font-mono">{emeralds} <span className="hidden sm:inline">Emeralds</span></span>
            </div>
            <button
              id="close-character-sheet-btn"
              onClick={onClose}
              className="mc-btn px-2 py-1 text-sm cursor-pointer"
              title="Close (ESC)"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 inline" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b-2 border-black bg-[#151515] px-3 pt-2 gap-1.5 overflow-x-auto">
          <button
            id="tab-stats-btn"
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-bold border-t-2 border-x-2 cursor-pointer transition-none ${
              activeTab === 'stats'
                ? 'mc-panel text-black border-black font-bold'
                : 'mc-btn text-gray-300'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>ATTRIBUTES & STATS</span>
          </button>

          <button
            id="tab-appearance-btn"
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-bold border-t-2 border-x-2 cursor-pointer transition-none ${
              activeTab === 'appearance'
                ? 'mc-panel text-black border-black font-bold'
                : 'mc-btn text-gray-300'
            }`}
          >
            <Shirt className="w-4 h-4" />
            <span>APPEARANCE & VISIBLE ARMOR</span>
          </button>

          <button
            id="tab-armory-btn"
            onClick={() => setActiveTab('armory')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-bold border-t-2 border-x-2 cursor-pointer transition-none ${
              activeTab === 'armory'
                ? 'mc-panel text-black border-black font-bold'
                : 'mc-btn text-gray-300'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>RARE ARMOR SUITES</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* TAB 1: ATTRIBUTES & COMBAT STATS */}
          {activeTab === 'stats' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Top Hero Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Power Level & Hero Rank */}
                <div className="mc-slot-dark p-3 flex items-center gap-3">
                  <div className="w-14 h-14 bg-[#111] border-2 border-yellow-500/80 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] uppercase font-bold text-yellow-400">PWR</span>
                    <span className="text-2xl font-bold text-yellow-300 leading-none">{powerLevel}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Overworld Champion</h3>
                    <p className="text-xs text-gray-400">Level {level} Explorer • Tier {dungeonsLevel} Hero</p>
                    <div className="mt-1 flex items-center gap-1 text-xs text-yellow-400 font-bold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{monstersSlainCount} Foes Defeated</span>
                    </div>
                  </div>
                </div>

                {/* Level & XP Progression */}
                <div className="mc-slot-dark p-3 space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-gray-300">EXPLORER PROGRESS</span>
                    <span className="text-yellow-400">{xp} / {xpToNextLevel} XP</span>
                  </div>
                  <div className="w-full h-3 bg-black border border-gray-700 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-lime-600 to-lime-400 transition-all duration-200"
                      style={{ width: `${Math.min(100, (xp / Math.max(1, xpToNextLevel)) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-400 pt-0.5 font-mono">
                    <span>Next Level Up: +5 Max HP</span>
                    <span className="text-emerald-400 font-bold">+100 Emeralds</span>
                  </div>
                </div>

                {/* Defense & Armor Rating */}
                <div className="mc-slot-dark p-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">DAMAGE REDUCTION</span>
                    <div className="text-2xl font-bold text-sky-400 flex items-center gap-1.5 mt-0.5">
                      <Shield className="w-5 h-5 text-sky-400" />
                      <span>{armorReductionPct}%</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[160px]">
                      {equippedArmor ? equippedArmor.name : 'Basic Leather Protection'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">STRUCTURES</span>
                    <div className="text-xl font-bold text-yellow-400 flex items-center justify-end gap-1 mt-0.5">
                      <Hammer className="w-4 h-4 text-yellow-400" />
                      <span>{structuresBuiltCount} Built</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Combat Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="mc-slot-dark p-3 flex items-center gap-2.5">
                  <div className="p-2 bg-red-950 border border-red-700 text-red-400">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">MAX HEALTH</p>
                    <p className="text-lg font-bold text-white">{totalHp} HP</p>
                  </div>
                </div>

                <div className="mc-slot-dark p-3 flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-950 border border-emerald-700 text-emerald-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">STAMINA</p>
                    <p className="text-lg font-bold text-white">{playerCombatStats.maxStamina}</p>
                  </div>
                </div>

                <div className="mc-slot-dark p-3 flex items-center gap-2.5">
                  <div className="p-2 bg-amber-950 border border-amber-700 text-amber-400">
                    <Swords className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">MELEE DAMAGE</p>
                    <p className="text-lg font-bold text-white">{meleeWeapon?.damage || 15} DMG</p>
                  </div>
                </div>

                <div className="mc-slot-dark p-3 flex items-center gap-2.5">
                  <div className="p-2 bg-purple-950 border border-purple-700 text-purple-400">
                    <Footprints className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">MOVE SPEED</p>
                    <p className="text-lg font-bold text-white">
                      +{Math.round(((equippedArmor?.moveSpeedBonus || 0)) * 100)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Loadout Showcase */}
              <div className="mc-slot-dark p-3 space-y-2">
                <h4 className="text-sm font-bold text-yellow-400 uppercase flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-400" />
                  CURRENT ACTIVE COMBAT EQUIPMENT
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Melee Weapon */}
                  <div className="p-2.5 bg-[#1a1a1a] border-2 border-black flex items-center gap-2.5">
                    <div className="text-2xl p-1.5 mc-slot-dark">{meleeWeapon?.icon || '🗡️'}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold uppercase text-amber-400">
                        {meleeWeapon?.rarity || 'Common'} Melee
                      </p>
                      <p className="font-bold text-sm text-white truncate">{meleeWeapon?.name || 'Wooden Sword'}</p>
                      <p className="text-xs text-gray-400 font-mono">Power {meleeWeapon?.power || 1} • {meleeWeapon?.damage || 12} Dmg</p>
                    </div>
                  </div>

                  {/* Ranged Bow */}
                  <div className="p-2.5 bg-[#1a1a1a] border-2 border-black flex items-center gap-2.5">
                    <div className="text-2xl p-1.5 mc-slot-dark">{rangedWeapon?.icon || '🏹'}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold uppercase text-sky-400">
                        {rangedWeapon?.rarity || 'Common'} Ranged
                      </p>
                      <p className="font-bold text-sm text-white truncate">{rangedWeapon?.name || 'Shortbow'}</p>
                      <p className="text-xs text-gray-400 font-mono">Power {rangedWeapon?.power || 1} • {rangedWeapon?.damage || 14} Dmg</p>
                    </div>
                  </div>

                  {/* Equipped Armor */}
                  <div className="p-2.5 bg-[#1a1a1a] border-2 border-black flex items-center gap-2.5">
                    <div className="text-2xl p-1.5 mc-slot-dark">{equippedArmor?.icon || '🛡️'}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold uppercase text-emerald-400">
                        {equippedArmor?.rarity || 'Common'} Armor
                      </p>
                      <p className="font-bold text-sm text-white truncate">{equippedArmor?.name || 'Leather Tunic'}</p>
                      <p className="text-xs text-gray-400 font-mono">+{equippedArmor?.hpBonus || 20} HP • -{Math.round((equippedArmor?.damageReduction || 0.05) * 100)}% Dmg</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: APPEARANCE & VISIBLE ARMOR */}
          {activeTab === 'appearance' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3 mc-slot-dark text-sm text-yellow-300 flex items-center justify-between flex-wrap gap-2">
                <span>Customize your hero's appearance! Headgear, cloaks, and armor render in real-time on your 3D voxel character.</span>
                <button
                  id="save-appearance-btn"
                  onClick={handleSaveAppearance}
                  className="mc-btn-green px-4 py-1.5 text-sm font-bold flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Apply & Save
                </button>
              </div>

              {/* Headgear & Hairstyle */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <span>HEADGEAR & HELMET</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {HEADGEARS.map((hg) => (
                    <button
                      key={hg.id}
                      onClick={() => {
                        const updated = { ...draftConfig, hairStyle: hg.id };
                        setDraftConfig(updated);
                        onUpdateCustomization(updated);
                      }}
                      className={`p-2.5 flex flex-col items-center gap-1 text-xs font-bold cursor-pointer ${
                        draftConfig.hairStyle === hg.id
                          ? 'mc-slot-selected bg-[#292524] text-yellow-300'
                          : 'mc-slot-dark text-gray-300 hover:bg-[#222]'
                      }`}
                    >
                      <span className="text-2xl">{hg.icon}</span>
                      <span className="truncate">{hg.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cloak & Cape */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <span>FLOWING CLOAK & CAPE</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {CAPES.map((cape) => (
                    <button
                      key={cape.id}
                      onClick={() => {
                        const updated = { ...draftConfig, capeStyle: cape.id };
                        setDraftConfig(updated);
                        onUpdateCustomization(updated);
                      }}
                      className={`p-2.5 flex items-center gap-2 text-xs font-bold cursor-pointer ${
                        draftConfig.capeStyle === cape.id
                          ? 'mc-slot-selected bg-[#292524] text-yellow-300'
                          : 'mc-slot-dark text-gray-300 hover:bg-[#222]'
                      }`}
                    >
                      <div className="w-4 h-6 border border-black shadow-inner flex-shrink-0" style={{ backgroundColor: cape.color }} />
                      <span className="truncate">{cape.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Palettes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Skin Tone */}
                <div className="mc-slot-dark p-3 space-y-1.5">
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">SKIN COMPLEXION</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {SKIN_TONES.map((skin) => (
                      <button
                        key={skin.hex}
                        onClick={() => {
                          const updated = { ...draftConfig, skinColor: skin.hex };
                          setDraftConfig(updated);
                          onUpdateCustomization(updated);
                        }}
                        className={`p-1.5 border flex items-center gap-1.5 text-xs font-medium cursor-pointer ${
                          draftConfig.skinColor === skin.hex
                            ? 'border-yellow-400 bg-black text-yellow-300'
                            : 'border-black bg-[#1f1f1f] text-gray-300'
                        }`}
                      >
                        <div className="w-4 h-4 border border-black" style={{ backgroundColor: skin.hex }} />
                        <span className="truncate">{skin.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hair Color */}
                <div className="mc-slot-dark p-3 space-y-1.5">
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">HAIR & CREST COLOR</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {HAIR_COLORS.map((hair) => (
                      <button
                        key={hair.hex}
                        onClick={() => {
                          const updated = { ...draftConfig, hairColor: hair.hex };
                          setDraftConfig(updated);
                          onUpdateCustomization(updated);
                        }}
                        className={`p-1.5 border flex items-center gap-1.5 text-xs font-medium cursor-pointer ${
                          draftConfig.hairColor === hair.hex
                            ? 'border-yellow-400 bg-black text-yellow-300'
                            : 'border-black bg-[#1f1f1f] text-gray-300'
                        }`}
                      >
                        <div className="w-4 h-4 border border-black" style={{ backgroundColor: hair.hex }} />
                        <span className="truncate">{hair.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tunic / Shirt Color */}
                <div className="mc-slot-dark p-3 space-y-1.5">
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">TUNIC & TABARD COLOR</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {TUNIC_COLORS.map((tunic) => (
                      <button
                        key={tunic.hex}
                        onClick={() => {
                          const updated = { ...draftConfig, shirtColor: tunic.hex };
                          setDraftConfig(updated);
                          onUpdateCustomization(updated);
                        }}
                        className={`p-1.5 border flex items-center gap-1.5 text-xs font-medium cursor-pointer ${
                          draftConfig.shirtColor === tunic.hex
                            ? 'border-yellow-400 bg-black text-yellow-300'
                            : 'border-black bg-[#1f1f1f] text-gray-300'
                        }`}
                      >
                        <div className="w-4 h-4 border border-black" style={{ backgroundColor: tunic.hex }} />
                        <span className="truncate">{tunic.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pants Color */}
                <div className="mc-slot-dark p-3 space-y-1.5">
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">LEGGINGS & GREAVES COLOR</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PANTS_COLORS.map((pants) => (
                      <button
                        key={pants.hex}
                        onClick={() => {
                          const updated = { ...draftConfig, pantsColor: pants.hex };
                          setDraftConfig(updated);
                          onUpdateCustomization(updated);
                        }}
                        className={`p-1.5 border flex items-center gap-1.5 text-xs font-medium cursor-pointer ${
                          draftConfig.pantsColor === pants.hex
                            ? 'border-yellow-400 bg-black text-yellow-300'
                            : 'border-black bg-[#1f1f1f] text-gray-300'
                        }`}
                      >
                        <div className="w-4 h-4 border border-black" style={{ backgroundColor: pants.hex }} />
                        <span className="truncate">{pants.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Show Armor toggle */}
              <div className="flex items-center justify-between p-3 mc-slot-dark">
                <div>
                  <h4 className="font-bold text-sm text-white">Visible Armor Mesh & Shoulder Pauldrons</h4>
                  <p className="text-xs text-gray-400">Display 3D breastplate, pauldrons, and gauntlets on your hero</p>
                </div>
                <button
                  onClick={() => {
                    const updated = { ...draftConfig, showArmor: !draftConfig.showArmor };
                    setDraftConfig(updated);
                    onUpdateCustomization(updated);
                  }}
                  className={`px-4 py-1.5 text-xs font-bold ${
                    draftConfig.showArmor ? 'mc-btn-green' : 'mc-btn'
                  }`}
                >
                  {draftConfig.showArmor ? 'ENABLED' : 'HIDDEN'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: RARE ARMOR SUITES */}
          {activeTab === 'armory' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="p-3 mc-slot-dark text-xs text-yellow-300">
                Choose and equip from legendary and rare armor sets discovered across the Overworld. Each provides visible 3D armor modeling, stats, and unique perks!
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ALL_ARMOR.map((armor) => {
                  const isEquipped = equippedArmor?.id === armor.id;
                  const rarityBadgeColor =
                    armor.rarity === 'unique'
                      ? 'bg-amber-500/20 text-yellow-300 border-yellow-500/60'
                      : armor.rarity === 'rare'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/60'
                      : 'bg-stone-700/40 text-gray-300 border-gray-600';

                  return (
                    <div
                      key={armor.id}
                      className={`p-3 border-2 transition-none flex flex-col justify-between gap-2.5 ${
                        isEquipped
                          ? 'mc-slot-selected bg-[#241f17]'
                          : 'mc-slot-dark hover:bg-[#202020]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="text-3xl p-2 bg-black border border-gray-700">
                            {armor.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-base text-white">{armor.name}</h4>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${rarityBadgeColor}`}>
                                {armor.rarity}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 line-clamp-1">{armor.description}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-bold text-yellow-400 uppercase">POWER</span>
                          <p className="text-lg font-bold text-yellow-300 leading-none">{armor.power}</p>
                        </div>
                      </div>

                      {/* Stat perks */}
                      <div className="grid grid-cols-3 gap-1.5 py-1.5 border-y border-black bg-black/40 text-center text-xs">
                        <div>
                          <span className="text-[10px] text-gray-400 uppercase font-bold">HEALTH</span>
                          <p className="font-bold text-emerald-400">+{armor.hpBonus} HP</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 uppercase font-bold">DEFENSE</span>
                          <p className="font-bold text-sky-400">-{Math.round((armor.damageReduction || 0) * 100)}% DMG</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 uppercase font-bold">SPEED</span>
                          <p className="font-bold text-yellow-400">+{Math.round((armor.moveSpeedBonus || 0) * 100)}%</p>
                        </div>
                      </div>

                      {armor.uniquePerk && (
                        <p className="text-xs text-yellow-300 italic flex items-center gap-1.5 font-mono">
                          <Sparkles className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                          <span>{armor.uniquePerk}</span>
                        </p>
                      )}

                      <button
                        onClick={() => {
                          if (onEquipArmor) {
                            onEquipArmor(armor);
                          }
                        }}
                        disabled={isEquipped}
                        className={`w-full py-1.5 text-xs font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer ${
                          isEquipped
                            ? 'mc-btn-green cursor-default opacity-90'
                            : 'mc-btn-gold'
                        }`}
                      >
                        {isEquipped ? (
                          <>
                            <Check className="w-4 h-4" />
                            EQUIPPED ON HERO
                          </>
                        ) : (
                          'EQUIP ARMOR SUITE'
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#181818] border-t-2 border-black text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-300">Quick Key:</span>
            <kbd className="px-1.5 py-0.5 bg-black text-yellow-400 border border-gray-700 font-mono text-xs">
              C
            </kbd>
            <span>Toggles Character Sheet</span>
          </div>

          <button
            onClick={onClose}
            className="mc-btn px-4 py-1.5 text-sm font-bold"
          >
            Close Sheet
          </button>
        </div>
      </div>
    </div>
  );
};
