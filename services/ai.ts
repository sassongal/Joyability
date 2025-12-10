import { GoogleGenAI, Type } from "@google/genai";

const MODEL_FLASH = 'gemini-2.5-flash';
const MODEL_CHAT = 'gemini-3-pro-preview';
const MODEL_IMAGE = 'gemini-2.5-flash-image';
const MODEL_VIDEO = 'veo-3.1-fast-generate-preview';

// Lazy initialization to prevent top-level execution errors
let aiInstance: GoogleGenAI | null = null;

const getAi = () => {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiInstance;
};

// Types for structured output
export interface TranscriptSegment {
  timestamp: string;
  speaker: string;
  text: string;
}

// Helper to determine mime type
const getMimeType = (file: File): string => {
  if (file.type && file.type !== '' && file.type !== 'application/octet-stream') {
      return file.type;
  }
  const ext = file.name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'mp3': return 'audio/mpeg';
    case 'wav': return 'audio/wav';
    case 'm4a': return 'audio/mp4';
    case 'aac': return 'audio/aac';
    case 'ogg': return 'audio/ogg';
    case 'flac': return 'audio/flac';
    case 'webm': return 'audio/webm';
    default: return 'audio/mpeg'; 
  }
};

// Retry helper
async function retryOperation<T>(operation: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    const isInternalError = error.status === 500 || 
                            error.code === 500 || 
                            error.message?.includes('Internal error') ||
                            error.message?.includes('INTERNAL');
                            
    if (retries > 0 && isInternalError) {
      console.warn(`Retrying AI operation due to transient error. Attempts left: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryOperation(operation, retries - 1, delay * 2);
    }
    throw error;
  }
}

// Helper to wait for file to be ready
const waitForFileActive = async (fileUri: string): Promise<void> => {
  console.log("Waiting for file processing...");
  const apiKey = process.env.API_KEY;
  const name = fileUri.split('/').pop(); 
  
  for (let i = 0; i < 60; i++) { 
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/files/${name}?key=${apiKey}`);
        if (response.ok) {
            const data = await response.json();
            if (data.state === 'ACTIVE') {
                console.log("File is ACTIVE");
                await new Promise(r => setTimeout(r, 5000));
                return;
            }
            if (data.state === 'FAILED') throw new Error("File processing failed on Google servers");
        }
    } catch (e) { console.error("Error polling file status", e); }
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error("File processing timed out");
};

// Helper to upload large files
const uploadFileToGemini = async (file: File, mimeType: string): Promise<string> => {
    const apiKey = process.env.API_KEY;
    const metadata = { file: { display_name: file.name } };
    
    const initRes = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'X-Goog-Upload-Protocol': 'resumable',
            'X-Goog-Upload-Command': 'start',
            'X-Goog-Upload-Header-Content-Length': file.size.toString(),
            'X-Goog-Upload-Header-Content-Type': mimeType,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
    });

    const uploadUrl = initRes.headers.get('x-goog-upload-url');
    if (!uploadUrl) throw new Error("Failed to initiate upload");

    const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
            'Content-Length': file.size.toString(),
            'X-Goog-Upload-Offset': '0',
            'X-Goog-Upload-Command': 'upload, finalize',
        },
        body: file,
    });

    const result = await uploadRes.json();
    return result.file.uri;
};

