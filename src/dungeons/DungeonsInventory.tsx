import React, { useState } from 'react';
import {
  DungeonsPlayerStats,
  DungeonsItem,
  DungeonsGearItem,
  DungeonsArtifact,
  DungeonsItemCategory,
} from './types';
import { ENCHANTMENT_DEFINITIONS } from './dungeonsData';
import { dungeonsAudio } from './dungeonsAudio';
import {
  X,
  Sparkles,
  Sword,
  Crosshair,
  Shield,
  Trash2,
  Check,
  RotateCcw,
  Zap,
} from 'lucide-react';

interface DungeonsInventoryProps {
  isOpen: boolean;
  onClose: () => void;
  stats: DungeonsPlayerStats;
  onEquipItem: (item: DungeonsItem) => void;
  onSalvageItem: (item: DungeonsItem) => void;
  onUpgradeEnchantment: (itemId: string, slotIndex: number) => void;
  onRefundEnchantment: (itemId: string, slotIndex: number) => void;
}

export const DungeonsInventory: React.FC<DungeonsInventoryProps> = ({
  isOpen,
  onClose,
  stats,
  onEquipItem,
  onSalvageItem,
  onUpgradeEnchantment,
  onRefundEnchantment,
}) => {
  const [activeCategory, setActiveCategory] = useState<DungeonsItemCategory | 'all'>('all');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(() => stats.equippedMelee.id);
  const [mobileTab, setMobileTab] = useState<'equipped' | 'backpack' | 'details'>('equipped');

  if (!isOpen) return null;

  // Find currently selected item (from equipped or inventory)
  const allKnownItems: DungeonsItem[] = [
    stats.equippedMelee,
    stats.equippedRanged,
    stats.equippedArmor,
    ...(stats.equippedArtifacts.filter(Boolean) as DungeonsArtifact[]),
    ...stats.inventory,
  ];

  const selectedItem = allKnownItems.find((i) => i.id === selectedItemId) || stats.equippedMelee;

  const isEquipped =
    selectedItem.id === stats.equippedMelee.id ||
    selectedItem.id === stats.equippedRanged.id ||
    selectedItem.id === stats.equippedArmor.id ||
    stats.equippedArtifacts.some((a) => a?.id === selectedItem.id);

  const filteredItems = stats.inventory.filter((item) => {
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  });

  const handleSelectItem = (id: string, switchToDetailsOnMobile = false) => {
    setSelectedItemId(id);
    if (switchToDetailsOnMobile) {
      setMobileTab('details');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl h-[94vh] sm:h-[90vh] max-h-[780px] bg-[#1a1714] border-3 sm:border-4 border-[#4a3f35] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* --- WINDOW HEADER --- */}
        <header className="flex justify-between items-center px-3 sm:px-6 py-2.5 sm:py-3 border-b-2 border-[#3d3329] bg-[#241f1a]">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xl sm:text-2xl">🎒</span>
            <div className="flex flex-col">
              <h1 className="text-base sm:text-xl font-black tracking-wider sm:tracking-widest text-[#f5ebd7] uppercase">
                Hero Inventory
              </h1>
              <span className="hidden sm:inline text-xs text-[#b8a99a]">
                Manage equipped gear, unlock enchantments, and salvage loot
              </span>
            </div>
          </div>

          {/* Right: Power Level & Enchantment Points & Close */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Power Diamond */}
            <div
              className="flex items-center gap-1 bg-[#142338] px-2 sm:px-3 py-1 rounded-lg border border-[#38bdf8] text-[#38bdf8] font-black text-xs sm:text-sm shadow-[0_0_12px_rgba(56,189,248,0.4)]"
              title="Overall Hero Power Level"
            >
              <span>◆</span>
              <span>PL {stats.powerLevel}</span>
            </div>

            {/* Enchantment Points */}
            <div
              className="flex items-center gap-1 bg-[#261633] px-2 sm:px-2.5 py-1 rounded-lg border border-[#a855f7] text-[#e9d5ff] font-bold text-xs shadow-sm"
              title="Available Enchantment Points"
            >
              <span>🟣</span>
              <span>{stats.enchantmentPoints} pts</span>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 bg-[#352c24] hover:bg-[#4a3d31] border border-[#635343] rounded-lg flex items-center justify-center text-white active:scale-95 transition-all cursor-pointer"
              title="Close [ESC] / [I]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* --- MOBILE TAB SWITCHER (< md screens) --- */}
        <div className="flex md:hidden bg-[#1f1b17] border-b border-[#3d3329] p-1.5 gap-1">
          <button
            onClick={() => setMobileTab('equipped')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mobileTab === 'equipped'
                ? 'bg-[#d97706] text-white shadow'
                : 'bg-[#2a241f] text-[#a8998a]'
            }`}
          >
            ⚔️ Equipped
          </button>
          <button
            onClick={() => setMobileTab('backpack')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mobileTab === 'backpack'
                ? 'bg-[#d97706] text-white shadow'
                : 'bg-[#2a241f] text-[#a8998a]'
            }`}
          >
            🎒 Bag ({stats.inventory.length})
          </button>
          <button
            onClick={() => setMobileTab('details')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mobileTab === 'details'
                ? 'bg-[#d97706] text-white shadow'
                : 'bg-[#2a241f] text-[#a8998a]'
            }`}
          >
            ✨ Details
          </button>
        </div>

        {/* --- MAIN BODY: 2-COLUMN LAYOUT (COLLAPSIBLE ON MOBILE) --- */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          
          {/* ======================================================== */}
          {/* LEFT COLUMN: PAPERDOLL EQUIPPED SLOTS (5 cols on desktop) */}
          {/* ======================================================== */}
          <div
            className={`md:col-span-5 bg-[#1f1b17] p-3 sm:p-4 border-r-0 md:border-r-2 border-[#3d3329] flex flex-col gap-3 overflow-y-auto ${
              mobileTab !== 'equipped' ? 'hidden md:flex' : 'flex'
            }`}
          >
            <h2 className="text-xs font-bold text-[#bcaaa4] tracking-wider uppercase border-b border-[#3d3329] pb-1">
              Equipped Equipment
            </h2>

            {/* Primary Equipment Slots */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-2.5">
              {/* Melee Weapon Slot */}
              <div
                onClick={() => handleSelectItem(stats.equippedMelee.id, true)}
                className={`p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedItemId === stats.equippedMelee.id
                    ? 'border-[#fbbf24] bg-[#2f271e] shadow-[0_0_14px_rgba(251,191,36,0.4)]'
                    : 'border-[#4a3e32] bg-[#241f1a] hover:border-[#786352]'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-[#9ca3af] font-bold mb-1">
                  <span className="flex items-center gap-1 text-[#f5ebd7]">
                    <Sword className="w-3.5 h-3.5 text-red-400" /> MELEE
                  </span>
                  <span className="text-[#38bdf8] font-mono font-black">◆ {stats.equippedMelee.power}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{stats.equippedMelee.icon}</span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-xs sm:text-sm text-[#fef08a] truncate">
                      {stats.equippedMelee.name}
                    </span>
                    <span className="text-[10px] text-[#94a3b8] font-mono">
                      {stats.equippedMelee.damage} DMG • {stats.equippedMelee.attackSpeed}x SPD
                    </span>
                  </div>
                </div>
              </div>

              {/* Ranged Weapon Slot */}
              <div
                onClick={() => handleSelectItem(stats.equippedRanged.id, true)}
                className={`p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedItemId === stats.equippedRanged.id
                    ? 'border-[#fbbf24] bg-[#2f271e] shadow-[0_0_14px_rgba(251,191,36,0.4)]'
                    : 'border-[#4a3e32] bg-[#241f1a] hover:border-[#786352]'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-[#9ca3af] font-bold mb-1">
                  <span className="flex items-center gap-1 text-[#f5ebd7]">
                    <Crosshair className="w-3.5 h-3.5 text-amber-400" /> RANGED
                  </span>
                  <span className="text-[#38bdf8] font-mono font-black">◆ {stats.equippedRanged.power}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{stats.equippedRanged.icon}</span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-xs sm:text-sm text-[#fef08a] truncate">
                      {stats.equippedRanged.name}
                    </span>
                    <span className="text-[10px] text-[#94a3b8] font-mono">
                      {stats.equippedRanged.damage} DMG • {stats.arrows} Arrows
                    </span>
                  </div>
                </div>
              </div>

              {/* Armor Slot */}
              <div
                onClick={() => handleSelectItem(stats.equippedArmor.id, true)}
                className={`sm:col-span-2 md:col-span-1 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedItemId === stats.equippedArmor.id
                    ? 'border-[#fbbf24] bg-[#2f271e] shadow-[0_0_14px_rgba(251,191,36,0.4)]'
                    : 'border-[#4a3e32] bg-[#241f1a] hover:border-[#786352]'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-[#9ca3af] font-bold mb-1">
                  <span className="flex items-center gap-1 text-[#f5ebd7]">
                    <Shield className="w-3.5 h-3.5 text-blue-400" /> ARMOR
                  </span>
                  <span className="text-[#38bdf8] font-mono font-black">◆ {stats.equippedArmor.power}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{stats.equippedArmor.icon}</span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-xs sm:text-sm text-[#fef08a] truncate">
                      {stats.equippedArmor.name}
                    </span>
                    <span className="text-[10px] text-[#94a3b8] font-mono">
                      +{stats.equippedArmor.hpBonus} HP • {Math.round((stats.equippedArmor.damageReduction || 0) * 100)}% Defense
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3 Dedicated Artifact Slots */}
            <div className="flex flex-col gap-1.5 mt-1">
              <span className="text-[11px] font-bold text-[#bcaaa4] tracking-wider uppercase">
                Artifact Slots ([1], [2], [3])
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((slotIdx) => {
                  const art = stats.equippedArtifacts[slotIdx];
                  const isSelected = selectedItem?.id === art?.id;

                  return (
                    <div
                      key={slotIdx}
                      onClick={() => art && handleSelectItem(art.id, true)}
                      className={`p-2 rounded-xl border-2 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#fbbf24] bg-[#2f271e] shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                          : art
                          ? 'border-[#4a3e32] bg-[#241f1a] hover:border-[#786352]'
                          : 'border-[#382f25] bg-[#1a1714] opacity-50'
                      }`}
                    >
                      <div className="w-full flex justify-between text-[9px] text-gray-400 font-mono">
                        <span>SLOT {slotIdx + 1}</span>
                        {art && <span className="text-[#38bdf8] font-black">◆{art.power}</span>}
                      </div>
                      <span className="text-2xl my-1">{art ? art.icon : '✦'}</span>
                      <span className="text-[10px] font-bold text-[#f5ebd7] truncate w-full">
                        {art ? art.name : 'Empty'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hero Vitals Summary Card */}
            <div className="mt-auto bg-[#141210] p-3 rounded-xl border border-[#3d3329] space-y-1 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Max Health</span>
                <span className="text-red-400 font-bold font-mono">{stats.maxHp} HP</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Total Defense Reduction</span>
                <span className="text-blue-400 font-bold font-mono">
                  {Math.round((stats.equippedArmor.damageReduction || 0) * 100)}%
                </span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Quiver Stock</span>
                <span className="text-amber-400 font-bold font-mono">{stats.arrows} Arrows</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Emerald Balance</span>
                <span className="text-emerald-400 font-bold font-mono">{stats.emeralds} 💎</span>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: INVENTORY BAG & DETAILS (7 cols on desktop) */}
          {/* ======================================================== */}
          <div
            className={`md:col-span-7 bg-[#171412] p-3 sm:p-4 flex flex-col gap-3 overflow-y-auto ${
              mobileTab === 'equipped' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Inventory Bag Section (hidden on mobile if user specifically is in 'details' tab) */}
            <div className={`${mobileTab === 'details' ? 'hidden md:block' : 'block'}`}>
              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#3d3329] mb-2">
                {(['all', 'melee', 'ranged', 'armor', 'artifact'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer whitespace-nowrap ${
                      activeCategory === cat
                        ? 'bg-[#d97706] text-white shadow-md border border-[#fef08a]'
                        : 'bg-[#241f1a] text-[#a8998a] hover:bg-[#352c24]'
                    }`}
                  >
                    {cat === 'all' ? 'All Items' : cat}
                  </button>
                ))}
              </div>

              {/* Inventory Items Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2 max-h-[220px] overflow-y-auto p-1 bg-[#120f0d] rounded-xl border border-[#352c24]">
                {filteredItems.map((item) => {
                  const isSel = item.id === selectedItemId;
                  const isUnique = item.rarity === 'unique';
                  const isRare = item.rarity === 'rare';

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectItem(item.id, true)}
                      className={`relative p-2 rounded-xl border-2 flex flex-col items-center justify-between text-center cursor-pointer transition-all ${
                        isSel
                          ? 'border-[#fbbf24] bg-[#2f271e] shadow-[0_0_12px_rgba(251,191,36,0.5)] scale-102 z-10'
                          : isUnique
                          ? 'border-[#f59e0b] bg-[#221c16] hover:border-[#fbbf24]'
                          : isRare
                          ? 'border-[#38bdf8] bg-[#18202b] hover:border-[#60a5fa]'
                          : 'border-[#4a3e32] bg-[#1a1714] hover:border-[#786352]'
                      }`}
                    >
                      {/* Power Level Diamond */}
                      <div className="w-full flex justify-between items-center text-[9px] font-mono">
                        <span className="text-[#38bdf8] font-black">◆{item.power}</span>
                        {isUnique && <span className="text-amber-400 font-bold">★</span>}
                      </div>

                      <span className="text-2xl sm:text-3xl my-1">{item.icon}</span>
                      <span className="text-[10px] font-bold text-[#f5ebd7] truncate w-full">
                        {item.name}
                      </span>
                    </div>
                  );
                })}

                {filteredItems.length === 0 && (
                  <div className="col-span-full py-6 text-center text-xs text-gray-500">
                    No items in this category. Slay monsters and open chests to loot more!
                  </div>
                )}
              </div>
            </div>

            {/* --- SELECTED ITEM INSPECTOR & ENCHANTMENT UPGRADES --- */}
            {selectedItem && (
              <div
                className={`bg-[#241f1a] p-3 sm:p-4 rounded-xl border-2 border-[#4a3f35] flex flex-col gap-3 shadow-lg ${
                  mobileTab === 'backpack' ? 'hidden md:flex' : 'flex'
                }`}
              >
                {/* Header: Name, Rarity & Action Buttons */}
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <span className="text-2xl sm:text-4xl p-2 bg-[#171412] rounded-lg border border-[#4a3e32]">
                      {selectedItem.icon}
                    </span>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-sm sm:text-base text-[#fef08a]">
                          {selectedItem.name}
                        </h3>
                        <span
                          className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border ${
                            selectedItem.rarity === 'unique'
                              ? 'bg-[#f59e0b]/20 text-[#fbbf24] border-[#f59e0b]'
                              : selectedItem.rarity === 'rare'
                              ? 'bg-[#38bdf8]/20 text-[#38bdf8] border-[#38bdf8]'
                              : 'bg-gray-800 text-gray-300 border-gray-600'
                          }`}
                        >
                          {selectedItem.rarity}
                        </span>
                      </div>
                      <span className="text-[11px] sm:text-xs text-[#94a3b8] font-mono">
                        Power ◆ {selectedItem.power} • {selectedItem.category.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Equip & Salvage Actions */}
                  <div className="flex items-center gap-2">
                    {!isEquipped && (
                      <button
                        onClick={() => {
                          onEquipItem(selectedItem);
                          dungeonsAudio.playAnvilStrike();
                        }}
                        className="px-3 py-1.5 bg-[#15803d] hover:bg-[#16a34a] border border-[#86efac] text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-md active:scale-95 transition-all cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> EQUIP
                      </button>
                    )}

                    {!isEquipped && (
                      <button
                        onClick={() => {
                          onSalvageItem(selectedItem);
                          dungeonsAudio.playEmeraldPickup();
                        }}
                        className="px-2.5 sm:px-3 py-1.5 bg-[#b91c1c] hover:bg-[#dc2626] border border-[#fca5a5] text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-md active:scale-95 transition-all cursor-pointer"
                        title={`Salvage into ${selectedItem.salvageEmeralds} Emeralds`}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> SALVAGE (+{selectedItem.salvageEmeralds} 💎)
                      </button>
                    )}
                  </div>
                </div>

                {/* Description & Unique Perks */}
                <p className="text-xs text-[#d1c7bd] leading-relaxed">
                  {selectedItem.description}
                </p>

                {'uniquePerk' in selectedItem && selectedItem.uniquePerk && (
                  <div className="bg-[#3a2e24] p-2 rounded-lg border border-[#f59e0b]/50 text-xs text-[#fef08a] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#fbbf24] flex-shrink-0" />
                    <span><b>Unique Trait:</b> {selectedItem.uniquePerk}</span>
                  </div>
                )}

                {/* --- INTERACTIVE ENCHANTMENT SLOTS (For Weapons and Armor) --- */}
                {'enchantmentSlots' in selectedItem && selectedItem.enchantmentSlots && (
                  <div className="flex flex-col gap-2 pt-1 border-t border-[#3d3329]">
                    <div className="flex justify-between items-center text-xs font-bold text-[#bcaaa4]">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" /> ENCHANTMENT SLOTS
                      </span>
                      <span className="text-[#e9d5ff] font-mono">
                        Available: 🟣 {stats.enchantmentPoints} PT{stats.enchantmentPoints === 1 ? '' : 'S'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {selectedItem.enchantmentSlots.map((slot, slotIdx) => {
                        const def = ENCHANTMENT_DEFINITIONS[slot.id];
                        if (!def) return null;

                        const currentTier = slot.tier; // 0, 1, 2, 3
                        const nextCost = currentTier < 3 ? def.tierCosts[currentTier] : 0;
                        const canAffordUpgrade = currentTier < 3 && stats.enchantmentPoints >= nextCost;

                        return (
                          <div
                            key={slot.id}
                            className="bg-[#1a1714] p-2 rounded-lg border border-[#4a3e32] flex flex-col justify-between gap-1 text-xs"
                          >
                            <div>
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-[#fef08a] flex items-center gap-1">
                                  <span>{def.icon}</span> {def.name}
                                </span>
                                <span className="text-[#a855f7] font-bold">
                                  {currentTier === 0
                                    ? '☆☆☆'
                                    : currentTier === 1
                                    ? '★☆☆'
                                    : currentTier === 2
                                    ? '★★☆'
                                    : '★★★'}
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">
                                {currentTier > 0 ? def.tierEffects[currentTier - 1] : def.description}
                              </p>
                            </div>

                            <div className="flex gap-1 mt-1">
                              {currentTier < 3 ? (
                                <button
                                  onClick={() => {
                                    onUpgradeEnchantment(selectedItem.id, slotIdx);
                                    dungeonsAudio.playEnchantUpgrade();
                                  }}
                                  disabled={!canAffordUpgrade}
                                  className="flex-1 py-1 bg-[#7e22ce] hover:bg-[#9333ea] disabled:opacity-40 text-white font-bold text-[10px] rounded border border-[#d8b4fe] transition-all cursor-pointer"
                                >
                                  Tier {currentTier + 1} ({nextCost} 🟣)
                                </button>
                              ) : (
                                <div className="flex-1 text-center py-0.5 text-[10px] font-bold text-amber-400">
                                  MAX TIER
                                </div>
                              )}

                              {currentTier > 0 && (
                                <button
                                  onClick={() => onRefundEnchantment(selectedItem.id, slotIdx)}
                                  className="px-1.5 py-1 bg-[#374151] hover:bg-[#4b5563] text-gray-300 font-bold text-[10px] rounded border border-gray-500 cursor-pointer"
                                  title="Refund points back"
                                >
                                  Refund
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
