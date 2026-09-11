import React, { useState } from 'react';
import { DungeonsMission, DungeonsPlayerStats } from './types';
import { DUNGEONS_MISSIONS } from './dungeonsData';
import { X, MapPin, Play, ShieldAlert, Award, Skull } from 'lucide-react';

interface DungeonsMissionMapProps {
  isOpen: boolean;
  onClose: () => void;
  stats: DungeonsPlayerStats;
  currentMission: DungeonsMission;
  onSelectMission: (mission: DungeonsMission) => void;
}

export const DungeonsMissionMap: React.FC<DungeonsMissionMapProps> = ({
  isOpen,
  onClose,
  stats,
  currentMission,
  onSelectMission,
}) => {
  const [selectedMission, setSelectedMission] = useState<DungeonsMission>(currentMission);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'Default' | 'Adventure' | 'Apocalypse'>('Default');

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md select-none font-sans"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl h-[88vh] max-h-[720px] bg-[#1a1714] border-4 border-[#4a3f35] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex justify-between items-center px-4 sm:px-6 py-3 border-b-2 border-[#3d3329] bg-[#241f1a]">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🗺️</span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-widest text-[#f5ebd7] uppercase">
                Mission Select Map
              </h1>
              <span className="text-xs text-[#b8a99a]">
                Choose your dungeon expedition, select threat difficulty, and hunt for unique artifacts
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-[#142338] px-3 py-1 rounded-lg border border-[#38bdf8] text-[#38bdf8] font-black text-sm">
              <span>◆</span>
              <span>HERO POWER {stats.powerLevel}</span>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 bg-[#352c24] hover:bg-[#4a3d31] border border-[#635343] rounded-lg flex items-center justify-center text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* 2-Column: Map Missions List & Mission Detail Panel */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          
          {/* LEFT: MISSIONS MAP NODES (7 Cols) */}
          <div className="md:col-span-7 p-4 sm:p-5 overflow-y-auto bg-[#141210] flex flex-col gap-3">
            
            {/* Difficulty Toggle */}
            <div className="flex items-center gap-2 p-1 bg-[#221c16] rounded-xl border border-[#3d3329]">
              {(['Default', 'Adventure', 'Apocalypse'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`flex-1 py-1.5 text-xs font-black uppercase rounded-lg transition-all cursor-pointer ${
                    selectedDifficulty === diff
                      ? diff === 'Apocalypse'
                        ? 'bg-[#b91c1c] text-white border border-[#f87171] shadow-md'
                        : diff === 'Adventure'
                        ? 'bg-[#d97706] text-white border border-[#fef08a] shadow-md'
                        : 'bg-[#15803d] text-white border border-[#86efac] shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>

            {/* Mission Nodes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-1">
              {DUNGEONS_MISSIONS.map((mission) => {
                const isSelected = selectedMission.id === mission.id;
                const isPowerSufficient = stats.powerLevel >= mission.recommendedPower;

                return (
                  <div
                    key={mission.id}
                    onClick={() => setSelectedMission(mission)}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'border-[#fbbf24] bg-[#2a221a] shadow-[0_0_15px_rgba(251,191,36,0.4)] scale-[1.02]'
                        : 'border-[#3d3329] bg-[#1e1b18] hover:border-[#635343]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{mission.icon}</span>
                        <div className="flex flex-col">
                          <span className="font-bold text-xs sm:text-sm text-[#f5ebd7]">
                            {mission.name}
                          </span>
                          <span className="text-[10px] text-gray-400">{mission.region}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-[#332b23]">
                      <span
                        className={`font-black flex items-center gap-1 ${
                          isPowerSufficient ? 'text-[#38bdf8]' : 'text-[#f87171]'
                        }`}
                      >
                        ◆ Rec. Power {mission.recommendedPower}
                      </span>
                      {mission.bossName && (
                        <span className="text-red-400 font-bold flex items-center gap-0.5">
                          <Skull className="w-3 h-3" /> BOSS
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: MISSION BRIEFING & LAUNCH (5 Cols) */}
          <div className="md:col-span-5 p-4 sm:p-5 bg-[#1a1714] border-t-2 md:border-t-0 md:border-l-2 border-[#3d3329] flex flex-col justify-between gap-4 overflow-y-auto">
            <div className="space-y-3">
              {/* Mission Header */}
              <div className="flex items-center gap-3">
                <span className="text-4xl p-2 bg-[#221c16] rounded-xl border border-[#4a3e32]">
                  {selectedMission.icon}
                </span>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-[#fef08a]">
                    {selectedMission.name}
                  </h2>
                  <span className="text-xs text-[#38bdf8] font-mono">
                    {selectedMission.region} • {selectedDifficulty} Difficulty
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-[#cbd5e1] leading-relaxed bg-[#141210] p-3 rounded-xl border border-[#332b23]">
                {selectedMission.description}
              </p>

              {/* Objectives */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-[#bcaaa4] uppercase tracking-wider">
                  Expedition Objectives
                </span>
                <div className="bg-[#141210] p-2.5 rounded-xl border border-[#332b23] text-xs space-y-1 text-gray-300">
                  <div className="flex items-center gap-2">
                    <span className="text-red-400">⚔️</span>
                    <span>Defeat {selectedMission.targetKills} Hostile Mobs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400">📦</span>
                    <span>Uncover {selectedMission.targetChests} Secret Supply Chests</span>
                  </div>
                  {selectedMission.bossName && (
                    <div className="flex items-center gap-2 text-rose-300 font-bold">
                      <span>💀</span>
                      <span>Vanquish the {selectedMission.bossName}!</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Potential Gear Drops Preview */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-[#bcaaa4] uppercase tracking-wider">
                  Potential Equipment Rewards
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedMission.potentialDrops.map((drop, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-[#261f19] border border-[#544333] text-[#fef08a] rounded-lg text-xs font-mono font-bold"
                    >
                      ★ {drop}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Embark Button */}
            <button
              onClick={() => {
                onSelectMission({ ...selectedMission, difficulty: selectedDifficulty });
                onClose();
              }}
              className="w-full py-3.5 bg-[#15803d] hover:bg-[#16a34a] border-2 border-[#86efac] rounded-xl text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(21,128,61,0.6)] cursor-pointer active:scale-95 transition-all"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>EMBARK ON MISSION</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
