'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import BooksHero, { type BooksHeroBanner } from '@/components/ui/books/BooksHero';
import BooksSidebar from '@/components/ui/books/BooksSidebar';
import BooksGrid from '@/components/ui/books/BooksGrid';
import AudiobookFilters from '@/components/ui/audiobooks/AudiobookFilters';
import AudiobookGrid from '@/components/ui/audiobooks/AudiobookGrid';
import {
  AUDIOBOOK_SORT_OPTIONS,
  isAudiobookSortOption,
  parsePriceValue,
  type AudiobookSortOption,
} from '@/lib/audiobooks';
import type { Category } from '@/services/api/categoriesApi';
import type { LanguageRecord } from '@/services/api/languageApi';
import type { PublicBookListItem } from '@/types/publicBook';

interface BooksPageClientProps {
  allBooks: PublicBookListItem[];
  categories: Category[];
  heroBanners: BooksHeroBanner[];
  languages: LanguageRecord[];
}

const DEFAULT_SORT: AudiobookSortOption = 'newest';

function buildCounts(values: Array<string | null | undefined>) {
  return values.reduce<Record<string, number>>((accumulator, value) => {
    if (!value) return accumulator;

    accumulator[value] = (accumulator[value] ?? 0) + 1;
    return accumulator;
  }, {});
}

function buildFormatCounts(items: PublicBookListItem[]) {
  return items.reduce<Record<string, number>>((accumulator, item) => {
    item.format.forEach((format) => {
      accumulator[format] = (accumulator[format] ?? 0) + 1;
    });

    return accumulator;
  }, {});
}

