'use client';

import { useState, useEffect, useRef } from 'react';
import { categoriesApi } from '@/services/api/categoriesApi';

// Custom CSS for scrollbar hiding
const customStyles = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  BookOpenIcon,
  TagIcon,
  ClockIcon,
  FireIcon,
  UserIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { Button } from './Button';
import Image from 'next/image';

// Type definitions for search results
interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'book' | 'topic';
  image?: string;
  author?: string;
  duration?: string;
  views?: string;
  category?: string;
  url?: string;
}

// Sample search data
const searchData: SearchResult[] = [
  // Books
  {
    id: 'book-1',
    title: 'Public Speaking Mastery',
    description: 'Overcome anxiety and master the art of confident public speaking with proven strategies.',
    type: 'book',
    image: '/books/Blue & Orange Playful Illustrative Public Speaking Book Cover.jpg',
    author: 'UniqueIIT Research Center',
    category: 'Self-Help',
    url: '/books/public-speaking-mastery',
  },
  {
    id: 'book-2',
    title: 'Mind Matters: Mental Wellness',
    description: 'Essential guide to maintaining productivity and building resilience in daily life.',
    type: 'book',
    image: '/books/Navy and Pink Illustrated Mind Matters Book Cover.jpg',
    author: 'UniqueIIT Research Center',
    category: 'Self-Help',
    url: '/books/mind-matters',
  },
  {
    id: 'book-3',
    title: 'Modern Psychology Insights',
    description: 'Comprehensive guide to understanding modern psychological approaches and therapeutic techniques.',
    type: 'book',
    image: '/books/Black and White Modern Psychology Book Cover.jpg',
    author: 'UniqueIIT Research Center',
    category: 'Psychology',
    url: '/books/modern-psychology',
  },

  // Topics/Categories
  {
    id: 'topic-1',
    title: 'Anxiety Disorders',
    description: 'Comprehensive resources about anxiety disorders, symptoms, and treatment options.',
    type: 'topic',
    category: 'Self-Help',
    url: '/treatment/anxiety',
  },
  {
    id: 'topic-2',
    title: 'Depression Treatment',
    description: 'Evidence-based approaches to treating depression and mood disorders.',
    type: 'topic',
    category: 'Treatment',
    url: '/treatment/depression',
  },
  {
    id: 'topic-3',
    title: 'Stress Management',
    description: 'Effective techniques and strategies for managing stress in daily life.',
    type: 'topic',
    category: 'Wellness',
    url: '/treatment/stress',
  },
  {
    id: 'topic-4',
    title: 'Couples Therapy',
    description: 'Relationship counseling and therapy for couples facing challenges.',
    type: 'topic',
    category: 'Therapy',
    url: '/treatment/couples',
  },
];


interface SearchComponentProps {
  isOpen: boolean;
  onClose: () => void;
  variant?: 'dropdown' | 'modal' | 'inline';
  placeholder?: string;
}

