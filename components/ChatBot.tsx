import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { aiService } from '../services/ai';
import { Send, User, Bot, Loader2, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types';

export const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Create history for API
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      const result = await aiService.chat(userMsg.text, history);
      
      setMessages(prev => [...prev, {
        role: 'model',
        text: result,
        timestamp: new Date()
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'model',
        text: "I encountered an error. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col animate-fade-in p-8 overflow-hidden bg-platinum">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-black mb-2">AI Chatbot</h1>
        <p className="text-grey/70">Powered by Gemini 3 Pro Preview</p>
      </div>

      <div className="flex-1 bg-white rounded-xl border border-grey/10 flex flex-col overflow-hidden shadow-sm">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-grey/40">
              <div className="bg-platinum p-6 rounded-full mb-4">
                  <Sparkles className="w-12 h-12 text-teal opacity-50" />
              </div>
              <p className="font-medium">Start a conversation...</p>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm ${msg.role === 'user' ? 'bg-coral border-coral text-white' : 'bg-white border-grey/10 text-teal'}`}>
                  {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className={`p-4 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-coral text-white rounded-tr-none' : 'bg-platinum text-black rounded-tl-none border border-grey/5'}`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3">
                 <div className="w-8 h-8 rounded-full bg-white border border-grey/10 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-teal" />
                 </div>
                 <div className="p-4 bg-platinum rounded-2xl rounded-tl-none flex items-center border border-grey/5">
                    <Loader2 className="w-5 h-5 animate-spin text-grey/40" />
                 </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-grey/10">
           <div className="flex gap-2">
             <input
                className="flex-1 bg-platinum border border-grey/10 rounded-xl px-4 py-3 text-black focus:ring-2 focus:ring-teal focus:outline-none placeholder-grey/40"
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
             />
             <Button variant="primary" onClick={handleSend} disabled={isLoading || !input.trim()} className="rounded-xl px-4">
                <Send className="w-5 h-5" />
             </Button>
           </div>
        </div>
      </div>
    </div>
  );
};