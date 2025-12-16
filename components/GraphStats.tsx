import React, { useMemo } from 'react';
import { GraphData, GROUP_COLORS } from '../types';
import { X, Activity, Share2, CircleDot, Database } from 'lucide-react';

interface GraphStatsProps {
  isOpen: boolean;
  onClose: () => void;
  data: GraphData;
}

const GraphStats: React.FC<GraphStatsProps> = ({ isOpen, onClose, data }) => {
  const stats = useMemo(() => {
    const nodeCount = data.nodes ? data.nodes.length : 0;
    const linkCount = data.links ? data.links.length : 0;
    // Avg connections per node = (Links * 2) / Nodes (for undirected graph representation)
    const avgConnections = nodeCount > 0 ? (linkCount * 2 / nodeCount).toFixed(1) : '0';

    const groupCounts: Record<string, number> = {};
    (data.nodes || []).forEach(n => {
      groupCounts[n.group] = (groupCounts[n.group] || 0) + 1;
    });

    const groups = Object.entries(groupCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([group, count]) => ({
        group,
        count,
        percentage: nodeCount > 0 ? (count / nodeCount) * 100 : 0,
        color: GROUP_COLORS[group] || '#94a3b8'
      }));

    return { nodeCount, linkCount, avgConnections, groups };
  }, [data]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
              <Activity size={20} />
            </div>
            <h2 className="font-bold text-slate-800 text-lg">Graph Statistics</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-6 overflow-y-auto">
            {/* KPI Grid */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center shadow-sm">
                    <CircleDot size={20} className="text-blue-500 mb-2" />
                    <span className="text-2xl font-bold text-slate-800">{stats.nodeCount}</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Nodes</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center shadow-sm">
                    <Share2 size={20} className="text-emerald-500 mb-2" />
                    <span className="text-2xl font-bold text-slate-800">{stats.linkCount}</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Links</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center shadow-sm">
                    <Database size={20} className="text-purple-500 mb-2" />
                    <span className="text-2xl font-bold text-slate-800">{stats.avgConnections}</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Avg Conn</span>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {/* Distribution */}
                <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        Ecological Composition
                    </h3>
                    <div className="flex flex-col gap-3">
                        {stats.groups.map((g) => (
                            <div key={g.group} className="flex flex-col gap-1.5">
                                <div className="flex justify-between items-end text-xs">
                                    <span className="font-semibold text-slate-700">{g.group}</span>
                                    <span className="text-slate-500 font-medium">{g.count} ({Math.round(g.percentage)}%)</span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full rounded-full transition-all duration-700 ease-out"
                                        style={{ width: `${g.percentage}%`, backgroundColor: g.color }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default GraphStats;