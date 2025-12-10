import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { aiService } from '../services/ai';
import { Video, Film, Loader2, Play, AlertCircle, ExternalLink } from 'lucide-react';

export const VideoCreator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPaidKey, setHasPaidKey] = useState<boolean | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('Generating video...');

  const loadingMessages = [
    "Conceptualizing scene...",
    "Rendering frames...",
    "Applying lighting effects...",
    "Finalizing composition...",
    "Almost there..."
  ];

  useEffect(() => {
    checkApiKey();
  }, []);

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      let i = 0;
      interval = setInterval(() => {
        setLoadingMessage(loadingMessages[i % loadingMessages.length]);
        i++;
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const checkApiKey = async () => {
    // Cast window to any to avoid type conflicts with existing global declarations of aistudio
    const win = window as any;
    if (win.aistudio && win.aistudio.hasSelectedApiKey) {
      const hasKey = await win.aistudio.hasSelectedApiKey();
      setHasPaidKey(hasKey);
    } else {
      // Fallback for dev environments where injection might not exist
      setHasPaidKey(true);
    }
  };

  const handleSelectKey = async () => {
    const win = window as any;
    if (win.aistudio && win.aistudio.openSelectKey) {
      await win.aistudio.openSelectKey();
      // Assume success after dialog interaction to avoid race conditions
      setHasPaidKey(true);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setVideoUrl(null);
    setLoadingMessage("Initializing generation...");

    try {
      const url = await aiService.generateVideo(prompt);
      setVideoUrl(url);
    } catch (error: any) {
      console.error("Video generation error:", error);
      if (error.message?.includes("Requested entity was not found") || error.message?.includes("404")) {
        alert("Authentication error. Please select your paid API Key again.");
        setHasPaidKey(false);
      } else {
        alert("Failed to generate video. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (hasPaidKey === false) {
    return (
      <div className="p-8 h-full flex flex-col items-center justify-center animate-fade-in bg-platinum">
        <div className="max-w-md text-center space-y-6 p-8 bg-white rounded-2xl border border-grey/10 shadow-lg">
          <div className="w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center mx-auto">
            <Video className="w-8 h-8 text-teal" />
          </div>
          <h2 className="text-2xl font-bold text-black">Veo Video Generation</h2>
          <p className="text-grey/70">
            To generate high-quality videos with the Veo model, you need to select a paid API key from a Google Cloud Project with billing enabled.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={handleSelectKey} size="lg">
              Select Paid API Key
            </Button>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center justify-center gap-2 text-sm text-teal hover:text-teal-hover font-medium"
            >
              Learn about billing <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 h-full overflow-hidden flex flex-col animate-fade-in bg-platinum">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">Veo Video Creator</h1>
        <p className="text-grey/70">Turn text prompts into stunning 720p videos using the Veo 3.1 model.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-hidden">
        {/* Input Section */}
        <div className="flex flex-col gap-6">
          <div className="bg-white p-6 rounded-xl border border-grey/10 flex-1 flex flex-col shadow-sm">
            <label className="text-lg font-bold text-black mb-4">Describe your video</label>
            <textarea 
              className="w-full flex-1 bg-platinum border border-grey/10 rounded-lg p-4 text-black focus:ring-2 focus:ring-teal outline-none resize-none text-lg leading-relaxed placeholder-grey/40"
              placeholder="A futuristic city with flying cars in a cyberpunk style, cinematic lighting..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading}
            />
            <div className="mt-6 flex justify-end">
              <Button onClick={handleGenerate} disabled={!prompt || isLoading} size="lg" className="w-full md:w-auto">
                 {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Film className="w-5 h-5 mr-2" />}
                 Generate Video
              </Button>
            </div>
            {isLoading && (
              <p className="text-center text-teal mt-4 animate-pulse font-medium">{loadingMessage}</p>
            )}
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-grey/10 shadow-sm">
             <h3 className="text-sm font-bold text-grey mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-teal" /> Tips for better results
             </h3>
             <ul className="text-xs text-grey/60 space-y-1 list-disc list-inside">
                <li>Be specific about lighting (e.g., "golden hour", "neon lights")</li>
                <li>Mention the camera style (e.g., "drone shot", "close up")</li>
                <li>Describe movement (e.g., "running fast", "panming left")</li>
             </ul>
          </div>
        </div>

        {/* Preview Section */}
        <div className="bg-black rounded-xl border border-grey/10 flex flex-col items-center justify-center relative overflow-hidden shadow-lg">
           {videoUrl ? (
             <div className="w-full h-full p-0 flex flex-col bg-black">
               <video 
                 src={videoUrl} 
                 controls 
                 autoPlay 
                 loop 
                 className="w-full h-full object-contain bg-black"
               />
               <div className="absolute bottom-6 right-6">
                 <a href={videoUrl} download={`veo-video-${Date.now()}.mp4`}>
                    <Button variant="secondary" className="shadow-lg backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 text-white">Download MP4</Button>
                 </a>
               </div>
             </div>
           ) : (
             <div className="text-center p-8">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                   <Play className="w-10 h-10 text-white/50 ml-1" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Ready to Create</h3>
                <p className="text-white/50 max-w-sm mx-auto">
                   Enter a prompt and hit generate. Video generation typically takes 1-2 minutes.
                </p>
             </div>
           )}
           
           {isLoading && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                 <Loader2 className="w-16 h-16 text-teal animate-spin mb-4" />
                 <p className="text-white font-bold text-lg tracking-wide">{loadingMessage}</p>
                 <p className="text-white/50 text-sm mt-2">Please do not close this tab</p>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};