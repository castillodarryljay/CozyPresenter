import React, { useState, useEffect, useRef, useMemo, Suspense, useLayoutEffect } from 'react';
import { Settings, Plus, Info, Edit, Trash2, X, Move, Share2, Copy, Check, Upload, AlertTriangle, ExternalLink, Gamepad2, MousePointer2, ArrowUp, ArrowDown, Map as MapIcon, Maximize2, Mountain, TreePine, Droplets, Cloud, Sparkles, RefreshCw, Layers } from 'lucide-react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  Text, 
  Billboard,
  Box,
  Html
} from '@react-three/drei';
import * as THREE from 'three';
import { Blackboard, MapSettings, Position, ViewMode, TerrainType } from './types';
import {
  getTerrainHeight,
  WATER_LEVEL,
  VoxelTerrainMesh,
  WaterMesh,
  NatureInstances,
  VoxelClouds,
} from './terrain';

// Constants
const STORAGE_KEY = 'cozy_presenter_data_v3_3d';
const PROXIMITY_THRESHOLD = 80; 
const WORLD_SCALE = 0.05; 
const FLOOR_SIZE_3D = 100; 
const MOVEMENT_LIMIT = (FLOOR_SIZE_3D / 2) / WORLD_SCALE - 15; 
const ZOOM_MAX = 100;

// Minecraft-y Defaults
const INITIAL_SETTINGS: MapSettings = {
  backgroundColor: '#5C9E57', // Grass Green
  characterColor: '#3B82F6', // Steve-ish Blue shirt
  floorImageUrl: '',
  terrainType: 'hills',
  terrainHeight: 1.0,
  hasTrees: true,
  hasWater: true,
  hasClouds: true,
  seed: 42,
};

const DEFAULT_BOARDS: Blackboard[] = [
  {
    id: 'welcome',
    x: 0,
    y: 80,
    title: 'Welcome to CozyPresenter!',
    description: 'Explore the 3D voxel terrain! Walk up stepped hills, discover water ponds, and wander past trees and flowers. Click or tap anywhere to move.',
    imageUrl: 'https://picsum.photos/seed/cozymc1/400/300'
  },
  {
    id: 'terrain_info',
    x: 140,
    y: -70,
    title: 'Terrain & Biomes',
    description: 'Open Settings in the top right to customize your world! Switch between Hills, Mountain Peaks, Plains, Desert Dunes, or Classic Flat terrain.',
    imageUrl: 'https://picsum.photos/seed/cozymc2/400/300'
  },
  {
    id: 'creator_tips',
    x: -150,
    y: -90,
    title: 'Custom World Creation',
    description: 'Hold press anywhere on the ground to plant a new signpost. You can edit titles, descriptions, and custom images at any time.',
    imageUrl: 'https://picsum.photos/seed/cozymc3/400/300'
  }
];

// --- 3D Components ---

const FloorDetails = ({ blackboards, settings }: { blackboards: Blackboard[], settings: MapSettings }) => {
  const grassRef = useRef<THREE.InstancedMesh>(null);
  const flowerRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const { grassData, flowerData } = useMemo(() => {
    const grass: { x: number; y: number; z: number; s: number }[] = [];
    const flowers: { x: number; y: number; z: number; color: string }[] = [];
    const size = FLOOR_SIZE_3D / 2 - 2;
    
    // Helper to check if a point is too close to any signpost
    const isTooClose = (x: number, z: number) => {
        for(const b of blackboards) {
            const bx = b.x * WORLD_SCALE;
            const bz = b.y * WORLD_SCALE;
            const dist = Math.sqrt((x - bx)**2 + (z - bz)**2);
            if (dist < 1.5) return true; // 1.5 unit radius clear zone
        }
        return false;
    };

    if (settings.terrainType === 'desert') {
      return { grassData: [], flowerData: [] };
    }

    // Grass
    for (let i = 0; i < 400; i++) {
       const x = (Math.random() - 0.5) * 2 * size;
       const z = (Math.random() - 0.5) * 2 * size;
       const y = getTerrainHeight(x, z, settings);
       if (y > WATER_LEVEL && !isTooClose(x, z)) {
         grass.push({ x, y, z, s: 0.6 + Math.random() * 0.4 });
       }
    }
    // Flowers
    for (let i = 0; i < 50; i++) {
       const x = (Math.random() - 0.5) * 2 * size;
       const z = (Math.random() - 0.5) * 2 * size;
       const y = getTerrainHeight(x, z, settings);
       if (y > WATER_LEVEL && !isTooClose(x, z)) {
         flowers.push({ x, y, z, color: Math.random() > 0.5 ? '#ffff00' : '#ff5555' });
       }
    }
    return { grassData: grass, flowerData: flowers };
  }, [blackboards, settings]);

  useLayoutEffect(() => {
    if (grassRef.current) {
      grassData.forEach((d, i) => {
        dummy.position.set(d.x, d.y + 0.15, d.z);
        dummy.rotation.set(0, Math.random() * Math.PI, 0);
        dummy.scale.set(1, d.s, 1);
        dummy.updateMatrix();
        grassRef.current!.setMatrixAt(i, dummy.matrix);
      });
      grassRef.current.instanceMatrix.needsUpdate = true;
    }
    
    if (flowerRef.current) {
       flowerData.forEach((d, i) => {
         dummy.position.set(d.x, d.y + 0.175, d.z);
         dummy.rotation.set(0, Math.random() * Math.PI, 0);
         dummy.scale.set(1, 1, 1);
         dummy.updateMatrix();
         flowerRef.current!.setMatrixAt(i, dummy.matrix);
         flowerRef.current!.setColorAt(i, new THREE.Color(d.color));
       });
       flowerRef.current.instanceMatrix.needsUpdate = true;
       if (flowerRef.current.instanceColor) flowerRef.current.instanceColor.needsUpdate = true;
    }
  }, [grassData, flowerData, dummy]);

  return (
    <>
      <instancedMesh ref={grassRef} args={[undefined, undefined, grassData.length]} receiveShadow>
        <boxGeometry args={[0.1, 0.3, 0.1]} />
        <meshStandardMaterial color="#66bb6a" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={flowerRef} args={[undefined, undefined, flowerData.length]} receiveShadow>
        <boxGeometry args={[0.15, 0.35, 0.15]} />
        <meshStandardMaterial color="white" roughness={1} />
      </instancedMesh>
    </>
  );
};

