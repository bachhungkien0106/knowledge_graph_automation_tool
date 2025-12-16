import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GraphData, GraphNode, GraphLink, FetchStatus, ResearchResult } from './types';
import { fetchInitialGraph, fetchNodeDetails, expandNode, generateGraphFromText, simulateEcosystemChange, researchExternalConnection, ImpactResult } from './services/geminiService';
import { calculateNodeRanks } from './utils/graphAlgorithms';
import ForceGraph from './components/ForceGraph';
import InfoPanel from './components/InfoPanel';
import Legend from './components/Legend';
import NoteModal from './components/NoteModal';
import GraphStats from './components/GraphStats';
import ResearchModal from './components/ResearchModal';
import AssistantPanel from './components/AssistantPanel';
import { Search, Loader2, TrendingUp, AlertCircle, Eye, EyeOff, Route, X, FileText, ArrowRight, Undo, BarChart3, Zap, Activity, Skull, Microscope, MessageSquare, Briefcase, Coins, ShieldAlert } from 'lucide-react';

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
  
  // Modals
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isResearchModalOpen, setIsResearchModalOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Research State
  const [researchStatus, setResearchStatus] = useState<FetchStatus>('idle');
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);

  // Fun / Physics State
  const [filterState, setFilterState] = useState<FilterState>(null);
  const [shakeTrigger, setShakeTrigger] = useState(0);

  // Pathfinding / Filtering Mode State
  const [isPathMode, setIsPathMode] = useState(false);
  const [pathSequence, setPathSequence] = useState<GraphNode[]>([]);

  // Impact Simulation Mode State
  const [isSimMode, setIsSimMode] = useState(false);
  const [simulationResult, setSimulationResult] = useState<ImpactResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initial Load
  useEffect(() => {
    handleSearch("US Tech Sector");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Path Finding Algorithm (BFS) ---
  const findShortestPath = useCallback((startId: string, endId: string, links: GraphLink[]) => {
    // Build Adjacency List
    const adjacency: Record<string, { target: string, linkKey: string }[]> = {};
    links.forEach(l => {
        const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
        const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
        const key = `${s}-${t}`; 

        if (!adjacency[s]) adjacency[s] = [];
        if (!adjacency[t]) adjacency[t] = [];
        
        adjacency[s].push({ target: t, linkKey: key });
        adjacency[t].push({ target: s, linkKey: key });
    });

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

  // Compute the total path
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

    pathSequence.forEach(n => allNodes.add(n.id));

    return segmentsFound > 0 ? { nodes: allNodes, links: allLinks } : null;
  }, [pathSequence, graphData.links, findShortestPath]);

  // Compute keys for highlighting
  const { highlightedNodeIds, highlightedLinkIds } = useMemo(() => {
    if (!isPathMode) return { highlightedNodeIds: null, highlightedLinkIds: null };
    
    if (pathResult) {
        return { highlightedNodeIds: pathResult.nodes, highlightedLinkIds: pathResult.links };
    }

    if (pathSequence.length > 0) {
        const nodes = new Set(pathSequence.map(n => n.id));
        return { highlightedNodeIds: nodes, highlightedLinkIds: null };
    }
    
    return { highlightedNodeIds: null, highlightedLinkIds: null };
  }, [isPathMode, pathResult, pathSequence]);

  const sequenceNodeIds = useMemo(() => pathSequence.map(n => n.id), [pathSequence]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    setGraphStatus('loading');
    setErrorMsg(null);
    setSelectedNode(null); 
    setSearchQuery(query); 
    setIsPathMode(false); 
    setPathSequence([]);
    setIsSimMode(false);
    setSimulationResult(null);
    setFilterState(null);
    
    try {
      const data = await fetchInitialGraph(query);
      const rankedNodes = calculateNodeRanks(data.nodes, data.links);
      setGraphData({ nodes: rankedNodes, links: data.links });
      setGraphStatus('success');
    } catch (error) {
      console.error(error);
      setGraphStatus('error');
      setErrorMsg("Failed to generate portfolio graph. Please check your API key or try again.");
    }
  };

  const handleNoteSubmit = async (text: string) => {
    setGraphStatus('loading');
    setErrorMsg(null);
    setSelectedNode(null);
    setIsPathMode(false);
    setPathSequence([]);
    setIsSimMode(false);
    setSimulationResult(null);
    setFilterState(null);
    
    try {
      const data = await generateGraphFromText(text);
      if (data.nodes.length === 0) {
          throw new Error("No valid assets found in the text.");
      }
      const rankedNodes = calculateNodeRanks(data.nodes, data.links);
      setGraphData({ nodes: rankedNodes, links: data.links });
      setGraphStatus('success');
    } catch (error) {
      console.error(error);
      setGraphStatus('error');
      setErrorMsg("Failed to generate graph from notes. Try providing more structured text.");
    }
  };

  // --- Research Modal Handler ---
  const handleResearch = async (concept: string) => {
    setResearchStatus('loading');
    setResearchResult(null);
    try {
        const result = await researchExternalConnection(concept, graphData.nodes);
        setResearchResult(result);
        setResearchStatus('success');
    } catch (e) {
        console.error(e);
        setResearchStatus('error');
    }
  };

  const handleAddResearchToGraph = () => {
    if (!researchResult) return;

    setGraphData(prev => {
        // Create new node object
        const newNode: GraphNode = {
            id: researchResult.newNode.label.toLowerCase().replace(/\s+/g, '-'),
            label: researchResult.newNode.label,
            group: researchResult.newNode.group,
            description: researchResult.newNode.description,
            x: 0,
            y: 0
        };

        const newLinks: GraphLink[] = [];
        researchResult.connections.forEach(conn => {
            const targetNode = prev.nodes.find(n => n.label.toLowerCase() === conn.targetNodeLabel.toLowerCase());
            if (targetNode) {
                newLinks.push({
                    source: newNode.id,
                    target: targetNode.id,
                    relation: conn.relation,
                    effect: conn.effect
                } as any);
            }
        });

        const nodeExists = prev.nodes.some(n => n.id === newNode.id);
        const nextNodes = nodeExists ? prev.nodes : [...prev.nodes, newNode];
        const nextLinks = [...prev.links, ...newLinks];
        
        const rankedNodes = calculateNodeRanks(nextNodes, nextLinks);

        return {
            nodes: rankedNodes,
            links: nextLinks
        };
    });
    
    setShakeTrigger(prev => prev + 1); 
  };


  // --- Impact Simulation Handler ---
  const handleSimulateImpact = async (node: GraphNode) => {
      setIsSimulating(true);
      setSimulationResult(null);
      setSelectedNode(null); // Clear panel

      try {
          // Prepare clean data for API
          const nodes = graphData.nodes.map(n => ({ id: n.id, label: n.label }));
          const links = graphData.links.map(l => ({
              source: typeof l.source === 'object' ? (l.source as any).id : l.source,
              target: typeof l.target === 'object' ? (l.target as any).id : l.target,
              relation: l.relation,
              effect: l.effect
          }));

          const result = await simulateEcosystemChange(node.label, nodes, links);
          setSimulationResult(result);

          // Update Graph Data to reflect health
          setGraphData(prev => ({
              ...prev,
              nodes: prev.nodes.map(n => {
                  const impact = result.impactedNodes.find(i => i.id === n.id);
                  if (n.id === node.id) return { ...n, sentiment: 'bearish' }; // The crashed node
                  if (impact) return { ...n, sentiment: impact.health };
                  return { ...n, sentiment: undefined }; // Reset others
              })
          }));

      } catch (e) {
          console.error(e);
          setErrorMsg("Stress test failed.");
      } finally {
          setIsSimulating(false);
      }
  };

  const onNodeClick = useCallback(async (node: GraphNode) => {
    // 1. Simulation Mode Logic
    if (isSimMode) {
        handleSimulateImpact(node);
        return;
    }

    // 2. Path Mode Logic
    if (isPathMode) {
        setPathSequence(prev => [...prev, node]);
        return;
    }

    // 3. Normal Info Mode
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
  }, [isPathMode, isSimMode, graphData]);

  const handleExpandNode = async () => {
    if (!selectedNode) return;
    setExpandStatus('loading');

    try {
      const currentLabels = (graphData.nodes || []).map(n => n.label);
      const newData = await expandNode(selectedNode.label, currentLabels);

      setGraphData(prev => {
        const existingNodeIds = new Set((prev.nodes || []).map(n => n.id));
        const newUniqueNodes = (newData.nodes || []).filter(n => !existingNodeIds.has(n.id));
        
        const existingLinkKeys = new Set((prev.links || []).map(l => 
          typeof l.source === 'object' 
            ? `${(l.source as GraphNode).id}-${(l.target as GraphNode).id}` 
            : `${l.source}-${l.target}`
        ));

        const newUniqueLinks = (newData.links || []).filter(l => {
          const key = `${l.source}-${l.target}`;
          return !existingLinkKeys.has(key);
        });

        const combinedNodes = [...(prev.nodes || []), ...newUniqueNodes];
        const combinedLinks = [...(prev.links || []), ...newUniqueLinks];
        
        const rankedNodes = calculateNodeRanks(combinedNodes, combinedLinks);

        return {
          nodes: rankedNodes,
          links: combinedLinks
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
      setIsPathMode(!isPathMode);
      setPathSequence([]); 
      setIsSimMode(false); // Exclusive modes
      setSimulationResult(null);
      setFilterState(null);
      setSelectedNode(null);
      resetHealth();
  };

  const toggleSimMode = () => {
      setIsSimMode(!isSimMode);
      setSimulationResult(null);
      setIsPathMode(false); // Exclusive modes
      setPathSequence([]);
      setSelectedNode(null);
      resetHealth();
  };

  const resetHealth = () => {
      setGraphData(prev => ({
          ...prev,
          nodes: prev.nodes.map(n => ({ ...n, sentiment: undefined }))
      }));
  };

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
             <div className="bg-blue-600 p-2 rounded-lg text-white">
               <Briefcase size={20} />
             </div>
             <div>
               <h1 className="font-bold text-slate-800 text-lg leading-tight">FinGraph</h1>
               <p className="text-xs text-slate-500 font-medium">Portfolio Intelligence</p>
             </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
              <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-slate-200">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                  placeholder="Portfolio / Sector..."
                  className="bg-transparent border-none outline-none text-slate-700 placeholder-slate-400 px-3 py-1.5 w-32 md:w-64 text-sm font-medium"
                />
                <button 
                  onClick={() => handleSearch(searchQuery)}
                  disabled={graphStatus === 'loading'}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {graphStatus === 'loading' ? <Loader2 size={18} className="animate-spin"/> : <Search size={18} />}
                </button>
              </div>

              {/* Tools */}
              <div className="flex gap-2 bg-white/90 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-slate-200">
                  <button 
                    onClick={() => setIsNoteModalOpen(true)}
                    className="p-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-colors"
                    title="Visualize Portfolio from Text"
                  >
                    <FileText size={20} />
                  </button>

                  <button 
                    onClick={() => setIsResearchModalOpen(true)}
                    className="p-2 rounded-lg text-slate-600 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                    title="Asset Research"
                  >
                    <Microscope size={20} />
                  </button>
                  
                  <button 
                    onClick={() => setIsStatsOpen(true)}
                    className="p-2 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
                    title="Portfolio Stats"
                  >
                    <BarChart3 size={20} />
                  </button>

                  <div className="w-px bg-slate-200 mx-1 my-1"></div>

                  <button 
                    onClick={handleJolt}
                    className="p-2 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                    title="Jolt: Reshuffle Graph"
                  >
                    <Zap size={20} className={shakeTrigger > 0 ? "fill-amber-500" : ""} />
                  </button>

                  <button 
                    onClick={toggleSimMode}
                    className={`p-2 rounded-lg transition-colors ${isSimMode ? 'bg-red-100 text-red-600' : 'text-slate-600 hover:bg-slate-50'}`}
                    title={isSimMode ? "Exit Stress Test" : "Stress Test (Crash an Asset)"}
                  >
                    <Activity size={20} className={isSimulating ? 'animate-pulse' : ''} />
                  </button>

                  <button 
                    onClick={togglePathMode}
                    className={`p-2 rounded-lg transition-colors ${isPathMode ? 'bg-blue-100 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
                    title={isPathMode ? "Exit Trace Mode" : "Trace Correlation Path"}
                  >
                    <Route size={20} />
                  </button>

                  <button 
                    onClick={() => setIsAssistantOpen(!isAssistantOpen)}
                    className={`p-2 rounded-lg transition-colors ${isAssistantOpen ? 'bg-teal-100 text-teal-600' : 'text-slate-600 hover:bg-slate-50'}`}
                    title={isAssistantOpen ? "Close Analyst" : "Chat with Analyst"}
                  >
                    <MessageSquare size={20} />
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
                          <span className="text-sm text-slate-300 font-medium">Select assets to trace correlation path</span>
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

      {/* Simulation Banner */}
      {isSimMode && (
          <div className="absolute top-24 left-0 right-0 z-20 pointer-events-auto animate-in slide-in-from-top-4 fade-in flex justify-center px-4">
              <div className="bg-red-950/90 text-white backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl flex items-center gap-4 border border-red-800 max-w-full md:max-w-2xl">
                  <div className="shrink-0 bg-red-900 p-2 rounded-full">
                      {isSimulating ? <Loader2 size={18} className="animate-spin text-red-300"/> : <ShieldAlert size={18} className="text-red-300" />}
                  </div>
                  
                  <div className="flex-1">
                      {isSimulating ? (
                           <span className="text-sm font-medium text-red-100">Running stress test...</span>
                      ) : simulationResult ? (
                           <div className="flex flex-col">
                               <span className="text-sm font-bold text-white mb-0.5">Stress Test Complete</span>
                               <span className="text-xs text-red-200">{simulationResult.summary}</span>
                           </div>
                      ) : (
                           <span className="text-sm font-medium text-red-100">Click an asset to simulate a CRASH/SHOCK.</span>
                      )}
                  </div>
                  
                  {simulationResult && (
                      <button 
                        onClick={resetHealth}
                        className="px-3 py-1 bg-red-800 hover:bg-red-700 text-xs rounded-lg transition-colors border border-red-700"
                      >
                          Reset
                      </button>
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
                  <div className="w-16 h-16 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <Coins className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" size={24} />
                </div>
                <p className="text-slate-500 font-medium animate-pulse">Constructing Market Map...</p>
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
      <ResearchModal
        isOpen={isResearchModalOpen}
        onClose={() => setIsResearchModalOpen(false)}
        onResearch={handleResearch}
        status={researchStatus}
        result={researchResult}
        onAddToGraph={handleAddResearchToGraph}
      />
      <GraphStats 
        isOpen={isStatsOpen} 
        onClose={() => setIsStatsOpen(false)} 
        data={graphData} 
      />
      <AssistantPanel
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        graphData={graphData}
      />
      
      {/* Hide InfoPanel if in Path Mode or Sim Mode to reduce clutter */}
      {!isPathMode && !isSimMode && (
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
    </div>
  );
};

export default App;