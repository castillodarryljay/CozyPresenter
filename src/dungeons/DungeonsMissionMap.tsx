import React, { useState } from 'react';
import { DungeonsMission, DungeonsPlayerStats } from './types';
import { DUNGEONS_MISSIONS } from './dungeonsData';
import { X, Play, Skull, ChevronRight } from 'lucide-react';

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
  const [mobileTab, setMobileTab] = useState<'list' | 'briefing'>('list');

  if (!isOpen) return null;

  const handleSelect = (mission: DungeonsMission) => {
    setSelectedMission(mission);
    setMobileTab('briefing');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl h-[94vh] sm:h-[88vh] max-h-[740px] mc-panel-dark flex flex-col overflow-hidden text-white border-4 border-black"
        style={{ fontFamily: "'VT323', monospace" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex justify-between items-center px-2.5 sm:px-4 py-2.5 sm:py-3 border-b-2 border-black bg-[#1e1e1e]">
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            <span className="text-xl sm:text-3xl flex-shrink-0">🗺️</span>
            <div className="min-w-0">
              <h1 className="text-base sm:text-2xl font-bold tracking-wider text-[#fde047] uppercase leading-none truncate">
                Mission Map
              </h1>
              <span className="hidden sm:inline text-xs sm:text-sm text-[#a3a3a3]">
                Select an adventure to hunt loot and vanquish dungeon bosses
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="flex items-center gap-1 sm:gap-1.5 mc-slot-dark px-2 sm:px-3 py-1 text-[#38bdf8] font-bold text-xs sm:text-base">
              <span>◆</span>
              <span className="font-mono"><span className="hidden sm:inline">POWER </span>PL {stats.powerLevel}</span>
            </div>

            <button
              onClick={onClose}
              className="mc-btn w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-white cursor-pointer"
              title="Close [ESC]"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </header>

        {/* Mobile Tab Switcher */}
        <div className="flex md:hidden bg-[#181818] border-b-2 border-black p-1.5 gap-2">
          <button
            onClick={() => setMobileTab('list')}
            className={`mc-btn flex-1 py-1 text-base ${
              mobileTab === 'list' ? 'mc-btn-gold text-white font-bold' : 'text-gray-300'
            }`}
          >
            🗺️ Missions List
          </button>
          <button
            onClick={() => setMobileTab('briefing')}
            className={`mc-btn flex-1 py-1 text-base ${
              mobileTab === 'briefing' ? 'mc-btn-gold text-white font-bold' : 'text-gray-300'
            }`}
          >
            📜 Briefing & Launch
          </button>
        </div>

        {/* 2-Column: Map Missions List & Mission Detail Panel */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* LEFT: MISSIONS MAP NODES (7 Cols) */}
          <div
            className={`md:col-span-7 p-4 overflow-y-auto bg-[#141414] flex flex-col gap-3 ${
              mobileTab !== 'list' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Difficulty Toggle */}
            <div className="flex items-center gap-2 p-1.5 mc-slot-dark">
              {(['Default', 'Adventure', 'Apocalypse'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`mc-btn flex-1 py-1 text-base uppercase font-bold transition-all ${
                    selectedDifficulty === diff
                      ? diff === 'Apocalypse'
                        ? 'mc-btn-red text-white'
                        : diff === 'Adventure'
                        ? 'mc-btn-gold text-white'
                        : 'mc-btn-green text-white'
                      : 'text-gray-400'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>

            {/* Mission Nodes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              {DUNGEONS_MISSIONS.map((mission) => {
                const isSelected = selectedMission.id === mission.id;
                const isPowerSufficient = stats.powerLevel >= mission.recommendedPower;

                return (
                  <div
                    key={mission.id}
                    onClick={() => handleSelect(mission)}
                    className={`p-3 cursor-pointer transition-all flex flex-col justify-between gap-2 border-2 ${
                      isSelected
                        ? 'mc-panel-dark border-[#facc15] shadow-[0_0_10px_rgba(250,204,21,0.5)]'
                        : 'mc-slot-dark hover:border-[#666]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl p-1 bg-black/40 border border-neutral-700">{mission.icon}</span>
                        <div className="flex flex-col">
                          <span className="font-bold text-base text-[#fef08a] leading-tight">
                            {mission.name}
                          </span>
                          <span className="text-xs text-gray-400">{mission.region}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500 md:hidden" />
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-800">
                      <span
                        className={`font-bold flex items-center gap-1 ${
                          isPowerSufficient ? 'text-[#38bdf8]' : 'text-red-400'
                        }`}
                      >
                        ◆ Rec. Power {mission.recommendedPower}
                      </span>
                      {mission.bossName && (
                        <span className="text-rose-400 font-bold flex items-center gap-0.5">
                          <Skull className="w-3.5 h-3.5" /> BOSS
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: MISSION BRIEFING & LAUNCH (5 Cols) */}
          <div
            className={`md:col-span-5 p-4 bg-[#181818] border-t-2 md:border-t-0 md:border-l-2 border-black flex flex-col justify-between gap-3 overflow-y-auto ${
              mobileTab !== 'briefing' ? 'hidden md:flex' : 'flex'
            }`}
          >
            <div className="space-y-3">
              {/* Mission Header */}
              <div className="flex items-center gap-3">
                <span className="text-4xl p-2 mc-slot-dark border border-neutral-700">
                  {selectedMission.icon}
                </span>
                <div>
                  <h2 className="text-xl font-bold text-[#fef08a] leading-none">
                    {selectedMission.name}
                  </h2>
                  <span className="text-sm text-[#38bdf8]">
                    {selectedMission.region} • {selectedDifficulty}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="text-base text-gray-300 mc-slot-dark p-3 leading-relaxed">
                {selectedMission.description}
              </div>

              {/* Objectives */}
              <div className="space-y-1">
                <span className="text-sm font-bold text-[#bcaaa4] uppercase">
                  Expedition Objectives
                </span>
                <div className="mc-slot-dark p-2.5 text-sm space-y-1 text-gray-300">
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
                      <span>Vanquish {selectedMission.bossName}!</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Potential Gear Drops Preview */}
              <div className="space-y-1">
                <span className="text-sm font-bold text-[#bcaaa4] uppercase">
                  Potential Drops
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedMission.potentialDrops.map((drop, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 mc-slot-dark text-[#fef08a] text-xs font-bold"
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
              className="w-full mc-btn-green py-3 text-xl flex items-center justify-center gap-2 mt-2"
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
