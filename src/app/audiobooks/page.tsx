'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, ChevronRightIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { API_CONFIG } from '@/config/api';
import BooksSidebar from '@/components/ui/books/BooksSidebar';
import AudiobookGrid from '@/components/ui/audiobooks/AudiobookGrid';
import TopTrendingStrip from '@/components/ui/books/TopTrendingStrip';
import {
  parsePriceValue,
  type AudiobookSortOption,
} from '@/lib/audiobooks';
import type { PublicBookListItem } from '@/types/publicBook';

const API_URL = API_CONFIG.API_BASE_URL;
const DEFAULT_SORT: AudiobookSortOption = 'newest';

function buildCounts(values: Array<string | null | undefined>) {
  return values.reduce<Record<string, number>>((accumulator, value) => {
    if (!value) return accumulator;

    accumulator[value] = (accumulator[value] ?? 0) + 1;
    return accumulator;
  }, {});
}

function getPublishTimestamp(value?: string) {
  if (!value) return 0;

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export default function AudiobooksPage() {
  const router = useRouter();
  const [audiobooks, setAudiobooks] = useState<PublicBookListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['Audiobook']);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<AudiobookSortOption>(DEFAULT_SORT);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFilterSidebarCollapsed, setIsFilterSidebarCollapsed] = useState(false);

  useEffect(() => {
    const fetchAudiobooks = async () => {
      try {
        const response = await fetch(`${API_URL}/audiobooks?view=listing`);
        if (!response.ok) return;

        const data = await response.json();
        const rows = Array.isArray(data) ? data : data.data || [];
        setAudiobooks(rows);
      } catch (error) {
        console.error('Error fetching audiobooks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAudiobooks();
  }, []);

  const categories = useMemo(
    () => Object.keys(buildCounts(audiobooks.map((item) => item.category))).sort(),
    [audiobooks]
  );
  const languages = useMemo(
    () => Object.keys(buildCounts(audiobooks.map((item) => item.language))).sort(),
    [audiobooks]
  );
  const categoryCounts = useMemo(
    () => buildCounts(audiobooks.map((item) => item.category)),
    [audiobooks]
  );
  const languageCounts = useMemo(
    () => buildCounts(audiobooks.map((item) => item.language)),
    [audiobooks]
  );
  const filteredItems = useMemo(
    () =>
      audiobooks.filter((item) => {
        const normalizedSearch = searchTerm.toLowerCase();
        const matchesSearch =
          normalizedSearch === '' ||
          item.title.toLowerCase().includes(normalizedSearch) ||
          item.author.toLowerCase().includes(normalizedSearch) ||
          item.description.toLowerCase().includes(normalizedSearch) ||
          item.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch));
        const matchesCategory =
          selectedCategories.length === 0 ||
          selectedCategories.includes(item.category);
        const matchesLanguage =
          selectedLanguages.length === 0 ||
          (item.language && selectedLanguages.includes(item.language));
        const matchesFormat =
          selectedFormats.length === 0 ||
          selectedFormats.some((format) => item.format.includes(format));

        return matchesSearch && matchesCategory && matchesLanguage && matchesFormat;
      }),
    [audiobooks, searchTerm, selectedCategories, selectedLanguages, selectedFormats]
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

  return (
    <div className='min-h-screen bg-gradient-to-r from-blue-100/80 via-indigo-100/70 to-purple-100/60 text-slate-900'>
      <TopTrendingStrip
        title='Top 10 Trending Audiobook in India'
        subtitle='Check out the most popular and trending audiobooks right now.'
        items={audiobooks}
        viewAllHref='/audiobooks'
        itemHrefPrefix='/audiobooks'
      />

      <section className='relative overflow-hidden border-b border-gray-200 bg-white'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.10),transparent_35%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_32%),linear-gradient(180deg,#ffffff_0%,#f8fafc_62%)]' />
        <div className='absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-300/70 to-transparent' />

        <div className='relative mx-auto max-w-[1300px]  sm:px-1 lg:px-7 lg:py-3'>
          <button
            onClick={() => router.push('/')}
            className='inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-blue-500 hover:bg-slate-50'
            type='button'
          >
            <ArrowLeftIcon className='h-4 w-4' />
            Back to Home
          </button>

        </div>
      </section>

      <section className='mx-auto max-w-[1300px] sm:px-6 lg:px-4'>
        <div className='lg:flex lg:gap-8 xl:gap-10'>
          <div
            className={`lg:flex-shrink-0 transition-all duration-300 ${
              isFilterSidebarCollapsed ? 'lg:w-12 xl:w-12' : 'lg:w-[320px] xl:w-[340px]'
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
              setSelectedCategories={setSelectedCategories}
              selectedFormats={selectedFormats}
              setSelectedFormats={setSelectedFormats}
              selectedTypes={selectedTypes}
              setSelectedTypes={setSelectedTypes}
              selectedLanguages={selectedLanguages}
              setSelectedLanguages={setSelectedLanguages}
              categories={categories}
              categoryCounts={categoryCounts}
              languages={languages}
              languageCounts={languageCounts}
              formats={[]}
              formatCounts={{}}
              typeCounts={{ Audiobook: audiobooks.length }}
              sortBy={sortBy}
              setSortBy={setSortBy}
              resultsCount={sortedItems.length}
              isSidebarOpen={isSidebarOpen}
              setIsSidebarOpen={setIsSidebarOpen}
              searchPlaceholder='Search audiobooks...'
              lockedType='Audiobook'
              onDesktopCollapse={() => setIsFilterSidebarCollapsed(true)}
              className={isFilterSidebarCollapsed ? 'lg:hidden' : ''}
            />
          </div>

          <div className='mt-6 min-w-0 flex-1 lg:mt-0'>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className='mb-4 inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-blue-500 hover:text-slate-900 lg:hidden'
              type='button'
            >
              <FunnelIcon className='h-4 w-4 text-blue-600' />
              Filters
            </button>

            <AudiobookGrid items={sortedItems} />
          </div>
        </div>
      </section>
    </div>
  );
}
