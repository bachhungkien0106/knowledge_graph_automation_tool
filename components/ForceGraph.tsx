import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { GraphData, GraphNode, GraphLink, GROUP_COLORS, NodeGroup } from '../types';

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
  sequenceNodeIds = []
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

  // Update opacity based on Highlight Filters (Pathfinding)
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    
    const hasHighlight = highlightedNodeIds && highlightedNodeIds.size > 0;
    
    // Default Opacities
    const NODE_OPACITY_ACTIVE = 1;
    const NODE_OPACITY_DIMMED = 0.1;
    const LINK_BASE_OPACITY_NORMAL = 0.15;
    const LINK_BASE_OPACITY_ACTIVE = 0.4;
    const LINK_BASE_OPACITY_DIMMED = 0.02;
    const LINK_FLOW_OPACITY_NORMAL = 0.8;
    const LINK_FLOW_OPACITY_DIMMED = 0.05;

    // 1. Update Nodes
    svg.selectAll<SVGGElement, GraphNode>(".nodes g")
       .transition().duration(400)
       .style("opacity", (d) => {
          if (!hasHighlight) return NODE_OPACITY_ACTIVE;
          return highlightedNodeIds.has(d.id) ? NODE_OPACITY_ACTIVE : NODE_OPACITY_DIMMED;
       });

    // Helper to check if a link is part of the highlight
    const isLinkHighlighted = (d: GraphLink) => {
        if (!hasHighlight || !highlightedLinkIds) return false;
        const s = typeof d.source === 'object' ? (d.source as GraphNode).id : d.source;
        const t = typeof d.target === 'object' ? (d.target as GraphNode).id : d.target;
        const key = `${s}-${t}`;
        return highlightedLinkIds.has(key);
    };

    // 2. Update Links (Base)
    svg.selectAll<SVGLineElement, GraphLink>(".links-base line")
       .transition().duration(400)
       .attr("stroke-opacity", (d) => {
          if (!hasHighlight) return LINK_BASE_OPACITY_NORMAL;
          return isLinkHighlighted(d) ? LINK_BASE_OPACITY_ACTIVE : LINK_BASE_OPACITY_DIMMED;
       });

    // 3. Update Links (Flow)
    svg.selectAll<SVGLineElement, GraphLink>(".links-flow line")
       .transition().duration(400)
       .attr("stroke-opacity", (d) => {
          if (!hasHighlight) return LINK_FLOW_OPACITY_NORMAL;
          return isLinkHighlighted(d) ? 1 : LINK_FLOW_OPACITY_DIMMED;
       });

    // 4. Update Link Labels
    svg.selectAll<SVGGElement, GraphLink>(".link-labels g")
       .transition().duration(400)
       .style("opacity", (d) => {
           // If globally hidden, stay hidden
           if (!showLabels) return 0;
           
           if (!hasHighlight) return 1;
           return isLinkHighlighted(d) ? 1 : LINK_FLOW_OPACITY_DIMMED;
       });

  }, [highlightedNodeIds, highlightedLinkIds, showLabels]);


  // Main Effect: D3 Initialization and Updates
  useEffect(() => {
    if (!svgRef.current || !data) return;

    const svg = d3.select(svgRef.current);
    const { w, h } = dimensions;

    // --- 1. SETUP (Run Once) ---
    // Check if layers exist, if not create them
    let container = svg.select<SVGGElement>(".zoom-container");
    
    if (container.empty()) {
        // Define Markers
        const defs = svg.append("defs");
        const createMarker = (id: string, color: string) => {
            defs.append("marker")
                .attr("id", id)
                .attr("viewBox", "0 -5 10 10")
                .attr("refX", 26)
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

        // Create Container and Layers
        container = svg.append("g").attr("class", "zoom-container");
        container.append("g").attr("class", "links-base");
        container.append("g").attr("class", "links-flow");
        container.append("g").attr("class", "link-labels");
        container.append("g").attr("class", "nodes");
        container.append("g").attr("class", "node-labels");

        // Zoom Behavior
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => {
                container.attr("transform", event.transform);
            });
        svg.call(zoom);
        // Initial zoom center
        svg.call(zoom.transform, d3.zoomIdentity.translate(w / 2, h / 2).scale(0.8));
    }

    // --- 2. DATA MERGE & PREPARATION ---
    // We need to merge new data with existing simulation nodes to preserve positions
    
    const currentSim = simulationRef.current;
    const oldNodesMap = new Map<string, GraphNode>(currentSim ? currentSim.nodes().map(n => [n.id, n]) : []);
    
    // Process Nodes: Keep old objects if they exist to preserve x,y,vx,vy
    const mutableNodes = (data.nodes || []).map(n => {
        const old = oldNodesMap.get(n.id);
        if (old) {
            // Update data properties but keep simulation state
            return Object.assign(old, n); 
        }
        return { ...n }; // New node
    });

    // Detect if this is a "Reset" (Focus) or "Update" (Expand)
    // If we have overlap between old and new nodes, it's likely an update.
    const isUpdate = mutableNodes.some(n => oldNodesMap.has(n.id));

    // For NEW nodes in an Update scenario, set their position to a connected parent
    if (isUpdate) {
        mutableNodes.forEach(n => {
            if (!oldNodesMap.has(n.id)) {
                // It's a new node. Find a link connecting it to an existing node.
                // Note: props.data.links has string IDs or objects depending on source.
                const parentLink = (data.links || []).find(l => {
                    const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
                    const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
                    // Check if one end is this node, and the other end is an OLD node
                    return (s === n.id && oldNodesMap.has(t)) || (t === n.id && oldNodesMap.has(s));
                });

                if (parentLink) {
                    const s = typeof parentLink.source === 'object' ? (parentLink.source as any).id : parentLink.source;
                    const t = typeof parentLink.target === 'object' ? (parentLink.target as any).id : parentLink.target;
                    const parentId = s === n.id ? t : s;
                    const parent = oldNodesMap.get(parentId);
                    
                    if (parent && parent.x !== undefined && parent.y !== undefined) {
                        // Spawn at parent position
                        n.x = parent.x;
                        n.y = parent.y;
                    }
                }
            }
        });
    }

    // Process Links: Create a fresh array, but D3 will resolve references to the mutableNodes objects
    const mutableLinks = (data.links || []).map(d => ({ ...d }));

    // --- 2.1 TOPOLOGY ANALYSIS (Start/End Nodes) ---
    const inDegree = new Map<string, number>();
    const outDegree = new Map<string, number>();

    mutableLinks.forEach(l => {
        // Safe ID extraction whether it's a string or object reference
        const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
        const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
        
        outDegree.set(s, (outDegree.get(s) || 0) + 1);
        inDegree.set(t, (inDegree.get(t) || 0) + 1);
    });

    const getNodeStyle = (id: string) => {
        // PRIORITY: Sequence Styling (Path Mode)
        if (sequenceNodeIds && sequenceNodeIds.includes(id)) {
             const index = sequenceNodeIds.indexOf(id);
             // Start of sequence
             if (index === 0) return { stroke: '#3b82f6', width: 5 }; // Blue
             // End of sequence
             if (index === sequenceNodeIds.length - 1) return { stroke: '#f97316', width: 5 }; // Orange
             // Waypoint (Middle)
             return { stroke: '#eab308', width: 5 }; // Yellow
        }

        // DEFAULT: Topology Styling
        const ins = inDegree.get(id) || 0;
        const outs = outDegree.get(id) || 0;
        
        // Start Node: Only outgoing (or mostly outgoing if we were fuzzy, but strict is fine here)
        if (ins === 0 && outs > 0) return { stroke: '#3b82f6', width: 4 }; // Blue
        
        // End Node: Only incoming
        if (outs === 0 && ins > 0) return { stroke: '#f97316', width: 4 }; // Orange
        
        // Default/Intermediate
        return { stroke: '#ffffff', width: 2 };
    };


    // --- 3. SIMULATION UPDATE ---
    
    let simulation = simulationRef.current;
    if (!simulation) {
        simulation = d3.forceSimulation<GraphNode, GraphLink>()
            .force("charge", d3.forceManyBody().strength(-500))
            .force("center", d3.forceCenter(0, 0)) 
            .force("collide", d3.forceCollide(50));
        simulationRef.current = simulation;
    }

    simulation.nodes(mutableNodes);
    
    // Re-initialize forceLink
    simulation.force("link", d3.forceLink<GraphNode, GraphLink>(mutableLinks)
        .id((d) => d.id)
        .distance(160)
    );

    // Restart simulation with energy
    simulation.alpha(1).restart();

    // --- 4. JOIN & RENDER ---

    const linkBaseGroup = container.select(".links-base");
    const linkFlowGroup = container.select(".links-flow");
    const linkLabelGroup = container.select(".link-labels");
    const nodeGroup = container.select(".nodes");
    const nodeLabelGroup = container.select(".node-labels");

    // Helper for color
    const getLinkColor = (d: GraphLink) => {
        if (d.effect === 'positive') return '#22c55e';
        if (d.effect === 'negative') return '#ef4444';
        return '#94a3b8';
    };

    // 4a. Update Links (Base)
    const linkBase = linkBaseGroup.selectAll<SVGLineElement, GraphLink>("line")
        .data(mutableLinks, (d: any) => {
            const s = typeof d.source === 'object' ? d.source.id : d.source;
            const t = typeof d.target === 'object' ? d.target.id : d.target;
            return `${s}-${t}`;
        })
        .join(
            enter => enter.append("line")
                .attr("stroke-width", 2)
                .attr("stroke", getLinkColor)
                .attr("stroke-opacity", 0) // Start invisible
                .call(enter => enter.transition().duration(800).attr("stroke-opacity", 0.15)),
            update => update
                .attr("stroke", getLinkColor),
            exit => exit.remove()
        );

    // 4b. Update Links (Flow/Animated)
    const linkFlow = linkFlowGroup.selectAll<SVGLineElement, GraphLink>("line")
        .data(mutableLinks, (d: any) => {
            const s = typeof d.source === 'object' ? d.source.id : d.source;
            const t = typeof d.target === 'object' ? d.target.id : d.target;
            return `${s}-${t}`;
        })
        .join(
            enter => enter.append("line")
                .attr("class", "link-animated")
                .attr("stroke-width", 2.5)
                .attr("stroke", getLinkColor)
                .attr("stroke-dasharray", "4, 16")
                .attr("marker-end", (d) => `url(#arrow-${d.effect})`)
                .attr("stroke-opacity", 0) // Start invisible
                .call(enter => enter.transition().duration(800).attr("stroke-opacity", 0.8)),
            update => update
                .attr("stroke", getLinkColor)
                .attr("marker-end", (d) => `url(#arrow-${d.effect})`),
            exit => exit.remove()
        );

    // 4c. Update Link Labels
    const linkLabels = linkLabelGroup.selectAll<SVGGElement, GraphLink>("g")
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
                
                // Text
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
                
                // Background Rect
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

    // Update rects for labels based on text size
    // Explicitly declaring 'd' as argument to avoid ReferenceError
    linkLabels.each(function(d: GraphLink) {
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
                // Using 'l' (inherited datum) in callback is safer than relying on closure 'd', although both should work.
                .attr("stroke", (l: any) => {
                    const link = l as GraphLink;
                    if (link.effect === 'positive') return '#86efac';
                    if (link.effect === 'negative') return '#fca5a5';
                    return '#e2e8f0';
                });
        } catch (e) { /* ignore if not rendered yet */ }
    });


    // 4d. Update Nodes
    const nodes = nodeGroup.selectAll<SVGGElement, GraphNode>("g")
        .data(mutableNodes, (d) => d.id)
        .join(
            enter => {
                const g = enter.append("g")
                    .attr("cursor", "pointer")
                    // Start small and expand
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
                
                // Animate expansion
                g.transition().duration(600).ease(d3.easeBackOut)
                    .attr("transform", (d) => `translate(${d.x || 0},${d.y || 0}) scale(1)`);
                
                return g;
            },
            update => {
                // Update topology styles on existing nodes (e.g., if a leaf becomes a connector or part of sequence)
                const g = update;
                g.select("circle")
                    .attr("stroke", (d) => getNodeStyle(d.id).stroke)
                    .attr("stroke-width", (d) => getNodeStyle(d.id).width);
                return g;
            },
            exit => exit.transition().duration(300).attr("transform", "scale(0)").remove()
        )
        // Re-attach event listeners on merge
        .on("click", (event, d) => {
            event.stopPropagation();
            onNodeClick(d);
        })
        .on("mouseover", (event: MouseEvent, d: GraphNode) => {
            setHoveredNode(d);
            setTooltipPos({ x: event.clientX, y: event.clientY });
            
            // Local hover highlight (only if not globally highlighted)
            if (!highlightedNodeIds || highlightedNodeIds.size === 0) {
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
            
            // Reset styles if no global highlight
            if (!highlightedNodeIds || highlightedNodeIds.size === 0) {
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
        linkBase
            .attr("x1", (d: GraphLink) => (d.source as GraphNode).x!)
            .attr("y1", (d: GraphLink) => (d.source as GraphNode).y!)
            .attr("x2", (d: GraphLink) => (d.target as GraphNode).x!)
            .attr("y2", (d: GraphLink) => (d.target as GraphNode).y!);

        linkFlow
            .attr("x1", (d: GraphLink) => (d.source as GraphNode).x!)
            .attr("y1", (d: GraphLink) => (d.source as GraphNode).y!)
            .attr("x2", (d: GraphLink) => (d.target as GraphNode).x!)
            .attr("y2", (d: GraphLink) => (d.target as GraphNode).y!);

        linkLabels
            .attr("transform", (d: GraphLink) => {
                const s = d.source as GraphNode;
                const t = d.target as GraphNode;
                const x = (s.x! + t.x!) / 2;
                const y = (s.y! + t.y!) / 2;
                return `translate(${x},${y})`;
            });

        // Use transform for nodes to handle both circle and text together
        nodes.attr("transform", (d: GraphNode) => `translate(${d.x},${d.y})`);
        
        nodeLabels
            .attr("x", (d: GraphNode) => d.x!)
            .attr("y", (d: GraphNode) => d.y!);
    });

  }, [data, dimensions, onNodeClick, sequenceNodeIds]); // Re-run if sequence updates

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