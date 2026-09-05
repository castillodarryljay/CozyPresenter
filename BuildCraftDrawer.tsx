import React, { useState } from 'react';
import {
  X,
  Hammer,
  Home,
  Shield,
  Wrench,
  Sparkles,
  Sword,
  Check,
  Lock,
  Trash2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  BuildableStructureBlueprint,
  WeaponRecipe,
  Weapon,
  PlacedStructure,
  ResourceInventory,
  ResourceType,
  PlayerStats,
} from './types';

interface BuildCraftDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'structures' | 'forge' | 'resources';
  setActiveTab: (tab: 'structures' | 'forge' | 'resources') => void;
  resources: ResourceInventory;
  gold: number;
  stats: PlayerStats;
  blueprints: BuildableStructureBlueprint[];
  weaponRecipes: WeaponRecipe[];
  allWeapons: Weapon[];
  unlockedWeapons: string[];
  activeWeaponIndex: number;
  placedStructures: PlacedStructure[];
  charPos: { x: number; y: number };
  onStartBuilding: (blueprint: BuildableStructureBlueprint) => void;
  onForgeWeapon: (recipe: WeaponRecipe) => void;
  onDemolishStructure: (structureId: string) => void;
  onSelectWeapon: (index: number) => void;
  canAffordBlueprint: (blueprint: BuildableStructureBlueprint) => boolean;
  canAffordRecipe: (recipe: WeaponRecipe) => boolean;
}

const RESOURCE_META: Record<
  ResourceType,
  { name: string; icon: string; source: string; uses: string; color: string }
> = {
  wood: {
    name: 'Timber Log',
    icon: '🪵',
    source: 'Slimes, Forest Flora, & Woodland Trees',
    uses: 'Framing houses, workbenches, tents, & bows',
    color: 'from-amber-900 to-amber-700',
  },
  stone: {
    name: 'Quarried Stone',
    icon: '🪨',
    source: 'Ancient Golems, Skeletons, & Mound Excavations',
    uses: 'Watchtowers, house foundations, & arcane conduits',
    color: 'from-zinc-700 to-zinc-500',
  },
  iron: {
    name: 'Refined Iron Ingot',
    icon: '⛓️',
    source: 'Skeletons, Ancient Golems, & Treasure Chests',
    uses: 'Sharp blades, ballista gears, & storage stashes',
    color: 'from-slate-600 to-slate-400',
  },
  bone: {
    name: 'Sturdy Bone Fragment',
    icon: '🦴',
    source: 'Skeletons & Excavated Ancient Mounds',
    uses: 'Heavy polearms, ballista frames, & structural braces',
    color: 'from-stone-300 to-stone-100 text-stone-900',
  },
  silk: {
    name: 'Arachnid Silk Thread',
    icon: '🕸️',
    source: 'Giant Cave & Forest Spiders',
    uses: 'Bowstrings, weather-resistant tent tarps, & ballista cords',
    color: 'from-purple-900 to-indigo-800',
  },
  crystal: {
    name: 'Arcane Crystal Shard',
    icon: '🔮',
    source: 'Ancient Golems, Sun Bosses, & Treasure Caches',
    uses: 'Celestial Runestaves, teleporters, & magical conduits',
    color: 'from-cyan-900 to-blue-700',
  },
};

