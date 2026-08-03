'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import type { Category } from '@/services/api/categoriesApi';
import type { PublicBookListItem } from '@/types/publicBook';
import { bookFormatsApi } from '@/services/api/bookFormatsApi';
import { categoriesApi } from '@/services/api/categoriesApi';
import { API_CONFIG } from '@/config/api';

const MediaContentMobile = dynamic(() => import('./MediaContentMobile'));
const MediaContentDesktop = dynamic(() => import('./MediaContentDesktop'));

interface MediaContentProps {
  newReleaseBooks: PublicBookListItem[];
  newReleaseAudiobooks: PublicBookListItem[];
  freeSummaries: PublicBookListItem[];
  trendingBooks: PublicBookListItem[];
  premiumSummaries: PublicBookListItem[];
  categories: Category[];
}

export default function MediaContent(props: MediaContentProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [availableFormats, setAvailableFormats] = useState<string[]>([]);
  const [allCategoryNames, setAllCategoryNames] = useState<string[]>([]);
  const [categoryContentCounts, setCategoryContentCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Initial load state
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    // Fetch formats from DB
    bookFormatsApi.getActive()
      .then(res => {
        const names = (res.data || [])
          .map((f: { name: string }) => f.name)
          .filter((n: string) => n !== 'Audiobook');
        setAvailableFormats(names);
      })
      .catch(() => {});

    // Fetch all categories from DB
    categoriesApi.getActive()
      .then(res => {
        const names = (res.data || []).map((c: { name: string }) => c.name);
        setAllCategoryNames(names);
      })
      .catch(() => {});

    const countByCategory = (items: PublicBookListItem[]) =>
      items.reduce<Record<string, number>>((counts, item) => {
        if (!item.category) return counts;
        counts[item.category] = (counts[item.category] ?? 0) + 1;
        return counts;
      }, {});

    const fetchListingItems = async (path: string) => {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}${path}`);
      const data = await response.json();
      return Array.isArray(data?.data) ? data.data : [];
    };

    Promise.all([
      fetchListingItems('/books?view=listing&type=Books&excludeComponentType=free-summaries'),
      fetchListingItems('/audiobooks?view=listing'),
    ])
      .then(([books, audiobooks]) => {
        setCategoryContentCounts(countByCategory([...books, ...audiobooks]));
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('resize', checkMobile);
      clearTimeout(timer);
    };
  }, []);

  if (isLoading) {
    return (
      <section className='py-20 bg-white relative flex items-center justify-center min-h-[400px] overflow-hidden'>
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full blur-[100px] animate-pulse"></div>
        </div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 relative">
            <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="mt-8 text-slate-400 font-syne text-xs uppercase tracking-[0.4em] animate-pulse">Initializing Collection</p>
        </div>
      </section>
    );
  }

  // Render mobile or desktop component based on screen size
  const enrichedProps = { ...props, availableFormats, allCategoryNames, categoryContentCounts };
  return isMobile ? <MediaContentMobile {...enrichedProps} /> : <MediaContentDesktop {...enrichedProps} />;
}
