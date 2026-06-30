'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { API_CONFIG } from '@/config/api';
import AudiobookFilters from '@/components/ui/audiobooks/AudiobookFilters';
import AudiobookGrid from '@/components/ui/audiobooks/AudiobookGrid';
import {
  AUDIOBOOK_SORT_OPTIONS,
  isAudiobookSortOption,
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

export default function AudiobooksPage() {
  const router = useRouter();
  const [audiobooks, setAudiobooks] = useState<PublicBookListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<AudiobookSortOption>(DEFAULT_SORT);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
  const formats = useMemo(
    () => Object.keys(buildFormatCounts(audiobooks)).sort(),
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
  const formatCounts = useMemo(
    () => buildFormatCounts(audiobooks),
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

  const compactNumber = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1,
      }),
    []
  );

  const audiobookStats = useMemo(() => {
    const freeTitles = audiobooks.filter(
      (item) => parsePriceValue(item.price) === 0
    ).length;

    return {
      total: audiobooks.length,
      free: freeTitles,
      premium: audiobooks.length - freeTitles,
      categories: categories.length,
    };
  }, [audiobooks, categories.length]);

  return (
    <div className='min-h-screen bg-gray-50 text-slate-900'>
      <section className='relative overflow-hidden border-b border-gray-200 bg-white'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.10),transparent_35%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_32%),linear-gradient(180deg,#ffffff_0%,#f8fafc_62%)]' />
        <div className='absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-300/70 to-transparent' />

        <div className='relative mx-auto max-w-[1500px]  sm:px-1 lg:px-7 lg:py-3'>
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

      <section className='mx-auto max-w-[1500px] sm:px-6 lg:px-4'>
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
              categories={categories}
              categoryCounts={categoryCounts}
              languages={languages}
              languageCounts={languageCounts}
              formats={formats}
              formatCounts={formatCounts}
              resultsCount={sortedItems.length}
              isSidebarOpen={isSidebarOpen}
              setIsSidebarOpen={setIsSidebarOpen}
              stats={{
                total: compactNumber.format(audiobookStats.total),
                free: compactNumber.format(audiobookStats.free),
                categories: compactNumber.format(audiobookStats.categories),
              }}
            />
          </div>

          <div className='mt-6 min-w-0 flex-1 lg:mt-0'>
            <div className='mb-6 rounded-[28px] border border-gray-200 bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.06)] sm:flex sm:items-center sm:justify-between sm:gap-6'>
              <div>
                <div className='text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500'>
                  Browsing
                </div>
                <h2 className='mt-1 font-serif text-2xl text-slate-900'>
                  New Release Audiobooks
                </h2>
                <p className='mt-1 text-sm text-slate-500'>
                  {sortedItems.length} result{sortedItems.length === 1 ? '' : 's'} with current filters applied.
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
                      setSortBy(
                        isAudiobookSortOption(event.target.value)
                          ? event.target.value
                          : DEFAULT_SORT
                      )
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
