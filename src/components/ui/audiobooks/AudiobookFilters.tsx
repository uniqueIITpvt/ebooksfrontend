'use client';

import {
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface AudiobookFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  selectedFormats: string[];
  setSelectedFormats: (formats: string[]) => void;
  selectedLanguages: string[];
  setSelectedLanguages: (languages: string[]) => void;
  categories: string[];
  categoryCounts: Record<string, number>;
  languages: string[];
  languageCounts: Record<string, number>;
  formats: string[];
  formatCounts: Record<string, number>;
  resultsCount: number;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  stats?: {
    total: string;
    free: string;
    categories: string;
  };
}

function FilterOption({
  label,
  value,
  count,
  checked,
  onToggle,
}: {
  label: string;
  value: string;
  count: number;
  checked: boolean;
  onToggle: (value: string) => void;
}) {
  return (
    <label className='group flex cursor-pointer items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 transition hover:border-blue-200 hover:bg-blue-50'>
      <input
        type='checkbox'
        checked={checked}
        onChange={() => onToggle(value)}
        className='h-4 w-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-500'
      />
      <span className='flex-1 text-sm text-gray-700 transition group-hover:text-blue-700'>
        {label}
      </span>
      <span className='rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[11px] text-gray-500'>
        {count}
      </span>
    </label>
  );
}

export default function AudiobookFilters({
  searchTerm,
  setSearchTerm,
  selectedCategories,
  setSelectedCategories,
  selectedFormats,
  setSelectedFormats,
  selectedLanguages,
  setSelectedLanguages,
  categories,
  categoryCounts,
  languages,
  languageCounts,
  formats,
  formatCounts,
  resultsCount,
  isSidebarOpen,
  setIsSidebarOpen,
  stats,
}: AudiobookFiltersProps) {
  const hasActiveFilters =
    searchTerm !== '' ||
    selectedCategories.length > 0 ||
    selectedFormats.length > 0 ||
    selectedLanguages.length > 0;

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedFormats([]);
    setSelectedLanguages([]);
  };

  const toggleSingleValue = (
    currentValues: string[],
    nextValue: string,
    setter: (value: string[]) => void
  ) => {
    if (currentValues.includes(nextValue)) {
      setter([]);
      return;
    }

    setter([nextValue]);
  };

  const SidebarContent = () => (
    <div className='flex h-full flex-col overflow-hidden border-r border-gray-200 bg-white lg:h-auto lg:rounded-[28px] lg:border lg:border-gray-200 lg:shadow-[0_20px_50px_rgba(15,23,42,0.06)]'>
      <div className='sticky top-0 z-10 border-b border-gray-200 bg-white px-5 py-4 lg:rounded-t-[28px]'>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <div className='flex items-center gap-2 text-sm font-semibold text-gray-900'>
              <FunnelIcon className='h-4 w-4 text-blue-600' />
              Filters
            </div>
            <p className='mt-1 text-xs text-gray-500'>
              Refine the audiobook collection
            </p>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className='rounded-full border border-gray-200 p-2 text-gray-500 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 lg:hidden'
            type='button'
            aria-label='Close filters'
          >
            <XMarkIcon className='h-5 w-5' />
          </button>
        </div>
      </div>

      <div className='flex-1 space-y-6 overflow-y-auto px-5 py-5'>
        {stats ? (
          <div className='grid grid-cols-3 gap-2'>
            {[
              { label: 'Titles', value: stats.total, className: 'border-[#0057b8]/25 bg-[#0057b8]/8 text-[#0057b8]' },
              { label: 'Free', value: stats.free, className: 'border-[#f28c18]/30 bg-[#f28c18]/10 text-[#f28c18]' },
              { label: 'Topics', value: stats.categories, className: 'border-[#0057b8]/25 bg-white text-[#0057b8]' },
            ].map((item) => (
              <div key={item.label} className={`rounded-2xl border px-3 py-3 ${item.className}`}>
                <div className='text-[8px] font-bold uppercase tracking-[0.16em]'>
                  {item.label}
                </div>
                <div className='mt-1 text-lg font-bold'>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div>
          <label className='mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-[#736a81]'>
            Search
          </label>
          <div className='relative'>
            <MagnifyingGlassIcon className='pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
            <input
              type='text'
              placeholder='Search audiobooks...'
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className='w-full rounded-2xl border border-gray-300 bg-white py-3 pl-11 pr-10 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                type='button'
                className='absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition hover:text-blue-700'
                aria-label='Clear search'
              >
                <XMarkIcon className='h-4 w-4' />
              </button>
            )}
          </div>
        </div>

        <div>
          <div className='mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-500'>
            Language
          </div>
          <div className='space-y-1.5'>
            {languages.map((language) => (
              <FilterOption
                key={language}
                label={language}
                value={language}
                count={languageCounts[language] ?? 0}
                checked={selectedLanguages.includes(language)}
                onToggle={(value) =>
                  toggleSingleValue(
                    selectedLanguages,
                    value,
                    setSelectedLanguages
                  )
                }
              />
            ))}
          </div>
        </div>

        <div>
          <div className='mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-500'>
            Category
          </div>
          <div className='space-y-1.5'>
            {categories.map((category) => (
              <FilterOption
                key={category}
                label={category}
                value={category}
                count={categoryCounts[category] ?? 0}
                checked={selectedCategories.includes(category)}
                onToggle={(value) =>
                  toggleSingleValue(
                    selectedCategories,
                    value,
                    setSelectedCategories
                  )
                }
              />
            ))}
          </div>
        </div>

        <div>
          <div className='mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-500'>
            Format
          </div>
          <div className='space-y-1.5'>
            {formats.map((format) => (
              <FilterOption
                key={format}
                label={format}
                value={format}
                count={formatCounts[format] ?? 0}
                checked={selectedFormats.includes(format)}
                onToggle={(value) =>
                  toggleSingleValue(selectedFormats, value, setSelectedFormats)
                }
              />
            ))}
          </div>
        </div>
      </div>

      <div className='sticky bottom-0 border-t border-gray-200 bg-white px-5 py-4 lg:rounded-b-[28px]'>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <div className='text-sm font-semibold text-gray-900'>
              {resultsCount} result{resultsCount === 1 ? '' : 's'}
            </div>
            <div className='text-xs text-gray-500'>Current audiobook matches</div>
          </div>
          {hasActiveFilters ? (
            <button
              onClick={clearFilters}
              className='rounded-full border border-gray-300 px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:border-blue-500 hover:bg-blue-50'
              type='button'
            >
              Clear all
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {isSidebarOpen ? (
        <div
          className='fixed inset-0 z-40 bg-slate-900/40 lg:hidden'
          onClick={() => setIsSidebarOpen(false)}
        />
      ) : null}

      <div
        className={`fixed left-0 top-0 z-50 h-screen w-[88vw] max-w-sm transform transition-transform duration-300 ease-out lg:static lg:z-auto lg:h-auto lg:w-full lg:max-w-none lg:transform-none ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <SidebarContent />
      </div>
    </>
  );
}
