import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { fixLayout } from '../services/textUtils';
import { aiService } from '../services/ai';
import { ArrowRightLeft, Copy, Check, Globe, Sparkles, Languages, Clipboard, Trash2, History, Clock, AlertCircle, WifiOff, ShieldAlert, ZapOff, ChevronDown, ChevronUp } from 'lucide-react';

export const TextTools: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ title: string; message: string; type?: 'network' | 'safety' | 'quota' | 'generic' } | null>(null);
  const [activeTool, setActiveTool] = useState<'fixer' | 'translate' | 'grammar' | 'nikud'>('fixer');
  
  // History State
  const [history, setHistory] = useState<string[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);

  // Load history from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('joyability_text_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('joyability_text_history', JSON.stringify(history));
  }, [history]);

  const addToHistory = (text: string) => {
    setHistory(prev => {
      // Remove duplicates and keep top 10, new ones at the top
      const filtered = prev.filter(item => item !== text);
      return [text, ...filtered].slice(0, 10);
    });
  };

  const handleAction = async () => {
    if (!input.trim()) return;
    
    // Add to history when action is triggered
    addToHistory(input);

    setIsLoading(true);
    setError(null);
    setOutput('');

    try {
      let result = '';
      switch (activeTool) {
        case 'fixer':
          // Local algorithm, no API needed
          result = fixLayout(input);
          break;
        case 'translate':
          result = await aiService.translate(input);
          break;
        case 'grammar':
          result = await aiService.fixGrammar(input);
          break;
        case 'nikud':
          result = await aiService.addNikud(input);
          break;
      }
      setOutput(result);
    } catch (err: any) {
      console.error("TextTool Error:", err);
      
      const errorMessage = err?.message || err?.toString() || "";
      let errorTitle = "Processing Failed";
      let userMessage = "An unexpected error occurred. Please try again.";
      let errorType: 'network' | 'safety' | 'quota' | 'generic' = 'generic';

      // Analyze error type
      if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("resource exhausted")) {
         errorTitle = "Service Busy";
         userMessage = "The AI service is currently experiencing high traffic. Please wait a moment and try again.";
         errorType = 'quota';
      } else if (errorMessage.includes("safety") || errorMessage.includes("blocked") || errorMessage.includes("harmful")) {
         errorTitle = "Content Blocked";
         userMessage = "The text triggered our safety filters. Please try modifying the content.";
         errorType = 'safety';
      } else if (errorMessage.includes("network") || errorMessage.includes("fetch") || errorMessage.includes("connection")) {
         errorTitle = "Network Error";
         userMessage = "Please check your internet connection and try again.";
         errorType = 'network';
      } else if (errorMessage.includes("500") || errorMessage.includes("internal")) {
         errorTitle = "Server Error";
         userMessage = "The AI provider encountered an internal error. Please try again later.";
         errorType = 'generic';
      } else {
        // Tool-specific fallback messages
        switch (activeTool) {
            case 'translate':
                userMessage = "We couldn't translate this text. Ensure it's not too long and try again.";
                break;
            case 'grammar':
                userMessage = "Grammar correction failed. The AI service might be temporarily unavailable.";
                break;
            case 'nikud':
                userMessage = "Unable to add Nikud. Try processing a shorter segment of text.";
                break;
            case 'fixer':
                userMessage = "Could not process layout correction.";
                break;
        }
      }
      
      setError({ title: errorTitle, message: userMessage, type: errorType });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
    } catch (err) {
      console.error('Failed to read clipboard', err);
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError(null);
  };

  const handleHistoryItemClick = (text: string) => {
    setInput(text);
    setError(null);
    setOutput(''); // Clear previous output when loading history
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const getToolTitle = () => {
    switch (activeTool) {
      case 'fixer': return 'Fix Keyboard Layout';
      case 'translate': return 'Smart Translator';
      case 'grammar': return 'Grammar & Polish';
      case 'nikud': return 'Add Nikud';
    }
  };

  const getInputLabel = () => {
    switch (activeTool) {
      case 'fixer': return 'Paste text to fix (e.g. "akuo" → "שלום")';
      case 'translate': return 'Enter text to translate';
      case 'grammar': return 'Enter text to check grammar';
      case 'nikud': return 'Enter Hebrew text for Nikud';
      default: return 'Input';
    }
  };

  const handleToolChange = (tool: typeof activeTool) => {
    setActiveTool(tool);
    setOutput('');
    setError(null);
  };

  // Helper to get error icon
  const getErrorIcon = (type?: string) => {
    switch (type) {
        case 'network': return <WifiOff className="w-8 h-8 text-coral" />;
        case 'safety': return <ShieldAlert className="w-8 h-8 text-coral" />;
        case 'quota': return <ZapOff className="w-8 h-8 text-coral" />;
        default: return <AlertCircle className="w-8 h-8 text-coral" />;
    }
  };

  return (
    <div className="p-8 h-full overflow-hidden flex flex-col animate-fade-in bg-platinum">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">Text Tools</h1>
        <p className="text-grey/70">Quickly fix, translate, or enhance your text using AI.</p>
      </div>

      <div className="grid grid-cols-12 gap-8 h-full overflow-hidden">
        {/* Tools Sidebar */}
        <div className="col-span-3 flex flex-col h-full overflow-hidden space-y-4">
          <div className="space-y-2 shrink-0">
            <button 
              onClick={() => handleToolChange('fixer')}
              className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all border ${activeTool === 'fixer' ? 'bg-teal text-white border-teal shadow-md shadow-teal/20' : 'bg-white text-grey border-grey/10 hover:border-teal/30 hover:bg-platinum'}`}
            >
              <ArrowRightLeft className="w-5 h-5" />
              <div className="text-left">
                <div className="font-semibold">Keyboard Fixer</div>
                <div className="text-xs opacity-80">Hebrew ↔ English</div>
              </div>
            </button>
            
            <button 
              onClick={() => handleToolChange('translate')}
              className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all border ${activeTool === 'translate' ? 'bg-teal text-white border-teal shadow-md shadow-teal/20' : 'bg-white text-grey border-grey/10 hover:border-teal/30 hover:bg-platinum'}`}
            >
              <Globe className="w-5 h-5" />
              <div className="text-left">
                <div className="font-semibold">Translator</div>
                <div className="text-xs opacity-80">Gemini Powered</div>
              </div>
            </button>

            <button 
               onClick={() => handleToolChange('grammar')}
               className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all border ${activeTool === 'grammar' ? 'bg-teal text-white border-teal shadow-md shadow-teal/20' : 'bg-white text-grey border-grey/10 hover:border-teal/30 hover:bg-platinum'}`}
            >
              <Sparkles className="w-5 h-5" />
              <div className="text-left">
                <div className="font-semibold">Grammar Fix</div>
                <div className="text-xs opacity-80">Professional Polish</div>
              </div>
            </button>

            <button 
               onClick={() => handleToolChange('nikud')}
               className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all border ${activeTool === 'nikud' ? 'bg-teal text-white border-teal shadow-md shadow-teal/20' : 'bg-white text-grey border-grey/10 hover:border-teal/30 hover:bg-platinum'}`}
            >
              <Languages className="w-5 h-5" />
              <div className="text-left">
                <div className="font-semibold">Add Nikud</div>
                <div className="text-xs opacity-80">Vowelizer</div>
              </div>
            </button>
          </div>

          {/* History Section - Collapsible */}
          <div className={`flex flex-col bg-white rounded-xl border border-grey/10 overflow-hidden transition-all duration-300 ${isHistoryOpen ? 'flex-1 min-h-0' : 'h-auto shrink-0'} shadow-sm`}>
             <button 
               onClick={() => setIsHistoryOpen(!isHistoryOpen)}
               className="p-3 border-b border-grey/10 flex items-center justify-between w-full hover:bg-platinum transition-colors"
             >
                <div className="flex items-center gap-2 text-grey font-semibold text-sm">
                   <History className="w-4 h-4 text-bronze" /> Recent
                </div>
                <div className="flex items-center gap-2">
                  {history.length > 0 && isHistoryOpen && (
                    <span 
                      onClick={(e) => { e.stopPropagation(); clearHistory(); }} 
                      className="text-xs text-grey/50 hover:text-coral transition-colors px-2 py-1 rounded hover:bg-coral/10"
                      title="Clear history"
                    >
                      Clear
                    </span>
                  )}
                  {isHistoryOpen ? <ChevronDown className="w-4 h-4 text-grey/40" /> : <ChevronUp className="w-4 h-4 text-grey/40" />}
                </div>
             </button>
             
             {isHistoryOpen && (
               <div className="overflow-y-auto p-2 space-y-1">
                  {history.length === 0 ? (
                    <div className="text-center py-8 text-grey/40 text-xs">
                      No recent history
                    </div>
                  ) : (
                    history.map((item, idx) => (
                      <button 
                        key={idx}
                        onClick={() => handleHistoryItemClick(item)}
                        className="w-full text-left p-2 rounded-lg hover:bg-platinum transition-colors group border border-transparent hover:border-grey/10"
                      >
                         <div className="flex items-start gap-2">
                            <Clock className="w-3 h-3 text-grey/40 mt-1 shrink-0 group-hover:text-teal" />
                            <p className="text-xs text-grey/70 line-clamp-2 break-all group-hover:text-black">
                               {item}
                            </p>
                         </div>
                      </button>
                    ))
                  )}
               </div>
             )}
          </div>
        </div>

        {/* Main Work Area */}
        <div className="col-span-9 bg-white rounded-xl border border-grey/10 p-6 flex flex-col shadow-sm h-full overflow-hidden">
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex justify-between items-center mb-2 shrink-0">
                <label className="block text-sm font-bold text-grey">{getInputLabel()}</label>
                <div className="flex gap-2">
                  <button 
                    onClick={handlePaste}
                    className="flex items-center gap-1 text-xs text-teal hover:text-teal-hover transition-colors font-medium"
                  >
                    <Clipboard className="w-3 h-3" /> Paste
                  </button>
                  <button 
                    onClick={handleClear}
                    className="flex items-center gap-1 text-xs text-grey/50 hover:text-coral transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                </div>
              </div>
              <textarea
                className="w-full flex-1 bg-platinum border border-grey/10 rounded-lg p-4 text-black focus:ring-2 focus:ring-teal focus:border-transparent resize-none font-mono text-lg min-h-[150px] placeholder-grey/40"
                placeholder={activeTool === 'fixer' ? "Paste text like 'akuo' here..." : "Enter text..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </div>
            
            <div className="flex justify-center py-2 shrink-0">
              <Button onClick={handleAction} size="lg" className="w-48 rounded-full shadow-lg shadow-coral/20" isLoading={isLoading}>
                {getToolTitle()}
              </Button>
            </div>

            <div className="flex-1 relative flex flex-col min-h-0">
              <label className="block text-sm font-bold text-grey mb-2 shrink-0">Result</label>
              
              {error ? (
                 <div className="w-full flex-1 bg-red-50 border border-red-100 rounded-lg p-6 flex flex-col items-center justify-center text-center gap-2 min-h-[150px] animate-fade-in">
                    <div className="p-3 bg-red-100 rounded-full">
                       {getErrorIcon(error.type)}
                    </div>
                    <p className="text-coral font-bold text-lg mt-2">{error.title}</p>
                    <p className="text-grey/70 text-sm max-w-sm">{error.message}</p>
                    <Button variant="secondary" size="sm" onClick={handleAction} className="mt-4">
                       Try Again
                    </Button>
                 </div>
              ) : (
                <>
                  <textarea
                    className="w-full flex-1 bg-white border border-teal/20 rounded-lg p-4 text-black focus:ring-2 focus:ring-teal focus:border-transparent resize-none font-mono text-lg min-h-[150px] shadow-inner"
                    readOnly
                    value={output}
                    placeholder="Result will appear here..."
                  />
                  {output && (
                    <button 
                      onClick={handleCopy}
                      className="absolute top-10 right-4 p-2 bg-platinum hover:bg-grey/20 rounded-lg text-grey transition-colors border border-grey/10"
                      title="Copy to clipboard"
                    >
                      {copied ? <Check className="w-5 h-5 text-teal" /> : <Copy className="w-5 h-5" />}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};