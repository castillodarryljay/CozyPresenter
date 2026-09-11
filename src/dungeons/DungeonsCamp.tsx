import React, { useState } from 'react';
import {
  DungeonsPlayerStats,
  DungeonsItem,
  DungeonsGearItem,
  DungeonsArtifact,
} from './types';
import {
  ALL_MELEE_WEAPONS,
  ALL_RANGED_WEAPONS,
  ALL_ARMOR,
  ALL_ARTIFACTS,
} from './dungeonsData';
import { dungeonsAudio } from './dungeonsAudio';
import { X, Sparkles, Hammer, ShoppingBag, ShieldAlert, Check } from 'lucide-react';

interface DungeonsCampProps {
  isOpen: boolean;
  onClose: () => void;
  stats: DungeonsPlayerStats;
  onObtainItem: (item: DungeonsItem) => void;
  onDeductEmeralds: (amount: number) => boolean;
  onRestAtCamp: () => void;
  onOpenMissionMap: () => void;
}

export const DungeonsCamp: React.FC<DungeonsCampProps> = ({
  isOpen,
  onClose,
  stats,
  onObtainItem,
  onDeductEmeralds,
  onRestAtCamp,
  onOpenMissionMap,
}) => {
  const [activeTab, setActiveTab] = useState<'blacksmith' | 'trader' | 'campfire'>('blacksmith');
  const [rewardReveal, setRewardReveal] = useState<DungeonsItem | null>(null);

  if (!isOpen) return null;

  const blacksmithCost = Math.round(75 + stats.powerLevel * 4);
  const traderCost = Math.round(90 + stats.powerLevel * 4);

  // Roll mystery weapon/armor scaled to power level
  const handleRollBlacksmith = () => {
    if (!onDeductEmeralds(blacksmithCost)) return;

    dungeonsAudio.playAnvilStrike();
    const pool = [...ALL_MELEE_WEAPONS, ...ALL_RANGED_WEAPONS, ...ALL_ARMOR];
    const randomIndex = Math.floor(Math.random() * pool.length);
    const base = pool[randomIndex];

    // Scale item power level around player's current power
    const powerRoll = Math.max(1, Math.round(stats.powerLevel + (Math.random() * 4 - 1)));
    const newItem: DungeonsGearItem = {
      ...base,
      id: `${base.id}_${Date.now()}`,
      power: powerRoll,
      damage: base.damage ? Math.round(base.damage * (1 + powerRoll * 0.04)) : undefined,
      hpBonus: base.hpBonus ? Math.round(base.hpBonus * (1 + powerRoll * 0.04)) : undefined,
      salvageEmeralds: Math.round(base.salvageEmeralds * (1 + powerRoll * 0.03)),
      enchantmentSlots: base.enchantmentSlots.map((s) => ({ ...s, tier: 0 })),
    };

    onObtainItem(newItem);
    setRewardReveal(newItem);
  };

  // Roll mystery artifact
  const handleRollTrader = () => {
    if (!onDeductEmeralds(traderCost)) return;

    dungeonsAudio.playArtifactCast();
    const randomIndex = Math.floor(Math.random() * ALL_ARTIFACTS.length);
    const base = ALL_ARTIFACTS[randomIndex];

    const powerRoll = Math.max(1, Math.round(stats.powerLevel + (Math.random() * 4 - 1)));
    const newArt: DungeonsArtifact = {
      ...base,
      id: `${base.id}_${Date.now()}`,
      power: powerRoll,
      salvageEmeralds: Math.round(base.salvageEmeralds * (1 + powerRoll * 0.03)),
    };

    onObtainItem(newArt);
    setRewardReveal(newArt);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md select-none font-sans"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-[#1a1714] border-4 border-[#4a3f35] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex justify-between items-center px-4 sm:px-6 py-3 border-b-2 border-[#3d3329] bg-[#241f1a]">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏕️</span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-widest text-[#f5ebd7] uppercase">
                Camp Outpost
              </h1>
              <span className="text-xs text-[#b8a99a]">
                Visit merchants, forge mystery armaments, and plan your next expedition
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-[#0e1f13] px-3 py-1 rounded-lg border border-[#15803d] text-[#4ade80] font-black text-sm">
              <span>💎</span>
              <span className="font-mono">{stats.emeralds} EMERALDS</span>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 bg-[#352c24] hover:bg-[#4a3d31] border border-[#635343] rounded-lg flex items-center justify-center text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Tab Selector */}
        <div className="flex gap-2 px-4 sm:px-6 pt-3 border-b border-[#3d3329] bg-[#1d1916]">
          <button
            onClick={() => {
              setActiveTab('blacksmith');
              setRewardReveal(null);
            }}
            className={`px-4 py-2 text-xs sm:text-sm font-bold flex items-center gap-2 rounded-t-lg transition-all cursor-pointer ${
              activeTab === 'blacksmith'
                ? 'bg-[#29221b] border-t-2 border-x-2 border-[#fbbf24] text-[#fef08a]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Hammer className="w-4 h-4 text-amber-400" /> Blacksmith Merchant
          </button>

          <button
            onClick={() => {
              setActiveTab('trader');
              setRewardReveal(null);
            }}
            className={`px-4 py-2 text-xs sm:text-sm font-bold flex items-center gap-2 rounded-t-lg transition-all cursor-pointer ${
              activeTab === 'trader'
                ? 'bg-[#29221b] border-t-2 border-x-2 border-[#38bdf8] text-[#38bdf8]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-sky-400" /> Wandering Trader
          </button>

          <button
            onClick={() => {
              setActiveTab('campfire');
              setRewardReveal(null);
            }}
            className={`px-4 py-2 text-xs sm:text-sm font-bold flex items-center gap-2 rounded-t-lg transition-all cursor-pointer ${
              activeTab === 'campfire'
                ? 'bg-[#29221b] border-t-2 border-x-2 border-[#f97316] text-[#fed7aa]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>🔥</span> Campfire Hearth
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-[#171412]">
          {/* BLACKSMITH VIEW */}
          {activeTab === 'blacksmith' && (
            <div className="flex flex-col items-center text-center max-w-xl mx-auto space-y-4">
              <div className="w-20 h-20 bg-[#2d2218] border-2 border-[#f59e0b] rounded-2xl flex items-center justify-center text-4xl shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                ⚒️
              </div>
              <h2 className="text-xl font-black text-[#fef08a]">The Village Blacksmith</h2>
              <p className="text-xs sm:text-sm text-[#cbd5e1] leading-relaxed">
                "Welcome to my forge, hero! Hand over some emeralds and I'll strike my iron anvil to craft a mystery weapon or armor piece matching or surpassing your Power Level (Power ◆{stats.powerLevel})."
              </p>

              <button
                onClick={handleRollBlacksmith}
                disabled={stats.emeralds < blacksmithCost}
                className="px-6 py-3 bg-[#d97706] hover:bg-[#b45309] border-2 border-[#fef08a] rounded-xl text-white font-black text-sm sm:text-base flex items-center gap-2 shadow-[0_0_20px_rgba(217,119,6,0.6)] disabled:opacity-40 cursor-pointer active:scale-95 transition-all"
              >
                <span>Forge Mystery Gear</span>
                <span className="bg-black/30 px-2 py-0.5 rounded text-xs font-mono text-emerald-300">
                  {blacksmithCost} 💎
                </span>
              </button>
            </div>
          )}

          {/* TRADER VIEW */}
          {activeTab === 'trader' && (
            <div className="flex flex-col items-center text-center max-w-xl mx-auto space-y-4">
              <div className="w-20 h-20 bg-[#16212d] border-2 border-[#38bdf8] rounded-2xl flex items-center justify-center text-4xl shadow-[0_0_20px_rgba(56,189,248,0.4)]">
                🧙‍♂️
              </div>
              <h2 className="text-xl font-black text-[#38bdf8]">The Wandering Trader</h2>
              <p className="text-xs sm:text-sm text-[#cbd5e1] leading-relaxed">
                "Greetings, traveler! I carry curious and exotic artifacts from across the far reaches of the Overworld. Trade your emeralds for a powerful magical relic!"
              </p>

              <button
                onClick={handleRollTrader}
                disabled={stats.emeralds < traderCost}
                className="px-6 py-3 bg-[#0284c7] hover:bg-[#0369a1] border-2 border-[#7dd3fc] rounded-xl text-white font-black text-sm sm:text-base flex items-center gap-2 shadow-[0_0_20px_rgba(2,132,199,0.6)] disabled:opacity-40 cursor-pointer active:scale-95 transition-all"
              >
                <span>Purchase Mystery Artifact</span>
                <span className="bg-black/30 px-2 py-0.5 rounded text-xs font-mono text-emerald-300">
                  {traderCost} 💎
                </span>
              </button>
            </div>
          )}

          {/* CAMPFIRE REST VIEW */}
          {activeTab === 'campfire' && (
            <div className="flex flex-col items-center text-center max-w-xl mx-auto space-y-4">
              <div className="w-20 h-20 bg-[#29170e] border-2 border-[#ea580c] rounded-2xl flex items-center justify-center text-4xl shadow-[0_0_20px_rgba(234,88,12,0.5)]">
                🏕️
              </div>
              <h2 className="text-xl font-black text-[#fed7aa]">Campfire Haven</h2>
              <p className="text-xs sm:text-sm text-[#cbd5e1] leading-relaxed">
                Rest near the crackling campfire coals to fully restore all Health points, restock your quiver with +30 Arrows, and prepare for your next dangerous dungeon crawl.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onRestAtCamp();
                    dungeonsAudio.playPotionDrink();
                  }}
                  className="px-5 py-2.5 bg-[#ea580c] hover:bg-[#c2410c] border-2 border-[#fed7aa] rounded-xl text-white font-black text-sm flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <span>Rest & Restock Arrows (+30 🏹)</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenMissionMap();
                  }}
                  className="px-5 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] border-2 border-[#93c5fd] rounded-xl text-white font-black text-sm flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <span>Open Mission Map</span>
                </button>
              </div>
            </div>
          )}

          {/* REWARD REVEAL CARD */}
          {rewardReveal && (
            <div className="mt-6 max-w-md mx-auto bg-[#241f1a] p-4 rounded-xl border-2 border-[#fbbf24] shadow-[0_0_30px_rgba(251,191,36,0.5)] flex items-center gap-4 animate-bounce">
              <span className="text-4xl p-2 bg-[#171412] rounded-lg border border-[#4a3e32]">
                {rewardReveal.icon}
              </span>
              <div className="flex flex-col text-left">
                <span className="text-xs uppercase font-bold text-amber-400">
                  New Loot Unlocked!
                </span>
                <span className="text-base font-black text-white">{rewardReveal.name}</span>
                <span className="text-xs text-sky-400 font-mono">Power ◆ {rewardReveal.power}</span>
                <span className="text-[11px] text-gray-300 mt-1 line-clamp-1">
                  {rewardReveal.description}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