const Floor = ({ textureUrl, color, onPointerDown, onPointerUp, onPointerMove }: any) => {
  const texture = useMemo(() => {
    if (!textureUrl) return null;
    try {
        const t = new THREE.TextureLoader().load(textureUrl);
        // CRITICAL for Pixel Art look
        t.magFilter = THREE.NearestFilter;
        t.minFilter = THREE.NearestFilter;
        t.wrapS = THREE.RepeatWrapping;
        t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(1, 1);
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
    } catch (e) {
        console.warn("Failed to load floor texture", e);
        return null;
    }
  }, [textureUrl]);

  return (
    <mesh 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -0.5, 0]} // Shifted down so y=0 is the top of the block
      receiveShadow
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerMove={onPointerMove}
    >
      {/* Thick floor to look like a bedrock layer */}
      <boxGeometry args={[FLOOR_SIZE_3D, FLOOR_SIZE_3D, 1]} />
      {texture ? (
        <meshStandardMaterial map={texture} />
      ) : (
        <meshStandardMaterial color={color} roughness={1} />
      )}
    </mesh>
  );
};

// Simplified RoadPath that draws Manhattan (L-shaped) paths to look like Minecraft grid roads
const RoadPath = ({ points, settings }: { points: Blackboard[], settings: MapSettings }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const instances = useMemo(() => {
    if (!points || points.length < 2) return [];

    const mats: THREE.Matrix4[] = [];
    const dummy = new THREE.Object3D();
    const stepSize = 0.3; // Distance between path blocks

    for (let i = 0; i < points.length - 1; i++) {
        const startX = points[i].x * WORLD_SCALE;
        const startZ = points[i].y * WORLD_SCALE;
        const endX = points[i+1].x * WORLD_SCALE;
        const endZ = points[i+1].y * WORLD_SCALE;

        // L-Shape Path Generation: X-axis first, then Z-axis
        
        // 1. Move along X
        const distX = Math.abs(endX - startX);
        const countX = Math.ceil(distX / stepSize);
        
        for (let k = 0; k <= countX; k++) {
            const t = countX === 0 ? 0 : k / countX;
            const curX = THREE.MathUtils.lerp(startX, endX, t);
            const curY = getTerrainHeight(curX, startZ, settings);
            
            dummy.position.set(curX, curY + 0.05, startZ);
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            mats.push(dummy.matrix.clone());
        }

        // 2. Move along Z
        const distZ = Math.abs(endZ - startZ);
        const countZ = Math.ceil(distZ / stepSize);

        // Start from 1 to avoid overlap at the corner
        for (let k = 1; k <= countZ; k++) {
            const t = countZ === 0 ? 0 : k / countZ;
            const curZ = THREE.MathUtils.lerp(startZ, endZ, t);
            const curY = getTerrainHeight(endX, curZ, settings);
            
            dummy.position.set(endX, curY + 0.05, curZ); // Keep X constant at endX
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            mats.push(dummy.matrix.clone());
        }
    }
    return mats;
  }, [points, settings]);

  useLayoutEffect(() => {
    if (meshRef.current) {
        // Force update of matrices
        instances.forEach((mat, i) => {
            meshRef.current!.setMatrixAt(i, mat);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [instances]);

  if (instances.length === 0) return null;

  return (
    <instancedMesh 
      ref={meshRef} 
      args={[undefined, undefined, instances.length]} 
      frustumCulled={false} 
      receiveShadow
    >
       {/* Use a slightly flatter, wider block for the path */}
       <boxGeometry args={[0.28, 0.04, 0.28]} /> 
       <meshStandardMaterial color="#A0A0A0" roughness={0.9} />
    </instancedMesh>
  );
};

const Player3D = ({ position, color, settings }: { position: Position, color: string, settings: MapSettings }) => {
  const group = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  
  const initY = getTerrainHeight(position.x * WORLD_SCALE, position.y * WORLD_SCALE, settings);
  const prevPos = useRef(new THREE.Vector3(position.x * WORLD_SCALE, initY, position.y * WORLD_SCALE));

  useFrame((state, delta) => {
    if (group.current) {
      const targetX = position.x * WORLD_SCALE;
      const targetZ = position.y * WORLD_SCALE;

      // Snappier movement
      const x = THREE.MathUtils.lerp(group.current.position.x, targetX, delta * 10);
      const z = THREE.MathUtils.lerp(group.current.position.z, targetZ, delta * 10);
      const groundY = getTerrainHeight(x, z, settings);
      const targetY = groundY + 0.75;
      const y = THREE.MathUtils.lerp(group.current.position.y, targetY, delta * 12);
      
      group.current.position.x = x;
      group.current.position.y = y;
      group.current.position.z = z;

      const vx = x - prevPos.current.x;
      const vz = z - prevPos.current.z;
      const speed = Math.sqrt(vx * vx + vz * vz);
      
      if (speed > 0.0001) {
        group.current.lookAt(x + vx, y, z + vz);
      }

      const isMoving = speed > 0.001;
      
      // Minecraft Walking Animation (Swing arms and legs)
      if (leftLeg.current && rightLeg.current && leftArm.current && rightArm.current) {
        if (isMoving) {
          const t = state.clock.elapsedTime * 15;
          const swing = Math.sin(t);
          
          leftLeg.current.rotation.x = swing * 0.6;
          rightLeg.current.rotation.x = -swing * 0.6;
          
          leftArm.current.rotation.x = -swing * 0.6;
          rightArm.current.rotation.x = swing * 0.6;
        } else {
          leftLeg.current.rotation.x = THREE.MathUtils.lerp(leftLeg.current.rotation.x, 0, delta * 10);
          rightLeg.current.rotation.x = THREE.MathUtils.lerp(rightLeg.current.rotation.x, 0, delta * 10);
          leftArm.current.rotation.x = THREE.MathUtils.lerp(leftArm.current.rotation.x, 0, delta * 10);
          rightArm.current.rotation.x = THREE.MathUtils.lerp(rightArm.current.rotation.x, 0, delta * 10);
        }
      }

      prevPos.current.set(x, y, z);
    }
  });

  return (
    <group ref={group} position={[position.x * WORLD_SCALE, initY + 0.75, position.y * WORLD_SCALE]}>
        {/* Head */}
        <group position={[0, 0.75, 0]}>
            <Box args={[0.5, 0.5, 0.5]} castShadow>
                <meshStandardMaterial color="#FACC9A" roughness={1} /> {/* Skin tone */}
            </Box>
            {/* Eyes */}
            <Box position={[-0.1, 0, 0.26]} args={[0.08, 0.08, 0.05]}>
                <meshStandardMaterial color="white" />
            </Box>
            <Box position={[0.1, 0, 0.26]} args={[0.08, 0.08, 0.05]}>
                <meshStandardMaterial color="white" />
            </Box>
            <Box position={[-0.08, 0, 0.29]} args={[0.04, 0.04, 0.05]}>
                <meshStandardMaterial color="#4A4A4A" />
            </Box>
            <Box position={[0.12, 0, 0.29]} args={[0.04, 0.04, 0.05]}>
                <meshStandardMaterial color="#4A4A4A" />
            </Box>
        </group>

        {/* Torso */}
        <Box position={[0, 0.15, 0]} args={[0.5, 0.7, 0.25]} castShadow>
             <meshStandardMaterial color={color} roughness={1} />
        </Box>

        {/* Arms - Pivot at shoulder */}
        <group ref={leftArm} position={[-0.38, 0.45, 0]}>
            <Box position={[0, -0.3, 0]} args={[0.2, 0.7, 0.25]} castShadow>
                <meshStandardMaterial color={color} roughness={1} />
            </Box>
            {/* Hand */}
            <Box position={[0, -0.7, 0]} args={[0.2, 0.2, 0.25]}>
                <meshStandardMaterial color="#FACC9A" roughness={1} />
            </Box>
        </group>

        <group ref={rightArm} position={[0.38, 0.45, 0]}>
            <Box position={[0, -0.3, 0]} args={[0.2, 0.7, 0.25]} castShadow>
                <meshStandardMaterial color={color} roughness={1} />
            </Box>
            {/* Hand */}
            <Box position={[0, -0.7, 0]} args={[0.2, 0.2, 0.25]}>
                <meshStandardMaterial color="#FACC9A" roughness={1} />
            </Box>
        </group>

        {/* Legs - Pivot at hip */}
        <group ref={leftLeg} position={[-0.13, -0.2, 0]}>
             <Box position={[0, -0.35, 0]} args={[0.22, 0.7, 0.25]} castShadow>
                 <meshStandardMaterial color="#37305C" roughness={1} /> {/* Pants */}
             </Box>
        </group>

        <group ref={rightLeg} position={[0.13, -0.2, 0]}>
             <Box position={[0, -0.35, 0]} args={[0.22, 0.7, 0.25]} castShadow>
                 <meshStandardMaterial color="#37305C" roughness={1} />
             </Box>
        </group>

    </group>
  );
};

const Board3D = ({ data, isSelected, isNearby, onRead, settings }: any) => {
  const group = useRef<THREE.Group>(null);
  const bx = data.x * WORLD_SCALE;
  const bz = data.y * WORLD_SCALE;
  const by = getTerrainHeight(bx, bz, settings);

  const texture = useMemo(() => {
      if (!data.imageUrl) return null;
      try {
        const t = new THREE.TextureLoader().load(data.imageUrl);
        t.magFilter = THREE.NearestFilter; // Pixelated art
        return t;
      } catch (e) {
        return null;
      }
  }, [data.imageUrl]);
  
  const [hovered, setHover] = useState(false);

  useFrame((state) => {
    if (group.current) {
      // Bob up and down slightly like an item drop or just distinct
      const targetY = (isSelected || hovered) ? by + 0.1 : by;
      group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, targetY, 0.1);
    }
  });

  const woodColor = "#855E42"; // Dark Oak

  return (
    <group 
      ref={group} 
      position={[bx, by, bz]} 
      // Click handler removed to enforce proximity-only interaction
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      {/* Sign Post */}
      <Box position={[0, 0.75, 0]} args={[0.15, 1.5, 0.15]} castShadow>
        <meshStandardMaterial color={woodColor} roughness={1} />
      </Box>

      {/* Board/Sign Face */}
      <group position={[0, 1.8, 0]}>
        <Box args={[3.2, 2.2, 0.2]} castShadow>
          <meshStandardMaterial color={woodColor} roughness={1} />
        </Box>
        {/* Inner Lighter Wood Frame */}
        <Box args={[3.0, 2.0, 0.22]} position={[0,0,0]}>
            <meshStandardMaterial color="#A17454" roughness={1} />
        </Box>
        
        {/* Image Plane */}
        {texture && (
          <mesh position={[0, 0, 0.12]}>
            <planeGeometry args={[2.8, 1.8]} />
            <meshBasicMaterial map={texture} />
          </mesh>
        )}
        
        {/* Title Floating Above */}
        <Billboard position={[0, 1.5, 0]}>
            <Text 
                fontSize={0.5} 
                color="white" 
                anchorX="center" 
                anchorY="middle" 
                outlineWidth={0.04} 
                outlineColor="black"
            >
                {data.title}
            </Text>
        </Billboard>
      </group>
      
      {/* Read Sign Button (Floating Above) */}
      {isNearby && (
        <Html position={[0, 4, 0]} center distanceFactor={10} zIndexRange={[50, 0]}>
           <div className="animate-bounce">
             <MinecraftButton onClick={(e: any) => { e.stopPropagation(); onRead(); }} className="text-xl whitespace-nowrap border-2 shadow-xl">
               READ SIGN
             </MinecraftButton>
           </div>
        </Html>
      )}
    </group>
  );
};

const CameraRig = ({ target, zoom, pan, settings }: { target: Position, zoom: number, pan: {x: number, y: number}, settings: MapSettings }) => {
  useFrame((state, delta) => {
    // Safety check to prevent crashing if coordinates are NaN (causes blue screen)
    if (isNaN(target.x) || isNaN(target.y) || isNaN(pan.x) || isNaN(pan.y)) return;

    const tX = target.x * WORLD_SCALE + pan.x;
    const tZ = target.y * WORLD_SCALE + pan.y;
    const tY = getTerrainHeight(tX, tZ, settings);
    
    // Minecraft usually uses lower FOV for that "flat" feel, but standard 45 is okay.
    // Let's adjust offset to look more isometric
    const offsetH = zoom; 
    const offsetV = zoom * 0.8; 
    
    const desiredPos = new THREE.Vector3(tX, tY + offsetV, tZ + offsetH);
    
    state.camera.position.lerp(desiredPos, delta * 5); 
    state.camera.lookAt(tX, tY, tZ);
  });
  return null;
};

// --- UI Components ---

const MinecraftButton = ({ onClick, children, className = "", style = {} }: any) => (
  <button 
    onClick={onClick} 
    className={`mc-btn px-4 py-2 font-xl active:translate-y-1 ${className}`}
    style={{ fontFamily: "'VT323', monospace", fontSize: '1.25rem', ...style }}
  >
    {children}
  </button>
);

const Joystick = ({ onMove }: { onMove: (x: number, y: number) => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });

  const updateJoystick = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDist = rect.width / 2;
    if (distance > maxDist) {
      dx = (dx / distance) * maxDist;
      dy = (dy / distance) * maxDist;
    }
    setKnobPos({ x: dx, y: dy });
    onMove(dx / maxDist, dy / maxDist);
  };

  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    updateJoystick(clientX, clientY);
  };
  const handleMoveEvent = (e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    updateJoystick(clientX, clientY);
  };
  const handleEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    setKnobPos({ x: 0, y: 0 });
    onMove(0, 0);
  };

  return (
    <div className="fixed bottom-8 left-8 z-[60] w-32 h-32 md:hidden touch-none select-none pointer-events-auto"
         onTouchStart={handleStart} onTouchMove={handleMoveEvent} onTouchEnd={handleEnd}>
      <div ref={containerRef} className="w-full h-full bg-black/40 border-4 border-white relative shadow-[4px_4px_0px_#000]">
        <div className="absolute w-12 h-12 bg-[#7f7f7f] border-2 border-white relative shadow-md"
          style={{ left: '50%', top: '50%', transform: `translate(calc(-50% + ${knobPos.x}px), calc(-50% + ${knobPos.y}px))` }} />
      </div>
    </div>
  );
};

