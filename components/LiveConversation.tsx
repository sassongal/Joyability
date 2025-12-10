import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { aiService } from '../services/ai';
import { Mic, MicOff, Power, Activity } from 'lucide-react';
import { LiveServerMessage, Modality } from '@google/genai';

// Audio Context Helpers
const createAudioContexts = () => {
  const input = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
  const output = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  return { input, output };
};

export const LiveConversation: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [statusText, setStatusText] = useState("Ready to connect");
  
  // Refs for audio handling to persist across renders
  const contextsRef = useRef<{input: AudioContext, output: AudioContext} | null>(null);
  const sessionRef = useRef<any>(null); // Type 'any' for Session object from connect
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Helper to decode Base64 to ArrayBuffer
  const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  // Helper to decode raw PCM data to AudioBuffer
  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number = 24000,
    numChannels: number = 1
  ) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const createBlob = (data: Float32Array) => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    
    // Encode to base64
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const b64 = btoa(binary);

    return {
      data: b64,
      mimeType: 'audio/pcm;rate=16000'
    };
  };

  const connect = async () => {
    try {
      setStatusText("Initializing audio...");
      const { input, output } = createAudioContexts();
      contextsRef.current = { input, output };
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStatusText("Connecting to Gemini Live...");

      // Connect to Gemini Live API
      const sessionPromise = aiService.client.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
             voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: "You are a helpful and energetic bilingual productivity assistant named Joy.",
        },
        callbacks: {
          onopen: () => {
            setStatusText("Connected! Start talking.");
            setIsConnected(true);

            // Setup audio input stream
            const source = input.createMediaStreamSource(stream);
            const scriptProcessor = input.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              if (isMuted) return; // Simple mute logic (doesn't send data)
              
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(input.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            
            if (base64Audio) {
              const ctx = contextsRef.current?.output;
              if (!ctx) return;

              const bytes = decodeBase64(base64Audio);
              const audioBuffer = await decodeAudioData(bytes, ctx);
              
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              
              // Scheduler for gapless playback
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              
              sourcesRef.current.add(source);
              source.onended = () => {
                sourcesRef.current.delete(source);
              };
            }
          },
          onclose: () => {
             setStatusText("Connection closed.");
             setIsConnected(false);
          },
          onerror: (e) => {
             console.error(e);
             setStatusText("Error occurred.");
          }
        }
      });
      
      // Wait for session to be established to store ref
      sessionRef.current = await sessionPromise;

    } catch (err) {
      console.error(err);
      setStatusText("Failed to connect: " + (err as Error).message);
    }
  };

  const disconnect = () => {
    // Close context
    if (contextsRef.current) {
      contextsRef.current.input.close();
      contextsRef.current.output.close();
      contextsRef.current = null;
    }
    // Stop all sources
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    
    // Close session
    setIsConnected(false);
    setStatusText("Disconnected");
    window.location.reload(); 
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 animate-fade-in bg-platinum">
      <div className="w-full max-w-md text-center space-y-12">
        
        <div className="relative">
          {/* Visual Indicator Ring */}
          <div className={`w-64 h-64 mx-auto rounded-full flex items-center justify-center transition-all duration-700 ${
              isConnected 
                ? 'bg-white shadow-[0_0_60px_rgba(240,93,94,0.3)] border-4 border-coral/20' 
                : 'bg-white border-4 border-grey/5 shadow-sm'
            }`}
          >
             {isConnected ? (
                <div className="space-y-4 animate-fade-in">
                   <div className="relative">
                     <div className="absolute inset-0 bg-coral opacity-20 rounded-full animate-ping"></div>
                     <div className="relative bg-coral/10 p-6 rounded-full">
                        <Activity className="w-20 h-20 text-coral animate-pulse" />
                     </div>
                   </div>
                   <p className="text-sm font-bold text-coral uppercase tracking-widest">Live</p>
                </div>
             ) : (
                <MicOff className="w-20 h-20 text-grey/20" />
             )}
          </div>
        </div>

        <div>
           <h2 className="text-3xl font-bold text-black mb-2">Gemini Live Conversation</h2>
           <p className="text-grey/60 font-medium">{statusText}</p>
        </div>

        <div className="flex justify-center gap-6">
           {!isConnected ? (
              <Button onClick={connect} size="lg" className="rounded-full px-10 py-4 text-lg shadow-xl shadow-coral/20">
                 Start Conversation
              </Button>
           ) : (
              <>
                 <Button onClick={toggleMute} variant="secondary" size="lg" className={`rounded-full w-16 h-16 p-0 flex items-center justify-center shadow-lg transition-all ${isMuted ? 'bg-grey text-white hover:bg-black' : ''}`}>
                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                 </Button>
                 <Button onClick={disconnect} variant="danger" size="lg" className="rounded-full w-16 h-16 p-0 flex items-center justify-center shadow-lg">
                    <Power className="w-6 h-6" />
                 </Button>
              </>
           )}
        </div>
      </div>
    </div>
  );
};