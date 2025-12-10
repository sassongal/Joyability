import React, { useState } from 'react';
import { Button } from './Button';
import { aiService } from '../services/ai';
import { Image, Wand2, Upload, Download, RefreshCw, X, Sparkles } from 'lucide-react';

export const ImageEditor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setResultImage(null);
      
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreview(ev.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleGenerate = async () => {
    if (!file || !prompt) return;
    setIsLoading(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const result = await aiService.editImage(base64, file.type, prompt);
        if (result) {
          setResultImage(result);
        } else {
          alert("Could not generate image. Try a different prompt.");
        }
        setIsLoading(false);
      };
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      alert("Error processing image.");
    }
  };

  const reset = () => {
    setFile(null);
    setImagePreview(null);
    setResultImage(null);
    setPrompt('');
  };

  return (
    <div className="p-8 h-full overflow-hidden flex flex-col animate-fade-in bg-platinum">
       <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">Nano Banana Image Editor</h1>
        <p className="text-grey/70">Edit images using text prompts with Gemini 2.5 Flash Image.</p>
      </div>

      {!imagePreview ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-grey/20 rounded-xl bg-white hover:bg-white/80 transition-all cursor-pointer shadow-sm">
           <div className="bg-platinum p-6 rounded-full mb-4">
              <Image className="w-10 h-10 text-teal" />
           </div>
           <h3 className="text-xl font-bold text-black mb-2">Upload Image to Edit</h3>
           <p className="text-grey/50 mb-6">JPG, PNG, WEBP</p>
           <label className="relative">
              <Button variant="primary" size="lg">Select Image</Button>
              <input 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                accept="image/*"
                onChange={handleFileSelect}
              />
            </label>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-2 gap-8 overflow-hidden">
           {/* Left: Input */}
           <div className="flex flex-col gap-4">
              <div className="bg-white p-4 rounded-xl border border-grey/10 h-2/3 flex items-center justify-center relative shadow-sm">
                 <img src={imagePreview} alt="Original" className="max-h-full max-w-full object-contain rounded-lg" />
                 <button onClick={reset} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full hover:bg-black/70 text-white transition-colors">
                    <X className="w-4 h-4" />
                 </button>
              </div>
              <div className="bg-white p-6 rounded-xl border border-grey/10 flex-1 flex flex-col gap-4 shadow-sm">
                 <label className="text-sm font-bold text-grey flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-coral" /> Edit Prompt
                 </label>
                 <textarea 
                    className="w-full flex-1 bg-platinum border border-grey/10 rounded-lg p-3 text-black focus:ring-2 focus:ring-teal outline-none resize-none placeholder-grey/40"
                    placeholder="e.g., 'Add a retro filter' or 'Make it look like a painting'"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                 />
                 <Button onClick={handleGenerate} disabled={!prompt || isLoading} className="w-full" size="lg">
                    {isLoading ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : <Wand2 className="w-5 h-5 mr-2" />}
                    Generate
                 </Button>
              </div>
           </div>

           {/* Right: Output */}
           <div className="bg-white p-4 rounded-xl border border-grey/10 flex flex-col items-center justify-center relative shadow-sm">
              {isLoading ? (
                 <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 border-4 border-platinum rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-teal rounded-full border-t-transparent animate-spin"></div>
                        <Wand2 className="absolute inset-0 m-auto w-8 h-8 text-teal animate-pulse" />
                    </div>
                    <h3 className="text-lg font-bold text-black mb-1">Creating Magic</h3>
                    <p className="text-grey/50">Applying your edits...</p>
                 </div>
              ) : resultImage ? (
                 <div className="flex flex-col items-center h-full w-full">
                    <div className="flex-1 flex items-center justify-center w-full mb-4">
                        <img src={resultImage} alt="Edited" className="max-h-full max-w-full object-contain rounded-lg shadow-md" />
                    </div>
                    <a href={resultImage} download="edited-image.png" className="w-full">
                       <Button variant="secondary" size="lg" className="w-full">
                          <Download className="w-5 h-5 mr-2" /> Download Image
                       </Button>
                    </a>
                 </div>
              ) : (
                 <div className="text-center text-grey/30">
                    <div className="bg-platinum p-6 rounded-full mx-auto mb-4 inline-block">
                        <Image className="w-12 h-12" />
                    </div>
                    <p className="font-medium">Edited image will appear here</p>
                 </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};