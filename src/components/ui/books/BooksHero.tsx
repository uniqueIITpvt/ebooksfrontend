'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export interface BooksHeroBanner {
  _id: string;
  title: string;
  image: string;
  isActive: boolean;
  position: string;
}

interface BooksHeroProps {
  banners: BooksHeroBanner[];
  className?: string;
}

export default function BooksHero({
  banners,
  className = '',
}: BooksHeroProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const activeBanners = useMemo(
    () => banners.filter((banner) => banner.isActive !== false && banner.image),
    [banners]
  );

  useEffect(() => {
    if (currentSlide >= activeBanners.length) {
      setCurrentSlide(0);
    }
  }, [activeBanners.length, currentSlide]);

  useEffect(() => {
    if (activeBanners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeBanners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeBanners.length]);

  const currentBanner = activeBanners[currentSlide];

  return (
    <section
      className={`relative h-[300px] xs:h-[290px] sm:h-[270px] md:h-[310px] lg:h-[400px] xl:h-[500px] 2xl:h-[520px] w-full overflow-hidden select-none ${className}`}
    >
      <div className='absolute inset-0'>
        {currentBanner ? (
          activeBanners.map((banner, index) => (
            <div
              key={banner._id}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                index === currentSlide
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-110'
              }`}
            >
              <Image
                src={banner.image}
                alt={banner.title || 'Books Banner'}
                fill
                className='object-fill object-center pointer-events-none'
                priority={index === 0}
                loading={index === 0 ? 'eager' : 'lazy'}
                quality={100}
                sizes='100vw'
                draggable={false}
                style={{
                  imageRendering: 'auto',
                  transform: 'translateZ(0)',
                  backfaceVisibility: 'hidden',
                }}
              />
            </div>
          ))
        ) : (
          <div className='absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200' />
        )}
      </div>

      <div className='absolute inset-0 pointer-events-none'>
        <div className='absolute top-20 left-10 w-2 h-2 bg-white/30 rounded-full animate-ping' />
        <div className='absolute top-40 right-20 w-1 h-1 bg-white/40 rounded-full animate-ping delay-1000' />
        <div className='absolute bottom-40 left-20 w-1.5 h-1.5 bg-white/20 rounded-full animate-ping delay-2000' />
        <div className='absolute top-60 left-1/3 w-1 h-1 bg-white/30 rounded-full animate-ping delay-500' />
        <div className='absolute bottom-60 right-1/3 w-2 h-2 bg-white/20 rounded-full animate-ping delay-1500' />
      </div>

      <div className='absolute inset-y-0 left-5 z-20 flex w-[46%] items-center justify-center sm:left-10 md:left-14 lg:left-20 xl:left-28'>
        <div className='pointer-events-auto max-w-[520px] text-left'>
          <h2 className='text-2xl font-extrabold tracking-normal text-blue-950 sm:text-3xl md:text-4xl lg:text-5xl'>
            Listen &amp; Learn
          </h2>
          <p className='mt-2 text-xs font-semibold leading-snug text-blue-950 sm:text-sm md:text-lg lg:text-xl'>
            Explore ebooks, audiobooks, and learning resources designed for everyday growth
          </p>
          <Link
            href='/#free-summaries-section'
            className='mt-4 inline-flex items-center justify-center rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-orange-600 md:px-7 md:py-3 md:text-base'
          >
            Start With Free learning
          </Link>
        </div>
      </div>

      {activeBanners.length > 1 && (
        <div className='absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 z-20'>
          <div className='flex items-center space-x-1 sm:space-x-2 md:space-x-3 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 transition-all duration-300'>
            {activeBanners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1 sm:h-2 md:h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'bg-[#0057b8] shadow-[0_1px_4px_rgba(0,0,0,0.35)] w-3 sm:w-6 md:w-8 lg:w-12'
                    : 'bg-[#f28c18] shadow-[0_1px_4px_rgba(0,0,0,0.3)] w-1 sm:w-2 md:w-3 hover:bg-[#ffad42]'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
