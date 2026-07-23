'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpenIcon,
  BookmarkIcon,
  ChevronRightIcon,
  HandRaisedIcon,
  ArrowRightIcon,
  FunnelIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { Button } from '../primitives/Button';
import Image from 'next/image';
import Link from 'next/link';
import CoverImageFrame from '../books/CoverImageFrame';
import { generateBookSlug } from '@/utils/slugify';
import type { Category } from '@/services/api/categoriesApi';
import type { PublicBookListItem } from '@/types/publicBook';
import { useAuth } from '@/contexts/AuthContext';
import { libraryApi } from '@/services/api/libraryApi';
import { tokenStore } from '@/services/api/tokenStore';

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

// Local Book interface removed - using type from @/services/api/booksApi

interface MobileShowcaseCardProps {
  item: PublicBookListItem;
  index: number;
  meta: string;
  href: string;
}

function MobileShowcaseCard({ item, index, meta, href }: MobileShowcaseCardProps) {
  const router = useRouter();
  const { openAuthModal, user } = useAuth();
  const [claiming, setClaiming] = useState(false);
  const isFreeItem =
    item.componentType === 'free-summaries' ||
    Number.parseFloat(String(item.price || '0').replace(/[^0-9.]/g, '')) <= 0;
  const formatPrice = (value?: string | null) => {
    if (!value) return null;
    return `₹${String(value).replace(/^[^0-9.]*/, '').replace(/\.00$/, '')}`;
  };
  const displayPrice = formatPrice(item.price);
  const hasUniquePlus =
    !!user?.subscriptionPlan &&
    user.subscriptionPlan !== 'none';
  const handleUniquePlusAction = () => {
    if (!user) {
      const returnTo =
        typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.search}`
          : '/';
      openAuthModal('signin', `/subscription?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }

    router.push(hasUniquePlus ? href : '/subscription');
  };
  const handleFreeSummaryClaim = async (navigateAfterClaim: boolean) => {
    const identifier = item.slug || item.id || item._id;
    if (!identifier) return;

    const token = tokenStore.getAccessToken();

    if (!token) {
      openAuthModal('signin', href);
      return;
    }

    setClaiming(true);
    try {
      const response = await libraryApi.claim(identifier);
      const nextReadTarget = `/read/${response.bookSlug || identifier}`;
      window.dispatchEvent(new Event('library:changed'));
      if (navigateAfterClaim) {
        router.push(nextReadTarget);
      }
    } catch (error: any) {
      alert(error?.message || 'Unable to claim this item');
    } finally {
      setClaiming(false);
    }
  };

  if (item.componentType === 'free-summaries') {
    return (
      <div
        className='group flex h-auto w-full flex-col overflow-visible rounded-lg bg-transparent transition-all duration-[250ms] ease-out'
        style={{
          animationDelay: `${index * 100}ms`,
        }}
      >
        <Link href={href} className='relative h-[170px] w-full overflow-hidden rounded-lg bg-transparent shadow-[0_10px_24px_rgba(0,0,0,0.10)]'>
          {item.image ? (
            <Image
              src={item.image}
              alt={item.title}
              fill
              sizes='(max-width: 768px) 50vw, 200px'
              priority={index === 0}
              loading={index === 0 ? 'eager' : 'lazy'}
              className='object-contain object-center p-2 transition-transform duration-300'
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center'>
              <span className='text-xs text-slate-400'>No Image</span>
            </div>
          )}
        </Link>

        <div className='flex flex-col pt-2 font-dm-sans'>
          <div>
            <Link href={href}>
              <h3 className='truncate text-[13px] font-semibold leading-tight text-[#1E1B4B] font-dm-sans'>
                {item.title}
              </h3>
            </Link>
            <p className='mt-1 truncate text-[11px] font-normal text-[#757575] font-dm-sans'>
              {item.author}
            </p>
          </div>

          {(item.rating ?? 0) > 0 && (
            <div className='mt-1.5 flex items-center gap-1.5'>
              <StarIconSolid className='h-4 w-4 text-[#5146F7]' />
              <span className='text-[20px] font-bold leading-none text-[#1E1B4B] font-dm-sans'>{(item.rating || 0).toFixed(1)}</span>
              <span className='text-[11px] font-medium text-[#666666] font-dm-sans'>({item.reviews || 0})</span>
            </div>
          )}

          <div className='mt-2 grid grid-cols-[minmax(0,1fr)_34px] gap-2'>
            <button
              type='button'
              onClick={() => router.push(href)}
              className='flex h-9 w-full items-center justify-center rounded-[10px] bg-blue-600 text-[10px] font-semibold leading-none text-white transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 font-dm-sans'
            >
              Read Free
            </button>
            <button
              type='button'
              onClick={() => void handleFreeSummaryClaim(false)}
              disabled={claiming}
              className='flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-blue-600 shadow-sm transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-70'
              aria-label={`Save ${item.title}`}
            >
              <BookmarkIcon className='h-4 w-4' />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className='group flex h-auto w-full flex-col overflow-visible rounded-lg bg-transparent transition-all duration-[250ms] ease-out'
      style={{
        animationDelay: `${index * 100}ms`,
      }}
    >
      <CoverImageFrame
        src={item.image || undefined}
        alt={item.title}
        sizes='(max-width: 768px) 50vw, 200px'
        priority={index === 0}
        loading={index === 0 ? 'eager' : 'lazy'}
        className='h-[170px] w-full rounded-lg border-0 bg-transparent shadow-[0_10px_24px_rgba(0,0,0,0.10)]'
        imageClassName='transition-transform duration-300'
        fit='cover'
        showBackdrop={false}
        fixedAspectRatio={3 / 4}
        variant={item.type === 'Audiobook' ? 'audiobook' : 'book'}
      />

      <div className='flex flex-col pt-2 font-dm-sans'>
        <div className='hidden'>
          <span className='min-w-0 truncate rounded-full border border-slate-200 bg-white px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-slate-800 shadow-sm'>
            {item.category}
          </span>
          {item.language && (
            <span className='shrink-0 rounded-full border border-indigo-500 bg-indigo-600 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-white shadow-sm'>
              {item.language}
            </span>
          )}
        </div>

        <h3 className='truncate text-[13px] font-semibold leading-tight text-[#1E1B4B] font-dm-sans'>
          {item.title}
        </h3>
        <p className='mt-1 truncate text-[11px] font-normal text-[#757575] font-dm-sans'>
          {item.author}
        </p>

        {(item.rating ?? 0) > 0 && (
          <div className='mt-1.5 flex items-center gap-1.5'>
            <StarIconSolid className='h-4 w-4 text-[#5146F7]' />
            <span className='text-[20px] font-bold leading-none text-[#1E1B4B] font-dm-sans'>{(item.rating || 0).toFixed(1)}</span>
            <span className='text-[11px] font-medium text-[#666666] font-dm-sans'>({item.reviews || 0})</span>
          </div>
        )}

        {!isFreeItem && (
          <p className='mt-1.5 truncate text-[10px] font-semibold text-[#1E1B4B] font-dm-sans'>
            {hasUniquePlus ? 'Read ' : <>{displayPrice ? `${displayPrice} or ` : ''}</>}
            <span className='font-semibold text-[#16A34A]'>Free</span>
            {hasUniquePlus ? ' with Unique Plus or' : ' with Unique Plus'}
          </p>
        )}

        <div className='mt-2 flex flex-col gap-1.5'>
          <button
            type='button'
            onClick={isFreeItem ? () => router.push(href) : handleUniquePlusAction}
            className={`flex h-9 w-full items-center justify-center rounded-[10px] text-[10px] font-semibold leading-none text-white transition-all active:scale-95 font-dm-sans ${
              isFreeItem
                ? 'bg-blue-600'
                : hasUniquePlus
                  ? 'bg-slate-950'
                  : 'bg-indigo-600'
            }`}
          >
            {isFreeItem ? 'Read Free' : hasUniquePlus ? `${displayPrice || ''} Keep Forever`.trim() : 'Read with Unique Plus'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface MediaContentMobileProps {
  newReleaseBooks: PublicBookListItem[];
  newReleaseAudiobooks: PublicBookListItem[];
  freeSummaries: PublicBookListItem[];
  trendingBooks: PublicBookListItem[];
  premiumSummaries: PublicBookListItem[];
  categories: Category[];
  availableFormats?: string[];
  allCategoryNames?: string[];
}

const LANDING_ITEM_LIMIT = 4;

export default function MediaContentMobile({
  newReleaseBooks,
  newReleaseAudiobooks,
  freeSummaries,
  trendingBooks,
  premiumSummaries,
  categories,
  availableFormats = [],
  allCategoryNames = [],
}: MediaContentMobileProps) {
  const router = useRouter();
  const [currentBookPage, setCurrentBookPage] = useState(0);
  const [currentAudiobookPage, setCurrentAudiobookPage] = useState(0);
  const [currentFreeSummaryPage, setCurrentFreeSummaryPage] = useState(0);
  const [currentTrendingBookPage, setCurrentTrendingBookPage] = useState(0);
  const [currentPremiumSummaryPage, setCurrentPremiumSummaryPage] = useState(0);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const isLoadingBooks = false;
  const isLoadingFreeSummaries = false;
  const isLoadingTrendingBooks = false;
  const isLoadingPremiumSummaries = false;
  const isLoadingCategories = false;

  const itemsPerPage = 4; // Keep each landing hub to 4 cards; full lists live behind See More.
  
  // Refs for swipe containers
  const booksContainerRef = useRef<HTMLDivElement>(null);
  const audiobooksContainerRef = useRef<HTMLDivElement>(null);
  const freeSummariesContainerRef = useRef<HTMLDivElement>(null);
  const trendingBooksContainerRef = useRef<HTMLDivElement>(null);
  const premiumSummariesContainerRef = useRef<HTMLDivElement>(null);
  
  // Touch handling state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const activePagerRef = useRef<{
    currentPage: number;
    setCurrentPage: (v: number | ((prev: number) => number)) => void;
    totalPages: number;
  } | null>(null);

  useEffect(() => {
    // Inject blob animation styles only once
    if (!document.getElementById('blob-animations')) {
      const styleElement = document.createElement('style');
      styleElement.id = 'blob-animations';
      styleElement.textContent = blobStyles;
      document.head.appendChild(styleElement);
    }
  }, []);

  const allItems = useMemo(
    () => [
      ...newReleaseBooks,
      ...newReleaseAudiobooks,
      ...freeSummaries,
      ...trendingBooks,
      ...premiumSummaries,
    ],
    [newReleaseBooks, newReleaseAudiobooks, freeSummaries, trendingBooks, premiumSummaries]
  );

  const countValues = useCallback((values: Array<string | null | undefined>) =>
    values.reduce<Record<string, number>>((acc, value) => {
      if (!value) return acc;
      acc[value] = (acc[value] ?? 0) + 1;
      return acc;
    }, {}),
  []);

  const uniqueLanguages = useMemo(
    () => [...new Set(allItems.map((item) => item.language).filter(Boolean))] as string[],
    [allItems]
  );
  const itemFormats = useMemo(
    () => [...new Set(allItems.flatMap((item) => item.format || []).filter((format) => format && format !== 'Audiobook'))],
    [allItems]
  );
  const uniqueFormats = availableFormats.length > 0 ? availableFormats : itemFormats;
  const itemCategories = useMemo(
    () => [...new Set(allItems.map((item) => item.category).filter(Boolean))] as string[],
    [allItems]
  );
  const uniqueCategories = allCategoryNames.length > 0 ? allCategoryNames : itemCategories;

  const formatCounts = useMemo(
    () => allItems.reduce<Record<string, number>>((acc, item) => {
      (item.format || [])
        .filter((format) => format && format !== 'Audiobook')
        .forEach((format) => {
          acc[format] = (acc[format] ?? 0) + 1;
        });
      return acc;
    }, {}),
    [allItems]
  );
  const typeCounts = useMemo(() => countValues(allItems.map((item) => item.type)), [allItems, countValues]);
  const languageCounts = useMemo(() => countValues(allItems.map((item) => item.language)), [allItems, countValues]);
  const categoryCounts = useMemo(() => countValues(allItems.map((item) => item.category)), [allItems, countValues]);

  const hasFilters =
    Boolean(search.trim()) ||
    selectedTypes.length > 0 ||
    selectedLanguages.length > 0 ||
    selectedCategories.length > 0 ||
    selectedFormats.length > 0;
  const activeFilterCount =
    (search.trim() ? 1 : 0) +
    selectedTypes.length +
    selectedLanguages.length +
    selectedCategories.length +
    selectedFormats.length;

  const toggleFilterValue = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string
  ) => {
    setter((prev) => prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedTypes([]);
    setSelectedLanguages([]);
    setSelectedCategories([]);
    setSelectedFormats([]);
    setCurrentBookPage(0);
    setCurrentAudiobookPage(0);
    setCurrentFreeSummaryPage(0);
    setCurrentTrendingBookPage(0);
    setCurrentPremiumSummaryPage(0);
  };

  const filterItems = useCallback((items: PublicBookListItem[]) => {
    if (!hasFilters) return items;

    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      if (query) {
        const title = item.title?.toLowerCase() || '';
        const author = item.author?.toLowerCase() || '';
        if (!title.includes(query) && !author.includes(query)) return false;
      }

      if (selectedTypes.length && !selectedTypes.includes(item.type)) return false;
      if (selectedLanguages.length && !selectedLanguages.includes(item.language || '')) return false;
      if (selectedCategories.length && !selectedCategories.includes(item.category)) return false;
      if (selectedFormats.length && !item.format?.some((format) => format !== 'Audiobook' && selectedFormats.includes(format))) {
        return false;
      }

      return true;
    });
  }, [hasFilters, search, selectedTypes, selectedLanguages, selectedCategories, selectedFormats]);

  const books = filterItems(newReleaseBooks).slice(0, LANDING_ITEM_LIMIT);
  const audiobooks = filterItems(newReleaseAudiobooks).slice(0, LANDING_ITEM_LIMIT);
  const displayFreeSummaries = filterItems(freeSummaries).slice(0, LANDING_ITEM_LIMIT);
  const displayTrendingBooks = filterItems(trendingBooks).slice(0, LANDING_ITEM_LIMIT);
  const displayPremiumSummaries = filterItems(premiumSummaries).slice(0, LANDING_ITEM_LIMIT);

  const CountBadge = ({ count }: { count: number }) => (
    <span className='ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600'>
      {count}
    </span>
  );

  const FilterCheckbox = ({
    label,
    checked,
    count,
    onChange,
  }: {
    label: string;
    checked: boolean;
    count: number;
    onChange: () => void;
  }) => (
    <label className='flex items-center gap-2 py-1.5 text-xs text-slate-800'>
      <input
        type='checkbox'
        checked={checked}
        onChange={onChange}
        className='h-3.5 w-3.5 rounded accent-indigo-600'
      />
      <span className='min-w-0 flex-1 truncate'>{label}</span>
      <CountBadge count={count} />
    </label>
  );

  useEffect(() => {
    setCurrentBookPage(0);
    setCurrentAudiobookPage(0);
    setCurrentFreeSummaryPage(0);
    setCurrentTrendingBookPage(0);
    setCurrentPremiumSummaryPage(0);
  }, [search, selectedTypes, selectedLanguages, selectedCategories, selectedFormats]);

  const getBooksPageItems = () => {
    const startBook = currentBookPage * itemsPerPage;
    return books.slice(startBook, startBook + itemsPerPage);
  };

  const getBooksTotalPages = () => Math.ceil(books.length / itemsPerPage);

  const getAudiobooksPageItems = () => {
    const start = currentAudiobookPage * itemsPerPage;
    return audiobooks.slice(start, start + itemsPerPage);
  };

  const getAudiobooksTotalPages = () => Math.ceil(audiobooks.length / itemsPerPage);

  const getFreeSummariesPageItems = () => {
    const start = currentFreeSummaryPage * itemsPerPage;
    return displayFreeSummaries.slice(start, start + itemsPerPage);
  };

  const getFreeSummariesTotalPages = () => Math.ceil(displayFreeSummaries.length / itemsPerPage);

  const getTrendingBooksPageItems = () => {
    const start = currentTrendingBookPage * itemsPerPage;
    return displayTrendingBooks.slice(start, start + itemsPerPage);
  };

  const getTrendingBooksTotalPages = () => Math.ceil(displayTrendingBooks.length / itemsPerPage);

  const getPremiumSummariesPageItems = () => {
    const start = currentPremiumSummaryPage * itemsPerPage;
    return displayPremiumSummaries.slice(start, start + itemsPerPage);
  };

  const getPremiumSummariesTotalPages = () => Math.ceil(displayPremiumSummaries.length / itemsPerPage);

  // Swipe handling functions
  const minSwipeDistance = 50;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);
    const isSwipe = Math.abs(distanceX) > minSwipeDistance;
    
    if (isHorizontalSwipe && isSwipe) {
      setHasInteracted(true);
      setShowSwipeHint(false);

      const pager = activePagerRef.current;
      if (!pager) return;

      if (distanceX > 0 && pager.currentPage < pager.totalPages - 1) {
        pager.setCurrentPage((prev) => prev + 1);
      } else if (distanceX < 0 && pager.currentPage > 0) {
        pager.setCurrentPage((prev) => prev - 1);
      }
    }
  }, [touchStart, touchEnd]);

  const setActivePager = useCallback(
    (pager: {
      currentPage: number;
      setCurrentPage: (v: number | ((prev: number) => number)) => void;
      totalPages: number;
    }) => {
      activePagerRef.current = pager;
    },
    []
  );

  // Swipe Hint Component
  const SwipeHint = ({ show }: { show: boolean }) => (
    <div 
      className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <div className='bg-black/80 backdrop-blur-sm text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 animate-pulse'>
        <HandRaisedIcon className='w-5 h-5 text-blue-400' />
        <span className='text-sm font-medium'>Swipe left or right for more</span>
        <div className='flex space-x-1'>
          <ArrowRightIcon className='w-4 h-4 text-blue-400 animate-bounce' style={{ animationDelay: '0s' }} />
          <ArrowRightIcon className='w-4 h-4 text-blue-400 animate-bounce' style={{ animationDelay: '0.2s' }} />
          <ArrowRightIcon className='w-4 h-4 text-blue-400 animate-bounce' style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );

  return (
    <section className='py-2 bg-gradient-to-br from-white via-slate-50 to-indigo-50/30 relative overflow-hidden'>
      {/* Main Loading Overlay */}
        {/* {isLoading && (
          <div className="absolute inset-0 z-40 bg-white/80 backdrop-blur-sm">
            <LoadingAnimation className="text-blue-600 scale-150 mb-8" />
            <p className="text-slate-600 text-lg font-medium">Loading media content...</p>
          </div>
        )} */}

      {/* Background Elements */}
      <div className='absolute inset-0 opacity-20'>
        <div className='absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-transparent to-purple-600/5' />
        <div className='absolute top-10 right-5 w-20 h-20 bg-indigo-200/20 rounded-full blur-2xl animate-pulse' />
        <div className='absolute bottom-10 left-5 w-24 h-24 bg-purple-200/15 rounded-full blur-2xl animate-pulse delay-1000' />
      </div>

      {isFilterOpen && (
        <div className='fixed inset-0 z-[70] bg-black/45' onClick={() => setIsFilterOpen(false)}>
          <aside
            className='h-full w-[82vw] max-w-[310px] overflow-y-auto bg-white shadow-2xl'
            onClick={(event) => event.stopPropagation()}
          >
            <div className='sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3'>
              <div className='flex items-center gap-2'>
                <FunnelIcon className='h-4 w-4 text-slate-600' />
                <h3 className='text-sm font-bold text-slate-950'>Filters</h3>
              </div>
              <button
                type='button'
                onClick={() => setIsFilterOpen(false)}
                className='flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500'
                aria-label='Close filters'
              >
                <XMarkIcon className='h-4 w-4' />
              </button>
            </div>

            <div className='space-y-5 p-4'>
              <div>
                <p className='mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-600'>Search</p>
                <div className='flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2'>
                  <MagnifyingGlassIcon className='h-3.5 w-3.5 shrink-0 text-slate-500' />
                  <input
                    type='text'
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder='Search books...'
                    className='min-w-0 flex-1 bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400'
                  />
                </div>
              </div>

              {uniqueFormats.length > 0 && (
                <div>
                  <p className='mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-600'>Format</p>
                  {uniqueFormats.map((format) => (
                    <FilterCheckbox
                      key={format}
                      label={format}
                      count={formatCounts[format] ?? 0}
                      checked={selectedFormats.includes(format)}
                      onChange={() => toggleFilterValue(setSelectedFormats, format)}
                    />
                  ))}
                </div>
              )}

              <div>
                <p className='mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-600'>Type</p>
                {['Books', 'Audiobook'].map((type) => (
                  <FilterCheckbox
                    key={type}
                    label={type}
                    count={typeCounts[type] ?? 0}
                    checked={selectedTypes.includes(type)}
                    onChange={() => toggleFilterValue(setSelectedTypes, type)}
                  />
                ))}
              </div>

              {uniqueLanguages.length > 0 && (
                <div>
                  <p className='mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-600'>Language</p>
                  {uniqueLanguages.map((language) => (
                    <FilterCheckbox
                      key={language}
                      label={language}
                      count={languageCounts[language] ?? 0}
                      checked={selectedLanguages.includes(language)}
                      onChange={() => toggleFilterValue(setSelectedLanguages, language)}
                    />
                  ))}
                </div>
              )}

              {uniqueCategories.length > 0 && (
                <div>
                  <p className='mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-600'>Category</p>
                  {uniqueCategories.map((category) => (
                    <FilterCheckbox
                      key={category}
                      label={category}
                      count={categoryCounts[category] ?? 0}
                      checked={selectedCategories.includes(category)}
                      onChange={() => toggleFilterValue(setSelectedCategories, category)}
                    />
                  ))}
                </div>
              )}

              <div className='sticky bottom-0 -mx-4 border-t border-slate-200 bg-white p-4'>
                <button
                  type='button'
                  onClick={clearFilters}
                  className='w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700'
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      <div className='relative z-10 w-full px-3 pt-4 pb-4 lg:px-5 lg:pt-8 lg:pb-6'>
        {/* Free Summaries Section */}
        <div id="free-summaries-section-mobile" className='mb-8'>
          <div className='flex items-center justify-between mb-6'>
            <div className='flex-1'>
              <h3 className='text-lg font-bold text-slate-900 mb-2 flex items-center'>
                <BookOpenIcon className='w-4 h-4 mr-2 text-black' />
                <span className='text-black'>Free Summaries</span>
              </h3>
              <div className='h-1 w-20 bg-black rounded-full'></div>
            </div>
            <Button
              onClick={() => router.push('/free-summaries')}
              variant="outline"
              size="sm"
              rightIcon={<ChevronRightIcon className='w-4 h-4' />}
            >
              See More
            </Button>
          </div>

          <div
            ref={freeSummariesContainerRef}
            className='grid grid-cols-2 gap-4 mb-6 touch-pan-y'
            onTouchStart={(e) => {
              setActivePager({
                currentPage: currentFreeSummaryPage,
                setCurrentPage: setCurrentFreeSummaryPage,
                totalPages: getFreeSummariesTotalPages(),
              });
              onTouchStart(e);
            }}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {(isLoadingFreeSummaries ? [] : getFreeSummariesPageItems()).map((summary, index) => (
              <MobileShowcaseCard
                key={(summary as any)._id || (summary as any).id}
                item={summary}
                index={index}
                meta={summary.pages ? `${summary.pages} pages` : 'Free Summary'}
                href={`/books/${(summary as any).slug || (summary as any).id || (summary as any)._id || generateBookSlug(summary.title)}`}
              />
            ))}
          </div>

          {getFreeSummariesTotalPages() > 1 && (
            <div className='flex justify-center space-x-2 mb-4'>
              {Array.from({ length: getFreeSummariesTotalPages() }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentFreeSummaryPage(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    currentFreeSummaryPage === i
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 w-6'
                      : 'bg-slate-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* New Release Books Section */}
        <div className='mb-8'>
          {/* Header */}
          <div className='flex items-center justify-between mb-6'>
            <div className='flex-1'>
              <h3 className='text-lg font-bold text-slate-900 mb-2 flex items-center'>
                <BookOpenIcon className='w-4 h-4 mr-2 text-black' />
                <span className='text-black'>New Release Books</span>
              </h3>
              <div className='h-1 w-20 bg-black rounded-full'></div>
            </div>
            <Button
              onClick={() => router.push('/books')}
              variant="outline"
              size="sm"
              rightIcon={<ChevronRightIcon className='w-4 h-4' />}
            >
              See More
            </Button>
            <button
              type='button'
              onClick={() => setIsFilterOpen(true)}
              className='ml-2 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-800 shadow-sm active:scale-95'
              aria-label='Open filters'
            >
              <FunnelIcon className='h-3.5 w-3.5' />
              Filters
              {activeFilterCount > 0 && (
                <span className='inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white'>
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Books Grid - 2 columns with swipe */}
          <div 
            ref={booksContainerRef}
            className='grid grid-cols-2 gap-4 mb-6 touch-pan-y'
            onTouchStart={(e) => {
              setActivePager({
                currentPage: currentBookPage,
                setCurrentPage: setCurrentBookPage,
                totalPages: getBooksTotalPages(),
              });
              onTouchStart(e);
            }}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {getBooksPageItems().map((book, index) => (
              <MobileShowcaseCard
                key={book.id}
                item={book}
                index={index}
                meta={book.pages ? `${book.pages} pages` : book.duration || book.type}
                href={`/books/${book.slug || book.id || book._id || generateBookSlug(book.title)}`}
              />
            ))}
          </div>

          {/* Pagination Dots */}
          {getBooksTotalPages() > 1 && (
            <div className='flex justify-center space-x-2 mb-4'>
              {Array.from({ length: getBooksTotalPages() }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentBookPage(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    currentBookPage === i
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 w-6'
                      : 'bg-slate-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* New Release Audiobooks Section */}
        <div className='mb-8'>
          <div className='flex items-center justify-between mb-6'>
            <div className='flex-1'>
              <h3 className='text-lg font-bold text-slate-900 mb-2 flex items-center'>
                <BookOpenIcon className='w-4 h-4 mr-2 text-black' />
                <span className='text-black'>New Release Audiobooks</span>
              </h3>
              <div className='h-1 w-20 bg-black rounded-full'></div>
            </div>
            <Button
              onClick={() => router.push('/audiobooks')}
              variant="outline"
              size="sm"
              rightIcon={<ChevronRightIcon className='w-4 h-4' />}
            >
              See More
            </Button>
          </div>

          <div
            ref={audiobooksContainerRef}
            className='grid grid-cols-2 gap-4 mb-6 touch-pan-y'
            onTouchStart={(e) => {
              setActivePager({
                currentPage: currentAudiobookPage,
                setCurrentPage: setCurrentAudiobookPage,
                totalPages: getAudiobooksTotalPages(),
              });
              onTouchStart(e);
            }}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {getAudiobooksPageItems().map((book, index) => (
              <MobileShowcaseCard
                key={book.id}
                item={book}
                index={index}
                meta={book.duration || book.type}
                href={`/audiobooks/${book.slug || book.id || book._id || generateBookSlug(book.title)}`}
              />
            ))}
          </div>

          {getAudiobooksTotalPages() > 1 && (
            <div className='flex justify-center space-x-2 mb-4'>
              {Array.from({ length: getAudiobooksTotalPages() }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentAudiobookPage(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    currentAudiobookPage === i
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 w-6'
                      : 'bg-slate-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Trending Books Section */}
        <div className='mb-8'>
          <div className='flex items-center justify-between mb-6'>
            <div className='flex-1'>
              <h3 className='text-lg font-bold text-slate-900 mb-2 flex items-center'>
                <BookOpenIcon className='w-4 h-4 mr-2 text-black' />
                <span className='text-black'>Trending Books</span>
              </h3>
              <div className='h-1 w-20 bg-black rounded-full'></div>
            </div>
            <Button
              onClick={() => router.push('/trending-books')}
              variant="outline"
              size="sm"
              rightIcon={<ChevronRightIcon className='w-4 h-4' />}
            >
              See More
            </Button>
          </div>

          <div
            ref={trendingBooksContainerRef}
            className='grid grid-cols-2 gap-4 mb-6 touch-pan-y'
            onTouchStart={(e) => {
              setActivePager({
                currentPage: currentTrendingBookPage,
                setCurrentPage: setCurrentTrendingBookPage,
                totalPages: getTrendingBooksTotalPages(),
              });
              onTouchStart(e);
            }}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {(isLoadingTrendingBooks ? [] : getTrendingBooksPageItems()).map((book, index) => (
              <MobileShowcaseCard
                key={(book as any)._id || (book as any).id}
                item={book}
                index={index}
                meta={book.pages ? `${book.pages} pages` : 'Trending'}
                href={`/books/${(book as any).slug || (book as any).id || (book as any)._id || generateBookSlug(book.title)}`}
              />
            ))}
          </div>

          {getTrendingBooksTotalPages() > 1 && (
            <div className='flex justify-center space-x-2 mb-4'>
              {Array.from({ length: getTrendingBooksTotalPages() }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentTrendingBookPage(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    currentTrendingBookPage === i
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 w-6'
                      : 'bg-slate-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Premium Content Section */}
        <div className='mb-8'>
          <div className='flex items-center justify-between mb-6'>
            <div className='flex-1'>
              <h3 className='text-lg font-bold text-slate-900 mb-2 flex items-center'>
                <BookOpenIcon className='w-4 h-4 mr-2 text-black' />
                <span className='text-black'>Premium Content</span>
              </h3>
              <div className='h-1 w-20 bg-black rounded-full'></div>
            </div>
            <Button
              onClick={() => router.push('/premium-summaries')}
              variant="outline"
              size="sm"
              rightIcon={<ChevronRightIcon className='w-4 h-4' />}
            >
              See More
            </Button>
          </div>

          <div
            ref={premiumSummariesContainerRef}
            className='grid grid-cols-2 gap-4 mb-6 touch-pan-y'
            onTouchStart={(e) => {
              setActivePager({
                currentPage: currentPremiumSummaryPage,
                setCurrentPage: setCurrentPremiumSummaryPage,
                totalPages: getPremiumSummariesTotalPages(),
              });
              onTouchStart(e);
            }}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {(isLoadingPremiumSummaries ? [] : getPremiumSummariesPageItems()).map((summary, index) => (
              <MobileShowcaseCard
                key={(summary as any)._id || (summary as any).id}
                item={summary}
                index={index}
                meta={summary.pages ? `${summary.pages} pages` : 'Premium Summary'}
                href={`/books/${(summary as any).slug || (summary as any).id || (summary as any)._id || generateBookSlug(summary.title)}`}
              />
            ))}
          </div>

          {getPremiumSummariesTotalPages() > 1 && (
            <div className='flex justify-center space-x-2 mb-4'>
              {Array.from({ length: getPremiumSummariesTotalPages() }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPremiumSummaryPage(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    currentPremiumSummaryPage === i
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 w-6'
                      : 'bg-slate-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Categories Section - Mobile */}
        <div className='relative mt-10 mb-8 p-6 bg-[#0B0F1A] rounded-[32px] overflow-hidden border border-white/5'>
          {/* Background Glows */}
          <div className='absolute top-0 right-0 w-[200px] h-[200px] bg-indigo-600/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none' />
          
          <div className='flex flex-col items-center mb-10'>
            <div className='bg-gradient-to-r from-[#FF8C7E] to-[#FF4E74] text-white text-[8px] uppercase font-bold tracking-widest px-3 py-1 rounded-full mb-4 shadow-lg shadow-pink-500/20'>
              âœ¦ book of the day
            </div>
            <div className='font-syne text-center mb-5'>
              <div className='text-[56px] font-extrabold text-white leading-[0.8] mb-1 tracking-tighter'>21</div>
              <div className='text-[20px] font-bold text-[#00E5BC] tracking-[0.2em] leading-none mb-1 uppercase'>Days</div>
              <div className='text-[8px] font-medium text-white/30 tracking-[0.4em] uppercase'>Challenge</div>
            </div>
            <button
              onClick={() => {
                const element = document.getElementById('free-summaries-section-mobile');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className='group relative flex items-center gap-2 px-6 py-2.5 bg-white text-black text-[11px] font-bold rounded-full transition-all active:scale-95 font-dm-sans shadow-lg'
            >
              <span>Start Now</span>
              <ChevronRightIcon className='w-3 h-3' />
            </button>
          </div>

          <div className='flex items-center gap-3 mb-6'>
            <span className='text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] font-syne shrink-0'>Browse Categories</span>
            <div className='h-px flex-1 bg-white/5'></div>
          </div>

          <div className='grid grid-cols-2 gap-3'>
            {isLoadingCategories ? (
              Array.from({ length: 6 }, (_, i) => (
                <div key={i} className='h-[60px] bg-white/5 animate-pulse rounded-2xl border border-white/5' />
              ))
            ) : (
              categories.map((category, idx) => {
                const icons = ['ðŸ§ ', 'ðŸ“ˆ', 'âš¡', 'ðŸ”¥', 'ðŸ”¬', 'ðŸ’¼', 'ðŸ‘‘', 'ðŸŽ¯', 'ðŸ†', 'ðŸ“¡', 'ðŸŽ“', 'ðŸ’¬', 'â­'];
                const colors = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#6366F1', '#EC4899', '#F97316', '#84CC16', '#3B82F6', '#A855F7', '#F43F5E', '#14B8A6'];
                return (
                  <button
                    key={category._id || category.id}
                    onClick={() => router.push(`/books?category=${category.name}`)}
                    className='relative flex items-center gap-2.5 p-2.5 rounded-[16px] bg-[#1A1F2E] border border-white/5 transition-all active:scale-[0.98] overflow-hidden'
                  >
                    <div 
                      className='w-7 h-7 shrink-0 rounded-[8px] flex items-center justify-center text-sm' 
                      style={{ backgroundColor: `${colors[idx % colors.length]}15`, color: colors[idx % colors.length] }}
                    >
                      {icons[idx % icons.length]}
                    </div>
                    <div className='flex-1 flex flex-col justify-center text-left min-w-0'>
                      <span className='font-syne font-bold text-[11px] text-white truncate leading-tight'>{category.name}</span>
                      <div className='font-dm-sans text-white/20 text-[8px]'>{Math.floor(Math.random() * 400 + 50)}+</div>
                    </div>
                    <div className='absolute inset-0 opacity-0 active:opacity-[0.05] transition-opacity pointer-events-none' style={{ background: `radial-gradient(circle at center, ${colors[idx % colors.length]}, transparent 70%)` }} />
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Swipe Hint */}
      <SwipeHint show={showSwipeHint} />
    </section>
  );
}
