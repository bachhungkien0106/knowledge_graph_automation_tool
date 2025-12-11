import React from 'react';
import { GROUP_COLORS, NodeGroup } from '../types';

const Legend: React.FC = () => {
  return (
    <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur shadow-lg rounded-lg p-4 border border-slate-200 max-w-[200px] flex flex-col gap-4">
      
      {/* Node Groups */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider">Entity Types</h3>
        <div className="flex flex-col gap-2">
          {Object.entries(GROUP_COLORS).filter(([group]) => group !== NodeGroup.UNKNOWN).map(([group, color]) => (
            <div key={group} className="flex items-center gap-2">
              <span 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-slate-700 font-medium">{group}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full h-px bg-slate-100" />

      {/* Topology / Structure */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider">Structure</h3>
        <div className="flex flex-col gap-2">
           <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-full border-[3px] border-blue-500 bg-white"></div>
             <span className="text-xs text-slate-700 font-medium">Start Node (Source)</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-full border-[3px] border-orange-500 bg-white"></div>
             <span className="text-xs text-slate-700 font-medium">End Node (Sink)</span>
           </div>
        </div>
      </div>

      <div className="w-full h-px bg-slate-100" />

      {/* Relationships */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider">Relationships</h3>
        <div className="flex flex-col gap-2">
           <div className="flex items-center gap-2">
             <div className="w-6 h-0.5 bg-green-500 relative">
                <div className="absolute right-0 -top-[3px] w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-green-500"></div>
             </div>
             <span className="text-xs text-slate-700 font-medium">Positive (+)</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-6 h-0.5 bg-red-500 relative">
                <div className="absolute right-0 -top-[3px] w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-red-500"></div>
             </div>
             <span className="text-xs text-slate-700 font-medium">Negative (-)</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-6 h-0.5 bg-slate-400 relative">
                <div className="absolute right-0 -top-[3px] w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-slate-400"></div>
             </div>
             <span className="text-xs text-slate-700 font-medium">Neutral</span>
           </div>
        </div>
      </div>

    </div>
  );
};

export default Legend;