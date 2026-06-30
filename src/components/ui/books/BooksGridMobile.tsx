'use client';

import { useState, useRef, useEffect } from 'react';
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
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentPreviewItem = items.find((item) => item.id === currentlyPlaying) ?? null;

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
  const handlePlay = (item: PublicBookListItem) => {
    if (item.type !== 'Audiobook') return;

    if (!audioRef.current) return;

    const audioUrl = item.files?.audiobook?.url;
    if (!audioUrl) return;

    if (currentlyPlaying === item.id && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (currentlyPlaying !== item.id) {
        audioRef.current.src = audioUrl;
        setCurrentlyPlaying(item.id);
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAudiobookSelect = (item: PublicBookListItem) => {
    if (onAudiobookSelect) {
      onAudiobookSelect(item);
      return;
    }

    router.push(getAudiobookHref(item));
  };

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentlyPlaying(null);
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [currentlyPlaying]);

  useEffect(() => {
    if (!currentlyPlaying) return;

    const stillExists = items.some((item) => item.id === currentlyPlaying);
    if (stillExists) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    setCurrentlyPlaying(null);
    setIsPlaying(false);
  }, [currentlyPlaying, items]);

  const formatPrice = (price?: string | null) => {
    if (!price) return null;
    return `₹${price.replace(/^[₹$]/, '')}`;
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
      {/* Hidden Audio Element */}
      <audio ref={audioRef} preload='metadata' />
      
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

                {item.price && (
                  <div className='flex items-center gap-1'>
                    <span className='text-xs font-bold text-slate-900'>{formatPrice(item.price)}</span>
                    {item.originalPrice && (
                      <span className='text-[10px] text-slate-400 line-through'>{formatPrice(item.originalPrice)}</span>
                    )}
                  </div>
                )}

                <p className='text-[10px] text-slate-400'>{item.pages ? `${item.pages} pages` : item.duration}</p>

                <div className='mt-auto pt-1 flex flex-col gap-1.5'>
                  <div className='grid grid-cols-2 gap-1'>
                    <Link href={`/books/${generateBookSlug(item.title)}`}>
                      <button className='w-full py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1'>
                         View Details
                      </button>
                    </Link>
                    <button
                      onClick={() =>
                        addToCart({
                          id: item.id,
                          title: item.title,
                          author: item.author,
                          price: parsePriceValue(item.price),
                          originalPrice: item.originalPrice ? parsePriceValue(item.originalPrice) : undefined,
                          image: item.image || '',
                          slug: item.slug || generateBookSlug(item.title),
                          category: item.category,
                          language: item.language,
                        })
                      }
                      className={`w-full py-1.5 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 ${
                        isInCart(item.id) ? 'bg-green-600' : 'bg-slate-800'
                      }`}
                    >
                      <PlusIcon className='w-3 h-3' />
                      {isInCart(item.id) ? 'In Cart' : 'Add to Cart'}
                    </button>
                  </div>
                  <Link href='/subscription' className='w-full'>
                    <button className='w-full py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1'>
                      <StarIcon className='w-3 h-3' />
                      Subscribe
                    </button>
                  </Link>
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
                      aria-label={`${currentlyPlaying === item.id && isPlaying ? 'Pause' : 'Play'} audio preview for ${item.title}`}
                    >
                      {currentlyPlaying === item.id && isPlaying ? (
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

                {item.price && (
                  <div className='flex items-center gap-1'>
                    <span className='text-xs font-bold text-slate-900'>{formatPrice(item.price)}</span>
                    {item.originalPrice && (
                      <span className='text-[10px] text-slate-400 line-through'>{formatPrice(item.originalPrice)}</span>
                    )}
                  </div>
                )}

                <p className='text-[10px] text-slate-400'>{item.pages ? `${item.pages} pages` : item.duration || 'Audiobook'}</p>

                <div className='mt-auto pt-1 flex flex-col gap-1.5'>
                  <div className='grid grid-cols-2 gap-1'>
                    <button
                      type='button'
                      onClick={() => handleAudiobookSelect(item)}
                      className='w-full py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1'
                    >
                       View Details
                    </button>
                    <button
                      type='button'
                      onClick={() =>
                        addToCart({
                          id: item.id,
                          title: item.title,
                          author: item.author,
                          price: parsePriceValue(item.price),
                          originalPrice: item.originalPrice ? parsePriceValue(item.originalPrice) : undefined,
                          image: item.image || '',
                          slug: item.slug || generateBookSlug(item.title),
                          category: item.category,
                          format: 'Audiobook',
                          language: item.language,
                        })
                      }
                      className={`w-full py-1.5 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 ${
                        isInCart(item.id) ? 'bg-green-600' : 'bg-slate-800'
                      }`}
                    >
                      <PlusIcon className='w-3 h-3' />
                      {isInCart(item.id) ? 'In Cart' : 'Add to Cart'}
                    </button>
                  </div>
                  <Link href='/subscription' className='w-full'>
                    <button className='w-full py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1'>
                      <StarIcon className='w-3 h-3' />
                      Subscribe
                    </button>
                  </Link>
                </div>
              </div>
            </div>
              )
        ))}
      </div>

      {/* Audio Player Bar (appears when playing audiobooks) */}
      {currentlyPlaying && isPlaying && currentPreviewItem && (
        <div className='
          fixed bottom-0 left-0 right-0 
          bg-indigo-600 backdrop-blur-sm 
          border-t border-indigo-500 
          p-3 z-50 shadow-2xl
          safe-area-inset-bottom
        '>
          <div className='max-w-7xl mx-auto'>
            <div className='flex items-center gap-3'>
              <div className='flex items-center gap-2 flex-1 min-w-0'>
                <div className='relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0'>
                  {currentPreviewItem.image ? (
                    <Image
                      src={currentPreviewItem.image}
                      alt={currentPreviewItem.title}
                      fill
                      className='object-cover'
                      sizes='40px'
                    />
                  ) : (
                    <div className='flex h-full w-full items-center justify-center bg-indigo-500 text-[10px] font-semibold text-white'>
                      Audio
                    </div>
                  )}
                </div>
                <div className='flex-1 min-w-0'>
                  <h4 className='font-semibold text-xs line-clamp-1 text-white'>
                    {currentPreviewItem.title}
                  </h4>
                  <p className='text-xs text-indigo-200 line-clamp-1'>
                    by {currentPreviewItem.author}
                  </p>
                </div>
              </div>

              <div className='flex items-center gap-2 flex-shrink-0'>
                <button
                  onClick={() => handlePlay(currentPreviewItem)}
                  className='
                    text-white hover:text-indigo-200 
                    transition-colors p-1
                    touch-manipulation
                  '
                >
                  {isPlaying ? (
                    <PauseIcon className='w-5 h-5' />
                  ) : (
                    <PlayIcon className='w-5 h-5' />
                  )}
                </button>
                <div className='text-xs text-indigo-200 whitespace-nowrap hidden xs:block'>
                  Now Playing
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
