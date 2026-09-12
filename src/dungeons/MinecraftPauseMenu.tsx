import React from 'react';
import { dungeonsAudio } from './dungeonsAudio';
import {
  Play,
  Backpack,
  Map as MapIcon,
  Tent,
  BookOpen,
  Settings,
  LogOut,
  X,
} from 'lucide-react';

interface MinecraftPauseMenuProps {
  isOpen: boolean;
  onResume: () => void;
  onOpenInventory: () => void;
  onOpenMap: () => void;
  onOpenCamp: () => void;
  onOpenJournal: () => void;
  onOpenSettings: () => void;
  onSaveAndQuit: () => void;
  worldName?: string;
}

export const MinecraftPauseMenu: React.FC<MinecraftPauseMenuProps> = ({
  isOpen,
  onResume,
  onOpenInventory,
  onOpenMap,
  onOpenCamp,
  onOpenJournal,
  onOpenSettings,
  onSaveAndQuit,
  worldName = 'Current World',
}) => {
  if (!isOpen) return null;

  const handleAction = (cb: () => void) => {
    dungeonsAudio.playButtonClick();
    cb();
  };

  return (
    <div
      id="minecraft-pause-overlay"
      className="fixed inset-0 z-[160] flex items-center justify-center p-4 pointer-events-auto bg-black/75 backdrop-blur-xs animate-in fade-in duration-150 select-none"
      style={{ fontFamily: "'VT323', monospace" }}
      onClick={() => handleAction(onResume)}
    >
      <div
        id="minecraft-pause-modal"
        className="w-full max-w-sm mc-panel-dark text-white p-5 border-4 border-black flex flex-col items-center text-center gap-3 relative shadow-[0_0_30px_rgba(0,0,0,0.9)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between border-b-2 border-black pb-2">
          <div className="text-left">
            <h2 className="text-3xl font-bold tracking-wider text-yellow-400 leading-none">
              GAME PAUSED
            </h2>
            <span className="text-xs text-gray-400 font-mono">{worldName}</span>
          </div>
          <button
            onClick={() => handleAction(onResume)}
            className="mc-btn px-2 py-1 text-sm cursor-pointer"
            title="Resume Game (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons Column */}
        <div className="w-full flex flex-col gap-2 mt-1">
          {/* Back to Game */}
          <button
            onClick={() => handleAction(onResume)}
            className="mc-btn-green w-full py-2.5 text-xl font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>BACK TO GAME</span>
          </button>

          {/* Quick Nav Row: Inventory & Map */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleAction(onOpenInventory)}
              className="mc-btn w-full py-2 text-base font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Backpack className="w-4 h-4 text-amber-300" />
              <span>INVENTORY [I]</span>
            </button>
            <button
              onClick={() => handleAction(onOpenMap)}
              className="mc-btn w-full py-2 text-base font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <MapIcon className="w-4 h-4 text-sky-300" />
              <span>MAP [M]</span>
            </button>
          </div>

          {/* Quick Nav Row 2: Camp & Journal */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleAction(onOpenCamp)}
              className="mc-btn w-full py-2 text-base font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Tent className="w-4 h-4 text-orange-300" />
              <span>CAMP HUB [C]</span>
            </button>
            <button
              onClick={() => handleAction(onOpenJournal)}
              className="mc-btn w-full py-2 text-base font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-purple-300" />
              <span>JOURNAL [J]</span>
            </button>
          </div>

          {/* Options Button */}
          <button
            onClick={() => handleAction(onOpenSettings)}
            className="mc-btn w-full py-2 text-lg font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            <Settings className="w-4 h-4 text-gray-300" />
            <span>OPTIONS / SETTINGS...</span>
          </button>

          {/* Save and Quit to Title Button */}
          <button
            onClick={() => handleAction(onSaveAndQuit)}
            className="mc-btn-gold w-full py-2.5 text-xl font-bold flex items-center justify-center gap-2 cursor-pointer mt-1 active:scale-98"
          >
            <LogOut className="w-5 h-5" />
            <span>SAVE AND QUIT TO TITLE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
