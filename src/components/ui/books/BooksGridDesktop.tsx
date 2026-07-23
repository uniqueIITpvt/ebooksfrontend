'use client';

import { useEffect } from 'react';
import {
  PlayIcon,
  PauseIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { generateBookSlug } from '@/utils/slugify';
import { useRouter } from 'next/navigation';
import CoverImageFrame from './CoverImageFrame';
import type { PublicBookListItem } from '@/types/publicBook';
import { getAudiobookHref, parsePriceValue } from '@/lib/audiobooks';
import { usePersistentAudioPlayer } from '@/contexts/PersistentAudioPlayerContext';
import { useAuth } from '@/contexts/AuthContext';

// Add the blob animation styles
const blobStyles = `
  @keyframes blob-bounce {
    0% {
      transform: translate(-50%, -50%) translate3d(0, 0, 0);
    }
    25% {
      transform: translate(-50%, -50%) translate3d(100%, 0, 0);
    }
    50% {
      transform: translate(-50%, -50%) translate3d(100%, 100%, 0);
    }
    75% {
      transform: translate(-50%, -50%) translate3d(0, 100%, 0);
    }
    100% {
      transform: translate(-50%, -50%) translate3d(0, 0, 0);
    }
  }
`;

interface BooksGridDesktopProps {
  items: PublicBookListItem[];
  className?: string;
  onAudiobookSelect?: (item: PublicBookListItem) => void;
  columns?: 4 | 5;
}

export default function BooksGridDesktop({
  items,
  className = '',
  onAudiobookSelect,
  columns = 4,
}: BooksGridDesktopProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { currentTrack, isPlaying, toggleTrack } = usePersistentAudioPlayer();
  const hasUniquePlus =
    !!user?.subscriptionPlan &&
    user.subscriptionPlan !== 'none';

  useEffect(() => {
    // Inject blob animation styles only once
    if (!document.getElementById('blob-animations-books-desktop')) {
      const styleElement = document.createElement('style');
      styleElement.id = 'blob-animations-books-desktop';
      styleElement.textContent = blobStyles;
      document.head.appendChild(styleElement);
    }
  }, []);

  // Audio playback functionality
  const handlePlay = async (item: PublicBookListItem) => {
    if (item.type !== 'Audiobook') return;

    const audioUrl = item.files?.audiobook?.url;
    if (!audioUrl) return;

    await toggleTrack({
      id: `audiobook-${item.id}`,
      title: item.title,
      author: item.author,
      image: item.image,
      url: audioUrl,
      href: getAudiobookHref(item),
    });
  };

  const handleAudiobookSelect = (item: PublicBookListItem) => {
    if (onAudiobookSelect) {
      onAudiobookSelect(item);
      return;
    }

    router.push(getAudiobookHref(item));
  };

  const formatPrice = (price?: string | null) => {
    if (!price) return null;
    return `₹${price.replace(/^[^0-9.]*/, '').replace(/\.00$/, '')}`;
  };
  const isFreeItem = (item: PublicBookListItem) =>
    item.componentType === 'free-summaries' ||
    parsePriceValue(item.price) <= 0;
  const getBookHref = (item: PublicBookListItem) =>
    `/books/${item.slug || item.id || item._id || generateBookSlug(item.title)}`;
  const handleUniquePlusAction = (item: PublicBookListItem, href: string) => {
    if (isFreeItem(item) || hasUniquePlus) {
      router.push(href);
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
  if (!items || items.length === 0) {
    return (
      <div className={`text-center py-16 ${className}`}>
        <p className='text-gray-600 font-medium'>No books found matching your criteria</p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 ${
          columns === 5 ? 'xl:grid-cols-5' : 'xl:grid-cols-4'
        } gap-x-6 gap-y-10`}
      >
        {items.map((item, index) => (
              item.type === 'Books' ? (
                <div
                  key={item.id}
                  className='group mx-auto flex h-auto w-[210px] flex-col overflow-visible rounded-lg bg-transparent transition-all duration-[250ms] ease-out hover:-translate-y-1.5'
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <div className='relative h-[285px] w-[190px] overflow-hidden rounded-lg bg-transparent shadow-[0_12px_30px_rgba(0,0,0,0.10)] transition-shadow duration-[250ms] ease-out group-hover:shadow-[0_18px_36px_rgba(0,0,0,0.14)]'>
                    <CoverImageFrame
                      src={item.image || undefined}
                      alt={item.title}
                      sizes='190px'
                      className='h-[285px] w-[190px] rounded-lg border-0 bg-transparent shadow-none'
                      imageClassName='transition-transform duration-[250ms] ease-out'
                      fit='cover'
                      showBackdrop={false}
                      fixedAspectRatio={3 / 4}
                      variant='book'
                    />
                  </div>

                  <div className='flex flex-col pt-3 font-dm-sans'>
                    <div className='hidden'>
                      <span className='inline-flex min-w-0 max-w-[70%] items-center rounded-md bg-slate-100 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-slate-700'>
                        <span className='truncate'>{item.category}</span>
                      </span>
                      {(item as any).language && (
                        <span className='inline-flex shrink-0 items-center rounded-md bg-indigo-600 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-white'>
                          {(item as any).language}
                        </span>
                      )}
                    </div>
                    <h3 className='truncate text-[16px] font-semibold leading-tight text-[#1E1B4B] font-dm-sans'>{item.title}</h3>
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
                        {hasUniquePlus ? 'Read ' : <>{formatPrice(item.price) ? `${formatPrice(item.price)} or ` : ''}</>}
                        <span className='font-semibold text-[#16A34A]'>Free</span>
                        {hasUniquePlus ? ' with Unique Plus or' : ' with Unique Plus'}
                      </p>
                    )}

                    <div className='mt-3 flex flex-col gap-1.5'>
                      <button
                        type='button'
                        onClick={() => handleUniquePlusAction(item, getBookHref(item))}
                        className={`flex h-10 w-full items-center justify-center rounded-[10px] text-[12px] font-semibold leading-none text-white transition-all duration-[250ms] ease-out active:scale-95 font-dm-sans ${
                          isFreeItem(item)
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : hasUniquePlus
                              ? 'bg-slate-950 hover:bg-slate-800'
                              : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                      >
                        {isFreeItem(item) ? 'Read Free' : hasUniquePlus ? `${formatPrice(item.price) || ''} Keep Forever`.trim() : 'Read with Unique Plus'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  key={item.id}
                  className='group mx-auto flex h-auto w-[210px] flex-col overflow-visible rounded-lg bg-transparent transition-all duration-[250ms] ease-out hover:-translate-y-1.5'
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <div className='relative h-[285px] w-[190px] overflow-hidden rounded-lg bg-transparent shadow-[0_12px_30px_rgba(0,0,0,0.10)] transition-shadow duration-[250ms] ease-out group-hover:shadow-[0_18px_36px_rgba(0,0,0,0.14)]'>
                    <CoverImageFrame
                      src={item.image || undefined}
                      alt={item.title}
                      sizes='190px'
                      className='h-[285px] w-[190px] rounded-lg border-0 bg-transparent shadow-none'
                      imageClassName='transition-transform duration-[250ms] ease-out'
                      fit='cover'
                      showBackdrop={false}
                      fixedAspectRatio={3 / 4}
                      variant='audiobook'
                    >
                      <div className='absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2'>
                        <button
                          type='button'
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlay(item);
                          }}
                          disabled={!item.files?.audiobook?.url}
                          className='
                            bg-white/90 backdrop-blur-sm hover:bg-white 
                            w-12 h-12 rounded-full flex items-center justify-center
                            shadow-lg transition-all duration-300 hover:scale-110
                            disabled:cursor-not-allowed disabled:bg-white/60 disabled:hover:scale-100
                          '
                          aria-label={`${currentTrack?.id === `audiobook-${item.id}` && isPlaying ? 'Pause' : 'Play'} audio preview for ${item.title}`}
                        >
                          {currentTrack?.id === `audiobook-${item.id}` && isPlaying ? (
                            <PauseIcon className='w-6 h-6 text-indigo-600' />
                          ) : (
                            <PlayIcon className='w-6 h-6 text-indigo-600 ml-0.5' />
                          )}
                        </button>
                      </div>
                    </CoverImageFrame>
                  </div>

                  <div className='flex flex-col pt-3 font-dm-sans'>
                    <div className='hidden'>
                      <span className='inline-flex min-w-0 max-w-[70%] items-center rounded-md bg-slate-100 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-slate-700'>
                        <span className='truncate'>{item.category}</span>
                      </span>
                      {(item as any).language && (
                        <span className='inline-flex shrink-0 items-center rounded-md bg-indigo-600 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-white'>
                          {(item as any).language}
                        </span>
                      )}
                    </div>
                    <h3 className='truncate text-[16px] font-semibold leading-tight text-[#1E1B4B] font-dm-sans'>{item.title}</h3>
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
                        {hasUniquePlus ? 'Read ' : <>{formatPrice(item.price) ? `${formatPrice(item.price)} or ` : ''}</>}
                        <span className='font-semibold text-[#16A34A]'>Free</span>
                        {hasUniquePlus ? ' with Unique Plus or' : ' with Unique Plus'}
                      </p>
                    )}

                    <div className='mt-3 flex flex-col gap-1.5'>
                      <button
                        type='button'
                        onClick={() => handleUniquePlusAction(item, getAudiobookHref(item))}
                        className={`flex h-10 w-full items-center justify-center rounded-[10px] text-[12px] font-semibold leading-none text-white transition-all duration-[250ms] ease-out active:scale-95 font-dm-sans ${
                          isFreeItem(item)
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : hasUniquePlus
                              ? 'bg-slate-950 hover:bg-slate-800'
                              : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                      >
                        {isFreeItem(item) ? 'Read Free' : hasUniquePlus ? `${formatPrice(item.price) || ''} Keep Forever`.trim() : 'Read with Unique Plus'}
                      </button>
                    </div>
                  </div>
                </div>
              )
        ))}
      </div>

    </div>
  );
}
