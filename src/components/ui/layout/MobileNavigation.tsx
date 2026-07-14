'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  ChevronDownIcon,
  BookOpenIcon,
  MagnifyingGlassIcon,
  UserIcon,
  HomeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import type { Category } from '@/services/api/categoriesApi';
import { CategoryMenuIcon } from './CategoryMenuIcon';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  hasDropdown?: boolean;
  dropdownItems?: {
    name: string;
    href: string;
    description?: string;
    featured?: boolean;
    icon?: React.ReactNode;
  }[];
  isBooks?: boolean;
  color?: string;
}

interface MobileNavigationProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  navItems: NavItem[];
  bookCategories: Category[];
  isLoadingBookCategories: boolean;
  onBooksDropdownOpen: () => void;
}

export default function MobileNavigation({
  isOpen,
  setIsOpen,
  navItems,
  bookCategories,
  isLoadingBookCategories,
  onBooksDropdownOpen,
}: MobileNavigationProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isAudiobooksRoute =
    pathname === '/audiobooks' ||
    (pathname === '/books' && (searchParams?.get('type') || '') === 'Audiobook');
  const isBooksRoute = pathname === '/books' && !isAudiobooksRoute;

  const isNavItemActive = (item: NavItem) => {
    if (item.name === 'Audiobooks') return isAudiobooksRoute;
    if (item.name === 'Books') return isBooksRoute;
    if (item.dropdownItems?.some((dropdownItem) => pathname === dropdownItem.href)) return true;
    return pathname === item.href;
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const toggleDropdown = (name: string, isBooks?: boolean) => {
    const nextValue = activeDropdown === name ? null : name;
    setActiveDropdown(nextValue);

    if (nextValue === name && isBooks) {
      onBooksDropdownOpen();
    }
  };

  const handleLinkClick = () => {
    setIsOpen(false);
    setActiveDropdown(null);
  };

  const renderMobileBooksDropdown = () => (
    <div className='mt-3 space-y-3'>
      {/* Search Categories */}
      <div className='px-4'>
        <div className='relative'>
          <MagnifyingGlassIcon className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400' />
          <input
            type='text'
            placeholder='Search categories...'
            value={categorySearchQuery}
            onChange={(e) => setCategorySearchQuery(e.target.value)}
            className='w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all'
          />
        </div>
      </div>

      {/* Categories List */}
      <div className='px-4'>
        {isLoadingBookCategories ? (
          <div className='rounded-lg border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500'>
            Loading categories...
          </div>
        ) : (
          <div className='max-h-[360px] space-y-2 overflow-y-auto pr-1 [scrollbar-color:#2563eb_#e0f2fe] [scrollbar-width:thin]'>
            {bookCategories
              .filter(
                (category) =>
                  category.name.toLowerCase().includes(categorySearchQuery.toLowerCase()) ||
                  (category.description || '').toLowerCase().includes(categorySearchQuery.toLowerCase())
              )
              .map((category) => (
                <Link
                  key={category.id || category._id || category.slug}
                  href={`/books?category=${encodeURIComponent(category.name)}`}
                  onClick={handleLinkClick}
                  className='flex items-center space-x-3 p-3 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-blue-200 transition-colors'
                >
                  <div
                    className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-white'
                    style={{ backgroundColor: category.color || '#2563eb' }}
                  >
                    <CategoryMenuIcon category={category} className='h-5 w-5' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex min-w-0 items-center gap-2'>
                      <h4 className='truncate font-medium text-sm text-slate-900'>
                        {category.name}
                      </h4>
                      <span className='flex h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 px-1.5 text-[10px] font-bold leading-none text-blue-700'>
                        {category.bookCount || 0}
                      </span>
                    </div>
                  </div>
                  <ChevronDownIcon className='w-4 h-4 text-slate-400 rotate-[-90deg]' />
                </Link>
              ))}
          </div>
        )}
      </div>

      {/* View All Books Button */}
      <div className='px-4'>
        <Link
          href='/books'
          onClick={handleLinkClick}
          className='flex items-center justify-center w-full py-3 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors'
        >
          <BookOpenIcon className='w-4 h-4 mr-2' />
          View All Books
        </Link>
      </div>
    </div>
  );

  const renderMobileDropdown = (item: NavItem) => (
    <div className='mt-3 space-y-2 px-4'>
      {item.dropdownItems?.map((dropdownItem) => (
        <Link
          key={dropdownItem.name}
          href={dropdownItem.href}
          onClick={handleLinkClick}
          className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
            dropdownItem.featured
              ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <div
            className={`p-2 rounded-lg flex-shrink-0 ${
              dropdownItem.featured
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {dropdownItem.icon}
          </div>
          <div className='flex-1 min-w-0'>
            <div className='font-medium text-sm'>{dropdownItem.name}</div>
            {dropdownItem.description && (
              <div className='text-xs text-slate-500'>
                {dropdownItem.description}
              </div>
            )}
          </div>
          <ChevronDownIcon className='w-4 h-4 text-slate-400 rotate-[-90deg]' />
        </Link>
      ))}
    </div>
  );

  return (
    <div
      className={`lg:hidden fixed inset-0 z-50 transition-all duration-300 ${
        isOpen ? 'visible' : 'invisible'
      }`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Mobile Menu Panel */}
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl overflow-y-auto transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >

        {/* Search Section */}
        <div className='p-4 border-b border-slate-200'>
          <div className='mb-3 flex items-center justify-between'>
            <Link
              href='/'
              onClick={handleLinkClick}
              className='inline-flex items-center gap-2 text-sm font-bold text-slate-900'
            >
              <HomeIcon className='h-5 w-5 text-blue-600' />
              Home
            </Link>
            <button
              type='button'
              onClick={handleLinkClick}
              className='inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700'
              aria-label='Close menu'
            >
              <XMarkIcon className='h-5 w-5' />
            </button>
          </div>
          <div className='relative'>
            <MagnifyingGlassIcon className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400' />
            <input
              type='text'
              placeholder='Search everything...'
              className='w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all'
            />
          </div>
        </div>

        {/* Navigation Items */}
        <div className='p-4 space-y-2'>
          {navItems.map((item) => (
            <div key={item.name}>
              <div className='flex items-center justify-between'>
                <Link
                  href={item.href}
                  onClick={handleLinkClick}
                  className={`flex-1 flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    isNavItemActive(item)
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : item.hasDropdown
                        ? 'bg-slate-50 text-slate-700'
                        : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className='p-2 bg-blue-100 rounded-lg text-blue-600'>
                    {item.icon}
                  </div>
                  <div className='flex-1'>
                    <div className='font-medium text-sm'>{item.name}</div>
                    <div className='text-xs text-slate-500'>
                      {item.name === 'Books' && 'Read & Grow'}
                      {item.name === 'Audiobooks' && 'Listen & Learn'}
                      {item.name === 'Blog' && 'Read Insights'}
                      {item.name === 'About' && 'Know More'}
                      {item.name === 'FAQ' && 'Help & Support'}
                      {item.name === 'Resource' && 'Explore More'}
                    </div>
                  </div>
                </Link>
                {item.hasDropdown && (
                  <button
                    onClick={() => toggleDropdown(item.name, item.isBooks)}
                    className='p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors'
                  >
                    <ChevronDownIcon
                      className={`w-4 h-4 transition-transform duration-200 ${
                        activeDropdown === item.name ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                )}
              </div>

              {/* Mobile Dropdown */}
              {item.hasDropdown && activeDropdown === item.name && (
                <div className='mt-2'>
                  {item.isBooks
                    ? renderMobileBooksDropdown()
                    : renderMobileDropdown(item)}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className='mt-auto p-4 border-t border-slate-200 bg-slate-50'>
          <div className='text-center space-y-3'>
            <div className='flex items-center justify-center space-x-2'>
              <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center'>
                <UserIcon className='w-4 h-4 text-white' />
              </div>
              <div className='text-left'>
                <div className='font-semibold text-slate-800 text-sm'>
                  UniqueIIT Research Center
                </div>
                <div className='text-xs text-slate-600'>
                  Research & Learning
                </div>
              </div>
            </div>
            
            <Link
              href='/about/contact'
              onClick={handleLinkClick}
              className='block w-full bg-blue-600 text-white py-3 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors'
            >
              Book Consultation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
