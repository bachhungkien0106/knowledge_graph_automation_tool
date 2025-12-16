import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Bot, User, Sparkles, Loader2, MessageSquare } from 'lucide-react';
import { ChatMessage, GraphData } from '../types';
import { chatWithGraphAssistant } from '../services/geminiService';

interface AssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  graphData: GraphData;
}

const QUICK_PROMPTS = [
  "Identify the keystone species",
  "Summarize this ecosystem",
  "Are there any invasive species?",
  "What happens if plants die?",
];

const AssistantPanel: React.FC<AssistantPanelProps> = ({ isOpen, onClose, graphData }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am EcoGuide. I can analyze the current graph structure for you. Ask me anything about the species and relationships visible right now.',
      timestamp: Date.now(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Prepare history for context
      const historyForApi = messages.map(m => ({ role: m.role, content: m.content }));
      
      const responseText = await chatWithGraphAssistant(text, graphData, historyForApi);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Assistant Error:", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting to my knowledge base right now. Please check your API key or internet connection.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // Helper to parse **bold** syntax and render it with highlighting
  const renderMessageContent = (content: string, role: 'user' | 'assistant') => {
    // Split by **text** pattern
    const parts = content.split(/(\*\*.*?\*\*)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // Remove the asterisks
        const text = part.slice(2, -2);
        return (
          <strong 
            key={index} 
            className={`font-bold ${role === 'assistant' ? 'text-teal-700 bg-teal-50 px-1 rounded' : 'text-white underline decoration-white/30'}`}
          >
            {text}
          </strong>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-4 right-4 w-80 md:w-96 h-[500px] max-h-[calc(100vh-6rem)] bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 z-40">
      
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-teal-600 to-emerald-600 flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm">EcoGuide</h3>
            <p className="text-[10px] text-teal-100 opacity-90">AI Ecologist Assistant</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-50">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
              msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-teal-100 text-teal-600'
            }`}>
              {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>
            
            <div className={`max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
            }`}>
              {renderMessageContent(msg.content, msg.role)}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                <Bot size={14} />
             </div>
             <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts (Only show if history is short or user idle) */}
      {!isTyping && (
        <div className="px-4 py-2 bg-slate-50 flex gap-2 overflow-x-auto scrollbar-hide">
            {QUICK_PROMPTS.map((prompt, i) => (
                <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    className="whitespace-nowrap px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs text-slate-600 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 transition-colors shadow-sm"
                >
                    {prompt}
                </button>
            ))}
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-slate-200">
        <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 border border-slate-200 focus-within:ring-2 focus-within:ring-teal-500 focus-within:bg-white transition-all">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            placeholder="Ask about the ecosystem..."
            className="flex-1 bg-transparent outline-none text-sm text-slate-800 placeholder-slate-500 min-w-0"
            disabled={isTyping}
          />
          <button 
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isTyping}
            className="p-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95"
          >
            {isTyping ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssistantPanel;