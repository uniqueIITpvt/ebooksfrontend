'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Banner } from '@/lib/server/public-data';
import { API_CONFIG } from '@/config/api';

const API_URL = API_CONFIG.API_BASE_URL;

// REMOVE fallback slides - only show API banners

// const socialLinks = [
//   {
//     name: 'Facebook',
//     url: 'https://www.facebook.com',
//     icon: (
//       <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
//         <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
//       </svg>
//     )
//   },
//   {
//     name: 'Instagram',
//     url: 'https://www.instagram.com',
//     icon: (
//       <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
//         <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
//       </svg>
//     )
//   },
//   {
//     name: 'LinkedIn', 
//     url: 'https://www.linkedin.com',
//     icon: (
//       <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
//         <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
//       </svg>
//     )
//   },
//   {
//     name: 'YouTube',
//     url: 'https://www.youtube.com',
//     icon: (
//       <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
//         <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
//       </svg>
//     )
//   },
//   {
//     name: 'Twitter',
//     url: 'https://www.twitter.com',
//     icon: (
//       <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
//         <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
//       </svg>
//     )
//   }
// ];

interface HeroProps {
  banners: Banner[];
  bannerEnabled: boolean;
}

export default function Hero({ banners: initialBanners, bannerEnabled: initialBannerEnabled }: HeroProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [bannerEnabled, setBannerEnabled] = useState(initialBannerEnabled);
  const [banners, setBanners] = useState(initialBanners);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleStartFreeLearning = () => {
    const section =
      document.getElementById('free-summaries-section') ||
      document.getElementById('free-summaries-section-mobile');

    if (!section) {
      window.location.href = '/free-summaries-section';
      return;
    }

    window.history.pushState(null, '', '/free-summaries-section');
    const scrollOffset = window.innerWidth < 768 ? 80 : 120;
    window.scrollTo({
      top: section.getBoundingClientRect().top + window.scrollY + scrollOffset,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    const fetchBannerSetting = async () => {
      try {
        const res = await fetch(`${API_URL}/settings/public`);
        const data = await res.json();

        const value = data?.success ? data?.data?.banner_visual : undefined;
        const enabled = value === 1 || value === true || value === '1' || value === 'true';
        setBannerEnabled(enabled);

        if (!enabled) {
          setLoading(false);
        }
      } catch (err) {
        console.error('Hero - Error fetching banner setting:', err);
        setBannerEnabled(false);
        setLoading(false);
      }
    };

    fetchBannerSetting();
  }, []);

  // Fetch banners from API
  const fetchBanners = useCallback(async () => {
    try {
      if (bannerEnabled !== true) return;
      const response = await fetch(`${API_URL}/banners`);
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        setBanners(data.data);
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  }, [bannerEnabled]);

  useEffect(() => {
    if (bannerEnabled === true) {
      fetchBanners();
    }
  }, [fetchBanners]);

  // Convert banners to slides format - NO fallback
  const heroSlides = banners.length > 0 
    ? banners.map((banner, index) => ({
        id: index + 1,
        backgroundImage: banner.image,
        title: banner.title,
        subtitle: banner.subtitle,
        link: banner.link,
      }))
    : [];

  useEffect(() => {
    if (heroSlides.length <= 1) {
      return;
    }
    const interval = setInterval(() => {
      if (!isPaused && !isDragging) {
        setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused, isDragging, heroSlides.length]);

  // Global mouse event listeners for better drag experience
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setCurrentX(e.clientX);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        const diff = startX - currentX;
        const threshold = 50;
        
        if (Math.abs(diff) > threshold) {
          if (diff > 0) {
            setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
          } else {
            setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
          }
        }
        
        setIsDragging(false);
        setIsPaused(false);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, startX, currentX]);

  // Navigation functions
  const nextSlide = () =>
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  const prevSlide = () =>
    setCurrentSlide(
      (prev) => (prev - 1 + heroSlides.length) % heroSlides.length
    );
  const goToSlide = (index: number) => setCurrentSlide(index);

  // Touch/Mouse drag handlers
  const handleStart = (clientX: number) => {
    setIsDragging(true);
    setStartX(clientX);
    setCurrentX(clientX);
    setIsPaused(true);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    setCurrentX(clientX);
  };

  const handleEnd = () => {
    if (!isDragging) return;
    
    const diff = startX - currentX;
    const threshold = 50; // Minimum swipe distance
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        nextSlide(); // Swipe left - next slide
      } else {
        prevSlide(); // Swipe right - previous slide
      }
    }
    
    setIsDragging(false);
    setIsPaused(false);
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleEnd();
    }
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Right click and long press handlers
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 3000); // Resume after 3 seconds
  };

  const handleLongPressStart = () => {
    setIsPaused(true);
  };

  const handleLongPressEnd = () => {
    setTimeout(() => setIsPaused(false), 1000);
  };

  const handleImageLoad = () => {
    // setIsLoading(false);
  };

  if (!bannerEnabled || heroSlides.length === 0) {
    return <div />; // Spacer when banner is hidden
  }

  return (
    <section
      className='relative h-[300px] xs:h-[290px] sm:h-[270px] md:h-[310px] lg:h-[400px] xl:h-[500px] 2xl:h-[520px] w-full overflow-hidden cursor-grab active:cursor-grabbing select-none'
      id='hero'
      ref={containerRef}  
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onContextMenu={handleContextMenu}
      style={{ touchAction: 'pan-y pinch-zoom' }}
    >
      <div className='absolute inset-0'>
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              index === currentSlide
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-110'
            }`}
          >
            <div 
              className='absolute inset-0 bg-slate-900'
              onTouchStart={handleLongPressStart}
              onTouchEnd={handleLongPressEnd}
              onMouseDown={handleLongPressStart}
              onMouseUp={handleLongPressEnd}
            >
              <Image
                src={slide.backgroundImage}
                alt={`Hero banner ${slide.id}`}
                fill
                className='object-fill object-center pointer-events-none'
                priority={index === 0}
                loading={index === 0 ? 'eager' : 'lazy'}
                quality={100}
                sizes='100vw'
                draggable={false}
                onLoad={handleImageLoad}
                style={{
                  imageRendering: 'auto',
                  transform: 'translateZ(0)',
                  backfaceVisibility: 'hidden',
                }}
              />
            </div>
          </div>
        ))}
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
          <button
            type='button'
            onClick={handleStartFreeLearning}
            className='mt-4 inline-flex items-center justify-center rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-orange-600 md:px-7 md:py-3 md:text-base'
          >
            Start With Free learning
          </button>
        </div>
      </div>

      <div className='absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 z-20'>
        <div className='flex items-center space-x-1 sm:space-x-2 md:space-x-3 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 transition-all duration-300'>
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              suppressHydrationWarning
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

      {/* Social Media Links - Right Side */}
      {/* <div className='absolute right-2 xs:right-3 sm:right-4 md:right-6 lg:right-8 top-1/2 transform -translate-y-1/2 z-20'>
        <div className='flex flex-col gap-3 xs:gap-1.5 sm:gap-2 md:gap-3 lg:gap-4'>
          {socialLinks.map((social) => {
            // Define brand colors for each platform
            const getBrandStyles = (name: string) => {
              switch (name) {
                case 'Facebook':
                  return 'bg-blue-600 hover:bg-blue-700 border-blue-500 hover:border-blue-600 text-white';
                case 'Instagram':
                  return 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 border-pink-400 hover:border-pink-500 text-white';
                case 'LinkedIn':
                  return 'bg-blue-700 hover:bg-blue-800 border-blue-600 hover:border-blue-700 text-white';
                case 'YouTube':
                  return 'bg-red-600 hover:bg-red-700 border-red-500 hover:border-red-600 text-white';
                case 'Twitter':
                  return 'bg-black hover:bg-gray-900 border-gray-600 hover:border-gray-700 text-white';
                default:
                  return 'bg-white/20 hover:bg-white/30 border-white/30 hover:border-white/50 text-white';
              }
            };

            return (
              <Link
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group backdrop-blur-md p-1.5 xs:p-1.5 sm:p-2 md:p-2.5 lg:p-3 xl:p-3.5 rounded-full border transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl ${getBrandStyles(social.name)}`}
                aria-label={`Visit our ${social.name} page`}
              >
                <div className='transition-transform duration-300 group-hover:scale-110'>
                  <div className='w-3.5 h-3.5 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7'>
                    {social.icon}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div> */}
      <div className='absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-white/20 z-20'>
        <div
          className='h-full bg-white transition-all duration-300 ease-linear'
          style={{
            width: `${((currentSlide + 1) / heroSlides.length) * 100}%`,
          }}
        />
      </div>
    </section>
  );
}
