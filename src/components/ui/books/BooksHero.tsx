'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';

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
    <section className={`relative overflow-hidden w-full ${className}`}>
      {/* Matches the home hero banner sizing */}
      <div className="
        h-[110px] 
        xs:h-[90px] 
        sm:h-[120px] 
        md:h-[150px] 
        lg:h-[190px] 
        xl:h-[210px] 
        2xl:h-[240px]
        relative
      ">
        {/* Background Image - Show current banner */}
        {currentBanner ? (
          <Image
            src={currentBanner.image}
            alt={currentBanner.title || 'Books Banner'}
            fill
            className='object-fill object-center transition-opacity duration-500'
            loading='eager'
            fetchPriority='high'
            quality={100}
            sizes='100vw'
            style={{
              imageRendering: 'auto',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
            }}
          />
        ) : (
          <div className='absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200' />
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        
        {/* Dots indicator - show only if multiple banners */}
        {activeBanners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {activeBanners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentSlide 
                    ? 'bg-[#0057b8] shadow-[0_1px_4px_rgba(0,0,0,0.35)] w-6' 
                    : 'bg-[#f28c18] shadow-[0_1px_4px_rgba(0,0,0,0.3)] hover:bg-[#ffad42]'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
