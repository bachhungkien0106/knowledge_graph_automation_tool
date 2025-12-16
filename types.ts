import { SimulationNodeDatum, SimulationLinkDatum } from 'd3';

export interface GraphNode extends SimulationNodeDatum {
  id: string;
  label: string;
  ticker?: string; // e.g., AAPL, BTC
  group: string; // Asset Class
  description?: string;
  val?: number; // Market Cap or Portfolio Weight
  rank?: number; // PageRank score (0-100)
  
  // Financial State
  sentiment?: 'bullish' | 'neutral' | 'bearish' | 'volatile';

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
  relation: string; // e.g., "Hedges", "Correlated to", "Competes with"
  effect: RelationEffect; // Positive = Moves together, Negative = Inverse
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface ResearchResult {
  summary: string;
  newNode: {
    label: string;
    group: string;
    description: string;
  };
  connections: {
    targetNodeLabel: string;
    relation: string;
    effect: RelationEffect;
  }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export enum NodeGroup {
  EQUITY = 'Equity',       // Stocks
  ETF = 'ETF',            // Funds
  CRYPTO = 'Crypto',      // Digital Assets
  COMMODITY = 'Commodity', // Gold, Oil
  MACRO = 'Macro',        // Interest Rates, Inflation
  SECTOR = 'Sector',      // Tech, Energy
  CONCEPT = 'Concept',    // Strategies, Trends (e.g., "AI Boom", "Recession")
  UNKNOWN = 'Unknown'
}

export const GROUP_COLORS: Record<string, string> = {
  [NodeGroup.EQUITY]: '#3b82f6',    // Blue
  [NodeGroup.ETF]: '#8b5cf6',       // Violet
  [NodeGroup.CRYPTO]: '#f59e0b',    // Orange (Bitcoin-ish)
  [NodeGroup.COMMODITY]: '#ef4444', // Red
  [NodeGroup.MACRO]: '#64748b',     // Slate
  [NodeGroup.SECTOR]: '#10b981',    // Emerald
  [NodeGroup.CONCEPT]: '#ec4899',   // Pink/Fuchsia
  [NodeGroup.UNKNOWN]: '#94a3b8',   // Slate-400
};

export type FetchStatus = 'idle' | 'loading' | 'success' | 'error';