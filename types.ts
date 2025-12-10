export enum AppView {
  DASHBOARD = 'dashboard',
  TRANSCRIPTION = 'transcription',
  TOOLS = 'tools',
  SETTINGS = 'settings',
  CHATBOT = 'chatbot',
  IMAGE_EDITOR = 'image_editor',
  LIVE = 'live',
  VIDEO_CREATOR = 'video_creator'
}

export interface TranscriptionItem {
  id: string;
  filename: string;
  date: string;
  duration: string;
  status: 'completed' | 'processing' | 'failed';
  summary?: string;
  transcript?: string;
  tags?: string[];
}

export interface StatsData {
  name: string;
  transcriptions: number;
  fixes: number;
}

export enum LayoutMode {
  HEB_TO_ENG = 'HEB_TO_ENG',
  ENG_TO_HEB = 'ENG_TO_HEB',
  AUTO = 'AUTO'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}
