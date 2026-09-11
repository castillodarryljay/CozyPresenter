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
        className="relative w-full max-w-4xl max-h-[92vh] bg-[#1a1714] border-3 sm:border-4 border-[#4a3f35] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex justify-between items-center px-3 sm:px-6 py-2.5 sm:py-3 border-b-2 border-[#3d3329] bg-[#241f1a]">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-2xl sm:text-3xl">🏕️</span>
            <div>
              <h1 className="text-base sm:text-xl font-black tracking-wider sm:tracking-widest text-[#f5ebd7] uppercase">
                Camp Outpost
              </h1>
              <span className="hidden sm:inline text-xs text-[#b8a99a]">
                Visit merchants, forge mystery armaments, and plan expeditions
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1.5 bg-[#0e1f13] px-2.5 sm:px-3 py-1 rounded-lg border border-[#15803d] text-[#4ade80] font-black text-xs sm:text-sm">
              <span>💎</span>
              <span className="font-mono">{stats.emeralds}</span>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 bg-[#352c24] hover:bg-[#4a3d31] border border-[#635343] rounded-lg flex items-center justify-center text-white cursor-pointer active:scale-95 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Tab Selector */}
        <div className="flex gap-1 sm:gap-2 px-2 sm:px-6 pt-2 sm:pt-3 border-b border-[#3d3329] bg-[#1d1916] overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('blacksmith');
              setRewardReveal(null);
            }}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 rounded-t-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'blacksmith'
                ? 'bg-[#29221b] border-t-2 border-x-2 border-[#fbbf24] text-[#fef08a]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Hammer className="w-4 h-4 text-amber-400" />
            <span>Blacksmith</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('trader');
              setRewardReveal(null);
            }}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 rounded-t-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'trader'
                ? 'bg-[#29221b] border-t-2 border-x-2 border-[#38bdf8] text-[#38bdf8]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-sky-400" />
            <span>Mystery Trader</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('campfire');
              setRewardReveal(null);
            }}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 rounded-t-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'campfire'
                ? 'bg-[#29221b] border-t-2 border-x-2 border-[#f97316] text-[#fed7aa]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>🔥</span>
            <span>Campfire Hearth</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-3 sm:p-6 overflow-y-auto bg-[#171412]">
          {/* BLACKSMITH VIEW */}
          {activeTab === 'blacksmith' && (
            <div className="flex flex-col items-center text-center max-w-xl mx-auto space-y-3 sm:space-y-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#2d2218] border-2 border-[#f59e0b] rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                ⚒️
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[#fef08a]">The Village Blacksmith</h2>
              <p className="text-xs text-gray-300">
                Forge a random weapon or armor piece tailored to your current Power Level (◆ {stats.powerLevel}).
                Higher level items grant superior damage and health bonuses.
              </p>

              <button
                onClick={handleRollBlacksmith}
                disabled={stats.emeralds < blacksmithCost}
                className="px-6 py-3 bg-[#d97706] hover:bg-[#b45309] border-2 border-[#fef08a] rounded-xl text-white font-black text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(217,119,6,0.6)] disabled:opacity-50 active:scale-95 transition-all cursor-pointer"
              >
                <span>⚒️ FORGE MYSTERY GEAR</span>
                <span className="bg-black/40 px-2 py-0.5 rounded text-xs font-mono text-[#fef08a]">
                  💎 {blacksmithCost}
                </span>
              </button>

              {/* Reveal Card */}
              {rewardReveal && rewardReveal.category !== 'artifact' && (
                <div className="w-full bg-[#241f1a] p-4 rounded-xl border-2 border-[#fbbf24] shadow-[0_0_20px_rgba(251,191,36,0.4)] animate-in zoom-in-95 duration-200 flex items-center gap-4 text-left">
                  <span className="text-4xl p-2 bg-[#1a1714] rounded-lg border border-[#4a3e32]">
                    {rewardReveal.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-[#fef08a] truncate">
                        {rewardReveal.name}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-[#38bdf8] bg-[#102a43] px-1.5 py-0.5 rounded border border-[#38bdf8]">
                        ◆ {rewardReveal.power}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 mt-1 line-clamp-2">
                      {rewardReveal.description}
                    </p>
                    <span className="text-[10px] text-emerald-400 font-bold mt-1 block">
                      Added to your inventory! Open [I] to equip or enchant.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TRADER VIEW */}
          {activeTab === 'trader' && (
            <div className="flex flex-col items-center text-center max-w-xl mx-auto space-y-3 sm:space-y-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#162536] border-2 border-[#38bdf8] rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-[0_0_20px_rgba(56,189,248,0.4)]">
                🔮
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[#38bdf8]">The Wandering Mystery Trader</h2>
              <p className="text-xs text-gray-300">
                Purchase enchanted artifacts powered by souls and cooldowns: Death Cap Mushrooms,
                Fireworks Rockets, Boots of Swiftness, Corrupted Beacons, and Iron Hide Amulets.
              </p>

              <button
                onClick={handleRollTrader}
                disabled={stats.emeralds < traderCost}
                className="px-6 py-3 bg-[#0284c7] hover:bg-[#0369a1] border-2 border-[#7dd3fc] rounded-xl text-white font-black text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(2,132,199,0.6)] disabled:opacity-50 active:scale-95 transition-all cursor-pointer"
              >
                <span>🔮 ACQUIRE MYSTERY ARTIFACT</span>
                <span className="bg-black/40 px-2 py-0.5 rounded text-xs font-mono text-[#7dd3fc]">
                  💎 {traderCost}
                </span>
              </button>

              {/* Reveal Card */}
              {rewardReveal && rewardReveal.category === 'artifact' && (
                <div className="w-full bg-[#182333] p-4 rounded-xl border-2 border-[#38bdf8] shadow-[0_0_20px_rgba(56,189,248,0.4)] animate-in zoom-in-95 duration-200 flex items-center gap-4 text-left">
                  <span className="text-4xl p-2 bg-[#121820] rounded-lg border border-[#2b4461]">
                    {rewardReveal.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-[#7dd3fc] truncate">
                        {rewardReveal.name}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-[#fbbf24] bg-[#362a12] px-1.5 py-0.5 rounded border border-[#fbbf24]">
                        ◆ {rewardReveal.power}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 mt-1 line-clamp-2">
                      {rewardReveal.description}
                    </p>
                    <span className="text-[10px] text-emerald-400 font-bold mt-1 block">
                      Added to your inventory! Equip it into Artifact Slots 1, 2, or 3.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CAMPFIRE VIEW */}
          {activeTab === 'campfire' && (
            <div className="flex flex-col items-center text-center max-w-xl mx-auto space-y-3 sm:space-y-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#361a12] border-2 border-[#f97316] rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-[0_0_20px_rgba(249,115,22,0.5)]">
                🔥
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[#fed7aa]">The Warm Campfire Hearth</h2>
              <p className="text-xs text-gray-300">
                Rest by the crackling campfire to fully restore Health Points and replenish your Quiver of arrows.
                Check the Mission Map when you are ready to set out again!
              </p>

              <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                <button
                  onClick={() => {
                    onRestAtCamp();
                    dungeonsAudio.playCampfireRest();
                  }}
                  className="px-6 py-3 bg-[#ea580c] hover:bg-[#c2410c] border-2 border-[#fed7aa] rounded-xl text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
                >
                  <span>🔥 REST & RESTORE HP (FULL HEAL)</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenMissionMap();
                  }}
                  className="px-6 py-3 bg-[#2563eb] hover:bg-[#1d4ed8] border-2 border-[#93c5fd] rounded-xl text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
                >
                  <span>🗺️ OPEN MISSION MAP</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
