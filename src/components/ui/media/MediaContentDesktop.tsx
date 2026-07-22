'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  BookOpenIcon,
  BookmarkIcon as BookmarkIconOutline,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  StarIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkIconSolid, StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { Button } from '../primitives/Button';
import Image from 'next/image';
import Link from 'next/link';
import CoverImageFrame from '../books/CoverImageFrame';
import type { Category } from '@/services/api/categoriesApi';
import type { PublicBookListItem } from '@/types/publicBook';
import { generateBookSlug } from '@/utils/slugify';
import { booksApi } from '@/services/api/booksApi';
import { audiobooksApi } from '@/services/api/audiobooksApi';
import { libraryApi, type LibraryItem } from '@/services/api/libraryApi';
import { tokenStore } from '@/services/api/tokenStore';
import { authApi } from '@/services/api/authApi';

const LANDING_ITEM_LIMIT = 4;
const LANDING_COLLAPSED_ITEM_LIMIT = 5;

// Optimize Cloudinary image URLs for faster loading
const getOptimizedImageUrl = (url?: string | null, width: number = 400): string | undefined => {
  if (!url) return undefined;

  // If it's a Cloudinary URL, add optimization parameters
  if (url.includes('cloudinary.com')) {
    // Preserve the original cover framing while still optimizing delivery.
    return url.replace('/upload/', `/upload/w_${width},q_auto,f_auto,c_limit/`);
  }

  // For other URLs, return as-is (Next.js Image will handle optimization)
  return url;
};

interface BookCardProps {
  book: PublicBookListItem;
  index: number;
  href: string;
  subLabel?: string;
  libraryItems?: LibraryItem[];
  cartFormat?: string;
}

