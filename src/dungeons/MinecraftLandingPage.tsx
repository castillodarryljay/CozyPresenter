import React, { useState, useEffect, useRef } from 'react';
import { SavedWorld, TerrainType } from '../../types';
import { dungeonsAudio } from './dungeonsAudio';
import {
  Play,
  Plus,
  Trash2,
  Settings,
  BookOpen,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Shield,
  Compass,
  Volume2,
  VolumeX,
  AlertTriangle,
} from 'lucide-react';

interface MinecraftLandingPageProps {
  currentWorld: SavedWorld | null;
  savedWorlds: SavedWorld[];
  onPlayWorld: (world: SavedWorld) => void;
  onCreateWorld: (newWorld: Omit<SavedWorld, 'id' | 'lastPlayed' | 'createdDate'>) => void;
  onDeleteWorld: (worldId: string) => void;
  onOpenSettings: () => void;
  onOpenGuide: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

const SPLASH_TEXTS = [
  'Now with 100% more Dungeons!',
  'Watch out for Creepers!',
  'Infinite Voxel Wilderness!',
  'Enchantments & Artifacts!',
  "Don't dig straight down!",
  'Campfire keeps you warm!',
  'Over 9000 emeralds!',
  'Also try Terraria!',
  'Ride the pig!',
  'Procedural biome generation!',
  'Collect Ancient Relics!',
  'Power Level ◆ 100+!',
  'Built with React & Three.js!',
  'Golems are friendly... mostly!',
  'Level up your Wandering Hero!',
];

export const MinecraftLandingPage: React.FC<MinecraftLandingPageProps> = ({
  currentWorld,
  savedWorlds,
  onPlayWorld,
  onCreateWorld,
  onDeleteWorld,
  onOpenSettings,
  onOpenGuide,
  soundEnabled,
  onToggleSound,
}) => {
  const [view, setView] = useState<'title' | 'world_select' | 'create_world'>('title');
  const [selectedWorldId, setSelectedWorldId] = useState<string>(
    currentWorld?.id || (savedWorlds.length > 0 ? savedWorlds[0].id : '')
  );
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Splash text
  const [splashText, setSplashText] = useState<string>('');
  useEffect(() => {
    const randomSplash = SPLASH_TEXTS[Math.floor(Math.random() * SPLASH_TEXTS.length)];
    setSplashText(randomSplash);
  }, []);

  // Canvas ref for ambient floating golden campfire embers / fireflies
  const emberCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = emberCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    interface Ember {
      x: number;
      y: number;
      size: number;
      vy: number;
      vx: number;
      alpha: number;
      maxAlpha: number;
      color: string;
      phase: number;
    }

    const colors = ['#f59e0b', '#fbbf24', '#fde047', '#fb923c', '#10b981'];
    const embers: Ember[] = Array.from({ length: 42 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 3 + 1.5,
      vy: -(Math.random() * 0.7 + 0.3),
      vx: (Math.random() - 0.5) * 0.4,
      alpha: 0,
      maxAlpha: Math.random() * 0.7 + 0.25,
      color: colors[Math.floor(Math.random() * colors.length)],
      phase: Math.random() * Math.PI * 2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < embers.length; i++) {
        const e = embers[i];
        e.y += e.vy;
        e.phase += 0.03;
        e.x += e.vx + Math.sin(e.phase) * 0.35;

        // Fade in and out
        if (e.y < height * 0.7 && e.alpha < e.maxAlpha) {
          e.alpha = Math.min(e.maxAlpha, e.alpha + 0.02);
        } else if (e.y < height * 0.15) {
          e.alpha = Math.max(0, e.alpha - 0.02);
        }

        // Reset if off-screen
        if (e.y < 0 || e.x < 0 || e.x > width) {
          e.y = height + 10;
          e.x = Math.random() * width;
          e.alpha = 0;
        }

        // Draw pixelated square ember
        ctx.fillStyle = e.color;
        ctx.globalAlpha = e.alpha;
        ctx.fillRect(Math.floor(e.x), Math.floor(e.y), Math.floor(e.size), Math.floor(e.size));
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [view]);

  // Create World Form State
  const [worldName, setWorldName] = useState<string>('New Adventure');
  const [gameMode, setGameMode] = useState<'survival' | 'creative' | 'hardcore'>('survival');
  const [biome, setBiome] = useState<TerrainType>('hills');
  const [difficulty, setDifficulty] = useState<'peaceful' | 'easy' | 'normal' | 'hard'>('normal');
  const [dayNightCycle, setDayNightCycle] = useState<boolean>(true);
  const [seed, setSeed] = useState<number>(() => Math.floor(Math.random() * 899999) + 100000);

  const handleButtonClick = (action?: () => void) => {
    dungeonsAudio.playButtonClick();
    if (action) action();
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dungeonsAudio.playWorldCreated();
    onCreateWorld({
      name: worldName.trim() || 'New World',
      seed: Number(seed) || 12345,
      gameMode,
      biome,
      difficulty,
      dayNightCycle,
      powerLevel: gameMode === 'creative' ? 99 : 1,
      level: 1,
    });
  };

  const getBiomeIcon = (b: TerrainType) => {
    switch (b) {
      case 'mountains':
        return '🏔️';
      case 'desert':
        return '🏜️';
      case 'plains':
        return '🌾';
      default:
        return '🌲';
    }
  };

  const getBiomeLabel = (b: TerrainType) => {
    switch (b) {
      case 'mountains':
        return 'Mountain Peaks';
      case 'desert':
        return 'Desert Ruins';
      case 'plains':
        return 'Flat Plains';
      default:
        return 'Rolling Hills';
    }
  };

  const selectedWorld = savedWorlds.find((w) => w.id === selectedWorldId) || savedWorlds[0];

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-between select-none overflow-y-auto overflow-x-hidden text-white font-mono"
      style={{
        fontFamily: "'VT323', monospace",
        // When on title, background is semi-transparent so the 3D rotating panoramic world shows through!
        // Fallback rich panoramic dusk gradient ensures it is never a dull black
        background:
          view === 'title'
            ? 'radial-gradient(ellipse at 50% 25%, rgba(15, 23, 42, 0.4) 0%, rgba(2, 6, 23, 0.72) 75%, rgba(0, 0, 0, 0.88) 100%)'
            : 'radial-gradient(ellipse at center, rgba(30, 22, 16, 0.95) 0%, rgba(15, 11, 8, 0.98) 100%)',
      }}
      onClick={() => {
        if (deleteConfirmId) setDeleteConfirmId(null);
      }}
    >
      {/* Ambient Floating Golden Embers Canvas */}
      <canvas
        ref={emberCanvasRef}
        className="fixed inset-0 pointer-events-none z-10 opacity-70"
      />

      {/* Decorative Minecraft Sky Vignette Overlays */}
      <div className="fixed inset-0 pointer-events-none z-10 bg-gradient-to-b from-black/80 via-transparent to-black/85" />
      <div className="fixed inset-0 pointer-events-none z-10 shadow-[inset_0_0_120px_rgba(0,0,0,0.85)]" />

      {/* Top Bar with Branding & Quick Navigation */}
      <div className="w-full flex justify-between items-center px-4 py-3 z-20 pointer-events-auto bg-black/40 backdrop-blur-xs border-b border-white/10">
        <div className="flex items-center gap-2 text-sm sm:text-base text-gray-300">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
          <span className="tracking-wider font-bold text-yellow-400">
            MINECRAFT DUNGEONS: VOXEL EXPLORER
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio SFX Toggle */}
          <button
            onClick={() => handleButtonClick(onToggleSound)}
            className="mc-btn px-2.5 py-1 text-sm flex items-center gap-1.5 cursor-pointer text-gray-200"
            title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">SFX ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-red-400" />
                <span className="hidden sm:inline">SFX OFF</span>
              </>
            )}
          </button>

          {/* Quick Options Button */}
          <button
            id="top-bar-options-btn"
            onClick={() => handleButtonClick(onOpenSettings)}
            className="mc-btn px-2.5 py-1 text-sm flex items-center gap-1.5 cursor-pointer text-gray-200"
            title="Open Game Options & Audio"
          >
            <Settings className="w-4 h-4 text-yellow-400" />
            <span className="hidden sm:inline">OPTIONS</span>
          </button>

          {/* Quick Guide Button */}
          <button
            id="top-bar-guide-btn"
            onClick={() => handleButtonClick(onOpenGuide)}
            className="mc-btn px-2.5 py-1 text-sm flex items-center gap-1.5 cursor-pointer text-yellow-300"
            title="Open Field Guide & Controls"
          >
            <BookOpen className="w-4 h-4 text-yellow-400" />
            <span className="hidden sm:inline">GUIDE</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VIEW 1: TITLE SCREEN / MAIN MENU                          */}
      {/* ========================================================= */}
      {view === 'title' && (
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg px-4 py-6 z-20 animate-in fade-in duration-200">
          {/* Minecraft 3D Extruded Title Logo */}
          <div className="relative mb-8 text-center flex flex-col items-center">
            <h1
              className="text-5xl sm:text-7xl font-black tracking-widest uppercase leading-none drop-shadow-2xl"
              style={{
                color: '#f1f5f9',
                textShadow: `
                  0 1px 0 #cbd5e1,
                  0 2px 0 #94a3b8,
                  0 3px 0 #64748b,
                  0 4px 0 #475569,
                  0 5px 0 #334155,
                  0 6px 0 #1e293b,
                  0 8px 16px rgba(0, 0, 0, 0.95)
                `,
              }}
            >
              MINECRAFT
            </h1>
            <div
              className="text-2xl sm:text-4xl font-bold tracking-widest uppercase text-[#fbbf24] -mt-1 sm:-mt-2"
              style={{
                textShadow: `
                  0 1px 0 #d97706,
                  0 2px 0 #b45309,
                  0 3px 0 #78350f,
                  0 4px 8px rgba(0, 0, 0, 0.95)
                `,
              }}
            >
              VOXEL EXPLORER
            </div>

            {/* Bouncing Yellow Splash Text */}
            {splashText && (
              <div
                className="absolute -bottom-4 right-0 sm:-right-8 text-yellow-300 font-bold text-lg sm:text-2xl whitespace-nowrap animate-bounce drop-shadow-[0_2px_4px_rgba(0,0,0,1)]"
                style={{
                  transform: 'rotate(-16deg)',
                  transformOrigin: 'top right',
                }}
              >
                {splashText}
              </div>
            )}
          </div>

          {/* Main Action Buttons */}
          <div className="flex flex-col gap-3 w-full max-w-sm">
            {/* Play Game / Worlds */}
            <button
              id="title-play-game-btn"
              onClick={() => handleButtonClick(() => setView('world_select'))}
              className="mc-btn-green py-3.5 text-2xl font-bold flex items-center justify-center gap-2 shadow-2xl cursor-pointer active:scale-98 transition-all hover:scale-[1.02]"
            >
              <Play className="w-6 h-6 fill-white" />
              <span>PLAY GAME</span>
            </button>

            {/* Resume Current Session (if active) */}
            {currentWorld && (
              <button
                id="title-resume-game-btn"
                onClick={() => handleButtonClick(() => onPlayWorld(currentWorld))}
                className="mc-btn-gold py-2.5 text-xl font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98 hover:scale-[1.01]"
              >
                <span>CONTINUE ({currentWorld.name})</span>
              </button>
            )}

            {/* Create New World Quick Button */}
            <button
              id="title-create-world-btn"
              onClick={() => handleButtonClick(() => setView('create_world'))}
              className="mc-btn py-2.5 text-xl font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-98 hover:scale-[1.01]"
            >
              <Plus className="w-5 h-5 text-emerald-400" />
              <span>CREATE NEW WORLD</span>
            </button>

            {/* Secondary Row: Options & Guide */}
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                id="title-options-btn"
                onClick={() => handleButtonClick(onOpenSettings)}
                className="mc-btn py-2.5 text-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#8c8c8c]"
              >
                <Settings className="w-5 h-5 text-yellow-300" />
                <span>OPTIONS...</span>
              </button>
              <button
                id="title-guide-btn"
                onClick={() => handleButtonClick(onOpenGuide)}
                className="mc-btn py-2.5 text-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#8c8c8c]"
              >
                <BookOpen className="w-5 h-5 text-yellow-400" />
                <span>FIELD GUIDE</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 2: SELECT WORLD SCREEN                               */}
      {/* ========================================================= */}
      {view === 'world_select' && (
        <div className="flex-1 flex flex-col items-center justify-between w-full max-w-2xl px-4 py-4 z-20 animate-in fade-in duration-150">
          {/* Header */}
          <div className="text-center mb-3">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-wider text-yellow-400 drop-shadow-md">
              SELECT WORLD
            </h2>
            <p className="text-base text-gray-300">Choose a realm to explore or forge a new world</p>
          </div>

          {/* World List Box */}
          <div className="w-full flex-1 max-h-[52vh] overflow-y-auto mc-slot-dark border-4 border-[#4a3f35] p-2 space-y-2 rounded shadow-2xl bg-[#14100d]/90 backdrop-blur-sm">
            {savedWorlds.length === 0 ? (
              <div className="py-12 text-center text-gray-400 space-y-2">
                <span className="text-5xl block">🌍</span>
                <p className="text-2xl text-yellow-300 font-bold">No Saved Worlds Found</p>
                <p className="text-base text-gray-400">Click below to create your first procedural realm.</p>
              </div>
            ) : (
              savedWorlds.map((w) => {
                const isSelected = w.id === selectedWorldId;
                const isDeleting = deleteConfirmId === w.id;
                return (
                  <div
                    key={w.id}
                    onClick={() => {
                      dungeonsAudio.playButtonClick();
                      setSelectedWorldId(w.id);
                    }}
                    onDoubleClick={() => handleButtonClick(() => onPlayWorld(w))}
                    className={`p-3 border-2 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#3b322a] border-[#facc15] text-white shadow-[0_0_12px_rgba(250,204,21,0.4)]'
                        : 'bg-[#1e1b18] border-[#3a3530] hover:border-gray-400 text-gray-300'
                    }`}
                  >
                    {/* Biome & Name Info */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-black/60 border border-gray-600 flex items-center justify-center text-2xl flex-shrink-0">
                        {getBiomeIcon(w.biome)}
                      </div>
                      <div className="flex flex-col leading-tight">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-white">{w.name}</span>
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded font-bold uppercase ${
                              w.gameMode === 'creative'
                                ? 'bg-sky-900 text-sky-200 border border-sky-500'
                                : w.gameMode === 'hardcore'
                                ? 'bg-red-950 text-red-300 border border-red-600'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                            }`}
                          >
                            {w.gameMode}
                          </span>
                        </div>
                        <div className="text-xs text-gray-300 mt-0.5 flex items-center gap-2 sm:gap-3 flex-wrap">
                          <span>{getBiomeLabel(w.biome)}</span>
                          <span>•</span>
                          <span className="text-sky-300 font-bold">◆ Power {w.powerLevel || 1}</span>
                          <span>•</span>
                          <span>Seed: {w.seed}</span>
                        </div>
                        <span className="text-[11px] text-gray-400">
                          Last played: {new Date(w.lastPlayed).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Quick Play & Delete Buttons */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleButtonClick(() => onPlayWorld(w));
                        }}
                        className="mc-btn-green px-3 py-1.5 text-base font-bold flex items-center gap-1 cursor-pointer"
                        title="Play this world"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>PLAY</span>
                      </button>

                      {isDeleting ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleButtonClick(() => {
                              onDeleteWorld(w.id);
                              setDeleteConfirmId(null);
                            });
                          }}
                          className="mc-btn-red px-2.5 py-1.5 text-xs font-bold flex items-center gap-1 cursor-pointer animate-pulse"
                          title="Confirm Delete"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-yellow-300" />
                          <span>CONFIRM?</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(w.id);
                          }}
                          className="mc-btn-red px-2 py-1.5 text-sm cursor-pointer"
                          title="Delete world"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Action Row */}
          <div className="w-full space-y-2 mt-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={!selectedWorld}
                onClick={() => {
                  if (selectedWorld) handleButtonClick(() => onPlayWorld(selectedWorld));
                }}
                className="mc-btn-green py-2.5 text-xl font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>PLAY SELECTED</span>
              </button>

              <button
                onClick={() => handleButtonClick(() => setView('create_world'))}
                className="mc-btn py-2.5 text-xl font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-5 h-5 text-emerald-400" />
                <span>CREATE NEW WORLD</span>
              </button>
            </div>

            <button
              onClick={() => handleButtonClick(() => setView('title'))}
              className="mc-btn w-full py-2 text-lg font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>BACK TO TITLE</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 3: CREATE NEW WORLD SCREEN                           */}
      {/* ========================================================= */}
      {view === 'create_world' && (
        <form
          onSubmit={handleCreateSubmit}
          className="flex-1 flex flex-col items-center justify-between w-full max-w-xl px-4 py-4 z-20 animate-in fade-in duration-150"
        >
          <div className="text-center mb-2">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-wider text-yellow-400 drop-shadow-md">
              CREATE NEW WORLD
            </h2>
            <p className="text-base text-gray-300">Customize your procedural voxel realm</p>
          </div>

          <div className="w-full flex-1 max-h-[56vh] overflow-y-auto mc-slot-dark border-4 border-[#4a3f35] p-3 sm:p-4 space-y-3.5 rounded shadow-2xl bg-[#14100d]/90 backdrop-blur-sm">
            {/* World Name Input */}
            <div className="space-y-1">
              <label className="text-base text-yellow-400 font-bold block">World Name</label>
              <input
                type="text"
                value={worldName}
                maxLength={32}
                onChange={(e) => setWorldName(e.target.value)}
                className="mc-input w-full px-3 py-2 text-xl outline-none focus:border-yellow-400"
                placeholder="Enter world name..."
                required
              />
            </div>

            {/* Game Mode Selector */}
            <div className="space-y-1">
              <label className="text-base text-yellow-400 font-bold block">Game Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    {
                      id: 'survival',
                      label: 'SURVIVAL',
                      desc: 'Health, hunger & combat',
                      icon: Shield,
                    },
                    {
                      id: 'creative',
                      label: 'CREATIVE',
                      desc: 'Instant building & infinite power',
                      icon: Sparkles,
                    },
                    {
                      id: 'hardcore',
                      label: 'HARDCORE',
                      desc: 'Locked to hard difficulty',
                      icon: Compass,
                    },
                  ] as const
                ).map((m) => {
                  const Icon = m.icon;
                  const isSelected = gameMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        dungeonsAudio.playButtonClick();
                        setGameMode(m.id);
                        if (m.id === 'hardcore') setDifficulty('hard');
                      }}
                      className={`p-2 border-2 flex flex-col items-center text-center cursor-pointer transition-colors ${
                        isSelected
                          ? 'mc-btn-green text-white border-white scale-102'
                          : 'mc-btn text-gray-200'
                      }`}
                    >
                      <Icon className="w-5 h-5 mb-1" />
                      <span className="text-base font-bold">{m.label}</span>
                      <span className="text-[11px] opacity-80 leading-tight mt-0.5">{m.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Biome Choice */}
            <div className="space-y-1">
              <label className="text-base text-yellow-400 font-bold block">Starting Biome</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(
                  [
                    { id: 'hills', label: 'Forest Hills', icon: '🌲' },
                    { id: 'mountains', label: 'Mountains', icon: '🏔️' },
                    { id: 'desert', label: 'Desert Ruins', icon: '🏜️' },
                    { id: 'plains', label: 'Plains', icon: '🌾' },
                  ] as const
                ).map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      dungeonsAudio.playButtonClick();
                      setBiome(b.id);
                    }}
                    className={`py-2 px-1 text-sm font-bold flex flex-col items-center gap-1 cursor-pointer ${
                      biome === b.id ? 'mc-btn-green text-white' : 'mc-btn text-gray-200'
                    }`}
                  >
                    <span className="text-xl">{b.icon}</span>
                    <span>{b.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Seed Configuration */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-base text-yellow-400 font-bold">World Seed</label>
                <button
                  type="button"
                  onClick={() => {
                    dungeonsAudio.playButtonClick();
                    setSeed(Math.floor(Math.random() * 899999) + 100000);
                  }}
                  className="mc-btn px-2 py-0.5 text-xs flex items-center gap-1 cursor-pointer text-yellow-300"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>🎲 RANDOMIZE</span>
                </button>
              </div>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value))}
                className="mc-input w-full px-3 py-1.5 text-lg outline-none"
              />
              <span className="text-xs text-gray-400">Leave seed as-is or randomize for unique terrain.</span>
            </div>

            {/* Day / Night Cycle & Difficulty */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-sm text-yellow-400 font-bold block mb-1">Day/Night Cycle</label>
                <button
                  type="button"
                  onClick={() => {
                    dungeonsAudio.playButtonClick();
                    setDayNightCycle(!dayNightCycle);
                  }}
                  className={`mc-btn w-full py-1.5 text-base font-bold ${
                    dayNightCycle ? 'mc-btn-green text-white' : 'opacity-75 text-gray-300'
                  }`}
                >
                  {dayNightCycle ? '☀️ DYNAMIC' : '☀️ FROZEN NOON'}
                </button>
              </div>

              <div>
                <label className="text-sm text-yellow-400 font-bold block mb-1">Difficulty</label>
                <button
                  type="button"
                  onClick={() => {
                    dungeonsAudio.playButtonClick();
                    const diffs: ('peaceful' | 'easy' | 'normal' | 'hard')[] = [
                      'peaceful',
                      'easy',
                      'normal',
                      'hard',
                    ];
                    const nextIdx = (diffs.indexOf(difficulty) + 1) % diffs.length;
                    setDifficulty(diffs[nextIdx]);
                  }}
                  className="mc-btn w-full py-1.5 text-base font-bold uppercase"
                >
                  {difficulty}
                </button>
              </div>
            </div>
          </div>

          {/* Create & Cancel Action Buttons */}
          <div className="w-full space-y-2 mt-4">
            <button
              type="submit"
              className="mc-btn-green w-full py-3 text-2xl font-bold flex items-center justify-center gap-2 shadow-xl cursor-pointer active:scale-98"
            >
              <Sparkles className="w-6 h-6 text-yellow-300" />
              <span>CREATE NEW WORLD</span>
            </button>

            <button
              type="button"
              onClick={() => handleButtonClick(() => setView('world_select'))}
              className="mc-btn w-full py-2 text-lg font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>CANCEL</span>
            </button>
          </div>
        </form>
      )}

      {/* Footer Version & Info */}
      <div className="w-full flex justify-between items-center px-4 py-2 text-xs text-gray-400 z-20 pointer-events-none bg-black/40 backdrop-blur-xs border-t border-white/5">
        <span>Minecraft Dungeons: Voxel Explorer • v1.21.4</span>
        <span>Procedural Realms & Infinite Adventures</span>
      </div>
    </div>
  );
};
