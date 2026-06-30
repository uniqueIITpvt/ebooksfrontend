'use client';

import { useState } from 'react';
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

interface BooksFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedFormat: string;
  setSelectedFormat: (format: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  categories: string[];
  formats: string[];
  resultsCount: number;
  className?: string;
}

export default function BooksFilters({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedFormat,
  setSelectedFormat,
  selectedType,
  setSelectedType,
  categories,
  formats,
  resultsCount,
  className = ''
}: BooksFiltersProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All Categories');
    setSelectedFormat('All Formats');
    setSelectedType('All Types');
  };

  const hasActiveFilters = 
    searchTerm !== '' || 
    selectedCategory !== 'All Categories' || 
    selectedFormat !== 'All Formats' || 
    selectedType !== 'All Types';

  return (
    <section className={`
      py-3 xs:py-4 sm:py-6 md:py-8 
      bg-white/95 backdrop-blur-sm 
      border-b border-gray-200 
      sticky top-0 z-20 
      shadow-sm
      ${className}
    `}>
      <div className='max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8'>
        {/* Mobile Layout */}
        <div className='block lg:hidden'>
          {/* Mobile Search Bar */}
          <div className='relative mb-3 xs:mb-4'>
            <MagnifyingGlassIcon className='absolute left-3 xs:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 xs:w-5 xs:h-5 text-gray-400' />
            <input
              type='text'
              placeholder='Search books, authors, topics...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='
                w-full pl-10 xs:pl-12 pr-4 py-3 xs:py-3.5
                border border-gray-300 rounded-xl xs:rounded-2xl 
                text-sm xs:text-base
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                bg-white shadow-sm
              '
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
              >
                <XMarkIcon className='w-5 h-5' />
              </button>
            )}
          </div>

          {/* Mobile Filter Toggle & Results */}
          <div className='flex items-center justify-between'>
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className='
                flex items-center gap-2 px-4 py-2.5 
                bg-gray-100 hover:bg-gray-200 
                rounded-xl text-sm font-medium
                transition-colors duration-200
              '
            >
              <AdjustmentsHorizontalIcon className='w-4 h-4' />
              Filters
              {hasActiveFilters && (
                <span className='bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full'>
                  •
                </span>
              )}
            </button>

            <div className='flex items-center gap-3'>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className='text-sm text-blue-600 hover:text-blue-800 font-medium'
                >
                  Clear all
                </button>
              )}
              <div className='text-xs xs:text-sm text-gray-600 whitespace-nowrap'>
                {resultsCount} item{resultsCount !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Mobile Filters Dropdown */}
          {showMobileFilters && (
            <div className='mt-4 p-4 bg-gray-50 rounded-xl border space-y-4'>
              {/* Category Filter */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className='
                    w-full px-3 py-2.5 
                    border border-gray-300 rounded-lg 
                    text-sm bg-white
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  '
                >
                  <option value='All Categories'>All Categories</option>
                  {categories.filter(cat => cat !== 'All Books').map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Content Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className='
                    w-full px-3 py-2.5 
                    border border-gray-300 rounded-lg 
                    text-sm bg-white
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  '
                >
                  <option value='All Types'>All Types</option>
                  <option value='Books'>Reading Books</option>
                  <option value='Audiobook'>Audiobooks</option>
                </select>
              </div>

              {/* Format Filter */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Format
                </label>
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className='
                    w-full px-3 py-2.5 
                    border border-gray-300 rounded-lg 
                    text-sm bg-white
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  '
                >
                  <option value='All Formats'>All Formats</option>
                  {formats.map(format => (
                    <option key={format} value={format}>{format}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Layout */}
        <div className='hidden lg:block'>
          <div className='flex items-center gap-6'>
            {/* Desktop Search */}
            <div className='relative flex-1 max-w-md'>
              <MagnifyingGlassIcon className='absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
              <input
                type='text'
                placeholder='Search books, authors, topics...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='
                  w-full pl-12 pr-4 py-3.5 
                  border border-gray-300 rounded-2xl 
                  text-base bg-white shadow-sm
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                '
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className='absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                >
                  <XMarkIcon className='w-5 h-5' />
                </button>
              )}
            </div>

            {/* Desktop Filters */}
            <div className='flex items-center gap-4'>
              {/* Category Filter */}
              <div className='relative'>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className='
                    appearance-none bg-white border border-gray-300 
                    rounded-xl px-4 py-3.5 pr-10 text-base
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    min-w-[180px] shadow-sm
                  '
                >
                  <option value='All Categories'>All Categories</option>
                  {categories.filter(cat => cat !== 'All Books').map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <FunnelIcon className='absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none' />
              </div>

              {/* Type Filter */}
              <div className='relative'>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className='
                    appearance-none bg-white border border-gray-300 
                    rounded-xl px-4 py-3.5 pr-10 text-base
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    min-w-[150px] shadow-sm
                  '
                >
                  <option value='All Types'>All Types</option>
                  <option value='Books'>Reading Books</option>
                  <option value='Audiobook'>Audiobooks</option>
                </select>
                <FunnelIcon className='absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none' />
              </div>

              {/* Format Filter */}
              <div className='relative'>
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className='
                    appearance-none bg-white border border-gray-300 
                    rounded-xl px-4 py-3.5 pr-10 text-base
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    min-w-[140px] shadow-sm
                  '
                >
                  <option value='All Formats'>All Formats</option>
                  {formats.map(format => (
                    <option key={format} value={format}>{format}</option>
                  ))}
                </select>
                <FunnelIcon className='absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none' />
              </div>

              {/* Results and Clear */}
              <div className='flex items-center gap-4 ml-2'>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className='text-sm text-blue-600 hover:text-blue-800 font-medium'
                  >
                    Clear all
                  </button>
                )}
                <div className='text-sm text-gray-600 whitespace-nowrap font-medium'>
                  {resultsCount} item{resultsCount !== 1 ? 's' : ''} found
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