export const aiService = {
  get client() {
    return getAi();
  },

  async translate(text: string): Promise<string> {
    return retryOperation(async () => {
      const response = await getAi().models.generateContent({
        model: MODEL_FLASH,
        contents: `Translate the following text. If it is in Hebrew, translate to English. If it is in English, translate to Hebrew. Only return the translated text. Text: "${text}"`,
      });
      return response.text || "";
    });
  },

  async fixGrammar(text: string): Promise<string> {
    return retryOperation(async () => {
      const response = await getAi().models.generateContent({
        model: MODEL_FLASH,
        contents: `Fix the grammar and spelling of the following text. Keep the tone natural and professional. Return only the corrected text. Text: "${text}"`,
      });
      return response.text || "";
    });
  },

  async addNikud(text: string): Promise<string> {
    return retryOperation(async () => {
      const response = await getAi().models.generateContent({
        model: MODEL_FLASH,
        contents: `Add Hebrew Nikud (vowels) to the following Hebrew text. Be accurate. Return only the text with Nikud. Text: "${text}"`,
      });
      return response.text || "";
    });
  },

  async generateSummary(transcript: string, templateType: string): Promise<string> {
    let prompt = "";
    switch (templateType) {
      case 'Sales Call Template':
        prompt = `Analyze the transcript. Create a Hebrew summary (unless content is purely English). Markdown format: Call Details, Objective, Key Points, Pain Points, Action Items, Deal Status.`;
        break;
      case 'Meeting Notes':
        prompt = `Summarize meeting in Hebrew (or English if appropriate). Markdown format: Attendees, Agenda, Decisions, Follow-up Tasks.`;
        break;
      case 'Interview':
        prompt = `Summarize interview. Markdown format: Candidate Name, Strengths, Weaknesses, Recommendation.`;
        break;
      default:
        prompt = "Summarize the transcript in professional Markdown.";
    }
    return retryOperation(async () => {
      const response = await getAi().models.generateContent({
        model: MODEL_FLASH,
        contents: `${prompt}\n\nTranscript:\n${transcript}`,
      });
      return response.text || "Summary generation failed.";
    });
  },

  async transcribeAudioStructured(file: File): Promise<TranscriptSegment[]> {
    try {
      const mimeType = getMimeType(file);
      console.log(`Starting structured transcription for: ${file.name}`);

      let fileDataPart: any;
      const SIZE_LIMIT_INLINE = 2 * 1024 * 1024; 

      if (file.size < SIZE_LIMIT_INLINE) {
        const base64 = await new Promise<string>((resolve, reject) => {
             const reader = new FileReader();
             reader.readAsDataURL(file);
             reader.onload = () => resolve((reader.result as string).split(',')[1]);
             reader.onerror = reject;
        });
        fileDataPart = { inlineData: { mimeType: mimeType, data: base64 } };
      } else {
         const fileUri = await uploadFileToGemini(file, mimeType);
         await waitForFileActive(fileUri);
         fileDataPart = { fileData: { mimeType: mimeType, fileUri: fileUri } };
      }

      return await retryOperation(async () => {
         const response = await getAi().models.generateContent({
            model: MODEL_FLASH,
            contents: [{
                parts: [
                    fileDataPart,
                    { text: `Transcribe this audio file. Identify speakers (e.g., Speaker 1, Speaker 2).
                      Return the result as a JSON array where each item has:
                      - 'timestamp' (string, format MM:SS)
                      - 'speaker' (string)
                      - 'text' (string)
                      
                      If the audio is in Hebrew, transcribe in Hebrew. If English, in English.` 
                    }
                ]
            }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            timestamp: { type: Type.STRING },
                            speaker: { type: Type.STRING },
                            text: { type: Type.STRING }
                        },
                        required: ["timestamp", "speaker", "text"]
                    }
                }
            }
         });
         
         const jsonText = response.text;
         if (!jsonText) throw new Error("No data returned");
         return JSON.parse(jsonText) as TranscriptSegment[];
      });

    } catch (error) {
      console.error("Transcription error:", error);
      throw error;
    }
  },

  async editImage(base64Image: string, mimeType: string, prompt: string): Promise<string | null> {
    return retryOperation(async () => {
        const response = await getAi().models.generateContent({
          model: MODEL_IMAGE,
          contents: [{ parts: [{ inlineData: { mimeType, data: base64Image } }, { text: prompt }] }]
        });
        const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        return part?.inlineData?.data ? `data:image/png;base64,${part.inlineData.data}` : null;
    });
  },

  async generateVideo(prompt: string): Promise<string> {
    // IMPORTANT: Create a new instance to pick up the API key if it was just selected by the user
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let operation = await ai.models.generateVideos({
      model: MODEL_VIDEO,
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Video generation failed or returned no URI.");

    // Fetch the final video content using the key
    const response = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  },

  async chat(message: string, history: any[] = []): Promise<string> {
    return retryOperation(async () => {
        const chat = getAi().chats.create({ model: MODEL_CHAT, history });
        const response = await chat.sendMessage({ message });
        return response.text || "";
    });
  }
};