function BookCard({ book, index, href, subLabel, libraryItems = [], cartFormat }: BookCardProps) {
  const router = useRouter();
  const { openAuthModal, refreshUser, user } = useAuth();
  const [claiming, setClaiming] = useState(false);
  const [saving, setSaving] = useState(false);
  const itemKey = book.slug || book.id || book._id || generateBookSlug(book.title);
  const [savedOverride, setSavedOverride] = useState<boolean | null>(null);

  const parsePrice = (p?: string | null): number => {
    if (!p) return 0;
    return parseFloat(p.replace(/[^0-9.]/g, '')) || 0;
  };
  const formatPrice = (p?: string | null) => {
    if (!p) return null;
    // Remove any existing currency symbols and add ₹
    const cleanPrice = p.replace(/^[₹$]/, '');
    return `₹${cleanPrice}`;
  };
  const isAudiobook = book.type === 'Audiobook';
  const isFreeItem =
    subLabel?.toLowerCase() === 'free' ||
    book.componentType === 'free-summaries' ||
    parsePrice(book.price) <= 0;
  const defaultReadTarget = href.startsWith('/free-summaries/')
    ? `/read/${book.slug || book.id || book._id}`
    : isAudiobook
      ? `/audiobooks/${book.slug || book.id || book._id}/listen`
      : `/books/${book.slug || book.id || book._id}/read`;
  const serverLibraryItem = libraryItems.find((item) => {
    const matchesIdentity =
      item.slug === itemKey ||
      String(item.itemId || '') === String(book.id || book._id || '') ||
      item.title === book.title;

    if (!matchesIdentity) return false;
    if (isAudiobook) return item.itemType === 'audiobook';
    return item.itemType === 'ebook';
  });
  const claimedReadTarget = serverLibraryItem?.redirectTarget || null;
  const hasUniquePlus =
    !!user?.subscriptionPlan &&
    user.subscriptionPlan !== 'none';
  const checkoutId = book.id || book._id || itemKey;
  const checkoutSlug = book.slug || itemKey;
  const keepForeverTarget = isAudiobook
    ? `/checkout?kind=audiobook&id=${checkoutId}&slug=${checkoutSlug}&mode=buy`
    : `/checkout?id=${checkoutId}${cartFormat ? `&format=${encodeURIComponent(cartFormat)}` : ''}`;
  const displayPrice = book.price
    ? `${'\u20B9'}${book.price.replace(/^[^0-9.]*/, '').replace(/\.00$/, '')}`
    : null;
  const handleUniquePlusAction = useCallback(() => {
    if (!user) {
      const returnTo =
        typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.search}`
          : '/';
      router.push(
        `/user/auth?mode=signin&returnUrl=${encodeURIComponent(
          `/subscription?returnTo=${encodeURIComponent(returnTo)}`
        )}`
      );
      return;
    }

    router.push(hasUniquePlus ? keepForeverTarget : '/subscription');
  }, [hasUniquePlus, keepForeverTarget, router, user]);
  const isSavedByUser = useMemo(() => {
    const bookKeys = [book.slug, book.id, book._id, book.title, generateBookSlug(book.title)]
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

      return bookKeys.some((key) => savedKeys.includes(key));
    });
  }, [book.id, book._id, book.slug, book.title, user?.savedBooks]);
  const isSaved = savedOverride ?? isSavedByUser;

  const handleClaimEnroll = useCallback(async (navigateAfterClaim = true) => {
    const identifier = book.slug || book.id || book._id;
    if (!identifier) return;

    const token = tokenStore.getAccessToken();

    if (!token) {
      openAuthModal('signin', href);
      return;
    }

    setClaiming(true);
    try {
      let nextReadTarget = defaultReadTarget;
      if (href.startsWith('/free-summaries/') || book.componentType === 'free-summaries') {
        const response = await libraryApi.claim(identifier);
        nextReadTarget = `/read/${response.bookSlug || identifier}`;
      } else if (isAudiobook) {
        const response = await audiobooksApi.claim(identifier);
        nextReadTarget = response.data?.redirectTarget || `/audiobooks/${identifier}/listen`;
      } else {
        const response = await booksApi.claim(identifier);
        nextReadTarget = response.data?.redirectTarget || `/books/${identifier}/read`;
      }
      window.dispatchEvent(new Event('library:changed'));
      if (navigateAfterClaim) {
        router.push(nextReadTarget);
      }
    } catch (error: any) {
      alert(error?.message || 'Unable to claim this item');
    } finally {
      setClaiming(false);
    }
  }, [book, defaultReadTarget, href, isAudiobook, openAuthModal, router]);

  const handleSaveBook = useCallback(async () => {
    const identifier = book.slug || book.id || book._id;
    if (!identifier) return;

    const token = tokenStore.getAccessToken();

    if (!token) {
      openAuthModal('signin', href);
      return;
    }

    setSaving(true);
    try {
      const response = await authApi.toggleSavedBook(identifier);
      if (response.success) {
        setSavedOverride(response.data?.saved ?? !isSaved);
      }
      await refreshUser();
    } catch (error: any) {
      alert(error?.message || 'Unable to save this item');
    } finally {
      setSaving(false);
    }
  }, [book, href, isSaved, openAuthModal, refreshUser]);

  if (book.componentType === 'free-summaries' && subLabel?.toLowerCase() === 'free') {
    return (
      <div className='group flex h-full w-full flex-col overflow-visible rounded-lg bg-transparent px-3 py-4 transition-all duration-300 hover:-translate-y-1'>
        <Link href={href} className='relative h-[260px] w-full overflow-hidden rounded-md bg-transparent'>
          {book.image ? (
            <Image
              src={getOptimizedImageUrl(book.image, 640) || book.image}
              alt={book.title}
              fill
              sizes='(max-width: 640px) 75vw, (max-width: 1024px) 40vw, 260px'
              className='h-full w-full rounded-md object-contain object-center transition-transform duration-500 group-hover:scale-[1.02]'
              style={{
                objectFit: 'contain',
                objectPosition: 'center',
              }}
              priority={index < 3}
              loading={index < 3 ? 'eager' : 'lazy'}
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center bg-slate-100 text-sm text-slate-400'>
              No Image
            </div>
          )}
        </Link>

        <div className='flex flex-1 flex-col gap-2 px-0 pb-0 pt-3 font-dm-sans'>
          <div>
            <Link href={href}>
              <h3 className='truncate text-[16px] font-extrabold leading-snug text-[#141454] transition-colors hover:text-blue-700 font-dm-sans'>
                {book.title}
              </h3>
            </Link>
            <p className='mt-2 line-clamp-1 text-sm font-medium text-slate-400 font-dm-sans'>
              {book.author}
            </p>
          </div>

          {(book.rating ?? 0) > 0 && (
            <div className='flex items-center gap-3'>
              <StarIconSolid className='h-5 w-5 text-blue-600' />
              <span className='text-base font-extrabold text-[#141454] font-dm-sans'>{(book.rating || 0).toFixed(1)}</span>
              <span className='text-sm font-medium text-slate-400 font-dm-sans'>({book.reviews || 0})</span>
            </div>
          )}

          {displayPrice && (
            <div className='flex items-center gap-1.5'>
              <span className='text-sm font-bold text-slate-400 line-through font-dm-sans'>{displayPrice}</span>
              <span className='text-[11px] font-extrabold text-green-600 uppercase tracking-wide font-dm-sans'>Free</span>
            </div>
          )}

          <div className='mt-auto grid grid-cols-[minmax(0,1fr)_50px] gap-3'>
            <button
              type='button'
              onClick={
                claimedReadTarget
                  ? () => router.push(claimedReadTarget || defaultReadTarget)
                  : () => void handleClaimEnroll(true)
              }
              disabled={claiming}
              className='flex h-9 w-full items-center justify-center rounded-lg bg-blue-600 text-base font-extrabold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 font-dm-sans'
            >
              {claiming ? 'Claiming...' : 'Read Free'}
            </button>
            <button
              type='button'
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void handleSaveBook();
              }}
              disabled={saving}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border shadow-sm transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 font-dm-sans ${isSaved
                  ? 'border-yellow-400 bg-yellow-400 text-white hover:bg-yellow-500'
                  : 'border-slate-200 bg-white text-blue-600 hover:border-yellow-300 hover:bg-yellow-50'
                }`}
              aria-label={`Save ${book.title}`}
            >
              {isSaved ? <BookmarkIconSolid className='h-6 w-6' /> : <BookmarkIconOutline className='h-6 w-6' />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='group flex h-auto w-[210px] flex-col overflow-visible rounded-lg bg-transparent transition-all duration-[250ms] ease-out hover:-translate-y-1.5'>
      {/* Cover image */}
      <div className='relative h-[285px] w-[190px] overflow-hidden rounded-lg bg-transparent shadow-[0_12px_30px_rgba(0,0,0,0.10)] transition-shadow duration-[250ms] ease-out group-hover:shadow-[0_18px_36px_rgba(0,0,0,0.14)]'>
        <CoverImageFrame
          src={getOptimizedImageUrl(book.image, 640)}
          alt={book.title}
          sizes='190px'
          priority={index < 3}
          loading={index < 3 ? 'eager' : 'lazy'}
          quality={85}
          className='h-[285px] w-[190px] rounded-lg border-0 bg-transparent shadow-none'
          imageClassName='transition-transform duration-[250ms] ease-out'
          fit='cover'
          showBackdrop={false}
          fixedAspectRatio={2 / 3}
          variant={book.type === 'Audiobook' ? 'audiobook' : 'book'}
        >
          {/* subLabel ribbon */}
          {subLabel && (
            <div className='absolute bottom-2 left-2 z-10 flex items-center gap-1'>
              <div className='h-px w-3 bg-indigo-400' />
              <span className='text-[8px] font-bold uppercase tracking-widest text-indigo-300 drop-shadow font-dm-sans'>{subLabel}</span>
            </div>
          )}
        </CoverImageFrame>
      </div>

      {/* Details panel — always visible */}
      <div className='flex flex-col pt-3 font-dm-sans'>
        <div className='hidden'>
          <span className='min-w-0 truncate bg-white text-slate-800 px-2 py-0.5 rounded-full text-[8px] font-bold tracking-widest uppercase border border-slate-200 shadow-sm font-dm-sans'>
            {book.category}
          </span>
          {book.language && (
            <span className='shrink-0 bg-indigo-600 text-white px-2 py-0.5 rounded-full text-[8px] font-bold tracking-widest uppercase border border-indigo-500 shadow-sm font-dm-sans'>
              {book.language}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className='truncate text-[16px] font-semibold leading-tight text-[#1E1B4B] font-dm-sans'>{book.title}</h3>

        {/* Author */}
        <p className='mt-1.5 truncate text-[13px] font-normal text-[#757575] font-dm-sans'>{book.author}</p>

        {/* Star rating */}
        {(book.rating ?? 0) > 0 && (
          <div className='mt-2 flex items-center gap-2'>
            <StarIconSolid className='h-5 w-5 text-[#5146F7]' />
            <span className='text-[26px] font-bold leading-none text-[#1E1B4B] font-dm-sans'>{(book.rating || 0).toFixed(1)}</span>
            <span className='text-[14px] font-medium text-[#666666] font-dm-sans'>({book.reviews || 0})</span>
          </div>
        )}

        {/* Price */}
        {false && book.price && (
          <div className='flex items-center gap-1.5'>
            {isFreeItem ? (
              <>
                <span className='text-sm font-bold text-slate-400 line-through font-dm-sans'>{formatPrice(book.price)}</span>
                <span className='text-[11px] font-extrabold text-green-600 uppercase tracking-wide font-dm-sans'>Free</span>
              </>
            ) : (
              <span className='text-sm font-bold text-slate-900 font-dm-sans'>{formatPrice(book.price)}</span>
            )}
            {!isFreeItem && book.originalPrice && (
              <span className='text-[11px] text-slate-400 line-through font-dm-sans'>{formatPrice(book.originalPrice)}</span>
            )}
          </div>
        )}

        {/* Pages / type tag */}
        <p className='mt-2 truncate text-[13px] font-semibold text-[#1E1B4B] font-dm-sans'>
          {hasUniquePlus ? 'Read ' : <>{displayPrice ? `${displayPrice} or ` : ''}</>}
          <span className='font-semibold text-[#16A34A]'>Free</span>
          {hasUniquePlus ? ' with Unique Plus or' : ' with Unique Plus'}
          {false && book.duration ? ` · ${book.duration}` : ''}
        </p>

        {/* Action button */}
        <div className='mt-3 grid grid-cols-[158px_42px] gap-2.5'>
          <button
            onClick={handleUniquePlusAction}
            className={`flex h-10 w-[158px] items-center justify-center whitespace-nowrap rounded-[10px] text-[12px] font-semibold leading-none transition-all duration-[250ms] ease-out active:scale-95 font-dm-sans ${
              hasUniquePlus
                ? 'bg-slate-950 text-white hover:bg-slate-800'
                : 'bg-gradient-to-r from-[#5146F7] to-[#7356FF] text-white shadow-[0_10px_25px_rgba(83,70,247,0.35)] hover:brightness-110'
            }`}
          >
            {hasUniquePlus ? `${displayPrice || ''} Keep Forever`.trim() : 'Read with Unique Plus'}
          </button>
          <button
            type='button'
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void handleSaveBook();
            }}
            disabled={saving}
            className={`flex h-10 w-[42px] items-center justify-center rounded-[10px] border shadow-sm transition-all duration-[250ms] ease-out active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 font-dm-sans ${isSaved
                ? 'border-yellow-400 bg-yellow-400 text-white hover:bg-yellow-500'
                : 'border-[#E5E7EB] bg-white text-[#5146F7] hover:border-[#6D5CF6] hover:bg-violet-50'
              }`}
            aria-label={`Save ${book.title}`}
          >
            {isSaved ? <BookmarkIconSolid className='h-5 w-5' /> : <BookmarkIconOutline className='h-5 w-5' />}
          </button>
        </div>
      </div>
    </div>
  );
}

interface SectionCarouselProps {
  title: string;
  seeMoreHref: string;
  isLoading: boolean;
  items: PublicBookListItem[];
  emptyMsg: string;
  sectionKey: string;
  cardHref: (b: PublicBookListItem) => string;
  subLabel?: string;
  itemLimit?: number;
  libraryItems?: LibraryItem[];
  cartFormat?: string;
}

function SectionCarousel({
  title,
  seeMoreHref,
  isLoading,
  items,
  emptyMsg,
  sectionKey,
  cardHref,
  subLabel,
  itemLimit = LANDING_ITEM_LIMIT,
  libraryItems = [],
  cartFormat,
}: SectionCarouselProps) {
  const router = useRouter();
  const { user } = useAuth();
  const displayItems = items.slice(0, itemLimit);
  const isFreeSection = subLabel?.toLowerCase() === 'free';
  const hasUniquePlus =
    !!user?.subscriptionPlan &&
    user.subscriptionPlan !== 'none';
  const gridColumns =
    itemLimit === 6
      ? 'lg:grid-cols-3 xl:grid-cols-6'
      : itemLimit === 5
        ? 'xl:grid-cols-5'
        : 'xl:grid-cols-4';
  const gridClassName = isFreeSection
    ? `grid grid-cols-1 sm:grid-cols-2 ${gridColumns} gap-4`
    : 'grid grid-cols-1 justify-items-start gap-7 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  return (
    <section className={isFreeSection ? 'mb-10' : 'mx-auto mb-8 max-w-[1360px] bg-white px-12 py-10 font-dm-sans'}>
      <div className={isFreeSection ? 'flex items-center justify-between mb-6' : 'mb-10 flex items-center justify-between gap-8'}>
        <div className='flex-1'>
          <h3 className={isFreeSection ? 'text-2xl font-bold text-slate-950 mb-2 flex items-center font-syne tracking-tight' : 'text-[48px] font-bold leading-tight text-[#1E1B4B] font-dm-sans'}>
            {isFreeSection && <BookOpenIcon className='w-6 h-6 mr-3 text-indigo-600 shrink-0' />}
            <span>{title}</span>
          </h3>
          {isFreeSection && <div className='h-0.5 w-24 bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-full' />}
        </div>
        <Button
          onClick={() => router.push(seeMoreHref)}
          variant='outline'
          size='sm'
          className={isFreeSection
            ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 hover:border-indigo-700 hover:text-white transition-all text-xs font-dm-sans shadow-sm'
            : 'h-12 rounded-[14px] border-[1.5px] border-[#6D5CF6] bg-white px-7 text-[16px] font-semibold text-[#6D5CF6] shadow-none transition-colors duration-200 hover:bg-[#6D5CF6] hover:text-white hover:border-[#6D5CF6] font-dm-sans'}
          rightIcon={<ChevronRightIcon className={isFreeSection ? 'w-3 h-3' : 'h-4 w-4'} />}
        >
          See More
        </Button>
      </div>

      {isLoading ? (
        <div className={gridClassName}>
          {Array.from({ length: itemLimit }, (_, i) => (
            <div key={`${sectionKey}-skeleton-${i}`} className={isFreeSection ? 'aspect-[2/3] w-full bg-slate-100 animate-pulse rounded-lg border border-slate-200' : 'h-[300px] w-[200px] animate-pulse rounded-lg bg-slate-100'} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className='text-center py-10 opacity-30'>
          <p className='text-slate-400 text-sm'>{emptyMsg}</p>
        </div>
      ) : (
        <div className={gridClassName}>
          {displayItems.map((book, index) => (
            <BookCard
              key={(book as any)._id || book.id || `${sectionKey}-${index}`}
              book={book}
              index={index}
              href={cardHref(book)}
              subLabel={subLabel}
              libraryItems={libraryItems}
              cartFormat={cartFormat}
            />
          ))}
        </div>
      )}
    </section>
  );
}

interface MediaContentDesktopProps {
  newReleaseBooks: PublicBookListItem[];
  newReleaseAudiobooks: PublicBookListItem[];
  freeSummaries: PublicBookListItem[];
  trendingBooks: PublicBookListItem[];
  premiumSummaries: PublicBookListItem[];
  categories: Category[];
  availableFormats?: string[];
  allCategoryNames?: string[];
}

export default function MediaContentDesktop({
  newReleaseBooks,
  newReleaseAudiobooks,
  freeSummaries,
  trendingBooks,
  premiumSummaries,
  categories,
  availableFormats = [],
  allCategoryNames = [],
}: MediaContentDesktopProps) {
  const router = useRouter();
  const isLoadingCategories = false;
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);

  // ── Filter state ──
  const [search, setSearch] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [isFilterSidebarCollapsed, setIsFilterSidebarCollapsed] = useState(false);

  const loadLibraryItems = useCallback(async () => {
    const token = tokenStore.getAccessToken();

    if (!token) {
      setLibraryItems([]);
      return;
    }

    try {
      const response = await libraryApi.getMyLibrary();
      if (response.success) {
        setLibraryItems(response.data);
      }
    } catch {
      setLibraryItems([]);
    }
  }, []);

  useEffect(() => {
    loadLibraryItems();
    window.addEventListener('library:changed', loadLibraryItems);

    return () => {
      window.removeEventListener('library:changed', loadLibraryItems);
    };
  }, [loadLibraryItems]);

  const allBooks = useMemo(() => [
    ...newReleaseBooks,
    ...newReleaseAudiobooks,
    ...freeSummaries,
    ...trendingBooks,
    ...premiumSummaries,
  ], [newReleaseBooks, newReleaseAudiobooks, freeSummaries, trendingBooks, premiumSummaries]);

  const uniqueLanguages = useMemo(() =>
    [...new Set(allBooks.map(b => b.language).filter(Boolean))] as string[],
    [allBooks]);

  // Use DB formats from prop; fall back to formats derived from book data
  const bookDataFormats = useMemo(() =>
    [...new Set(allBooks.flatMap(b => b.format || []).filter(f => f && f !== 'Audiobook'))],
    [allBooks]);
  const uniqueFormats = availableFormats.length > 0 ? availableFormats : bookDataFormats;

  const bookDataCategories = useMemo(() =>
    [...new Set(allBooks.map(b => b.category).filter(Boolean))],
    [allBooks]);
  const uniqueCategories = allCategoryNames.length > 0 ? allCategoryNames : bookDataCategories;

  const countValues = useCallback((values: Array<string | null | undefined>) =>
    values.reduce<Record<string, number>>((acc, value) => {
      if (!value) return acc;
      acc[value] = (acc[value] ?? 0) + 1;
      return acc;
    }, {}),
    []);

  const formatCounts = useMemo(
    () => allBooks.reduce<Record<string, number>>((acc, book) => {
      (book.format || [])
        .filter(format => format && format !== 'Audiobook')
        .forEach(format => {
          acc[format] = (acc[format] ?? 0) + 1;
        });
      return acc;
    }, {}),
    [allBooks]
  );
  const typeCounts = useMemo(() => countValues(allBooks.map(book => book.type)), [allBooks, countValues]);
  const languageCounts = useMemo(() => countValues(allBooks.map(book => book.language)), [allBooks, countValues]);
  const categoryCounts = useMemo(() => countValues(allBooks.map(book => book.category)), [allBooks, countValues]);

  const CountBadge = ({ count }: { count: number }) => (
    <span className='ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600'>
      {count}
    </span>
  );

  const hasFilters = search || selectedTypes.length || selectedLanguages.length || selectedCategories.length || selectedFormats.length;
  const activeFilterCount =
    (search ? 1 : 0) +
    selectedTypes.length +
    selectedLanguages.length +
    selectedCategories.length +
    selectedFormats.length;

  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
    setter(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const filterBooks = (books: PublicBookListItem[]) => {
    if (!hasFilters) return books;
    return books.filter(book => {
      if (search) {
        const q = search.toLowerCase();
        if (!book.title.toLowerCase().includes(q) && !book.author.toLowerCase().includes(q)) return false;
      }
      if (selectedTypes.length && !selectedTypes.includes(book.type)) return false;
      if (selectedLanguages.length && !selectedLanguages.includes(book.language || '')) return false;
      if (selectedCategories.length && !selectedCategories.includes(book.category)) return false;
      // Format filter only matches non-Audiobook formats (Audiobook is covered by Type)
      if (selectedFormats.length && !book.format?.some(f => f !== 'Audiobook' && selectedFormats.includes(f))) return false;
      return true;
    });
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedTypes([]);
    setSelectedLanguages([]);
    setSelectedCategories([]);
    setSelectedFormats([]);
  };

  const filteredNewReleaseBooks = filterBooks(newReleaseBooks);
  const filteredNewReleaseAudiobooks = filterBooks(newReleaseAudiobooks);
  const filteredFreeSummaries = filterBooks(freeSummaries);
  const filteredTrendingBooks = filterBooks(trendingBooks);
  const filteredPremiumSummaries = filterBooks(premiumSummaries);
  const landingItemLimit = isFilterSidebarCollapsed
    ? LANDING_COLLAPSED_ITEM_LIMIT
    : LANDING_ITEM_LIMIT;
  const selectedCartFormat = selectedFormats.length === 1 ? selectedFormats[0] : undefined;

  return (
    <>
      {/* Background Elements shared */}
      <section className='py-2 bg-gradient-to-br from-white via-slate-50 to-indigo-50/30 relative overflow-hidden'>
        <div className='absolute inset-0 opacity-20 pointer-events-none'>
          <div className='absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20' />
          <div className='absolute top-20 right-10 w-32 h-32 bg-indigo-200/20 rounded-full blur-3xl animate-pulse' />
          <div className='absolute bottom-20 left-10 w-40 h-40 bg-purple-200/15 rounded-full blur-3xl animate-pulse delay-1000' />
        </div>

        {filteredFreeSummaries.length > 0 && (
          <div id='free-summaries-section' className='relative z-10 w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-white px-3 pt-4 pb-4 lg:px-5 lg:pt-8 lg:pb-6'>
            <div className='mx-auto max-w-[1300px]'>
              <SectionCarousel
                title='Free Summaries'
                seeMoreHref='/free-summaries'
                isLoading={false}
                items={filteredFreeSummaries}
                emptyMsg='No free summaries'
                sectionKey='free'
                itemLimit={6}
                cartFormat={selectedCartFormat}
                cardHref={(b) => {
                  const baseUrl = `/books/${b.slug || generateBookSlug(b.title)}`;
                  if (selectedFormats.length === 1) {
                    return `${baseUrl}?format=${encodeURIComponent(selectedFormats[0])}`;
                  }
                  return baseUrl;
                }}
                subLabel='Free'
              />
            </div>
          </div>
        )}

        <div className='relative z-10 mt-6 w-full px-3 lg:px-5'>
          <div className='mx-auto max-w-[1300px]'>
            <div className='flex gap-6'>

              {/* ── Left Filter Sidebar ── */}
              <aside
                className={`flex-shrink-0 sticky top-24 self-start transition-all duration-300 ${isFilterSidebarCollapsed ? '-mt-24 w-12' : 'w-49'
                  }`}
              >
                {isFilterSidebarCollapsed ? (
                  <button
                    onClick={() => setIsFilterSidebarCollapsed(false)}
                    className='flex h-10 w-10 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-100 hover:text-blue-700'
                    type='button'
                    aria-label='Show filters'
                    title='Show filters'
                  >
                    <FunnelIcon className='h-5 w-5' />
                  </button>
                ) : (
                  <>
                    {/* Format quick-filter (horizontal chips above sidebar panel) */}
                    {uniqueFormats.length > 0 && (
                      <div>
                        <p className='text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2'>Format</p>
                        <div className='flex flex-nowrap gap-1.5'>
                          {uniqueFormats.map(fmt => (
                            <button
                              key={fmt}
                              onClick={() => toggle(setSelectedFormats, fmt)}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all whitespace-nowrap shadow-sm ${selectedFormats.includes(fmt)
                                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-blue-500/20'
                                  : 'bg-white text-slate-700 border-blue-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700'
                                }`}
                            >
                              <span>{fmt}</span>
                              <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] ${selectedFormats.includes(fmt)
                                  ? 'bg-white/20 text-white'
                                  : 'bg-blue-50 text-blue-700'
                                }`}>
                                {formatCounts[fmt] ?? 0}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className='mt-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden'>
                      {/* Header */}
                      <div className='flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50'>
                        <div className='flex items-center gap-2'>
                          <FunnelIcon className='h-4 w-4 text-slate-500' />
                          <span className='text-xs font-bold text-slate-900 uppercase tracking-wider'>Filters</span>
                        </div>
                        <div className='flex items-center gap-1.5'>
                          {hasFilters ? (
                            <button
                              onClick={clearFilters}
                              className='inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-600 transition-colors hover:border-blue-200 hover:bg-blue-100 hover:text-blue-700'
                              type='button'
                              title={`Clear ${activeFilterCount} active filter${activeFilterCount === 1 ? '' : 's'}`}
                            >
                              <XMarkIcon className='w-3 h-3' /> All Clear
                            </button>
                          ) : (
                            <span className='rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700'>
                              All Clear
                            </span>
                          )}
                          <button
                            onClick={() => setIsFilterSidebarCollapsed(true)}
                            className='inline-flex h-7 w-7 items-center justify-center rounded-md border border-blue-100 bg-blue-50 text-blue-600 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-100 hover:text-blue-700'
                            type='button'
                            aria-label='Hide filters'
                            title='Hide filters'
                          >
                            <ChevronLeftIcon className='h-4 w-4' />
                          </button>
                        </div>
                      </div>

                      <div className='p-4 space-y-5 max-h-[calc(100vh-140px)] overflow-y-auto'>

                        {/* Search */}
                        <div>
                          <p className='text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2'>Search</p>
                          <div className='flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus-within:border-indigo-400 transition-colors'>
                            <MagnifyingGlassIcon className='w-3.5 h-3.5 text-slate-500 flex-shrink-0' />
                            <input
                              type='text'
                              value={search}
                              onChange={e => setSearch(e.target.value)}
                              placeholder='Title, author…'
                              className='flex-1 text-xs bg-transparent outline-none text-slate-800 placeholder-slate-500 min-w-0'
                            />
                            {search && (
                              <button onClick={() => setSearch('')}><XMarkIcon className='w-3 h-3 text-slate-500 hover:text-slate-700' /></button>
                            )}
                          </div>
                        </div>

                        <div className='h-px bg-slate-100' />

                        {/* Type */}
                        <div>
                          <p className='text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2'>Type</p>
                          {['Books', 'Audiobook'].map(t => (
                            <label key={t} className='flex items-center gap-2 py-1 cursor-pointer'>
                              <input
                                type='checkbox'
                                checked={selectedTypes.includes(t)}
                                onChange={() => toggle(setSelectedTypes, t)}
                                className='w-3.5 h-3.5 rounded accent-indigo-600 cursor-pointer'
                              />
                              <span className='text-xs text-slate-800'>{t}</span>
                              <CountBadge count={typeCounts[t] ?? 0} />
                            </label>
                          ))}
                        </div>

                        {uniqueLanguages.length > 0 && (
                          <>
                            <div className='h-px bg-slate-100' />
                            {/* Language */}
                            <div>
                              <p className='text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2'>Language</p>
                              {uniqueLanguages.map(lang => (
                                <label key={lang} className='flex items-center gap-2 py-1 cursor-pointer'>
                                  <input
                                    type='checkbox'
                                    checked={selectedLanguages.includes(lang)}
                                    onChange={() => toggle(setSelectedLanguages, lang)}
                                    className='w-3.5 h-3.5 rounded accent-indigo-600 cursor-pointer'
                                  />
                                  <span className='text-xs text-slate-800'>{lang}</span>
                                  <CountBadge count={languageCounts[lang] ?? 0} />
                                </label>
                              ))}
                            </div>
                          </>
                        )}

                        {uniqueCategories.length > 0 && (
                          <>
                            <div className='h-px bg-slate-100' />
                            {/* Category */}
                            <div>
                              <p className='text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2'>Category</p>
                              {uniqueCategories.map(cat => (
                                <label key={cat} className='flex items-center gap-2 py-1 cursor-pointer'>
                                  <input
                                    type='checkbox'
                                    checked={selectedCategories.includes(cat)}
                                    onChange={() => toggle(setSelectedCategories, cat)}
                                    className='w-3.5 h-3.5 rounded accent-indigo-600 cursor-pointer'
                                  />
                                  <span className='text-xs text-slate-800 leading-tight'>{cat}</span>
                                  <CountBadge count={categoryCounts[cat] ?? 0} />
                                </label>
                              ))}
                            </div>
                          </>
                        )}

                      </div>
                    </div>
                  </>
                )}
              </aside>

              {/* ── Main content ── */}
              <div className='flex-1 min-w-0'>
                {filteredNewReleaseBooks.length > 0 && (
                  <SectionCarousel
                    title='New Release Books'
                    seeMoreHref='/books'
                    isLoading={false}
                    items={filteredNewReleaseBooks}
                    emptyMsg='No new release books available'
                    sectionKey='new-release-books'
                    itemLimit={landingItemLimit}
                    cartFormat={selectedCartFormat}
                    cardHref={(b) => {
                      const baseUrl = `/books/${b.slug || generateBookSlug(b.title)}`;
                      // If exactly one format is selected, include it as a URL parameter
                      if (selectedFormats.length === 1) {
                        return `${baseUrl}?format=${encodeURIComponent(selectedFormats[0])}`;
                      }
                      return baseUrl;
                    }}
                  />
                )}
                {filteredNewReleaseAudiobooks.length > 0 && (
                  <SectionCarousel
                    title='New Release Audiobooks'
                    seeMoreHref='/audiobooks'
                    isLoading={false}
                    items={filteredNewReleaseAudiobooks}
                    emptyMsg='No new release audiobooks available'
                    sectionKey='new-release-audiobooks'
                    itemLimit={landingItemLimit}
                    cardHref={(b) => `/audiobooks/${b.slug || generateBookSlug(b.title)}`}
                  />
                )}
                {filteredTrendingBooks.length > 0 && (
                  <SectionCarousel
                    title='Trending Books'
                    seeMoreHref='/trending-books'
                    isLoading={false}
                    items={filteredTrendingBooks}
                    emptyMsg='No trending books'
                    sectionKey='trending'
                    itemLimit={landingItemLimit}
                    cartFormat={selectedCartFormat}
                    cardHref={(b) => {
                      const baseUrl = `/books/${b.slug || generateBookSlug(b.title)}`;
                      // If exactly one format is selected, include it as a URL parameter
                      if (selectedFormats.length === 1) {
                        return `${baseUrl}?format=${encodeURIComponent(selectedFormats[0])}`;
                      }
                      return baseUrl;
                    }}
                    subLabel='Trending'
                    libraryItems={libraryItems}
                  />
                )}
                {filteredPremiumSummaries.length > 0 && (
                  <SectionCarousel
                    title='Premium Content'
                    seeMoreHref='/premium-summaries'
                    isLoading={false}
                    items={filteredPremiumSummaries}
                    emptyMsg='No premium content'
                    sectionKey='premium'
                    itemLimit={landingItemLimit}
                    cartFormat={selectedCartFormat}
                    cardHref={(b) => {
                      const baseUrl = `/books/${b.slug || generateBookSlug(b.title)}`;
                      // If exactly one format is selected, include it as a URL parameter
                      if (selectedFormats.length === 1) {
                        return `${baseUrl}?format=${encodeURIComponent(selectedFormats[0])}`;
                      }
                      return baseUrl;
                    }}
                    subLabel='Premium'
                  />
                )}

              </div>{/* end flex-1 main content */}
            </div>{/* end flex gap-6 */}

            <div className='relative mx-auto mt-8 mb-4 max-w-[1300px] p-8 lg:p-10 bg-[#0B0F1A] rounded-[40px] overflow-hidden border border-white/5'>
              <div className='absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none' />
              <div className='absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none' />

              <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10'>
                <div className='lg:col-span-2 lg:sticky lg:top-24'>
                  <div className='flex flex-col items-center pt-4'>
                    <div className='bg-gradient-to-r from-[#FF8C7E] to-[#FF4E74] text-white text-[9px] uppercase font-bold tracking-widest px-3 py-1 rounded-full mb-6 shadow-lg shadow-pink-500/20'>
                      ✦ book of the day
                    </div>
                    <div className='font-syne text-center mb-6'>
                      <div className='text-[70px] font-extrabold text-white leading-[0.8] mb-1 tracking-tighter'>21</div>
                      <div className='text-[24px] font-bold text-[#00E5BC] tracking-[0.2em] leading-none mb-1'>DAYS</div>
                      <div className='text-[10px] font-medium text-white/30 tracking-[0.4em] uppercase'>Challenge</div>
                    </div>
                    <button
                      onClick={() => {
                        const element = document.getElementById('free-summaries-section');
                        element?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className='group relative flex items-center gap-2 px-7 py-3 bg-white text-black text-[12px] font-bold rounded-full transition-all hover:scale-105 hover:shadow-xl font-dm-sans'
                    >
                      <span>Start Now</span>
                      <ChevronRightIcon className='w-3.5 h-3.5 transition-transform group-hover:translate-x-1' />
                    </button>
                  </div>
                </div>

                <div className='lg:col-span-10'>
                  <div className='flex items-center gap-4 mb-7'>
                    <span className='text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] font-syne'>Browse Categories</span>
                    <div className='h-px flex-1 bg-white/5'></div>
                  </div>

                  <div className='grid grid-cols-2 lg:grid-cols-4 gap-3.5'>
                    {isLoadingCategories ? (
                      Array.from({ length: 15 }, (_, i) => <div key={i} className='h-[75px] bg-white/5 animate-pulse rounded-2xl border border-white/5' />)
                    ) : (
                      <>
                        {categories.map((category, idx) => {
                          const icons = ['🧠', '📈', '⚡', '🔥', '🔬', '💼', '👑', '🎯', '🏆', '📡', '🎓', '💬', '⭐'];
                          const colors = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#6366F1', '#EC4899', '#F97316', '#84CC16', '#3B82F6', '#A855F7', '#F43F5E', '#14B8A6'];
                          return (
                            <div key={category._id || category.id} className='col-span-1 group'>
                              <button onClick={() => router.push(`/books?category=${category.name}`)} className='w-full min-h-[60px] h-full relative flex items-center gap-3 p-2.5 rounded-[18px] bg-[#1A1F2E] border border-white/5 transition-all hover:bg-[#23293D] hover:border-white/15 hover:scale-[1.01] overflow-hidden'>
                                <div className='w-8 h-8 shrink-0 rounded-[10px] flex items-center justify-center text-base transition-transform group-hover:scale-110' style={{ backgroundColor: `${colors[idx % colors.length]}15`, color: colors[idx % colors.length] }}>
                                  {icons[idx % icons.length]}
                                </div>
                                <div className='flex-1 flex flex-col justify-center text-left min-w-0'>
                                  <div className='flex items-center flex-wrap gap-1.5 mb-0.5'>
                                    <span className='font-syne font-bold text-[14px] text-white truncate'>{category.name}</span>
                                    {idx === 0 && <span className='px-1.5 py-0.5 rounded-full bg-[#FF4E74]/20 text-[#FF4E74] text-[6.5px] font-black uppercase tracking-widest'>HOT</span>}
                                  </div>
                                  <div className='font-dm-sans text-white/20 text-[10px]'>{Math.floor(Math.random() * 400 + 50)}+ summaries</div>
                                </div>
                                <div className='shrink-0 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 bg-white/5 p-1 rounded-full'>
                                  <ChevronRightIcon className='w-2.5 h-2.5 text-white/50' />
                                </div>
                                <div className='absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity pointer-events-none' style={{ background: `radial-gradient(circle at center, ${colors[idx % colors.length]}, transparent 70%)` }} />
                              </button>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>
              </div>{/* end categories panel content */}
            </div>{/* end dark section */}
          </div>
        </div>{/* end max-w-7xl */}
      </section>
    </>
  );
}

