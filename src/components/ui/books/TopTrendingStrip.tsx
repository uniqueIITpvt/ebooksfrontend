'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { PublicBookListItem } from '@/types/publicBook';
import { generateBookSlug } from '@/utils/slugify';

interface TopTrendingStripProps {
  title: string;
  subtitle: string;
  items: PublicBookListItem[];
  viewAllHref: string;
  itemHrefPrefix?: string;
}

export default function TopTrendingStrip({
  title,
  subtitle,
  items,
  itemHrefPrefix = '/books',
}: TopTrendingStripProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const topItems = useMemo(
    () =>
      [...items]
        .sort((left, right) => right.reviews - left.reviews || right.rating - left.rating)
        .slice(0, 10),
    [items]
  );
  const visibleCount = 5;
  const maxActiveIndex = Math.max(0, topItems.length - visibleCount);
  const visibleItems = topItems.slice(activeIndex, activeIndex + visibleCount);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, maxActiveIndex));
  }, [maxActiveIndex]);

  if (topItems.length === 0) return null;

  const moveItems = (direction: 'left' | 'right') => {
    setActiveIndex((current) => {
      if (direction === 'left') return Math.max(0, current - 1);
      return Math.min(maxActiveIndex, current + 1);
    });
  };

  return (
    <section className='bg-gradient-to-r from-blue-100/80 via-indigo-100/70 to-purple-100/60'>
      <div className='mx-auto max-w-[1300px] px-4 py-4 sm:px-6 lg:px-8'>
      <div className='relative overflow-hidden rounded-[18px] border border-white/80 bg-gradient-to-r from-blue-100/90 via-indigo-100/80 to-purple-100/80 px-10 pb-5 pt-4 shadow-[0_14px_35px_rgba(79,70,229,0.10)]'>
        <div className='pointer-events-none absolute inset-0 opacity-60'>
          <div className='absolute left-8 top-24 h-px w-48 rotate-[-18deg] bg-white/70' />
          <div className='absolute bottom-16 right-12 h-px w-44 rotate-[-16deg] bg-white/70' />
          <div className='absolute right-8 top-8 grid grid-cols-4 gap-1'>
            {Array.from({ length: 20 }, (_, index) => (
              <span key={index} className='h-1 w-1 rounded-full bg-white/70' />
            ))}
          </div>
        </div>

        <div className='relative text-center'>
          <div className='mx-auto inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-600 shadow-sm'>
            <span className='text-orange-500'>•</span>
            <span>Trending Now</span>
          </div>
          <div className='mt-2 flex items-center justify-center gap-5'>
            <span className='hidden h-11 w-5 rounded-l-full border-l-4 border-blue-300 sm:block' />
            <h1 className='text-3xl font-bold tracking-tight text-blue-700 sm:text-[36px]'>
            {title}
          </h1>
            <span className='hidden h-11 w-5 rounded-r-full border-r-4 border-blue-300 sm:block' />
          </div>
          <p className='mt-1 text-[13px] font-medium text-slate-600'>
            {subtitle}
          </p>
          <div className='mx-auto mt-2 h-0.5 w-12 rounded-full bg-blue-600' />
        </div>

        <div className='relative mt-5 px-8'>
          {topItems.length > 5 && (
            <>
              <button
                type='button'
                onClick={() => moveItems('left')}
                disabled={activeIndex === 0}
                className='absolute left-0 top-[42%] z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-lg transition hover:bg-white hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
                aria-label='Previous trending books'
              >
                <ChevronLeftIcon className='h-5 w-5' />
              </button>
              <button
                type='button'
                onClick={() => moveItems('right')}
                disabled={activeIndex === maxActiveIndex}
                className='absolute right-0 top-[42%] z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-lg transition hover:bg-white hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
                aria-label='Next trending books'
              >
                <ChevronRightIcon className='h-5 w-5' />
              </button>
            </>
          )}

          <div className='flex justify-center gap-6'>
            {visibleItems.map((item, index) => {
              const slug = item.slug || generateBookSlug(item.title);
              const rank = activeIndex + index + 1;

              return (
                <Link
                  key={item.id || item._id || slug}
                  href={`${itemHrefPrefix}/${slug}`}
                  className='group block w-[132px] shrink-0'
                  title={item.title}
                >
                  <div className='relative mx-auto w-full max-w-[132px] rounded-[12px] bg-white/80 p-2 shadow-sm transition duration-200 group-hover:-translate-y-1 group-hover:shadow-xl'>
                    <div className='absolute -left-2 -top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-md'>
                      {rank}
                    </div>
                    <div className='relative h-[158px] overflow-hidden rounded-lg bg-white'>
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          sizes='132px'
                          className='object-contain'
                        />
                      ) : (
                        <div className='flex h-full w-full items-center justify-center bg-slate-100 px-4 text-center text-sm font-semibold text-slate-500'>
                          {item.title}
                        </div>
                      )}
                    </div>
                    <h2 className='mt-2 truncate text-center text-[11px] font-bold text-slate-950'>
                      {item.title}
                    </h2>
                    <p className='mt-1 truncate text-center text-[10px] font-medium text-slate-500'>
                      {item.author}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          {topItems.length > visibleCount && (
            <div className='mt-3 flex justify-center gap-2'>
              {Array.from({ length: maxActiveIndex + 1 }, (_, index) => (
                <button
                  key={index}
                  type='button'
                  onClick={() => setActiveIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    activeIndex === index ? 'w-5 bg-blue-600' : 'w-2 bg-blue-200'
                  }`}
                  aria-label={`Show trending books ${index + 1} to ${index + visibleCount}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </section>
  );
}
