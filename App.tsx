import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GraphData, GraphNode, GraphLink, FetchStatus } from './types';
import { fetchInitialGraph, fetchNodeDetails, expandNode, generateGraphFromText } from './services/geminiService';
import ForceGraph from './components/ForceGraph';
import InfoPanel from './components/InfoPanel';
import Legend from './components/Legend';
import NoteModal from './components/NoteModal';
import GraphStats from './components/GraphStats';
import { Search, Loader2, Sparkles, AlertCircle, Eye, EyeOff, Route, X, FileText, ArrowRight, Undo, BarChart3, Zap } from 'lucide-react';

export type FilterState = { type: 'group' | 'effect', value: string } | null;

const App: React.FC = () => {
  // Graph State
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [graphStatus, setGraphStatus] = useState<FetchStatus>('idle');
  
  // Interaction State
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [details, setDetails] = useState<string | null>(null);
  const [detailsStatus, setDetailsStatus] = useState<FetchStatus>('idle');
  const [expandStatus, setExpandStatus] = useState<FetchStatus>('idle');
  const [showLabels, setShowLabels] = useState(true);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  // Fun / Physics State
  const [filterState, setFilterState] = useState<FilterState>(null);
  const [shakeTrigger, setShakeTrigger] = useState(0);

  // Pathfinding / Filtering Mode State
  const [isPathMode, setIsPathMode] = useState(false);
  // Replaces simple start/end with a sequence of nodes
  const [pathSequence, setPathSequence] = useState<GraphNode[]>([]);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initial Load
  useEffect(() => {
    handleSearch("Forest Ecosystem");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Path Finding Algorithm (BFS) ---
  const findShortestPath = useCallback((startId: string, endId: string, links: GraphLink[]) => {
    // Build Adjacency List
    const adjacency: Record<string, { target: string, linkKey: string }[]> = {};
    links.forEach(l => {
        const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
        const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
        const key = `${s}-${t}`; // Must match ForceGraph key generation logic

        if (!adjacency[s]) adjacency[s] = [];
        if (!adjacency[t]) adjacency[t] = [];
        
        // Add bidirectional connections for traversal
        adjacency[s].push({ target: t, linkKey: key });
        adjacency[t].push({ target: s, linkKey: key });
    });

    // BFS
    const queue = [{ current: startId, pathNodes: [startId], pathLinks: [] as string[] }];
    const visited = new Set([startId]);

    while (queue.length > 0) {
        const { current, pathNodes, pathLinks } = queue.shift()!;
        if (current === endId) {
            return { 
                nodes: new Set(pathNodes), 
                links: new Set(pathLinks) 
            };
        }

        const neighbors = adjacency[current] || [];
        for (const n of neighbors) {
            if (!visited.has(n.target)) {
                visited.add(n.target);
                queue.push({
                    current: n.target,
                    pathNodes: [...pathNodes, n.target],
                    pathLinks: [...pathLinks, n.linkKey]
                });
            }
        }
    }
    return null; // No path
  }, []);

  // Compute the total path from the sequence
  const pathResult = useMemo(() => {
    if (pathSequence.length < 2) return null;

    const allNodes = new Set<string>();
    const allLinks = new Set<string>();
    let segmentsFound = 0;

    for (let i = 0; i < pathSequence.length - 1; i++) {
        const start = pathSequence[i];
        const end = pathSequence[i+1];
        const segment = findShortestPath(start.id, end.id, graphData.links || []);
        
        if (segment) {
            segment.nodes.forEach(n => allNodes.add(n));
            segment.links.forEach(l => allLinks.add(l));
            segmentsFound++;
        }
    }

    // Always ensure the selected waypoints are in the node set, even if isolated
    pathSequence.forEach(n => allNodes.add(n.id));

    return segmentsFound > 0 ? { nodes: allNodes, links: allLinks } : null;
  }, [pathSequence, graphData.links, findShortestPath]);

  // Compute keys for highlighting
  const { highlightedNodeIds, highlightedLinkIds } = useMemo(() => {
    if (!isPathMode) return { highlightedNodeIds: null, highlightedLinkIds: null };
    
    // If we have calculated paths
    if (pathResult) {
        return { highlightedNodeIds: pathResult.nodes, highlightedLinkIds: pathResult.links };
    }

    // If just selecting nodes (1 or more) but no paths found yet (or just 1 node)
    if (pathSequence.length > 0) {
        const nodes = new Set(pathSequence.map(n => n.id));
        return { highlightedNodeIds: nodes, highlightedLinkIds: null };
    }
    
    // Nothing selected yet
    return { 
        highlightedNodeIds: null, 
        highlightedLinkIds: null 
    };
  }, [isPathMode, pathResult, pathSequence]);

  // Derived list of sequence IDs for styling waypoints
  const sequenceNodeIds = useMemo(() => pathSequence.map(n => n.id), [pathSequence]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    setGraphStatus('loading');
    setErrorMsg(null);
    setSelectedNode(null); // Clear selection on new search
    setSearchQuery(query); // Sync search bar
    setIsPathMode(false); // Reset mode
    setPathSequence([]);
    setFilterState(null);
    
    try {
      const data = await fetchInitialGraph(query);
      setGraphData(data);
      setGraphStatus('success');
    } catch (error) {
      console.error(error);
      setGraphStatus('error');
      setErrorMsg("Failed to generate knowledge graph. Please check your API key or try again.");
    }
  };

  const handleNoteSubmit = async (text: string) => {
    setGraphStatus('loading');
    setErrorMsg(null);
    setSelectedNode(null);
    setIsPathMode(false);
    setPathSequence([]);
    setFilterState(null);
    
    try {
      const data = await generateGraphFromText(text);
      if (data.nodes.length === 0) {
          throw new Error("No valid entities found in the text.");
      }
      setGraphData(data);
      setGraphStatus('success');
    } catch (error) {
      console.error(error);
      setGraphStatus('error');
      setErrorMsg("Failed to generate graph from notes. Try providing more structured text.");
    }
  };

  const onNodeClick = useCallback(async (node: GraphNode) => {
    // Path Mode Logic
    if (isPathMode) {
        // Append to sequence
        setPathSequence(prev => [...prev, node]);
        return;
    }

    // Normal Info Mode
    setSelectedNode(node);
    setDetails(null);
    setDetailsStatus('loading');

    try {
      const text = await fetchNodeDetails(node.label);
      setDetails(text);
      setDetailsStatus('success');
    } catch (error) {
      console.error(error);
      setDetailsStatus('error');
    }
  }, [isPathMode]);

  const handleExpandNode = async () => {
    if (!selectedNode) return;
    setExpandStatus('loading');

    try {
      const currentLabels = (graphData.nodes || []).map(n => n.label);
      const newData = await expandNode(selectedNode.label, currentLabels);

      setGraphData(prev => {
        // Merge Logic: prevent duplicates
        const existingNodeIds = new Set((prev.nodes || []).map(n => n.id));
        const newUniqueNodes = (newData.nodes || []).filter(n => !existingNodeIds.has(n.id));
        
        // Links might reference nodes not in newData but in prev.nodes
        const existingLinkKeys = new Set((prev.links || []).map(l => 
          typeof l.source === 'object' 
            ? `${(l.source as GraphNode).id}-${(l.target as GraphNode).id}` 
            : `${l.source}-${l.target}`
        ));

        const newUniqueLinks = (newData.links || []).filter(l => {
          const key = `${l.source}-${l.target}`;
          return !existingLinkKeys.has(key);
        });

        return {
          nodes: [...(prev.nodes || []), ...newUniqueNodes],
          links: [...(prev.links || []), ...newUniqueLinks]
        };
      });

      setExpandStatus('success');
    } catch (error) {
      console.error("Expansion failed", error);
      setExpandStatus('error');
    }
  };

  const handleFocusNode = () => {
    if (!selectedNode) return;
    handleSearch(selectedNode.label);
  };

  const handleCloseInfo = () => {
    setSelectedNode(null);
  };

  const togglePathMode = () => {
      const newMode = !isPathMode;
      setIsPathMode(newMode);
      setPathSequence([]); // Always reset sequence on toggle
      setFilterState(null); // Clear filters
      if (newMode) setSelectedNode(null); // Close info panel when entering path mode
  };

  // Helper to remove last node from sequence
  const undoLastPathStep = () => {
      setPathSequence(prev => prev.slice(0, -1));
  };

  const handleJolt = () => {
      setShakeTrigger(prev => prev + 1);
  };

  return (
    <div className="w-full h-screen bg-slate-50 flex flex-col relative overflow-hidden">
      
      {/* Top Bar / Navigation */}
      <header className="absolute top-0 left-0 right-0 p-4 z-10 pointer-events-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="pointer-events-auto bg-white/90 backdrop-blur-md p-2 rounded-xl shadow-lg border border-slate-200 flex items-center gap-3">
             <div className="bg-emerald-500 p-2 rounded-lg text-white">
               <Sparkles size={20} />
             </div>
             <div>
               <h1 className="font-bold text-slate-800 text-lg leading-tight">EcoWeb</h1>
               <p className="text-xs text-slate-500 font-medium">AI-Powered Nature Graph</p>
             </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
              <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-slate-200">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                  placeholder="Explore (e.g., Ocean, Rainforest)..."
                  className="bg-transparent border-none outline-none text-slate-700 placeholder-slate-400 px-3 py-1.5 w-48 md:w-64 text-sm font-medium"
                />
                <button 
                  onClick={() => handleSearch(searchQuery)}
                  disabled={graphStatus === 'loading'}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {graphStatus === 'loading' ? <Loader2 size={18} className="animate-spin"/> : <Search size={18} />}
                </button>
              </div>

              {/* Tools: Path Mode & Labels */}
              <div className="flex gap-2 bg-white/90 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-slate-200">
                  <button 
                    onClick={() => setIsNoteModalOpen(true)}
                    className="p-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-colors"
                    title="Visualize my Notes"
                  >
                    <FileText size={20} />
                  </button>
                  
                  <button 
                    onClick={() => setIsStatsOpen(true)}
                    className="p-2 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
                    title="View Graph Statistics"
                  >
                    <BarChart3 size={20} />
                  </button>

                  <div className="w-px bg-slate-200 mx-1 my-1"></div>

                  <button 
                    onClick={handleJolt}
                    className="p-2 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                    title="Jolt: Shake the ecosystem"
                  >
                    <Zap size={20} className={shakeTrigger > 0 ? "fill-amber-500" : ""} />
                  </button>

                  <button 
                    onClick={togglePathMode}
                    className={`p-2 rounded-lg transition-colors ${isPathMode ? 'bg-blue-100 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
                    title={isPathMode ? "Exit Pathfinding Mode" : "Connect Multiple Nodes"}
                  >
                    <Route size={20} />
                  </button>

                  <button 
                    onClick={() => setShowLabels(!showLabels)}
                    className="p-2 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-colors"
                    title={showLabels ? "Hide Connection Details" : "Show Connection Details"}
                  >
                    {showLabels ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
              </div>
          </div>
        </div>
      </header>

      {/* Path Mode Banner */}
      {isPathMode && (
          <div className="absolute top-24 left-0 right-0 z-20 pointer-events-auto animate-in slide-in-from-top-4 fade-in flex justify-center px-4">
              <div className="bg-slate-800/95 text-white backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl flex items-center gap-4 border border-slate-600 max-w-full md:max-w-2xl overflow-hidden">
                  <div className="shrink-0 bg-slate-700 p-2 rounded-full">
                      <Route size={18} className="text-blue-400" />
                  </div>
                  
                  <div className="flex-1 overflow-x-auto whitespace-nowrap scrollbar-hide flex items-center gap-2">
                      {pathSequence.length === 0 ? (
                          <span className="text-sm text-slate-300 font-medium">Click nodes to connect them in sequence</span>
                      ) : (
                          pathSequence.map((node, index) => (
                              <React.Fragment key={node.id}>
                                  {index > 0 && <ArrowRight size={14} className="text-slate-500 shrink-0" />}
                                  <div className={`px-2 py-1 rounded-md text-sm font-bold border shrink-0 ${
                                      index === 0 ? 'bg-blue-500/20 border-blue-500 text-blue-200' : 
                                      index === pathSequence.length - 1 ? 'bg-orange-500/20 border-orange-500 text-orange-200' :
                                      'bg-slate-700 border-slate-600 text-slate-300'
                                  }`}>
                                      {node.label}
                                  </div>
                              </React.Fragment>
                          ))
                      )}
                  </div>

                  {pathSequence.length > 0 && (
                      <div className="flex items-center gap-1 pl-2 border-l border-slate-600 shrink-0">
                          <button 
                            onClick={undoLastPathStep}
                            className="p-1.5 hover:bg-slate-700 rounded-md text-slate-300 hover:text-white transition-colors"
                            title="Undo last step"
                          >
                              <Undo size={16} />
                          </button>
                          <button 
                            onClick={() => setPathSequence([])}
                            className="p-1.5 hover:bg-slate-700 rounded-md text-slate-300 hover:text-white transition-colors"
                            title="Clear all"
                          >
                              <X size={16} />
                          </button>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Main Graph Area */}
      <main className="flex-1 w-full h-full relative">
        {graphStatus === 'loading' && (!graphData.nodes || graphData.nodes.length === 0) ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-0">
             <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
                  <Leaf className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500" size={24} />
                </div>
                <p className="text-slate-500 font-medium animate-pulse">Generating Graph...</p>
             </div>
          </div>
        ) : graphStatus === 'error' && (!graphData.nodes || graphData.nodes.length === 0) ? (
           <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-0">
              <div className="text-center p-8 max-w-md">
                <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">Something went wrong</h3>
                <p className="text-slate-600 mb-6">{errorMsg}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Reload Application
                </button>
              </div>
           </div>
        ) : (
          <ForceGraph 
            data={graphData} 
            onNodeClick={onNodeClick} 
            className="bg-radial-gradient from-white to-slate-100"
            showLabels={showLabels}
            highlightedNodeIds={highlightedNodeIds}
            highlightedLinkIds={highlightedLinkIds}
            sequenceNodeIds={sequenceNodeIds}
            filterState={filterState}
            shakeTrigger={shakeTrigger}
          />
        )}
      </main>

      {/* Overlays */}
      <Legend 
        activeFilter={filterState}
        onFilterChange={setFilterState}
      />
      <NoteModal 
        isOpen={isNoteModalOpen} 
        onClose={() => setIsNoteModalOpen(false)} 
        onSubmit={handleNoteSubmit} 
      />
      <GraphStats 
        isOpen={isStatsOpen} 
        onClose={() => setIsStatsOpen(false)} 
        data={graphData} 
      />
      
      {/* Hide InfoPanel if in Path Mode to reduce clutter */}
      {!isPathMode && (
          <InfoPanel 
            selectedNode={selectedNode}
            details={details}
            detailsStatus={detailsStatus}
            onClose={handleCloseInfo}
            onExpand={handleExpandNode}
            expandStatus={expandStatus}
            onFocus={handleFocusNode}
          />
      )}
      
      {/* Disclaimer / Footer */}
      <div className="absolute bottom-2 right-4 text-[10px] text-slate-400 pointer-events-none">
        Powered by Google Gemini • Data generated by AI may vary
      </div>
    </div>
  );
};

function Leaf({ className, size }: { className?: string, size?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
    </svg>
  );
}

export default App;