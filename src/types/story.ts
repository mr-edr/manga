export type PageId = 'story' | 'characters' | 'storyboard' | 'memory' | 'settings';

export type StoryboardMode = 'manga' | 'movie';

export type VisualStyle =
  | 'bw_manga'
  | 'colored_manga'
  | 'anime'
  | 'cinematic_storyboard'
  | 'graphic_novel'
  | 'webtoon'
  | 'custom';

export interface VisualStyleOption {
  id: VisualStyle;
  label: string;
  description: string;
  promptFragment: string;
}

export type AspectRatio = 'portrait' | 'square' | 'landscape';

export interface Character {
  id: string;
  name: string;
  age: number | null;
  appearance: string;
  personality: string;
  role: string;
  visual_traits: string[];
  outfit: string;
  canonicalImage: string | null;
  referenceImages: string[];
  isCanonical: boolean;
}

export interface CharacterState {
  characterId: string;
  location: string;
  outfit: string;
  emotion: string;
  injuries: string;
  notes: string;
  relationships: { targetId: string; type: string; description: string }[];
}

export interface StoryLocation {
  id: string;
  name: string;
  description: string;
  visual_traits: string[];
}

export interface StoryObject {
  id: string;
  name: string;
  description: string;
}

export interface Relationship {
  from: string;
  to: string;
  type: string;
  description: string;
}

export type MemoryType =
  | 'character'
  | 'event'
  | 'relationship'
  | 'location'
  | 'object'
  | 'dialogue'
  | 'lore'
  | 'scene';

export interface StoryMemory {
  id: string;
  text: string;
  type: MemoryType;
  chapter: number;
  scene: number;
  characters: string[];
  timestamp: number;
}

export interface StoryEvent {
  id: string;
  description: string;
  characters: string[];
  chapter: number;
  scene: number;
}

export interface PanelSpecification {
  shot_type: string;
  camera_angle: string;
  characters: string[];
  action: string;
  emotion: Record<string, string>;
  location: string;
  lighting: string;
  composition: string;
  continuity_constraints: string[];
  panel_description: string;
}

export interface Panel {
  id: string;
  number: number;
  sceneNumber: number;
  image: string | null;
  spec: PanelSpecification;
  description: string;
  characters: string[];
  continuity: ContinuityReport | null;
  generating: boolean;
  createdAt: number;
}

export interface ContinuityReport {
  score: number;
  checks: {
    character_consistency: number;
    outfit_consistency: number;
    location_consistency: number;
    story_consistency: number;
  };
  warnings: string[];
}

export interface GenerationContext {
  story_context: string;
  relevant_memories: StoryMemory[];
  characters: { id: string; name: string; appearance: string; outfit: string; visual_traits: string[] }[];
  locations: StoryLocation[];
  objects: StoryObject[];
  previous_panel: string | null;
  visual_style: string;
  continuity_constraints: string[];
}

export interface ProjectSettings {
  visualStyle: VisualStyle;
  customStyle: string;
  aspectRatio: AspectRatio;
  storyboardMode: StoryboardMode;
}

export interface Project {
  id: string;
  name: string;
  story: string;
  title: string;
  genre: string;
  tone: string;
  visual_style: string;
  currentScene: string;
  currentSceneDescription: string;
  characters: Character[];
  characterStates: CharacterState[];
  locations: StoryLocation[];
  objects: StoryObject[];
  relationships: Relationship[];
  events: StoryEvent[];
  memories: StoryMemory[];
  panels: Panel[];
  settings: ProjectSettings;
  chapter: number;
  scene: number;
  isDemo: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface AnalysisResult {
  title: string;
  genre: string;
  tone: string;
  visual_style: string;
  characters: Omit<Character, 'canonicalImage' | 'referenceImages' | 'isCanonical'>[];
  locations: StoryLocation[];
  objects: StoryObject[];
  relationships: Relationship[];
  events: StoryEvent[];
  current_scene: string;
  current_scene_description: string;
}
