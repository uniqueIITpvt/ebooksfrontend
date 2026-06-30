'use client';

import { useState } from 'react';
import {
  HomeIcon,
  WrenchScrewdriverIcon,
  VideoCameraIcon,
  NewspaperIcon,
  PhoneIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface SectionItem {
  id: string;
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  description: string;
}

const sectionItems: SectionItem[] = [
  {
    id: 'hero',
    name: 'Home',
    icon: HomeIcon,
    color: 'from-blue-500 to-indigo-600',
    description: 'Welcome section',
  },
  {
    id: 'services',
    name: 'Services',
    icon: WrenchScrewdriverIcon,
    color: 'from-blue-500 to-indigo-600',
    description: 'Our therapeutic services',
  },

  {
    id: 'featured-content',
    name: 'YouTube',
    icon: VideoCameraIcon,
    color: 'from-blue-500 to-indigo-600',
    description: 'Featured content',
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    icon: NewspaperIcon,
    color: 'from-blue-500 to-indigo-600',
    description: 'Stay updated',
  },

  {
    id: 'cta',
    name: 'Contact',
    icon: PhoneIcon,
    color: 'from-blue-500 to-indigo-600',
    description: 'Get in touch',
  },
];

export default function SectionToggle() {
  const [isOpen, setIsOpen] = useState(false); // Closed by default on mobile
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 80; // Account for fixed header
      const elementPosition = element.offsetTop;
      const offsetPosition = elementPosition - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
      setIsOpen(false); // Close the toggle after clicking
    }
  };

  return (
    <>
      {/* Mobile/Tablet: Bottom-right floating button */}
      <div className='fixed right-4 bottom-4 z-50 md:hidden'>
        <div className='relative'>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center group ${
              isOpen ? 'scale-110' : 'hover:scale-105'
            }`}
            aria-label={
              isOpen ? 'Close navigation menu' : 'Open navigation menu'
            }
          >
            {isOpen ? (
              <XMarkIcon className='w-6 h-6 transition-transform duration-300' />
            ) : (
              <Bars3Icon className='w-6 h-6 transition-transform duration-300 group-hover:rotate-180' />
            )}
          </button>

          {/* Mobile Navigation Menu - Full screen overlay */}
          {isOpen && (
            <div
              className='fixed inset-0 bg-black/50 backdrop-blur-sm z-40'
              onClick={() => setIsOpen(false)}
            >
              <div
                className='absolute bottom-20 right-4 left-4 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-4 max-h-[70vh] overflow-y-auto'
                onClick={(e) => e.stopPropagation()}
              >
                <div className='text-center mb-4'>
                  <h3 className='text-lg font-bold text-slate-900 mb-1'>
                    Quick Navigation
                  </h3>
                  <p className='text-sm text-slate-600'>Jump to any section</p>
                </div>

                <div className='space-y-3'>
                  {sectionItems.map((item, index) => {
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => scrollToSection(item.id)}
                        className={`w-full flex items-center p-4 rounded-xl transition-all duration-300 hover:shadow-lg group bg-gradient-to-r ${item.color} hover:shadow-xl transform hover:scale-105`}
                        style={{
                          animationDelay: `${index * 50}ms`,
                        }}
                      >
                        <div className='flex items-center text-white w-full'>
                          <div className='w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center mr-4 group-hover:bg-white/30 transition-all duration-300'>
                            <IconComponent className='w-5 h-5' />
                          </div>
                          <div className='flex-1 text-left'>
                            <div className='font-semibold text-base'>
                              {item.name}
                            </div>
                            <div className='text-sm opacity-90'>
                              {item.description}
                            </div>
                          </div>
                          <div className='w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-all duration-300'>
                            <svg
                              className='w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M9 5l7 7-7 7'
                              />
                            </svg>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className='mt-4 pt-4 border-t border-slate-200/50 text-center'>
                  <p className='text-xs text-slate-500'>
                    Click to navigate smoothly
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop: Left side panel */}
      <div className='hidden md:block fixed left-4 lg:left-6 top-20 z-50'>
        <div className='relative'>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center group ${
              isOpen ? 'scale-110' : 'hover:scale-105'
            }`}
            aria-label={
              isOpen ? 'Close navigation menu' : 'Open navigation menu'
            }
          >
            {isOpen ? (
              <XMarkIcon className='w-5 h-5 transition-transform duration-300' />
            ) : (
              <Bars3Icon className='w-5 h-5 transition-transform duration-300 group-hover:rotate-180' />
            )}
          </button>

          {/* Desktop Navigation Menu */}
          <div
            className={`absolute top-0 left-14 transition-all duration-500 ease-out ${
              isOpen
                ? 'opacity-100 transform translate-x-0 scale-100'
                : 'opacity-0 transform -translate-x-4 scale-95 pointer-events-none'
            }`}
          >
            <div className='bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-4 min-w-[280px] lg:min-w-[320px] max-h-[80vh] overflow-y-auto'>
              <div className='text-center mb-4'>
                <h3 className='text-lg font-bold text-slate-900 mb-1'>
                  Quick Navigation
                </h3>
                <p className='text-sm text-slate-600'>Jump to any section</p>
              </div>

              <div className='space-y-2'>
                {sectionItems.map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      onMouseEnter={() => setHoveredSection(item.id)}
                      onMouseLeave={() => setHoveredSection(null)}
                      className={`w-full flex items-center p-3 rounded-xl transition-all duration-300 hover:shadow-lg group bg-gradient-to-r ${
                        item.color
                      } hover:shadow-xl transform ${
                        hoveredSection === item.id
                          ? 'translate-x-4 scale-105'
                          : 'hover:scale-105'
                      } ${
                        isOpen
                          ? 'animate-in slide-in-from-left duration-300'
                          : ''
                      }`}
                      style={{
                        animationDelay: `${index * 50}ms`,
                      }}
                    >
                      <div className='flex items-center text-white w-full'>
                        <div className='w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mr-3 group-hover:bg-white/30 transition-all duration-300'>
                          <IconComponent className='w-4 h-4' />
                        </div>
                        <div className='flex-1 text-left'>
                          <div className='font-semibold text-sm'>
                            {item.name}
                          </div>
                          <div className='text-xs opacity-90'>
                            {item.description}
                          </div>
                        </div>
                        <div className='w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-all duration-300'>
                          <svg
                            className='w-3 h-3 transform group-hover:translate-x-1 transition-transform duration-300'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M9 5l7 7-7 7'
                            />
                          </svg>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className='mt-4 pt-4 border-t border-slate-200/50 text-center'>
                <p className='text-xs text-slate-500'>
                  Click to navigate smoothly
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
