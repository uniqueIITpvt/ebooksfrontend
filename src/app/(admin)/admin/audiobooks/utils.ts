import type { Audiobook } from '@/services/api/audiobooksApi';
import type { ScriptData, ScriptLanguageKey } from './types';

export function getRequiredScriptKeys(language?: string): ScriptLanguageKey[] {
  switch (language) {
    case 'Hindi':
      return ['hindi'];
    case 'Both':
      return ['english', 'hindi'];
    case 'English':
    default:
      return ['english'];
  }
}

export function getScriptLabel(key: ScriptLanguageKey) {
  return key === 'english' ? 'English' : 'Hindi';
}

export function getVoiceLanguageCode(language?: string) {
  if (language === 'Hindi') return 'hi';
  if (language === 'English') return 'en';
  return null;
}

export function narratorMatchesLanguage(narrator: any, languageCode: string) {
  const language = String(narrator?.language || '').toLowerCase();
  const name = String(narrator?.name || '').toLowerCase();
  const voiceId = String(narrator?.voiceId || narrator?.id || '').toLowerCase();

  if (languageCode === 'hi') {
    return (
      language === 'hi' ||
      language.startsWith('hi-') ||
      language.includes('hindi') ||
      name.includes('hindi') ||
      name.includes('à¤¹à¤¿à¤¨à¥à¤¦à¥€') ||
      name.includes('à¤¹à¤¿à¤‚à¤¦à¥€') ||
      voiceId.includes('hindi') ||
      voiceId.includes('hi-')
    );
  }

  return (
    language === 'en' ||
    language.startsWith('en-') ||
    language.includes('english') ||
    name.includes('english') ||
    name.includes('uniqueit') ||
    voiceId.includes('english') ||
    voiceId.includes('en-')
  );
}

export function isMaleNarrator(narrator: any) {
  return String(narrator?.gender || '').toLowerCase() === 'male';
}

export function normalizeScripts(rawScripts: any, legacyScript?: any, language: string = 'English'): ScriptData {
  const normalized: ScriptData = {};

  const assign = (key: ScriptLanguageKey, value: unknown) => {
    if (typeof value !== 'string') return;
    const content = value.trim();
    if (!content) return;
    normalized[key] = { content };
  };

  if (typeof rawScripts === 'string') {
    assign(language === 'Hindi' ? 'hindi' : 'english', rawScripts);
  } else if (rawScripts && typeof rawScripts === 'object') {
    assign('english', rawScripts.english?.content ?? rawScripts.english);
    assign('hindi', rawScripts.hindi?.content ?? rawScripts.hindi);
    if (!normalized.english && !normalized.hindi) {
      assign(language === 'Hindi' ? 'hindi' : 'english', rawScripts.content ?? rawScripts.text ?? rawScripts.body);
    }
  }

  if ((!normalized.english && !normalized.hindi) && legacyScript) {
    if (typeof legacyScript === 'string') {
      assign(language === 'Hindi' ? 'hindi' : 'english', legacyScript);
    } else if (typeof legacyScript === 'object') {
      assign('english', legacyScript.english?.content ?? legacyScript.english);
      assign('hindi', legacyScript.hindi?.content ?? legacyScript.hindi);
      assign(language === 'Hindi' ? 'hindi' : 'english', legacyScript.content);
    }
  }

  return normalized;
}

export function getScriptContent(scripts: ScriptData | undefined, key: ScriptLanguageKey) {
  return scripts?.[key]?.content || '';
}

export function buildPreviewPages(content: string) {
  const words = content.split(/\s+/).filter(Boolean);
  const pages: string[] = [];
  for (let i = 0; i < words.length; i += 220) {
    pages.push(words.slice(i, i + 220).join(' '));
  }
  return pages;
}

export function getGeneratedAudioUrl(book: any) {
  const generatedAudio = book?.generatedAudio;
  if (!generatedAudio) return '';

  if (typeof generatedAudio.url === 'string') return generatedAudio.url;

  const language = String(book?.language || generatedAudio.language || '').toLowerCase();
  const preferredKey = language.includes('hindi') ? 'hindi' : 'english';
  const preferredUrl = generatedAudio[preferredKey]?.url;
  if (typeof preferredUrl === 'string') return preferredUrl;

  const firstAudio = Object.values(generatedAudio).find(
    (entry: any) => entry && typeof entry.url === 'string'
  ) as any;

  return firstAudio?.url || '';
}

export function getGeneratedAudioFile(book: any) {
  const generatedAudio = book?.generatedAudio;
  const url = getGeneratedAudioUrl(book);
  if (!url) return null;

  const language = String(book?.language || generatedAudio?.language || '').toLowerCase();
  const preferredKey = language.includes('hindi') ? 'hindi' : 'english';
  const audioData =
    generatedAudio?.[preferredKey]?.url === url
      ? generatedAudio[preferredKey]
      : generatedAudio?.url === url
        ? generatedAudio
        : Object.values(generatedAudio || {}).find((entry: any) => entry?.url === url) as any;

  return {
    url,
    publicId: audioData?.publicId,
    originalName: audioData?.fileName || audioData?.originalName || 'Existing audiobook audio',
    fileSize: audioData?.fileSize,
    mimeType: audioData?.mimeType || 'audio/mpeg',
    duration: audioData?.duration,
    uploadedAt: audioData?.generatedAt || audioData?.uploadedAt,
  };
}

export function toBackendUrl(url: string) {
  if (!url) return '';
  return url.startsWith('http') ? url : `http://localhost:5000${url}`;
}

export async function readJsonFile<T>(file: File): Promise<T> {
  const text = await file.text();
  return JSON.parse(text) as T;
}

export function validateTranscript(value: Audiobook['transcript']) {
  const languages = value?.languages || [];
  if (!languages.length) {
    throw new Error('Transcript JSON must include at least one language');
  }

  languages.forEach((language) => {
    if (!language.code || !language.name || !language.segments?.length) {
      throw new Error('Each transcript language must include code, name, and segments');
    }

    let previousSegmentEnd = -1;
    language.segments.forEach((segment) => {
      if (segment.start < previousSegmentEnd || segment.end < segment.start) {
        throw new Error('Transcript segment timings must be ordered');
      }
      previousSegmentEnd = segment.end;

      let previousWordEnd = -1;
      (segment.words || []).forEach((word: { startTime: number; endTime: number; text: string }) => {
        if (word.startTime < previousWordEnd || word.endTime < word.startTime) {
          throw new Error('Transcript word timings must be ordered');
        }
        previousWordEnd = word.endTime;
      });
    });
  });
}

export function validateReaderPages(value: Audiobook['readerPages']) {
  const pages = value || [];
  if (!pages.length) {
    throw new Error('Reader pages JSON must include at least one page');
  }

  let previousPage = 0;
  pages.forEach((page) => {
    if (!page.pageNumber || page.pageNumber <= previousPage) {
      throw new Error('Reader pages must be ordered by pageNumber');
    }
    previousPage = page.pageNumber;
  });
}
