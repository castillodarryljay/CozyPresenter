import React, { useRef, useState, useCallback, useEffect } from 'react';

interface VirtualJoystickProps {
  onMove: (x: number, y: number) => void;
  size?: number;
  className?: string;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  onMove,
  size = 96,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const touchIdRef = useRef<number | null>(null);

  const radius = size / 2;
  const maxKnobDist = radius - 14;

  const updateFromCoords = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let dx = clientX - centerX;
      let dy = clientY - centerY;
      const distance = Math.hypot(dx, dy);

      if (distance > maxKnobDist) {
        dx = (dx / distance) * maxKnobDist;
        dy = (dy / distance) * maxKnobDist;
      }

      setKnobPos({ x: dx, y: dy });
      // Output normalized values (-1 to 1)
      onMove(dx / maxKnobDist, dy / maxKnobDist);
    },
    [maxKnobDist, onMove]
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (touchIdRef.current === null && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      touchIdRef.current = touch.identifier;
      setIsActive(true);
      updateFromCoords(touch.clientX, touch.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (touchIdRef.current !== null) {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchIdRef.current) {
          updateFromCoords(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
          break;
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (touchIdRef.current !== null) {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchIdRef.current) {
          touchIdRef.current = null;
          setIsActive(false);
          setKnobPos({ x: 0, y: 0 });
          onMove(0, 0);
          break;
        }
      }
    }
  };

  // Mouse fallback for testing or hybrid screen dragging
  const isMouseDownRef = useRef(false);
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    isMouseDownRef.current = true;
    setIsActive(true);
    updateFromCoords(e.clientX, e.clientY);

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isMouseDownRef.current) return;
      updateFromCoords(moveEvent.clientX, moveEvent.clientY);
    };

    const onMouseUp = () => {
      isMouseDownRef.current = false;
      setIsActive(false);
      setKnobPos({ x: 0, y: 0 });
      onMove(0, 0);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const angleRad = Math.atan2(knobPos.y, knobPos.x);
  const currentDist = Math.hypot(knobPos.x, knobPos.y);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleMouseDown}
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`relative touch-none select-none pointer-events-auto flex items-center justify-center rounded-full bg-[#161412]/80 border-2 ${
        isActive ? 'border-[#38bdf8] shadow-[0_0_16px_rgba(56,189,248,0.5)]' : 'border-[#4a3f35]/90'
      } backdrop-blur-md shadow-2xl transition-colors ${className}`}
      title="Virtual Movement Stick"
    >
      {/* Outer D-Pad directional notches */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/20" />
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/20" />
      <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/20" />
      <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/20" />

      {/* Inner reticle ring */}
      <div className="w-8 h-8 rounded-full border border-dashed border-white/20 pointer-events-none" />

      {/* Directional Pointer Arrow (only when active and moved) */}
      {isActive && currentDist > 8 && (
        <div
          className="absolute w-2 h-2 border-t-2 border-r-2 border-[#38bdf8] pointer-events-none"
          style={{
            left: `calc(50% + ${Math.cos(angleRad) * (radius - 8)}px)`,
            top: `calc(50% + ${Math.sin(angleRad) * (radius - 8)}px)`,
            transform: `translate(-50%, -50%) rotate(${angleRad + Math.PI / 4}rad)`,
          }}
        />
      )}

      {/* Floating Joystick Knob */}
      <div
        className={`absolute w-10 h-10 rounded-full border-2 shadow-lg flex items-center justify-center pointer-events-none transition-transform duration-75 ${
          isActive
            ? 'bg-gradient-to-br from-[#0284c7] to-[#0369a1] border-[#7dd3fc] shadow-[0_0_12px_rgba(56,189,248,0.7)] scale-110'
            : 'bg-gradient-to-br from-[#38312b] to-[#241f1a] border-[#6b5e52]'
        }`}
        style={{
          left: '50%',
          top: '50%',
          transform: `translate(calc(-50% + ${knobPos.x}px), calc(-50% + ${knobPos.y}px))`,
        }}
      >
        <div
          className={`w-3.5 h-3.5 rounded-full ${
            isActive ? 'bg-[#e0f2fe] shadow-[0_0_6px_#fff]' : 'bg-[#a8998a]'
          }`}
        />
      </div>
    </div>
  );
};
