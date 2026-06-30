import type { Audiobook, AudiobookPayload } from '@/services/api/audiobooksApi';

export type SnackbarState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
};

export type ScriptEntry = {
  content: string;
};

export type ScriptData = {
  english?: ScriptEntry;
  hindi?: ScriptEntry;
};

export type VoiceSettings = {
  id?: string;
  name?: string;
  gender?: 'male';
  language?: string;
  speed: number;
  pitch: number;
};

export type GenerationStatus = {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
};

export type AudiobookForm = Omit<AudiobookPayload, 'type' | 'price' | 'tags'> & {
  _id?: string;
  id?: string;
  price: number;
  tags: string[];
  type?: 'Audiobook';
  imageCloudinary?: AudiobookPayload['imageCloudinary'];
  files?: Audiobook['files'];
  transcript?: Audiobook['transcript'];
  readerPages?: Audiobook['readerPages'];
  script?: string;
  selectedVoice?: string;
  scripts?: ScriptData;
  wordSync?: any;
  generatedAudio?: any;
  bookPages?: any;
  generation?: GenerationStatus;
  narratorName?: string;
  voice?: VoiceSettings;
};

export const SCRIPT_LANGUAGE_KEYS = ['english', 'hindi'] as const;
export type ScriptLanguageKey = (typeof SCRIPT_LANGUAGE_KEYS)[number];
