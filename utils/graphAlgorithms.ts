import { GraphNode, GraphLink } from '../types';

/**
 * Calculates PageRank for graph nodes to determine their ecological importance.
 * Higher rank = more connections flowing into/through the node.
 */
export const calculateNodeRanks = (nodes: GraphNode[], links: GraphLink[]): GraphNode[] => {
  if (nodes.length === 0) return nodes;

  // Configuration
  const dampingFactor = 0.85;
  const iterations = 20;

  // Initialize ranks
  let ranks: Record<string, number> = {};
  nodes.forEach(n => {
    ranks[n.id] = 1 / nodes.length;
  });

  // Pre-process links for faster lookup
  // We need to know:
  // 1. Who points TO node X? (Inbound)
  // 2. How many outgoing links does node Y have? (OutDegree)
  
  const inboundMap: Record<string, string[]> = {}; // nodeId -> list of sourceNodeIds
  const outDegree: Record<string, number> = {};    // nodeId -> count

  nodes.forEach(n => {
    inboundMap[n.id] = [];
    outDegree[n.id] = 0;
  });

  links.forEach(l => {
    // Handle both string IDs and object references (D3 simulation mutates links)
    const sourceId = typeof l.source === 'object' ? l.source.id : l.source as string;
    const targetId = typeof l.target === 'object' ? l.target.id : l.target as string;

    if (inboundMap[targetId]) inboundMap[targetId].push(sourceId);
    outDegree[sourceId] = (outDegree[sourceId] || 0) + 1;
  });

  // Iterative Calculation
  for (let i = 0; i < iterations; i++) {
    const newRanks: Record<string, number> = {};
    let sinkRankSum = 0;

    // Handle sinks (nodes with no outgoing links)
    // In PageRank, their rank is usually distributed to everyone
    nodes.forEach(n => {
      if ((outDegree[n.id] || 0) === 0) {
        sinkRankSum += ranks[n.id];
      }
    });

    nodes.forEach(n => {
      // Basic PageRank sum from inbound neighbors
      let rankSum = 0;
      const inboundNeighbors = inboundMap[n.id] || [];
      
      inboundNeighbors.forEach(sourceId => {
         const deg = outDegree[sourceId] || 1; // prevent div by 0
         rankSum += ranks[sourceId] / deg;
      });

      // Apply formula with Damping + Sink distribution
      newRanks[n.id] = (1 - dampingFactor) / nodes.length 
                       + dampingFactor * (rankSum + sinkRankSum / nodes.length);
    });

    ranks = newRanks;
  }

  // Normalize scores to 0-100 range for UI
  const maxRank = Math.max(...Object.values(ranks));
  const minRank = Math.min(...Object.values(ranks));
  const range = maxRank - minRank || 1; // avoid div by 0

  return nodes.map(n => ({
    ...n,
    rank: Math.round(((ranks[n.id] - minRank) / range) * 100)
  }));
};
