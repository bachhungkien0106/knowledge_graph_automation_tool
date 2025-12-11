import React, { useState } from 'react';
import { X, Sparkles, FileText } from 'lucide-react';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
}

const NoteModal: React.FC<NoteModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [text, setText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                <FileText size={20} />
            </div>
            <div>
                <h2 className="font-bold text-lg">Visualize Your Notes</h2>
                <p className="text-xs text-slate-500">Paste your text below to generate a custom graph</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Text Area */}
        <div className="p-4 flex-1 overflow-hidden flex flex-col">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your article, study notes, or thoughts here... 
Example: 'Wolves are keystone species in Yellowstone. They hunt elk, which reduces overgrazing of willow trees. This allows beavers to return, creating dams that provide habitat for fish...'"
            className="w-full flex-1 p-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-slate-700 leading-relaxed font-mono text-sm"
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Sparkles size={18} />
            <span>Generate Graph</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteModal;