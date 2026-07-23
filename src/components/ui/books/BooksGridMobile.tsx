'use client';

import { useEffect, useState } from 'react';
import {
  PlayIcon,
  PauseIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { generateBookSlug } from '@/utils/slugify';
import type { PublicBookListItem } from '@/types/publicBook';
import { getAudiobookHref, parsePriceValue } from '@/lib/audiobooks';
import { usePersistentAudioPlayer } from '@/contexts/PersistentAudioPlayerContext';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/services/api/authApi';
import { LibraryCardMobile } from '@/components/ui/cards/LibraryCard';

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
  const { openAuthModal, refreshUser, user } = useAuth();
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
    openAuthModal('signin', `/subscription?returnTo=${encodeURIComponent(returnTo)}`);
  };
  const handleSaveBook = async (item: PublicBookListItem, href: string) => {
    const identifier = item.slug || item.id || item._id;
    if (!identifier) return;

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
      <div className={`text-center py-12 ${className}`}>
        <p className='text-gray-600 text-sm font-medium'>No books found matching your criteria</p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className='grid grid-cols-2 gap-4 mb-2'>
        {items.map((item) => {
          const isAudiobook = item.type === 'Audiobook';
          const href = isAudiobook ? getAudiobookHref(item) : getBookHref(item);
          const free = isFreeItem(item);
          const priceLine = free ? null : (
            <>
              {hasUniquePlus ? 'Read ' : <>{formatPrice(item.price) ? `${formatPrice(item.price)} or ` : ''}</>}
              <span className='font-semibold text-[#16A34A]'>Free</span>
              {hasUniquePlus ? ' with Unique Plus or' : ' with Unique Plus'}
            </>
          );

          return (
            <LibraryCardMobile
              key={item.id}
              image={item.image}
              title={item.title}
              author={item.author}
              rating={item.rating}
              reviews={item.reviews}
              priceLine={priceLine}
              primaryLabel={free ? 'Read Free' : hasUniquePlus ? `${formatPrice(item.price) || ''} Keep Forever`.trim() : 'Read with Unique Plus'}
              primaryVariant={free ? 'free' : hasUniquePlus ? 'keep-forever' : 'unique-plus'}
              onPrimaryClick={() => handleUniquePlusAction(item, href)}
              isSaved={isItemSaved(item)}
              onSaveClick={() => void handleSaveBook(item, href)}
              saveDisabled={savingId === getItemId(item)}
              saveLabel={`Save ${item.title}`}
              coverVariant={isAudiobook ? 'audiobook' : 'book'}
              coverOverlay={isAudiobook ? (
                <div className='absolute left-1/2 top-1/2 z-[4] -translate-x-1/2 -translate-y-1/2'>
                  <button
                    type='button'
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlay(item);
                    }}
                    disabled={!item.files?.audiobook?.url}
                    className='flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-white disabled:cursor-not-allowed disabled:bg-white/60 disabled:hover:scale-100'
                    aria-label={`${currentTrack?.id === `audiobook-${item.id}` && isPlaying ? 'Pause' : 'Play'} audio preview for ${item.title}`}
                  >
                    {currentTrack?.id === `audiobook-${item.id}` && isPlaying ? (
                      <PauseIcon className='h-4 w-4 text-indigo-600' />
                    ) : (
                      <PlayIcon className='ml-0.5 h-4 w-4 text-indigo-600' />
                    )}
                  </button>
                </div>
              ) : null}
            />
          );
        })}
      </div>

    </div>
  );
}
