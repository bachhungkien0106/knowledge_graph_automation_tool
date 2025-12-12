import React, { useState, useEffect } from 'react';
import { X, Microscope, ArrowRight, Check, Loader2, Link } from 'lucide-react';
import { ResearchResult, FetchStatus } from '../types';

interface ResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResearch: (concept: string) => Promise<void>;
  status: FetchStatus;
  result: ResearchResult | null;
  onAddToGraph: () => void;
}

const ResearchModal: React.FC<ResearchModalProps> = ({ 
  isOpen, 
  onClose, 
  onResearch, 
  status, 
  result, 
  onAddToGraph 
}) => {
  const [concept, setConcept] = useState('');
  const [hasAdded, setHasAdded] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setHasAdded(false);
        setConcept('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearch = () => {
    if (concept.trim()) {
      setHasAdded(false);
      onResearch(concept);
    }
  };

  const handleAdd = () => {
    onAddToGraph();
    setHasAdded(true);
    setTimeout(() => {
        onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-purple-50">
          <div className="flex items-center gap-3 text-slate-800">
            <div className="bg-purple-200 p-2 rounded-lg text-purple-700">
                <Microscope size={22} />
            </div>
            <div>
                <h2 className="font-bold text-lg text-purple-900">Field Research Assistant</h2>
                <p className="text-xs text-purple-600 font-medium">Investigate disconnected concepts</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-purple-200 rounded-full transition-colors text-purple-400 hover:text-purple-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6">
            
            {/* Input Section */}
            <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700">What do you want to research?</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={concept}
                        onChange={(e) => setConcept(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="e.g. Climate Change, Humans, Mosquitoes..."
                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 placeholder-slate-400"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={!concept.trim() || status === 'loading'}
                        className="px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
                    >
                        {status === 'loading' ? <Loader2 size={20} className="animate-spin" /> : 'Analyze'}
                    </button>
                </div>
                <p className="text-xs text-slate-400">
                    The AI will analyze how this concept relates to your <strong>current</strong> ecosystem map.
                </p>
            </div>

            {/* Error Message */}
            {status === 'error' && (
                <div className="p-4 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                    Unable to research this concept. Please try again.
                </div>
            )}

            {/* Results Section */}
            {status === 'success' && result && (
                <div className="animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 mb-4">
                        <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                            <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded uppercase tracking-wider">{result.newNode.group}</span>
                            {result.newNode.label}
                        </h3>
                        <p className="text-slate-600 text-sm leading-relaxed mb-4">
                            {result.summary}
                        </p>
                        
                        <div className="bg-white rounded-lg border border-slate-200 p-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                                <Link size={12} /> Potential Connections
                            </h4>
                            {result.connections.length > 0 ? (
                                <ul className="space-y-2">
                                    {result.connections.map((conn, idx) => (
                                        <li key={idx} className="text-sm flex items-center gap-2 text-slate-700">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0"></span>
                                            <span>
                                                <strong>{conn.relation}</strong> <span className="underline decoration-slate-300 decoration-dotted underline-offset-2">{conn.targetNodeLabel}</span>
                                            </span>
                                            {conn.effect !== 'neutral' && (
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                                                    conn.effect === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {conn.effect}
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-slate-400 italic">No direct connections found to current view.</p>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={handleAdd}
                        disabled={hasAdded}
                        className={`w-full py-3 px-4 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                            hasAdded 
                            ? 'bg-green-500 text-white cursor-default' 
                            : 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg active:scale-95'
                        }`}
                    >
                        {hasAdded ? (
                            <>
                                <Check size={20} />
                                <span>Integrated into Graph</span>
                            </>
                        ) : (
                            <>
                                <ArrowRight size={20} />
                                <span>Add to Graph</span>
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ResearchModal;