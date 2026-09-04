
export interface Position {
  x: number;
  y: number;
}

export interface Blackboard {
  id: string;
  x: number;
  y: number;
  title: string;
  description: string;
  imageUrl: string;
}

export type TerrainType = 'hills' | 'mountains' | 'plains' | 'desert' | 'flat';

export interface MapSettings {
  backgroundColor: string;
  floorImageUrl?: string;
  characterColor: string;
  terrainType?: TerrainType;
  terrainHeight?: number;
  hasTrees?: boolean;
  hasWater?: boolean;
  hasClouds?: boolean;
  seed?: number;
}

export interface AppState {
  blackboards: Blackboard[];
  settings: MapSettings;
}

export type ViewMode = 'presenter' | 'listener';
