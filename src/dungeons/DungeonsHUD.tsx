import React from 'react';
import {
  DungeonsPlayerStats,
  DungeonsMission,
} from './types';
import {
  Sparkles,
  Map as MapIcon,
  Tent,
  Backpack,
  Zap,
  Sword,
  Crosshair,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface DungeonsHUDProps {
  stats: DungeonsPlayerStats;
  currentMission: DungeonsMission;
  onOpenInventory: () => void;
  onOpenMissionMap: () => void;
  onOpenCamp: () => void;
  onMeleeAttack: () => void;
  onRangedAttack: () => void;
  onDodgeRoll: () => void;
  onDrinkPotion: () => void;
  onActivateArtifact: (slotIndex: number) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const DungeonsHUD: React.FC<DungeonsHUDProps> = ({
  stats,
  currentMission,
  onOpenInventory,
  onOpenMissionMap,
  onOpenCamp,
  onMeleeAttack,
  onRangedAttack,
  onDodgeRoll,
  onDrinkPotion,
  onActivateArtifact,
  soundEnabled,
  onToggleSound,
}) => {
  const hpRatio = Math.max(0, Math.min(1, stats.hp / stats.maxHp));
  const isLowHp = hpRatio <= 0.3;
  const xpRatio = Math.max(0, Math.min(1, stats.xp / stats.xpToNextLevel));
  const soulsRatio = Math.max(0, Math.min(1, stats.souls / stats.maxSouls));

  const potionRatio = stats.potionCooldownRemaining > 0
    ? stats.potionCooldownRemaining / stats.potionCooldownMax
    : 0;

  const rollRatio = stats.rollCooldownRemaining > 0
    ? stats.rollCooldownRemaining / stats.rollCooldownMax
    : 0;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-sans">
      {/* Red Low-HP Screen Edge Vignette */}
      {isLowHp && (
        <div className="absolute inset-0 pointer-events-none border-[12px] sm:border-[18px] border-red-600/60 shadow-[inset_0_0_60px_rgba(220,38,38,0.7)] animate-pulse z-20" />
      )}

      {/* --- TOP HEADER BAR --- */}
      <header className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 flex justify-between items-start z-30 pointer-events-none">
        {/* Top-Left: Hero Profile, Power Level Diamond & XP Bar */}
        <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 bg-[#1e1b18]/90 p-2 sm:p-2.5 rounded-lg border-2 border-[#453c35] shadow-[0_4px_16px_rgba(0,0,0,0.8)] backdrop-blur-sm">
          {/* Avatar Icon */}
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-[#2d2722] rounded-md border border-[#6b5e52] flex items-center justify-center flex-shrink-0">
            <span className="text-xl sm:text-2xl">🗡️</span>
            {/* Level Badge */}
            <div className="absolute -bottom-1.5 -right-1.5 bg-[#15803d] text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.2 rounded border border-[#4ade80] shadow">
              {stats.level}
            </div>
          </div>

          {/* Vitals Column */}
          <div className="flex flex-col min-w-[130px] sm:min-w-[170px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-bold text-[#f3ece7] tracking-wider">HERO</span>
              
              {/* Iconic Minecraft Dungeons Power Level Diamond */}
              <div
                className="flex items-center gap-1 bg-[#1a2332] px-2 py-0.5 rounded border border-[#38bdf8] text-[#38bdf8] font-black text-xs sm:text-sm shadow-[0_0_10px_rgba(56,189,248,0.4)]"
                title="Overall Gear Power Level"
              >
                <span>◆</span>
                <span>{stats.powerLevel}</span>
              </div>
            </div>

            {/* XP Bar */}
            <div className="w-full bg-[#110e0c] h-2 sm:h-2.5 rounded-full overflow-hidden border border-[#3a322c] mt-1 relative">
              <div
                className="bg-gradient-to-r from-[#22c55e] to-[#86efac] h-full transition-all duration-300"
                style={{ width: `${xpRatio * 100}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[9px] sm:text-[10px] text-[#a8998a] font-mono mt-0.5">
              <span>XP {Math.round(stats.xp)}/{stats.xpToNextLevel}</span>
              {stats.enchantmentPoints > 0 && (
                <span className="text-[#d8b4fe] font-bold animate-pulse">
                  🟣 {stats.enchantmentPoints} PT{stats.enchantmentPoints > 1 ? 'S' : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Top-Right: Current Mission Tracker & Camp / Map / Inventory Actions */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
          {/* Mission Progress Pill */}
          <div
            onClick={onOpenMissionMap}
            className="hidden xs:flex items-center gap-2 bg-[#1e1b18]/90 px-3 py-1.5 rounded-lg border-2 border-[#453c35] text-white shadow-md cursor-pointer hover:border-[#fbbf24] transition-colors"
            title="Click to view Mission Map"
          >
            <span className="text-base sm:text-lg">{currentMission.icon}</span>
            <div className="flex flex-col text-left">
              <span className="text-[11px] sm:text-xs font-bold text-[#fef08a] leading-tight">
                {currentMission.name}
              </span>
              <span className="text-[9px] sm:text-[10px] text-[#cbd5e1] font-mono">
                Mobs: {Math.min(currentMission.targetKills, stats.mobsKilled)}/{currentMission.targetKills}
              </span>
            </div>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="w-9 h-9 sm:w-10 sm:h-10 bg-[#1e1b18]/90 hover:bg-[#2e2924] border-2 border-[#453c35] rounded-lg text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
            title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>

          {/* Camp Hub Button */}
          <button
            onClick={onOpenCamp}
            className="px-2.5 sm:px-3 h-9 sm:h-10 bg-[#ea580c] hover:bg-[#c2410c] border-2 border-[#fed7aa] rounded-lg text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-[0_0_12px_rgba(234,88,12,0.5)] active:scale-95 transition-all cursor-pointer"
            title="Visit Camp Merchants & Blacksmith (C)"
          >
            <Tent className="w-4 h-4" />
            <span className="hidden sm:inline">CAMP</span>
          </button>

          {/* Mission Map Button */}
          <button
            onClick={onOpenMissionMap}
            className="px-2.5 sm:px-3 h-9 sm:h-10 bg-[#2563eb] hover:bg-[#1d4ed8] border-2 border-[#93c5fd] rounded-lg text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-[0_0_12px_rgba(37,99,235,0.5)] active:scale-95 transition-all cursor-pointer"
            title="Open Mission World Map (M)"
          >
            <MapIcon className="w-4 h-4" />
            <span className="hidden sm:inline">MAP</span>
          </button>

          {/* Inventory Button */}
          <button
            onClick={onOpenInventory}
            className="relative px-3 sm:px-4 h-9 sm:h-10 bg-[#d97706] hover:bg-[#b45309] border-2 border-[#fef08a] rounded-lg text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-[0_0_14px_rgba(217,119,6,0.6)] active:scale-95 transition-all cursor-pointer"
            title="Open Dungeons Inventory & Enchantments (I)"
          >
            <Backpack className="w-4 h-4" />
            <span className="hidden sm:inline">INVENTORY</span>
            <span className="sm:hidden">INV</span>
            {stats.enchantmentPoints > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-ping" />
            )}
          </button>
        </div>
      </header>

      {/* --- ICONIC MINECRAFT DUNGEONS BOTTOM UTILITY BAR --- */}
      <footer className="absolute bottom-2 sm:bottom-4 left-0 right-0 flex justify-center items-end px-2 pointer-events-none z-30">
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-4 bg-[#141210]/95 px-3 sm:px-5 py-2 sm:py-2.5 rounded-2xl border-4 border-[#3d342c] shadow-[0_10px_35px_rgba(0,0,0,0.9)] backdrop-blur-md max-w-full overflow-x-auto">
          
          {/* --- LEFT WING: Emeralds, Arrows & Souls Gauge --- */}
          <div className="flex items-center gap-2 sm:gap-3 pr-2 sm:pr-4 border-r border-[#3a322b]">
            {/* Emeralds Counter */}
            <div
              className="flex items-center gap-1.5 bg-[#0e1f13] px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-[#15803d] text-[#4ade80] font-black text-xs sm:text-sm shadow-inner cursor-pointer"
              title="Emeralds Currency"
              onClick={onOpenCamp}
            >
              <span className="text-base sm:text-lg animate-pulse">💎</span>
              <span className="font-mono tracking-tight">{stats.emeralds}</span>
            </div>

            {/* Arrows Quiver */}
            <div
              className="flex items-center gap-1.5 bg-[#261c14] px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-[#92400e] text-[#fde047] font-black text-xs sm:text-sm shadow-inner"
              title="Quiver Arrows"
            >
              <span className="text-sm sm:text-base">🏹</span>
              <span className="font-mono tracking-tight">{stats.arrows}</span>
            </div>

            {/* Souls Gauge */}
            <div className="flex flex-col gap-0.5 w-14 sm:w-20" title="Collected Souls (Fuels Soul Artifacts)">
              <div className="flex justify-between items-center text-[9px] sm:text-[10px] text-[#c084fc] font-bold font-mono">
                <span>👻 SOULS</span>
                <span>{stats.souls}</span>
              </div>
              <div className="w-full bg-[#1e1329] h-2 sm:h-2.5 rounded-full overflow-hidden border border-[#581c87]">
                <div
                  className="bg-gradient-to-r from-[#9333ea] to-[#c084fc] h-full transition-all duration-200"
                  style={{ width: `${soulsRatio * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* --- CENTERPIECE: The Iconic Giant Red Heart Orb & Potion / Roll Flanks --- */}
          <div className="flex items-center gap-2 sm:gap-3 px-1 sm:px-2">
            {/* Health Potion Flask Button */}
            <div className="relative group">
              <button
                onClick={onDrinkPotion}
                disabled={stats.potionCooldownRemaining > 0}
                className="relative w-11 h-11 sm:w-14 sm:h-14 bg-[#261314] hover:bg-[#3f191b] border-2 border-[#ef4444] rounded-xl flex items-center justify-center text-xl sm:text-2xl shadow-[0_0_12px_rgba(239,68,68,0.4)] disabled:opacity-50 active:scale-95 transition-all cursor-pointer overflow-hidden"
                title="Drink Health Potion [E] / [Q]"
              >
                <span>🧪</span>

                {/* Cooldown Radial / Height Sweep */}
                {potionRatio > 0 && (
                  <div
                    className="absolute inset-0 bg-black/75 flex items-center justify-center text-white font-mono font-bold text-xs"
                    style={{ height: `${potionRatio * 100}%`, top: 0 }}
                  >
                    {Math.ceil(stats.potionCooldownRemaining)}s
                  </div>
                )}
              </button>
              <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-[#1a1816] text-[#cbd5e1] font-mono font-bold text-[9px] px-1 rounded border border-[#4a4037]">
                E
              </span>
            </div>

            {/* The Big Iconic Minecraft Dungeons Red Heart Orb */}
            <div className="relative flex flex-col items-center">
              <div
                className={`relative w-14 h-14 sm:w-18 sm:h-18 rounded-full bg-[#3b0d11] border-4 border-[#7f1d1d] shadow-[0_0_20px_rgba(239,68,68,0.6)] flex items-center justify-center overflow-hidden ${
                  isLowHp ? 'animate-bounce shadow-[0_0_30px_rgba(239,68,68,1)] border-red-500' : ''
                }`}
              >
                {/* Liquid Health Level Fill */}
                <div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#991b1b] via-[#dc2626] to-[#f87171] transition-all duration-300"
                  style={{ height: `${hpRatio * 100}%` }}
                />

                {/* Heart Icon & HP Text */}
                <div className="relative z-10 flex flex-col items-center justify-center text-white text-center leading-none">
                  <span className="text-base sm:text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">❤️</span>
                  <span className="font-mono font-black text-[10px] sm:text-xs tracking-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                    {Math.round(stats.hp)}
                  </span>
                </div>
              </div>
              <span className="text-[9px] font-mono text-[#fca5a5] font-bold mt-0.5">
                MAX {stats.maxHp}
              </span>
            </div>

            {/* Dodge Roll Slot */}
            <div className="relative group">
              <button
                onClick={onDodgeRoll}
                disabled={stats.rollCooldownRemaining > 0}
                className="relative w-11 h-11 sm:w-14 sm:h-14 bg-[#1e2319] hover:bg-[#2a3421] border-2 border-[#84cc16] rounded-xl flex items-center justify-center text-xl sm:text-2xl shadow-[0_0_12px_rgba(132,204,22,0.4)] disabled:opacity-50 active:scale-95 transition-all cursor-pointer overflow-hidden"
                title="Dodge Roll Evade [Space] / [Shift]"
              >
                <span>💨</span>

                {/* Roll Cooldown Sweep */}
                {rollRatio > 0 && (
                  <div
                    className="absolute inset-0 bg-black/70 flex items-center justify-center text-white font-mono font-bold text-[10px]"
                    style={{ height: `${rollRatio * 100}%`, top: 0 }}
                  >
                    {stats.rollCooldownRemaining.toFixed(1)}s
                  </div>
                )}
              </button>
              <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-[#1a1816] text-[#cbd5e1] font-mono font-bold text-[9px] px-1 rounded border border-[#4a4037]">
                SPACE
              </span>
            </div>
          </div>

          {/* --- RIGHT WING: 3 Dedicated Artifact Slots (1, 2, 3) --- */}
          <div className="flex items-center gap-2 sm:gap-2.5 pl-2 sm:pl-4 border-l border-[#3a322b]">
            {[0, 1, 2].map((slotIdx) => {
              const artifact = stats.equippedArtifacts[slotIdx];
              const cooldown = stats.artifactCooldowns[slotIdx];
              const isOnCooldown = cooldown > 0;
              const hasEnoughSouls = artifact?.soulCost ? stats.souls >= artifact.soulCost : true;

              return (
                <div key={slotIdx} className="relative group">
                  <button
                    onClick={() => onActivateArtifact(slotIdx)}
                    disabled={!artifact || isOnCooldown || !hasEnoughSouls}
                    className={`relative w-11 h-11 sm:w-13 sm:h-13 bg-[#1e1b18] hover:bg-[#2e2a26] border-2 rounded-xl flex items-center justify-center text-xl sm:text-2xl shadow-md transition-all active:scale-95 overflow-hidden ${
                      artifact
                        ? artifact.rarity === 'unique'
                          ? 'border-[#fbbf24] shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                          : 'border-[#38bdf8] shadow-[0_0_8px_rgba(56,189,248,0.3)]'
                        : 'border-[#3a322c] opacity-40'
                    }`}
                    title={
                      artifact
                        ? `${artifact.name} (Key [${slotIdx + 1}]) - ${artifact.description}`
                        : 'Empty Artifact Slot'
                    }
                  >
                    {artifact ? (
                      <span>{artifact.icon}</span>
                    ) : (
                      <span className="text-gray-600 text-sm">✦</span>
                    )}

                    {/* Cooldown Overlay */}
                    {isOnCooldown && (
                      <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-white font-mono font-bold text-xs">
                        {Math.ceil(cooldown)}s
                      </div>
                    )}

                    {/* Soul cost badge if required */}
                    {artifact?.soulCost && (
                      <span className="absolute top-0.5 right-0.5 text-[8px] font-mono font-black text-purple-300 bg-purple-950/80 px-1 rounded">
                        👻{artifact.soulCost}
                      </span>
                    )}
                  </button>

                  {/* Keybind hint */}
                  <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-[#1a1816] text-[#cbd5e1] font-mono font-bold text-[9px] px-1 rounded border border-[#4a4037]">
                    {slotIdx + 1}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Primary Action Attack / Bow Triggers for Touch / Fast Action */}
          <div className="flex items-center gap-1.5 pl-2 sm:pl-3 border-l border-[#3a322b]">
            <button
              onClick={onMeleeAttack}
              className="px-3 sm:px-4 py-2 bg-[#dc2626] hover:bg-[#b91c1c] border-2 border-[#fca5a5] rounded-xl text-white font-black text-xs sm:text-sm flex items-center gap-1 shadow-[0_0_15px_rgba(220,38,38,0.6)] active:scale-95 transition-all cursor-pointer"
              title="Melee Attack Strike [Left Click / Space]"
            >
              <Sword className="w-4 h-4" />
              <span className="hidden xs:inline">MELEE</span>
            </button>

            <button
              onClick={onRangedAttack}
              disabled={stats.arrows <= 0}
              className="px-3 sm:px-4 py-2 bg-[#d97706] hover:bg-[#b45309] border-2 border-[#fef08a] rounded-xl text-white font-black text-xs sm:text-sm flex items-center gap-1 shadow-[0_0_15px_rgba(217,119,6,0.6)] active:scale-95 transition-all cursor-pointer disabled:opacity-40"
              title="Fire Bow / Crossbow [Right Click / F]"
            >
              <Crosshair className="w-4 h-4" />
              <span className="hidden xs:inline">BOW</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
