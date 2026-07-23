'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  BookmarkIcon as BookmarkIconOutline,
  PauseIcon,
  PlayIcon,
  SpeakerWaveIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkIconSolid, StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import type { PublicBookListItem } from '@/types/publicBook';
import {
  getAudiobookHref,
  parsePriceValue,
} from '@/lib/audiobooks';
import { usePersistentAudioPlayer } from '@/contexts/PersistentAudioPlayerContext';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/services/api/authApi';

interface AudiobookGridProps {
  items: PublicBookListItem[];
}

const placeholderGradients = [
  'from-blue-100 via-sky-200 to-indigo-100',
  'from-amber-100 via-orange-100 to-rose-100',
  'from-emerald-100 via-cyan-100 to-sky-100',
  'from-lime-100 via-green-100 to-emerald-100',
];

export default function AudiobookGrid({ items }: AudiobookGridProps) {
  const router = useRouter();
  const { openAuthModal, refreshUser, user } = useAuth();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedOverrides, setSavedOverrides] = useState<Record<string, boolean>>({});
  const { currentTrack, isPlaying, toggleTrack } = usePersistentAudioPlayer();
  const hasUniquePlus =
    !!user?.subscriptionPlan &&
    user.subscriptionPlan !== 'none';

  const handleTogglePreview = async (item: PublicBookListItem) => {
    const audioUrl = item.files?.audiobook?.url;

    if (!audioUrl) return;

    try {
      await toggleTrack({
        id: `audiobook-${item.id}`,
        title: item.title,
        author: item.author,
        image: item.image,
        url: audioUrl,
        href: getAudiobookHref(item),
      });
    } catch {
    }
  };

  const isFreeItem = (item: PublicBookListItem) =>
    item.componentType === 'free-summaries' ||
    parsePriceValue(item.price) <= 0;
  const cleanDisplayPrice = (item: PublicBookListItem) =>
    item.price ? `₹${item.price.replace(/^[^0-9.]*/, '').replace(/\.00$/, '')}` : null;
  const getItemId = (item: PublicBookListItem) => item._id || item.id || item.slug || item.title;
  const isItemSaved = (item: PublicBookListItem) => {
    const itemId = getItemId(item);
    const override = savedOverrides[itemId];
    if (override !== undefined) return override;

    const itemKeys = [item.slug, item.id, item._id, item.title]
      .filter(Boolean)
      .map(String);

    return (user?.savedBooks || []).some((savedBook) => {
      const rawBook = typeof savedBook.bookId === 'object' ? savedBook.bookId : null;
      const savedKeys = [
        savedBook.slug,
        savedBook.id,
        savedBook._id,
        savedBook.title,
        typeof savedBook.bookId === 'string' ? savedBook.bookId : undefined,
        rawBook?.slug,
        rawBook?.id,
        rawBook?._id,
        rawBook?.title,
      ].filter(Boolean).map(String);

      return itemKeys.some((key) => savedKeys.includes(key));
    });
  };
  const handleUniquePlusAction = (item: PublicBookListItem) => {
    if (isFreeItem(item) || hasUniquePlus) {
      router.push(getAudiobookHref(item));
      return;
    }

    const returnTo =
      typeof window !== 'undefined'
        ? `${window.location.pathname}${window.location.search}`
        : '/';
    openAuthModal('signin', `/subscription?returnTo=${encodeURIComponent(returnTo)}`);
  };
  const handleSaveBook = async (item: PublicBookListItem) => {
    const identifier = item.slug || item.id || item._id;
    if (!identifier) return;

    const href = getAudiobookHref(item);
    if (!user) {
      openAuthModal('signin', href);
      return;
    }

    const itemId = getItemId(item);
    setSavingId(itemId);
    try {
      const response = await authApi.toggleSavedBook(identifier);
      if (response.success) {
        setSavedOverrides((current) => ({
          ...current,
          [itemId]: response.data?.saved ?? !isItemSaved(item),
        }));
      }
      await refreshUser();
    } catch (error: any) {
      alert(error?.message || 'Unable to save this item');
    } finally {
      setSavingId(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className='rounded-[28px] border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-[0_18px_50px_rgba(15,23,42,0.05)]'>
        <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-blue-200 bg-blue-50'>
          <SpeakerWaveIcon className='h-7 w-7 text-blue-600' />
        </div>
        <h3 className='text-xl font-semibold text-slate-900'>No audiobooks found</h3>
        <p className='mt-2 text-sm text-slate-500'>
          Try a different search, category, language, or format filter.
        </p>
      </div>
    );
  }

  return (
    <div className={currentTrack ? 'pb-24 lg:pb-28' : ''}>
      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'>
        {items.map((item, index) => {
          const audioUrl = item.files?.audiobook?.url;
          const isCurrentItem = currentTrack?.id === `audiobook-${item.id}`;
          return (
            <article
              key={item.id}
              className='group mx-auto flex h-auto w-full max-w-[210px] flex-col overflow-visible rounded-lg bg-transparent text-left transition-all duration-[250ms] ease-out hover:-translate-y-1.5'
            >
              <div className='relative h-[285px] w-[190px] overflow-hidden rounded-lg bg-transparent shadow-[0_12px_30px_rgba(0,0,0,0.10)] transition-shadow duration-[250ms] ease-out group-hover:shadow-[0_18px_36px_rgba(0,0,0,0.14)]'>
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes='190px'
                    className='rounded-lg object-cover transition duration-[250ms]'
                  />
                ) : (
                  <div
                    className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${placeholderGradients[index % placeholderGradients.length]}`}
                  >
                    <div className='rounded-full border border-white/60 bg-white/50 p-5 backdrop-blur-sm'>
                      <SpeakerWaveIcon className='h-9 w-9 text-blue-700' />
                    </div>
                  </div>
                )}

                <button
                  type='button'
                  onClick={(event) => {
                    event.stopPropagation();
                    handleTogglePreview(item);
                  }}
                  disabled={!audioUrl}
                  aria-label={
                    audioUrl
                      ? `${isCurrentItem && isPlaying ? 'Pause' : 'Play'} audio preview for ${item.title}`
                      : `Audio preview unavailable for ${item.title}`
                  }
                  className={`absolute bottom-4 right-4 flex h-14 w-14 items-center justify-center rounded-full border backdrop-blur transition ${
                    audioUrl
                      ? 'border-blue-200 bg-blue-600 text-white shadow-[0_10px_30px_rgba(37,99,235,0.28)] hover:scale-105 hover:bg-blue-700'
                      : 'cursor-not-allowed border-white/40 bg-white/50 text-slate-400'
                  }`}
                >
                  {isCurrentItem && isPlaying ? (
                    <PauseIcon className='h-6 w-6' />
                  ) : (
                    <PlayIcon className='ml-0.5 h-6 w-6' />
                  )}
                </button>
              </div>

              <div className='flex flex-col pt-3 font-dm-sans'>
                <div className='hidden'>
                  <span className='inline-flex min-w-0 max-w-[70%] items-center rounded-md bg-slate-100 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-slate-700'>
                    <span className='truncate'>{item.category}</span>
                  </span>
                  {item.language ? (
                    <span className='inline-flex shrink-0 items-center rounded-md bg-indigo-600 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-white'>
                      {item.language}
                    </span>
                  ) : null}
                </div>
                <h3 className='truncate text-[16px] font-semibold leading-tight text-[#1E1B4B] font-dm-sans'>
                  {item.title}
                </h3>
                <p className='mt-1.5 truncate text-[13px] font-normal text-[#757575] font-dm-sans'>{item.author}</p>

                {(item.rating ?? 0) > 0 && (
                  <div className='mt-2 flex items-center gap-2'>
                    <StarIconSolid className='h-5 w-5 text-[#5146F7]' />
                    <span className='text-[26px] font-bold leading-none text-[#1E1B4B] font-dm-sans'>{(item.rating || 0).toFixed(1)}</span>
                    <span className='text-[14px] font-medium text-[#666666] font-dm-sans'>({item.reviews || 0})</span>
                  </div>
                )}

                {!isFreeItem(item) && (
                  <p className='mt-2 truncate text-[13px] font-semibold text-[#1E1B4B] font-dm-sans'>
                    {hasUniquePlus ? 'Read ' : <>{cleanDisplayPrice(item) ? `${cleanDisplayPrice(item)} or ` : ''}</>}
                    <span className='font-semibold text-[#16A34A]'>Free</span>
                    {hasUniquePlus ? ' with Unique Plus or' : ' with Unique Plus'}
                  </p>
                )}

                <div className='mt-3 grid grid-cols-[minmax(0,1fr)_44px] gap-3'>
                  <button
                    type='button'
                    onClick={() => handleUniquePlusAction(item)}
                    className={`flex h-10 w-full items-center justify-center rounded-[10px] text-[12px] font-semibold leading-none text-white transition-all duration-[250ms] ease-out active:scale-95 font-dm-sans ${
                      isFreeItem(item)
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : hasUniquePlus
                          ? 'bg-slate-950 hover:bg-slate-800'
                          : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {isFreeItem(item) ? 'Read Free' : hasUniquePlus ? `${cleanDisplayPrice(item) || ''} Keep Forever`.trim() : 'Read with Unique Plus'}
                  </button>
                  <button
                    type='button'
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      void handleSaveBook(item);
                    }}
                    disabled={savingId === getItemId(item)}
                    className={`flex h-10 w-10 items-center justify-center rounded-[10px] border shadow-sm transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 font-dm-sans ${
                      isItemSaved(item)
                        ? 'border-yellow-400 bg-yellow-400 text-white hover:bg-yellow-500'
                        : 'border-slate-200 bg-white text-blue-600 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                    aria-label={`Save ${item.title}`}
                  >
                    {isItemSaved(item) ? <BookmarkIconSolid className='h-5 w-5' /> : <BookmarkIconOutline className='h-5 w-5' />}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

    </div>
  );
}
