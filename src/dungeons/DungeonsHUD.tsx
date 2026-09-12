import React, { useState, useEffect } from 'react';
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
  Settings,
  Pickaxe,
  Shield,
  Hammer,
  Coins,
  Menu,
} from 'lucide-react';
import { VirtualJoystick } from './VirtualJoystick';
import { dungeonsAudio } from './dungeonsAudio';

interface DungeonsHUDProps {
  stats: DungeonsPlayerStats;
  currentMission: DungeonsMission;
  onOpenInventory: () => void;
  onOpenMissionMap: () => void;
  onOpenCamp: () => void;
  onOpenCharacterSheet?: () => void;
  onOpenBuildDrawer?: () => void;
  onOpenVillageTrade?: () => void;
  isNearVillager?: boolean;
  onOpenSettings?: () => void;
  onOpenPauseMenu?: () => void;
  onMeleeAttack: () => void;
  onRangedAttack: () => void;
  onDodgeRoll: () => void;
  onDrinkPotion: () => void;
  onActivateArtifact: (slotIndex: number) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onMoveJoystick?: (x: number, y: number) => void;
  onInteract?: () => void;
  interactLabel?: string;
  canInteract?: boolean;
}

export const DungeonsHUD: React.FC<DungeonsHUDProps> = ({
  stats,
  currentMission,
  onOpenInventory,
  onOpenMissionMap,
  onOpenCamp,
  onOpenCharacterSheet,
  onOpenBuildDrawer,
  onOpenVillageTrade,
  isNearVillager = false,
  onOpenSettings,
  onOpenPauseMenu,
  onMeleeAttack,
  onRangedAttack,
  onDodgeRoll,
  onDrinkPotion,
  onActivateArtifact,
  soundEnabled,
  onToggleSound,
  onMoveJoystick,
  onInteract,
  interactLabel = 'ACT',
  canInteract = false,
}) => {
  // Screen dimensions listener for responsive layouts
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  const [windowHeight, setWindowHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 768
  );
  const [forceTouchControls, setForceTouchControls] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  });

  const handleBtn = (cb?: () => void) => {
    dungeonsAudio.playButtonClick();
    if (cb) cb();
  };

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isLandscapeShort = windowHeight < 480;
  const isTouchDevice = typeof window !== 'undefined' && 
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  const isFinePointer = typeof window !== 'undefined' && 
    typeof window.matchMedia === 'function' && 
    window.matchMedia('(pointer: fine)').matches;
  
  // Compact touch layout for mobile devices, or when window width is constrained
  const isCompact = windowWidth < 900 || (isTouchDevice && !isFinePointer);
  const isPortrait = windowHeight >= windowWidth || windowWidth < 680;
  const isNarrowMobile = windowWidth < 500 && !isLandscapeShort;
  const isUltraNarrow = windowWidth < 400;

  const [isQuickNavOpen, setIsQuickNavOpen] = useState<boolean>(false);

  const hpRatio = Math.max(0, Math.min(1, stats.hp / stats.maxHp));
  const isLowHp = hpRatio <= 0.3;
  const xpRatio = Math.max(0, Math.min(1, stats.xp / stats.xpToNextLevel));
  const soulsRatio = Math.max(0, Math.min(1, stats.souls / stats.maxSouls));

  const potionRatio =
    stats.potionCooldownRemaining > 0
      ? stats.potionCooldownRemaining / stats.potionCooldownMax
      : 0;

  const rollRatio =
    stats.rollCooldownRemaining > 0
      ? stats.rollCooldownRemaining / stats.rollCooldownMax
      : 0;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-sans">
      {/* Red Low-HP Screen Edge Vignette Flash */}
      {isLowHp && (
        <div className="absolute inset-0 pointer-events-none border-[10px] sm:border-[16px] border-red-600/60 shadow-[inset_0_0_50px_rgba(220,38,38,0.7)] animate-pulse z-20" />
      )}

      {/* ========================================================= */}
      {/* 1. TOP HEADER BAR: HERO VITALS & ORGANIZED NAVIGATION     */}
      {/* ========================================================= */}
      <header className="absolute top-1.5 sm:top-3 left-1.5 sm:left-4 right-1.5 sm:right-4 pt-[max(0.25rem,env(safe-area-inset-top))] flex flex-col gap-1.5 z-30 pointer-events-none">
        <div className="w-full flex justify-between items-center z-30 pointer-events-none gap-1 sm:gap-2">
          {/* Left: Hero Profile & Power Level Diamond */}
          {isPortrait ? (
            /* Minimized Hero Pill for Portrait Mode */
            <div
              id="hud-portrait-hero-pill"
              onClick={() => handleBtn(onOpenCharacterSheet)}
              className="pointer-events-auto flex items-center gap-1 mc-panel-dark px-1.5 py-1 border border-[#5a483a] hover:border-amber-400 shadow-md cursor-pointer transition-colors flex-shrink-0"
              title="Hero Sheet & Stats [C]"
            >
              <div className="relative w-6 h-6 mc-slot-dark flex items-center justify-center flex-shrink-0 text-xs">
                <span>🗡️</span>
                <div className="absolute -bottom-1 -right-1 bg-[#15803d] text-white text-[7px] font-black px-0.5 border border-[#4ade80] shadow leading-none">
                  {stats.level}
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-0.5 bg-[#142338] px-1 py-0.2 border border-[#38bdf8] text-[#38bdf8] font-black text-[8px] leading-none shadow-[0_0_6px_rgba(56,189,248,0.4)]">
                  <span>◆</span>
                  <span>{stats.powerLevel}</span>
                </div>
                <div className="w-6 bg-[#110e0c] h-1 overflow-hidden border border-[#3a322c]">
                  <div
                    className="bg-gradient-to-r from-[#22c55e] to-[#86efac] h-full"
                    style={{ width: `${xpRatio * 100}%` }}
                  />
                </div>
              </div>
              {stats.enchantmentPoints > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping flex-shrink-0" title={`${stats.enchantmentPoints} Enchantment Points`} />
              )}
            </div>
          ) : (
            /* Expanded Hero Card for Landscape & Wide Desktop */
            <div
              onClick={() => handleBtn(onOpenCharacterSheet)}
              className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 mc-panel-dark px-1.5 sm:px-2.5 py-1 sm:py-1.5 border-2 border-[#5a483a] hover:border-amber-400 shadow-md cursor-pointer transition-colors flex-shrink-0 max-w-[42%] sm:max-w-none"
              title="Open Hero Stats & Customization (C)"
            >
              {/* Avatar Icon */}
              <div className="relative w-7 h-7 sm:w-10 sm:h-10 mc-slot-dark flex items-center justify-center flex-shrink-0 text-sm sm:text-xl">
                <span>🗡️</span>
                {/* Level Badge */}
                <div className="absolute -bottom-1 -right-1 bg-[#15803d] text-white text-[7px] sm:text-[10px] font-black px-0.5 sm:px-1 border border-[#4ade80] shadow leading-none">
                  {stats.level}
                </div>
              </div>

              {/* Vitals Column */}
              <div className="flex flex-col min-w-[60px] sm:min-w-[125px]">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[9px] sm:text-xs font-black text-[#f3ece7] tracking-wider flex items-center gap-0.5 truncate">
                    HERO <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 flex-shrink-0" />
                  </span>

                  {/* Power Level Diamond */}
                  <div
                    className="flex items-center gap-0.5 bg-[#142338] px-1 py-0.2 sm:px-1.5 sm:py-0.5 border border-[#38bdf8] text-[#38bdf8] font-black text-[8px] sm:text-xs shadow-[0_0_8px_rgba(56,189,248,0.4)] leading-none flex-shrink-0"
                    title="Overall Gear Power Level"
                  >
                    <span>◆</span>
                    <span>{stats.powerLevel}</span>
                  </div>
                </div>

                {/* XP Bar */}
                <div className="w-full bg-[#110e0c] h-1.5 sm:h-2 overflow-hidden border border-[#3a322c] mt-0.5 relative">
                  <div
                    className="bg-gradient-to-r from-[#22c55e] to-[#86efac] h-full transition-all duration-300"
                    style={{ width: `${xpRatio * 100}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[7px] sm:text-[9px] text-[#a8998a] font-mono mt-0.5 leading-none">
                  <span className="truncate">XP {Math.round(stats.xp)}/{stats.xpToNextLevel}</span>
                  {stats.enchantmentPoints > 0 && (
                    <span className="text-[#d8b4fe] font-bold animate-pulse ml-1">
                      🟣{stats.enchantmentPoints}pt
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Center: Minimized Vitals for Portrait Mode */}
          {isPortrait ? (
            <div
              id="hud-portrait-vitals-pill"
              className="pointer-events-auto flex items-center gap-1 mc-panel-dark px-1.5 py-1 border border-[#5a483a] shadow-md flex-shrink-0"
            >
              {/* The Iconic Minecraft Dungeons Red Heart Orb */}
              <div
                className={`relative w-6 h-6 rounded-full bg-[#3b0d11] border border-[#7f1d1d] shadow-[0_0_6px_rgba(239,68,68,0.5)] flex items-center justify-center overflow-hidden flex-shrink-0 ${
                  isLowHp ? 'animate-bounce shadow-[0_0_12px_rgba(239,68,68,1)] border-red-500' : ''
                }`}
              >
                <div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#991b1b] via-[#dc2626] to-[#f87171] transition-all duration-300"
                  style={{ height: `${hpRatio * 100}%` }}
                />
                <span className="relative z-10 text-[9px] drop-shadow">❤️</span>
              </div>

              <div className="flex flex-col leading-none">
                <span className="font-mono font-black text-[10px] text-red-300 tracking-tight">
                  {Math.round(stats.hp)}
                </span>
                {stats.souls > 0 && (
                  <span className="text-[7px] text-purple-300 font-mono">
                    👻{stats.souls}
                  </span>
                )}
              </div>

              {/* Quick Potion Flask Button */}
              <button
                onClick={onDrinkPotion}
                disabled={stats.potionCooldownRemaining > 0}
                className="relative w-6 h-6 bg-[#261314] hover:bg-[#3f191b] border border-[#ef4444] rounded flex items-center justify-center text-[10px] shadow-[0_0_6px_rgba(239,68,68,0.4)] disabled:opacity-40 active:scale-95 transition-all cursor-pointer overflow-hidden flex-shrink-0 ml-0.5"
                title="Drink Health Potion"
              >
                <span>🧪</span>
                {potionRatio > 0 && (
                  <div
                    className="absolute inset-0 bg-black/85 flex items-center justify-center text-white font-mono font-bold text-[7px]"
                    style={{ height: `${potionRatio * 100}%`, top: 0 }}
                  >
                    {Math.ceil(stats.potionCooldownRemaining)}s
                  </div>
                )}
              </button>
            </div>
          ) : isCompact ? (
            /* Tablet Landscape Compact Vitals Badge */
            <div className="pointer-events-auto flex items-center gap-1.5 mc-panel-dark px-2 py-1 border-2 border-[#5a483a] shadow-lg flex-shrink-0">
              <div
                className={`relative w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#3b0d11] border-2 border-[#7f1d1d] shadow-[0_0_10px_rgba(239,68,68,0.6)] flex items-center justify-center overflow-hidden flex-shrink-0 ${
                  isLowHp ? 'animate-bounce shadow-[0_0_20px_rgba(239,68,68,1)] border-red-500' : ''
                }`}
              >
                <div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#991b1b] via-[#dc2626] to-[#f87171] transition-all duration-300"
                  style={{ height: `${hpRatio * 100}%` }}
                />
                <span className="relative z-10 text-[10px] sm:text-xs drop-shadow">❤️</span>
              </div>

              <div className="flex flex-col leading-none">
                <span className="font-mono font-black text-[11px] sm:text-xs text-red-300 tracking-tight">
                  {Math.round(stats.hp)}<span className="text-[8px] text-gray-400 font-normal">/{stats.maxHp}</span>
                </span>
                <span className="text-[7px] text-purple-300 font-mono mt-0.5">
                  👻 {stats.souls}
                </span>
              </div>

              {/* Quick Potion Flask Button */}
              <button
                onClick={onDrinkPotion}
                disabled={stats.potionCooldownRemaining > 0}
                className="relative w-6 h-6 sm:w-7 sm:h-7 bg-[#261314] hover:bg-[#3f191b] border border-[#ef4444] rounded-lg flex items-center justify-center text-xs shadow-[0_0_6px_rgba(239,68,68,0.4)] disabled:opacity-40 active:scale-95 transition-all cursor-pointer overflow-hidden flex-shrink-0 ml-0.5"
                title="Drink Health Potion"
              >
                <span>🧪</span>
                {potionRatio > 0 && (
                  <div
                    className="absolute inset-0 bg-black/85 flex items-center justify-center text-white font-mono font-bold text-[7px]"
                    style={{ height: `${potionRatio * 100}%`, top: 0 }}
                  >
                    {Math.ceil(stats.potionCooldownRemaining)}s
                  </div>
                )}
              </button>
            </div>
          ) : null}

          {/* Right: Currency & Minimized Navigation Dock */}
          <div className="pointer-events-auto flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Combined Currency Slot */}
            <div
              onClick={() => handleBtn(onOpenVillageTrade || onOpenCamp)}
              className="flex items-center gap-1 sm:gap-1.5 mc-panel-dark px-1.5 sm:px-2 py-1 border border-[#5a483a] text-[10px] sm:text-xs shadow-md cursor-pointer hover:border-emerald-500 transition-colors flex-shrink-0"
              title="Emeralds & Arrows - Click to visit Camp or Trade"
            >
              <div className="flex items-center gap-0.5 text-emerald-400 font-bold">
                <span className="text-[10px] sm:text-xs">💎</span>
                <span className="font-mono">{stats.emeralds}</span>
              </div>
              <span className="text-gray-600 text-[9px]">|</span>
              <div className="flex items-center gap-0.5 text-amber-300 font-bold">
                <span className="text-[10px] sm:text-xs">🏹</span>
                <span className="font-mono">{stats.arrows}</span>
              </div>
            </div>

            {/* Navigation Action Dock */}
            {isPortrait ? (
              /* Minimized Navigation Pill for Portrait: Direct Inventory + Quick Menu Toggle */
              <div className="flex items-center gap-1 mc-panel-dark p-0.5 border border-[#5a483a] shadow-md flex-shrink-0">
                {/* Inventory Button */}
                <button
                  id="hud-inventory-btn"
                  onClick={() => handleBtn(onOpenInventory)}
                  className="relative mc-btn w-7 h-7 flex items-center justify-center cursor-pointer"
                  title="Hero Inventory [I]"
                >
                  <Backpack className="w-3.5 h-3.5 text-amber-300" />
                  {stats.enchantmentPoints > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-ping" />
                  )}
                </button>

                {/* Quick Nav Strip Toggle */}
                <button
                  id="hud-quick-nav-toggle"
                  onClick={() => {
                    dungeonsAudio.playButtonClick();
                    setIsQuickNavOpen((prev) => !prev);
                  }}
                  className={`mc-btn w-7 h-7 flex items-center justify-center cursor-pointer transition-colors ${
                    isQuickNavOpen ? 'bg-amber-400 text-black border-amber-300' : ''
                  }`}
                  title={isQuickNavOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
                >
                  <Menu className={`w-3.5 h-3.5 ${isQuickNavOpen ? 'text-black font-bold' : 'text-yellow-400'}`} />
                </button>
              </div>
            ) : (
              /* Full Dock for Landscape & Desktop */
              <div className="flex items-center gap-0.5 sm:gap-1 mc-panel-dark p-0.5 sm:p-1 border-2 border-[#5a483a] shadow-md">
                {/* Inventory Button - Always visible */}
                <button
                  id="hud-inventory-btn"
                  onClick={() => handleBtn(onOpenInventory)}
                  className="relative mc-btn px-1.5 sm:px-2.5 py-1 text-xs sm:text-sm font-bold flex items-center gap-1 cursor-pointer"
                  title="Hero Inventory [I]"
                >
                  <Backpack className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden sm:inline">INV</span>
                  {stats.enchantmentPoints > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-purple-500 rounded-full animate-ping" />
                  )}
                </button>

                {/* Mission Map Button - visible when width >= 460 */}
                <button
                  id="hud-map-btn"
                  onClick={() => handleBtn(onOpenMissionMap)}
                  className={`mc-btn px-1.5 sm:px-2.5 py-1 text-xs sm:text-sm font-bold items-center gap-1 cursor-pointer ${
                    windowWidth < 460 ? 'hidden' : 'flex'
                  }`}
                  title="Mission Map [M]"
                >
                  <MapIcon className="w-3.5 h-3.5 text-sky-300" />
                  <span className="hidden md:inline">MAP</span>
                </button>

                {/* Camp Hub Button - visible when width >= 540 */}
                <button
                  id="hud-camp-btn"
                  onClick={() => handleBtn(onOpenCamp)}
                  className={`mc-btn px-1.5 sm:px-2.5 py-1 text-xs sm:text-sm font-bold items-center gap-1 cursor-pointer ${
                    windowWidth < 540 ? 'hidden' : 'flex'
                  }`}
                  title="Camp & Blacksmith Forge [C]"
                >
                  <Tent className="w-3.5 h-3.5 text-orange-300" />
                  <span className="hidden md:inline">CAMP</span>
                </button>

                {/* Build & Craft Drawer Button - visible when width >= 620 */}
                {onOpenBuildDrawer && (
                  <button
                    id="hud-build-btn"
                    onClick={() => handleBtn(onOpenBuildDrawer)}
                    className={`mc-btn px-1.5 sm:px-2.5 py-1 text-xs sm:text-sm font-bold items-center gap-1 cursor-pointer ${
                      windowWidth < 620 ? 'hidden' : 'flex'
                    }`}
                    title="Build Structures & Craft [B]"
                  >
                    <Hammer className="w-3.5 h-3.5 text-teal-300" />
                    <span className="hidden md:inline">BUILD</span>
                  </button>
                )}

                {/* Sound Toggle Icon Button - visible when width >= 400 */}
                <button
                  onClick={() => handleBtn(onToggleSound)}
                  className={`mc-btn px-1 sm:px-1.5 py-1 text-xs sm:text-sm items-center justify-center text-gray-300 cursor-pointer ${
                    windowWidth < 400 ? 'hidden' : 'flex'
                  }`}
                  title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
                >
                  {soundEnabled ? (
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  )}
                </button>

                {/* In-Game Menu Button (Pause / Options / Save & Quit) - Always visible */}
                <button
                  id="hud-menu-btn"
                  onClick={() => handleBtn(onOpenPauseMenu || onOpenSettings)}
                  className="mc-btn px-1.5 sm:px-2.5 py-1 text-xs sm:text-sm font-bold flex items-center gap-1 text-yellow-300 cursor-pointer"
                  title="Game Menu & Pause [ESC]"
                >
                  <Menu className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="hidden lg:inline">MENU</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* PORTRAIT QUICK NAVIGATION DROPDOWN STRIP */}
        {isPortrait && isQuickNavOpen && (
          <div
            id="portrait-quick-nav-strip"
            className="pointer-events-auto flex items-center justify-between gap-1 mc-panel-dark px-1.5 py-1 border-2 border-[#ffd700] shadow-[0_8px_25px_rgba(0,0,0,0.9)] w-full max-w-sm mx-auto animate-in fade-in slide-in-from-top-1 z-35"
          >
            {/* Map */}
            <button
              onClick={() => {
                setIsQuickNavOpen(false);
                handleBtn(onOpenMissionMap);
              }}
              className="mc-btn px-1.5 py-1 text-[10px] font-bold flex items-center justify-center gap-1 text-sky-300 flex-1 cursor-pointer"
              title="Mission Map"
            >
              <MapIcon className="w-3 h-3 text-sky-300" />
              <span>MAP</span>
            </button>

            {/* Camp */}
            <button
              onClick={() => {
                setIsQuickNavOpen(false);
                handleBtn(onOpenCamp);
              }}
              className="mc-btn px-1.5 py-1 text-[10px] font-bold flex items-center justify-center gap-1 text-orange-300 flex-1 cursor-pointer"
              title="Camp & Forge"
            >
              <Tent className="w-3 h-3 text-orange-300" />
              <span>CAMP</span>
            </button>

            {/* Build */}
            {onOpenBuildDrawer && (
              <button
                onClick={() => {
                  setIsQuickNavOpen(false);
                  handleBtn(onOpenBuildDrawer);
                }}
                className="mc-btn px-1.5 py-1 text-[10px] font-bold flex items-center justify-center gap-1 text-teal-300 flex-1 cursor-pointer"
                title="Build & Craft"
              >
                <Hammer className="w-3 h-3 text-teal-300" />
                <span>BUILD</span>
              </button>
            )}

            {/* Sound Toggle */}
            <button
              onClick={() => handleBtn(onToggleSound)}
              className="mc-btn px-1.5 py-1 text-[10px] font-bold flex items-center justify-center gap-1 text-gray-200 flex-1 cursor-pointer"
              title={soundEnabled ? 'Mute SFX' : 'Unmute SFX'}
            >
              {soundEnabled ? (
                <Volume2 className="w-3 h-3 text-emerald-400" />
              ) : (
                <VolumeX className="w-3 h-3 text-rose-400" />
              )}
              <span>{soundEnabled ? 'SFX' : 'MUTE'}</span>
            </button>

            {/* Game Menu */}
            <button
              onClick={() => {
                setIsQuickNavOpen(false);
                handleBtn(onOpenPauseMenu || onOpenSettings);
              }}
              className="mc-btn-gold px-1.5 py-1 text-[10px] font-bold flex items-center justify-center gap-1 text-black flex-1 cursor-pointer"
              title="Game Menu"
            >
              <Settings className="w-3 h-3 text-black" />
              <span>MENU</span>
            </button>
          </div>
        )}
      </header>

      {/* Contextual Village Merchant Prompt (Appears Prominently Without Shifting Top Nav) */}
      {isNearVillager && onOpenVillageTrade && (
        <div className="absolute top-14 sm:top-20 right-2 sm:right-4 pointer-events-auto z-40 animate-bounce">
          <button
            onClick={() => handleBtn(onOpenVillageTrade)}
            className="mc-btn-green px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-base font-bold flex items-center gap-1.5 shadow-[0_0_20px_rgba(34,197,94,0.8)] border-2 border-emerald-300 rounded cursor-pointer"
            title="Trade with Merchant (E)"
          >
            <Coins className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-yellow-300" />
            <span>{isPortrait ? 'TRADE [E]' : 'TRADE WITH MERCHANT [E]'}</span>
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. BOTTOM CONTROLS: MOBILE / TOUCH ERGONOMIC DUAL-THUMB   */}
      {/* ========================================================= */}
      {isCompact ? (
        <>
          {/* --- BOTTOM-LEFT: Virtual Movement Joystick --- */}
          {onMoveJoystick && (
            <div className={`fixed ${
              isLandscapeShort
                ? 'bottom-2 left-2 pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]'
                : 'bottom-3 left-2.5 sm:bottom-5 sm:left-5 pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]'
            } z-40`}>
              <VirtualJoystick
                onMove={onMoveJoystick}
                size={isLandscapeShort ? 74 : isNarrowMobile ? 80 : 92}
              />
            </div>
          )}

          {/* --- BOTTOM-RIGHT: Action Pad Cluster (Combat, Artifacts & Dodge Roll) --- */}
          <div
            className={`fixed ${
              isLandscapeShort
                ? 'bottom-2 right-2 pb-[env(safe-area-inset-bottom)] pr-[env(safe-area-inset-right)]'
                : 'bottom-3 right-2 sm:bottom-4 sm:right-4 pb-[env(safe-area-inset-bottom)] pr-[env(safe-area-inset-right)]'
            } z-40 pointer-events-auto flex flex-col items-end gap-1.5 sm:gap-2`}
          >
            {/* Row of 3 Equipped Artifacts */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {[0, 1, 2].map((slotIdx) => {
                const artifact = stats.equippedArtifacts[slotIdx];
                const cooldown = stats.artifactCooldowns[slotIdx];
                const isOnCooldown = cooldown > 0;
                const hasEnoughSouls = artifact?.soulCost
                  ? stats.souls >= artifact.soulCost
                  : true;

                return (
                  <button
                    key={slotIdx}
                    onClick={() => onActivateArtifact(slotIdx)}
                    disabled={!artifact || isOnCooldown || !hasEnoughSouls}
                    className={`relative w-8 h-8 sm:w-9 sm:h-9 bg-[#1e1b18]/95 border-2 rounded-xl flex items-center justify-center text-sm sm:text-base shadow-md active:scale-95 transition-all overflow-hidden cursor-pointer ${
                      artifact
                        ? artifact.rarity === 'unique'
                          ? 'border-[#fbbf24] shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                          : 'border-[#38bdf8] shadow-[0_0_6px_rgba(56,189,248,0.3)]'
                        : 'border-[#3a322c]/60 opacity-40'
                    }`}
                    title={artifact ? artifact.name : 'Empty Artifact'}
                  >
                    {artifact ? <span>{artifact.icon}</span> : <span className="text-gray-600 text-xs">✦</span>}
                    {isOnCooldown && (
                      <div className="absolute inset-0 bg-black/85 flex items-center justify-center text-white font-mono font-bold text-[9px]">
                        {Math.ceil(cooldown)}s
                      </div>
                    )}
                    {artifact?.soulCost && (
                      <span className="absolute top-0.5 right-0.5 text-[6px] font-mono font-black text-purple-300 bg-purple-950/80 px-0.5 rounded">
                        👻{artifact.soulCost}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Combat Action Buttons Grid / Row */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {/* Dodge Roll Quick Button */}
              <button
                onClick={onDodgeRoll}
                disabled={stats.rollCooldownRemaining > 0}
                className="relative w-9 h-9 sm:w-11 sm:h-11 bg-[#1e2319] hover:bg-[#2a3421] border-2 border-[#84cc16] rounded-xl flex items-center justify-center text-base sm:text-lg shadow-[0_0_10px_rgba(132,204,22,0.4)] disabled:opacity-40 active:scale-95 transition-all cursor-pointer overflow-hidden"
                title="Dodge Roll Evade"
              >
                <span>💨</span>
                {rollRatio > 0 && (
                  <div
                    className="absolute inset-0 bg-black/80 flex items-center justify-center text-white font-mono font-bold text-[9px]"
                    style={{ height: `${rollRatio * 100}%`, top: 0 }}
                  >
                    {stats.rollCooldownRemaining.toFixed(1)}s
                  </div>
                )}
              </button>

              {/* Optional Contextual Action Button (Spire, Chest, Dig) */}
              {onInteract && (
                <button
                  onClick={onInteract}
                  className={`px-2 sm:px-2.5 h-9 sm:h-11 rounded-xl font-bold text-xs flex items-center gap-1 border-2 transition-all active:scale-95 cursor-pointer shadow-lg ${
                    canInteract
                      ? 'bg-[#15803d] hover:bg-[#16a34a] border-[#86efac] text-white shadow-[0_0_15px_rgba(34,197,94,0.6)] animate-pulse'
                      : 'bg-[#2a241f] border-[#4a3e32] text-[#d4c5b9]'
                  }`}
                  title={interactLabel}
                >
                  <Pickaxe className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                  <span className="text-[9px] sm:text-xs font-mono font-black">{interactLabel}</span>
                </button>
              )}

              {/* Ranged Bow Attack Button */}
              <button
                onClick={onRangedAttack}
                disabled={stats.arrows <= 0}
                className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#d97706] to-[#b45309] hover:from-[#b45309] hover:to-[#92400e] border-2 border-[#fef08a] rounded-xl sm:rounded-2xl flex flex-col items-center justify-center text-white shadow-[0_0_12px_rgba(217,119,6,0.6)] active:scale-95 transition-all cursor-pointer disabled:opacity-40"
                title="Shoot Bow / Crossbow"
              >
                <Crosshair className="w-4 sm:w-4.5 h-4 sm:h-4.5 drop-shadow" />
                <span className="text-[7px] sm:text-[8px] font-black font-mono tracking-tight text-[#fef08a]">
                  🏹 {stats.arrows}
                </span>
              </button>

              {/* Primary Melee Attack Button (Big, Ergonomic Strike Target) */}
              <button
                onClick={onMeleeAttack}
                className="w-12 h-12 sm:w-15 sm:h-15 bg-gradient-to-br from-[#dc2626] to-[#991b1b] hover:from-[#ef4444] hover:to-[#b91c1c] border-2 sm:border-3 border-[#fca5a5] rounded-xl sm:rounded-2xl flex flex-col items-center justify-center text-white shadow-[0_0_20px_rgba(220,38,38,0.7)] active:scale-95 transition-all cursor-pointer"
                title="Primary Melee Strike"
              >
                <Sword className="w-5 sm:w-6 h-5 sm:h-6 drop-shadow" />
                <span className="text-[7px] sm:text-[8px] font-black font-mono uppercase tracking-wider text-white">
                  STRIKE
                </span>
              </button>
            </div>
          </div>
        </>
      ) : (
        /* ========================================================= */
        /* 3. BOTTOM CONTROLS: DESKTOP SIGNATURE UNIFIED BAR         */
        /* ========================================================= */
        <footer className="absolute bottom-2 sm:bottom-4 left-0 right-0 flex justify-center items-end px-2 pointer-events-none z-30">
          <div className="pointer-events-auto flex items-center gap-2 sm:gap-4 bg-[#141210]/95 px-3 sm:px-5 py-2 sm:py-2.5 rounded-2xl border-4 border-[#3d342c] shadow-[0_10px_35px_rgba(0,0,0,0.9)] backdrop-blur-md max-w-full">
            
            {/* --- LEFT WING: Emeralds, Arrows & Souls Gauge --- */}
            <div className="flex items-center gap-2.5 sm:gap-3 pr-2.5 sm:pr-4 border-r border-[#3a322b]">
              {/* Emeralds Counter */}
              <div
                className="flex items-center gap-1.5 bg-[#0e1f13] px-2.5 py-1 rounded-lg border border-[#15803d] text-[#4ade80] font-black text-xs sm:text-sm shadow-inner cursor-pointer"
                title="Emeralds Currency"
                onClick={onOpenCamp}
              >
                <span className="text-base animate-pulse">💎</span>
                <span className="font-mono tracking-tight">{stats.emeralds}</span>
              </div>

              {/* Arrows Quiver */}
              <div
                className="flex items-center gap-1.5 bg-[#261c14] px-2.5 py-1 rounded-lg border border-[#92400e] text-[#fde047] font-black text-xs sm:text-sm shadow-inner"
                title="Quiver Arrows"
              >
                <span className="text-sm sm:text-base">🏹</span>
                <span className="font-mono tracking-tight">{stats.arrows}</span>
              </div>

              {/* Souls Gauge */}
              <div className="flex flex-col gap-0.5 w-16 sm:w-20" title="Collected Souls (Fuels Soul Artifacts)">
                <div className="flex justify-between items-center text-[9px] text-[#c084fc] font-bold font-mono">
                  <span>👻 SOULS</span>
                  <span>{stats.souls}</span>
                </div>
                <div className="w-full bg-[#1e1329] h-2 rounded-full overflow-hidden border border-[#581c87]">
                  <div
                    className="bg-gradient-to-r from-[#9333ea] to-[#c084fc] h-full transition-all duration-200"
                    style={{ width: `${soulsRatio * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* --- CENTERPIECE: Red Heart Orb & Potion / Roll Flanks --- */}
            <div className="flex items-center gap-2.5 sm:gap-3 px-1 sm:px-2">
              {/* Health Potion Flask Button */}
              <div className="relative group">
                <button
                  onClick={onDrinkPotion}
                  disabled={stats.potionCooldownRemaining > 0}
                  className="relative w-11 h-11 sm:w-13 sm:h-13 bg-[#261314] hover:bg-[#3f191b] border-2 border-[#ef4444] rounded-xl flex items-center justify-center text-xl sm:text-2xl shadow-[0_0_12px_rgba(239,68,68,0.4)] disabled:opacity-50 active:scale-95 transition-all cursor-pointer overflow-hidden"
                  title="Drink Health Potion [E] / [Q]"
                >
                  <span>🧪</span>
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
                  className={`relative w-15 h-15 sm:w-17 sm:h-17 rounded-full bg-[#3b0d11] border-4 border-[#7f1d1d] shadow-[0_0_20px_rgba(239,68,68,0.6)] flex items-center justify-center overflow-hidden ${
                    isLowHp ? 'animate-bounce shadow-[0_0_30px_rgba(239,68,68,1)] border-red-500' : ''
                  }`}
                >
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#991b1b] via-[#dc2626] to-[#f87171] transition-all duration-300"
                    style={{ height: `${hpRatio * 100}%` }}
                  />
                  <div className="relative z-10 flex flex-col items-center justify-center text-white text-center leading-none">
                    <span className="text-base sm:text-xl drop-shadow">❤️</span>
                    <span className="font-mono font-black text-[10px] sm:text-xs tracking-tight text-white drop-shadow">
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
                  className="relative w-11 h-11 sm:w-13 sm:h-13 bg-[#1e2319] hover:bg-[#2a3421] border-2 border-[#84cc16] rounded-xl flex items-center justify-center text-xl sm:text-2xl shadow-[0_0_12px_rgba(132,204,22,0.4)] disabled:opacity-50 active:scale-95 transition-all cursor-pointer overflow-hidden"
                  title="Dodge Roll Evade [Space] / [Shift]"
                >
                  <span>💨</span>
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
            <div className="flex items-center gap-2 sm:gap-2.5 pl-2 sm:pl-3 border-l border-[#3a322b]">
              {[0, 1, 2].map((slotIdx) => {
                const artifact = stats.equippedArtifacts[slotIdx];
                const cooldown = stats.artifactCooldowns[slotIdx];
                const isOnCooldown = cooldown > 0;
                const hasEnoughSouls = artifact?.soulCost
                  ? stats.souls >= artifact.soulCost
                  : true;

                return (
                  <div key={slotIdx} className="relative group">
                    <button
                      onClick={() => onActivateArtifact(slotIdx)}
                      disabled={!artifact || isOnCooldown || !hasEnoughSouls}
                      className={`relative w-11 h-11 sm:w-12 sm:h-12 bg-[#1e1b18] hover:bg-[#2e2a26] border-2 rounded-xl flex items-center justify-center text-xl sm:text-2xl shadow-md transition-all active:scale-95 overflow-hidden ${
                        artifact
                          ? artifact.rarity === 'unique'
                            ? 'border-[#fbbf24] shadow-[0_0_10px_rgba(251,191,36,0.4)]'
                            : 'border-[#38bdf8] shadow-[0_0_8px_rgba(56,189,248,0.3)]'
                          : 'border-[#3a322c] opacity-40'
                      }`}
                      title={artifact ? `${artifact.name} [${slotIdx + 1}]` : 'Empty Artifact Slot'}
                    >
                      {artifact ? <span>{artifact.icon}</span> : <span className="text-gray-600 text-sm">✦</span>}
                      {isOnCooldown && (
                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-white font-mono font-bold text-xs">
                          {Math.ceil(cooldown)}s
                        </div>
                      )}
                      {artifact?.soulCost && (
                        <span className="absolute top-0.5 right-0.5 text-[8px] font-mono font-black text-purple-300 bg-purple-950/80 px-1 rounded">
                          👻{artifact.soulCost}
                        </span>
                      )}
                    </button>
                    <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-[#1a1816] text-[#cbd5e1] font-mono font-bold text-[9px] px-1 rounded border border-[#4a4037]">
                      {slotIdx + 1}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Primary Action Attack / Bow Triggers */}
            <div className="flex items-center gap-1.5 pl-2 sm:pl-3 border-l border-[#3a322b]">
              <button
                onClick={onMeleeAttack}
                className="px-3 sm:px-4 py-2 bg-[#dc2626] hover:bg-[#b91c1c] border-2 border-[#fca5a5] rounded-xl text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-[0_0_15px_rgba(220,38,38,0.6)] active:scale-95 transition-all cursor-pointer"
                title="Primary Melee Attack [Left Click / Space]"
              >
                <Sword className="w-4 h-4" />
                <span>MELEE</span>
              </button>

              <button
                onClick={onRangedAttack}
                disabled={stats.arrows <= 0}
                className="px-3 sm:px-4 py-2 bg-[#d97706] hover:bg-[#b45309] border-2 border-[#fef08a] rounded-xl text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-[0_0_15px_rgba(217,119,6,0.6)] active:scale-95 transition-all cursor-pointer disabled:opacity-40"
                title="Fire Bow / Crossbow [Right Click / F]"
              >
                <Crosshair className="w-4 h-4" />
                <span>BOW</span>
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};
