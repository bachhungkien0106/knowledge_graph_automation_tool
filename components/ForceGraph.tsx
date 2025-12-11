import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { GraphData, GraphNode, GraphLink, GROUP_COLORS, NodeGroup } from '../types';
import { FilterState } from '../App';

interface ForceGraphProps {
  data: GraphData;
  onNodeClick: (node: GraphNode) => void;
  width?: number;
  height?: number;
  className?: string;
  showLabels?: boolean;
  highlightedNodeIds?: Set<string> | null;
  highlightedLinkIds?: Set<string> | null;
  sequenceNodeIds?: string[];
  filterState?: FilterState;
  shakeTrigger?: number;
}

// Extend link type internally to track display properties
interface DisplayLink extends GraphLink {
  isCurved?: boolean;
}

const ForceGraph: React.FC<ForceGraphProps> = ({ 
  data, 
  onNodeClick, 
  width = 800, 
  height = 600, 
  className,
  showLabels = true,
  highlightedNodeIds = null,
  highlightedLinkIds = null,
  sequenceNodeIds = [],
  filterState = null,
  shakeTrigger = 0
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  
  // Track dimensions
  const [dimensions, setDimensions] = useState({ w: width, h: height });

  // Tooltip state
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{x: number, y: number} | null>(null);

  // Update dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({ w: clientWidth, h: clientHeight });
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); 
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update opacity based on Highlight Filters
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    
    const hasPathHighlight = highlightedNodeIds && highlightedNodeIds.size > 0;
    
    // Default Opacities
    const NODE_OPACITY_ACTIVE = 1;
    const NODE_OPACITY_DIMMED = 0.1;
    const LINK_BASE_OPACITY_NORMAL = 0.15;
    const LINK_BASE_OPACITY_ACTIVE = 0.4;
    const LINK_BASE_OPACITY_DIMMED = 0.02;
    const LINK_FLOW_OPACITY_NORMAL = 0.8;
    const LINK_FLOW_OPACITY_DIMMED = 0.05;

    // Helper: Is this node visible?
    const isNodeVisible = (d: GraphNode) => {
        if (hasPathHighlight) {
            return highlightedNodeIds.has(d.id);
        }
        if (filterState) {
            if (filterState.type === 'group') {
                return d.group === filterState.value;
            }
            return true;
        }
        return true;
    };

    // Helper: Is this link visible?
    const isLinkVisible = (d: GraphLink) => {
        const s = typeof d.source === 'object' ? (d.source as GraphNode).id : d.source;
        const t = typeof d.target === 'object' ? (d.target as GraphNode).id : d.target;
        
        if (hasPathHighlight) {
             const key = `${s}-${t}`;
             return highlightedLinkIds?.has(key);
        }

        if (filterState) {
            if (filterState.type === 'group') {
                const sNode = (data.nodes || []).find(n => n.id === s);
                const tNode = (data.nodes || []).find(n => n.id === t);
                return sNode?.group === filterState.value && tNode?.group === filterState.value;
            }
            if (filterState.type === 'effect') {
                return d.effect === filterState.value;
            }
        }
        return true;
    };

    // 1. Update Nodes
    svg.selectAll<SVGGElement, GraphNode>(".nodes g")
       .transition().duration(400)
       .style("opacity", (d) => {
          return isNodeVisible(d) ? NODE_OPACITY_ACTIVE : NODE_OPACITY_DIMMED;
       });

    // 2. Update Links (Base)
    svg.selectAll<SVGPathElement, DisplayLink>(".links-base path")
       .transition().duration(400)
       .attr("stroke-opacity", (d) => {
          return isLinkVisible(d) ? (hasPathHighlight ? LINK_BASE_OPACITY_ACTIVE : LINK_BASE_OPACITY_NORMAL) : LINK_BASE_OPACITY_DIMMED;
       });

    // 3. Update Links (Flow)
    svg.selectAll<SVGPathElement, DisplayLink>(".links-flow path")
       .transition().duration(400)
       .attr("stroke-opacity", (d) => {
          return isLinkVisible(d) ? (hasPathHighlight ? 1 : LINK_FLOW_OPACITY_NORMAL) : LINK_FLOW_OPACITY_DIMMED;
       });

    // 4. Update Link Labels
    svg.selectAll<SVGGElement, DisplayLink>(".link-labels g")
       .transition().duration(400)
       .style("opacity", (d) => {
           if (!showLabels) return 0;
           return isLinkVisible(d) ? 1 : LINK_FLOW_OPACITY_DIMMED;
       });

  }, [highlightedNodeIds, highlightedLinkIds, showLabels, filterState, data.nodes]);

  // Effect for Shake / Jolt Physics
  useEffect(() => {
      if (shakeTrigger > 0 && simulationRef.current) {
          // Re-heat simulation
          simulationRef.current.alpha(0.8).restart();
      }
  }, [shakeTrigger]);


  // Main Effect: D3 Initialization and Updates
  useEffect(() => {
    if (!svgRef.current || !data) return;

    const svg = d3.select(svgRef.current);
    const { w, h } = dimensions;

    // --- 1. SETUP (Run Once) ---
    let container = svg.select<SVGGElement>(".zoom-container");
    
    if (container.empty()) {
        const defs = svg.append("defs");
        const createMarker = (id: string, color: string) => {
            defs.append("marker")
                .attr("id", id)
                .attr("viewBox", "0 -5 10 10")
                .attr("refX", 26) // Pushed back slightly to accommodate node radius
                .attr("refY", 0)
                .attr("markerWidth", 8)
                .attr("markerHeight", 8)
                .attr("orient", "auto")
                .append("path")
                .attr("d", "M0,-5L10,0L0,5")
                .attr("fill", color);
        };
        createMarker("arrow-positive", "#22c55e");
        createMarker("arrow-negative", "#ef4444");
        createMarker("arrow-neutral", "#94a3b8");

        container = svg.append("g").attr("class", "zoom-container");
        container.append("g").attr("class", "links-base");
        container.append("g").attr("class", "links-flow");
        container.append("g").attr("class", "link-labels");
        container.append("g").attr("class", "nodes");
        container.append("g").attr("class", "node-labels");

        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => {
                container.attr("transform", event.transform);
            });
        svg.call(zoom);
        svg.call(zoom.transform, d3.zoomIdentity.translate(w / 2, h / 2).scale(0.8));
    }

    // --- 2. DATA MERGE & PREPARATION ---
    const currentSim = simulationRef.current;
    const oldNodesMap = new Map<string, GraphNode>(currentSim ? currentSim.nodes().map(n => [n.id, n]) : []);
    
    // Process Nodes
    const mutableNodes = (data.nodes || []).map(n => {
        const old = oldNodesMap.get(n.id);
        if (old) {
            return Object.assign(old, n); 
        }
        return { ...n };
    });

    const isUpdate = mutableNodes.some(n => oldNodesMap.has(n.id));
    if (isUpdate) {
        mutableNodes.forEach(n => {
            if (!oldNodesMap.has(n.id)) {
                const parentLink = (data.links || []).find(l => {
                    const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
                    const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
                    return (s === n.id && oldNodesMap.has(t)) || (t === n.id && oldNodesMap.has(s));
                });

                if (parentLink) {
                    const s = typeof parentLink.source === 'object' ? (parentLink.source as any).id : parentLink.source;
                    const t = typeof parentLink.target === 'object' ? (parentLink.target as any).id : parentLink.target;
                    const parentId = s === n.id ? t : s;
                    const parent = oldNodesMap.get(parentId);
                    
                    if (parent && parent.x !== undefined && parent.y !== undefined) {
                        n.x = parent.x;
                        n.y = parent.y;
                    }
                }
            }
        });
    }

    // Process Links & Calculate Curvature
    // We count how many links are between each pair of nodes (A-B)
    const linkCounts: Record<string, number> = {};
    (data.links || []).forEach(l => {
        const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
        const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
        const key = s < t ? `${s}-${t}` : `${t}-${s}`;
        linkCounts[key] = (linkCounts[key] || 0) + 1;
    });

    const mutableLinks: DisplayLink[] = (data.links || []).map(d => {
        const l = { ...d };
        const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
        const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
        const key = s < t ? `${s}-${t}` : `${t}-${s}`;
        
        // If there is more than 1 link between these nodes (e.g. bidirectional), 
        // we flag it to be curved.
        l.isCurved = linkCounts[key] > 1;
        return l;
    });

    // --- 2.1 TOPOLOGY ANALYSIS ---
    const inDegree = new Map<string, number>();
    const outDegree = new Map<string, number>();
    mutableLinks.forEach(l => {
        const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
        const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
        outDegree.set(s, (outDegree.get(s) || 0) + 1);
        inDegree.set(t, (inDegree.get(t) || 0) + 1);
    });

    const getNodeStyle = (id: string) => {
        if (sequenceNodeIds && sequenceNodeIds.includes(id)) {
             const index = sequenceNodeIds.indexOf(id);
             if (index === 0) return { stroke: '#3b82f6', width: 5 };
             if (index === sequenceNodeIds.length - 1) return { stroke: '#f97316', width: 5 };
             return { stroke: '#eab308', width: 5 };
        }
        const ins = inDegree.get(id) || 0;
        const outs = outDegree.get(id) || 0;
        if (ins === 0 && outs > 0) return { stroke: '#3b82f6', width: 4 };
        if (outs === 0 && ins > 0) return { stroke: '#f97316', width: 4 };
        return { stroke: '#ffffff', width: 2 };
    };


    // --- 3. SIMULATION ---
    let simulation = simulationRef.current;
    if (!simulation) {
        simulation = d3.forceSimulation<GraphNode, GraphLink>()
            .force("charge", d3.forceManyBody().strength(-500))
            .force("center", d3.forceCenter(0, 0)) 
            .force("collide", d3.forceCollide(50));
        simulationRef.current = simulation;
    }

    simulation.nodes(mutableNodes);
    simulation.force("link", d3.forceLink<GraphNode, GraphLink>(mutableLinks)
        .id((d) => d.id)
        .distance(180) // Increased distance slightly to accommodate curves
    );
    simulation.alpha(1).restart();

    // --- 4. JOIN & RENDER ---

    const linkBaseGroup = container.select(".links-base");
    const linkFlowGroup = container.select(".links-flow");
    const linkLabelGroup = container.select(".link-labels");
    const nodeGroup = container.select(".nodes");
    const nodeLabelGroup = container.select(".node-labels");

    const getLinkColor = (d: DisplayLink) => {
        if (d.effect === 'positive') return '#22c55e';
        if (d.effect === 'negative') return '#ef4444';
        return '#94a3b8';
    };

    // 4a. Update Links (Base) - NOW USING PATH
    const linkBase = linkBaseGroup.selectAll<SVGPathElement, DisplayLink>("path")
        .data(mutableLinks, (d: any) => {
            const s = typeof d.source === 'object' ? d.source.id : d.source;
            const t = typeof d.target === 'object' ? d.target.id : d.target;
            return `${s}-${t}`;
        })
        .join(
            enter => enter.append("path")
                .attr("stroke-width", 10) // Wider click area
                .attr("stroke", getLinkColor)
                .attr("fill", "none")
                .attr("stroke-opacity", 0) 
                .call(enter => enter.transition().duration(800).attr("stroke-opacity", 0.15)),
            update => update.attr("stroke", getLinkColor),
            exit => exit.remove()
        );

    // 4b. Update Links (Flow) - NOW USING PATH
    const linkFlow = linkFlowGroup.selectAll<SVGPathElement, DisplayLink>("path")
        .data(mutableLinks, (d: any) => {
            const s = typeof d.source === 'object' ? d.source.id : d.source;
            const t = typeof d.target === 'object' ? d.target.id : d.target;
            return `${s}-${t}`;
        })
        .join(
            enter => enter.append("path")
                .attr("class", "link-animated")
                .attr("stroke-width", 2.5)
                .attr("stroke", getLinkColor)
                .attr("fill", "none")
                .attr("stroke-dasharray", "4, 16")
                .attr("marker-end", (d) => `url(#arrow-${d.effect})`)
                .attr("stroke-opacity", 0)
                .call(enter => enter.transition().duration(800).attr("stroke-opacity", 0.8)),
            update => update
                .attr("stroke", getLinkColor)
                .attr("marker-end", (d) => `url(#arrow-${d.effect})`),
            exit => exit.remove()
        );

    // 4c. Update Link Labels
    const linkLabels = linkLabelGroup.selectAll<SVGGElement, DisplayLink>("g")
        .data(mutableLinks, (d: any) => {
            const s = typeof d.source === 'object' ? d.source.id : d.source;
            const t = typeof d.target === 'object' ? d.target.id : d.target;
            return `${s}-${t}`;
        })
        .join(
            enter => {
                const g = enter.append("g")
                    .attr("cursor", "default")
                    .style("opacity", 0);
                
                const txt = g.append("text")
                    .text((d) => d.relation)
                    .attr("text-anchor", "middle")
                    .attr("dy", "0.3em")
                    .attr("font-size", "8.5px")
                    .attr("fill", "#0f172a")
                    .attr("font-weight", "700")
                    .attr("font-family", "sans-serif")
                    .style("pointer-events", "none")
                    .style("text-transform", "lowercase");
                
                g.insert("rect", "text")
                    .attr("rx", 10)
                    .attr("ry", 10)
                    .attr("fill", "rgba(255, 255, 255, 0.9)")
                    .attr("stroke-width", 1.5);
                
                g.transition().duration(800).style("opacity", showLabels ? 1 : 0);
                return g;
            },
            update => {
                update.select("text").text((d) => d.relation);
                update.transition().duration(300).style("opacity", showLabels ? 1 : 0);
                return update;
            },
            exit => exit.remove()
        );

    // Update rects for labels
    linkLabels.each(function(d: DisplayLink) {
        const g = d3.select(this);
        const text = g.select("text");
        const rect = g.select("rect");
        try {
            const bbox = (text.node() as SVGTextElement).getBBox();
            const padX = 6;
            const padY = 3;
            rect
                .attr("x", -bbox.width / 2 - padX)
                .attr("y", -bbox.height / 2 - padY)
                .attr("width", bbox.width + padX * 2)
                .attr("height", bbox.height + padY * 2)
                .attr("stroke", (l: any) => {
                    const link = l as DisplayLink;
                    if (link.effect === 'positive') return '#86efac';
                    if (link.effect === 'negative') return '#fca5a5';
                    return '#e2e8f0';
                });
        } catch (e) { /* ignore */ }
    });


    // 4d. Update Nodes
    const nodes = nodeGroup.selectAll<SVGGElement, GraphNode>("g")
        .data(mutableNodes, (d) => d.id)
        .join(
            enter => {
                const g = enter.append("g")
                    .attr("cursor", "pointer")
                    .attr("transform", (d) => `translate(${d.x || 0},${d.y || 0}) scale(0)`);

                g.append("circle")
                    .attr("r", 16)
                    .attr("fill", (d) => GROUP_COLORS[d.group] || GROUP_COLORS[NodeGroup.UNKNOWN])
                    .attr("stroke", (d) => getNodeStyle(d.id).stroke)
                    .attr("stroke-width", (d) => getNodeStyle(d.id).width);

                g.append("text")
                    .attr("dy", 5)
                    .attr("dx", 0)
                    .attr("text-anchor", "middle")
                    .attr("fill", "white")
                    .attr("font-size", "11px")
                    .attr("font-weight", "bold")
                    .attr("pointer-events", "none")
                    .text((d) => d.label.substring(0, 1).toUpperCase());
                
                g.transition().duration(600).ease(d3.easeBackOut)
                    .attr("transform", (d) => `translate(${d.x || 0},${d.y || 0}) scale(1)`);
                return g;
            },
            update => {
                const g = update;
                g.select("circle")
                    .attr("stroke", (d) => getNodeStyle(d.id).stroke)
                    .attr("stroke-width", (d) => getNodeStyle(d.id).width);
                return g;
            },
            exit => exit.transition().duration(300).attr("transform", "scale(0)").remove()
        )
        .on("click", (event, d) => {
            event.stopPropagation();
            onNodeClick(d);
        })
        .on("mouseover", (event: MouseEvent, d: GraphNode) => {
            setHoveredNode(d);
            setTooltipPos({ x: event.clientX, y: event.clientY });
            
            if ((!highlightedNodeIds || highlightedNodeIds.size === 0) && !filterState) {
                linkBase.transition().duration(200)
                    .attr("stroke-opacity", (l) => (l.source === d || l.target === d) ? 0.6 : 0.05);
                linkFlow.transition().duration(200)
                    .attr("stroke-opacity", (l) => (l.source === d || l.target === d) ? 1 : 0.1);
                linkLabels.transition().duration(200)
                    .style("opacity", (l) => (l.source === d || l.target === d) ? 1 : 0.2);
            }
        })
        .on("mousemove", (event: MouseEvent) => {
            setTooltipPos({ x: event.clientX, y: event.clientY });
        })
        .on("mouseout", () => {
            setHoveredNode(null);
            setTooltipPos(null);
            if ((!highlightedNodeIds || highlightedNodeIds.size === 0) && !filterState) {
                linkBase.transition().duration(200).attr("stroke-opacity", 0.15);
                linkFlow.transition().duration(200).attr("stroke-opacity", 0.8);
                linkLabels.transition().duration(200).style("opacity", showLabels ? 1 : 0);
            }
        });

    // 4e. Update Node Labels
    const nodeLabels = nodeLabelGroup.selectAll<SVGTextElement, GraphNode>("text")
        .data(mutableNodes, (d) => d.id)
        .join(
            enter => enter.append("text")
                .attr("dx", 20)
                .attr("dy", 5)
                .text((d) => d.label)
                .attr("fill", "#1e293b")
                .attr("font-size", "13px")
                .attr("font-weight", "600")
                .style("pointer-events", "none")
                .style("text-shadow", "2px 2px 0px white, -2px -2px 0px white, 2px -2px 0px white, -2px 2px 0px white")
                .style("opacity", 0)
                .call(enter => enter.transition().delay(200).duration(400).style("opacity", 1)),
            update => update.text((d) => d.label),
            exit => exit.remove()
        );

    // --- 5. DRAG BEHAVIOR ---
    const drag = d3.drag<any, GraphNode>()
        .on("start", (event, d) => {
            if (!event.active) simulation?.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        })
        .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
        })
        .on("end", (event, d) => {
            if (!event.active) simulation?.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        });

    nodes.call(drag);

    // --- 6. TICK FUNCTION ---
    simulation.on("tick", () => {
        // Calculate Path Data for Links
        const getPathData = (d: DisplayLink) => {
             const s = d.source as GraphNode;
             const t = d.target as GraphNode;
             const x1 = s.x!, y1 = s.y!;
             const x2 = t.x!, y2 = t.y!;
             
             // If curved, calculate Quadratic Bezier control point
             if (d.isCurved) {
                 const dx = x2 - x1;
                 const dy = y2 - y1;
                 const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                 
                 // Normal vector (-dy, dx)
                 const nx = -dy / dist;
                 const ny = dx / dist;
                 
                 // Offset determines curvature height
                 const offset = dist * 0.2; 
                 
                 const midX = (x1 + x2) / 2;
                 const midY = (y1 + y2) / 2;
                 
                 const cx = midX + nx * offset;
                 const cy = midY + ny * offset;
                 
                 return `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;
             }
             
             // Straight line
             return `M${x1},${y1} L${x2},${y2}`;
        };

        linkBase.attr("d", getPathData);
        linkFlow.attr("d", getPathData);

        // Update Label Position
        linkLabels.attr("transform", (d: DisplayLink) => {
            const s = d.source as GraphNode;
            const t = d.target as GraphNode;
            const x1 = s.x!, y1 = s.y!;
            const x2 = t.x!, y2 = t.y!;

            let x, y;

            if (d.isCurved) {
                 const dx = x2 - x1;
                 const dy = y2 - y1;
                 const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                 const nx = -dy / dist;
                 const ny = dx / dist;
                 const offset = dist * 0.2;
                 const midX = (x1 + x2) / 2;
                 const midY = (y1 + y2) / 2;
                 const cx = midX + nx * offset;
                 const cy = midY + ny * offset;

                 // Bezier midpoint (t=0.5)
                 // B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
                 // t=0.5 -> 0.25*P0 + 0.5*P1 + 0.25*P2
                 x = 0.25 * x1 + 0.5 * cx + 0.25 * x2;
                 y = 0.25 * y1 + 0.5 * cy + 0.25 * y2;
            } else {
                 x = (x1 + x2) / 2;
                 y = (y1 + y2) / 2;
            }
            
            return `translate(${x},${y})`;
        });

        nodes.attr("transform", (d: GraphNode) => `translate(${d.x},${d.y})`);
        
        nodeLabels
            .attr("x", (d: GraphNode) => d.x!)
            .attr("y", (d: GraphNode) => d.y!);
    });

  }, [data, dimensions, onNodeClick, sequenceNodeIds]);

  return (
    <div ref={containerRef} className={`w-full h-full relative ${className}`}>
      {/* CSS Animation for the flow effect */}
      <style>{`
        @keyframes flow-animation {
          from {
            stroke-dashoffset: 20;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        .link-animated {
          animation: flow-animation 1.5s linear infinite;
        }
      `}</style>
      
      <svg 
        ref={svgRef} 
        className="w-full h-full block"
        width={dimensions.w}
        height={dimensions.h}
        viewBox={`0 0 ${dimensions.w} ${dimensions.h}`}
      />
      
      {/* Tooltip */}
      {hoveredNode && tooltipPos && (
        <div 
            className="fixed z-50 pointer-events-none bg-slate-900/95 text-white text-sm rounded-lg py-2 px-3 shadow-xl backdrop-blur-sm border border-slate-700 max-w-xs animate-in fade-in duration-200"
            style={{ 
              top: tooltipPos.y + 16, 
              left: tooltipPos.x + 16 
            }}
        >
          <div className="font-semibold text-emerald-400 text-xs uppercase tracking-wider mb-1">
            {hoveredNode.group}
          </div>
          <div className="font-bold mb-1">{hoveredNode.label}</div>
          <div className="text-slate-300 text-xs leading-relaxed">
            {hoveredNode.description}
          </div>
        </div>
      )}
    </div>
  );
};

export default ForceGraph;