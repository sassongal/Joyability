import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { aiService, TranscriptSegment } from '../services/ai';
import { Upload, FileAudio, Play, Pause, FileText, LayoutTemplate, Download, Copy, RefreshCw, X, Sparkles, Mic as MicIcon, Square, Search, Film } from 'lucide-react';

type Tab = 'transcript' | 'summary';

export const TranscriptionStudio: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'recording' | 'uploading' | 'processing' | 'completed'>('idle');
  const [activeTab, setActiveTab] = useState<Tab>('transcript');
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [filteredSegments, setFilteredSegments] = useState<TranscriptSegment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [summary, setSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [template, setTemplate] = useState('Sales Call Template');
  const [processingStatus, setProcessingStatus] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    let interval: any;
    if (status === 'recording') {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSegments(segments);
    } else {
      const lower = searchQuery.toLowerCase();
      setFilteredSegments(segments.filter(s => 
        s.text.toLowerCase().includes(lower) || 
        s.speaker.toLowerCase().includes(lower)
      ));
    }
  }, [searchQuery, segments]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const recordedFile = new File([blob], `recording-${new Date().toISOString()}.webm`, { type: 'audio/webm' });
        handleFileSelect(recordedFile);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setStatus('recording');
      setRecordingTime(0);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFileSelect(files[0]);
  };

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setStatus('processing');
    setProcessingStatus('Preparing file...');

    try {
      if (selectedFile.size > 2 * 1024 * 1024) {
         setProcessingStatus('Uploading large file (Pro Mode)...');
      } else {
         setProcessingStatus('Processing audio...');
      }

      const structuredData = await aiService.transcribeAudioStructured(selectedFile);
      
      setSegments(structuredData);
      setFilteredSegments(structuredData);
      setStatus('completed');
      setProcessingStatus('');
      
      const fullText = structuredData.map(s => `${s.speaker}: ${s.text}`).join('\n');
      generateSummary(fullText, template);
      
    } catch (error) {
      console.error(error);
      setStatus('idle');
      alert("Transcription failed. Please try again.");
    }
  };

  const generateSummary = async (text: string, selectedTemplate: string) => {
    setIsGeneratingSummary(true);
    try {
      const result = await aiService.generateSummary(text, selectedTemplate);
      setSummary(result);
    } catch (error) {
      setSummary("Failed to generate summary.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTemplate = e.target.value;
    setTemplate(newTemplate);
    if (segments.length > 0) {
      const fullText = segments.map(s => `${s.speaker}: ${s.text}`).join('\n');
      generateSummary(fullText, newTemplate);
    }
  };

  const exportSRT = () => {
    let srtContent = '';
    segments.forEach((seg, index) => {
       const start = seg.timestamp.length === 5 ? `00:${seg.timestamp},000` : `${seg.timestamp},000`;
       srtContent += `${index + 1}\n${start} --> ${start}\n${seg.text}\n\n`;
    });
    
    const blob = new Blob([srtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${new Date().toISOString()}.srt`;
    a.click();
  };

  const reset = () => {
    setFile(null);
    setStatus('idle');
    setSegments([]);
    setFilteredSegments([]);
    setSummary('');
    setRecordingTime(0);
    setProcessingStatus('');
  };

  if (status === 'idle') {
    return (
      <div className="p-8 h-full flex flex-col animate-fade-in text-grey">
        <h1 className="text-3xl font-bold text-black mb-2">Transcription Studio <span className="text-teal text-sm ml-2 bg-teal/10 px-2 py-1 rounded">Pro</span></h1>
        <p className="text-grey/70 mb-8">Record or upload audio (up to 2GB). Get structured transcripts.</p>
        
        <div className="flex gap-6 h-64">
           {/* Recording Area */}
           <div className="flex-1 bg-white rounded-xl border border-grey/10 flex flex-col items-center justify-center p-6 hover:border-coral transition-all group shadow-sm">
              <div className="bg-coral/10 p-6 rounded-full mb-4 group-hover:bg-coral/20 transition-colors cursor-pointer" onClick={startRecording}>
                 <MicIcon className="w-8 h-8 text-coral" />
              </div>
              <h3 className="text-xl font-medium text-black mb-1">Start Recording</h3>
              <p className="text-grey/60 text-sm">Use your microphone</p>
           </div>

           {/* Upload Area */}
           <div 
            className="flex-1 border-2 border-dashed border-grey/20 rounded-xl bg-white/50 flex flex-col items-center justify-center cursor-pointer hover:border-teal hover:bg-white transition-all"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
           >
            <div className="bg-platinum p-4 rounded-full mb-4">
              <Upload className="w-8 h-8 text-teal" />
            </div>
            <h3 className="text-xl font-medium text-black mb-2">Upload Audio File</h3>
            <p className="text-grey/60 mb-6 text-sm">MP3, M4A, WAV</p>
            <label className="relative">
              <Button variant="secondary" size="sm">Browse Files</Button>
              <input 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                accept="audio/*"
                onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
              />
            </label>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'recording') {
    return (
      <div className="p-8 h-full flex flex-col items-center justify-center animate-fade-in">
        <div className="w-full max-w-md bg-white p-12 rounded-xl border border-grey/10 text-center relative overflow-hidden shadow-lg">
          <div className="absolute inset-0 bg-coral/5 animate-pulse"></div>
          <div className="relative z-10">
             <div className="mb-6 flex justify-center">
                <MicIcon className="w-16 h-16 text-coral animate-pulse" />
             </div>
             <h3 className="text-2xl font-bold text-black mb-2">Recording...</h3>
             <p className="text-4xl font-mono text-grey mb-8">{formatTime(recordingTime)}</p>
             <Button variant="danger" size="lg" onClick={stopRecording}>
               <Square className="w-5 h-5 mr-2" fill="currentColor" /> Stop & Transcribe
             </Button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'processing' || status === 'uploading') {
    return (
      <div className="p-8 h-full flex flex-col items-center justify-center animate-fade-in">
        <div className="w-full max-w-md bg-white p-8 rounded-xl border border-grey/10 text-center shadow-md">
          <div className="mb-6 flex justify-center">
             <RefreshCw className="w-12 h-12 text-teal animate-spin" />
          </div>
          <h3 className="text-xl font-bold text-black mb-2">Analyzing Audio...</h3>
          <p className="text-grey/60 mb-2 text-sm">{file?.name}</p>
          <p className="text-teal text-xs mb-6">{processingStatus}</p>
          <div className="w-full bg-platinum rounded-full h-2.5 mb-2 overflow-hidden">
            <div className="animate-shimmer w-full h-full bg-teal"></div>
          </div>
          <p className="text-xs text-grey/50">Generative AI • Speaker ID • Timestamping</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col animate-fade-in bg-platinum">
      {/* Toolbar */}
      <div className="h-16 border-b border-grey/10 px-6 flex items-center justify-between bg-white shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-platinum px-3 py-1.5 rounded-lg border border-grey/10">
            <FileAudio className="w-4 h-4 text-teal" />
            <span className="text-sm font-medium text-black truncate max-w-[150px]">{file?.name}</span>
          </div>
          <div className="h-6 w-px bg-grey/10 mx-2"></div>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 hover:bg-platinum rounded-full text-grey transition-colors"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex items-center gap-3">
           <Button size="sm" variant="ghost" onClick={reset}>
             <X className="w-4 h-4 mr-2" /> Close
           </Button>
           <Button size="sm" variant="secondary" onClick={exportSRT}>
             <Film className="w-4 h-4 mr-2" /> Export SRT
           </Button>
           <Button size="sm" variant="primary" onClick={() => setActiveTab('summary')}>
             <Sparkles className="w-4 h-4 mr-2" /> View Summary
           </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-platinum">
           {/* Tabs */}
           <div className="flex border-b border-grey/10 bg-white">
             <button 
                onClick={() => setActiveTab('transcript')}
                className={`px-6 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'transcript' ? 'border-teal text-teal' : 'border-transparent text-grey/60 hover:text-black'}`}
             >
               <FileText className="w-4 h-4" /> Transcript ({filteredSegments.length})
             </button>
             <button 
                onClick={() => setActiveTab('summary')}
                className={`px-6 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'summary' ? 'border-teal text-teal' : 'border-transparent text-grey/60 hover:text-black'}`}
             >
               <LayoutTemplate className="w-4 h-4" /> AI Summary
             </button>
           </div>

           {/* Content */}
           <div className="flex-1 p-0 overflow-y-auto">
             {activeTab === 'summary' ? (
                <div className="p-8 max-w-3xl mx-auto">
                  <div className="bg-white p-8 rounded-xl border border-grey/10 shadow-sm relative">
                   {isGeneratingSummary && (
                     <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-xl z-10">
                       <div className="text-center">
                         <Sparkles className="w-8 h-8 text-teal animate-spin mx-auto mb-2" />
                         <p className="text-black font-medium">Generating AI Summary...</p>
                       </div>
                     </div>
                   )}
                   <div className="flex justify-between mb-4">
                      <select 
                        value={template}
                        onChange={handleTemplateChange}
                        className="bg-platinum border border-grey/10 text-grey text-sm rounded-lg focus:ring-teal focus:border-teal block p-2.5"
                      >
                        <option>Sales Call Template</option>
                        <option>Meeting Notes</option>
                        <option>Interview</option>
                      </select>
                      <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(summary)}>
                        <Copy className="w-4 h-4 mr-2" /> Copy
                      </Button>
                   </div>
                   <div className="prose prose-slate max-w-none">
                     <pre className="whitespace-pre-wrap font-sans text-grey leading-relaxed">{summary || "No summary available."}</pre>
                   </div>
                  </div>
                </div>
             ) : (
                <div className="h-full flex flex-col">
                   {/* Search Bar */}
                   <div className="p-4 border-b border-grey/10 bg-white sticky top-0 z-10">
                      <div className="relative max-w-md">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-grey/50" />
                         <input 
                            type="text"
                            placeholder="Search transcript..."
                            className="w-full bg-platinum border border-grey/10 rounded-lg pl-10 pr-4 py-2 text-sm text-black focus:ring-1 focus:ring-teal outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                         />
                      </div>
                   </div>
                   
                   {/* Transcript List */}
                   <div className="flex-1 p-6 space-y-4">
                      {filteredSegments.length > 0 ? filteredSegments.map((seg, idx) => (
                        <div key={idx} className="flex gap-4 group hover:bg-white p-4 rounded-lg transition-all border border-transparent hover:border-grey/10 hover:shadow-sm">
                           <div className="w-16 shrink-0 pt-1">
                              <span className="text-xs font-mono text-teal bg-teal/10 px-2 py-1 rounded cursor-pointer hover:bg-teal/20">
                                 {seg.timestamp}
                              </span>
                           </div>
                           <div className="flex-1">
                              <h4 className="text-xs font-bold text-grey/60 mb-1 uppercase tracking-wider">{seg.speaker}</h4>
                              <p className="text-black leading-relaxed">{seg.text}</p>
                           </div>
                        </div>
                      )) : (
                         <div className="text-center py-20 text-grey/50">
                            <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No segments found matching "{searchQuery}"</p>
                         </div>
                      )}
                   </div>
                </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};