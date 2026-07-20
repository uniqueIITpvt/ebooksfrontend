'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeftIcon,
  BackwardIcon,
  ForwardIcon,
  PauseIcon,
  PlayIcon,
} from '@heroicons/react/24/solid';
import {
  ArrowDownTrayIcon,
  BookOpenIcon,
  SpeakerWaveIcon,
} from '@heroicons/react/24/outline';
import { BACKEND_URL } from '@/config/backend-url.config';
import { audiobooksApi } from '@/services/api/audiobooksApi';
import { usePersistentAudioPlayer } from '@/contexts/PersistentAudioPlayerContext';
import type {
  AudiobookReaderPage,
  AudiobookTranscriptLanguage,
  Book,
} from '@/services/api/booksApi';

type ListenTab = 'listen' | 'transcript' | 'read';
type EstimatedWordTiming = {
  startTime: number;
  endTime: number;
};

function formatTime(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '0:00';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatBytes(bytes?: number) {
  if (!bytes) return null;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function getGeneratedAudioUrl(audiobook: Book | null) {
  if (!audiobook) return '';

  const generatedAudio = (audiobook as any).generatedAudio;
  if (!generatedAudio) return '';
  if (typeof generatedAudio.url === 'string') return generatedAudio.url;

  const language = String(audiobook.language || generatedAudio.language || '').toLowerCase();
  const preferredKey = language.includes('hindi') || language === 'hi' ? 'hindi' : 'english';
  const preferredUrl = generatedAudio[preferredKey]?.url;
  if (typeof preferredUrl === 'string') return preferredUrl;

  const firstAudio = Object.values(generatedAudio).find(
    (entry: any) => entry && typeof entry.url === 'string'
  ) as { url?: string } | undefined;

  return firstAudio?.url || '';
}

function toAbsoluteBackendUrl(rawUrl?: string | null) {
  if (!rawUrl) return '';
  return rawUrl.startsWith('http') ? rawUrl : `${BACKEND_URL}${rawUrl}`;
}

function getScriptText(audiobook: Book | null) {
  if (!audiobook) return '';

  const scripts = (audiobook as any).scripts;
  const language = String(audiobook.language || '').toLowerCase();
  const preferredKey = language.includes('hindi') ? 'hindi' : 'english';
  const preferredScript = scripts?.[preferredKey];
  const fallbackScript = scripts?.english || scripts?.hindi || scripts;

  if (typeof scripts === 'string') return scripts;
  if (typeof preferredScript === 'string') return preferredScript;
  if (typeof preferredScript?.content === 'string') return preferredScript.content;
  if (typeof fallbackScript === 'string') return fallbackScript;
  if (typeof fallbackScript?.content === 'string') return fallbackScript.content;
  if (typeof fallbackScript?.text === 'string') return fallbackScript.text;
  if (typeof fallbackScript?.body === 'string') return fallbackScript.body;

  return '';
}

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
  return base + commaPause + sentencePause;
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
    if (time < timing.startTime) high = mid - 1;
    else if (time >= timing.endTime) low = mid + 1;
    else return mid;
  }

  return time >= timings[timings.length - 1].endTime ? timings.length - 1 : -1;
}

function normalizeTimedWords<T extends { startTime: number; endTime: number }>(
  words: T[],
  audioDuration: number
): T[] {
  if (!words.length || !Number.isFinite(audioDuration) || audioDuration <= 0) {
    return words;
  }

  const validWords = words.filter(
    (word) => Number.isFinite(word.startTime) && Number.isFinite(word.endTime)
  );
  if (!validWords.length) return words;

  const firstStart = Math.min(...validWords.map((word) => word.startTime));
  const lastEnd = Math.max(...validWords.map((word) => word.endTime));
  const transcriptDuration = lastEnd - firstStart;
  if (!Number.isFinite(transcriptDuration) || transcriptDuration <= 0) return words;

  const durationDifference = Math.abs(transcriptDuration - audioDuration);
  const alreadyAligned = firstStart < 0.25 && durationDifference / audioDuration < 0.03;
  if (alreadyAligned) return words;

  const scale = audioDuration / transcriptDuration;
  return words.map((word) => ({
    ...word,
    startTime: Math.max(0, (word.startTime - firstStart) * scale),
    endTime: Math.max(0, (word.endTime - firstStart) * scale),
  }));
}

