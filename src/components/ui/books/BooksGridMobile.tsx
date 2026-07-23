'use client';

import { useEffect, useState } from 'react';
import {
  BookmarkIcon as BookmarkIconOutline,
  PlayIcon,
  PauseIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkIconSolid, StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import { generateBookSlug } from '@/utils/slugify';
import CoverImageFrame from './CoverImageFrame';
import type { PublicBookListItem } from '@/types/publicBook';
import { getAudiobookHref, parsePriceValue } from '@/lib/audiobooks';
import { usePersistentAudioPlayer } from '@/contexts/PersistentAudioPlayerContext';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/services/api/authApi';

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

interface BooksGridMobileProps {
  items: PublicBookListItem[];
  className?: string;
  onAudiobookSelect?: (item: PublicBookListItem) => void;
}

export default function BooksGridMobile({ items, className = '', onAudiobookSelect }: BooksGridMobileProps) {
  const router = useRouter();
  const { refreshUser, user } = useAuth();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedOverrides, setSavedOverrides] = useState<Record<string, boolean>>({});
  const { currentTrack, isPlaying, toggleTrack } = usePersistentAudioPlayer();
  const hasUniquePlus =
    !!user?.subscriptionPlan &&
    user.subscriptionPlan !== 'none';

  useEffect(() => {
    // Inject blob animation styles only once
    if (!document.getElementById('blob-animations-books-mobile')) {
      const styleElement = document.createElement('style');
      styleElement.id = 'blob-animations-books-mobile';
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
  const getItemId = (item: PublicBookListItem) => item._id || item.id || item.slug || item.title;
  const isItemSaved = (item: PublicBookListItem) => {
    const itemId = getItemId(item);
    const override = savedOverrides[itemId];
    if (override !== undefined) return override;

    const itemKeys = [item.slug, item.id, item._id, item.title, generateBookSlug(item.title)]
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
  const handleSaveBook = async (item: PublicBookListItem, href: string) => {
    const identifier = item.slug || item.id || item._id;
    if (!identifier) return;

    if (!user) {
      router.push(`/user/auth?mode=signin&returnUrl=${encodeURIComponent(href)}`);
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
      <div className={`text-center py-12 ${className}`}>
        <p className='text-gray-600 text-sm font-medium'>No books found matching your criteria</p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className='grid grid-cols-2 gap-4 mb-2'>
        {items.map((item, index) => (
              item.type === 'Books' ? (
            <div
              key={item.id}
              className='group flex h-auto w-full flex-col overflow-visible rounded-lg bg-transparent transition-all duration-[250ms] ease-out'
              style={{ 
                animationDelay: `${index * 100}ms`,
              }}
            >
              <div className='relative h-[170px] w-full overflow-hidden rounded-lg bg-transparent shadow-[0_10px_24px_rgba(0,0,0,0.10)]'>
                <CoverImageFrame
                  src={item.image || undefined}
                  alt={item.title}
                  sizes='(max-width: 768px) 50vw, 200px'
                  className='h-[170px] w-full rounded-lg border-0 bg-transparent shadow-none'
                  imageClassName='transition-transform duration-300'
                  fit='cover'
                  showBackdrop={false}
                  fixedAspectRatio={3 / 4}
                  variant='book'
                />
              </div>

              <div className='flex flex-col pt-2 font-dm-sans'>
                <div className='hidden'>
                  <span className='inline-flex min-w-0 max-w-[65%] items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-700'>
                    <span className='truncate'>{item.category}</span>
                  </span>
                  {(item as any).language && (
                    <span className='inline-flex shrink-0 items-center rounded-md bg-indigo-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white'>
                      {(item as any).language}
                    </span>
                  )}
                </div>
                <h3 className='truncate text-[13px] font-semibold leading-tight text-[#1E1B4B] font-dm-sans'>{item.title}</h3>
                <p className='mt-1 truncate text-[11px] font-normal text-[#757575] font-dm-sans'>{item.author}</p>

                {(item.rating ?? 0) > 0 && (
                  <div className='mt-1.5 flex items-center gap-1.5'>
                    <StarIconSolid className='h-4 w-4 text-[#5146F7]' />
                    <span className='text-[20px] font-bold leading-none text-[#1E1B4B] font-dm-sans'>{(item.rating || 0).toFixed(1)}</span>
                    <span className='text-[11px] font-medium text-[#666666] font-dm-sans'>({item.reviews || 0})</span>
                  </div>
                )}

                {!isFreeItem(item) && (
                  <p className='mt-1.5 truncate text-[10px] font-semibold text-[#1E1B4B] font-dm-sans'>
                    {hasUniquePlus ? 'Read ' : <>{formatPrice(item.price) ? `${formatPrice(item.price)} or ` : ''}</>}
                    <span className='font-semibold text-[#16A34A]'>Free</span>
                    {hasUniquePlus ? ' with Unique Plus or' : ' with Unique Plus'}
                  </p>
                )}

                <div className='mt-2 grid grid-cols-[minmax(0,1fr)_34px] gap-2'>
                  <button
                    type='button'
                    onClick={() => handleUniquePlusAction(item, getBookHref(item))}
                    className={`flex h-9 w-full items-center justify-center rounded-[10px] text-[10px] font-semibold leading-none text-white transition-all active:scale-95 font-dm-sans ${
                      isFreeItem(item)
                        ? 'bg-blue-600'
                        : hasUniquePlus
                          ? 'bg-slate-950'
                          : 'bg-indigo-600'
                    }`}
                  >
                    {isFreeItem(item) ? 'Read Free' : hasUniquePlus ? `${formatPrice(item.price) || ''} Keep Forever`.trim() : 'Read with Unique Plus'}
                  </button>
                  <button
                    type='button'
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      void handleSaveBook(item, getBookHref(item));
                    }}
                    disabled={savingId === getItemId(item)}
                    className={`flex h-9 w-9 items-center justify-center rounded-[10px] border shadow-sm transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 font-dm-sans ${
                      isItemSaved(item)
                        ? 'border-yellow-400 bg-yellow-400 text-white'
                        : 'border-slate-200 bg-white text-blue-600'
                    }`}
                    aria-label={`Save ${item.title}`}
                  >
                    {isItemSaved(item) ? <BookmarkIconSolid className='h-4 w-4' /> : <BookmarkIconOutline className='h-4 w-4' />}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              key={item.id}
              className='group flex h-auto w-full flex-col overflow-visible rounded-lg bg-transparent transition-all duration-[250ms] ease-out'
              style={{ 
                animationDelay: `${index * 100}ms`,
              }}
            >
              <div className='relative h-[170px] w-full overflow-hidden rounded-lg bg-transparent shadow-[0_10px_24px_rgba(0,0,0,0.10)]'>
                <CoverImageFrame
                  src={item.image || undefined}
                  alt={item.title}
                  sizes='(max-width: 768px) 50vw, 200px'
                  className='h-[170px] w-full rounded-lg border-0 bg-transparent shadow-none'
                  imageClassName='transition-transform duration-300'
                  fit='cover'
                  showBackdrop={false}
                  fixedAspectRatio={3 / 4}
                  variant='audiobook'
                >
                  <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[4]'>
                    <button
                      type='button'
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlay(item);
                      }}
                      disabled={!item.files?.audiobook?.url}
                      className='
                        bg-white/90 backdrop-blur-sm hover:bg-white 
                        w-10 h-10 rounded-full flex items-center justify-center
                        shadow-lg transition-all duration-300 hover:scale-110
                        disabled:cursor-not-allowed disabled:bg-white/60 disabled:hover:scale-100
                      '
                      aria-label={`${currentTrack?.id === `audiobook-${item.id}` && isPlaying ? 'Pause' : 'Play'} audio preview for ${item.title}`}
                    >
                      {currentTrack?.id === `audiobook-${item.id}` && isPlaying ? (
                        <PauseIcon className='w-4 h-4 text-indigo-600' />
                      ) : (
                        <PlayIcon className='w-4 h-4 text-indigo-600 ml-0.5' />
                      )}
                    </button>
                  </div>
                </CoverImageFrame>
              </div>

              <div className='flex flex-col pt-2 font-dm-sans'>
                <div className='hidden'>
                  <span className='inline-flex min-w-0 max-w-[65%] items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-700'>
                    <span className='truncate'>{item.category}</span>
                  </span>
                  {(item as any).language && (
                    <span className='inline-flex shrink-0 items-center rounded-md bg-indigo-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white'>
                      {(item as any).language}
                    </span>
                  )}
                </div>
                <h3 className='truncate text-[13px] font-semibold leading-tight text-[#1E1B4B] font-dm-sans'>{item.title}</h3>
                <p className='mt-1 truncate text-[11px] font-normal text-[#757575] font-dm-sans'>{item.author}</p>

                {(item.rating ?? 0) > 0 && (
                  <div className='mt-1.5 flex items-center gap-1.5'>
                    <StarIconSolid className='h-4 w-4 text-[#5146F7]' />
                    <span className='text-[20px] font-bold leading-none text-[#1E1B4B] font-dm-sans'>{(item.rating || 0).toFixed(1)}</span>
                    <span className='text-[11px] font-medium text-[#666666] font-dm-sans'>({item.reviews || 0})</span>
                  </div>
                )}

                {!isFreeItem(item) && (
                  <p className='mt-1.5 truncate text-[10px] font-semibold text-[#1E1B4B] font-dm-sans'>
                    {hasUniquePlus ? 'Read ' : <>{formatPrice(item.price) ? `${formatPrice(item.price)} or ` : ''}</>}
                    <span className='font-semibold text-[#16A34A]'>Free</span>
                    {hasUniquePlus ? ' with Unique Plus or' : ' with Unique Plus'}
                  </p>
                )}

                <div className='mt-2 grid grid-cols-[minmax(0,1fr)_34px] gap-2'>
                  <button
                    type='button'
                    onClick={() => handleUniquePlusAction(item, getAudiobookHref(item))}
                    className={`flex h-9 w-full items-center justify-center rounded-[10px] text-[10px] font-semibold leading-none text-white transition-all active:scale-95 font-dm-sans ${
                      isFreeItem(item)
                        ? 'bg-blue-600'
                        : hasUniquePlus
                          ? 'bg-slate-950'
                          : 'bg-indigo-600'
                    }`}
                  >
                    {isFreeItem(item) ? 'Read Free' : hasUniquePlus ? `${formatPrice(item.price) || ''} Keep Forever`.trim() : 'Read with Unique Plus'}
                  </button>
                  <button
                    type='button'
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      void handleSaveBook(item, getAudiobookHref(item));
                    }}
                    disabled={savingId === getItemId(item)}
                    className={`flex h-9 w-9 items-center justify-center rounded-[10px] border shadow-sm transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 font-dm-sans ${
                      isItemSaved(item)
                        ? 'border-yellow-400 bg-yellow-400 text-white'
                        : 'border-slate-200 bg-white text-blue-600'
                    }`}
                    aria-label={`Save ${item.title}`}
                  >
                    {isItemSaved(item) ? <BookmarkIconSolid className='h-4 w-4' /> : <BookmarkIconOutline className='h-4 w-4' />}
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