export const BuildCraftDrawer: React.FC<BuildCraftDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  resources,
  gold,
  stats,
  blueprints,
  weaponRecipes,
  allWeapons,
  unlockedWeapons,
  activeWeaponIndex,
  placedStructures,
  charPos,
  onStartBuilding,
  onForgeWeapon,
  onDemolishStructure,
  onSelectWeapon,
  canAffordBlueprint,
  canAffordRecipe,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  if (!isOpen) return null;

  const hasWorkbenchPlaced = placedStructures.some(s => s.type === 'workbench');

  const filteredBlueprints = blueprints.filter(
    bp => categoryFilter === 'all' || bp.category === categoryFilter
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 pointer-events-auto bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] mc-panel p-3 sm:p-5 md:p-6 bg-[#c6c6c6]! border-4! border-white! shadow-[0_0_0_4px_black] flex flex-col gap-3 sm:gap-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex justify-between items-center border-b-2 border-black/20 pb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#16a34a] border-2 border-[#86efac] flex items-center justify-center text-white shadow-md">
              <Hammer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-black leading-tight">
                Wilderness Forge & Architecture
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-700 font-mono">
                Loot monster drops to build shelters, defenses, and forge armaments
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Gold Display */}
            <div className="mc-panel px-2.5 py-1 bg-[#ca8a04] text-black font-bold text-xs flex items-center gap-1 shadow-sm border border-[#fef08a]">
              <span>🪙</span>
              <span className="font-mono">{gold} Gold</span>
            </div>

            <button
              onClick={onClose}
              className="p-1 hover:bg-black/10 rounded cursor-pointer transition-colors"
              title="Close (ESC)"
            >
              <X className="w-6 h-6 text-black" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 border-b border-black/20 pb-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('structures')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all border-2 cursor-pointer ${
              activeTab === 'structures'
                ? 'bg-[#15803d] text-white border-[#86efac] shadow-sm'
                : 'bg-[#b0b0b0] text-black border-[#808080] hover:bg-[#bfbfbf]'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Structures</span>
            <span className="bg-black/30 text-white px-1 rounded text-[10px]">
              {blueprints.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('forge')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all border-2 cursor-pointer ${
              activeTab === 'forge'
                ? 'bg-[#b91c1c] text-white border-[#fca5a5] shadow-sm'
                : 'bg-[#b0b0b0] text-black border-[#808080] hover:bg-[#bfbfbf]'
            }`}
          >
            <Sword className="w-4 h-4" />
            <span>Weapon Forge</span>
            <span className="bg-black/30 text-white px-1 rounded text-[10px]">
              {weaponRecipes.length}
            </span>
            {hasWorkbenchPlaced && (
              <span className="text-[10px] bg-amber-400 text-black px-1 rounded font-bold">
                Workbench Active
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('resources')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all border-2 cursor-pointer ${
              activeTab === 'resources'
                ? 'bg-[#4338ca] text-white border-[#a5b4fc] shadow-sm'
                : 'bg-[#b0b0b0] text-black border-[#808080] hover:bg-[#bfbfbf]'
            }`}
          >
            <span>🎒</span>
            <span>Looted Materials</span>
          </button>
        </div>

        {/* Quick Resource Ribbon */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 bg-[#1e293b] p-1.5 rounded border border-[#475569] text-white text-[11px] font-mono">
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-black/40 rounded">
            <span>🪵</span>
            <span className="text-amber-200">Wood:</span>
            <span className="font-bold ml-auto">{resources.wood || 0}</span>
          </div>
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-black/40 rounded">
            <span>🪨</span>
            <span className="text-stone-300">Stone:</span>
            <span className="font-bold ml-auto">{resources.stone || 0}</span>
          </div>
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-black/40 rounded">
            <span>⛓️</span>
            <span className="text-slate-300">Iron:</span>
            <span className="font-bold ml-auto">{resources.iron || 0}</span>
          </div>
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-black/40 rounded">
            <span>🦴</span>
            <span className="text-stone-200">Bone:</span>
            <span className="font-bold ml-auto">{resources.bone || 0}</span>
          </div>
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-black/40 rounded">
            <span>🕸️</span>
            <span className="text-purple-300">Silk:</span>
            <span className="font-bold ml-auto">{resources.silk || 0}</span>
          </div>
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-black/40 rounded">
            <span>🔮</span>
            <span className="text-cyan-300">Crystal:</span>
            <span className="font-bold ml-auto">{resources.crystal || 0}</span>
          </div>
        </div>

        {/* TAB 1: BUILDABLE STRUCTURES */}
        {activeTab === 'structures' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-1 gap-3">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs font-bold text-gray-800 mr-1">Filter:</span>
              {['all', 'shelter', 'crafting', 'defense', 'utility'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2 py-0.5 text-[11px] font-bold rounded capitalize cursor-pointer transition-colors ${
                    categoryFilter === cat
                      ? 'bg-black text-white'
                      : 'bg-white/70 text-black hover:bg-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Blueprints Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {filteredBlueprints.map(bp => {
                const canAfford = canAffordBlueprint(bp);
                const cost = bp.cost;

                return (
                  <div
                    key={bp.type}
                    className={`mc-panel p-3 border-2 flex flex-col justify-between transition-all ${
                      canAfford
                        ? 'bg-[#e2e8f0] border-[#94a3b8] hover:border-[#3b82f6]'
                        : 'bg-[#d1d5db] border-[#9ca3af] opacity-90'
                    }`}
                  >
                    <div>
                      {/* Blueprint Header */}
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{bp.icon}</span>
                          <div>
                            <h3 className="font-bold text-sm sm:text-base text-black leading-tight">
                              {bp.name}
                            </h3>
                            <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.2 bg-black/10 rounded font-semibold text-gray-700">
                              {bp.category}
                            </span>
                          </div>
                        </div>

                        {canAfford ? (
                          <span className="text-[10px] font-bold bg-green-600 text-white px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Ready
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-red-800 text-white px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Lock className="w-3 h-3" /> Missing Drops
                          </span>
                        )}
                      </div>

                      {/* Description & Field Benefit */}
                      <p className="text-xs text-gray-800 mb-1.5 leading-snug">{bp.description}</p>
                      <div className="text-[11px] text-[#1e3a8a] bg-blue-50 border border-blue-200 p-1.5 rounded mb-2 font-medium">
                        ✨ <span className="font-bold">Field Aura:</span> {bp.benefits}
                      </div>

                      {/* Required Materials Badges */}
                      <div className="text-[11px] font-mono font-bold flex flex-wrap gap-1 mb-2">
                        {cost.wood && (
                          <span
                            className={`px-1.5 py-0.5 rounded border ${
                              (resources.wood || 0) >= cost.wood
                                ? 'bg-green-100 text-green-900 border-green-300'
                                : 'bg-red-100 text-red-900 border-red-300'
                            }`}
                          >
                            🪵 {resources.wood || 0}/{cost.wood} Wood
                          </span>
                        )}
                        {cost.stone && (
                          <span
                            className={`px-1.5 py-0.5 rounded border ${
                              (resources.stone || 0) >= cost.stone
                                ? 'bg-green-100 text-green-900 border-green-300'
                                : 'bg-red-100 text-red-900 border-red-300'
                            }`}
                          >
                            🪨 {resources.stone || 0}/{cost.stone} Stone
                          </span>
                        )}
                        {cost.iron && (
                          <span
                            className={`px-1.5 py-0.5 rounded border ${
                              (resources.iron || 0) >= cost.iron
                                ? 'bg-green-100 text-green-900 border-green-300'
                                : 'bg-red-100 text-red-900 border-red-300'
                            }`}
                          >
                            ⛓️ {resources.iron || 0}/{cost.iron} Iron
                          </span>
                        )}
                        {cost.bone && (
                          <span
                            className={`px-1.5 py-0.5 rounded border ${
                              (resources.bone || 0) >= cost.bone
                                ? 'bg-green-100 text-green-900 border-green-300'
                                : 'bg-red-100 text-red-900 border-red-300'
                            }`}
                          >
                            🦴 {resources.bone || 0}/{cost.bone} Bone
                          </span>
                        )}
                        {cost.silk && (
                          <span
                            className={`px-1.5 py-0.5 rounded border ${
                              (resources.silk || 0) >= cost.silk
                                ? 'bg-green-100 text-green-900 border-green-300'
                                : 'bg-red-100 text-red-900 border-red-300'
                            }`}
                          >
                            🕸️ {resources.silk || 0}/{cost.silk} Silk
                          </span>
                        )}
                        {cost.crystal && (
                          <span
                            className={`px-1.5 py-0.5 rounded border ${
                              (resources.crystal || 0) >= cost.crystal
                                ? 'bg-green-100 text-green-900 border-green-300'
                                : 'bg-red-100 text-red-900 border-red-300'
                            }`}
                          >
                            🔮 {resources.crystal || 0}/{cost.crystal} Crystal
                          </span>
                        )}
                        {cost.gold && (
                          <span
                            className={`px-1.5 py-0.5 rounded border ${
                              gold >= cost.gold
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-red-100 text-red-900 border-red-300'
                            }`}
                          >
                            🪙 {gold}/{cost.gold} Gold
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => onStartBuilding(bp)}
                      disabled={!canAfford}
                      className={`w-full py-2 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
                        canAfford
                          ? 'bg-[#15803d] hover:bg-[#166534] text-white border-[#86efac] shadow-md active:scale-98'
                          : 'bg-gray-400 text-gray-700 border-gray-500 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <Hammer className="w-4 h-4" />
                      <span>{canAfford ? 'Enter Placement Mode' : 'Loot Required Drops'}</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Placed Outposts Section */}
            {placedStructures.length > 0 && (
              <div className="mt-3 pt-3 border-t-2 border-black/20">
                <h4 className="text-sm font-bold text-black flex items-center gap-1 mb-2">
                  <span>🏰</span>
                  <span>Active Outposts & Defenses ({placedStructures.length})</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {placedStructures.map(s => {
                    const dist = Math.round(Math.hypot(s.x - charPos.x, s.y - charPos.y));
                    const bp = blueprints.find(b => b.type === s.type);

                    return (
                      <div
                        key={s.id}
                        className="mc-panel p-2 bg-white/80 border border-black/20 flex items-center justify-between gap-1 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-black flex items-center gap-1 truncate">
                            <span>{bp?.icon || '🏗️'}</span>
                            <span className="truncate">{s.customName || s.type}</span>
                          </div>
                          <div className="text-[10px] text-gray-600 font-mono">
                            {dist}m away • ({Math.round(s.x)}, {Math.round(s.y)})
                          </div>
                        </div>

                        <button
                          onClick={() => onDemolishStructure(s.id)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded flex-shrink-0 cursor-pointer"
                          title="Demolish & Salvage (Recovers 50% Materials)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: WEAPON FORGE */}
        {activeTab === 'forge' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-1 gap-3">
            {!hasWorkbenchPlaced && (
              <div className="p-2.5 bg-amber-100 border-2 border-amber-400 rounded text-amber-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-700" />
                <div>
                  <span className="font-bold">Tip: Build a Crafting Workbench!</span> Having an
                  outpost workbench nearby unlocks fast anvil forging and advanced runic weapon
                  recipes.
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {weaponRecipes.map(recipe => {
                const isUnlocked = unlockedWeapons.includes(recipe.weaponId);
                const weaponIndex = allWeapons.findIndex(w => w.id === recipe.weaponId);
                const isEquipped = activeWeaponIndex === weaponIndex;
                const canAfford = canAffordRecipe(recipe);
                const cost = recipe.cost;

                return (
                  <div
                    key={recipe.weaponId}
                    className={`mc-panel p-3 border-2 flex flex-col justify-between transition-all ${
                      isEquipped
                        ? 'bg-amber-100/90 border-amber-500 shadow-md'
                        : isUnlocked
                        ? 'bg-[#e2e8f0] border-[#94a3b8]'
                        : canAfford
                        ? 'bg-emerald-50 border-emerald-400'
                        : 'bg-[#d1d5db] border-[#9ca3af]'
                    }`}
                  >
                    <div>
                      {/* Header */}
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{recipe.icon}</span>
                          <div>
                            <h3 className="font-bold text-sm sm:text-base text-black leading-tight">
                              {recipe.name}
                            </h3>
                            <div className="flex items-center gap-1.5 text-[10px] font-mono">
                              <span className="bg-red-700 text-white px-1.5 rounded font-bold">
                                {recipe.damage} Base DMG
                              </span>
                              <span className="text-gray-600 uppercase">{recipe.type}</span>
                            </div>
                          </div>
                        </div>

                        {isEquipped ? (
                          <span className="text-[10px] font-bold bg-amber-600 text-white px-2 py-0.5 rounded">
                            ⚔️ Equipped
                          </span>
                        ) : isUnlocked ? (
                          <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded">
                            Unlocked
                          </span>
                        ) : canAfford ? (
                          <span className="text-[10px] font-bold bg-green-600 text-white px-2 py-0.5 rounded">
                            Ready to Forge
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-gray-600 text-white px-2 py-0.5 rounded flex items-center gap-0.5">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-800 mb-2">{recipe.description}</p>

                      {/* Cost Details */}
                      {!isUnlocked && (
                        <div className="text-[11px] font-mono font-bold flex flex-wrap gap-1 mb-2">
                          {cost.wood && (
                            <span
                              className={`px-1.5 py-0.5 rounded border ${
                                (resources.wood || 0) >= cost.wood
                                  ? 'bg-green-100 text-green-900 border-green-300'
                                  : 'bg-red-100 text-red-900 border-red-300'
                              }`}
                            >
                              🪵 {resources.wood || 0}/{cost.wood} Wood
                            </span>
                          )}
                          {cost.stone && (
                            <span
                              className={`px-1.5 py-0.5 rounded border ${
                                (resources.stone || 0) >= cost.stone
                                  ? 'bg-green-100 text-green-900 border-green-300'
                                  : 'bg-red-100 text-red-900 border-red-300'
                              }`}
                            >
                              🪨 {resources.stone || 0}/{cost.stone} Stone
                            </span>
                          )}
                          {cost.iron && (
                            <span
                              className={`px-1.5 py-0.5 rounded border ${
                                (resources.iron || 0) >= cost.iron
                                  ? 'bg-green-100 text-green-900 border-green-300'
                                  : 'bg-red-100 text-red-900 border-red-300'
                              }`}
                            >
                              ⛓️ {resources.iron || 0}/{cost.iron} Iron
                            </span>
                          )}
                          {cost.bone && (
                            <span
                              className={`px-1.5 py-0.5 rounded border ${
                                (resources.bone || 0) >= cost.bone
                                  ? 'bg-green-100 text-green-900 border-green-300'
                                  : 'bg-red-100 text-red-900 border-red-300'
                              }`}
                            >
                              🦴 {resources.bone || 0}/{cost.bone} Bone
                            </span>
                          )}
                          {cost.silk && (
                            <span
                              className={`px-1.5 py-0.5 rounded border ${
                                (resources.silk || 0) >= cost.silk
                                  ? 'bg-green-100 text-green-900 border-green-300'
                                  : 'bg-red-100 text-red-900 border-red-300'
                              }`}
                            >
                              🕸️ {resources.silk || 0}/{cost.silk} Silk
                            </span>
                          )}
                          {cost.crystal && (
                            <span
                              className={`px-1.5 py-0.5 rounded border ${
                                (resources.crystal || 0) >= cost.crystal
                                  ? 'bg-green-100 text-green-900 border-green-300'
                                  : 'bg-red-100 text-red-900 border-red-300'
                              }`}
                            >
                              🔮 {resources.crystal || 0}/{cost.crystal} Crystal
                            </span>
                          )}
                          {cost.gold && (
                            <span
                              className={`px-1.5 py-0.5 rounded border ${
                                gold >= cost.gold
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : 'bg-red-100 text-red-900 border-red-300'
                              }`}
                            >
                              🪙 {gold}/{cost.gold} Gold
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action */}
                    <div>
                      {isUnlocked ? (
                        <button
                          onClick={() => onSelectWeapon(weaponIndex)}
                          disabled={isEquipped}
                          className={`w-full py-1.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-1 border-2 transition-all cursor-pointer ${
                            isEquipped
                              ? 'bg-amber-600 text-white border-amber-300 cursor-default'
                              : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-400 active:scale-98'
                          }`}
                        >
                          <Sword className="w-4 h-4" />
                          <span>{isEquipped ? 'Currently In Hand' : 'Equip Weapon'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onForgeWeapon(recipe)}
                          disabled={!canAfford}
                          className={`w-full py-2 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
                            canAfford
                              ? 'bg-[#dc2626] hover:bg-[#b91c1c] text-white border-[#fca5a5] shadow-md active:scale-98'
                              : 'bg-gray-400 text-gray-700 border-gray-500 cursor-not-allowed opacity-60'
                          }`}
                        >
                          <Hammer className="w-4 h-4" />
                          <span>
                            {canAfford ? `Forge ${recipe.name}` : 'Gather Monster Drops to Forge'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: LOOTED MATERIALS ENCYCLOPEDIA */}
        {activeTab === 'resources' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-1 gap-2.5">
            <div className="p-2 bg-blue-50 border border-blue-200 rounded text-blue-900 text-xs">
              💡 <span className="font-bold">Progressive Wilderness Economy:</span> Slimes,
              skeletons, cave spiders, and stone golems drop distinct biological and geological
              materials. Defeat them in combat to loot everything you need for shelter and weaponry!
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {(Object.keys(RESOURCE_META) as ResourceType[]).map(type => {
                const meta = RESOURCE_META[type];
                const count = resources[type] || 0;

                return (
                  <div
                    key={type}
                    className="mc-panel p-3 bg-white border-2 border-[#94a3b8] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-3xl">{meta.icon}</span>
                          <div>
                            <h4 className="font-bold text-sm text-black leading-tight">
                              {meta.name}
                            </h4>
                            <span className="text-[10px] text-gray-500 uppercase font-mono">
                              {type}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-bold font-mono text-black">{count}</div>
                          <div className="text-[9px] text-gray-500 uppercase font-semibold">
                            in bag
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs text-gray-700">
                        <div className="bg-gray-50 p-1.5 rounded border border-gray-200">
                          <span className="font-bold text-gray-900">⚔️ Harvest From:</span>
                          <p className="text-[11px] text-gray-600">{meta.source}</p>
                        </div>

                        <div className="bg-amber-50/70 p-1.5 rounded border border-amber-200">
                          <span className="font-bold text-amber-900">🔨 Essential For:</span>
                          <p className="text-[11px] text-amber-800">{meta.uses}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t-2 border-black/20 pt-2 flex items-center justify-between text-xs text-gray-600 font-mono">
          <div>
            Built Outposts: <span className="font-bold text-black">{placedStructures.length}</span>
          </div>
          <div className="text-[11px] text-gray-500">
            Press <kbd className="px-1 py-0.5 bg-gray-200 border rounded text-black">B</kbd> or{' '}
            <kbd className="px-1 py-0.5 bg-gray-200 border rounded text-black">ESC</kbd> to close
          </div>
        </div>
      </div>
    </div>
  );
};
