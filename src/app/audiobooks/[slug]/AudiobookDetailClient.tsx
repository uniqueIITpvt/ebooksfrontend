'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useRef } from 'react';
import Image from 'next/image';
import { BACKEND_URL } from '@/config/backend-url.config';
import { audiobooksApi } from '@/services/api/audiobooksApi';
import { tokenStore } from '@/services/api/tokenStore';

interface Audiobook {
  id: string;
  slug?: string;
  title: string;
  author: string;
  description: string;
  category: string;
  language?: string;
  duration?: string;
  publishDate?: string;
  price: string;
  originalPrice?: string;
  rating?: number;
  reviews?: number;
  featured?: boolean;
  bestseller?: boolean;
  tags?: string[];
  status?: string;
  isActive?: boolean;
  isPublished?: boolean;
  accessLevel?: 'free' | 'premium';
  image?: string;
  imageCloudinary?: any;
  files?: {
    ebook?: any;
    audiobook?: any;
  };
  transcript?: any;
  readerPages?: any;
  scripts?: {
    english?: {
      content: string;
    };
    hindi?: {
      content: string;
    };
  } | string;  // Can be direct string or object
  script?: {
    english?: string;
    hindi?: string;
  } | string;  // Can be direct string or object
  wordSync?: any;
  bookPages?: any;
  generation?: any;
  generatedAudio?: {
    url?: string;
    fileName?: string;
    generatedAt?: string;
    voice?: string;
    language?: string;
  };
  narratorName?: string;
  narrator?: string;
  voice?: any;
  selectedVoice?: any;
  pages?: any;
  isbn?: string;
  format?: string[];
}

interface AudiobookDetailClientProps {
  audiobook: Audiobook;
}

type TimedTranscriptWord = {
  text: string;
  startTime: number;
  endTime: number;
  segmentIndex: number;
  wordIndex: number;
};

type EstimatedWordTiming = {
  startTime: number;
  endTime: number;
};

const THEME = {
  pageBg: '#f9fafb',
  surface: '#ffffff',
  surfaceAlt: '#f8fafc',
  surfaceMuted: '#eff6ff',
  border: '#e5e7eb',
  text: '#0f172a',
  textMuted: '#475569',
  textSoft: '#64748b',
  accent: '#2563eb',
  accentSoft: 'rgba(37,99,235,.10)',
  accentBorder: 'rgba(37,99,235,.22)',
  accentGlow: 'rgba(37,99,235,.16)',
};

function splitScriptWords(text: string) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/([,;:.!?])(?=\S)/g, '$1 ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function getWordTimingWeight(word: string) {
  const cleanWord = word.replace(/[^\p{L}\p{N}]/gu, '');
  const base = Math.max(cleanWord.length, 1);
  const commaPause = /[,;:]/.test(word) ? 1.5 : 0;
  const sentencePause = /[.!?]$/.test(word) ? 3 : 0;
  const paragraphPause = /\n/.test(word) ? 2 : 0;

  return base + commaPause + sentencePause + paragraphPause;
}

function buildEstimatedWordTimings(words: string[], totalDuration: number): EstimatedWordTiming[] {
  if (!words.length || !Number.isFinite(totalDuration) || totalDuration <= 0) return [];

  const weights = words.map(getWordTimingWeight);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  if (totalWeight <= 0) return [];

  let cursor = 0;
  return weights.map((weight, index) => {
    const startTime = cursor;
    const endTime =
      index === weights.length - 1
        ? totalDuration
        : Math.min(totalDuration, cursor + (weight / totalWeight) * totalDuration);
    cursor = endTime;
    return { startTime, endTime };
  });
}

function findEstimatedWordIndex(timings: EstimatedWordTiming[], time: number) {
  if (!timings.length) return -1;

  let low = 0;
  let high = timings.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const timing = timings[mid];
    if (time < timing.startTime) {
      high = mid - 1;
    } else if (time >= timing.endTime) {
      low = mid + 1;
    } else {
      return mid;
    }
  }

  return time >= timings[timings.length - 1].endTime ? timings.length - 1 : -1;
}

