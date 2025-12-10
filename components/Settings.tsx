import React from 'react';
import { Button } from './Button';
import { Key, Shield, Database, Cpu, Lock } from 'lucide-react';

export const Settings: React.FC = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in text-grey">
      <h1 className="text-3xl font-bold text-black mb-2">Settings</h1>
      <p className="text-grey/70 mb-8">Manage API keys, preferences, and models.</p>

      <div className="space-y-8">
        
        {/* API Keys Section */}
        <section className="bg-white rounded-xl border border-grey/10 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-grey/10 flex items-center gap-3 bg-platinum/30">
             <div className="p-2 bg-coral/10 rounded-lg"><Key className="w-5 h-5 text-coral" /></div>
             <div>
               <h3 className="text-lg font-bold text-black">API Configuration</h3>
               <p className="text-sm text-grey/60">Manage your free tier API keys for Groq and Google Gemini.</p>
             </div>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-grey mb-2">Groq API Key (Transcription & Llama)</label>
              <div className="flex gap-2">
                <input 
                  type="password" 
                  className="flex-1 bg-platinum border border-grey/10 rounded-lg px-4 py-2 text-black focus:ring-2 focus:ring-teal outline-none"
                  placeholder="gsk_..."
                  value="gsk_**********************"
                  readOnly
                />
                <Button variant="secondary">Update</Button>
              </div>
              <p className="mt-1 text-xs text-grey/50">Free tier limit: 14,400 req/day</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-grey mb-2">Google Gemini API Key</label>
              <div className="flex items-center gap-2 px-4 py-3 bg-teal/5 border border-teal/10 rounded-lg">
                <Shield className="w-5 h-5 text-teal" />
                <span className="text-teal font-medium">Configured via secure environment</span>
              </div>
              <p className="mt-1 text-xs text-grey/50">Your Gemini API key is managed automatically for this session.</p>
            </div>
          </div>
        </section>

        {/* Model Selection */}
        <section className="bg-white rounded-xl border border-grey/10 shadow-sm overflow-hidden">
           <div className="p-6 border-b border-grey/10 flex items-center gap-3 bg-platinum/30">
             <div className="p-2 bg-teal/10 rounded-lg"><Cpu className="w-5 h-5 text-teal" /></div>
             <div>
               <h3 className="text-lg font-bold text-black">AI Models</h3>
               <p className="text-sm text-grey/60">Choose which models power Joyability.</p>
             </div>
          </div>
          <div className="p-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-teal bg-teal/5 cursor-pointer relative shadow-sm">
                   <div className="absolute top-2 right-2 text-xs bg-teal text-white px-2 py-0.5 rounded-full">Active</div>
                   <div className="font-bold text-black">Groq Whisper V3</div>
                   <p className="text-sm text-grey/70 mt-1">Transcription</p>
                   <p className="text-xs text-teal mt-2 font-medium">Fastest • 10h/month free</p>
                </div>
                <div className="p-4 rounded-lg border border-grey/10 bg-white hover:bg-platinum/50 cursor-pointer hover:border-grey/30 transition-colors">
                   <div className="font-bold text-black">Hugging Face Whisper</div>
                   <p className="text-sm text-grey/70 mt-1">Transcription Fallback</p>
                   <p className="text-xs text-grey/50 mt-2">Unlimited • Slower</p>
                </div>
             </div>
          </div>
        </section>

        {/* Data Privacy */}
        <section className="bg-white rounded-xl border border-grey/10 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-grey/10 flex items-center gap-3 bg-platinum/30">
             <div className="p-2 bg-bronze/10 rounded-lg"><Lock className="w-5 h-5 text-bronze" /></div>
             <div>
               <h3 className="text-lg font-bold text-black">Privacy & Storage</h3>
             </div>
          </div>
          <div className="p-6 flex items-center justify-between">
             <div>
               <div className="text-black font-medium">Local Processing Only</div>
               <p className="text-sm text-grey/60">Audio files are processed locally or via stateless APIs. No cloud storage.</p>
             </div>
             <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full border border-green-200">
               <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
               <span className="text-xs text-green-700 font-bold uppercase tracking-wide">Secure</span>
             </div>
          </div>
        </section>

      </div>
    </div>
  );
};