export default function SearchComponent({
  isOpen,
  onClose,
  variant = 'dropdown',
  placeholder = 'Search books, topics...',
}: SearchComponentProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularTopics, setPopularTopics] = useState<string[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch popular topics (categories) from API
  useEffect(() => {
    if (isOpen) {
      setIsLoadingTopics(true);
      categoriesApi.getForSelect()
        .then(categories => {
          // Get category names, limit to top 6
          const topicNames = categories.slice(0, 6).map(cat => cat.label);
          setPopularTopics(topicNames.length > 0 ? topicNames : ['Books', 'Summaries', 'Audiobooks']);
        })
        .catch(error => {
          console.error('Error fetching categories:', error);
          setPopularTopics(['Books', 'Summaries', 'Audiobooks']);
        })
        .finally(() => {
          setIsLoadingTopics(false);
        });
    }
  }, [isOpen]);

  // Handle search functionality
  useEffect(() => {
    if (searchTerm.trim()) {
      setIsLoading(true);
      // Simulate API delay
      const timer = setTimeout(() => {
        const filtered = searchData.filter((item) => {
          const matchesSearch = 
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.author?.toLowerCase().includes(searchTerm.toLowerCase());
          
          const matchesType = selectedType === 'all' || item.type === selectedType;
          
          return matchesSearch && matchesType;
        });
        setResults(filtered);
        setIsLoading(false);
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setResults([]);
    }
  }, [searchTerm, selectedType]);


  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Auto focus input when opened and inject custom styles
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }

    // Inject custom styles
    const styleElement = document.createElement('style');
    styleElement.textContent = customStyles;
    document.head.appendChild(styleElement);

    return () => {
      if (styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
    };
  }, [isOpen]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim() && !recentSearches.includes(term)) {
      setRecentSearches((prev) => [term, ...prev.slice(0, 4)]);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.url) {
      window.location.href = result.url;
    }
    onClose();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'book':
        return <BookOpenIcon className='w-4 h-4' />;
      case 'topic':
        return <TagIcon className='w-4 h-4' />;
      default:
        return <MagnifyingGlassIcon className='w-4 h-4' />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'book':
        return 'text-indigo-600 bg-indigo-50';
      case 'topic':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  if (!isOpen) return null;

  // Render based on variant
  const renderContent = () => (
    <div 
      ref={searchRef}
      className={`
        ${variant === 'modal' 
          ? 'fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm' 
          : variant === 'dropdown'
          ? 'absolute right-0 mt-2 w-full max-w-[calc(100vw-1rem)] sm:w-96 md:w-[28rem] lg:w-96 z-50'
          : 'w-full'
        }
      `}
    >
      <div 
        className={`
          bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden
          ${variant === 'modal' ? 'w-full max-w-2xl mt-8 sm:mt-20' : 'w-full'}
        `}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Search Header */}
        <div className='p-3 sm:p-4 border-b border-slate-100 bg-white'>
          <div className='flex items-center space-x-2 sm:space-x-3'>
            <MagnifyingGlassIcon className='w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0' />
            <input
              ref={inputRef}
              type='text'
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={placeholder}
              className='flex-1 bg-transparent border-none outline-none text-slate-700 placeholder-slate-400 text-sm min-w-0'
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className='text-slate-400 hover:text-slate-600 p-1 flex-shrink-0'
              >
                <XMarkIcon className='w-4 h-4' />
              </button>
            )}
            {variant === 'modal' && (
              <button
                onClick={onClose}
                className='text-slate-400 hover:text-slate-600 p-1 flex-shrink-0'
              >
                <XMarkIcon className='w-4 h-4 sm:w-5 sm:h-5' />
              </button>
            )}
          </div>

          {/* Filter Tabs - Mobile friendly */}
          <div className='flex items-center space-x-1 sm:space-x-2 mt-2 sm:mt-3 overflow-x-auto scrollbar-hide'>
            {[
              { key: 'all', label: 'All', icon: <MagnifyingGlassIcon className='w-3 h-3' /> },
              { key: 'book', label: 'Books', icon: <BookOpenIcon className='w-3 h-3' /> },
              { key: 'topic', label: 'Topics', icon: <TagIcon className='w-3 h-3' /> },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setSelectedType(filter.key)}
                className={`
                  flex items-center space-x-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex-shrink-0
                  ${selectedType === filter.key
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-slate-600 hover:bg-slate-100 border border-transparent'
                  }
                `}
              >
                {filter.icon}
                <span className='hidden sm:inline'>{filter.label}</span>
                <span className='sm:hidden'>{filter.label.slice(0, 1)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search Content */}
        <div className='max-h-80 sm:max-h-96 overflow-y-auto bg-white'>
          {/* Loading State */}
          {isLoading && (
            <div className='flex items-center justify-center py-8'>
              <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600'></div>
              <span className='ml-3 text-sm text-slate-600'>Searching...</span>
            </div>
          )}

          {/* No Search Term - Show Recent Searches or Popular */}
          {!searchTerm && !isLoading && (
            <div className='p-3 sm:p-4 bg-white'>
              {recentSearches.length > 0 ? (
                <>
                  <h3 className='text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3'>
                    Recent Searches
                  </h3>
                  <div className='space-y-1 sm:space-y-2'>
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearch(search)}
                        className='flex items-center w-full p-2 text-left text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors'
                      >
                        <ClockIcon className='w-4 h-4 mr-2 sm:mr-3 text-slate-400 flex-shrink-0' />
                        <span className='truncate'>{search}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <h3 className='text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3'>
                    Popular Topics
                  </h3>
                  {isLoadingTopics ? (
                    <div className='flex items-center justify-center py-4'>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
                      <span className='ml-2 text-xs text-slate-500'>Loading...</span>
                    </div>
                  ) : (
                    <div className='grid grid-cols-1 gap-2'>
                      {popularTopics.map((topic) => (
                        <button
                          key={topic}
                          onClick={() => {
                            window.location.href = `/books?category=${encodeURIComponent(topic)}`;
                            onClose();
                          }}
                          className='flex items-center p-2 text-left text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors'
                        >
                          <FireIcon className='w-4 h-4 mr-2 text-orange-500 flex-shrink-0' />
                          <span className='truncate'>{topic}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Search Results */}
          {searchTerm && !isLoading && (
            <div className='p-3 sm:p-4 bg-white'>
              {results.length > 0 ? (
                <>
                  <h3 className='text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3'>
                    {results.length} Result{results.length !== 1 ? 's' : ''}
                  </h3>
                  <div className='space-y-2 sm:space-y-3'>
                    {results.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className='flex items-start w-full p-2 sm:p-3 text-left hover:bg-slate-50 rounded-xl transition-all duration-200 group border border-transparent hover:border-slate-200'
                      >
                        {/* Result Image */}
                        {result.image && (
                          <div className='relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden flex-shrink-0 mr-2 sm:mr-3'>
                            <Image
                              src={result.image}
                              alt={result.title}
                              fill
                              className='object-cover'
                              sizes='(max-width: 640px) 40px, 48px'
                            />
                          </div>
                        )}

                        {/* Result Content */}
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-start flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-1'>
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getTypeColor(result.type)} self-start`}>
                              {getTypeIcon(result.type)}
                              <span className='ml-1 capitalize'>{result.type}</span>
                            </span>
                            {result.category && (
                              <span className='text-xs text-slate-500 hidden sm:inline'>{result.category}</span>
                            )}
                          </div>
                          
                          <h4 className='text-sm font-semibold text-slate-900 line-clamp-2 group-hover:text-blue-700 transition-colors mb-1'>
                            {result.title}
                          </h4>
                          
                          <p className='text-xs text-slate-600 line-clamp-2 mb-2'>
                            {result.description}
                          </p>

                          {/* Result Meta */}
                          <div className='flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500'>
                            {result.author && (
                              <span className='flex items-center'>
                                <UserIcon className='w-3 h-3 mr-1 flex-shrink-0' />
                                <span className='truncate'>{result.author}</span>
                              </span>
                            )}
                            {result.duration && (
                              <span className='flex items-center'>
                                <ClockIcon className='w-3 h-3 mr-1 flex-shrink-0' />
                                {result.duration}
                              </span>
                            )}
                            {result.views && (
                              <span className='hidden sm:inline'>{result.views} views</span>
                            )}
                            {result.category && (
                              <span className='sm:hidden text-slate-400'>{result.category}</span>
                            )}
                          </div>
                        </div>

                        <ChevronRightIcon className='w-4 h-4 text-slate-400 group-hover:text-slate-600 flex-shrink-0 ml-2 mt-1' />
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className='text-center py-6 sm:py-8 bg-white'>
                  <MagnifyingGlassIcon className='w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-2 sm:mb-3' />
                  <h3 className='text-sm font-medium text-slate-900 mb-1'>No results found</h3>
                  <p className='text-xs text-slate-600 px-4'>
                    Try adjusting your search terms or browse our popular topics above.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Show "View All Results" for modal variant */}
        {searchTerm && results.length > 0 && variant === 'dropdown' && (
          <div className='border-t border-slate-100 p-2 sm:p-3 bg-white'>
            <Button
              variant="outline"
              size="sm"
              fullWidth
              rightIcon={<ChevronRightIcon className='w-4 h-4' />}
              onClick={() => {
                window.location.href = `/search?q=${encodeURIComponent(searchTerm)}`;
                onClose();
              }}
            >

              <span className='hidden sm:inline'>View All Results ({results.length})</span>
              <span className='sm:hidden'>All Results ({results.length})</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return variant === 'modal' ? (
    <div className='fixed inset-0 z-50'>
      {renderContent()}
    </div>
  ) : (
    renderContent()
  );
}

// Export additional components for different use cases
export const SearchModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <SearchComponent isOpen={isOpen} onClose={onClose} variant="modal" />
);

export const SearchDropdown = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <SearchComponent isOpen={isOpen} onClose={onClose} variant="dropdown" />
);

export const InlineSearch = ({ placeholder }: { placeholder?: string }) => (
  <SearchComponent isOpen={true} onClose={() => {}} variant="inline" placeholder={placeholder} />
);