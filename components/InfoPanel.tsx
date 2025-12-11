
import React from 'react';
import { GraphNode, GROUP_COLORS, FetchStatus } from '../types';
import { X, ExternalLink, Leaf, Info, RefreshCw, Crosshair } from 'lucide-react';

interface InfoPanelProps {
  selectedNode: GraphNode | null;
  details: string | null;
  detailsStatus: FetchStatus;
  onClose: () => void;
  onExpand: () => void;
  expandStatus: FetchStatus;
  onFocus: () => void;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ 
  selectedNode, 
  details, 
  detailsStatus, 
  onClose, 
  onExpand,
  expandStatus,
  onFocus
}) => {
  if (!selectedNode) return null;

  const color = GROUP_COLORS[selectedNode.group] || '#94a3b8';

  return (
    <div className="absolute top-4 right-4 w-80 md:w-96 bg-white/90 backdrop-blur-md shadow-xl rounded-xl border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] animate-in slide-in-from-right-10 fade-in duration-300">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full shadow-sm" 
            style={{ backgroundColor: color }}
          />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {selectedNode.group}
          </span>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">{selectedNode.label}</h2>
        
        {/* Short Description from Graph Data */}
        <p className="text-slate-600 mb-6 italic border-l-4 border-slate-200 pl-3">
          {selectedNode.description || "A naturally occurring entity."}
        </p>

        {/* AI Details Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2 text-slate-800 font-semibold">
            <Info size={16} className="text-blue-500" />
            <h3>AI Insights</h3>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg text-sm text-slate-700 leading-relaxed min-h-[100px]">
            {detailsStatus === 'loading' ? (
              <div className="flex items-center gap-2 text-blue-500 animate-pulse">
                <RefreshCw size={14} className="animate-spin" />
                <span>Consulting the field guide...</span>
              </div>
            ) : detailsStatus === 'error' ? (
              <span className="text-red-500">Failed to load details.</span>
            ) : (
              details || "No additional details available."
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {/* Primary Action: Focus */}
          <button
             onClick={onFocus}
             className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-all font-medium shadow-sm hover:shadow-md active:scale-95"
          >
             <Crosshair size={18} />
             <span>Focus Graph on {selectedNode.label}</span>
          </button>

          <div className="flex gap-3">
            <button 
              onClick={onExpand}
              disabled={expandStatus === 'loading'}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {expandStatus === 'loading' ? (
                  <RefreshCw size={18} className="animate-spin" />
              ) : (
                  <Leaf size={18} />
              )}
              <span>Expand</span>
            </button>
            
            <a 
              href={`https://www.google.com/search?q=${encodeURIComponent(selectedNode.label + " nature")}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors"
              title="Search on Google"
            >
              <ExternalLink size={20} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoPanel;