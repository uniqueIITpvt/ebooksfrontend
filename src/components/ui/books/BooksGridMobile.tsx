'use client';

import { useEffect } from 'react';
import {
  StarIcon,
  ShoppingCartIcon,
  PlayIcon,
  PauseIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { generateBookSlug } from '@/utils/slugify';
import CoverImageFrame from './CoverImageFrame';
import type { PublicBookListItem } from '@/types/publicBook';
import { getAudiobookHref, parsePriceValue } from '@/lib/audiobooks';
import { useCart } from '@/contexts/CartContext';
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

interface BooksGridMobileProps {
  items: PublicBookListItem[];
  className?: string;
  onAudiobookSelect?: (item: PublicBookListItem) => void;
}

export default function BooksGridMobile({ items, className = '', onAudiobookSelect }: BooksGridMobileProps) {
  const router = useRouter();
  const { addToCart, isInCart } = useCart();
  const { user } = useAuth();
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
  const languageBadgeClassName = (language?: string) =>
    language?.toLowerCase() === 'hindi'
      ? 'bg-[#f28c18]'
      : 'bg-indigo-600';

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
              className='group flex flex-col w-full bg-white rounded-2xl border border-slate-100 shadow-md overflow-hidden'
              style={{ 
                animationDelay: `${index * 100}ms`,
              }}
            >
              <div className='relative'>
                <CoverImageFrame
                  src={item.image || undefined}
                  alt={item.title}
                  sizes='(max-width: 768px) 50vw, 200px'
                  className='rounded-none border-0 bg-slate-50 shadow-none'
                  imageClassName='transition-transform duration-300'
                  fit='cover'
                  showBackdrop={false}
                  fixedAspectRatio={3 / 4}
                  variant='book'
                />
              </div>

              <div className='p-2.5 flex flex-col gap-1.5 flex-1'>
                <div className='flex items-center justify-between gap-1'>
                  <span className='inline-flex min-w-0 max-w-[65%] items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-700'>
                    <span className='truncate'>{item.category}</span>
                  </span>
                  {(item as any).language && (
                    <span className={`inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase text-white ${languageBadgeClassName((item as any).language)}`}>
                      {(item as any).language}
                    </span>
                  )}
                </div>
                <h3 className='text-xs font-bold text-slate-900 leading-tight line-clamp-2'>{item.title}</h3>
                <p className='text-[11px] text-slate-500 line-clamp-1'>{item.author}</p>

                {(item.rating ?? 0) > 0 && (
                  <div className='flex items-center gap-0.5'>
                    {Array.from({ length: 5 }).map((_, starIndex) => (
                      starIndex < Math.round(item.rating || 0)
                        ? <StarIconSolid key={starIndex} className='w-3 h-3 text-amber-400' />
                        : <StarIcon key={starIndex} className='w-3 h-3 text-slate-200' />
                    ))}
                    <span className='text-[10px] text-slate-400 ml-1'>({item.reviews || 0})</span>
                  </div>
                )}

                {!isFreeItem(item) && item.price && (
                  <div className='flex items-center gap-1'>
                    <span className='text-xs font-bold text-slate-900'>{formatPrice(item.price)}</span>
                    {item.originalPrice && (
                      <span className='text-[10px] text-slate-400 line-through'>{formatPrice(item.originalPrice)}</span>
                    )}
                  </div>
                )}

                <p className='text-[10px] text-slate-400'>{item.pages ? `${item.pages} pages` : item.duration}</p>

                <div className='mt-auto pt-1 flex flex-col gap-1.5'>
                  <button
                    type='button'
                    onClick={() => handleUniquePlusAction(item, getBookHref(item))}
                    className={`w-full py-2 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 ${
                      isFreeItem(item)
                        ? 'bg-blue-600'
                        : hasUniquePlus
                          ? 'bg-slate-950'
                          : 'bg-indigo-600'
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
              className='group flex flex-col w-full bg-white rounded-2xl border border-slate-100 shadow-md overflow-hidden'
              style={{ 
                animationDelay: `${index * 100}ms`,
              }}
            >
              <div className='relative'>
                <CoverImageFrame
                  src={item.image || undefined}
                  alt={item.title}
                  sizes='(max-width: 768px) 50vw, 200px'
                  className='rounded-none border-0 bg-slate-50 shadow-none'
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

              <div className='p-2.5 flex flex-col gap-1.5 flex-1'>
                <div className='flex items-center justify-between gap-1'>
                  <span className='inline-flex min-w-0 max-w-[65%] items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-700'>
                    <span className='truncate'>{item.category}</span>
                  </span>
                  {(item as any).language && (
                    <span className={`inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase text-white ${languageBadgeClassName((item as any).language)}`}>
                      {(item as any).language}
                    </span>
                  )}
                </div>
                <h3 className='text-xs font-bold text-slate-900 leading-tight line-clamp-2'>{item.title}</h3>
                <p className='text-[11px] text-slate-500 line-clamp-1'>{item.author}</p>

                {(item.rating ?? 0) > 0 && (
                  <div className='flex items-center gap-0.5'>
                    {Array.from({ length: 5 }).map((_, starIndex) => (
                      starIndex < Math.round(item.rating || 0)
                        ? <StarIconSolid key={starIndex} className='w-3 h-3 text-amber-400' />
                        : <StarIcon key={starIndex} className='w-3 h-3 text-slate-200' />
                    ))}
                    <span className='text-[10px] text-slate-400 ml-1'>({item.reviews || 0})</span>
                  </div>
                )}

                {!isFreeItem(item) && item.price && (
                  <div className='flex items-center gap-1'>
                    <span className='text-xs font-bold text-slate-900'>{formatPrice(item.price)}</span>
                    {item.originalPrice && (
                      <span className='text-[10px] text-slate-400 line-through'>{formatPrice(item.originalPrice)}</span>
                    )}
                  </div>
                )}

                <p className='text-[10px] text-slate-400'>{item.pages ? `${item.pages} pages` : item.duration || 'Audiobook'}</p>

                <div className='mt-auto pt-1 flex flex-col gap-1.5'>
                  <button
                    type='button'
                    onClick={() => handleUniquePlusAction(item, getAudiobookHref(item))}
                    className={`w-full py-2 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 ${
                      isFreeItem(item)
                        ? 'bg-blue-600'
                        : hasUniquePlus
                          ? 'bg-slate-950'
                          : 'bg-indigo-600'
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
