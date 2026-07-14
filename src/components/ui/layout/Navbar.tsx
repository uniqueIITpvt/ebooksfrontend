'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import { API_CONFIG } from '@/config/api';
import categoriesApi, { type Category } from '@/services/api/categoriesApi';
import type { PublicBookListItem } from '@/types/publicBook';
import {
  ChevronDownIcon,
  Bars3Icon,
  MagnifyingGlassIcon,
  UserIcon,
  BookOpenIcon,
  SpeakerWaveIcon,
  NewspaperIcon,
  QuestionMarkCircleIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline';
import MobileNavigation from './MobileNavigation';
import BooksDropdown from './BooksDropdown';
import { SearchDropdown } from '../primitives/SearchComponent';
import MobileSearch from '../primitives/MobileSearch';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';

const API_URL = API_CONFIG.API_BASE_URL;

// Login Button Component
function LoginButton() {
  const { isAuthenticated, user, logout, openAuthModal } = useAuth();
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const shouldOpenAuthPopup = pathname === '/';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Only show user menu for regular users, not admins (admins should use admin dashboard)
  if (isAuthenticated && user && user.role === 'user') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg"
        >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.name}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
          <span className="hidden md:inline">{user.name.split(' ')[0]}</span>
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="font-semibold text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
              {user.subscriptionPlan && user.subscriptionPlan !== 'none' && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {user.subscriptionPlan.charAt(0).toUpperCase() + user.subscriptionPlan.slice(1)}
                </span>
              )}
            </div>
            <Link
              href="/subscription"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setShowDropdown(false)}
            >
              Subscription
            </Link>
            <Link
              href="/profile"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setShowDropdown(false)}
            >
              My Profile
            </Link>
            <button
              onClick={() => {
                logout();
                setShowDropdown(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {shouldOpenAuthPopup ? (
        <>
          <button
            type="button"
            onClick={() => openAuthModal('signup')}
            className="hidden sm:block px-4 py-2 rounded-xl border-2 border-blue-600 text-blue-600 font-semibold text-sm hover:bg-blue-50 transition-all duration-300"
          >
            Sign Up Free
          </button>
          <button
            type="button"
            onClick={() => openAuthModal('signin')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            Sign In
          </button>
        </>
      ) : (
        <>
          <Link
            href="/user/auth?mode=signup"
            className="hidden sm:block px-4 py-2 rounded-xl border-2 border-blue-600 text-blue-600 font-semibold text-sm hover:bg-blue-50 transition-all duration-300"
          >
            Sign Up Free
          </Link>
          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            Sign In
          </Link>
        </>
      )}
    </div>
  );
}

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

const navItems: NavItem[] = [
  
  {
    name: 'Books',
    href: '/books',
    icon: <BookOpenIcon className='w-5 h-5' />,
    color: 'from-blue-500 to-indigo-600',
    hasDropdown: true,
    isBooks: true,
  },

  {
    name: 'Audiobooks',
    href: '/audiobooks',
    icon: <SpeakerWaveIcon className='w-5 h-5' />,
    color: 'from-blue-500 to-indigo-600',
  },

  {
    name: 'Blog',
    href: '/blog',
    icon: <NewspaperIcon className='w-5 h-5' />,
    color: 'from-blue-500 to-indigo-600',
  },
  
  {
    name: 'About',
    href: '/about',
    icon: <UserIcon className='w-5 h-5' />,
    color: 'from-blue-500 to-indigo-600',
  },

  {
    name: 'FAQ',
    href: '/faq',
    icon: <QuestionMarkCircleIcon className='w-5 h-5' />,
    color: 'from-blue-500 to-indigo-600',
  },


];

interface NavbarProps {
  siteLogo?: string | null;
}

interface PublicBookListResponse {
  success?: boolean;
  data?: PublicBookListItem[];
}

const countBooksByCategory = (items: PublicBookListItem[]) =>
  items.reduce<Record<string, number>>((counts, item) => {
    if (!item.category) return counts;

    counts[item.category] = (counts[item.category] ?? 0) + 1;
    return counts;
  }, {});

const fetchPublicBookItems = async (path: string) => {
  const response = await fetch(`${API_URL}${path}?view=listing`);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}`);
  }

  const data = (await response.json()) as PublicBookListResponse;
  return Array.isArray(data.data) ? data.data : [];
};

export default function Navbar({ siteLogo }: NavbarProps) {
  const { totalItems } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [bookCategories, setBookCategories] = useState<Category[]>([]);
  const [isLoadingBookCategories, setIsLoadingBookCategories] = useState(false);
  const hasLoadedBookCategories = useRef(false);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isAudiobooksRoute =
    pathname === '/audiobooks' ||
    (pathname === '/books' && (searchParams?.get('type') || '') === 'Audiobook');
  const isBooksRoute = pathname === '/books' && !isAudiobooksRoute;

  const isNavItemActive = (item: NavItem) => {
    if (item.name === 'Audiobooks') return isAudiobooksRoute;
    if (item.name === 'Books') return isBooksRoute;
    return pathname === item.href;
  };

  const loadBookCategories = useCallback(async () => {
    if (isLoadingBookCategories || hasLoadedBookCategories.current) {
      return;
    }

    try {
      setIsLoadingBookCategories(true);
      const [response, books, audiobooks] = await Promise.all([
        categoriesApi.getActive(),
        fetchPublicBookItems('/books'),
        fetchPublicBookItems('/audiobooks'),
      ]);

      if (response.success && Array.isArray(response.data)) {
        const categoryCounts = countBooksByCategory([...books, ...audiobooks]);
        setBookCategories(
          response.data.map((category) => ({
            ...category,
            bookCount: categoryCounts[category.name] ?? 0,
          }))
        );
        hasLoadedBookCategories.current = true;
      }
    } catch (error) {
      console.error('Error fetching categories for navbar:', error);
      setBookCategories([]);
    } finally {
      setIsLoadingBookCategories(false);
    }
  }, [isLoadingBookCategories]);

  const handleBooksDropdownOpen = useCallback(() => {
    void loadBookCategories();
  }, [loadBookCategories]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMouseEnter = (item: NavItem) => {
    if (item.isBooks) {
      void handleBooksDropdownOpen();
    }

    setActiveDropdown(item.name);
  };

  const handleMouseLeave = () => {
    setActiveDropdown(null);
  };

  const handleDropdownClose = () => {
    setActiveDropdown(null);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          scrolled
            ? 'bg-gradient-to-r from-blue-50/95 via-indigo-50/95 to-purple-50/95 backdrop-blur-xl shadow-2xl border-b border-blue-200/50'
            : 'bg-gradient-to-r from-blue-100/80 via-indigo-100/70 to-purple-100/60 backdrop-blur-sm'
        }`}
      >
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center h-20'>
            {/* Logo - Far Left Corner */}
            <div className='flex-shrink-0 flex items-center'>
              <Link href='/'>
                <Image
                  src={siteLogo || '/file.svg'}
                  alt='TechUniqueIIT Research Center'
                  width={240}
                  height={120}
                  loading='eager'
                  className='h-16 sm:h-20 w-auto object-contain'
                />
              </Link>
            </div>

            {/* Desktop Navigation - Center-Right Area */}
            <div className='hidden lg:block flex-1'>
              <div className='flex items-center space-x-2 justify-center ml-8'>
                {navItems.map((item) => (
                  <div
                    key={item.name}
                    className='relative group'
                    onMouseEnter={() => item.hasDropdown && handleMouseEnter(item)}
                    onMouseLeave={() => item.hasDropdown && handleMouseLeave()}
                  >
                    <div
                      className={`flex items-center space-x-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer border border-transparent hover:border-white/50 ${
                        isNavItemActive(item)
                          ? 'bg-white/70 shadow-lg border-blue-200/60'
                          : 'hover:shadow-lg'
                      } bg-gradient-to-r ${
                        item.color || 'from-slate-500 to-gray-500'
                      } bg-clip-text text-transparent hover:from-blue-600 hover:to-indigo-600 hover:bg-white/10`}
                    >
                      <div
                        className={`p-1.5 rounded-lg bg-gradient-to-r ${
                          item.color || 'from-slate-500 to-gray-500'
                        } text-white`}
                      >
                        {item.icon}
                      </div>
                      {item.hasDropdown ? (
                        <Link href={item.href} className='mr-1'>
                          {item.name}
                        </Link>
                      ) : (
                        <Link href={item.href}>{item.name}</Link>
                      )}
                      {item.hasDropdown && (
                        <ChevronDownIcon
                          className={`w-4 h-4 transition-all duration-300 ${
                            activeDropdown === item.name
                              ? 'rotate-180 text-blue-600'
                              : 'text-slate-500'
                          }`}
                        />
                      )}
                    </div>

                    {/* Dropdown Menu */}
                    {item.hasDropdown && activeDropdown === item.name && (
                      <>
                        {/* Invisible bridge to prevent dropdown from disappearing */}
                        <div className='absolute left-0 top-full w-full h-2 bg-transparent z-10'></div>
                        {item.isBooks ? (
                          <BooksDropdown
                            categories={bookCategories}
                            isLoading={isLoadingBookCategories}
                            onClose={handleDropdownClose}
                          />
                        ) : (
                          <div className='absolute left-0 mt-0 w-96 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-blue-200/60 hover:border-blue-300/80 py-4 z-10 animate-in slide-in-from-top-2 duration-300 transition-all'>
                            <div className='absolute -top-2 left-8 w-4 h-4 bg-white border-l border-t border-blue-200/60 rotate-45'></div>
                            <div className='px-6 mb-4'>
                              <div className='flex items-center space-x-3'>
                                <div
                                  className={`p-2 rounded-xl bg-gradient-to-r ${
                                    item.color || 'from-slate-500 to-gray-500'
                                  } text-white`}
                                >
                                  {item.icon}
                                </div>
                                <h3
                                  className={`text-lg font-bold bg-gradient-to-r ${
                                    item.color || 'from-slate-500 to-gray-500'
                                  } bg-clip-text text-transparent`}
                                >
                                  {item.name}
                                </h3>
                              </div>
                            </div>
                            {item.dropdownItems?.map((dropdownItem) => (
                              <Link
                                key={dropdownItem.name}
                                href={dropdownItem.href}
                                onClick={handleDropdownClose}
                                className={`group flex items-start mt-1 px-6 py-4 text-sm transition-all duration-300 mx-2 rounded-2xl ${
                                  dropdownItem.featured
                                    ? 'text-blue-700 bg-blue-100/60 hover:bg-blue-200/90 hover:text-blue-800 border-l-4 border-blue-500 shadow-sm'
                                    : 'text-slate-700 bg-transparent hover:bg-blue-100/70 hover:text-blue-800 border-l-4 border-transparent hover:border-blue-400 hover:shadow-md'
                                }`}
                              >
                                <div
                                  className={`mr-4 mt-0.5 p-2 rounded-xl transition-all duration-300 ${
                                    dropdownItem.featured
                                      ? 'bg-blue-200 text-blue-700 group-hover:bg-blue-300 group-hover:text-blue-800'
                                      : 'bg-slate-100 text-slate-600 group-hover:bg-blue-200 group-hover:text-blue-700'
                                  }`}
                                >
                                  {dropdownItem.icon}
                                </div>
                                <div className='flex-1'>
                                  <div className='font-bold mb-1'>
                                    {dropdownItem.name}
                                  </div>
                                  {dropdownItem.description && (
                                    <div
                                      className={`text-xs leading-relaxed ${
                                        dropdownItem.featured
                                          ? 'text-blue-600/80'
                                          : 'text-slate-500'
                                      }`}
                                    >
                                      {dropdownItem.description}
                                    </div>
                                  )}
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Search and Mobile Menu - Far Right */}
            <div className='flex items-center space-x-2 sm:space-x-3 ml-auto'>
              {/* Mobile Search Button (visible only on mobile) */}
              <div className='sm:hidden'>
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className='text-slate-600 hover:text-blue-700 p-2 rounded-xl hover:bg-blue-50 transition-all duration-300 hover:shadow-md border border-transparent hover:border-blue-100'
                >
                  <MagnifyingGlassIcon className='w-5 h-5' />
                </button>
              </div>

              {/* Desktop Search (visible only on desktop) */}
              <div className='hidden sm:block relative'>
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className='text-slate-600 hover:text-blue-700 p-3 rounded-xl hover:bg-blue-50 transition-all duration-300 hover:shadow-md border border-transparent hover:border-blue-100'
                >
                  <MagnifyingGlassIcon className='w-5 h-5' />
                </button>
                <SearchDropdown 
                  isOpen={searchOpen} 
                  onClose={() => setSearchOpen(false)} 
                />
              </div>

              {/* Cart Icon with Badge */}
              <Link
                href='/cart'
                className='relative p-2 sm:p-3 rounded-xl text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-300 hover:shadow-md border border-transparent hover:border-blue-100'
                aria-label='Shopping cart'
              >
                <ShoppingCartIcon className='w-5 h-5' />
                {totalItems > 0 && (
                  <span className='absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow'>
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </Link>

              {/* Login/User Button */}
              <LoginButton />

              <div className='lg:hidden'>
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className='text-slate-600 hover:text-blue-700 p-2 sm:p-3 rounded-xl hover:bg-blue-50 transition-all duration-300 hover:shadow-md border border-transparent hover:border-blue-100'
                >
                  <Bars3Icon className='w-5 h-5 sm:w-6 sm:h-6' />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <MobileNavigation
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        navItems={navItems}
        bookCategories={bookCategories}
        isLoadingBookCategories={isLoadingBookCategories}
        onBooksDropdownOpen={handleBooksDropdownOpen}
      />

      {/* Mobile Search Overlay (only visible on mobile) */}
      <div className='sm:hidden'>
        <MobileSearch 
          isOpen={searchOpen} 
          onClose={() => setSearchOpen(false)} 
        />
      </div>
    </>
  );
}
