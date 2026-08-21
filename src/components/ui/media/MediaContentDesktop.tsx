'use client';

import { useRouter } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
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
import { LibraryCardDesktop } from '@/components/ui/cards/LibraryCard';
import { hasActiveSubscription } from '@/lib/subscription';
import { isPurchasedLibraryItem } from '@/hooks/useOwnedLibraryAccess';

const LANDING_ITEM_LIMIT = 5;
const LANDING_COLLAPSED_ITEM_LIMIT = 6;

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
  const hasKeepForeverAccess = !isAudiobook && libraryItems.some((item) => isPurchasedLibraryItem(item, book, 'ebook'));
  const hasUniquePlus = hasActiveSubscription(user);
  const displayPrice = book.price
    ? `${'\u20B9'}${book.price.replace(/^[^0-9.]*/, '').replace(/\.00$/, '')}`
    : null;
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
  const navigateFromHomeFreeSummary = () => {
    window.sessionStorage.setItem('freeSummaryDetailBackHref', '/');
    router.push(href);
  };

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
      let shouldDispatchLibraryChange = true;
      if (href.startsWith('/free-summaries/') || book.componentType === 'free-summaries') {
        const response = await libraryApi.claim(identifier);
        nextReadTarget = `/read/${response.bookSlug || identifier}`;
        shouldDispatchLibraryChange = false;
      } else if (isAudiobook) {
        const response = await audiobooksApi.claim(identifier);
        nextReadTarget = response.data?.redirectTarget || `/audiobooks/${identifier}/listen`;
      } else {
        const response = await booksApi.claim(identifier);
        nextReadTarget = response.data?.redirectTarget || `/books/${identifier}/read`;
      }
      if (shouldDispatchLibraryChange) {
        window.dispatchEvent(new Event('library:changed'));
      }
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

  if ((book.componentType === 'free-summaries' || href.startsWith('/free-summaries/')) && subLabel?.toLowerCase() === 'free') {
    return (
      <LibraryCardDesktop
        image={book.image}
        title={book.title}
        author={book.author}
        rating={book.rating}
        reviews={book.reviews}
        primaryLabel='Read Free'
        primaryVariant='free'
        onPrimaryClick={navigateFromHomeFreeSummary}
        onCoverClick={navigateFromHomeFreeSummary}
        isSaved={isSaved}
        onSaveClick={() => void handleSaveBook()}
        saveDisabled={saving}
        saveLabel={`Save ${book.title}`}
        coverVariant='book'
        priority={index < 3}
        loading={index < 3 ? 'eager' : 'lazy'}
      />
    );
  }

  return (
    <LibraryCardDesktop
      image={book.image}
      title={book.title}
      author={book.author}
      rating={book.rating}
      reviews={book.reviews}
      priceLine={
        isFreeItem ? null : hasKeepForeverAccess ? (
          <span className='font-semibold text-[#16A34A]'>Owned</span>
        ) : (
          <>
            {hasUniquePlus ? 'Read ' : <>{displayPrice ? `${displayPrice} or ` : ''}</>}
            <span className='font-semibold text-[#16A34A]'>Free</span>
            {hasUniquePlus ? ' with Unique Plus or' : ' with Unique Plus'}
          </>
        )
      }
      primaryLabel={hasKeepForeverAccess ? 'Read Now' : isFreeItem ? 'Read Free' : hasUniquePlus ? `${displayPrice || ''} Keep Forever`.trim() : 'Read with Unique Plus'}
      primaryVariant={hasKeepForeverAccess ? 'free' : isFreeItem ? 'free' : hasUniquePlus ? 'keep-forever' : 'unique-plus'}
      onPrimaryClick={() => router.push(href)}
      onCoverClick={() => router.push(href)}
      isSaved={isSaved}
      onSaveClick={() => void handleSaveBook()}
      saveDisabled={saving}
      saveLabel={`Save ${book.title}`}
      coverVariant={book.type === 'Audiobook' ? 'audiobook' : 'book'}
      priority={index < 3}
      loading={index < 3 ? 'eager' : 'lazy'}
    />
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
  headerLeading?: ReactNode;
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
  headerLeading,
}: SectionCarouselProps) {
  const router = useRouter();
  const { user } = useAuth();
  const displayItems = items.slice(0, itemLimit);
  const isFreeSection = subLabel?.toLowerCase() === 'free';
  const hasUniquePlus = hasActiveSubscription(user);
  const gridClassName = isFreeSection
    ? 'grid w-full grid-cols-7 items-start gap-x-4 gap-y-8'
    : 'grid w-full grid-cols-[repeat(auto-fit,150px)] items-start justify-between gap-x-5 gap-y-10 overflow-hidden';

  return (
    <section className={isFreeSection ? 'mb-10' : 'mx-auto mb-8 max-w-[1360px] px-8 pb-4 pt-0 font-dm-sans'}>
      <div className={isFreeSection ? 'flex items-center justify-between mb-6' : 'relative mb-6 flex items-center justify-between gap-8'}>
        <div className={isFreeSection ? 'flex-1' : 'min-w-0 flex-1'}>
          {!isFreeSection && headerLeading ? (
            <div className='absolute left-[-56px] top-1/2 -translate-y-1/2'>
              {headerLeading}
            </div>
          ) : null}
          <h3 className={isFreeSection ? 'text-2xl font-bold text-slate-950 mb-2 flex items-center font-syne tracking-tight' : 'text-[26px] font-bold leading-tight text-[#1E1B4B] font-dm-sans'}>
            {isFreeSection && <BookOpenIcon className='w-6 h-6 mr-3 text-indigo-600 shrink-0' />}
            <span>{title}</span>
          </h3>
          {isFreeSection && <div className='h-0.5 w-24 bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-full' />}
        </div>
        <Button
          onClick={() => router.push(seeMoreHref)}
          variant='outline'
          size='sm'
          className='bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 hover:border-indigo-700 hover:text-white transition-all text-xs font-dm-sans shadow-sm'
          rightIcon={<ChevronRightIcon className='w-3 h-3' />}
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
  categoryContentCounts?: Record<string, number>;
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
  categoryContentCounts = {},
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
  const filterBoundaryRef = useRef<HTMLDivElement>(null);
  const premiumContentRef = useRef<HTMLDivElement>(null);
  const bookOfDayRef = useRef<HTMLDivElement>(null);
  const filterSidebarRef = useRef<HTMLElement>(null);
  const [fixedFilterStyle, setFixedFilterStyle] = useState<CSSProperties | undefined>();

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

  useEffect(() => {
    const updateFilterPosition = () => {
      if (isFilterSidebarCollapsed) {
        setFixedFilterStyle(undefined);
        return;
      }

      const boundary = filterBoundaryRef.current;
      const bookOfDay = bookOfDayRef.current;
      const sidebar = filterSidebarRef.current;

      if (!boundary || !sidebar) {
        setFixedFilterStyle(undefined);
        return;
      }

      const topOffset = 112;
      const boundaryRect = boundary.getBoundingClientRect();
      const bookOfDayRect = bookOfDay?.getBoundingClientRect();
      const sidebarRect = sidebar.getBoundingClientRect();
      const isBeforeBookOfDay =
        !bookOfDayRect || bookOfDayRect.top > window.innerHeight;
      const isInsideFilterSections =
        boundaryRect.top <= topOffset &&
        isBeforeBookOfDay;

      if (!isInsideFilterSections) {
        setFixedFilterStyle(
          bookOfDayRect && bookOfDayRect.top <= window.innerHeight
            ? { display: 'none' }
            : undefined
        );
        return;
      }

      setFixedFilterStyle({
        position: 'fixed',
        top: topOffset,
        left: sidebarRect.left,
        width: sidebarRect.width || 300,
        zIndex: 20,
      });
    };

    updateFilterPosition();
    window.addEventListener('scroll', updateFilterPosition, { passive: true });
    window.addEventListener('resize', updateFilterPosition);

    return () => {
      window.removeEventListener('scroll', updateFilterPosition);
      window.removeEventListener('resize', updateFilterPosition);
    };
  }, [isFilterSidebarCollapsed]);

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
      <section className=' relative overflow-hidden'>
        <div className='absolute inset-0 hidden opacity-20 pointer-events-none'>
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
                itemLimit={7}
                cartFormat={selectedCartFormat}
                cardHref={(b) => {
                  return `/free-summaries/${b.slug || generateBookSlug(b.title)}`;
                }}
                subLabel='Free'
              />
            </div>
          </div>
        )}

        <div className='relative z-10 w-full bg-gradient-to-r from-blue-100/80 via-indigo-100/70 to-purple-100/60 px-3 py-6 lg:px-5'>
          <div className='mx-auto max-w-[1300px]'>
            <div ref={filterBoundaryRef} className='flex items-start gap-6'>

              {/* ── Left Filter Sidebar ── */}
              <aside
                ref={filterSidebarRef}
                className={`flex-shrink-0 self-start transition-all duration-300 ${isFilterSidebarCollapsed ? 'hidden' : 'w-[300px]'
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
                    {/* {uniqueFormats.length > 0 && (
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
                    )} */}

                    <div
                      className='mt-3 flex w-full max-h-[calc(100vh-128px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm'
                      style={fixedFilterStyle}
                    >
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

                      <div className='min-h-0 flex-1 space-y-5 overflow-y-auto p-4'>

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
                    headerLeading={isFilterSidebarCollapsed ? (
                      <button
                        onClick={() => setIsFilterSidebarCollapsed(false)}
                        className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-100 hover:text-blue-700'
                        type='button'
                        aria-label='Show filters'
                        title='Show filters'
                      >
                        <FunnelIcon className='h-5 w-5' />
                      </button>
                    ) : null}
                    cardHref={(b) => {
                      const baseUrl = `/books/${b.slug || generateBookSlug(b.title)}`;
                      // If exactly one format is selected, include it as a URL parameter
                      if (selectedFormats.length === 1) {
                        return `${baseUrl}?format=${encodeURIComponent(selectedFormats[0])}`;
                      }
                      return baseUrl;
                    }}
                    libraryItems={libraryItems}
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
                    title='Trending E-Books'
                    seeMoreHref='/trending-books'
                    isLoading={false}
                    items={filteredTrendingBooks}
                    emptyMsg='No trending e-books available'
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
                  <div ref={premiumContentRef}>
                    <SectionCarousel
                      title='Premium E-Books'
                      seeMoreHref='/premium-summaries'
                      isLoading={false}
                      items={filteredPremiumSummaries}
                      emptyMsg='No premium e-books available'
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
                      libraryItems={libraryItems}
                    />
                  </div>
                )}

              </div>{/* end flex-1 main content */}
            </div>{/* end flex gap-6 */}

            <div ref={bookOfDayRef} className='relative mx-auto mt-8 mb-4 max-w-[1300px] p-8 lg:p-10 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-[40px] overflow-hidden border border-blue-100'>
              <div className='absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.9),transparent_35%),radial-gradient(circle_at_75%_30%,rgba(99,102,241,0.13),transparent_32%)] pointer-events-none' />

              <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10'>
                <div className='lg:col-span-2 lg:sticky lg:top-24'>
                  <div className='flex flex-col items-center pt-4'>
                    <div className='bg-gradient-to-r from-blue-700 to-blue-400 text-white text-[9px] uppercase font-bold tracking-widest px-3 py-1 rounded-full mb-6 shadow-lg shadow-blue-500/20'>
                      ✦ book of the day
                    </div>
                    <div className='font-syne text-center mb-6'>
                      <div className='text-[70px] font-extrabold text-[#172554] leading-[0.8] mb-1 tracking-tighter'>21</div>
                      <div className='text-[24px] font-bold text-blue-600 tracking-[0.2em] leading-none mb-1'>DAYS</div>
                      <div className='text-[10px] font-medium text-slate-500 tracking-[0.4em] uppercase'>Challenge</div>
                    </div>
                    <button
                      onClick={() => {
                        const element = document.getElementById('free-summaries-section');
                        element?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className='group relative flex items-center gap-2 px-7 py-3 bg-blue-500 text-white text-[12px] font-bold rounded-full transition-all hover:scale-105 hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-500/25 font-dm-sans'
                    >
                      <span>Start Now</span>
                      <ChevronRightIcon className='w-3.5 h-3.5 transition-transform group-hover:translate-x-1' />
                    </button>
                  </div>
                </div>

                <div className='lg:col-span-10'>
                  <div className='flex items-center gap-4 mb-7'>
                    <span className='text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] font-syne'>Browse Categories</span>
                    <div className='h-px flex-1 bg-blue-200/70'></div>
                  </div>

                  <div className='grid grid-cols-2 lg:grid-cols-4 gap-3.5'>
                    {isLoadingCategories ? (
                      Array.from({ length: 15 }, (_, i) => <div key={i} className='h-[75px] bg-white/70 animate-pulse rounded-2xl border border-blue-100' />)
                    ) : (
                      <>
                        {categories.map((category, idx) => {
                          const icons = ['🧠', '📈', '⚡', '🔥', '🔬', '💼', '👑', '🎯', '🏆', '📡', '🎓', '💬', '⭐'];
                          const colors = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#6366F1', '#EC4899', '#F97316', '#84CC16', '#3B82F6', '#A855F7', '#F43F5E', '#14B8A6'];
                          return (
                            <div key={category._id || category.id} className='col-span-1 group'>
                              <button onClick={() => router.push(`/books?category=${category.name}`)} className='w-full min-h-[60px] h-full relative flex items-center gap-3 p-2.5 rounded-[18px] bg-white/75 border border-blue-100 transition-all hover:bg-white hover:border-blue-200 hover:scale-[1.01] overflow-hidden'>
                                <div className='w-8 h-8 shrink-0 rounded-[10px] flex items-center justify-center text-base transition-transform group-hover:scale-110' style={{ backgroundColor: `${colors[idx % colors.length]}15`, color: colors[idx % colors.length] }}>
                                  {icons[idx % icons.length]}
                                </div>
                                <div className='flex-1 flex flex-col justify-center text-left min-w-0'>
                                  <div className='flex items-center flex-wrap gap-1.5 mb-0.5'>
                                    <span className='font-syne font-bold text-[14px] text-slate-900 truncate'>{category.name}</span>
                                    {idx === 0 && <span className='px-1.5 py-0.5 rounded-full bg-[#FF4E74]/20 text-[#FF4E74] text-[6.5px] font-black uppercase tracking-widest'>HOT</span>}
                                  </div>
                                  <div className='font-dm-sans text-slate-500 text-[10px]'>{categoryContentCounts[category.name] ?? categoryCounts[category.name] ?? category.bookCount ?? 0} summaries</div>
                                </div>
                                <div className='shrink-0 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 bg-blue-50 p-1 rounded-full'>
                                  <ChevronRightIcon className='w-2.5 h-2.5 text-blue-500' />
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

