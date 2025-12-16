import React from 'react';
import { GROUP_COLORS, NodeGroup } from '../types';
import { FilterState } from '../App';

interface LegendProps {
  activeFilter?: FilterState;
  onFilterChange?: (filter: FilterState) => void;
}

const Legend: React.FC<LegendProps> = ({ activeFilter, onFilterChange }) => {
  
  const handleGroupClick = (group: string) => {
    if (activeFilter?.type === 'group' && activeFilter.value === group) {
      onFilterChange?.(null); // Deselect
    } else {
      onFilterChange?.({ type: 'group', value: group });
    }
  };

  const handleEffectClick = (effect: string) => {
    if (activeFilter?.type === 'effect' && activeFilter.value === effect) {
      onFilterChange?.(null); // Deselect
    } else {
      onFilterChange?.({ type: 'effect', value: effect });
    }
  };

  const getOpacity = (type: 'group' | 'effect', value: string) => {
    if (!activeFilter) return 1;
    if (activeFilter.type === type && activeFilter.value === value) return 1;
    return 0.3; // Dim inactive
  };

  return (
    <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur shadow-lg rounded-lg p-4 border border-slate-200 max-w-[200px] flex flex-col gap-4 transition-all duration-300">
      
      {/* Node Groups */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider flex justify-between items-center">
            Asset Classes
            <span className="text-[10px] text-slate-400 font-normal normal-case">(Click to filter)</span>
        </h3>
        <div className="flex flex-col gap-1">
          {Object.entries(GROUP_COLORS).filter(([group]) => group !== NodeGroup.UNKNOWN).map(([group, color]) => (
            <button 
                key={group} 
                onClick={() => handleGroupClick(group)}
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 transition-all text-left"
                style={{ opacity: getOpacity('group', group) }}
            >
              <span 
                className="w-3 h-3 rounded-full shadow-sm" 
                style={{ backgroundColor: color }}
              />
              <span className={`text-xs text-slate-700 ${activeFilter?.value === group ? 'font-bold' : 'font-medium'}`}>
                  {group}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="w-full h-px bg-slate-100" />

      {/* Relationships */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider">Correlations</h3>
        <div className="flex flex-col gap-1">
           <button 
             onClick={() => handleEffectClick('positive')}
             className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 transition-all text-left"
             style={{ opacity: getOpacity('effect', 'positive') }}
           >
             <div className="w-6 h-0.5 bg-emerald-500 relative">
                <div className="absolute right-0 -top-[3px] w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-emerald-500"></div>
             </div>
             <span className={`text-xs text-slate-700 ${activeFilter?.value === 'positive' ? 'font-bold' : 'font-medium'}`}>Positive (+)</span>
           </button>
           
           <button 
             onClick={() => handleEffectClick('negative')}
             className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 transition-all text-left"
             style={{ opacity: getOpacity('effect', 'negative') }}
           >
             <div className="w-6 h-0.5 bg-red-500 relative">
                <div className="absolute right-0 -top-[3px] w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-red-500"></div>
             </div>
             <span className={`text-xs text-slate-700 ${activeFilter?.value === 'negative' ? 'font-bold' : 'font-medium'}`}>Inverse (-)</span>
           </button>

           <button 
             onClick={() => handleEffectClick('neutral')}
             className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 transition-all text-left"
             style={{ opacity: getOpacity('effect', 'neutral') }}
           >
             <div className="w-6 h-0.5 bg-slate-400 relative">
                <div className="absolute right-0 -top-[3px] w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-slate-400"></div>
             </div>
             <span className={`text-xs text-slate-700 ${activeFilter?.value === 'neutral' ? 'font-bold' : 'font-medium'}`}>Neutral</span>
           </button>
        </div>
      </div>

    </div>
  );
};

export default Legend;