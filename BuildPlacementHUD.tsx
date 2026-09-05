import React from 'react';
import { RotateCw, Check, X, Compass, AlertCircle } from 'lucide-react';
import { BuildableStructureBlueprint } from './types';

interface BuildPlacementHUDProps {
  blueprint: BuildableStructureBlueprint | null;
  buildPreview: {
    x: number;
    y: number;
    elevation: number;
    rotation: number;
  } | null;
  onConfirm: () => void;
  onCancel: () => void;
  onRotate: (dir: number) => void;
}

export const BuildPlacementHUD: React.FC<BuildPlacementHUDProps> = ({
  blueprint,
  buildPreview,
  onConfirm,
  onCancel,
  onRotate,
}) => {
  if (!blueprint || !buildPreview) return null;

  const deg = Math.round((buildPreview.rotation * 180) / Math.PI) % 360;

  return (
    <div className="fixed top-14 sm:top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-auto max-w-[96vw] animate-in fade-in slide-in-from-top-3 duration-150">
      <div className="mc-panel p-2.5 sm:p-3 bg-[#1e293b]/95 border-2 border-[#60a5fa] text-white shadow-2xl flex flex-col items-center gap-2">
        {/* Structure Info */}
        <div className="flex items-center gap-2">
          <span className="text-2xl sm:text-3xl">{blueprint.icon}</span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm sm:text-base text-yellow-300">
                Placing: {blueprint.name}
              </span>
              <span className="text-[10px] uppercase font-mono px-1 bg-blue-900 text-blue-200 rounded border border-blue-400">
                {blueprint.category}
              </span>
            </div>
            <div className="text-[11px] sm:text-xs text-gray-300 font-mono flex items-center gap-2">
              <span>
                Pos: ({Math.round(buildPreview.x)}, {Math.round(buildPreview.y)})
              </span>
              <span>•</span>
              <span>Angle: {deg >= 0 ? deg : 360 + deg}°</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => onRotate(1)}
            className="px-2 sm:px-2.5 py-1 text-xs bg-[#475569] hover:bg-[#64748b] text-white font-bold rounded flex items-center gap-1 border border-slate-400 active:scale-95 transition-all cursor-pointer"
            title="Rotate 45° Clockwise (R)"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Rotate [R]</span>
          </button>

          <button
            onClick={onConfirm}
            className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm bg-[#16a34a] hover:bg-[#15803d] text-white font-bold rounded flex items-center gap-1.5 border-2 border-[#86efac] shadow-lg active:scale-95 transition-all cursor-pointer animate-pulse"
            title="Confirm Placement (Space)"
          >
            <Check className="w-4 h-4 text-white" />
            <span>Build Here [SPACE]</span>
          </button>

          <button
            onClick={onCancel}
            className="px-2.5 py-1 text-xs bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold rounded flex items-center gap-1 border border-red-400 active:scale-95 transition-all cursor-pointer"
            title="Cancel Placement (ESC)"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel [ESC]</span>
          </button>
        </div>

        <div className="text-[10px] text-gray-400 font-mono">
          Walk with WASD/Arrows to position holographic marker. Press SPACE to construct!
        </div>
      </div>
    </div>
  );
};