export default function AudiobookDetailClient({ audiobook }: AudiobookDetailClientProps) {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState('1');
  const [activeTab, setActiveTab] = useState('transcript');
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [avgRating, setAvgRating] = useState(audiobook.rating || 0);
  const [reviewCount, setReviewCount] = useState(audiobook.reviews || 0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [claimingAccess, setClaimingAccess] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const speechTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speechStartRef = useRef<number>(0);
  const highlightedWordRef = useRef<HTMLSpanElement>(null);

  const getScriptText = (): string => {
    return (
      (typeof audiobook.script === 'object' && audiobook.script?.english) ||
      (typeof audiobook.script === 'object' && audiobook.script?.hindi) ||
      (typeof audiobook.scripts === 'string' ? audiobook.scripts : audiobook.scripts?.english?.content) ||
      (typeof audiobook.scripts === 'string' ? audiobook.scripts : audiobook.scripts?.hindi?.content) ||
      (typeof audiobook.script === 'string' ? audiobook.script : '') ||
      ''
    ) as string;
  };

  const scriptWords = useMemo(() => splitScriptWords(getScriptText()), [audiobook]);
  const estimatedWordTimings = useMemo(
    () => buildEstimatedWordTimings(scriptWords, duration),
    [duration, scriptWords]
  );

  const transcriptWords = useMemo<TimedTranscriptWord[]>(() => {
    const languages = Array.isArray(audiobook.transcript?.languages)
      ? audiobook.transcript.languages
      : [];
    const language =
      languages.find((item: any) => item.code === audiobook.generatedAudio?.language) ||
      languages.find((item: any) => {
        const code = String(item.code || '').toLowerCase();
        const audiobookLanguage = String(audiobook.language || '').toLowerCase();
        return (
          (audiobookLanguage === 'hindi' && code.startsWith('hi')) ||
          (audiobookLanguage === 'english' && code.startsWith('en'))
        );
      }) ||
      languages[0];

    if (!language?.segments?.length) return [];

    return language.segments.flatMap((segment: any, segmentIndex: number) =>
      (segment.words || []).map((word: any, wordIndex: number) => ({
        text: String(word.text || ''),
        startTime: Number(word.startTime ?? word.start ?? segment.startTime ?? segment.start ?? 0),
        endTime: Number(word.endTime ?? word.end ?? segment.endTime ?? segment.end ?? 0),
        segmentIndex,
        wordIndex,
      }))
    ).filter((word: TimedTranscriptWord) => word.text && word.endTime > word.startTime);
  }, [audiobook]);

  const transcriptDisplayWords = transcriptWords.map((word) => word.text);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getNumericPrice = (value?: string) =>
    Number.parseFloat(String(value || '0').replace(/[^0-9.]/g, '')) || 0;

  const isFreeAudiobook =
    audiobook.accessLevel === 'free' || getNumericPrice(audiobook.price) <= 0;

  const getGeneratedAudioUrl = () => {
    const generatedAudio: any = audiobook.generatedAudio;
    if (!generatedAudio) return '';

    if (typeof generatedAudio.url === 'string') return generatedAudio.url;

    const language = String(audiobook.language || generatedAudio.language || '').toLowerCase();
    const preferredKey = language.includes('hindi') ? 'hindi' : 'english';
    const preferredUrl = generatedAudio[preferredKey]?.url;
    if (typeof preferredUrl === 'string') return preferredUrl;

    const firstAudio = Object.values(generatedAudio).find(
      (entry: any) => entry && typeof entry.url === 'string'
    ) as any;

    return firstAudio?.url || '';
  };

  const getAudiobookAudioUrl = () => {
    const rawUrl = audiobook.files?.audiobook?.url || getGeneratedAudioUrl();
    if (!rawUrl) return '';
    return rawUrl.startsWith('http') ? rawUrl : `${BACKEND_URL}${rawUrl}`;
  };

  const handleAccessClick = async () => {
    const id = audiobook.slug || audiobook.id || (audiobook as any)._id;

    if (!id) return;

    const token = tokenStore.getAccessToken();

    if (!token) {
      router.push(`/user/auth?returnUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (!isFreeAudiobook) {
      router.push(`/checkout?kind=audiobook&id=${audiobook.id || (audiobook as any)._id}&slug=${id}&mode=buy`);
      return;
    }

    setClaimingAccess(true);
    try {
      const response = await audiobooksApi.claim(id);
      router.push(response.data?.redirectTarget || `/audiobooks/${id}/listen`);
    } catch (error: any) {
      alert(error?.message || 'Unable to claim this audiobook');
    } finally {
      setClaimingAccess(false);
    }
  };

  const handleDownloadClick = async () => {
    const id = audiobook.slug || audiobook.id || (audiobook as any)._id;
    if (!id) return;

    const token = tokenStore.getAccessToken();

    if (!token) {
      router.push(`/user/auth?returnUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    try {
      const accessResponse = await audiobooksApi.getAccess(id);
      const access = accessResponse.data;

      if (access?.requiresCheckout || access?.action === 'buy') {
        router.push(`/checkout?kind=audiobook&id=${audiobook.id || (audiobook as any)._id}&slug=${id}&mode=buy`);
        return;
      }

      if (access?.action === 'claim') {
        await audiobooksApi.claim(id);
      }
    } catch (error: any) {
      const message = String(error?.message || '').toLowerCase();
      if (message.includes('401') || message.includes('login') || message.includes('authorized')) {
        router.push(`/user/auth?returnUrl=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      if (!isFreeAudiobook) {
        router.push(`/checkout?kind=audiobook&id=${audiobook.id || (audiobook as any)._id}&slug=${id}&mode=buy`);
        return;
      }

      alert(error?.message || 'Unable to verify audiobook access');
      return;
    }

    const fullUrl = getAudiobookAudioUrl();
    if (!fullUrl) {
      alert('Audio file not available for download. Please generate audio first.');
      return;
    }

    try {
      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `${audiobook.title.replace(/[^a-z0-9]/gi, '_')}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (error: any) {
      alert(error?.message || 'Unable to download audiobook audio.');
    }
  };

  const handleNextPage = () => {
    const scriptContent = (typeof audiobook.script === 'object' && audiobook.script?.english) ||
      (typeof audiobook.script === 'object' && audiobook.script?.hindi) ||
      (typeof audiobook.scripts === 'string' ? audiobook.scripts : audiobook.scripts?.english?.content) ||
      (typeof audiobook.scripts === 'string' ? audiobook.scripts : audiobook.scripts?.hindi?.content) ||
      (typeof audiobook.script === 'string' ? audiobook.script : '') ||
      '';
    if (!scriptContent) return;

    const totalPages = Math.ceil(scriptWords.length / 220);

    if (currentPage < totalPages - 1) {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(currentPage + 1);
        setIsFlipping(false);
      }, 300);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(currentPage - 1);
        setIsFlipping(false);
      }, 300);
    }
  };

  const getCurrentPageContent = () => {
    const scriptContent = (typeof audiobook.script === 'object' && audiobook.script?.english) ||
      (typeof audiobook.script === 'object' && audiobook.script?.hindi) ||
      (typeof audiobook.scripts === 'string' ? audiobook.scripts : audiobook.scripts?.english?.content) ||
      (typeof audiobook.scripts === 'string' ? audiobook.scripts : audiobook.scripts?.hindi?.content) ||
      (typeof audiobook.script === 'string' ? audiobook.script : '') ||
      '';
    if (!scriptContent) return null;

    const startIdx = currentPage * 220;
    const endIdx = startIdx + 220;
    const pageWords = scriptWords.slice(startIdx, endIdx);

    return {
      content: pageWords.join(' '),
      pageNumber: currentPage + 1,
      totalPages: Math.ceil(scriptWords.length / 220),
      wordCount: pageWords.length,
      words: pageWords,
      globalStartIdx: startIdx
    };
  };

  // Audio sync and word highlighting
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);

      if (transcriptWords.length) {
        const timedWordIndex = transcriptWords.findIndex(
          (word) => audio.currentTime >= word.startTime && audio.currentTime < word.endTime
        );

        if (timedWordIndex !== currentWordIndex) {
          setCurrentWordIndex(timedWordIndex);
        }

        if (timedWordIndex >= 0 && activeTab !== 'transcript' && audio.currentTime > 0) {
          setActiveTab('transcript');
        }

        return;
      }

      if (!estimatedWordTimings.length) return;

      const estimatedWordIndex = findEstimatedWordIndex(estimatedWordTimings, audio.currentTime);
      
      if (estimatedWordIndex >= 0 && estimatedWordIndex !== currentWordIndex) {
        setCurrentWordIndex(estimatedWordIndex);
        
        // Auto-switch to transcript tab when audio starts
        if (activeTab !== 'transcript' && audio.currentTime > 0) {
          setActiveTab('transcript');
        }
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentWordIndex(-1);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentWordIndex, activeTab, transcriptWords, estimatedWordTimings]);

  // Load voices for speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadVoices = () => { };
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      } else {
        loadVoices();
      }
    }
  }, []);

  // Auto-scroll highlighted word into view in transcript
  useEffect(() => {
    const word = highlightedWordRef.current;
    if (!word) return;

    const scrollParent = word.closest('[data-transcript-scroll]');
    const parentRect = scrollParent?.getBoundingClientRect();
    const wordRect = word.getBoundingClientRect();

    if (!parentRect || wordRect.top < parentRect.top || wordRect.bottom > parentRect.bottom) {
      word.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    }
  }, [currentWordIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = parseFloat(playbackRate) || 1;
  }, [playbackRate]);

  // Restore rating state from localStorage on page load
  useEffect(() => {
    const abId = String((audiobook as any)._id || audiobook.id || '');
    if (!abId) return;

    const alreadyRated = localStorage.getItem(`rated_ab_${abId}`);
    if (!alreadyRated) return;

    const savedVal = parseInt(localStorage.getItem(`rated_ab_${abId}_val`) || '0', 10);

    if (savedVal === 0) {
      // Stale entry from old code (no _val saved) — clear it so user can re-rate
      localStorage.removeItem(`rated_ab_${abId}`);
      return;
    }

    setRatingSubmitted(true);
    setUserRating(savedVal);

    const savedAvg = parseFloat(localStorage.getItem(`rated_ab_${abId}_avg`) || '0');
    const savedCount = parseInt(localStorage.getItem(`rated_ab_${abId}_count`) || '0', 10);
    // Only use cached values when server still shows 0 (revalidation hasn't caught up)
    if (savedAvg > 0 && (audiobook.rating || 0) === 0) setAvgRating(savedAvg);
    if (savedCount > 0 && (audiobook.reviews || 0) === 0) setReviewCount(savedCount);
  }, [audiobook]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTogglePlay = async () => {
    const audio = audioRef.current;

    // Handle pause/resume for HTML audio element
    if (audio && !audio.paused) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    // Handle pause for speech synthesis
    if (isPlaying) {
      fallbackToSpeechSynthesis();
      return;
    }

    // Try generated audio file if available
    const preferredAudioUrl = getAudiobookAudioUrl();
    if (preferredAudioUrl && audio) {
      const audioUrl = preferredAudioUrl;

      // Silently check the file exists before attempting playback
      try {
        const check = await fetch(audioUrl, { method: 'HEAD' });
        if (check.ok) {
          if (audio.src !== audioUrl) {
            const resumeAt = currentTime > 0 && currentTime < (duration || Number.POSITIVE_INFINITY)
              ? currentTime
              : 0;
            audio.src = audioUrl;
            audio.load();
            audio.currentTime = resumeAt;
          }
          audio.playbackRate = parseFloat(playbackRate);
          await audio.play();
          setIsPlaying(true);
          return;
        }
        // File not found — fall through to speech synthesis silently
      } catch {
        // Network error — fall through to speech synthesis silently
      }
    }

    // Use Web Speech API synthesis
    fallbackToSpeechSynthesis();
  };

  const handleAudioSeek = (value: number) => {
    const audio = audioRef.current;
    const nextTime = Math.min(Math.max(0, value), duration || Math.max(0, value));

    if (audio && audio.src) {
      audio.currentTime = nextTime;
    }

    setCurrentTime(nextTime);
  };

  const handleAudioSkip = (delta: number) => {
    handleAudioSeek(currentTime + delta);
  };

  const handleRestartAudio = () => {
    handleAudioSeek(0);
  };

  const handleEndAudio = () => {
    if (duration > 0) handleAudioSeek(duration);
  };

  const fallbackToSpeechSynthesis = (startWordIndex?: number) => {
    const isWordClick = startWordIndex !== undefined;

    // Toggle off: cancel if no specific word was clicked
    if (!isWordClick && isPlaying) {
      window.speechSynthesis.cancel();
      if (speechTimerRef.current) clearInterval(speechTimerRef.current);
      setIsPlaying(false);
      setCurrentWordIndex(-1);
      return;
    }

    // Cancel any existing synthesis before starting new playback
    window.speechSynthesis.cancel();
    if (speechTimerRef.current) clearInterval(speechTimerRef.current);

    const fromIdx = startWordIndex ?? 0;
    const scriptText = getScriptText();
    if (!scriptText) return;

    const allWords = scriptWords;
    const wordsFromIdx = allWords.slice(fromIdx);
    if (wordsFromIdx.length === 0) return;

    const utteranceText = wordsFromIdx.join(' ');
    const utterance = new SpeechSynthesisUtterance(utteranceText);

    const hasHindi = /[ऀ-ॿ]/.test(scriptText);
    utterance.lang = hasHindi ? 'hi-IN' : 'en-US';
    utterance.rate = Math.max(0.5, Math.min(2, parseFloat(playbackRate) || 1));
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    let selectedVoice: SpeechSynthesisVoice | undefined;
    if (hasHindi) {
      selectedVoice =
        voices.find(v => v.name.includes('Madhur')) ||
        voices.find(v => v.name.toLowerCase().includes('male') && v.lang.startsWith('hi'));
    } else {
      const narratorName: string = (audiobook.narratorName || audiobook.narrator || '') as string;
      selectedVoice = voices.find(v => narratorName.length > 3 && v.name.toLowerCase().includes(narratorName.toLowerCase()));
      if (!selectedVoice) {
        selectedVoice = voices.find(v => v.name.includes('David') || v.name.includes('James') || v.name.includes('Daniel') || v.name.includes('Alex') || v.name.includes('Fred') || v.name.toLowerCase().includes('male')) || voices.find(v => v.lang.startsWith('en'));
      }
    }
    if (selectedVoice) utterance.voice = selectedVoice;

    const wordsPerSec = 2.5 * utterance.rate;
    const estimatedTotalDuration = allWords.length / wordsPerSec;
    const estimatedElapsed = fromIdx / wordsPerSec;
    const wordOffsets = wordsFromIdx.reduce<number[]>((offsets, word, index) => {
      const previousOffset = index === 0 ? 0 : offsets[index - 1] + wordsFromIdx[index - 1].length + 1;
      offsets.push(previousOffset);
      return offsets;
    }, []);

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        let relIdx = wordOffsets.findIndex((offset, index) => (
          event.charIndex >= offset &&
          event.charIndex < (wordOffsets[index + 1] ?? utteranceText.length + 1)
        ));
        if (relIdx < 0) relIdx = wordsFromIdx.length - 1;
        const globalIdx = Math.min(fromIdx + relIdx, allWords.length - 1);
        setCurrentWordIndex(globalIdx);
        setCurrentTime(globalIdx / wordsPerSec);
      }
    };

    utterance.onstart = () => {
      setIsPlaying(true);
      setCurrentWordIndex(-1);
      setCurrentTime(estimatedElapsed);
      setDuration(estimatedTotalDuration);
      setActiveTab('transcript');
      speechStartRef.current = Date.now() - estimatedElapsed * 1000;
      speechTimerRef.current = setInterval(() => {
        const elapsed = (Date.now() - speechStartRef.current) / 1000;
        setCurrentTime(Math.min(elapsed, estimatedTotalDuration));
      }, 250);
    };

    const stopTimer = () => {
      if (speechTimerRef.current) {
        clearInterval(speechTimerRef.current);
        speechTimerRef.current = null;
      }
    };

    utterance.onend = () => {
      stopTimer();
      setIsPlaying(false);
      setCurrentWordIndex(-1);
      setCurrentTime(0);
      setDuration(0);
    };

    utterance.onerror = (event) => {
      if (event.error === 'interrupted' || event.error === 'canceled') return;
      stopTimer();
      setIsPlaying(false);
    };

    // For word-click restart, delay speak() so cancel() fully flushes in Chrome
    if (isWordClick) {
      setTimeout(() => window.speechSynthesis.speak(utterance), 80);
    } else {
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleWordClick = (wordIndex: number) => {
    const audio = audioRef.current;
    if (audio && audio.src) {
      const timedWord = transcriptWords[wordIndex];
      if (timedWord) {
        audio.currentTime = timedWord.startTime;
        setCurrentWordIndex(wordIndex);
        setCurrentTime(timedWord.startTime);
        if (audio.paused) void audio.play();
        return;
      }

      const estimatedTiming = estimatedWordTimings[wordIndex];
      if (estimatedTiming) {
        audio.currentTime = estimatedTiming.startTime;
        setCurrentWordIndex(wordIndex);
        setCurrentTime(estimatedTiming.startTime);
        if (audio.paused) void audio.play();
      }
      return;
    }
    fallbackToSpeechSynthesis(wordIndex);
  };

  const handleRating = async (stars: number) => {
    const abId = String((audiobook as any)._id || audiobook.id || '');
    if (!abId) return;

    const isUpdate = ratingSubmitted && userRating > 0;

    if (isUpdate) {
      // User is changing their rating — update local display only (don't double-count in DB)
      setUserRating(stars);
      // Recalculate average: undo old rating, apply new one
      const base = reviewCount > 0 ? (avgRating * reviewCount - userRating) / Math.max(reviewCount - 1, 1) : 0;
      const newAvg = reviewCount <= 1 ? stars : Math.round(((base * (reviewCount - 1)) + stars) / reviewCount * 10) / 10;
      setAvgRating(newAvg);
      localStorage.setItem(`rated_ab_${abId}_val`, String(stars));
      localStorage.setItem(`rated_ab_${abId}_avg`, String(newAvg));
      return;
    }

    // First-time rating — optimistic update immediately
    const newCount = reviewCount + 1;
    const newAvg = Math.round(((avgRating * reviewCount) + stars) / newCount * 10) / 10;
    setUserRating(stars);
    setAvgRating(newAvg);
    setReviewCount(newCount);
    setRatingSubmitted(true);
    localStorage.setItem(`rated_ab_${abId}`, 'true');
    localStorage.setItem(`rated_ab_${abId}_val`, String(stars));
    localStorage.setItem(`rated_ab_${abId}_avg`, String(newAvg));
    localStorage.setItem(`rated_ab_${abId}_count`, String(newCount));

    try {
      const res = await fetch(`${BACKEND_URL}/api/audiobooks/${abId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: stars }),
      });
      const data = await res.json();
      if (data.success) {
        setAvgRating(data.rating);
        setReviewCount(data.reviews);
        localStorage.setItem(`rated_ab_${abId}_avg`, String(data.rating));
        localStorage.setItem(`rated_ab_${abId}_count`, String(data.reviews));
      }
    } catch {
      // keep optimistic values on network failure
    }
  };

  return (
    <div style={{ fontFamily: 'var(--font-dm-sans, "DM Sans"), var(--font-devanagari, "Noto Sans Devanagari"), sans-serif', background: THEME.pageBg, color: THEME.text, minHeight: '100vh', paddingTop: 0, overflowX: 'hidden' }}>
      {/* Hidden Audio Element — src set dynamically in handleTogglePlay to avoid preload errors */}
      <audio ref={audioRef} preload="none" crossOrigin="anonymous" />

      <style>{`
        * { box-sizing: border-box; }
        body { background: ${THEME.pageBg}; color: ${THEME.text}; }
        
        .highlighted-word {
          display: inline-block;
          background: rgba(37, 99, 235, 0.14);
          color: ${THEME.text};
          padding: 2px 4px;
          border-radius: 3px;
          font-weight: 500;
          line-height: 1.6;
          vertical-align: baseline;
          transition: background-color 0.16s ease, color 0.16s ease, box-shadow 0.16s ease;
        }
        
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .hero-cover { max-width: 280px !important; margin: 0 auto !important; }
          .hero-padding { padding: 14px 16px 20px !important; }
          .content-grid { grid-template-columns: 1fr !important; gap: 20px !important; padding: 20px 16px !important; }
          .action-buttons { flex-wrap: wrap !important; }
          .action-buttons button { flex: 1 1 45% !important; font-size: 12px !important; padding: 10px 12px !important; }
        }
      `}</style>

      {/* Hero */}
      <div className="hero-padding" style={{ background: 'linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)', borderBottom: `1px solid ${THEME.border}`, padding: '18px 40px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <button
            onClick={() => router.back()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: THEME.textMuted,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '13px',
              fontFamily: 'inherit',
              marginBottom: '16px',
            }}
          >
            ← Back
          </button>

          <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '36px', alignItems: 'start' }}>
            {/* Cover */}
            <div className="hero-cover" style={{ position: 'relative', width: '100%', maxWidth: '260px', paddingBottom: '133.333%' }}>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  // background: '#0a0a0f',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  boxShadow: '0 10px 50px rgba(122, 99, 99, 0.75)',
                }}
              >
                {audiobook.image && (
                  <Image src={audiobook.image} alt={audiobook.title} fill style={{ objectFit: 'contain' }} />
                )}
              </div>
            </div>

            {/* Meta */}
            <div>
              <div style={{ display: 'flex', gap: '7px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px', background: 'rgba(139,92,246,.12)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,.3)' }}>
                  ● Transcribed
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px', background: THEME.accentSoft, color: THEME.accent, border: `1px solid ${THEME.accentBorder}` }}>
                  {audiobook.language}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px', background: THEME.surfaceAlt, color: THEME.textMuted, border: `1px solid ${THEME.border}` }}>
                  {audiobook.category}
                </span>
              </div>

              <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '28px', fontWeight: 700, marginBottom: '6px', lineHeight: 1.2 }}>
                {audiobook.title}
              </h1>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', fontSize: '13px', color: THEME.textSoft }}>
                <span>👤 {audiobook.author}</span>
                <span>⏱ {audiobook.duration || 'N/A'}</span>
                {/* Interactive star rating */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ display: 'flex', gap: '1px' }}>
                    {[1, 2, 3, 4, 5].map(star => {
                      const filled = star <= (hoverRating || userRating || Math.round(avgRating));
                      return (
                        <button
                          key={star}
                          onClick={() => handleRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0 1px',
                            fontSize: '20px',
                            color: filled ? '#f59e0b' : '#d1d5db',
                            transition: 'color 0.12s, transform 0.1s',
                            lineHeight: 1,
                            transform: filled ? 'scale(1.2)' : 'scale(1)',
                          }}
                        >
                          ★
                        </button>
                      );
                    })}
                  </div>
                  <span style={{ fontSize: '13px', color: THEME.textSoft }}>
                    {avgRating > 0 ? avgRating.toFixed(1) : '–'} ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                  </span>
                  {ratingSubmitted
                    ? <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: 600 }}>✓ {userRating}★ rated</span>
                    : <span style={{ fontSize: '11px', color: THEME.textSoft }}>tap to rate</span>
                  }
                </div>
              </div>

              <div style={{ maxWidth: '620px', marginBottom: '18px' }}>
                <p
                  style={{
                    fontSize: '14px',
                    color: THEME.textMuted,
                    lineHeight: 1.7,
                    marginBottom: audiobook.description.length > 220 ? '6px' : 0,
                    ...(!showFullDescription
                      ? {
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }
                      : {}),
                  }}
                >
                  {audiobook.description}
                </p>
                {audiobook.description.length > 220 && (
                  <button
                    type="button"
                    onClick={() => setShowFullDescription((value) => !value)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: THEME.accent,
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 700,
                      padding: 0,
                    }}
                  >
                    {showFullDescription ? 'show less' : '...more'}
                  </button>
                )}
              </div>

              <div className="action-buttons" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={handleAccessClick}
                  disabled={claimingAccess}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '10px 22px',
                    borderRadius: '6px',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: claimingAccess ? 'not-allowed' : 'pointer',
                    border: 'none',
                    background: '#16a34a',
                    color: '#ffffff',
                    boxShadow: '0 4px 18px rgba(22, 163, 74, .16)',
                    opacity: claimingAccess ? 0.7 : 1,
                  }}
                >
                  {claimingAccess ? 'Claiming...' : isFreeAudiobook ? 'Claim / Enroll' : 'Buy Now'}
                </button>
                <button
                  onClick={handleTogglePlay}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '10px 22px',
                    borderRadius: '6px',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    background: THEME.accent,
                    color: '#ffffff',
                    boxShadow: `0 4px 18px ${THEME.accentGlow}`,
                  }}
                >
                  {isPlaying ? '⏸ Pause' : '▶ Play Now'}
                </button>
                <button
                  onClick={() => setActiveTab('book')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '10px 22px',
                    borderRadius: '6px',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: `1px solid ${THEME.border}`,
                    background: 'transparent',
                    color: THEME.textMuted,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = THEME.surfaceMuted;
                    e.currentTarget.style.color = THEME.text;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = THEME.textMuted;
                  }}
                >
                  📖 Read Book
                </button>
                <button
                  onClick={() => {
                    // Add to queue functionality
                    const queue = JSON.parse(localStorage.getItem('audiobookQueue') || '[]');
                    const exists = queue.some((item: any) => item.id === audiobook.id);
                    if (!exists) {
                      queue.push({
                        id: audiobook.id,
                        title: audiobook.title,
                        author: audiobook.author,
                        image: audiobook.image,
                        duration: audiobook.duration,
                        addedAt: new Date().toISOString()
                      });
                      localStorage.setItem('audiobookQueue', JSON.stringify(queue));
                      alert('Added to queue!');
                    } else {
                      alert('Already in queue!');
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '10px 22px',
                    borderRadius: '6px',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: `1px solid ${THEME.border}`,
                    background: 'transparent',
                    color: THEME.textMuted,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = THEME.surfaceMuted;
                    e.currentTarget.style.color = THEME.text;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = THEME.textMuted;
                  }}
                >
                  + Queue
                </button>
                <button
                  onClick={handleDownloadClick}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '10px 22px',
                    borderRadius: '6px',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: `1px solid ${THEME.border}`,
                    background: 'transparent',
                    color: THEME.textMuted,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = THEME.surfaceMuted;
                    e.currentTarget.style.color = THEME.text;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = THEME.textMuted;
                  }}
                >
                  ⬇ Download
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="content-grid" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 40px', display: 'grid', gridTemplateColumns: '320px 1fr', gap: '28px' }}>
        {/* Left: Player Info */}
        <div>
          <div style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: '16px', padding: '18px', marginBottom: '22px', boxShadow: '0 8px 30px rgba(15,23,42,.04)' }}>
            {/* Waveform */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '2px', height: '32px', marginBottom: '12px', overflow: 'hidden' }}>
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: '3px',
                    height: `${Math.sin(i * 0.5) * 10 + 12}px`,
                    background: isPlaying ? THEME.accent : '#cbd5e1',
                    borderRadius: '2px',
                    transition: 'all 0.1s',
                  }}
                />
              ))}
            </div>

            {/* Progress */}
            <div style={{ marginBottom: '12px' }}>
              <div
                onClick={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  const ratio = rect.width ? (event.clientX - rect.left) / rect.width : 0;
                  handleAudioSeek((duration || 0) * Math.min(Math.max(ratio, 0), 1));
                }}
                style={{
                  height: '4px',
                  background: '#dbe4f0',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  position: 'relative',
                  marginBottom: '6px',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    background: THEME.accent,
                    borderRadius: '4px',
                    width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                    transition: 'width 0.1s linear',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: THEME.textSoft, fontFamily: 'monospace' }}>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '12px' }}>
              {[
                { label: '|<', action: handleRestartAudio, title: 'Start' },
                { label: '<<', action: () => handleAudioSkip(-10), title: 'Back 10 seconds' },
                { label: isPlaying ? 'Pause' : 'Play', action: handleTogglePlay, title: isPlaying ? 'Pause' : 'Play' },
                { label: '>>', action: () => handleAudioSkip(10), title: 'Forward 10 seconds' },
                { label: '>|', action: handleEndAudio, title: 'End' },
              ].map((btn, i) => (
                <button
                  key={btn.title}
                  onClick={btn.action}
                  title={btn.title}
                  type="button"
                  disabled={i === 4 && duration <= 0}
                  style={{
                    width: i === 2 ? '52px' : '32px',
                    height: i === 2 ? '44px' : '32px',
                    borderRadius: i === 2 ? '999px' : '50%',
                    border: i === 2 ? 'none' : `1px solid ${THEME.border}`,
                    background: i === 2 ? THEME.accent : THEME.surfaceAlt,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: i === 4 && duration <= 0 ? 'not-allowed' : 'pointer',
                    fontSize: i === 2 ? '12px' : '11px',
                    fontWeight: i === 2 ? 700 : 600,
                    color: i === 2 ? '#ffffff' : THEME.textMuted,
                    boxShadow: i === 2 ? `0 4px 16px ${THEME.accentGlow}` : 'none',
                    transition: 'all .2s',
                    opacity: i === 4 && duration <= 0 ? 0.5 : 1,
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '11px', color: THEME.textSoft, fontWeight: 600 }}>Speed</span>
              <select
                value={playbackRate}
                onChange={(event) => setPlaybackRate(event.target.value)}
                style={{
                  border: `1px solid ${THEME.border}`,
                  borderRadius: '999px',
                  background: THEME.surfaceAlt,
                  color: THEME.textMuted,
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '6px 10px',
                  outline: 'none',
                }}
              >
                <option value="0.5">0.5x</option>
                <option value="0.75">0.75x</option>
                <option value="1">1x</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>
            </div>

            {/* Controls */}
            <div style={{ display: 'none' }}>
              {(['⟪', '‹‹', null, '››', '⟫'] as (string | null)[]).map((btn, i) => (
                <button
                  key={i}
                  onClick={i === 2 ? handleTogglePlay : undefined}
                  style={{
                    width: i === 2 ? '44px' : '32px',
                    height: i === 2 ? '44px' : '32px',
                    borderRadius: '50%',
                    border: i === 2 ? 'none' : `1px solid ${THEME.border}`,
                    background: i === 2 ? THEME.accent : THEME.surfaceAlt,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: i === 2 ? '17px' : '12px',
                    color: i === 2 ? '#ffffff' : THEME.textMuted,
                    boxShadow: i === 2 ? `0 4px 16px ${THEME.accentGlow}` : 'none',
                    transition: 'all .2s',
                  }}
                >
                  {i === 2 ? (isPlaying ? '⏸' : '▶') : btn}
                </button>
              ))}
            </div>

            {/* Info Table */}
            <div style={{ marginBottom: '20px', paddingTop: '12px', borderTop: `1px solid ${THEME.border}` }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: THEME.textSoft, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '10px' }}>
                Information
              </div>
              {[
                { key: 'Author', val: audiobook.author },
                { key: 'Category', val: audiobook.category },
                { key: 'Duration', val: audiobook.duration || 'N/A' },
                { key: 'Language', val: audiobook.language },
                { key: 'Published', val: audiobook.publishDate ? new Date(audiobook.publishDate).toISOString().split('T')[0].split('-').reverse().join('/') : 'N/A' },
                { key: 'Rating', val: `${avgRating > 0 ? avgRating.toFixed(1) : '0'}/5 (${reviewCount})` },
              ].map((row, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '9px 0',
                    borderBottom: idx < 5 ? `1px solid ${THEME.border}` : 'none',
                  }}
                >
                  <span style={{ fontSize: '12px', color: THEME.textSoft }}>{row.key}</span>
                  <span style={{ fontSize: '12px', color: THEME.textMuted, fontWeight: 500, textAlign: 'right' }}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Content Tabs */}
        <div style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(15,23,42,.04)' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${THEME.border}`, padding: '0 24px', background: THEME.surfaceAlt, flexShrink: 0 }}>
            {['transcript', 'book', 'info'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '14px 18px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: activeTab === tab ? THEME.accent : THEME.textSoft,
                  cursor: 'pointer',
                  borderBottom: activeTab === tab ? `2px solid ${THEME.accent}` : '2px solid transparent',
                  transition: 'all .2s',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  background: 'transparent',
                  fontFamily: 'inherit',
                }}
              >
                {tab === 'transcript' && '📝 Transcript'}
                {tab === 'book' && '📖 Read Book'}
                {tab === 'info' && 'ℹ️ Details'}
              </button>
            ))}
          </div>

          {/* Panels */}
          <div style={{ flex: 1, padding: '22px 24px' }}>
            {activeTab === 'transcript' && (
              <div style={{ fontSize: '14px', color: THEME.textMuted, lineHeight: 1.8 }}>
                {(typeof audiobook.script === 'object' && audiobook.script?.english) || (typeof audiobook.script === 'object' && audiobook.script?.hindi) || (typeof audiobook.scripts === 'object' && audiobook.scripts?.english?.content) || (typeof audiobook.scripts === 'object' && audiobook.scripts?.hindi?.content) || audiobook.script || (typeof audiobook.scripts === 'string' && audiobook.scripts) ? (
                  <div>
                    {(() => {
                      const scriptContent = (typeof audiobook.script === 'object' && audiobook.script?.english) ||
                        (typeof audiobook.script === 'object' && audiobook.script?.hindi) ||
                        (typeof audiobook.scripts === 'string' ? audiobook.scripts : audiobook.scripts?.english?.content) ||
                        (typeof audiobook.scripts === 'string' ? audiobook.scripts : audiobook.scripts?.hindi?.content) ||
                        (typeof audiobook.script === 'string' ? audiobook.script : '') ||
                        '';


                      if (!scriptContent) return null;

                      const words = transcriptDisplayWords.length
                        ? transcriptDisplayWords
                        : scriptWords;

                      return (
                        <div style={{ width: '100%' }}>
                          <p style={{ fontSize: '12px', color: THEME.accent, marginBottom: '12px' }}>
                            📝 {words.length} words • {Math.ceil(words.length / 220)} pages
                            {isPlaying && <span style={{ marginLeft: '8px', color: THEME.textSoft }}>· click any word to jump there</span>}
                          </p>
                          <div
                            data-transcript-scroll
                            style={{
                              lineHeight: 1.8,
                              height: '400px',
                              overflowY: 'auto',
                              padding: '16px',
                              background: THEME.surfaceAlt,
                              border: `1px solid ${THEME.border}`,
                              borderRadius: '16px',
                              fontSize: '14px'
                            }}
                          >
                            {words.map((word: string, index: number) => {
                              const isHighlighted = currentWordIndex >= 0 && index === currentWordIndex;
                              return (
                                <span
                                  key={index}
                                  ref={isHighlighted ? highlightedWordRef : undefined}
                                  onClick={() => handleWordClick(index)}
                                  title="Click to play from here"
                                  style={{
                                    background: isHighlighted ? 'rgba(37, 99, 235, 0.18)' : 'transparent',
                                    color: isHighlighted ? THEME.text : THEME.textMuted,
                                    padding: '2px 4px',
                                    borderRadius: '3px',
                                    display: 'inline-block',
                                    margin: '0 2px',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    lineHeight: 1.6,
                                    verticalAlign: 'baseline',
                                    boxShadow: isHighlighted ? `0 0 0 1px rgba(37,99,235,0.22)` : '0 0 0 1px transparent',
                                    transition: 'background-color 0.16s ease, color 0.16s ease, box-shadow 0.16s ease',
                                  }}
                                  onMouseEnter={e => { if (!isHighlighted) (e.currentTarget as HTMLElement).style.background = 'rgba(37,99,235,0.06)'; }}
                                  onMouseLeave={e => { if (!isHighlighted) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                                >
                                  {word}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <p style={{ padding: '16px', background: THEME.surfaceAlt, borderRadius: '8px', color: THEME.textSoft }}>
                    📝 Transcript not available. The audiobook content is being processed.
                  </p>
                )}
              </div>
            )}
            {activeTab === 'book' && (
              <div style={{ fontSize: '14px', color: THEME.textMuted, lineHeight: 1.8 }}>
                {(() => {
                  // Check if we have script content to generate pages from
                  let scriptContent = '';

                  // Try different script sources
                  if (typeof audiobook.script === 'object') {
                    scriptContent = audiobook.script?.english || audiobook.script?.hindi || '';
                  } else if (typeof audiobook.script === 'string') {
                    scriptContent = audiobook.script;
                  }

                  // Try scripts field
                  if (!scriptContent) {
                    if (typeof audiobook.scripts === 'string') {
                      scriptContent = audiobook.scripts;
                    } else if (typeof audiobook.scripts === 'object') {
                      scriptContent = audiobook.scripts?.english?.content || audiobook.scripts?.hindi?.content || '';
                    }
                  }

                  // Final fallback - try description only if no script found
                  if (!scriptContent && audiobook.description) {
                    scriptContent = audiobook.description;
                  }

                  // Prioritize generated bookPages from database, then fallback to script content
                  const pageArray = Array.isArray(audiobook.bookPages) ? audiobook.bookPages :
                    Array.isArray(audiobook.pages) ? audiobook.pages : null;

                  // If we have script content, always show script content (prioritize over bookPages)
                  if (scriptContent) {
                    const totalPages = Math.ceil(scriptWords.length / 220);

                    return (
                      <div>
                        <p style={{ fontSize: '12px', color: THEME.accent, marginBottom: '12px' }}>
                          📖 {totalPages} pages • {scriptWords.length.toLocaleString()} words
                        </p>

                        {/* Book Flip Interface */}
                        <div style={{ position: 'relative', minHeight: '400px' }}>
                          {(() => {
                            const pageWords = scriptWords.slice(currentPage * 220, (currentPage + 1) * 220);
                            const pageContent = pageWords.join(' ');
                            const wordCount = pageWords.length;

                            return (
                              <div>
                                {/* Page Display */}
                                <div
                                  style={{
                                    padding: '24px',
                                    background: THEME.surfaceAlt,
                                    borderRadius: '12px',
                                    border: `1px solid ${THEME.border}`,
                                    minHeight: '300px',
                                    transition: 'all 0.3s ease',
                                    transform: isFlipping ? 'rotateY(90deg)' : 'rotateY(0deg)',
                                    transformStyle: 'preserve-3d',
                                    opacity: isFlipping ? 0.7 : 1
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <p style={{ fontSize: '11px', color: THEME.textSoft }}>Page {currentPage + 1} of {totalPages}</p>
                                    <p style={{ fontSize: '11px', color: THEME.textSoft }}>{wordCount} words</p>
                                  </div>
                                  <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: '15px' }}>
                                    {pageContent}
                                  </p>
                                </div>

                                {/* Navigation Controls */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', gap: '16px' }}>
                                  <button
                                    onClick={() => {
                                      if (currentPage > 0) {
                                        setIsFlipping(true);
                                        setTimeout(() => {
                                          setCurrentPage(currentPage - 1);
                                          setIsFlipping(false);
                                        }, 300);
                                      }
                                    }}
                                    disabled={currentPage === 0}
                                    style={{
                                      padding: '8px 16px',
                                      background: currentPage === 0 ? THEME.surfaceMuted : THEME.accent,
                                      color: currentPage === 0 ? THEME.textSoft : '#ffffff',
                                      border: 'none',
                                      borderRadius: '6px',
                                      cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                                      fontSize: '13px',
                                      fontWeight: 500,
                                      transition: 'all 0.2s ease'
                                    }}
                                  >
                                    ← Previous
                                  </button>

                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                      let pageNum;
                                      if (totalPages <= 5) {
                                        pageNum = i;
                                      } else if (currentPage < 2) {
                                        pageNum = i;
                                      } else if (currentPage > totalPages - 3) {
                                        pageNum = totalPages - 5 + i;
                                      } else {
                                        pageNum = currentPage - 2 + i;
                                      }

                                      return (
                                        <button
                                          key={pageNum}
                                          onClick={() => {
                                            setIsFlipping(true);
                                            setTimeout(() => {
                                              setCurrentPage(pageNum);
                                              setIsFlipping(false);
                                            }, 300);
                                          }}
                                          style={{
                                            width: '32px',
                                            height: '32px',
                                            background: pageNum === currentPage ? THEME.accent : THEME.surfaceMuted,
                                            color: pageNum === currentPage ? '#ffffff' : THEME.textSoft,
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            fontWeight: 500,
                                            transition: 'all 0.2s ease'
                                          }}
                                        >
                                          {pageNum + 1}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  <button
                                    onClick={() => {
                                      if (currentPage < totalPages - 1) {
                                        setIsFlipping(true);
                                        setTimeout(() => {
                                          setCurrentPage(currentPage + 1);
                                          setIsFlipping(false);
                                        }, 300);
                                      }
                                    }}
                                    disabled={currentPage >= totalPages - 1}
                                    style={{
                                      padding: '8px 16px',
                                      background: currentPage >= totalPages - 1 ? THEME.surfaceMuted : THEME.accent,
                                      color: currentPage >= totalPages - 1 ? THEME.textSoft : '#ffffff',
                                      border: 'none',
                                      borderRadius: '6px',
                                      cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer',
                                      fontSize: '13px',
                                      fontWeight: 500,
                                      transition: 'all 0.2s ease'
                                    }}
                                  >
                                    Next →
                                  </button>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  }

                  // If we have bookPages from database, show them
                  if (pageArray && pageArray.length > 0) {
                    return (
                      <div>
                        <p style={{ fontSize: '12px', color: THEME.accent, marginBottom: '12px' }}>
                          📖 {pageArray.length} pages • {pageArray.reduce((acc, p) => acc + (p.wordCount || 0), 0).toLocaleString()} words
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {pageArray.map((page) => (
                            <div key={page.pageNumber} style={{ padding: '16px', background: THEME.surfaceAlt, borderRadius: '8px', border: `1px solid ${THEME.border}` }}>
                              <p style={{ fontSize: '11px', color: THEME.textSoft, marginBottom: '8px' }}>Page {page.pageNumber}</p>
                              <p style={{ whiteSpace: 'pre-wrap' }}>{page.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  // If we have script content, show reading mode
                  if ((typeof audiobook.script === 'object' && audiobook.script?.english) || (typeof audiobook.script === 'object' && audiobook.script?.hindi) || (typeof audiobook.scripts === 'object' && audiobook.scripts?.english?.content) || (typeof audiobook.scripts === 'object' && audiobook.scripts?.hindi?.content) || audiobook.script || (typeof audiobook.scripts === 'string' && audiobook.scripts)) {
                    return (
                      <div>
                        <p style={{ fontSize: '12px', color: THEME.accent, marginBottom: '12px' }}>
                          📖 Reading Mode — Content from transcript
                        </p>

                        {/* Book Flip Interface */}
                        <div style={{ position: 'relative', minHeight: '400px' }}>
                          {(() => {
                            const scriptContent = (typeof audiobook.script === 'object' && audiobook.script?.english) ||
                              (typeof audiobook.script === 'object' && audiobook.script?.hindi) ||
                              (typeof audiobook.scripts === 'string' ? audiobook.scripts : audiobook.scripts?.english?.content) ||
                              (typeof audiobook.scripts === 'string' ? audiobook.scripts : audiobook.scripts?.hindi?.content) ||
                              (typeof audiobook.script === 'string' ? audiobook.script : '') ||
                              '';

                            const pageData = getCurrentPageContent();
                            if (!pageData) return null;

                            return (
                              <div>
                                {/* Page Display */}
                                <div
                                  style={{
                                    padding: '24px',
                                    background: THEME.surfaceAlt,
                                    borderRadius: '12px',
                                    border: `1px solid ${THEME.border}`,
                                    minHeight: '300px',
                                    transition: 'all 0.3s ease',
                                    transform: isFlipping ? 'rotateY(90deg)' : 'rotateY(0deg)',
                                    transformStyle: 'preserve-3d',
                                    opacity: isFlipping ? 0.7 : 1
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <p style={{ fontSize: '11px', color: THEME.textSoft }}>Page {pageData.pageNumber} of {pageData.totalPages}</p>
                                    <p style={{ fontSize: '11px', color: THEME.textSoft }}>{pageData.wordCount} words</p>
                                  </div>
                                  <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: '15px' }}>
                                    {pageData.content}
                                  </p>
                                </div>

                                {/* Navigation Controls */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', gap: '16px' }}>
                                  <button
                                    onClick={handlePrevPage}
                                    disabled={currentPage === 0}
                                    style={{
                                      padding: '8px 16px',
                                      background: currentPage === 0 ? THEME.surfaceMuted : THEME.accent,
                                      color: currentPage === 0 ? THEME.textSoft : '#ffffff',
                                      border: 'none',
                                      borderRadius: '6px',
                                      cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                                      fontSize: '13px',
                                      fontWeight: 500,
                                      transition: 'all 0.2s ease'
                                    }}
                                  >
                                    ← Previous
                                  </button>

                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    {Array.from({ length: Math.min(5, pageData.totalPages) }, (_, i) => {
                                      let pageNum;
                                      if (pageData.totalPages <= 5) {
                                        pageNum = i;
                                      } else if (currentPage < 2) {
                                        pageNum = i;
                                      } else if (currentPage > pageData.totalPages - 3) {
                                        pageNum = pageData.totalPages - 5 + i;
                                      } else {
                                        pageNum = currentPage - 2 + i;
                                      }

                                      return (
                                        <button
                                          key={pageNum}
                                          onClick={() => {
                                            setIsFlipping(true);
                                            setTimeout(() => {
                                              setCurrentPage(pageNum);
                                              setIsFlipping(false);
                                            }, 200);
                                          }}
                                          style={{
                                            width: '32px',
                                            height: '32px',
                                            background: pageNum === currentPage ? THEME.accent : THEME.surfaceMuted,
                                            color: pageNum === currentPage ? '#ffffff' : THEME.textSoft,
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            fontWeight: 500,
                                            transition: 'all 0.2s ease'
                                          }}
                                        >
                                          {pageNum + 1}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  <button
                                    onClick={handleNextPage}
                                    disabled={currentPage >= pageData.totalPages - 1}
                                    style={{
                                      padding: '8px 16px',
                                      background: currentPage >= pageData.totalPages - 1 ? THEME.surfaceMuted : THEME.accent,
                                      color: currentPage >= pageData.totalPages - 1 ? THEME.textSoft : '#ffffff',
                                      border: 'none',
                                      borderRadius: '6px',
                                      cursor: currentPage >= pageData.totalPages - 1 ? 'not-allowed' : 'pointer',
                                      fontSize: '13px',
                                      fontWeight: 500,
                                      transition: 'all 0.2s ease'
                                    }}
                                  >
                                    Next →
                                  </button>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  }

                  // Default fallback
                  return null;
                })()}
              </div>
            )}
            {activeTab === 'info' && (
              <div>
                <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '18px', color: THEME.text, marginBottom: '14px' }}>
                  About this Audiobook
                </h3>
                <div style={{ marginBottom: '22px' }}>
                  <p
                    style={{
                      fontSize: '14px',
                      color: THEME.textMuted,
                      lineHeight: 1.8,
                      marginBottom: audiobook.description.length > 220 ? '6px' : 0,
                      ...(!showFullDescription
                        ? {
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }
                        : {}),
                    }}
                  >
                    {audiobook.description}
                  </p>
                  {audiobook.description.length > 220 && (
                    <button
                      type="button"
                      onClick={() => setShowFullDescription((value) => !value)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: THEME.accent,
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 700,
                        padding: 0,
                      }}
                    >
                      {showFullDescription ? 'show less' : '...more'}
                    </button>
                  )}
                </div>
                <div style={{ background: THEME.surfaceAlt, border: `1px solid ${THEME.border}`, borderRadius: '16px', padding: '18px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: THEME.textSoft, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '12px' }}>
                    More Info
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{ fontSize: '13px', color: THEME.textMuted }}>
                      <strong style={{ color: THEME.accent }}>Narrator:</strong> {audiobook.narratorName || 'Not specified'}
                    </p>
                    <p style={{ fontSize: '13px', color: THEME.textMuted }}>
                      <strong style={{ color: THEME.accent }}>Category:</strong> {audiobook.category}
                    </p>
                    <p style={{ fontSize: '13px', color: THEME.textMuted }}>
                      <strong style={{ color: THEME.accent }}>Language:</strong> {audiobook.language}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
