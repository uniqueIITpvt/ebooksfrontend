'use client';

import { useRef } from 'react';
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
  viewAllHref,
  itemHrefPrefix = '/books',
}: TopTrendingStripProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const topItems = [...items]
    .sort((left, right) => right.reviews - left.reviews || right.rating - left.rating)
    .slice(0, 10);

  if (topItems.length === 0) return null;

  const scrollByPage = (direction: 'left' | 'right') => {
    scrollerRef.current?.scrollBy({
      left: direction === 'left' ? -620 : 620,
      behavior: 'smooth',
    });
  };

  return (
    <section className='bg-gradient-to-r from-blue-100/80 via-indigo-100/70 to-purple-100/60'>
      <div className='mx-auto max-w-[1300px] px-4 py-10 sm:px-6 lg:px-8'>
        <div className='flex items-start justify-between gap-6'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight text-black sm:text-4xl'>
              {title}
            </h1>
            <p className='mt-4 text-base font-medium text-black sm:text-lg'>
              {subtitle}
            </p>
          </div>

          {/* <Link
            href={viewAllHref}
            className='shrink-0 text-base font-bold text-black underline underline-offset-2 transition hover:text-blue-700'
          >
            View all
          </Link> */}
        </div>

        <div className='relative mt-12'>
          {topItems.length > 5 && (
            <>
              <button
                type='button'
                onClick={() => scrollByPage('left')}
                className='absolute left-0 top-1/2 z-10 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-black shadow-lg transition hover:bg-white hover:text-blue-700'
                aria-label='Previous trending books'
              >
                <ChevronLeftIcon className='h-7 w-7' />
              </button>
              <button
                type='button'
                onClick={() => scrollByPage('right')}
                className='absolute right-0 top-1/2 z-10 flex h-12 w-12 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-black shadow-lg transition hover:bg-white hover:text-blue-700'
                aria-label='Next trending books'
              >
                <ChevronRightIcon className='h-7 w-7' />
              </button>
            </>
          )}

          <div
            ref={scrollerRef}
            className='flex gap-9 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
          >
            {topItems.map((item) => {
              const slug = item.slug || generateBookSlug(item.title);

              return (
                <Link
                  key={item.id || item._id || slug}
                  href={`${itemHrefPrefix}/${slug}`}
                  className='group block shrink-0'
                  title={item.title}
                >
                  <div className='relative h-[265px] w-[176px] overflow-hidden bg-white shadow-sm transition duration-200 group-hover:-translate-y-1 group-hover:shadow-xl'>
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes='176px'
                        className='object-cover'
                      />
                    ) : (
                      <div className='flex h-full w-full items-center justify-center bg-slate-100 px-4 text-center text-sm font-semibold text-slate-500'>
                        {item.title}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
