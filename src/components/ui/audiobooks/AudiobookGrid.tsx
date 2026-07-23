'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  PauseIcon,
  PlayIcon,
  PlusIcon,
  ShoppingCartIcon,
  SpeakerWaveIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import type { PublicBookListItem } from '@/types/publicBook';
import {
  getAudiobookHref,
  parsePriceValue,
} from '@/lib/audiobooks';
import { useCart } from '@/contexts/CartContext';
import { usePersistentAudioPlayer } from '@/contexts/PersistentAudioPlayerContext';
import { useAuth } from '@/contexts/AuthContext';

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
  const { addToCart, isInCart } = useCart();
  const { user } = useAuth();
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

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, index) => (
      <StarIcon
        key={index}
        className={`h-3.5 w-3.5 ${
          index < Math.round(rating)
            ? 'text-amber-500 [stroke-width:2.2]'
            : 'text-slate-300'
        }`}
      />
    ));

  const formatPrice = (price?: string | null) => {
    if (!price) return null;
    return `₹${price.replace(/^[₹$]/, '')}`;
  };

  const languageBadgeClassName = (language?: string) =>
    language?.toLowerCase() === 'hindi'
      ? 'bg-[#f28c18]'
      : 'bg-indigo-600';
  const displayPrice = (item: PublicBookListItem) =>
    item.price ? `₹${item.price.replace(/^[^0-9.]*/, '').replace(/\.00$/, '')}` : null;
  const isFreeItem = (item: PublicBookListItem) =>
    item.componentType === 'free-summaries' ||
    parsePriceValue(item.price) <= 0;
  const handleUniquePlusAction = (item: PublicBookListItem) => {
    if (isFreeItem(item) || hasUniquePlus) {
      router.push(getAudiobookHref(item));
      return;
    }

    const returnTo =
      typeof window !== 'undefined'
        ? `${window.location.pathname}${window.location.search}`
        : '/';
    router.push(
      `/user/auth?mode=signin&returnUrl=${encodeURIComponent(
        `/subscription?returnTo=${encodeURIComponent(returnTo)}`
      )}`
    );
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
          const inCart = isInCart(item.id);

          return (
            <article
              key={item.id}
              className='group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white text-left shadow-md transition-shadow duration-300 hover:shadow-xl'
            >
              <div className='relative aspect-[3/4] overflow-hidden bg-slate-100'>
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes='(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw'
                    className='object-cover transition duration-500 group-hover:scale-105'
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

              <div className='flex flex-1 flex-col gap-1.5 p-3'>
                <div className='flex items-center justify-between gap-2'>
                  <span className='inline-flex min-w-0 max-w-[70%] items-center rounded-md bg-slate-100 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-slate-700'>
                    <span className='truncate'>{item.category}</span>
                  </span>
                  {item.language ? (
                    <span className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-white ${languageBadgeClassName(item.language)}`}>
                      {item.language}
                    </span>
                  ) : null}
                </div>
                <h3 className='line-clamp-2 text-[13px] font-bold leading-snug text-slate-900'>
                  {item.title}
                </h3>
                <p className='text-[11px] text-slate-500'>{item.author}</p>

                {(item.rating ?? 0) > 0 && (
                  <div className='flex items-center gap-0.5'>
                    {Array.from({ length: 5 }).map((_, starIndex) =>
                      starIndex < Math.round(item.rating || 0) ? (
                        <StarIconSolid key={starIndex} className='h-3 w-3 text-amber-400' />
                      ) : (
                        <StarIcon key={starIndex} className='h-3 w-3 text-slate-200' />
                      )
                    )}
                    <span className='ml-1 text-[10px] text-slate-400'>
                      ({item.reviews || 0})
                    </span>
                  </div>
                )}

                {!isFreeItem(item) && item.price && (
                  <div className='flex items-center gap-1.5'>
                    <span className='text-sm font-bold text-slate-900'>
                      {displayPrice(item)}
                    </span>
                  </div>
                )}

                <p className='text-[10px] text-slate-400'>
                  {item.pages ? `${item.pages} pages` : item.duration || 'Audiobook'}
                </p>

                <div className='mt-auto flex flex-col gap-1.5 pt-2'>
                  <button
                    type='button'
                    onClick={() => handleUniquePlusAction(item)}
                    className={`w-full rounded-lg py-2 text-[10px] font-bold text-white transition-all ${
                      isFreeItem(item)
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : hasUniquePlus
                          ? 'bg-slate-950 hover:bg-slate-800'
                          : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {isFreeItem(item) ? 'Read Free' : hasUniquePlus ? `${displayPrice(item) || ''} Keep Forever`.trim() : 'Read with Unique Plus'}
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
