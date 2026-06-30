'use client';

import { useState, useEffect, useRef } from 'react';
import { categoriesApi } from '@/services/api/categoriesApi';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  BookOpenIcon,
  TagIcon,
  ClockIcon,
  FireIcon,
  UserIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
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

interface MobileSearchProps {
  isOpen: boolean;
  onClose: () => void;
  placeholder?: string;
}

export default function MobileSearch({
  isOpen,
  onClose,
  placeholder = 'Search books, topics...',
}: MobileSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [popularTopics, setPopularTopics] = useState<string[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch popular topics (categories) from API
  useEffect(() => {
    if (isOpen) {
      setIsLoadingTopics(true);
      categoriesApi.getForSelect()
        .then(categories => {
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

  // Handle animation and focus
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      setSearchTerm('');
      setResults([]);
    }
  }, [isOpen]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim() && !recentSearches.includes(term)) {
      setRecentSearches((prev) => [term, ...prev.slice(0, 4)]);
    }
  };

  const handleTopicClick = (topic: string) => {
    window.location.href = `/books?category=${encodeURIComponent(topic)}`;
    onClose();
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.url) {
      window.location.href = result.url;
    }
    onClose();
  };

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 200);
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

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Mobile Search Container */}
      <div 
        className={`fixed top-0 left-0 right-0 z-50 bg-white shadow-lg transform transition-transform duration-300 ease-out ${
          isAnimating ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        {/* Search Header */}
        <div className='px-4 py-3 border-b border-slate-200 bg-white'>
          {/* Top Row - Back Button and Search Input */}
          <div className='flex items-center space-x-3 mb-3'>
            <button
              onClick={handleClose}
              className='p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors'
            >
              <ArrowLeftIcon className='w-5 h-5' />
            </button>
            
            <div className='flex-1 relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <MagnifyingGlassIcon className='h-5 w-5 text-slate-400' />
              </div>
              <input
                ref={inputRef}
                type='text'
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={placeholder}
                className='block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 placeholder-slate-500'
              />
              {searchTerm && (
                <div className='absolute inset-y-0 right-0 pr-3 flex items-center'>
                  <button
                    onClick={() => setSearchTerm('')}
                    className='text-slate-400 hover:text-slate-600'
                  >
                    <XMarkIcon className='w-5 h-5' />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className='flex items-center space-x-2 overflow-x-auto scrollbar-hide'>
            {[
              { key: 'all', label: 'All', icon: <MagnifyingGlassIcon className='w-4 h-4' /> },
              { key: 'book', label: 'Books', icon: <BookOpenIcon className='w-4 h-4' /> },
              { key: 'topic', label: 'Topics', icon: <TagIcon className='w-4 h-4' /> },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setSelectedType(filter.key)}
                className={`
                  flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0
                  ${selectedType === filter.key
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-slate-600 hover:bg-slate-100 border border-transparent'
                  }
                `}
              >
                {filter.icon}
                <span>{filter.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search Content */}
        <div className='max-h-[calc(100vh-140px)] overflow-y-auto bg-white'>
          {/* Loading State */}
          {isLoading && (
            <div className='flex items-center justify-center py-12'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
              <span className='ml-3 text-sm text-slate-600'>Searching...</span>
            </div>
          )}

          {/* No Search Term - Show Recent Searches or Popular */}
          {!searchTerm && !isLoading && (
            <div className='p-4'>
              {recentSearches.length > 0 ? (
                <>
                  <h3 className='text-sm font-semibold text-slate-700 mb-3'>
                    Recent Searches
                  </h3>
                  <div className='space-y-2'>
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearch(search)}
                        className='flex items-center w-full p-3 text-left text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100'
                      >
                        <ClockIcon className='w-5 h-5 mr-3 text-slate-400 flex-shrink-0' />
                        <span className='truncate'>{search}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <h3 className='text-sm font-semibold text-slate-700 mb-3'>
                    Popular Topics
                  </h3>
                  {isLoadingTopics ? (
                    <div className='flex items-center justify-center py-4'>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
                      <span className='ml-2 text-xs text-slate-500'>Loading...</span>
                    </div>
                  ) : (
                    <div className='space-y-2'>
                      {popularTopics.map((topic) => (
                        <button
                          key={topic}
                          onClick={() => handleTopicClick(topic)}
                          className='flex items-center w-full p-3 text-left text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100'
                        >
                          <FireIcon className='w-5 h-5 mr-3 text-orange-500 flex-shrink-0' />
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
            <div className='p-4'>
              {results.length > 0 ? (
                <>
                  <h3 className='text-sm font-semibold text-slate-700 mb-4'>
                    {results.length} Result{results.length !== 1 ? 's' : ''}
                  </h3>
                  <div className='space-y-3'>
                    {results.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className='flex items-start w-full p-3 text-left hover:bg-slate-50 rounded-xl transition-all duration-200 group border border-slate-100 hover:border-slate-200 hover:shadow-sm'
                      >
                        {/* Result Image */}
                        {result.image && (
                          <div className='relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 mr-3'>
                            <Image
                              src={result.image}
                              alt={result.title}
                              fill
                              className='object-cover'
                              sizes='48px'
                            />
                          </div>
                        )}

                        {/* Result Content */}
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-start flex-col space-y-1 mb-2'>
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getTypeColor(result.type)} self-start`}>
                              {getTypeIcon(result.type)}
                              <span className='ml-1 capitalize'>{result.type}</span>
                            </span>
                          </div>
                          
                          <h4 className='text-sm font-semibold text-slate-900 line-clamp-2 group-hover:text-blue-700 transition-colors mb-1'>
                            {result.title}
                          </h4>
                          
                          <p className='text-xs text-slate-600 line-clamp-2 mb-2'>
                            {result.description}
                          </p>

                          {/* Result Meta */}
                          <div className='flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500'>
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
                              <span>{result.views} views</span>
                            )}
                            {result.category && (
                              <span className='text-slate-400'>• {result.category}</span>
                            )}
                          </div>
                        </div>

                        <ChevronRightIcon className='w-5 h-5 text-slate-400 group-hover:text-slate-600 flex-shrink-0 ml-2 mt-1' />
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className='text-center py-12'>
                  <MagnifyingGlassIcon className='w-12 h-12 text-slate-300 mx-auto mb-4' />
                  <h3 className='text-sm font-medium text-slate-900 mb-2'>No results found</h3>
                  <p className='text-sm text-slate-600 px-4'>
                    Try adjusting your search terms or browse our popular topics above.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - View All Results */}
        {searchTerm && results.length > 5 && (
          <div className='border-t border-slate-200 p-4 bg-white'>
            <Button
              variant="primary"
              size="sm"
              fullWidth
              rightIcon={<ChevronRightIcon className='w-4 h-4' />}
              onClick={() => {
                window.location.href = `/search?q=${encodeURIComponent(searchTerm)}`;
                onClose();
              }}
            >
              View All {results.length} Results
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

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

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = customStyles;
  document.head.appendChild(styleElement);
}
