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

  // Ensure inventory grid shows at least 24 slots (4 rows of 6) for that authentic Minecraft inventory look
  const totalSlotsCount = Math.max(24, Math.ceil(filteredItems.length / 6) * 6);
  const emptySlotsCount = Math.max(0, totalSlotsCount - filteredItems.length);

  return (
    <div
      id="hero-inventory-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="hero-inventory-modal"
        className="relative w-full max-w-5xl h-[94vh] sm:h-[90vh] max-h-[800px] mc-panel-dark flex flex-col overflow-hidden text-white"
        style={{ fontFamily: "'VT323', monospace" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* --- MINECRAFT WINDOW HEADER --- */}
        <header className="flex justify-between items-center px-4 py-2.5 bg-[#181818] border-b-2 border-black">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 mc-slot-dark flex items-center justify-center text-xl text-yellow-400">
              🎒
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-2xl font-bold tracking-wider text-[#ffd700] uppercase leading-tight mc-text">
                Hero Inventory
              </h1>
              <span className="hidden sm:inline text-xs text-gray-400 font-mono">
                Equip gear, unlock enchantments, and salvage loot
              </span>
            </div>
          </div>

          {/* Right: Power Level & Enchantment Points & Emeralds & Close */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Power Diamond */}
            <div
              className="mc-slot-dark px-2.5 sm:px-3 py-1 flex items-center gap-1.5 text-[#38bdf8] font-bold text-xs sm:text-sm"
              title="Overall Hero Power Level"
            >
              <span>◆</span>
              <span className="font-mono">PL {stats.powerLevel}</span>
            </div>

            {/* Enchantment Points */}
            <div
              className="mc-slot-dark px-2 sm:px-2.5 py-1 flex items-center gap-1.5 text-purple-300 font-bold text-xs"
              title="Available Enchantment Points"
            >
              <span>🟣</span>
              <span className="font-mono">{stats.enchantmentPoints} PTS</span>
            </div>

            {/* Emerald Pouch */}
            <div
              className="hidden sm:flex mc-slot-dark px-2.5 py-1 items-center gap-1 text-emerald-400 font-bold text-xs"
              title="Emeralds"
            >
              <span>💎</span>
              <span className="font-mono">{stats.emeralds}</span>
            </div>

            {/* Close Button */}
            <button
              id="close-inventory-btn"
              onClick={onClose}
              className="mc-btn px-2 py-1 text-sm font-bold"
              title="Close [ESC] / [I]"
            >
              <X className="w-5 h-5 inline" />
            </button>
          </div>
        </header>

        {/* --- MOBILE TAB SWITCHER (< md screens) --- */}
        <div className="flex md:hidden bg-[#151515] border-b-2 border-black p-1.5 gap-1.5">
          <button
            onClick={() => setMobileTab('equipped')}
            className={`flex-1 py-1.5 text-xs font-bold uppercase transition-none cursor-pointer ${
              mobileTab === 'equipped'
                ? 'mc-panel text-black border-black font-bold'
                : 'mc-btn text-gray-300'
            }`}
          >
            ⚔️ Equipped
          </button>
          <button
            onClick={() => setMobileTab('backpack')}
            className={`flex-1 py-1.5 text-xs font-bold uppercase transition-none cursor-pointer ${
              mobileTab === 'backpack'
                ? 'mc-panel text-black border-black font-bold'
                : 'mc-btn text-gray-300'
            }`}
          >
            🎒 Bag ({stats.inventory.length})
          </button>
          <button
            onClick={() => setMobileTab('details')}
            className={`flex-1 py-1.5 text-xs font-bold uppercase transition-none cursor-pointer ${
              mobileTab === 'details'
                ? 'mc-panel text-black border-black font-bold'
                : 'mc-btn text-gray-300'
            }`}
          >
            ✨ Details
          </button>
        </div>

        {/* --- MAIN BODY: 2-COLUMN MINECRAFT LAYOUT --- */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          
          {/* ======================================================== */}
          {/* LEFT COLUMN: MINECRAFT PAPERDOLL & EQUIPPED SLOTS (5 cols) */}
          {/* ======================================================== */}
          <div
            className={`md:col-span-5 bg-[#1a1a1a] p-3 sm:p-4 border-r-0 md:border-r-2 border-black flex flex-col gap-3 overflow-y-auto ${
              mobileTab !== 'equipped' ? 'hidden md:flex' : 'flex'
            }`}
          >
            <div className="flex items-center justify-between pb-1 border-b-2 border-black">
              <h2 className="text-sm font-bold text-gray-300 tracking-wider uppercase">
                EQUIPPED LOADOUT
              </h2>
              <span className="text-xs text-yellow-400 font-mono">
                CLICK TO INSPECT
              </span>
            </div>

            {/* Primary Equipment Slots */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-2">
              {/* Melee Weapon Slot */}
              <div
                onClick={() => handleSelectItem(stats.equippedMelee.id, true)}
                className={`p-2.5 border-2 transition-none cursor-pointer flex flex-col gap-1.5 ${
                  selectedItemId === stats.equippedMelee.id
                    ? 'mc-slot-selected bg-[#241f17]'
                    : 'mc-slot-dark hover:bg-[#202020]'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-red-400">
                    <Sword className="w-3.5 h-3.5" /> MELEE WEAPON
                  </span>
                  <span className="text-[#38bdf8] font-mono font-black">◆ {stats.equippedMelee.power}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-12 h-12 mc-slot flex items-center justify-center text-2xl flex-shrink-0">
                    {stats.equippedMelee.icon}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-sm text-[#fef08a] truncate">
                      {stats.equippedMelee.name}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      {stats.equippedMelee.damage} DMG • {stats.equippedMelee.attackSpeed}x SPD
                    </span>
                  </div>
                </div>
              </div>

              {/* Ranged Weapon Slot */}
              <div
                onClick={() => handleSelectItem(stats.equippedRanged.id, true)}
                className={`p-2.5 border-2 transition-none cursor-pointer flex flex-col gap-1.5 ${
                  selectedItemId === stats.equippedRanged.id
                    ? 'mc-slot-selected bg-[#241f17]'
                    : 'mc-slot-dark hover:bg-[#202020]'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <Crosshair className="w-3.5 h-3.5" /> RANGED BOW
                  </span>
                  <span className="text-[#38bdf8] font-mono font-black">◆ {stats.equippedRanged.power}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-12 h-12 mc-slot flex items-center justify-center text-2xl flex-shrink-0">
                    {stats.equippedRanged.icon}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-sm text-[#fef08a] truncate">
                      {stats.equippedRanged.name}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      {stats.equippedRanged.damage} DMG • {stats.arrows} Arrows
                    </span>
                  </div>
                </div>
              </div>

              {/* Armor Slot */}
              <div
                onClick={() => handleSelectItem(stats.equippedArmor.id, true)}
                className={`sm:col-span-2 md:col-span-1 p-2.5 border-2 transition-none cursor-pointer flex flex-col gap-1.5 ${
                  selectedItemId === stats.equippedArmor.id
                    ? 'mc-slot-selected bg-[#241f17]'
                    : 'mc-slot-dark hover:bg-[#202020]'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-sky-400">
                    <Shield className="w-3.5 h-3.5" /> ARMOR SUITE
                  </span>
                  <span className="text-[#38bdf8] font-mono font-black">◆ {stats.equippedArmor.power}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-12 h-12 mc-slot flex items-center justify-center text-2xl flex-shrink-0">
                    {stats.equippedArmor.icon}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-sm text-[#fef08a] truncate">
                      {stats.equippedArmor.name}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      +{stats.equippedArmor.hpBonus} HP • {Math.round((stats.equippedArmor.damageReduction || 0) * 100)}% Defense
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3 Dedicated Artifact Slots */}
            <div className="flex flex-col gap-1.5 mt-1">
              <span className="text-xs font-bold text-gray-300 tracking-wider uppercase">
                ARTIFACT SLOTS [KEY 1, 2, 3]
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((slotIdx) => {
                  const art = stats.equippedArtifacts[slotIdx];
                  const isSelected = selectedItem?.id === art?.id;

                  return (
                    <div
                      key={slotIdx}
                      onClick={() => art && handleSelectItem(art.id, true)}
                      className={`p-2 border-2 flex flex-col items-center justify-between text-center cursor-pointer transition-none aspect-square ${
                        isSelected
                          ? 'mc-slot-selected bg-[#241f17]'
                          : art
                          ? 'mc-slot-dark hover:bg-[#202020]'
                          : 'mc-slot-dark opacity-50 cursor-default'
                      }`}
                    >
                      <div className="w-full flex justify-between text-[10px] text-gray-400 font-mono">
                        <span className="text-yellow-400 font-bold">[{slotIdx + 1}]</span>
                        {art && <span className="text-[#38bdf8] font-black">◆{art.power}</span>}
                      </div>
                      <span className="text-2xl my-auto">{art ? art.icon : '✦'}</span>
                      <span className="text-[10px] font-bold text-[#f5ebd7] truncate w-full">
                        {art ? art.name : 'Empty'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hero Vitals Summary Card */}
            <div className="mt-auto mc-slot-dark p-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Max Health:</span>
                <span className="text-red-400 font-bold font-mono">{stats.maxHp} HP</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Defense Reduction:</span>
                <span className="text-sky-400 font-bold font-mono">
                  {Math.round((stats.equippedArmor.damageReduction || 0) * 100)}%
                </span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Quiver Stock:</span>
                <span className="text-yellow-400 font-bold font-mono">{stats.arrows} Arrows</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Emerald Balance:</span>
                <span className="text-emerald-400 font-bold font-mono">{stats.emeralds} 💎</span>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: INVENTORY BACKPACK & INSPECTOR (7 cols) */}
          {/* ======================================================== */}
          <div
            className={`md:col-span-7 bg-[#151515] p-3 sm:p-4 flex flex-col gap-3 overflow-y-auto ${
              mobileTab === 'equipped' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Category Filter Tabs */}
            <div className={`${mobileTab === 'details' ? 'hidden md:block' : 'block'}`}>
              <div className="flex items-center gap-1.5 pb-2 border-b-2 border-black mb-2 overflow-x-auto">
                {(['all', 'melee', 'ranged', 'armor', 'artifact'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1 text-xs font-bold uppercase transition-none cursor-pointer whitespace-nowrap ${
                      activeCategory === cat
                        ? 'mc-panel text-black border-black font-bold'
                        : 'mc-btn text-gray-300'
                    }`}
                  >
                    {cat === 'all' ? 'All Items' : cat}
                  </button>
                ))}
              </div>

              {/* Minecraft Inventory Items Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-1.5 p-2 mc-slot-dark max-h-[220px] overflow-y-auto">
                {filteredItems.map((item) => {
                  const isSel = item.id === selectedItemId;
                  const isUnique = item.rarity === 'unique';
                  const isRare = item.rarity === 'rare';

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectItem(item.id, true)}
                      className={`relative aspect-square p-1.5 flex flex-col items-center justify-between text-center cursor-pointer transition-none border-2 ${
                        isSel
                          ? 'mc-slot-selected bg-[#241f17] z-10'
                          : isUnique
                          ? 'mc-slot-dark border-amber-500 hover:bg-[#202020]'
                          : isRare
                          ? 'mc-slot-dark border-sky-400 hover:bg-[#202020]'
                          : 'mc-slot-dark hover:bg-[#202020]'
                      }`}
                    >
                      {/* Power Level Diamond */}
                      <div className="w-full flex justify-between items-center text-[9px] font-mono leading-none">
                        <span className="text-[#38bdf8] font-black">◆{item.power}</span>
                        {isUnique && <span className="text-amber-400 font-bold">★</span>}
                      </div>

                      <span className="text-2xl sm:text-3xl my-auto">{item.icon}</span>
                      <span className="text-[10px] font-bold text-[#f5ebd7] truncate w-full leading-none">
                        {item.name}
                      </span>
                    </div>
                  );
                })}

                {/* Fill empty slots to emulate authentic Minecraft inventory grid */}
                {Array.from({ length: emptySlotsCount }).map((_, idx) => (
                  <div
                    key={`empty-${idx}`}
                    className="aspect-square mc-slot-dark opacity-35 border-2 border-black flex items-center justify-center"
                  >
                    <span className="text-gray-600 text-xs">·</span>
                  </div>
                ))}

                {filteredItems.length === 0 && emptySlotsCount === 0 && (
                  <div className="col-span-full py-6 text-center text-xs text-gray-400 font-mono">
                    No items in this category. Defeat monsters and open dungeon chests to loot more!
                  </div>
                )}
              </div>
            </div>

            {/* --- SELECTED ITEM INSPECTOR & ENCHANTMENT UPGRADES --- */}
            {selectedItem && (
              <div
                className={`mc-slot-dark p-3 sm:p-4 border-2 border-black flex flex-col gap-2.5 ${
                  mobileTab === 'backpack' ? 'hidden md:flex' : 'flex'
                }`}
              >
                {/* Header: Name, Rarity & Action Buttons */}
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 mc-slot flex items-center justify-center text-3xl flex-shrink-0">
                      {selectedItem.icon}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-base sm:text-lg text-[#fef08a]">
                          {selectedItem.name}
                        </h3>
                        <span
                          className={`text-[10px] uppercase font-bold px-1.5 py-0.5 border ${
                            selectedItem.rarity === 'unique'
                              ? 'bg-amber-500/20 text-yellow-300 border-yellow-500'
                              : selectedItem.rarity === 'rare'
                              ? 'bg-sky-500/20 text-sky-300 border-sky-400'
                              : 'bg-black text-gray-300 border-gray-600'
                          }`}
                        >
                          {selectedItem.rarity}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 font-mono">
                        Power ◆ {selectedItem.power} • {selectedItem.category.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Equip & Salvage Actions */}
                  <div className="flex items-center gap-2">
                    {!isEquipped ? (
                      <button
                        onClick={() => {
                          onEquipItem(selectedItem);
                          dungeonsAudio.playAnvilStrike();
                        }}
                        className="mc-btn-green px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer uppercase"
                      >
                        <Check className="w-3.5 h-3.5" /> EQUIP
                      </button>
                    ) : (
                      <div className="mc-btn-green px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 opacity-90 cursor-default uppercase">
                        <Check className="w-3.5 h-3.5" /> EQUIPPED
                      </div>
                    )}

                    {!isEquipped && (
                      <button
                        onClick={() => {
                          onSalvageItem(selectedItem);
                          dungeonsAudio.playEmeraldPickup();
                        }}
                        className="mc-btn-red px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer uppercase"
                        title={`Salvage into ${selectedItem.salvageEmeralds} Emeralds`}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> SALVAGE (+{selectedItem.salvageEmeralds} 💎)
                      </button>
                    )}
                  </div>
                </div>

                {/* Description & Unique Perks */}
                <p className="text-xs text-gray-300 leading-relaxed font-mono">
                  {selectedItem.description}
                </p>

                {'uniquePerk' in selectedItem && selectedItem.uniquePerk && (
                  <div className="mc-slot-dark p-2 border-2 border-amber-600/60 bg-[#1e1a12] text-xs text-yellow-300 flex items-center gap-2 font-mono">
                    <Sparkles className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                    <span><b>Unique Trait:</b> {selectedItem.uniquePerk}</span>
                  </div>
                )}

                {/* --- INTERACTIVE ENCHANTMENT SLOTS --- */}
                {'enchantmentSlots' in selectedItem && selectedItem.enchantmentSlots && (
                  <div className="flex flex-col gap-2 pt-2 border-t-2 border-black">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="flex items-center gap-1 text-purple-400">
                        <Sparkles className="w-3.5 h-3.5" /> ENCHANTMENT SLOTS
                      </span>
                      <span className="text-purple-300 font-mono">
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
                            className="mc-slot-dark p-2 border border-black flex flex-col justify-between gap-1.5 text-xs"
                          >
                            <div>
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-[#fef08a] flex items-center gap-1">
                                  <span>{def.icon}</span> {def.name}
                                </span>
                                <span className="text-purple-400 font-bold tracking-widest text-sm">
                                  {currentTier === 0
                                    ? '☆☆☆'
                                    : currentTier === 1
                                    ? '★☆☆'
                                    : currentTier === 2
                                    ? '★★☆'
                                    : '★★★'}
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-400 mt-1 line-clamp-2 font-mono">
                                {currentTier > 0 ? def.tierEffects[currentTier - 1] : def.description}
                              </p>
                            </div>

                            <div className="flex gap-1.5 mt-1">
                              {currentTier < 3 ? (
                                <button
                                  onClick={() => {
                                    onUpgradeEnchantment(selectedItem.id, slotIdx);
                                    dungeonsAudio.playEnchantUpgrade();
                                  }}
                                  disabled={!canAffordUpgrade}
                                  className="mc-btn-gold flex-1 py-1 px-2 text-[10px] font-bold cursor-pointer disabled:opacity-50"
                                >
                                  Tier {currentTier + 1} ({nextCost} 🟣)
                                </button>
                              ) : (
                                <div className="flex-1 text-center py-1 text-[10px] font-bold text-yellow-400 mc-slot-dark border border-yellow-500">
                                  MAX TIER
                                </div>
                              )}

                              {currentTier > 0 && (
                                <button
                                  onClick={() => onRefundEnchantment(selectedItem.id, slotIdx)}
                                  className="mc-btn px-2 py-1 text-[10px] font-bold text-gray-300 cursor-pointer"
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

        {/* --- MINECRAFT WINDOW FOOTER --- */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#181818] border-t-2 border-black text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-300">Quick Key:</span>
            <kbd className="px-1.5 py-0.5 bg-black text-yellow-400 border border-gray-700 font-mono text-xs">
              I
            </kbd>
            <span>or</span>
            <kbd className="px-1.5 py-0.5 bg-black text-yellow-400 border border-gray-700 font-mono text-xs">
              ESC
            </kbd>
            <span>Toggles Hero Inventory</span>
          </div>

          <button
            onClick={onClose}
            className="mc-btn px-4 py-1.5 text-sm font-bold"
          >
            Close Inventory
          </button>
        </div>
      </div>
    </div>
  );
};
