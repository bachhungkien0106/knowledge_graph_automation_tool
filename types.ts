import { SimulationNodeDatum, SimulationLinkDatum } from 'd3';

export interface GraphNode extends SimulationNodeDatum {
  id: string;
  label: string;
  group: string; // e.g., 'Animal', 'Plant', 'Concept', 'Habitat'
  description?: string;
  val?: number; // Size weight

  // D3 Simulation properties
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export type RelationEffect = 'positive' | 'negative' | 'neutral';

export interface GraphLink extends SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  relation: string;
  effect: RelationEffect;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export enum NodeGroup {
  ANIMAL = 'Animal',
  PLANT = 'Plant',
  FUNGI = 'Fungi',
  HABITAT = 'Habitat',
  CONCEPT = 'Concept', // e.g., Photosynthesis
  ELEMENT = 'Element', // e.g., Water, Carbon
  UNKNOWN = 'Unknown'
}

export const GROUP_COLORS: Record<string, string> = {
  [NodeGroup.ANIMAL]: '#ef4444', // Red-500
  [NodeGroup.PLANT]: '#22c55e', // Green-500
  [NodeGroup.FUNGI]: '#a855f7', // Purple-500
  [NodeGroup.HABITAT]: '#0ea5e9', // Sky-500
  [NodeGroup.CONCEPT]: '#f59e0b', // Amber-500
  [NodeGroup.ELEMENT]: '#64748b', // Slate-500
  [NodeGroup.UNKNOWN]: '#94a3b8', // Slate-400
};

export type FetchStatus = 'idle' | 'loading' | 'success' | 'error';