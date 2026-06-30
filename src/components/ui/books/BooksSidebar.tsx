'use client';

import React from 'react';
import {
  ChevronLeftIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface BooksSidebarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  selectedFormats: string[];
  setSelectedFormats: (formats: string[]) => void;
  selectedTypes: string[];
  setSelectedTypes: (types: string[]) => void;
  selectedLanguages: string[];
  setSelectedLanguages: (languages: string[]) => void;
  categories: string[];
  languages: string[];
  formats: string[];
  categoryCounts?: Record<string, number>;
  formatCounts?: Record<string, number>;
  languageCounts?: Record<string, number>;
  typeCounts?: Record<string, number>;
  resultsCount: number;
  className?: string;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  onDesktopCollapse?: () => void;
}

export default function BooksSidebar({
  searchTerm,
  setSearchTerm,
  selectedCategories,
  setSelectedCategories,
  selectedFormats,
  setSelectedFormats,
  selectedTypes,
  setSelectedTypes,
  selectedLanguages,
  setSelectedLanguages,
  categories,
  languages,
  formats,
  categoryCounts = {},
  formatCounts = {},
  languageCounts = {},
  typeCounts = {},
  resultsCount,
  className = '',
  isSidebarOpen,
  setIsSidebarOpen,
  onDesktopCollapse
}: BooksSidebarProps) {

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedFormats([]);
    setSelectedTypes([]);
    setSelectedLanguages([]);
  };

  const hasActiveFilters = 
    searchTerm !== '' || 
    selectedCategories.length > 0 || 
    selectedFormats.length > 0 || 
    selectedTypes.length > 0 ||
    selectedLanguages.length > 0;

  const activeFilterCount =
    (searchTerm ? 1 : 0) +
    selectedCategories.length +
    selectedFormats.length +
    selectedTypes.length +
    selectedLanguages.length;

  const CountBadge = ({ count }: { count: number }) => (
    <span className="ml-auto inline-flex min-w-6 items-center justify-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
      {count}
    </span>
  );

  const SidebarContent = () => (
    <div className="h-full lg:h-auto bg-white border-r lg:border border-gray-200 lg:rounded-xl lg:shadow-sm flex flex-col">
      {/* Header */}
      <div className="p-4 lg:p-6 border-b border-gray-200 bg-white lg:bg-gray-50 lg:rounded-t-xl sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <FunnelIcon className="w-5 h-5 mr-2 text-gray-600" />
            Filters
          </h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden rounded-md bg-blue-50 p-2 text-blue-600 transition-colors hover:bg-blue-100"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
          <div className="hidden items-center gap-2 lg:flex">
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600 transition-colors hover:border-blue-200 hover:bg-blue-100"
                type="button"
                title={`Clear ${activeFilterCount} active filter${activeFilterCount === 1 ? '' : 's'}`}
              >
                <XMarkIcon className="h-3.5 w-3.5" />
                All Clear
              </button>
            ) : (
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                All Clear
              </span>
            )}
            {onDesktopCollapse && (
              <button
                onClick={onDesktopCollapse}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-blue-100 bg-blue-50 text-blue-600 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-100 hover:text-blue-700"
                type="button"
                aria-label="Hide filters"
                title="Hide filters"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Content */}
      <div className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search books..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Format */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Format</label>
          <div className="space-y-2">
            {formats.map(format => (
              <label key={format} className="flex items-center group cursor-pointer">
                <input
                  type="checkbox"
                  value={format}
                  checked={selectedFormats.includes(format)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedFormats([...selectedFormats, format]);
                    } else {
                      setSelectedFormats(selectedFormats.filter(fmt => fmt !== format));
                    }
                  }}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="ml-2 text-sm text-gray-700">{format}</span>
                <CountBadge count={formatCounts[format] ?? 0} />
              </label>
            ))}
          </div>
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Type</label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                value="Books"
                checked={selectedTypes.includes('Books')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedTypes([...selectedTypes, 'Books']);
                  } else {
                    setSelectedTypes(selectedTypes.filter(type => type !== 'Books'));
                  }
                }}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="ml-2 text-sm text-gray-700">Books</span>
              <CountBadge count={typeCounts.Books ?? 0} />
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                value="Audiobook"
                checked={selectedTypes.includes('Audiobook')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedTypes([...selectedTypes, 'Audiobook']);
                  } else {
                    setSelectedTypes(selectedTypes.filter(type => type !== 'Audiobook'));
                  }
                }}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="ml-2 text-sm text-gray-700">Audiobooks</span>
              <CountBadge count={typeCounts.Audiobook ?? 0} />
            </label>
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Language</label>
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
            {languages.map(language => (
              <label key={language} className="flex items-center group cursor-pointer">
                <input
                  type="checkbox"
                  value={language}
                  checked={selectedLanguages.includes(language)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedLanguages([...selectedLanguages, language]);
                    } else {
                      setSelectedLanguages(selectedLanguages.filter(lang => lang !== language));
                    }
                  }}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                />
                <span className="ml-2 text-sm text-gray-700 group-hover:text-blue-600 transition-colors">{language}</span>
                <CountBadge count={languageCounts[language] ?? 0} />
              </label>
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Category</label>
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
            {categories.filter(cat => cat !== 'All Books').map(category => (
              <label key={category} className="flex items-center group cursor-pointer">
                <input
                  type="checkbox"
                  value={category}
                  checked={selectedCategories.includes(category)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCategories([...selectedCategories, category]);
                    } else {
                      setSelectedCategories(selectedCategories.filter(cat => cat !== category));
                    }
                  }}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                />
                <span className="ml-2 text-sm text-gray-700 group-hover:text-blue-600 transition-colors">{category}</span>
                <CountBadge count={categoryCounts[category] ?? 0} />
              </label>
            ))}
          </div>
        </div>

      </div>

      {/* Sticky Footer - Results and Clear */}
      <div className="p-4 lg:p-6 border-t border-gray-200 bg-white lg:bg-gray-50 lg:rounded-b-xl sticky bottom-0">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {resultsCount} result{resultsCount !== 1 ? 's' : ''}
          </span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear all
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

            {/* Sidebar */}
      <div className={`
        fixed lg:static
        top-0 lg:top-0
        left-0 h-screen lg:h-auto
        w-80 lg:w-full
        z-50 lg:z-10
        transform lg:transform-none transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${className}
      `}>
        <SidebarContent />
      </div>
    </>
  );
}
