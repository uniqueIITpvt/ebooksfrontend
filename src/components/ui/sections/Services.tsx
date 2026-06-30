'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
// import { CheckCircleIcon } from '@heroicons/react/24/outline';

import { API_CONFIG } from '@/config/api';

const API_URL = API_CONFIG.API_BASE_URL;

interface ResourceItem {
  _id: string;
  name: string;
  description: string;
  image: string;
  gradient: string;
  slug: string;
  category: string;
  featured?: boolean;
}

export default function Services() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [services, setServices] = useState<ResourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch items from API
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch(`${API_URL}/categories?limit=8`);
        if (!response.ok) {
          throw new Error('Failed to fetch items');
        }

        const data = await response.json();
        
        if (data.success && data.data) {
          setServices(data.data);
        }
      } catch (err) {
        console.error('Error fetching items:', err);
        setServices([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, []);

  useEffect(() => {
    setIsVisible(true);

    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleCardInteraction = (serviceId: string, isInteracting: boolean) => {
    if (!isMobile) {
      setHoveredCard(isInteracting ? serviceId : null);
    }
  };

  const handleMobileCardTap = (serviceId: string) => {
    if (isMobile) {
      setHoveredCard(hoveredCard === serviceId ? null : serviceId); 
    }
  };

  return (
    <section className='py-4 sm:py-8 lg:py-12 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 relative overflow-hidden'>
      {/* Background Elements */}
      <div className='absolute inset-0 opacity-30'>
        <div className='absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-indigo-600/5' />
        <div className='absolute top-10 sm:top-20 left-5 sm:left-10 w-20 sm:w-32 h-20 sm:h-32 bg-blue-200/20 rounded-full blur-2xl sm:blur-3xl animate-pulse' />
        <div className='absolute bottom-10 sm:bottom-20 right-5 sm:right-10 w-24 sm:w-40 h-24 sm:h-40 bg-indigo-200/15 rounded-full blur-2xl sm:blur-3xl animate-pulse delay-1000' />
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative'>
        {/* Header */}
        <div
          className={`text-center mb-4 sm:mb-8 lg:mb-12 ${
            isVisible
              ? 'animate-in slide-in-from-top duration-1000'
              : 'opacity-0'
          }`}
        >
          {/* <div className='inline-flex items-center bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-4 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6 shadow-lg'>
            <CheckCircleIcon className='w-4 h-4 sm:w-5 sm:h-5 mr-2' />
            <span className='truncate'>
              Curated Learning Resources
            </span>
          </div> */}
          <h2 className='text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-slate-900 mb-4 sm:mb-6 leading-tight px-2'>
            Explore Knowledge with{' '}
            <span className='bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent'>
              Curated Resources
            </span>
          </h2>
          <p className='text-base sm:text-lg md:text-xl lg:text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed px-4'>
            Discover books and audiobooks designed to help you learn faster,
            build skills, and stay consistent.
          </p>
        </div>

        {/* Services Grid */}
        <div className='grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-8 mb-0'>
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 8 }, (_, index) => (
              <div
                key={`service-skeleton-${index}`}
                className='relative rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden shadow-lg bg-slate-200 animate-pulse'
                style={{ height: '288px' }}
              />
            ))
          ) : services.length === 0 ? (
            // Empty state
            <div className='col-span-full text-center py-12'>
              <p className='text-slate-600 text-lg'>No services available at the moment.</p>
            </div>
          ) : (
            services.map((service, index) => (
            <Link
              key={service._id}
              href={`/categories/${service.slug}`}
              className={`group relative rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-700 transform hover:scale-105 cursor-pointer block ${
                isVisible
                  ? 'animate-in slide-in-from-bottom duration-1000'
                  : 'opacity-0'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
              onMouseEnter={() => handleCardInteraction(service._id, true)}
              onMouseLeave={() => handleCardInteraction(service._id, false)}
              onClick={() => handleMobileCardTap(service._id)}
            >
              {/* Image Container */}
              <div className='relative h-36 sm:h-56 md:h-64 lg:h-72 xl:h-80 overflow-hidden'>
                {/* Background Image - Handle SVG separately */}
                <div className='w-full h-full relative'>
                  {service.image?.endsWith('.svg') || service.image?.includes('.svg') ? (
                    // Use regular img tag for SVG files
                    <img
                      src={service.image}
                      alt={service.name}
                      className='w-full h-full object-cover object-center'
                    />
                  ) : (
                    // Use Next.js Image for other formats
                    <Image
                      src={service.image}
                      alt={service.name}
                      fill
                      className='object-cover object-center'
                      sizes='(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 33vw, 25vw'
                      priority={index < 4}
                    />
                  )}
                </div>

                {/* Gradient Overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-20 group-hover:opacity-30 transition-opacity duration-500`}
                />

                {/* Hover/Tap Text Overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30 transition-all duration-500 ${
                    hoveredCard === service._id ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <div className='absolute inset-0 flex flex-col justify-center items-center text-center p-2 sm:p-4 lg:p-6 text-white transform transition-all duration-500'>
                    <h3
                      className={`text-sm sm:text-xl lg:text-2xl font-bold mb-1 sm:mb-3 lg:mb-4 transform transition-all duration-500 ${
                        hoveredCard === service._id
                          ? 'translate-y-0 opacity-100'
                          : 'translate-y-4 opacity-0'
                      }`}
                    >
                      {service.name}
                    </h3>
                    <div
                      className={`text-xs sm:text-sm lg:text-base leading-relaxed transform transition-all duration-500 delay-100 prose prose-sm prose-invert max-w-none ${
                        hoveredCard === service._id
                          ? 'translate-y-0 opacity-100'
                          : 'translate-y-4 opacity-0'
                      }`}
                      dangerouslySetInnerHTML={{ __html: service.description }}
                    />
                  </div>
                </div>

                {/* Service Name at Bottom (visible when not hovering/tapped) */}
                <div
                  className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 sm:p-4 lg:p-6 transition-opacity duration-500 ${
                    hoveredCard === service._id ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  <h3 className='text-white text-sm sm:text-lg lg:text-xl font-bold leading-tight'>
                    {service.name}
                  </h3>
                </div>
              </div>
            </Link>
          ))
          )}
        </div>

        {/* Mobile-specific instruction text */}
        <div className='block sm:hidden text-center mb-8'>
          <p className='text-sm text-slate-500 px-4'>
            Tap on any card to explore detailed resource information
          </p>
        </div>
      </div>
    </section>
  );
}