export default function AudiobookListenClient({ slug }: { slug: string }) {
  const router = useRouter();
  const persistentAudio = usePersistentAudioPlayer();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audiobook, setAudiobook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ListenTab>('listen');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState('1');
  const [languageCode, setLanguageCode] = useState<string | null>(null);
  const [currentPageNumber, setCurrentPageNumber] = useState<number | null>(null);
  const [pageTurnTick, setPageTurnTick] = useState(0);

  useEffect(() => {
    let ignore = false;

    const loadListenPayload = async () => {
      try {
        const response = await audiobooksApi.getListenPayload(slug);
        if (!ignore && response.success) {
          setAudiobook(response.data);
        }
      } catch (error: any) {
        if (ignore) return;

        if (
          typeof error?.message === 'string' &&
          (error.message.includes('401') || error.message.toLowerCase().includes('login'))
        ) {
          router.replace(
            `/user/auth?returnUrl=${encodeURIComponent(
              window.location.pathname
            )}`
          );
          return;
        }

        router.replace(`/audiobooks/${slug}`);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadListenPayload();

    return () => {
      ignore = true;
    };
  }, [router, slug]);

  const transcriptLanguages = audiobook?.transcript?.languages || [];
  const transcriptLanguage: AudiobookTranscriptLanguage | null =
    transcriptLanguages.find((language) => language.code === languageCode) ||
    transcriptLanguages[0] ||
    null;
  const readerPages: AudiobookReaderPage[] = audiobook?.readerPages || [];
  const ebookFile = audiobook?.files?.ebook || null;
  const audioUrl = useMemo(() => {
    const rawUrl = audiobook?.files?.audiobook?.url || getGeneratedAudioUrl(audiobook);
    return toAbsoluteBackendUrl(rawUrl);
  }, [audiobook]);
  const persistentTrackId = `audiobook-${audiobook?.id || (audiobook as any)?._id || audiobook?.slug || slug}`;
  const isPersistentTrack = persistentAudio.currentTrack?.id === persistentTrackId;
  const isPdfEbook =
    ebookFile?.mimeType === 'application/pdf' ||
    ebookFile?.url?.toLowerCase().includes('.pdf') ||
    false;

  useEffect(() => {
    if (!transcriptLanguages.length) return;
    setLanguageCode((current) => current || transcriptLanguages[0].code);
  }, [transcriptLanguages]);

  useEffect(() => {
    if (readerPages.length && currentPageNumber === null) {
      setCurrentPageNumber(readerPages[0].pageNumber);
    }
  }, [currentPageNumber, readerPages]);

  const rawFlattenedWords = useMemo(() => {
    if (!transcriptLanguage) return [];

    return transcriptLanguage.segments.flatMap((segment, segmentIndex) =>
      (segment.words || []).map((word, wordIndex) => ({
        ...word,
        segmentId: segment.id,
        segmentIndex,
        wordIndex,
        pageNumber: segment.pageNumber,
      }))
    );
  }, [transcriptLanguage]);

  const flattenedWords = useMemo(
    () => normalizeTimedWords(rawFlattenedWords, duration),
    [duration, rawFlattenedWords]
  );

  const timingMethod = String((audiobook as any)?.wordSync?.method || '').toLowerCase();
  const audiobookLanguage = String(audiobook?.language || '').toLowerCase();
  const hasEnglishTimingLanguage =
    audiobookLanguage.includes('english') && !audiobookLanguage.includes('hindi');
  const useTranscriptWordTimings =
    flattenedWords.length > 0 &&
    (timingMethod.includes('whisperx-anchor') ||
      (timingMethod.includes('whisperx') && hasEnglishTimingLanguage));
  const flattenedWordLabels = useMemo(
    () => flattenedWords.map((word) => String(word.text || '')),
    [flattenedWords]
  );
  const transcriptEstimatedWordTimings = useMemo(
    () => buildEstimatedWordTimings(flattenedWordLabels, duration),
    [duration, flattenedWordLabels]
  );

  const activeWord = useMemo(() => {
    if (!flattenedWords.length) return null;

    if (useTranscriptWordTimings) {
      return (
        flattenedWords.find(
          (word) => currentTime >= word.startTime && currentTime < word.endTime
        ) || null
      );
    }

    const estimatedIndex = findEstimatedWordIndex(transcriptEstimatedWordTimings, currentTime);
    return estimatedIndex >= 0 ? flattenedWords[estimatedIndex] || null : null;
  }, [currentTime, flattenedWords, transcriptEstimatedWordTimings, useTranscriptWordTimings]);

  const fallbackWords = useMemo<string[]>(
    () => splitScriptWords(getScriptText(audiobook)),
    [audiobook]
  );
  const estimatedWordTimings = useMemo(
    () => buildEstimatedWordTimings(fallbackWords, duration),
    [duration, fallbackWords]
  );
  const activeFallbackWordIndex = useMemo(() => {
    if (flattenedWords.length) return -1;
    return findEstimatedWordIndex(estimatedWordTimings, currentTime);
  }, [currentTime, estimatedWordTimings, flattenedWords.length]);

  useEffect(() => {
    const nextPageNumber = activeWord?.pageNumber;
    if (!nextPageNumber || nextPageNumber === currentPageNumber) return;

    setCurrentPageNumber(nextPageNumber);
    setPageTurnTick((value) => value + 1);
  }, [activeWord?.pageNumber, currentPageNumber]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = parseFloat(playbackRate);
    if (isPersistentTrack) {
      persistentAudio.setPlaybackRate(parseFloat(playbackRate));
    }
  }, [playbackRate]);

  useEffect(() => {
    if (!isPersistentTrack) return;

    setIsPlaying(persistentAudio.isPlaying);
    setCurrentTime(persistentAudio.currentTime);
    if (persistentAudio.duration > 0) {
      setDuration(persistentAudio.duration);
    }
  }, [
    isPersistentTrack,
    persistentAudio.currentTime,
    persistentAudio.duration,
    persistentAudio.isPlaying,
  ]);

  const handleTogglePlay = async () => {
    if (!audioUrl || !audiobook) return;

    try {
      await persistentAudio.toggleTrack({
        id: persistentTrackId,
        title: audiobook.title,
        author: audiobook.author,
        image: audiobook.image,
        url: audioUrl,
        href: `/audiobooks/${audiobook.slug || slug}/listen`,
      });
    } catch {
      setIsPlaying(false);
    }
  };

  const handleDownloadAudio = async () => {
    if (!audioUrl || !audiobook) return;

    try {
      const response = await fetch(audioUrl);
      if (!response.ok) throw new Error(`Audio download failed: ${response.status}`);

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `${audiobook.title.replace(/[^a-z0-9]/gi, '_')}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(audioUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleSkip = (delta: number) => {
    const audio = audioRef.current;
    if (isPersistentTrack) {
      persistentAudio.skip(delta);
      return;
    }

    if (!audio) return;

    audio.currentTime = Math.min(
      Math.max(0, audio.currentTime + delta),
      duration || audio.currentTime + delta
    );
    setCurrentTime(audio.currentTime);
  };

  const hasFallbackScript = fallbackWords.length > 0;
  const hasTranscript = transcriptLanguages.length > 0 || hasFallbackScript;
  const hasWordTimings = flattenedWords.length > 0;
  const hasReadMode = readerPages.length > 0 || Boolean(ebookFile?.url);
  const tabs: Array<{ key: ListenTab; label: string }> = [
    { key: 'listen', label: 'Listen' },
    ...(hasTranscript ? [{ key: 'transcript' as const, label: 'Transcript' }] : []),
    ...(hasReadMode ? [{ key: 'read' as const, label: 'Read' }] : []),
  ];

  const activePage =
    readerPages.find((page) => page.pageNumber === currentPageNumber) ||
    readerPages[0] ||
    null;

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[#07060a] text-[#f0e8dc]'>
        <div className='h-12 w-12 animate-spin rounded-full border-2 border-[#c8a84b]/20 border-t-[#c8a84b]' />
      </div>
    );
  }

  if (!audiobook) return null;

  return (
    <div className='min-h-screen bg-[#07060a] pt-20 text-[#f0e8dc]'>
      <style jsx global>{`
        @keyframes audiobook-page-turn {
          0% { transform: perspective(1200px) rotateY(0deg) scale(1); opacity: 0.85; }
          45% { transform: perspective(1200px) rotateY(-16deg) scale(0.98); opacity: 1; }
          100% { transform: perspective(1200px) rotateY(0deg) scale(1); opacity: 1; }
        }
        .audiobook-page-turn {
          animation: audiobook-page-turn 720ms ease;
          transform-origin: left center;
        }
      `}</style>

      <audio ref={audioRef} preload='metadata' src={audioUrl || undefined} />

      <section className='border-b border-[#2d2436] bg-[#0f0c15]'>
        <div className='mx-auto flex max-w-[1500px] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8 lg:flex-row lg:items-center lg:justify-between'>
          <div className='flex items-center gap-4'>
            <Link
              href={`/audiobooks/${slug}`}
              className='inline-flex items-center gap-2 rounded-full border border-[#31293c] bg-[#17131f] px-4 py-2 text-sm text-[#f0e8dc] transition hover:border-[#c8a84b]'
            >
              <ArrowLeftIcon className='h-4 w-4' />
              Back to details
            </Link>
            <div>
              <div className='text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8f879d]'>
                Owned listening
              </div>
              <h1 className='font-serif text-3xl text-[#f0e8dc]'>{audiobook.title}</h1>
            </div>
          </div>
          <div className='flex flex-wrap gap-3'>
            {ebookFile?.url ? (
              <a
                href={ebookFile.url}
                target='_blank'
                rel='noreferrer'
                className='rounded-full border border-[#31293c] bg-[#17131f] px-4 py-2.5 text-sm font-semibold text-[#f0e8dc] transition hover:border-[#c8a84b]'
              >
                <BookOpenIcon className='mr-2 inline h-4 w-4' />
                Open ebook
              </a>
            ) : null}
            <button
              type='button'
              onClick={handleDownloadAudio}
              disabled={!audioUrl}
              className='rounded-full bg-[#c8a84b] px-4 py-2.5 text-sm font-semibold text-[#07060a] transition hover:bg-[#e0c06a] disabled:cursor-not-allowed disabled:opacity-60'
            >
              <ArrowDownTrayIcon className='mr-2 inline h-4 w-4' />
              Download audio
            </button>
          </div>
        </div>
      </section>

      <section className='mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8'>
        <div className='grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)]'>
          <aside className='space-y-6 lg:sticky lg:top-24 lg:self-start'>
            <div className='rounded-[28px] border border-[#2d2436] bg-[#120f19] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.35)]'>
              <div className='flex items-center gap-4'>
                <div className='relative h-20 w-16 overflow-hidden rounded-2xl border border-[#31293c] bg-[#17131f]'>
                  {audiobook.image ? (
                    <Image src={audiobook.image} alt={audiobook.title} fill sizes='64px' className='object-cover' />
                  ) : (
                    <div className='flex h-full items-center justify-center bg-gradient-to-br from-[#7b5a10] via-[#c8a84b] to-[#3f2c08] text-xs font-semibold text-white'>Audio</div>
                  )}
                </div>
                <div className='min-w-0'>
                  <h2 className='line-clamp-2 text-lg font-semibold text-[#f0e8dc]'>{audiobook.title}</h2>
                  <p className='text-sm text-[#8f879d]'>{audiobook.author}</p>
                  <p className='text-xs text-[#8f879d]'>{audiobook.duration || 'Audiobook'}</p>
                </div>
              </div>

              <div className='mt-6 h-2 rounded-full bg-[#2b2334]'>
                <div
                  className='h-full rounded-full bg-[#c8a84b]'
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>

              <div className='mt-2 flex items-center justify-between text-xs text-[#8f879d]'>
                <span>{formatTime(currentTime)}</span>
                <span>{duration > 0 ? formatTime(duration) : '--:--'}</span>
              </div>

              <div className='mt-6 flex items-center justify-center gap-3'>
                <button type='button' onClick={() => handleSkip(-10)} className='rounded-full border border-[#31293c] bg-[#17131f] p-3 text-[#f0e8dc] transition hover:border-[#c8a84b]'>
                  <BackwardIcon className='h-5 w-5' />
                </button>
                <button type='button' onClick={handleTogglePlay} className='rounded-full bg-[#c8a84b] p-5 text-[#07060a] transition hover:bg-[#e0c06a]'>
                  {isPlaying ? <PauseIcon className='h-6 w-6' /> : <PlayIcon className='h-6 w-6' />}
                </button>
                <button type='button' onClick={() => handleSkip(10)} className='rounded-full border border-[#31293c] bg-[#17131f] p-3 text-[#f0e8dc] transition hover:border-[#c8a84b]'>
                  <ForwardIcon className='h-5 w-5' />
                </button>
              </div>

              <div className='mt-5 grid gap-3'>
                <label className='text-xs font-semibold uppercase tracking-[0.22em] text-[#8f879d]'>
                  Speed
                  <select
                    value={playbackRate}
                    onChange={(event) => setPlaybackRate(event.target.value)}
                    className='mt-2 w-full rounded-2xl border border-[#31293c] bg-[#17131f] px-3 py-2 text-sm font-medium text-[#f0e8dc] outline-none'
                  >
                    <option value='0.5'>0.5x</option>
                    <option value='0.75'>0.75x</option>
                    <option value='1'>1x</option>
                    <option value='1.25'>1.25x</option>
                    <option value='1.5'>1.5x</option>
                    <option value='2'>2x</option>
                  </select>
                </label>

                {transcriptLanguages.length > 1 ? (
                  <label className='text-xs font-semibold uppercase tracking-[0.22em] text-[#8f879d]'>
                    Transcript language
                    <select
                      value={languageCode || transcriptLanguages[0].code}
                      onChange={(event) => setLanguageCode(event.target.value)}
                      className='mt-2 w-full rounded-2xl border border-[#31293c] bg-[#17131f] px-3 py-2 text-sm font-medium text-[#f0e8dc] outline-none'
                    >
                      {transcriptLanguages.map((language) => (
                        <option key={language.code} value={language.code}>
                          {language.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>
            </div>

            {hasTranscript ? (
              <div className='rounded-[28px] border border-[#2d2436] bg-[#120f19] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)]'>
                <div className='text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8f879d]'>Now saying</div>
                <div className='mt-4 rounded-[22px] border border-[#31293c] bg-[#17131f] p-4 text-sm leading-7 text-[#d8d1c7]'>
                  {hasWordTimings && activeWord
                    ? transcriptLanguage?.segments[activeWord.segmentIndex]?.text
                    : 'Play the audiobook to sync transcript and reader pages.'}
                </div>
              </div>
            ) : null}
          </aside>

          <div className='overflow-hidden rounded-[30px] border border-[#2d2436] bg-[#120f19] shadow-[0_28px_80px_rgba(0,0,0,0.32)]'>
            <div className='flex flex-wrap gap-1 border-b border-[#2d2436] bg-[#0f0c15] px-4 py-3 sm:px-6'>
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeTab === tab.key ? 'bg-[#c8a84b]/12 text-[#e0c06a]' : 'text-[#8f879d] hover:text-[#f0e8dc]'
                  }`}
                  type='button'
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className='p-5 sm:p-6 lg:p-8'>
              {activeTab === 'listen' ? (
                <div className='space-y-6'>
                  <div className='rounded-[24px] border border-[#2d2436] bg-[#17131f] p-5'>
                    <div className='flex items-center gap-2 text-sm font-semibold text-[#f0e8dc]'>
                      <SpeakerWaveIcon className='h-5 w-5 text-[#c8a84b]' />
                      Premium listening mode
                    </div>
                    <p className='mt-3 text-sm leading-7 text-[#bdb5a8]'>
                      {hasWordTimings
                        ? 'Transcript words and reader pages are syncing live with playback.'
                        : 'Audio playback is ready. Script words highlight with playback progress.'}
                    </p>
                  </div>

                  {hasTranscript ? (
                    <div className='space-y-4'>
                      {transcriptLanguage?.segments.length ? (
                        transcriptLanguage.segments.slice(0, 8).map((segment, segmentIndex) => (
                          <div key={segment.id} className='rounded-[22px] border border-[#2d2436] bg-[#17131f] p-4 text-sm leading-7 text-[#d8d1c7]'>
                            {segment.words?.length
                              ? segment.words.map((word: { text: string }, wordIndex: number) => {
                                  const isActive =
                                    activeWord?.segmentIndex === segmentIndex &&
                                    activeWord.wordIndex === wordIndex;
                                  return (
                                    <span
                                      key={`${segment.id}-${wordIndex}`}
                                      className={`mr-1 inline-block rounded px-1.5 py-0.5 align-baseline font-medium leading-7 transition-colors duration-150 ${
                                        isActive ? 'bg-[#c8a84b] text-[#07060a]' : 'text-[#d8d1c7]'
                                      }`}
                                      style={{
                                        boxShadow: isActive ? '0 0 0 1px rgba(200,168,75,0.28)' : '0 0 0 1px transparent',
                                        transitionProperty: 'background-color, color, box-shadow',
                                      }}
                                    >
                                      {word.text}
                                    </span>
                                  );
                                })
                              : segment.text}
                          </div>
                        ))
                      ) : (
                        <div className='rounded-[22px] border border-[#2d2436] bg-[#17131f] p-4 text-sm leading-7 text-[#d8d1c7]'>
                          {fallbackWords.slice(0, 260).map((word: string, wordIndex: number) => {
                            const isActive = activeFallbackWordIndex === wordIndex;
                            return (
                              <span
                                key={`${word}-${wordIndex}`}
                                className={`mr-1 inline-block rounded px-1.5 py-0.5 align-baseline font-medium leading-7 transition-colors duration-150 ${
                                  isActive ? 'bg-[#c8a84b] text-[#07060a]' : 'text-[#d8d1c7]'
                                }`}
                              >
                                {word}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className='rounded-[24px] border border-dashed border-[#31293c] bg-[#17131f] p-8 text-center text-sm text-[#8f879d]'>
                      Transcript unavailable for this audiobook.
                    </div>
                  )}
                </div>
              ) : null}

              {activeTab === 'transcript' && hasTranscript ? (
                <div className='space-y-4'>
                  {transcriptLanguage?.segments.length ? (
                    transcriptLanguage.segments.map((segment, segmentIndex) => (
                      <div key={segment.id} className='rounded-[24px] border border-[#2d2436] bg-[#17131f] p-5'>
                        <div className='mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#8f879d]'>
                          {formatTime(segment.startTime || segment.start || 0)} to {formatTime(segment.endTime || segment.end || 0)}
                        </div>
                        <div className='text-base leading-8 text-[#d8d1c7]'>
                          {segment.words?.length
                            ? segment.words.map((word: { text: string }, wordIndex: number) => {
                                const isActive =
                                  activeWord?.segmentIndex === segmentIndex &&
                                  activeWord.wordIndex === wordIndex;
                                return (
                                  <span
                                    key={`${segment.id}-${wordIndex}`}
                                    className={`mr-1 inline-block rounded px-1.5 py-0.5 align-baseline font-medium leading-8 transition-colors duration-150 ${
                                      isActive ? 'bg-[#c8a84b] text-[#07060a]' : ''
                                    }`}
                                    style={{
                                      boxShadow: isActive ? '0 0 0 1px rgba(200,168,75,0.28)' : '0 0 0 1px transparent',
                                      transitionProperty: 'background-color, color, box-shadow',
                                    }}
                                  >
                                    {word.text}
                                  </span>
                                );
                              })
                            : segment.text}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className='rounded-[24px] border border-[#2d2436] bg-[#17131f] p-5 text-base leading-8 text-[#d8d1c7]'>
                      {fallbackWords.map((word: string, wordIndex: number) => {
                        const isActive = activeFallbackWordIndex === wordIndex;
                        return (
                          <span
                            key={`${word}-${wordIndex}`}
                            className={`mr-1 inline-block rounded px-1.5 py-0.5 align-baseline font-medium leading-8 transition-colors duration-150 ${
                              isActive ? 'bg-[#c8a84b] text-[#07060a]' : ''
                            }`}
                          >
                            {word}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : null}

              {activeTab === 'read' && hasReadMode ? (
                <div className='space-y-6'>
                  {readerPages.length ? (
                    <>
                      <div className='flex items-center justify-between gap-4'>
                        <button
                          type='button'
                          onClick={() => {
                            if (!activePage) return;
                            const previous = readerPages.find((page) => page.pageNumber === activePage.pageNumber - 1);
                            if (!previous) return;
                            setCurrentPageNumber(previous.pageNumber);
                            setPageTurnTick((value) => value + 1);
                          }}
                          className='rounded-full border border-[#31293c] bg-[#17131f] px-4 py-2 text-sm font-semibold text-[#f0e8dc] transition hover:border-[#c8a84b]'
                        >
                          Previous
                        </button>
                        <div className='text-sm text-[#8f879d]'>
                          Page {activePage?.pageNumber || 1} / {readerPages.length}
                        </div>
                        <button
                          type='button'
                          onClick={() => {
                            if (!activePage) return;
                            const next = readerPages.find((page) => page.pageNumber === activePage.pageNumber + 1);
                            if (!next) return;
                            setCurrentPageNumber(next.pageNumber);
                            setPageTurnTick((value) => value + 1);
                          }}
                          className='rounded-full border border-[#31293c] bg-[#17131f] px-4 py-2 text-sm font-semibold text-[#f0e8dc] transition hover:border-[#c8a84b]'
                        >
                          Next
                        </button>
                      </div>

                      <div
                        key={pageTurnTick}
                        className='audiobook-page-turn rounded-[30px] border border-[#d3b76a]/25 bg-[linear-gradient(135deg,#f6f0df_0%,#f8f4e8_55%,#efe5c6_100%)] p-8 text-[#4b3410] shadow-[0_30px_90px_rgba(0,0,0,0.35)]'
                      >
                        <div className='mb-6 border-b border-[#d2bd82] pb-4 text-center'>
                          <div className='text-[11px] font-semibold uppercase tracking-[0.4em] text-[#aa8740]'>
                            {audiobook.title}
                          </div>
                          <div className='mt-2 text-sm font-semibold'>
                            Page {activePage?.pageNumber}
                          </div>
                        </div>
                        {activePage?.title ? (
                          <h2 className='mb-4 font-serif text-3xl'>{activePage.title}</h2>
                        ) : null}
                        <div className='whitespace-pre-line text-lg leading-9'>
                          {activePage?.content}
                        </div>
                      </div>
                    </>
                  ) : ebookFile ? (
                    isPdfEbook ? (
                      <div className='overflow-hidden rounded-[28px] border border-[#2d2436] bg-[#0f0c15]'>
                        <iframe
                          src={ebookFile.url}
                          className='h-[760px] w-full bg-white'
                          title={`${audiobook.title} reader`}
                        />
                      </div>
                    ) : (
                      <div className='rounded-[28px] border border-[#2d2436] bg-[#17131f] p-6'>
                        <div className='text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8f879d]'>
                          File details
                        </div>
                        <div className='mt-4 space-y-3 text-sm text-[#bdb5a8]'>
                          <p>Name: {ebookFile.originalName || 'Attached ebook file'}</p>
                          <p>Type: {ebookFile.mimeType || 'Unknown file type'}</p>
                          {formatBytes(ebookFile.fileSize) ? <p>Size: {formatBytes(ebookFile.fileSize)}</p> : null}
                          <p>
                            This file type opens outside the inline reader.
                          </p>
                          <a
                            href={ebookFile.url}
                            target='_blank'
                            rel='noreferrer'
                            className='inline-flex items-center rounded-full bg-[#c8a84b] px-4 py-2.5 font-semibold text-[#07060a]'
                          >
                            Open file
                          </a>
                        </div>
                      </div>
                    )
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