// --- Main App ---

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('presenter');
  const [blackboards, setBlackboards] = useState<Blackboard[]>([]);
  const [settings, setSettings] = useState<MapSettings>(INITIAL_SETTINGS);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [activeBoard, setActiveBoard] = useState<Blackboard | null>(null);
  const [editingBoard, setEditingBoard] = useState<Blackboard | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  
  // Movement State
  const [charPos, setCharPos] = useState<Position>({ x: 0, y: 0 });
  const [targetPos, setTargetPos] = useState<Position>({ x: 0, y: 0 });
  const [cameraZoom, setCameraZoom] = useState(12);
  const [cameraPan, setCameraPan] = useState<Position>({ x: 0, y: 0 });
  
  const charPosRef = useRef<Position>({ x: 0, y: 0 });
  const targetPosRef = useRef<Position>({ x: 0, y: 0 });
  
  const [nearbyBoard, setNearbyBoard] = useState<Blackboard | null>(null);
  const inputVector = useRef({ x: 0, y: 0 });
  const keysPressed = useRef<Set<string>>(new Set());

  const longPressTimer = useRef<number | null>(null);
  const pointerDownPos = useRef<{x: number, y: number} | null>(null);
  const pointerDownWorld = useRef<{x: number, y: number} | null>(null);
  const isDraggingMap = useRef(false);
  const lastCursorPos = useRef<{x: number, y: number} | null>(null);
  const pointers = useRef(new Map<number, {x: number, y: number}>());
  const lastPinchDist = useRef<number | null>(null);

  // Prevent "Ghost clicks" on map when closing UI
  const interactionCooldown = useRef(false);

  // Init
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dataParam = params.get('v');
    if (dataParam) {
      try {
        setViewMode('listener');
        const jsonStr = decodeURIComponent(atob(dataParam).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        const decoded = JSON.parse(jsonStr);
        setBlackboards(decoded.blackboards?.length ? decoded.blackboards : DEFAULT_BOARDS);
        setSettings({ ...INITIAL_SETTINGS, ...(decoded.settings || {}) });
      } catch (e) {
        console.error("Link decode failed", e);
        setBlackboards(DEFAULT_BOARDS);
      }
    } else {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setBlackboards(parsed.blackboards?.length ? parsed.blackboards : DEFAULT_BOARDS);
          setSettings({ ...INITIAL_SETTINGS, ...(parsed.settings || {}) });
        } catch (e) { 
          console.error("Load failed", e);
          setBlackboards(DEFAULT_BOARDS);
        }
      } else {
        setBlackboards(DEFAULT_BOARDS);
      }
    }
  }, []);

  // Save
  useEffect(() => {
    if (viewMode === 'presenter') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ blackboards, settings }));
    }
  }, [blackboards, settings, viewMode]);

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keysPressed.current.add(e.key.toLowerCase());
    const handleKeyUp = (e: KeyboardEvent) => keysPressed.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Game Loop
  useEffect(() => {
    let frameId: number;
    const moveSpeed = 4;
    let lastTime = performance.now();

    const update = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (activeBoard || editingBoard || shareLink || isAdminPanelOpen) {
        frameId = requestAnimationFrame(update);
        return;
      }

      let kx = 0; let ky = 0;
      const k = keysPressed.current;
      if (k.has('w') || k.has('arrowup')) ky -= 1;
      if (k.has('s') || k.has('arrowdown')) ky += 1;
      if (k.has('a') || k.has('arrowleft')) kx -= 1;
      if (k.has('d') || k.has('arrowright')) kx += 1;

      let dx = kx + inputVector.current.x;
      let dy = ky + inputVector.current.y;
      const mag = Math.sqrt(dx * dx + dy * dy);
      if (mag > 1) { dx /= mag; dy /= mag; }

      const hasInput = mag > 0.1;

      const currentPos = charPosRef.current;
      const currentTarget = targetPosRef.current;

      let nextX = currentPos.x;
      let nextY = currentPos.y;

      if (hasInput) {
        if (Math.abs(cameraPan.x) > 0.1 || Math.abs(cameraPan.y) > 0.1) {
            setCameraPan(p => ({ x: p.x * 0.9, y: p.y * 0.9 }));
        }

        nextX += dx * moveSpeed * dt * 50; 
        nextY += dy * moveSpeed * dt * 50;
        
        nextX = Math.max(-MOVEMENT_LIMIT, Math.min(MOVEMENT_LIMIT, nextX));
        nextY = Math.max(-MOVEMENT_LIMIT, Math.min(MOVEMENT_LIMIT, nextY));

        charPosRef.current = { x: nextX, y: nextY };
        targetPosRef.current = { x: nextX, y: nextY };
        
        setCharPos({ x: nextX, y: nextY });
        setTargetPos({ x: nextX, y: nextY });
      } else {
        const distToTargetX = currentTarget.x - currentPos.x;
        const distToTargetY = currentTarget.y - currentPos.y;
        const dist = Math.sqrt(distToTargetX * distToTargetX + distToTargetY * distToTargetY);
        
        if (dist > 0.5) {
            const step = Math.min(dist, moveSpeed * dt * 50);
            nextX = currentPos.x + (distToTargetX / dist) * step;
            nextY = currentPos.y + (distToTargetY / dist) * step;
            
            charPosRef.current = { x: nextX, y: nextY };
            setCharPos({ x: nextX, y: nextY });
        }
      }

      frameId = requestAnimationFrame(update);
    };
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [activeBoard, editingBoard, shareLink, isAdminPanelOpen, cameraPan]); 

  // Proximity
  useEffect(() => {
    let closest: Blackboard | null = null;
    let minDist = Infinity;
    blackboards.forEach(b => {
      const dx = (charPos.x - b.x);
      const dy = (charPos.y - b.y);
      const d = Math.sqrt(dx*dx + dy*dy);
      if (d < PROXIMITY_THRESHOLD && d < minDist) { minDist = d; closest = b; }
    });
    setNearbyBoard(closest);
  }, [charPos, blackboards]);

  // Helper to safely close modals and prevent click-through
  const closeUI = (setter: (val: any) => void) => {
    setter(null);
    interactionCooldown.current = true;
    setTimeout(() => { interactionCooldown.current = false; }, 400);
    // Reset target to prevent moving
    if (charPosRef.current) {
        targetPosRef.current = { ...charPosRef.current };
        setTargetPos({ ...charPosRef.current });
    }
  };

  // Interaction handlers... (Keeping mostly same logic, just stripped of unused variables if any)
  const handleFloorPointerDown = (e: any) => {
    e.stopPropagation();
    if (activeBoard || editingBoard || isAdminPanelOpen || shareLink || interactionCooldown.current) return;
    
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    
    if (pointers.current.size === 1) {
        pointerDownPos.current = { x: e.clientX, y: e.clientY };
        pointerDownWorld.current = { x: e.point.x / WORLD_SCALE, y: e.point.z / WORLD_SCALE };
        isDraggingMap.current = false;
        lastCursorPos.current = { x: e.clientX, y: e.clientY };

        longPressTimer.current = window.setTimeout(() => {
          if (viewMode === 'presenter' && pointerDownWorld.current && !isDraggingMap.current && pointers.current.size === 1) {
            addBoardAt(pointerDownWorld.current.x, pointerDownWorld.current.y);
            pointerDownWorld.current = null;
          }
          longPressTimer.current = null;
        }, 600);
    }
  };

  const handleFloorPointerMove = (e: any) => {
    if (activeBoard || editingBoard || isAdminPanelOpen || shareLink || interactionCooldown.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
        const points = Array.from(pointers.current.values());
        const p1 = points[0] as {x: number, y: number};
        const p2 = points[1] as {x: number, y: number};
        const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

        if (lastPinchDist.current !== null) {
            const delta = dist - lastPinchDist.current;
            setCameraZoom(prev => Math.max(2, Math.min(ZOOM_MAX, prev - delta * 0.05)));
        }
        lastPinchDist.current = dist;
        isDraggingMap.current = true;
        if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
        return; 
    } else {
        lastPinchDist.current = null;
    }

    if (pointers.current.size === 1 && pointerDownPos.current) {
        const dist = Math.hypot(e.clientX - pointerDownPos.current.x, e.clientY - pointerDownPos.current.y);
        if (dist > 5) {
            isDraggingMap.current = true;
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
            }
        }

        if (isDraggingMap.current) {
            const lastX = lastCursorPos.current?.x ?? e.clientX;
            const lastY = lastCursorPos.current?.y ?? e.clientY;
            
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;

            const factor = (cameraZoom * 1.5) / window.innerHeight;

            setCameraPan((prev: Position) => ({
                x: prev.x - dx * factor * 2,
                y: prev.y - dy * factor * 2
            }));
        }
    }
    lastCursorPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleFloorPointerUp = (e: any) => {
    pointers.current.delete(e.pointerId);

    if (pointers.current.size === 0) {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }

        if (!isDraggingMap.current && pointerDownWorld.current && !interactionCooldown.current && !activeBoard && !editingBoard) {
            const { x, y } = pointerDownWorld.current;
            targetPosRef.current = { x, y };
            setTargetPos({ x, y });
        }

        pointerDownPos.current = null;
        pointerDownWorld.current = null;
        isDraggingMap.current = false;
        lastCursorPos.current = null;
        lastPinchDist.current = null;
    } else if (pointers.current.size < 2) {
        lastPinchDist.current = null;
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey) {
        const delta = e.deltaY * 0.01;
        setCameraZoom(prev => Math.max(2, Math.min(ZOOM_MAX, prev + delta)));
    } else {
        const delta = e.deltaY * 0.05;
        setCameraZoom(prev => Math.max(2, Math.min(ZOOM_MAX, prev + delta)));
    }
  };

  const addBoardAt = (x: number, y: number) => {
    const b: Blackboard = { 
      id: Math.random().toString(36).substr(2, 9), 
      x, y, 
      title: "New Sign", 
      description: "", 
      imageUrl: "https://picsum.photos/seed/"+Math.random()+"/400/300" 
    };
    setBlackboards(prev => [...prev, b]);
    setEditingBoard(b);
  };

  const moveBoard = (index: number, direction: number) => {
    setBlackboards(prev => {
      const newList = [...prev];
      const targetIndex = index + direction;
      if (targetIndex >= 0 && targetIndex < newList.length) {
        [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
      }
      return newList;
    });
  };

  const handleShare = () => {
    try {
      const data = JSON.stringify({ blackboards, settings });
      const encoded = btoa(encodeURIComponent(data).replace(/%([0-9A-F]{2})/g, (m, p1) => String.fromCharCode(parseInt(p1, 16))));
      const url = `${window.location.origin}${window.location.pathname}?v=${encoded}`;
      setShareLink(url);
    } catch (e) { setShareError("Data too large."); }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none text-white font-['VT323']" onWheel={handleWheel}>
      
      {/* 3D Scene */}
      <Canvas shadows camera={{ fov: 40, far: 1000 }}>
        {/* Dynamic sky and fog matched to biome */}
        <color 
          attach="background" 
          args={[
            settings.terrainType === 'desert' ? '#dfc08f' : 
            settings.terrainType === 'mountains' ? '#9ec7e8' : '#87CEEB'
          ]} 
        /> 
        <fog 
          attach="fog" 
          args={[
            settings.terrainType === 'desert' ? '#eed6a9' : 
            settings.terrainType === 'mountains' ? '#b4d4ed' : '#87CEEB', 
            35, 
            190
          ]} 
        />
        <ambientLight intensity={0.7} />
        <directionalLight 
            position={[50, 80, 50]} 
            intensity={1.25} 
            castShadow 
            shadow-mapSize={[2048, 2048]} 
            shadow-camera-left={-75}
            shadow-camera-right={75}
            shadow-camera-top={75}
            shadow-camera-bottom={-75}
        />
        
        <Suspense fallback={null}>
          <CameraRig target={charPos} zoom={cameraZoom} pan={cameraPan} settings={settings} />
          
          {/* Procedural Voxel 3D Terrain */}
          <VoxelTerrainMesh
            settings={settings}
            floorSize={FLOOR_SIZE_3D}
            onPointerDown={handleFloorPointerDown}
            onPointerUp={handleFloorPointerUp}
            onPointerMove={handleFloorPointerMove}
          />

          {/* Animated Water */}
          <WaterMesh
            floorSize={FLOOR_SIZE_3D}
            visible={settings.hasWater !== false && settings.terrainType !== 'flat'}
          />

          {/* Instanced Trees, Rocks, Reeds, Lily pads */}
          <NatureInstances
            settings={settings}
            blackboards={blackboards}
            floorSize={FLOOR_SIZE_3D}
          />
          
          <FloorDetails blackboards={blackboards} settings={settings} />

          <RoadPath points={blackboards} settings={settings} />

          <Player3D position={charPos} color={settings.characterColor} settings={settings} />

          {/* Drifting Minecraft clouds */}
          <VoxelClouds visible={settings.hasClouds !== false} />

          {blackboards.map((b, i) => (
            <Board3D 
              key={b.id} 
              data={b} 
              mode={viewMode}
              isSelected={activeBoard?.id === b.id}
              isNearby={!activeBoard && nearbyBoard?.id === b.id}
              onRead={() => setActiveBoard(b)}
              settings={settings}
            />
          ))}
        </Suspense>
      </Canvas>

      {/* --- UI Layer --- */}
      <div className="absolute inset-0 pointer-events-none">
        {!isAdminPanelOpen && !activeBoard && !editingBoard && !shareLink && !fullscreenImage && (
           <Joystick onMove={(x, y) => { inputVector.current = { x, y }; }} />
        )}

        {/* Top Controls */}
        <div className="absolute top-4 right-4 pointer-events-auto flex flex-col gap-3 items-end">
          {viewMode === 'presenter' && (
            <MinecraftButton onClick={() => setIsAdminPanelOpen(true)}>
              <Settings className="w-6 h-6 inline-block mr-2" /> Settings
            </MinecraftButton>
          )}
          {viewMode === 'presenter' && (
            <MinecraftButton onClick={handleShare} className="bg-[#6366f1]! border-[#818cf8]! text-white">
              <Share2 className="w-6 h-6 inline-block mr-2" /> Share
            </MinecraftButton>
          )}
        </div>

        {/* HUD */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 mc-panel px-6 py-2 flex items-center gap-6 pointer-events-auto text-black">
           <div className="flex items-center gap-2 font-bold text-xl">
             <span className="hidden md:flex items-center gap-2"><Move className="w-5 h-5" /> TAP TO MOVE</span>
             <span className="md:hidden flex items-center gap-2"><Gamepad2 className="w-5 h-5" /> USE JOYSTICK</span>
           </div>
           {viewMode === 'presenter' && (
             <>
               <div className="w-1 h-8 bg-gray-500 border-r border-white" />
               <div className="flex items-center gap-2 font-bold text-xl"><MousePointer2 className="w-5 h-5" /> HOLD TO ADD SIGN</div>
             </>
           )}
        </div>

        {/* Panels */}
        {viewMode === 'presenter' && isAdminPanelOpen && (
          <div className="absolute top-0 right-0 h-full w-full md:w-96 mc-panel p-0 pointer-events-auto overflow-y-auto z-50 flex flex-col" onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center p-4 bg-[#a0a0a0] border-b-2 border-[#555]">
              <h2 className="text-3xl text-black drop-shadow-sm flex items-center gap-3">Editor</h2>
              <button onClick={(e) => { e.stopPropagation(); closeUI(setIsAdminPanelOpen); }} className="mc-btn w-8 h-8 flex items-center justify-center"><X /></button>
            </div>
            
            <div className="p-4 space-y-5 flex-1 bg-[#c6c6c6]">
                {/* Terrain Settings */}
                <section>
                  <label className="text-xl text-[#404040] mb-2 block flex items-center gap-2">
                    <Mountain className="w-5 h-5 inline text-black" /> Terrain & Biomes
                  </label>
                  <div className="space-y-3 bg-[#b0b0b0] p-3 border-2 border-[#555] shadow-inner">
                    {/* Biome selection */}
                    <div>
                      <span className="text-lg text-black block mb-1">Biome Preset</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { id: 'hills', label: 'Rolling Hills' },
                          { id: 'mountains', label: 'Mountain Peaks' },
                          { id: 'plains', label: 'Flat Plains' },
                          { id: 'desert', label: 'Desert Dunes' },
                          { id: 'flat', label: 'Superflat' },
                        ].map(biome => (
                          <button
                            key={biome.id}
                            type="button"
                            onClick={() => setSettings(s => ({ ...s, terrainType: biome.id as TerrainType }))}
                            className={`mc-btn text-sm py-1.5 px-2 text-center truncate ${
                              (settings.terrainType || 'hills') === biome.id 
                                ? 'bg-[#55aa55]! text-white border-[#88ff88]!' 
                                : ''
                            }`}
                          >
                            {biome.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Terrain Elevation / Height */}
                    {settings.terrainType !== 'flat' && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-lg text-black">Elevation</span>
                          <span className="text-sm font-mono text-[#333]">
                            {(settings.terrainHeight ?? 1.0).toFixed(1)}x
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                          {[
                            { label: 'Low', val: 0.5 },
                            { label: 'Normal', val: 1.0 },
                            { label: 'High', val: 1.5 },
                            { label: 'Epic', val: 2.0 },
                          ].map(opt => (
                            <button
                              key={opt.val}
                              type="button"
                              onClick={() => setSettings(s => ({ ...s, terrainHeight: opt.val }))}
                              className={`mc-btn text-xs py-1 ${
                                (settings.terrainHeight ?? 1.0) === opt.val
                                  ? 'bg-[#55aa55]! text-white border-[#88ff88]!'
                                  : ''
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Natural features toggles */}
                    <div className="space-y-1.5 pt-1 border-t border-[#888]">
                      <span className="text-lg text-black block">Natural Elements</span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setSettings(s => ({ ...s, hasTrees: !s.hasTrees }))}
                          className={`mc-btn text-sm py-1 px-2.5 flex items-center gap-1.5 ${
                            settings.hasTrees !== false ? 'bg-[#407a3c]! text-white' : 'opacity-60'
                          }`}
                        >
                          <TreePine className="w-4 h-4" /> Trees: {settings.hasTrees !== false ? 'ON' : 'OFF'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSettings(s => ({ ...s, hasWater: !s.hasWater }))}
                          className={`mc-btn text-sm py-1 px-2.5 flex items-center gap-1.5 ${
                            settings.hasWater !== false ? 'bg-[#3b82f6]! text-white' : 'opacity-60'
                          }`}
                        >
                          <Droplets className="w-4 h-4" /> Water: {settings.hasWater !== false ? 'ON' : 'OFF'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSettings(s => ({ ...s, hasClouds: !s.hasClouds }))}
                          className={`mc-btn text-sm py-1 px-2.5 flex items-center gap-1.5 ${
                            settings.hasClouds !== false ? 'bg-[#6b7280]! text-white' : 'opacity-60'
                          }`}
                        >
                          <Cloud className="w-4 h-4" /> Clouds: {settings.hasClouds !== false ? 'ON' : 'OFF'}
                        </button>
                      </div>
                    </div>

                    {/* Seed regeneration */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setSettings(s => ({ ...s, seed: Math.floor(Math.random() * 100000) }))}
                        className="mc-btn w-full text-sm py-1.5 flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" /> Regenerate World Seed
                      </button>
                    </div>
                  </div>
                </section>

                <section>
                <label className="text-xl text-[#404040] mb-2 block">World Aesthetics</label>
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-[#b0b0b0] p-2 border-2 border-[#555] shadow-inner">
                        <span className="text-xl text-black">Grass / Ground Tint</span>
                        <input type="color" value={settings.backgroundColor} onChange={e => setSettings({ ...settings, backgroundColor: e.target.value })} className="w-8 h-8 cursor-pointer border-2 border-black p-0" />
                    </div>
                    
                    <div className="bg-[#b0b0b0] p-2 border-2 border-[#555] shadow-inner">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xl text-black">Floor Texture (Superflat)</span>
                            <button onClick={() => window.open('https://postimages.org', '_blank')} className="mc-btn text-sm px-2 py-1 flex items-center gap-1">
                                <Upload className="w-3 h-3" /> Upload
                            </button>
                        </div>
                        <input 
                            type="text" 
                            placeholder="Image URL..." 
                            value={settings.floorImageUrl || ''} 
                            onChange={e => setSettings({ ...settings, floorImageUrl: e.target.value })} 
                            className="mc-input w-full px-2 py-1 text-lg" 
                        />
                    </div>

                    <div className="flex justify-between items-center bg-[#b0b0b0] p-2 border-2 border-[#555] shadow-inner">
                        <span className="text-xl text-black">Shirt Color</span>
                        <input type="color" value={settings.characterColor} onChange={e => setSettings({ ...settings, characterColor: e.target.value })} className="w-8 h-8 cursor-pointer border-2 border-black p-0" />
                    </div>
                </div>
                </section>

                <section>
                <label className="text-xl text-[#404040] mb-2 block">Signposts</label>
                <div className="space-y-2">
                    {blackboards.map((b, i) => (
                    <div key={b.id} className="flex items-center justify-between p-2 bg-[#b0b0b0] border-2 border-[#555]">
                        <div className="flex flex-col">
                        <span className="text-xl text-black truncate w-32">{b.title}</span>
                        <div className="flex gap-1 mt-1">
                            <button onClick={() => moveBoard(i, -1)} disabled={i === 0} className="mc-btn p-1 w-6 h-6 flex items-center justify-center disabled:opacity-50"><ArrowUp className="w-3 h-3" /></button>
                            <button onClick={() => moveBoard(i, 1)} disabled={i === blackboards.length - 1} className="mc-btn p-1 w-6 h-6 flex items-center justify-center disabled:opacity-50"><ArrowDown className="w-3 h-3" /></button>
                        </div>
                        </div>
                        <div className="flex gap-2">
                        <button onClick={() => setEditingBoard(b)} className="mc-btn p-2"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => setBlackboards(prev => prev.filter((board: Blackboard) => board.id !== b.id))} className="mc-btn p-2 bg-[#ff5555]! border-[#ffaaaa]!"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </div>
                    ))}
                    {blackboards.length === 0 && <p className="text-center text-lg text-[#555] py-4">Hold press on ground to build.</p>}
                </div>
                </section>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {shareLink && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-auto bg-black/80" onMouseDown={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
            <div className="w-full max-w-lg mc-panel p-6 flex flex-col items-center gap-6">
              <h2 className="text-3xl text-black">Share World</h2>
              <div className="flex w-full gap-2 bg-[#8b8b8b] p-2 border-2 border-[#333]">
                <input type="text" readOnly value={shareLink} className="flex-grow bg-transparent px-3 text-lg font-mono text-white outline-none" />
                <MinecraftButton onClick={() => { navigator.clipboard.writeText(shareLink!); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </MinecraftButton>
              </div>
              <MinecraftButton onClick={(e: any) => { e.stopPropagation(); closeUI(setShareLink); }} className="bg-[#ff5555]!">Close</MinecraftButton>
            </div>
          </div>
        )}

        {/* Fullscreen Board View */}
        {activeBoard && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center pointer-events-auto bg-black/90 animate-in fade-in" onMouseDown={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
            <button onClick={(e) => { e.stopPropagation(); closeUI(setActiveBoard); }} className="absolute top-6 right-6 p-4 text-white hover:bg-white/10"><X className="w-8 h-8" /></button>
            <div className="max-w-4xl max-h-[90vh] p-6 flex flex-col items-center mc-panel bg-[#c6c6c6]! border-4! border-white! shadow-[0_0_0_4px_black] relative">
              <div className="relative group cursor-zoom-in" onClick={() => setFullscreenImage(activeBoard.imageUrl)}>
                <img src={activeBoard.imageUrl} className="max-w-full max-h-[60vh] object-contain border-4 border-black bg-black mb-6" style={{imageRendering: 'pixelated'}} />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                  <Maximize2 className="text-white opacity-0 group-hover:opacity-100 w-12 h-12 drop-shadow-lg" />
                </div>
              </div>
              <h2 className="text-4xl text-black mb-4 underline decoration-4 decoration-black/20">{activeBoard.title}</h2>
              <p className="text-black text-2xl text-center max-w-2xl font-mono leading-tight">{activeBoard.description}</p>
            </div>
          </div>
        )}

        {/* Fullscreen Image Lightbox */}
        {fullscreenImage && (
            <div 
                className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200 pointer-events-auto"
                onClick={(e) => { e.stopPropagation(); closeUI(setFullscreenImage); }}
                onPointerDown={e => e.stopPropagation()}
            >
                <img src={fullscreenImage} className="max-w-full max-h-full object-contain drop-shadow-2xl" onClick={e => e.stopPropagation()} />
                <button className="absolute top-4 right-4 text-white p-2 bg-black/50 rounded-full hover:bg-white/20" onClick={(e) => { e.stopPropagation(); closeUI(setFullscreenImage); }}>
                    <X className="w-8 h-8" />
                </button>
            </div>
        )}

        {/* Editor Modal */}
        {editingBoard && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-auto bg-black/60 backdrop-blur-sm" onMouseDown={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
            <div className="w-full max-w-md mc-panel p-6 flex flex-col gap-6">
              <div className="flex justify-between items-center border-b-2 border-black/20 pb-2">
                <h2 className="text-3xl text-black">Edit Sign</h2>
                <button onClick={(e) => { e.stopPropagation(); closeUI(setEditingBoard); }} className="mc-btn w-8 h-8 flex items-center justify-center"><X /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xl text-black block mb-1">Title</label>
                  <input type="text" value={editingBoard.title} onChange={e => setEditingBoard({ ...editingBoard, title: e.target.value })} className="mc-input w-full p-2 text-xl" />
                </div>
                <div>
                   <label className="text-xl text-black block mb-1">Image URL</label>
                   <div className="flex gap-2 mb-2">
                      <MinecraftButton onClick={() => window.open('https://postimages.org', '_blank')} className="text-sm py-1 flex-1">
                        <Upload className="w-4 h-4 inline mr-2" /> Upload Image
                      </MinecraftButton>
                   </div>
                   <input type="text" value={editingBoard.imageUrl} onChange={e => setEditingBoard({ ...editingBoard, imageUrl: e.target.value })} className="mc-input w-full p-2 text-xl" />
                </div>
                <div>
                    <label className="text-xl text-black block mb-1">Description</label>
                    <textarea rows={3} value={editingBoard.description} onChange={e => setEditingBoard({ ...editingBoard, description: e.target.value })} className="mc-input w-full p-2 text-xl resize-none"></textarea>
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                <MinecraftButton onClick={(e: any) => { e.stopPropagation(); closeUI(setEditingBoard); }} className="flex-1 bg-[#ff5555]! border-[#ffaaaa]!">Cancel</MinecraftButton>
                <MinecraftButton onClick={() => { setBlackboards(prev => prev.map(b => b.id === editingBoard.id ? editingBoard : b)); closeUI(setEditingBoard); }} className="flex-1 bg-[#55ff55]! border-[#aaffaa]! text-black!">Save</MinecraftButton>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default App;