function getPublishTimestamp(value?: string) {
  if (!value) return 0;

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function normalizeQueryString(params: URLSearchParams) {
  return Array.from(params.entries())
    .sort(([leftKey, leftValue], [rightKey, rightValue]) => {
      if (leftKey === rightKey) {
        return leftValue.localeCompare(rightValue);
      }

      return leftKey.localeCompare(rightKey);
    })
    .map(
      ([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join('&');
}

export default function BooksPageClient({
  allBooks,
  categories,
  heroBanners,
  languages,
}: BooksPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedComponentType, setSelectedComponentType] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFilterSidebarCollapsed, setIsFilterSidebarCollapsed] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<AudiobookSortOption>(DEFAULT_SORT);
  const [selectedAudiobook, setSelectedAudiobook] = useState<PublicBookListItem | null>(null);
  const [isAudiobookPlaying, setIsAudiobookPlaying] = useState(false);
  const [userRating, setUserRating] = useState<number>(0);
  const [cartFeedback, setCartFeedback] = useState<string | null>(null);
  const audiobookAudioRef = useRef<HTMLAudioElement>(null);
  const hasHydratedFiltersFromUrl = useRef(false);
  const lastHydratedQueryRef = useRef<string>('');
  const lastSyncedQueryRef = useRef<string>('');

  const currentSearchParamsString = searchParams.toString();
  const currentNormalizedQuery = useMemo(
    () => normalizeQueryString(new URLSearchParams(currentSearchParamsString)),
    [currentSearchParamsString]
  );

  const selectedAudiobookUrl = useMemo(() => {
    return selectedAudiobook?.files?.audiobook?.url || '';
  }, [selectedAudiobook]);

  const audiobookItems = useMemo(
    () => allBooks.filter((book) => book.type === 'Audiobook'),
    [allBooks]
  );

  const resolvedType =
    selectedTypes.length === 1 ? selectedTypes[0] : searchParams.get('type');
  const isAudiobookMode = resolvedType === 'Audiobook';

  const baseItems = isAudiobookMode ? audiobookItems : allBooks;

  const formats = useMemo(() => {
    const allFormats = new Set<string>();

    baseItems.forEach((book) => {
      if (Array.isArray(book.format)) {
        book.format.forEach((format) => allFormats.add(format));
      }
    });

    return Array.from(allFormats).sort();
  }, [baseItems]);

  const audiobookCategories = useMemo(
    () => Object.keys(buildCounts(audiobookItems.map((item) => item.category))).sort(),
    [audiobookItems]
  );
  const audiobookLanguages = useMemo(
    () =>
      Object.keys(buildCounts(audiobookItems.map((item) => item.language))).sort(),
    [audiobookItems]
  );
  const audiobookFormats = useMemo(
    () => Object.keys(buildFormatCounts(audiobookItems)).sort(),
    [audiobookItems]
  );

  const audiobookCategoryCounts = useMemo(
    () => buildCounts(audiobookItems.map((item) => item.category)),
    [audiobookItems]
  );
  const audiobookLanguageCounts = useMemo(
    () => buildCounts(audiobookItems.map((item) => item.language)),
    [audiobookItems]
  );
  const audiobookFormatCounts = useMemo(
    () => buildFormatCounts(audiobookItems),
    [audiobookItems]
  );
  const formatCounts = useMemo(() => buildFormatCounts(allBooks), [allBooks]);
  const categoryCounts = useMemo(
    () => buildCounts(allBooks.map((item) => item.category)),
    [allBooks]
  );
  const languageCounts = useMemo(
    () => buildCounts(allBooks.map((item) => item.language)),
    [allBooks]
  );
  const typeCounts = useMemo(
    () => buildCounts(allBooks.map((item) => item.type)),
    [allBooks]
  );

  const audiobookStats = useMemo(() => {
    const freeTitles = audiobookItems.filter(
      (item) => parsePriceValue(item.price) === 0
    ).length;

    return {
      total: audiobookItems.length,
      free: freeTitles,
      premium: audiobookItems.length - freeTitles,
      categories: audiobookCategories.length,
    };
  }, [audiobookCategories.length, audiobookItems]);

  const compactNumber = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1,
      }),
    []
  );

  useEffect(() => {
    if (lastHydratedQueryRef.current === currentNormalizedQuery) {
      hasHydratedFiltersFromUrl.current = true;
      return;
    }

    lastHydratedQueryRef.current = currentNormalizedQuery;

    const params = new URLSearchParams(currentSearchParamsString);
    const typeParam = params.get('type');
    const categoryParam = params.get('category');
    const searchParam = params.get('search');
    const componentTypeParam = params.get('componentType');
    const languageParam = params.get('language');
    const formatParam = params.get('format');
    const sortParam = params.get('sort');

    setSelectedTypes(typeParam ? [typeParam] : []);
    setSelectedCategories(categoryParam ? [categoryParam] : []);
    setSearchTerm(searchParam || '');
    setSelectedComponentType(componentTypeParam);
    setSelectedLanguages(languageParam ? [languageParam] : []);
    setSelectedFormats(formatParam ? [formatParam] : []);
    setSortBy(isAudiobookSortOption(sortParam) ? sortParam : DEFAULT_SORT);

    if (categoryParam && !languageParam && !typeParam && !formatParam && allBooks.length > 0) {
      const categoryBooks = allBooks.filter((book) => book.category === categoryParam);
      const availableLanguages = Array.from(
        new Set(categoryBooks.map((book) => book.language).filter(Boolean))
      ) as string[];
      const availableTypes = Array.from(
        new Set(categoryBooks.map((book) => book.type).filter(Boolean))
      ) as ('Books' | 'Audiobook')[];
      const availableFormats = new Set<string>();

      categoryBooks.forEach((book) => {
        book.format?.forEach((format) => availableFormats.add(format));
      });

      if (availableLanguages.length > 0) {
        setSelectedLanguages(availableLanguages);
      }

      if (availableTypes.length > 0) {
        setSelectedTypes(availableTypes);
      }

      if (availableFormats.size > 0) {
        setSelectedFormats(Array.from(availableFormats));
      }
    }

    hasHydratedFiltersFromUrl.current = true;
  }, [allBooks, currentNormalizedQuery, currentSearchParamsString]);

  useEffect(() => {
    if (!hasHydratedFiltersFromUrl.current) {
      return;
    }

    const params = new URLSearchParams();

    if (searchTerm) params.set('search', searchTerm);
    if (selectedCategories.length > 0) params.set('category', selectedCategories[0]);

    if (isAudiobookMode) {
      params.set('type', 'Audiobook');
    } else if (selectedTypes.length === 1) {
      params.set('type', selectedTypes[0]);
    }

    if (selectedLanguages.length > 0) params.set('language', selectedLanguages[0]);
    if (selectedFormats.length > 0) params.set('format', selectedFormats[0]);
    if (!isAudiobookMode && selectedComponentType) {
      params.set('componentType', selectedComponentType);
    }
    if (sortBy !== DEFAULT_SORT) params.set('sort', sortBy);

    const queryString = normalizeQueryString(params);
    const currentQuery = currentNormalizedQuery;

    if (queryString !== currentQuery && queryString !== lastSyncedQueryRef.current) {
      lastSyncedQueryRef.current = queryString;
      router.replace(`/books${queryString ? `?${queryString}` : ''}`, {
        scroll: false,
      });
    } else if (queryString === currentQuery) {
      lastSyncedQueryRef.current = queryString;
    }
  }, [
    currentNormalizedQuery,
    isAudiobookMode,
    searchTerm,
    selectedCategories,
    selectedTypes,
    selectedLanguages,
    selectedFormats,
    selectedComponentType,
    sortBy,
    router,
  ]);

  const filteredItems = useMemo(
    () =>
      baseItems.filter((item) => {
        const matchesCategory =
          selectedCategories.length === 0 ||
          selectedCategories.includes(item.category);
        const normalizedSearch = searchTerm.toLowerCase();
        const matchesSearch =
          normalizedSearch === '' ||
          item.title.toLowerCase().includes(normalizedSearch) ||
          item.author.toLowerCase().includes(normalizedSearch) ||
          item.description.toLowerCase().includes(normalizedSearch) ||
          item.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch));
        const matchesFormat =
          selectedFormats.length === 0 ||
          selectedFormats.some((format) => item.format.includes(format));
        const matchesType =
          isAudiobookMode ||
          selectedTypes.length === 0 ||
          selectedTypes.includes(item.type);
        const matchesLanguage =
          selectedLanguages.length === 0 ||
          (item.language && selectedLanguages.includes(item.language));
        const matchesComponentType =
          isAudiobookMode ||
          !selectedComponentType ||
          item.componentType === selectedComponentType;

        return (
          matchesCategory &&
          matchesSearch &&
          matchesFormat &&
          matchesType &&
          matchesLanguage &&
          matchesComponentType
        );
      }),
    [
      baseItems,
      isAudiobookMode,
      searchTerm,
      selectedCategories,
      selectedComponentType,
      selectedFormats,
      selectedLanguages,
      selectedTypes,
    ]
  );

  const sortedItems = useMemo(() => {
    const items = [...filteredItems];

    items.sort((left, right) => {
      switch (sortBy) {
        case 'popular':
          return right.reviews - left.reviews || right.rating - left.rating;
        case 'rating':
          return right.rating - left.rating || right.reviews - left.reviews;
        case 'price-asc':
          return parsePriceValue(left.price) - parsePriceValue(right.price);
        case 'price-desc':
          return parsePriceValue(right.price) - parsePriceValue(left.price);
        case 'newest':
        default:
          return (
            getPublishTimestamp(right.publishDate) -
            getPublishTimestamp(left.publishDate)
          );
      }
    });

    return items;
  }, [filteredItems, sortBy]);

  const hasActiveFilters = isAudiobookMode
    ? searchTerm !== '' ||
      selectedCategories.length > 0 ||
      selectedFormats.length > 0 ||
      selectedLanguages.length > 0 ||
      sortBy !== DEFAULT_SORT
    : searchTerm !== '' ||
      selectedCategories.length > 0 ||
      selectedFormats.length > 0 ||
      selectedTypes.length > 0 ||
      selectedLanguages.length > 0 ||
      selectedComponentType !== null ||
      sortBy !== DEFAULT_SORT;

  const handleToggleAudiobookPlay = async () => {
    const audio = audiobookAudioRef.current;
    if (!audio || !selectedAudiobookUrl) return;

    try {
      if (isAudiobookPlaying) {
        audio.pause();
        setIsAudiobookPlaying(false);
        return;
      }

      if (audio.src !== selectedAudiobookUrl) {
        audio.src = selectedAudiobookUrl;
      }

      await audio.play();
      setIsAudiobookPlaying(true);
    } catch {
      setIsAudiobookPlaying(false);
    }
  };

  const handleRatingClick = (rating: number) => {
    setUserRating(rating);
    setCartFeedback(`Rating: ${rating}/5`);
    setTimeout(() => setCartFeedback(null), 2000);
  };

  if (isAudiobookMode) {
    return (
      <div className='min-h-screen bg-gray-50 text-slate-900'>
        <section className='relative overflow-hidden border-b border-gray-200 bg-white'>
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.10),transparent_35%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_32%),linear-gradient(180deg,#ffffff_0%,#f8fafc_62%)]' />
          <div className='absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-300/70 to-transparent' />

          <div className='relative mx-auto max-w-[1300px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14'>
            <button
              onClick={() => router.push('/')}
              className='inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-blue-500 hover:bg-slate-50'
              type='button'
            >
              <ArrowLeftIcon className='h-4 w-4' />
              Back to Home
            </button>

            <div className='mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]'>
              <div className='max-w-4xl'>
                <div className='mt-8 grid gap-4 sm:grid-cols-3'>
                  <div className='rounded-[24px] border border-gray-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]'>
                    <div className='text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500'>
                      Total titles
                    </div>
                    <div className='mt-2 text-3xl font-semibold text-slate-900'>
                      {compactNumber.format(audiobookStats.total)}
                    </div>
                  </div>
                  <div className='rounded-[24px] border border-gray-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]'>
                    <div className='text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500'>
                      Free access
                    </div>
                    <div className='mt-2 text-3xl font-semibold text-slate-900'>
                      {compactNumber.format(audiobookStats.free)}
                    </div>
                  </div>
                  <div className='rounded-[24px] border border-gray-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]'>
                    <div className='text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500'>
                      Categories
                    </div>
                    <div className='mt-2 text-3xl font-semibold text-slate-900'>
                      {compactNumber.format(audiobookStats.categories)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className='mx-auto max-w-[1300px] px-4 py-8 sm:px-6 lg:px-8'>
          <div className='lg:flex lg:gap-8 xl:gap-10'>
            <div className='lg:w-[320px] xl:w-[340px] lg:flex-shrink-0'>
              <AudiobookFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedCategories={selectedCategories}
                setSelectedCategories={setSelectedCategories}
                selectedFormats={selectedFormats}
                setSelectedFormats={setSelectedFormats}
                selectedLanguages={selectedLanguages}
                setSelectedLanguages={setSelectedLanguages}
                categories={audiobookCategories}
                categoryCounts={audiobookCategoryCounts}
                languages={audiobookLanguages}
                languageCounts={audiobookLanguageCounts}
                formats={audiobookFormats}
                formatCounts={audiobookFormatCounts}
                resultsCount={sortedItems.length}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
              />
            </div>

            <div className='mt-6 min-w-0 flex-1 lg:mt-0'>
              <div className='mb-6 rounded-[28px] border border-gray-200 bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.06)] sm:flex sm:items-center sm:justify-between sm:gap-6'>
                <div>
                  <div className='text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500'>
                    Browsing
                  </div>
                  <h2 className='mt-1 font-serif text-2xl text-slate-900'>
                    Audiobooks
                  </h2>
                  <p className='mt-1 text-sm text-slate-500'>
                    {sortedItems.length} result{sortedItems.length === 1 ? '' : 's'} with{' '}
                    {hasActiveFilters ? 'current filters applied' : 'no filters applied'}.
                  </p>
                </div>

                <div className='mt-4 flex flex-wrap items-center gap-3 sm:mt-0 sm:justify-end'>
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className='inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-blue-500 hover:text-slate-900 lg:hidden'
                    type='button'
                  >
                    <FunnelIcon className='h-4 w-4 text-blue-600' />
                    Filters
                  </button>

                  <label className='flex items-center gap-3 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm text-slate-600'>
                    <span className='text-xs font-semibold uppercase tracking-[0.22em] text-slate-500'>
                      Sort
                    </span>
                    <select
                      value={sortBy}
                      onChange={(event) =>
                        setSortBy(event.target.value as AudiobookSortOption)
                      }
                      className='bg-transparent font-medium text-slate-900 outline-none'
                    >
                      {AUDIOBOOK_SORT_OPTIONS.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                          className='bg-white text-slate-900'
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <AudiobookGrid items={sortedItems} />
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <BooksHero banners={heroBanners} />

      <div className='mx-auto max-w-[1300px]'>
        <div className='px-4 py-6 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between'>
            <button
              onClick={() => router.push('/')}
              className='inline-flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-900'
            >
              <ArrowLeftIcon className='h-5 w-5' />
              Back to Home
            </button>
          </div>
        </div>

        <div className='px-4 pb-12 sm:px-6 lg:flex lg:gap-6 lg:px-8 xl:gap-8'>
          <div
            className={`lg:flex-shrink-0 transition-all duration-300 ${
              isFilterSidebarCollapsed ? 'lg:w-12 xl:w-12' : 'lg:w-64 xl:w-62'
            }`}
          >
            {isFilterSidebarCollapsed && (
              <button
                onClick={() => setIsFilterSidebarCollapsed(false)}
                className='hidden h-10 w-10 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-100 hover:text-blue-700 lg:inline-flex'
                type='button'
                aria-label='Show filters'
                title='Show filters'
              >
                <ChevronRightIcon className='h-5 w-5' />
              </button>
            )}
            <BooksSidebar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedCategories={selectedCategories}
              setSelectedCategories={(nextCategories) => {
                setSelectedCategories(nextCategories);
                if (searchTerm) setSearchTerm('');
              }}
              selectedFormats={selectedFormats}
              setSelectedFormats={(nextFormats) => {
                setSelectedFormats(nextFormats);
                if (searchTerm) setSearchTerm('');
              }}
              selectedTypes={selectedTypes}
              setSelectedTypes={(nextTypes) => {
                setSelectedTypes(nextTypes);
                if (searchTerm) setSearchTerm('');
              }}
              selectedLanguages={selectedLanguages}
              setSelectedLanguages={(nextLanguages) => {
                setSelectedLanguages(nextLanguages);
                if (searchTerm) setSearchTerm('');
              }}
              categories={categories.map((category) => category.name)}
              languages={languages.map((language) => language.name)}
              formats={formats}
              categoryCounts={categoryCounts}
              formatCounts={formatCounts}
              languageCounts={languageCounts}
              typeCounts={typeCounts}
              resultsCount={sortedItems.length}
              isSidebarOpen={isSidebarOpen}
              setIsSidebarOpen={setIsSidebarOpen}
              onDesktopCollapse={() => setIsFilterSidebarCollapsed(true)}
              className={isFilterSidebarCollapsed ? 'lg:hidden' : ''}
            />
          </div>

          <div className="flex-1 min-w-0 lg:pt-0">
            {selectedAudiobook && selectedAudiobook.type === 'Audiobook' ? (
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white text-slate-900 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
                  {selectedAudiobookUrl && (
                    <audio ref={audiobookAudioRef} src={selectedAudiobookUrl} preload="metadata" />
                  )}

                  <div className="border-b border-gray-200 p-6 sm:p-8">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="mb-4 inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold tracking-wide text-blue-700">
                          Transcribed
                        </div>

                        <h1 className="line-clamp-3 text-2xl font-bold leading-tight text-slate-900 sm:text-3xl lg:text-4xl">
                          {selectedAudiobook.title}
                        </h1>

                        <div className="mt-2 text-sm text-slate-500">
                          {selectedAudiobook.publishDate
                            ? new Date(selectedAudiobook.publishDate).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : ''}
                          {selectedAudiobook.duration ? ` | ${selectedAudiobook.duration}` : ''}
                        </div>

                        <div className="mt-6 flex flex-wrap items-center gap-3">
                          <button
                            onClick={handleToggleAudiobookPlay}
                            disabled={!selectedAudiobookUrl}
                            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            type="button"
                          >
                            {isAudiobookPlaying ? 'Pause' : 'Play'}
                          </button>

                          <button
                            className="inline-flex items-center rounded-full border border-gray-300 bg-white px-5 py-2.5 text-slate-700 transition hover:border-blue-500 hover:text-slate-900"
                            type="button"
                          >
                            In queue
                          </button>

                          <a
                            href={selectedAudiobookUrl || '#'}
                            download
                            onClick={(event) => {
                              if (!selectedAudiobookUrl) event.preventDefault();
                            }}
                            className="inline-flex items-center rounded-full border border-gray-300 bg-white px-5 py-2.5 text-slate-700 transition hover:border-blue-500 hover:text-slate-900"
                          >
                            Download
                          </a>

                          <button
                            className="inline-flex items-center rounded-full border border-gray-300 bg-white px-5 py-2.5 text-slate-700 transition hover:border-blue-500 hover:text-slate-900"
                            type="button"
                          >
                            Transcript
                          </button>

                          <button
                            className="h-10 w-10 rounded-full border border-gray-300 bg-white text-slate-700 transition hover:border-blue-500 hover:text-slate-900"
                            type="button"
                          >
                            ...
                          </button>

                          <button
                            onClick={() => {
                              setSelectedAudiobook(null);
                              setIsAudiobookPlaying(false);
                              if (audiobookAudioRef.current) {
                                audiobookAudioRef.current.pause();
                              }
                            }}
                            className="ml-auto inline-flex items-center rounded-full border border-gray-300 bg-white px-5 py-2.5 text-slate-700 transition hover:border-blue-500 hover:text-slate-900"
                            type="button"
                          >
                            Back
                          </button>
                        </div>
                      </div>

                      <div className="hidden sm:block flex-shrink-0">
                        <div className="relative h-36 w-36 overflow-hidden rounded-xl border border-gray-200 bg-slate-50 sm:h-40 sm:w-40">
                          {selectedAudiobook.image ? (
                            <Image
                              src={selectedAudiobook.image}
                              alt={selectedAudiobook.title}
                              fill
                              sizes="160px"
                              className="object-contain p-2"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
                              No Image
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 sm:p-8">
                    <div className="mb-3 text-lg font-semibold text-slate-900">Description</div>
                    <div className="whitespace-pre-line text-sm leading-relaxed text-slate-600 sm:text-base">
                      {selectedAudiobook.description}
                    </div>

                    <div className="mt-10">
                      <div className="mb-3 text-lg font-semibold text-slate-900">Information</div>
                      <div className="text-sm text-slate-700 sm:text-base">
                        <div className="flex justify-between gap-4 border-b border-gray-200 py-3">
                          <span className="text-slate-500">Author</span>
                          <span className="text-right">{selectedAudiobook.author}</span>
                        </div>
                        <div className="flex justify-between gap-4 border-b border-gray-200 py-3">
                          <span className="text-slate-500">Category</span>
                          <span className="text-right">{selectedAudiobook.category}</span>
                        </div>
                        <div className="flex justify-between gap-4 py-3">
                          <span className="text-slate-500">Tags</span>
                          <span className="text-right break-words max-w-[70%]">
                            {selectedAudiobook.tags?.map((tag) => `#${tag}`).join(' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8">
                      <div className="mb-3 text-lg font-semibold text-slate-900">Rating</div>
                      <button
                        onClick={() => handleRatingClick(Math.min(5, Math.max(1, userRating || Math.round(selectedAudiobook.rating) || 1)))}
                        className="text-sm text-blue-700 underline underline-offset-4"
                      >
                        Current rating: {userRating || selectedAudiobook.rating}
                      </button>
                      {cartFeedback && (
                        <div className="mt-3 text-sm text-emerald-400">{cartFeedback}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <BooksGrid
                items={sortedItems}
                className="bg-gray-50"
                onFilterClick={() => setIsSidebarOpen(true)}
                hasActiveFilters={hasActiveFilters}
                desktopColumns={isFilterSidebarCollapsed ? 5 : 4}
                onAudiobookSelect={(item) => {
                  if (item.type !== 'Audiobook') return;
                  router.push('/books?type=Audiobook');
                  setIsAudiobookPlaying(false);
                  if (audiobookAudioRef.current) {
                    audiobookAudioRef.current.pause();
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
