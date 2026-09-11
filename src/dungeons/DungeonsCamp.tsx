import React, { useState, useEffect } from 'react';
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
import { X, Sparkles, Hammer, ShoppingBag, Flame, Map as MapIcon, Clock } from 'lucide-react';

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
  const [restCooldown, setRestCooldown] = useState<number>(0);

  // Rest cooldown countdown timer (prevents infinite spam healing)
  useEffect(() => {
    if (restCooldown <= 0) return;
    const timer = setInterval(() => {
      setRestCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [restCooldown]);

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

  const handleCampfireRest = () => {
    if (restCooldown > 0) return;
    if (stats.hp >= stats.maxHp) return;

    onRestAtCamp();
    dungeonsAudio.playCampfireRest();
    setRestCooldown(45); // 45-second cooldown to prevent exploit
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[92vh] mc-panel-dark flex flex-col overflow-hidden text-white border-4 border-black"
        style={{ fontFamily: "'VT323', monospace" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex justify-between items-center px-4 py-3 border-b-2 border-black bg-[#1e1e1e]">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-3xl">🏕️</span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-wider text-[#fde047] uppercase leading-none">
                Camp Outpost
              </h1>
              <span className="text-sm text-[#a3a3a3]">
                Visit merchants, forge mystery armaments, and rest at the hearth
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 mc-slot-dark px-3 py-1 text-[#4ade80] font-bold text-base">
              <span>💎</span>
              <span className="font-mono">{stats.emeralds} EMERALDS</span>
            </div>

            <button
              onClick={onClose}
              className="mc-btn w-8 h-8 flex items-center justify-center text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Minecraft Tabs */}
        <div className="flex gap-2 px-4 pt-3 border-b-2 border-black bg-[#181818] overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('blacksmith');
              setRewardReveal(null);
            }}
            className={`mc-btn px-4 py-1.5 text-lg flex items-center gap-2 cursor-pointer ${
              activeTab === 'blacksmith' ? 'mc-btn-gold text-white font-bold' : 'text-gray-300'
            }`}
          >
            <Hammer className="w-4 h-4 text-amber-300" />
            <span>Blacksmith Forge</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('trader');
              setRewardReveal(null);
            }}
            className={`mc-btn px-4 py-1.5 text-lg flex items-center gap-2 cursor-pointer ${
              activeTab === 'trader' ? 'mc-btn-gold text-white font-bold' : 'text-gray-300'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-sky-300" />
            <span>Mystery Trader</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('campfire');
              setRewardReveal(null);
            }}
            className={`mc-btn px-4 py-1.5 text-lg flex items-center gap-2 cursor-pointer ${
              activeTab === 'campfire' ? 'mc-btn-gold text-white font-bold' : 'text-gray-300'
            }`}
          >
            <Flame className="w-4 h-4 text-orange-400" />
            <span>Campfire Hearth</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-[#141414]">
          {/* BLACKSMITH VIEW */}
          {activeTab === 'blacksmith' && (
            <div className="flex flex-col items-center text-center max-w-lg mx-auto space-y-4">
              <div className="w-20 h-20 mc-slot-dark border-2 border-amber-600 flex items-center justify-center text-4xl shadow-md">
                ⚒️
              </div>
              <h2 className="text-2xl text-[#fef08a] font-bold">The Village Blacksmith</h2>
              <p className="text-base text-gray-300">
                Forge a random weapon or armor piece tailored to your current Power Level (◆ {stats.powerLevel}).
                Higher level armaments grant superior damage and defense bonuses.
              </p>

              <button
                onClick={handleRollBlacksmith}
                disabled={stats.emeralds < blacksmithCost}
                className="mc-btn-gold px-6 py-2.5 text-xl flex items-center gap-3 disabled:opacity-50"
              >
                <span>⚒️ FORGE MYSTERY GEAR</span>
                <span className="bg-black/50 px-2 py-0.5 text-base text-[#fef08a]">
                  💎 {blacksmithCost}
                </span>
              </button>

              {/* Reveal Card */}
              {rewardReveal && rewardReveal.category !== 'artifact' && (
                <div className="w-full mc-panel-dark p-3 border-2 border-[#fbbf24] flex items-center gap-4 text-left animate-in zoom-in-95 duration-200">
                  <span className="text-4xl p-2 mc-slot-dark">
                    {rewardReveal.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-[#fef08a] truncate">
                        {rewardReveal.name}
                      </span>
                      <span className="text-sm font-mono text-[#38bdf8] bg-black px-1.5 py-0.5 border border-[#38bdf8]">
                        ◆ {rewardReveal.power}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mt-1 line-clamp-2">
                      {rewardReveal.description}
                    </p>
                    <span className="text-sm text-emerald-400 font-bold mt-1 block">
                      Added to inventory! Press [I] to equip or enchant.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TRADER VIEW */}
          {activeTab === 'trader' && (
            <div className="flex flex-col items-center text-center max-w-lg mx-auto space-y-4">
              <div className="w-20 h-20 mc-slot-dark border-2 border-sky-500 flex items-center justify-center text-4xl shadow-md">
                🔮
              </div>
              <h2 className="text-2xl text-[#38bdf8] font-bold">The Wandering Mystery Trader</h2>
              <p className="text-base text-gray-300">
                Purchase enchanted artifacts: Death Cap Mushrooms, Fireworks Rockets, Boots of Swiftness,
                Corrupted Beacons, and Iron Hide Amulets.
              </p>

              <button
                onClick={handleRollTrader}
                disabled={stats.emeralds < traderCost}
                className="mc-btn-gold px-6 py-2.5 text-xl flex items-center gap-3 disabled:opacity-50"
              >
                <span>🔮 ACQUIRE MYSTERY ARTIFACT</span>
                <span className="bg-black/50 px-2 py-0.5 text-base text-[#7dd3fc]">
                  💎 {traderCost}
                </span>
              </button>

              {/* Reveal Card */}
              {rewardReveal && rewardReveal.category === 'artifact' && (
                <div className="w-full mc-panel-dark p-3 border-2 border-[#38bdf8] flex items-center gap-4 text-left animate-in zoom-in-95 duration-200">
                  <span className="text-4xl p-2 mc-slot-dark">
                    {rewardReveal.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-[#7dd3fc] truncate">
                        {rewardReveal.name}
                      </span>
                      <span className="text-sm font-mono text-[#fbbf24] bg-black px-1.5 py-0.5 border border-[#fbbf24]">
                        ◆ {rewardReveal.power}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mt-1 line-clamp-2">
                      {rewardReveal.description}
                    </p>
                    <span className="text-sm text-emerald-400 font-bold mt-1 block">
                      Added to inventory! Equip into Artifact Slots 1, 2, or 3.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CAMPFIRE VIEW */}
          {activeTab === 'campfire' && (
            <div className="flex flex-col items-center text-center max-w-lg mx-auto space-y-4">
              <div className="w-20 h-20 mc-slot-dark border-2 border-orange-500 flex items-center justify-center text-4xl shadow-md">
                🔥
              </div>
              <h2 className="text-2xl text-[#fed7aa] font-bold">The Warm Campfire Hearth</h2>
              <p className="text-base text-gray-300">
                Rest by the crackling embers to soothe your battle wounds and restore Health Points.
                Resting requires calm recuperation with a cooldown to recover your vitality.
              </p>

              {/* Health status */}
              <div className="w-full mc-slot-dark p-3 flex justify-between items-center text-lg">
                <span className="text-gray-300">HERO HEALTH:</span>
                <span className={`font-bold ${stats.hp < stats.maxHp ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {stats.hp} / {stats.maxHp} HP {stats.hp >= stats.maxHp ? '(FULL)' : ''}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                <button
                  onClick={handleCampfireRest}
                  disabled={restCooldown > 0 || stats.hp >= stats.maxHp}
                  className={`mc-btn px-6 py-2.5 text-xl flex items-center justify-center gap-2 ${
                    restCooldown > 0 || stats.hp >= stats.maxHp
                      ? 'opacity-50 cursor-not-allowed'
                      : 'mc-btn-green'
                  }`}
                >
                  {restCooldown > 0 ? (
                    <>
                      <Clock className="w-5 h-5 animate-spin" />
                      <span>RESTING EXHAUSTION ({restCooldown}s)</span>
                    </>
                  ) : stats.hp >= stats.maxHp ? (
                    <span>✨ VITALITY ALREADY FULL</span>
                  ) : (
                    <span>🔥 REST AT CAMPFIRE (FULL HEAL)</span>
                  )}
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenMissionMap();
                  }}
                  className="mc-btn px-6 py-2.5 text-xl flex items-center justify-center gap-2 mc-btn-gold"
                >
                  <MapIcon className="w-5 h-5" />
                  <span>MISSION MAP</span>
                </button>
              </div>

              <p className="text-xs text-gray-400">
                ⚠️ Fair Play Mechanic: Resting at camp requires a 45-second recovery rest period between sessions to maintain game balance.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
