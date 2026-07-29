'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  PauseIcon,
  PlayIcon,
  SpeakerWaveIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { BACKEND_URL } from '@/config/backend-url.config';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export interface PersistentAudioTrack {
  id: string;
  title: string;
  author?: string;
  image?: string | null;
  url: string;
  href?: string;
  previewDurationSeconds?: number;
}

interface PersistentAudioPlayerContextValue {
  currentTrack: PersistentAudioTrack | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  playbackRate: number;
  playTrack: (track: PersistentAudioTrack, startAt?: number) => Promise<void>;
  toggleTrack: (track: PersistentAudioTrack) => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  skip: (seconds: number) => void;
  setPlaybackRate: (rate: number) => void;
  close: () => void;
}

const PersistentAudioPlayerContext =
  createContext<PersistentAudioPlayerContextValue | undefined>(undefined);

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const normalizeAudioUrl = (url: string) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${BACKEND_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

export function PersistentAudioPlayerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTrack, setCurrentTrack] = useState<PersistentAudioTrack | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRateState] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const nextTime = audio.currentTime || 0;
      setCurrentTime(nextTime);

      if (
        currentTrack?.previewDurationSeconds &&
        nextTime >= currentTrack.previewDurationSeconds
      ) {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
        setCurrentTrack(null);
        setCurrentTime(0);
        setDuration(0);
        setIsPlaying(false);
      }
    };
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrack?.previewDurationSeconds]);

  const playTrack = async (track: PersistentAudioTrack, startAt?: number) => {
    const audio = audioRef.current;
    const trackUrl = normalizeAudioUrl(track.url);
    const normalizedTrack = { ...track, url: trackUrl };

    setCurrentTrack(normalizedTrack);

    if (!audio) return;

    if (!track.url) {
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(true);
      return;
    }

    if (currentTrack?.id !== track.id || audio.src !== trackUrl) {
      audio.src = trackUrl;
      audio.load();
      setCurrentTime(0);
      setDuration(0);
    }

    if (typeof startAt === 'number' && Number.isFinite(startAt)) {
      audio.currentTime = Math.max(0, startAt);
      setCurrentTime(audio.currentTime);
    }

    audio.playbackRate = playbackRate;
    await audio.play();
  };

  const pause = () => {
    audioRef.current?.pause();
  };

  const toggleTrack = async (track: PersistentAudioTrack) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentTrack?.id === track.id && !audio.paused) {
      pause();
      return;
    }

    await playTrack(track);
  };

  const seek = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const nextTime = Math.min(Math.max(0, time), audio.duration || Math.max(0, time));
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const skip = (seconds: number) => {
    seek((audioRef.current?.currentTime || 0) + seconds);
  };

  const setPlaybackRate = (rate: number) => {
    const nextRate = Number.isFinite(rate) && rate > 0 ? rate : 1;
    setPlaybackRateState(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const close = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }

    setCurrentTrack(null);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
  };

  const previewDuration =
    currentTrack?.previewDurationSeconds && currentTrack.previewDurationSeconds > 0
      ? currentTrack.previewDurationSeconds
      : 0;
  const displayDuration = previewDuration || duration;
  const displayCurrentTime = previewDuration
    ? Math.min(currentTime, previewDuration)
    : currentTime;
  const displayProgress = displayDuration
    ? Math.min(100, (displayCurrentTime / displayDuration) * 100)
    : 0;

  const handleProgressClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!displayDuration) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const nextTime = ((event.clientX - rect.left) / rect.width) * displayDuration;
    seek(nextTime);
  };

  const handleClose = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    close();
  };

  const value = useMemo(
    () => ({
      currentTrack,
      currentTime,
      duration,
      isPlaying,
      playbackRate,
      playTrack,
      toggleTrack,
      pause,
      seek,
      skip,
      setPlaybackRate,
      close,
    }),
    [currentTrack, currentTime, duration, isPlaying, playbackRate]
  );

  return (
    <PersistentAudioPlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="metadata" />
      {currentTrack && (
        <>
          <div
            className="fixed inset-x-3 bottom-4 lg:hidden sm:left-auto sm:right-6 sm:w-[390px]"
            style={{ zIndex: 2147483000 }}
          >
            <div className="min-h-[106px] overflow-hidden rounded-2xl border border-blue-100 bg-white/95 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.22)] backdrop-blur">
              <div
                className="h-1 bg-blue-600 transition-all"
                style={{ width: `${displayProgress}%` }}
              />
              <div className="flex items-center gap-3 p-4">
                <Link
                  href={currentTrack.href || '#'}
                  className="relative h-16 w-14 shrink-0 overflow-hidden rounded-xl border border-blue-100 bg-blue-50"
                >
                  {currentTrack.image ? (
                    <Image
                      src={currentTrack.image}
                      alt={currentTrack.title}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <SpeakerWaveIcon className="h-6 w-6 text-blue-600" />
                    </div>
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-600">
                    Playing
                  </div>
                  <Link
                    href={currentTrack.href || '#'}
                    className="block truncate text-sm font-bold text-slate-950 hover:text-blue-700"
                  >
                    {currentTrack.title}
                  </Link>
                  <div className="truncate text-xs text-slate-500">
                    {currentTrack.author || 'Audiobook'} | {formatTime(displayCurrentTime)} / {formatTime(displayDuration)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => skip(-10)}
                  className="hidden h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-blue-50 sm:flex"
                  aria-label="Back 10 seconds"
                >
                  -10
                </button>
                <button
                  type="button"
                  onClick={() => (isPlaying ? pause() : void playTrack(currentTrack))}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700"
                  aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
                >
                  {isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="ml-0.5 h-5 w-5" />}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
                  aria-label="Close audio player"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div
            className="fixed inset-x-0 bottom-0 hidden lg:block"
            style={{
              bottom: 0,
              display: 'block',
              left: 0,
              position: 'fixed',
              right: 0,
              width: '100%',
              zIndex: 2147483000,
            }}
          >
            <div
              className="relative h-[164px] overflow-hidden border-t border-slate-500/70 bg-[#25313b] px-5 text-white shadow-[0_-18px_42px_rgba(15,23,42,0.38)] lg:h-24"
              style={{
                background: '#25313b',
                boxShadow: '0 -18px 42px rgba(15,23,42,0.38)',
                color: '#fff',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                className="absolute inset-x-0 top-0 overflow-hidden bg-slate-800"
                style={{
                  height: 28,
                  left: 0,
                  overflow: 'hidden',
                  position: 'absolute',
                  right: 0,
                  top: 0,
                }}
              >
                {currentTrack.image ? (
                  <Image
                    src={currentTrack.image}
                    alt=""
                    fill
                    sizes="100vw"
                    className="object-cover opacity-70 blur-[1px] saturate-110"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-r from-slate-700 via-cyan-900 to-slate-700" />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/55 via-slate-900/20 to-slate-950/45" />
              </div>
              <div
                className="absolute inset-x-0 bottom-0 bg-[#25313b]/95 backdrop-blur-sm"
                style={{
                  background: 'rgba(37, 49, 59, 0.95)',
                  bottom: 0,
                  height: 'calc(100% - 28px)',
                  left: 0,
                  position: 'absolute',
                  right: 0,
                }}
              />

              <button
                type="button"
                onClick={handleClose}
                className="absolute right-3 top-9 z-20 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/90 bg-transparent text-white shadow-sm hover:bg-white/10 lg:right-5 lg:bottom-4 lg:top-auto lg:h-9 lg:w-9"
                aria-label="Close audio player"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>

              <div className="relative mx-auto h-full max-w-[1420px] px-3 pr-14 lg:px-0 lg:pr-14">
                <Link href={currentTrack.href || '#'} className="absolute left-3 right-14 top-10 flex min-w-0 items-center gap-2 lg:bottom-2 lg:left-0 lg:right-auto lg:top-auto lg:max-w-[360px] lg:gap-3">
                  <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-sm bg-white lg:h-12 lg:w-12">
                    {currentTrack.image ? (
                      <Image
                        src={currentTrack.image}
                        alt={currentTrack.title}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        <SpeakerWaveIcon className="h-6 w-6 text-slate-700" />
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-bold leading-4 text-white/70 lg:hidden">
                      {currentTrack.author || 'Audiobook'}
                    </span>
                    <span className="block overflow-hidden whitespace-nowrap text-sm font-extrabold leading-5 text-white lg:text-base">
                      <span className="audio-player-title-marquee inline-flex min-w-max gap-8">
                        <span>{currentTrack.title}</span>
                        <span aria-hidden="true">{currentTrack.title}</span>
                      </span>
                    </span>
                  </span>
                </Link>

                <div className="absolute bottom-3 left-3 right-14 flex flex-col items-center justify-center gap-1 lg:bottom-2 lg:left-1/2 lg:right-auto lg:w-[760px] lg:-translate-x-1/2">
                  <div className="flex w-full items-center justify-center gap-4 lg:gap-10">
                    <button
                      type="button"
                      onClick={() => skip(-10)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/90 bg-transparent text-[10px] font-bold text-white shadow-sm hover:bg-white/10 lg:h-9 lg:w-9 lg:text-[11px]"
                      aria-label="Back 10 seconds"
                    >
                      10
                    </button>
                    <button
                      type="button"
                      onClick={() => (isPlaying ? pause() : void playTrack(currentTrack))}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-[#73eef4] text-[#122431] shadow-lg shadow-black/25 hover:bg-[#9af6f9] lg:h-12 lg:w-12"
                      aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
                    >
                      {isPlaying ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="ml-0.5 h-6 w-6" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => skip(10)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/90 bg-transparent text-[10px] font-bold text-white shadow-sm hover:bg-white/10 lg:h-9 lg:w-9 lg:text-[11px]"
                      aria-label="Forward 10 seconds"
                    >
                      10
                    </button>
                    <SpeakerWaveIcon className="h-6 w-6 text-white drop-shadow lg:h-8 lg:w-8" />
                  </div>
                  <div className="flex w-full items-center gap-2 lg:gap-5">
                    <span className="w-10 text-right text-[11px] font-bold text-white lg:w-12 lg:text-[13px]">{formatTime(displayCurrentTime)}</span>
                    <button
                      type="button"
                      onClick={handleProgressClick}
                      className="block flex-1"
                      aria-label="Seek audio"
                    >
                      <span className="block h-1 overflow-hidden rounded-full bg-white/35">
                        <span
                          className="block h-full rounded-full bg-white transition-all"
                          style={{ width: `${displayProgress}%` }}
                        />
                      </span>
                    </button>
                    <span className="w-10 text-[11px] font-bold text-white lg:w-12 lg:text-[13px]">{formatTime(displayDuration)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </PersistentAudioPlayerContext.Provider>
  );
}

export function usePersistentAudioPlayer() {
  const context = useContext(PersistentAudioPlayerContext);
  if (!context) {
    throw new Error('usePersistentAudioPlayer must be used within PersistentAudioPlayerProvider');
  }

  return context;
}
