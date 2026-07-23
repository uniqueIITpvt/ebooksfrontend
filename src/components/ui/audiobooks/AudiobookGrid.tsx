'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PauseIcon,
  PlayIcon,
  SpeakerWaveIcon,
} from '@heroicons/react/24/outline';
import type { PublicBookListItem } from '@/types/publicBook';
import {
  getAudiobookHref,
  parsePriceValue,
} from '@/lib/audiobooks';
import { usePersistentAudioPlayer } from '@/contexts/PersistentAudioPlayerContext';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/services/api/authApi';
import { LibraryCardDesktop } from '@/components/ui/cards/LibraryCard';

interface AudiobookGridProps {
  items: PublicBookListItem[];
}

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
        {items.map((item) => {
          const audioUrl = item.files?.audiobook?.url;
          const isCurrentItem = currentTrack?.id === `audiobook-${item.id}`;
          const free = isFreeItem(item);
          const priceLine = free ? null : (
            <>
              {hasUniquePlus ? 'Read ' : <>{cleanDisplayPrice(item) ? `${cleanDisplayPrice(item)} or ` : ''}</>}
              <span className='font-semibold text-[#16A34A]'>Free</span>
              {hasUniquePlus ? ' with Unique Plus or' : ' with Unique Plus'}
            </>
          );

          return (
            <LibraryCardDesktop
              key={item.id}
              image={item.image}
              title={item.title}
              author={item.author}
              rating={item.rating}
              reviews={item.reviews}
              priceLine={priceLine}
              primaryLabel={free ? 'Read Free' : hasUniquePlus ? `${cleanDisplayPrice(item) || ''} Keep Forever`.trim() : 'Read with Unique Plus'}
              primaryVariant={free ? 'free' : hasUniquePlus ? 'keep-forever' : 'unique-plus'}
              onPrimaryClick={() => handleUniquePlusAction(item)}
              isSaved={isItemSaved(item)}
              onSaveClick={() => void handleSaveBook(item)}
              saveDisabled={savingId === getItemId(item)}
              saveLabel={`Save ${item.title}`}
              coverVariant='audiobook'
              coverOverlay={(
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
              )}
            />
          );
        })}
      </div>

    </div>
  );
}
