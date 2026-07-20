'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  BookOpenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  PauseIcon,
  PlayIcon,
  StarIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { parsePriceValue } from '@/lib/audiobooks';
import type { AudiobookAccessState } from '@/services/api/booksApi';
import type { Audiobook } from '@/services/api/audiobooksApi';
import { usePersistentAudioPlayer } from '@/contexts/PersistentAudioPlayerContext';

type AudiobookTab = 'about' | 'read' | 'details';

interface AudiobookDetailViewProps {
  audiobook: Audiobook;
  accessState: AudiobookAccessState | null;
  accessLoading?: boolean;
}

function formatTime(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '0:00';

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatBytes(bytes?: number) {
  if (!bytes) return null;

  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${bytes} B`;
}

export default function AudiobookDetailView({
  audiobook,
  accessState,
  accessLoading = false,
}: AudiobookDetailViewProps) {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement>(null);
  const persistentAudio = usePersistentAudioPlayer();
  const [activeTab, setActiveTab] = useState<AudiobookTab>('about');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState('1');

  const audioUrl = useMemo(
    () => audiobook.files?.audiobook?.url || '',
    [audiobook.files?.audiobook?.url]
  );
  const persistentTrackId = `audiobook-${audiobook.id || audiobook.slug}`;
  const isPersistentTrack = persistentAudio.currentTrack?.id === persistentTrackId;
  const ebookFile = audiobook.files?.ebook || null;
  const isPdfEbook =
    ebookFile?.mimeType === 'application/pdf' ||
    ebookFile?.url?.toLowerCase().includes('.pdf') ||
    false;
  const isFree = parsePriceValue(audiobook.price) === 0;
  const listenHref = `/audiobooks/${audiobook.slug || audiobook.id}/listen`;
  const checkoutHref = accessState?.redirectTarget || `/checkout?kind=audiobook&id=${audiobook.id}&slug=${audiobook.slug || audiobook.id}&mode=${isFree ? 'claim' : 'buy'}`;
  const primaryActionLabel = accessLoading
    ? 'Checking access...'
    : accessState?.owned
      ? 'Listen now'
      : isFree
        ? 'Claim free'
        : `Buy now ${audiobook.price}`;
  const formattedDate = audiobook.publishDate
    ? new Date(audiobook.publishDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Unpublished';

  const handlePrimaryAction = () => {
    router.push(accessState?.owned ? listenHref : checkoutHref);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => setIsPlaying(false);
    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = parseFloat(playbackRate);
    if (isPersistentTrack) {
      persistentAudio.setPlaybackRate(parseFloat(playbackRate) || 1);
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
    if (!audioUrl) return;

    try {
      await persistentAudio.toggleTrack({
        id: persistentTrackId,
        title: audiobook.title,
        author: audiobook.author,
        image: audiobook.image,
        url: audioUrl,
        href: `/audiobooks/${audiobook.slug || audiobook.id}`,
      });
    } catch {
      setIsPlaying(false);
    }
  };

  const handleSkip = (delta: number) => {
    if (isPersistentTrack) {
      persistentAudio.skip(delta);
      return;
    }

    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    audio.currentTime = Math.min(
      Math.max(0, audio.currentTime + delta),
      duration || audio.currentTime + delta
    );
    setCurrentTime(audio.currentTime);
  };

  const handleSeek = (event: MouseEvent<HTMLDivElement>) => {
    if (!audioUrl || duration <= 0) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const progress = (event.clientX - bounds.left) / bounds.width;
    const nextTime = Math.max(0, Math.min(duration, progress * duration));

    if (isPersistentTrack) {
      persistentAudio.seek(nextTime);
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const handleReadBookAction = () => {
    if (!ebookFile) return;
    setActiveTab('read');
    document
      .getElementById('audiobook-detail-body')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const detailRows = [
    { label: 'Author', value: audiobook.author || 'Unknown' },
    { label: 'Narrator', value: audiobook.narrator || 'Not specified' },
    { label: 'Category', value: audiobook.category || 'Uncategorized' },
    { label: 'Language', value: audiobook.language || 'Not specified' },
    { label: 'Published', value: formattedDate },
    {
      label: 'Rating',
      value: `${audiobook.rating.toFixed(1)} / 5 (${audiobook.reviews} review${
        audiobook.reviews === 1 ? '' : 's'
      })`,
    },
    { label: 'Duration', value: audiobook.duration || 'Unknown' },
    { label: 'Formats', value: audiobook.format?.join(', ') || 'Audiobook' },
  ];

  const tabs: Array<{ key: AudiobookTab; label: string }> = [
    { key: 'about', label: 'About' },
    ...(ebookFile ? [{ key: 'read' as const, label: 'Read Book' }] : []),
    { key: 'details', label: 'Details' },
  ];

  return (
    <div className='min-h-screen bg-[#07060a] pt-20 text-[#f0e8dc]'>
      <audio ref={audioRef} preload='metadata' src={audioUrl || undefined} />

      <section className='relative overflow-hidden border-b border-[#261f31] bg-[#0e0c12]'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(200,168,75,0.22),transparent_34%),radial-gradient(circle_at_right,rgba(139,92,246,0.18),transparent_30%),linear-gradient(180deg,#161420_0%,#07060a_100%)]' />

        <div className='relative mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <button
              onClick={() => router.back()}
              className='inline-flex items-center gap-2 rounded-full border border-[#31293c] bg-[#120f19]/80 px-4 py-2 text-sm text-[#f0e8dc] transition hover:border-[#c8a84b] hover:bg-[#17131f]'
              type='button'
            >
              <ArrowLeftIcon className='h-4 w-4' />
              Back
            </button>

            <Link
              href='/books?type=Audiobook'
              className='rounded-full border border-[#31293c] bg-[#120f19]/80 px-4 py-2 text-sm text-[#f0e8dc] transition hover:border-[#c8a84b] hover:bg-[#17131f]'
            >
              View all audiobooks
            </Link>
          </div>

          <div className='mt-8 flex flex-col gap-8 lg:flex-row lg:items-start'>
            <div className='mx-auto w-full max-w-[220px] flex-shrink-0 lg:mx-0 lg:max-w-[220px]'>
              <div className='relative aspect-[3/4] overflow-hidden rounded-[24px] border border-[#2d2436] bg-[#17131f] shadow-[0_25px_80px_rgba(0,0,0,0.45)]'>
                {audiobook.image ? (
                  <Image
                    src={audiobook.image}
                    alt={audiobook.title}
                    fill
                    sizes='220px'
                    className='object-cover'
                    priority
                  />
                ) : (
                  <div className='flex h-full w-full items-center justify-center bg-gradient-to-br from-[#7b5a10] via-[#c8a84b] to-[#3f2c08] text-center text-sm font-semibold text-white'>
                    {audiobook.title}
                  </div>
                )}
              </div>
            </div>

            <div className='min-w-0 flex-1'>
              <div className='flex flex-wrap gap-2'>
                <span className='rounded-full border border-[#4a3d22] bg-[#c8a84b]/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#e0c06a]'>
                  Audiobook
                </span>
                <span className='rounded-full border border-[#31293c] bg-[#17131f] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f0e8dc]'>
                  {isFree ? 'Free access' : audiobook.price}
                </span>
                {audiobook.language ? (
                  <span className='rounded-full border border-[#31293c] bg-[#17131f] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#bdb5a8]'>
                    {audiobook.language}
                  </span>
                ) : null}
                {audiobook.featured ? (
                  <span className='rounded-full border border-[#1d4f2e] bg-[#14311d] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8cf0a7]'>
                    Featured
                  </span>
                ) : null}
                {!audiobook.featured && audiobook.bestseller ? (
                  <span className='rounded-full border border-[#5d3027] bg-[#311814] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#ffad93]'>
                    Bestseller
                  </span>
                ) : null}
              </div>

              <h1 className='mt-5 max-w-4xl font-serif text-4xl leading-tight text-[#f0e8dc] sm:text-5xl'>
                {audiobook.title}
              </h1>

              <div className='mt-4 flex flex-wrap items-center gap-4 text-sm text-[#bdb5a8]'>
                <span>By {audiobook.author}</span>
                {audiobook.narrator ? <span>Narrated by {audiobook.narrator}</span> : null}
                <span>{formattedDate}</span>
                {audiobook.duration ? <span>{audiobook.duration}</span> : null}
              </div>

              <div className='mt-5 flex flex-wrap items-center gap-3 text-sm text-[#bdb5a8]'>
                <div className='flex items-center gap-1'>
                  {Array.from({ length: 5 }, (_, index) => (
                    <StarIcon
                      key={index}
                      className={`h-4 w-4 ${
                        index < Math.round(audiobook.rating)
                          ? 'text-[#c8a84b]'
                          : 'text-[#4f465c]'
                      }`}
                    />
                  ))}
                </div>
                <span className='font-semibold text-[#f0e8dc]'>
                  {audiobook.rating.toFixed(1)}
                </span>
                <span>
                  {audiobook.reviews} review{audiobook.reviews === 1 ? '' : 's'}
                </span>
              </div>

              <div className='mt-6 max-w-3xl text-base leading-8 text-[#bdb5a8]'>
                <div className={showFullDescription ? '' : 'line-clamp-3'}>
                  {audiobook.description}
                </div>
                {audiobook.description.length > 220 ? (
                  <button
                    onClick={() => setShowFullDescription((value) => !value)}
                    className='mt-3 text-sm font-semibold text-[#e0c06a] transition hover:text-[#f0e8dc]'
                    type='button'
                  >
                    {showFullDescription ? 'Show less' : 'Read more'}
                  </button>
                ) : null}
              </div>

              <div className='mt-8 flex flex-wrap gap-3'>
                <button
                  onClick={handlePrimaryAction}
                  disabled={accessLoading}
                  className='inline-flex items-center gap-2 rounded-full bg-[#c8a84b] px-5 py-3 text-sm font-semibold text-[#07060a] transition hover:bg-[#e0c06a] disabled:cursor-not-allowed disabled:bg-[#5c5131] disabled:text-[#d7cfbc]'
                  type='button'
                >
                  {accessState?.owned ? (
                    <PlayIcon className='h-5 w-5' />
                  ) : (
                    <BookOpenIcon className='h-5 w-5' />
                  )}
                  {primaryActionLabel}
                </button>

                {accessState?.owned ? (
                  <Link
                    href={listenHref}
                    className='inline-flex items-center gap-2 rounded-full border border-[#31293c] bg-[#17131f] px-5 py-3 text-sm font-semibold text-[#f0e8dc] transition hover:border-[#c8a84b] hover:text-white'
                  >
                    <ArrowDownTrayIcon className='h-5 w-5' />
                    Open listening page
                  </Link>
                ) : (
                  <button
                    onClick={() => router.push(checkoutHref)}
                    className='inline-flex items-center gap-2 rounded-full border border-[#31293c] bg-[#17131f] px-5 py-3 text-sm font-semibold text-[#f0e8dc] transition hover:border-[#c8a84b] hover:text-white'
                    type='button'
                  >
                    <BookOpenIcon className='h-5 w-5' />
                    {isFree ? 'Go to free claim checkout' : 'Go to secure checkout'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id='audiobook-detail-body'
        className='mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8'
      >
        <div className='grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]'>
          <aside className='space-y-6 lg:sticky lg:top-24 lg:self-start'>
            <div className='rounded-[28px] border border-[#2d2436] bg-[#120f19] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.35)]'>
              <div className='flex items-center gap-4'>
                <div className='relative h-16 w-14 flex-shrink-0 overflow-hidden rounded-2xl border border-[#31293c] bg-[#17131f]'>
                  {audiobook.image ? (
                    <Image
                      src={audiobook.image}
                      alt={audiobook.title}
                      fill
                      sizes='56px'
                      className='object-cover'
                    />
                  ) : (
                    <div className='flex h-full w-full items-center justify-center bg-gradient-to-br from-[#7b5a10] via-[#c8a84b] to-[#3f2c08] text-[11px] font-semibold text-white'>
                      Audio
                    </div>
                  )}
                </div>
                <div className='min-w-0'>
                  <div className='text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8f879d]'>
                    Player
                  </div>
                  <h2 className='line-clamp-1 text-sm font-semibold text-[#f0e8dc]'>
                    {audiobook.title}
                  </h2>
                  <p className='line-clamp-1 text-xs text-[#8f879d]'>
                    {audiobook.author}
                  </p>
                </div>
              </div>

              <div className='mt-5 rounded-full bg-[#1b1723] px-3 py-2 text-center text-xs text-[#8f879d]'>
                {audioUrl
                  ? 'Live audio controls ready'
                  : accessState?.owned
                    ? 'Audio file unavailable'
                    : 'Unlock this audiobook to start listening'}
              </div>

              <div
                className='mt-5 h-2 cursor-pointer rounded-full bg-[#2b2334]'
                onClick={handleSeek}
                role='presentation'
              >
                <div
                  className='h-full rounded-full bg-[#c8a84b]'
                  style={{
                    width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                  }}
                />
              </div>

              <div className='mt-2 flex items-center justify-between text-xs text-[#8f879d]'>
                <span>{formatTime(currentTime)}</span>
                <span>{duration > 0 ? formatTime(duration) : '--:--'}</span>
              </div>

              <div className='mt-5 flex items-center justify-center gap-3'>
                <button
                  onClick={() => handleSkip(-10)}
                  disabled={!audioUrl}
                  className='flex h-10 w-10 items-center justify-center rounded-full border border-[#31293c] bg-[#17131f] text-sm font-semibold text-[#f0e8dc] transition hover:border-[#c8a84b] disabled:cursor-not-allowed disabled:text-[#6f677b]'
                  type='button'
                >
                  <ChevronLeftIcon className='h-5 w-5' />
                </button>

                <button
                  onClick={handleTogglePlay}
                  disabled={!audioUrl}
                  className='flex h-14 w-14 items-center justify-center rounded-full bg-[#c8a84b] text-[#07060a] transition hover:bg-[#e0c06a] disabled:cursor-not-allowed disabled:bg-[#5c5131] disabled:text-[#d7cfbc]'
                  type='button'
                >
                  {isPlaying ? (
                    <PauseIcon className='h-6 w-6' />
                  ) : (
                    <PlayIcon className='h-6 w-6' />
                  )}
                </button>

                <button
                  onClick={() => handleSkip(10)}
                  disabled={!audioUrl}
                  className='flex h-10 w-10 items-center justify-center rounded-full border border-[#31293c] bg-[#17131f] text-sm font-semibold text-[#f0e8dc] transition hover:border-[#c8a84b] disabled:cursor-not-allowed disabled:text-[#6f677b]'
                  type='button'
                >
                  <ChevronRightIcon className='h-5 w-5' />
                </button>
              </div>

              <div className='mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2'>
                <label className='text-xs font-semibold uppercase tracking-[0.22em] text-[#8f879d]'>
                  Speed
                  <select
                    value={playbackRate}
                    onChange={(event) => setPlaybackRate(event.target.value)}
                    className='mt-2 w-full rounded-2xl border border-[#31293c] bg-[#17131f] px-3 py-2 text-sm font-medium text-[#f0e8dc] outline-none'
                  >
                    <option value='0.75'>0.75x</option>
                    <option value='1'>1x</option>
                    <option value='1.25'>1.25x</option>
                    <option value='1.5'>1.5x</option>
                    <option value='2'>2x</option>
                  </select>
                </label>

                <div className='rounded-[22px] border border-[#31293c] bg-[#17131f] px-4 py-3'>
                  <div className='text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8f879d]'>
                    Format
                  </div>
                  <div className='mt-2 text-sm font-semibold text-[#f0e8dc]'>
                    {audiobook.format?.join(', ') || 'Audiobook'}
                  </div>
                </div>
              </div>
            </div>

            <div className='rounded-[28px] border border-[#2d2436] bg-[#120f19] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)]'>
              <div className='text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8f879d]'>
                Information
              </div>
              <div className='mt-4 space-y-4'>
                {detailRows.slice(0, 5).map((row) => (
                  <div
                    key={row.label}
                    className='flex items-start justify-between gap-4 border-b border-[#221b2b] pb-3 last:border-b-0 last:pb-0'
                  >
                    <span className='text-sm text-[#8f879d]'>{row.label}</span>
                    <span className='max-w-[60%] text-right text-sm font-medium text-[#f0e8dc]'>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <div className='overflow-hidden rounded-[30px] border border-[#2d2436] bg-[#120f19] shadow-[0_28px_80px_rgba(0,0,0,0.32)]'>
            <div className='flex flex-wrap gap-1 border-b border-[#2d2436] bg-[#0f0c15] px-4 py-3 sm:px-6'>
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeTab === tab.key
                      ? 'bg-[#c8a84b]/12 text-[#e0c06a]'
                      : 'text-[#8f879d] hover:text-[#f0e8dc]'
                  }`}
                  type='button'
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className='p-5 sm:p-6 lg:p-8'>
              {activeTab === 'about' ? (
                <div className='space-y-8'>
                  <div>
                    <h2 className='font-serif text-3xl text-[#f0e8dc]'>About this audiobook</h2>
                    <p className='mt-4 whitespace-pre-line text-base leading-8 text-[#bdb5a8]'>
                      {audiobook.description}
                    </p>
                  </div>

                  <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
                    <div className='rounded-[24px] border border-[#2d2436] bg-[#17131f] p-5'>
                      <ClockIcon className='h-5 w-5 text-[#c8a84b]' />
                      <div className='mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8f879d]'>
                        Duration
                      </div>
                      <div className='mt-1 text-lg font-semibold text-[#f0e8dc]'>
                        {audiobook.duration || 'Unknown'}
                      </div>
                    </div>
                    <div className='rounded-[24px] border border-[#2d2436] bg-[#17131f] p-5'>
                      <BookOpenIcon className='h-5 w-5 text-[#c8a84b]' />
                      <div className='mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8f879d]'>
                        Access
                      </div>
                      <div className='mt-1 text-lg font-semibold text-[#f0e8dc]'>
                        {isFree ? 'Free' : audiobook.price}
                      </div>
                    </div>
                    <div className='rounded-[24px] border border-[#2d2436] bg-[#17131f] p-5'>
                      <TagIcon className='h-5 w-5 text-[#c8a84b]' />
                      <div className='mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8f879d]'>
                        Category
                      </div>
                      <div className='mt-1 text-lg font-semibold text-[#f0e8dc]'>
                        {audiobook.category}
                      </div>
                    </div>
                    {/* Audiobook-specific fields */}
                    {audiobook.narrator && (
                      <div className='rounded-[24px] border border-[#2d2436] bg-[#17131f] p-5'>
                        <BookOpenIcon className='h-5 w-5 text-[#c8a84b]' />
                        <div className='mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8f879d]'>
                          Narrator
                        </div>
                        <div className='mt-1 text-lg font-semibold text-[#f0e8dc]'>
                          {audiobook.narrator}
                        </div>
                      </div>
                    )}
                    {audiobook.language && (
                      <div className='rounded-[24px] border border-[#2d2436] bg-[#17131f] p-5'>
                        <TagIcon className='h-5 w-5 text-[#c8a84b]' />
                        <div className='mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8f879d]'>
                          Language
                        </div>
                        <div className='mt-1 text-lg font-semibold text-[#f0e8dc]'>
                          {audiobook.language}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Additional audiobook information */}
                  {(audiobook.scripts || audiobook.wordSync || audiobook.generation) && (
                    <div>
                      <h3 className='text-lg font-semibold text-[#f0e8dc] mb-4'>Audiobook Features</h3>
                      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
                        {audiobook.scripts && (
                          <div className='rounded-[24px] border border-[#2d2436] bg-[#17131f] p-5'>
                            <BookOpenIcon className='h-5 w-5 text-[#c8a84b]' />
                            <div className='mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8f879d]'>
                              Script Available
                            </div>
                            <div className='mt-1 text-lg font-semibold text-[#f0e8dc]'>
                              Yes
                            </div>
                          </div>
                        )}
                        {audiobook.wordSync && (
                          <div className='rounded-[24px] border border-[#2d2436] bg-[#17131f] p-5'>
                            <ClockIcon className='h-5 w-5 text-[#c8a84b]' />
                            <div className='mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8f879d]'>
                              Word Sync
                            </div>
                            <div className='mt-1 text-lg font-semibold text-[#f0e8dc]'>
                              {audiobook.wordSync.enabled ? 'Enabled' : 'Disabled'}
                            </div>
                          </div>
                        )}
                        {audiobook.generation && (
                          <div className='rounded-[24px] border border-[#2d2436] bg-[#17131f] p-5'>
                            <TagIcon className='h-5 w-5 text-[#c8a84b]' />
                            <div className='mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8f879d]'>
                              Generation Status
                            </div>
                            <div className='mt-1 text-lg font-semibold text-[#f0e8dc] capitalize'>
                              {audiobook.generation.status}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {audiobook.tags?.length ? (
                    <div>
                      <h3 className='text-lg font-semibold text-[#f0e8dc]'>Tags</h3>
                      <div className='mt-4 flex flex-wrap gap-2'>
                        {audiobook.tags.map((tag) => (
                          <span
                            key={tag}
                            className='rounded-full border border-[#31293c] bg-[#17131f] px-3 py-1.5 text-sm text-[#bdb5a8]'
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {activeTab === 'read' && ebookFile ? (
                <div className='space-y-6'>
                  <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                    <div>
                      <h2 className='font-serif text-3xl text-[#f0e8dc]'>Read book</h2>
                      <p className='mt-3 text-base leading-8 text-[#bdb5a8]'>
                        {ebookFile.originalName || 'Attached ebook file'}
                        {formatBytes(ebookFile.fileSize)
                          ? ` • ${formatBytes(ebookFile.fileSize)}`
                          : ''}
                      </p>
                    </div>
                    <div className='flex flex-wrap gap-3'>
                      <a
                        href={ebookFile.url}
                        target='_blank'
                        rel='noreferrer'
                        className='rounded-full border border-[#31293c] bg-[#17131f] px-4 py-2.5 text-sm font-semibold text-[#f0e8dc] transition hover:border-[#c8a84b]'
                      >
                        Open file
                      </a>
                      <a
                        href={ebookFile.url}
                        download
                        className='rounded-full bg-[#c8a84b] px-4 py-2.5 text-sm font-semibold text-[#07060a] transition hover:bg-[#e0c06a]'
                      >
                        Download
                      </a>
                    </div>
                  </div>

                  {isPdfEbook ? (
                    <div className='overflow-hidden rounded-[28px] border border-[#2d2436] bg-[#0f0c15]'>
                      <iframe
                        src={ebookFile.url}
                        className='h-[720px] w-full bg-white'
                        title={`${audiobook.title} ebook preview`}
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
                        {formatBytes(ebookFile.fileSize) ? (
                          <p>Size: {formatBytes(ebookFile.fileSize)}</p>
                        ) : null}
                        <p>
                          This file type cannot be embedded inline here, but you can open or
                          download it directly.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {activeTab === 'details' ? (
                <div className='space-y-8'>
                  <div>
                    <h2 className='font-serif text-3xl text-[#f0e8dc]'>Details</h2>
                    <p className='mt-3 text-base leading-8 text-[#bdb5a8]'>
                      Complete metadata and availability for this audiobook.
                    </p>
                  </div>

                  <div className='grid gap-4 sm:grid-cols-2'>
                    {detailRows.map((row) => (
                      <div
                        key={row.label}
                        className='rounded-[24px] border border-[#2d2436] bg-[#17131f] p-5'
                      >
                        <div className='text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8f879d]'>
                          {row.label}
                        </div>
                        <div className='mt-3 text-base font-semibold text-[#f0e8dc]'>
                          {row.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
