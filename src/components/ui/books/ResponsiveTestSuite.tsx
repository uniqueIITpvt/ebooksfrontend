'use client';

import { useState, useEffect } from 'react';
import { MEDIA_QUERIES } from './ResponsiveConfig'; 

/**
 * ResponsiveTestSuite Component
 * 
 * A debugging component to test and visualize responsive behavior
 * across different screen sizes. Only shown in development mode.
 */

interface ResponsiveTestSuiteProps {
  enabled?: boolean;
}

export default function ResponsiveTestSuite({ enabled = false }: ResponsiveTestSuiteProps) {
  const [currentBreakpoint, setCurrentBreakpoint] = useState('');
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const updateScreenInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({ width, height });

      // Determine current breakpoint
      if (width >= 1536) {
        setCurrentBreakpoint('2xl');
      } else if (width >= 1280) {
        setCurrentBreakpoint('xl');
      } else if (width >= 1024) {
        setCurrentBreakpoint('lg');
      } else if (width >= 768) {
        setCurrentBreakpoint('md');
      } else if (width >= 640) {
        setCurrentBreakpoint('sm');
      } else if (width >= 475) {
        setCurrentBreakpoint('xs');
      } else {
        setCurrentBreakpoint('mobile');
      }

      // Check for touch device
      setIsTouchDevice(window.matchMedia(MEDIA_QUERIES.isTouch).matches);
      
      // Check for reduced motion preference
      setIsReducedMotion(window.matchMedia(MEDIA_QUERIES.isReducedMotion).matches);
    };

    updateScreenInfo();
    window.addEventListener('resize', updateScreenInfo);

    return () => {
      window.removeEventListener('resize', updateScreenInfo);
    };
  }, [enabled]);

  if (!enabled || process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className='fixed top-0 right-0 z-50 bg-black/90 text-white text-xs p-4 rounded-bl-lg backdrop-blur-sm'>
      <h3 className='font-bold mb-2'>Responsive Debug Info</h3>
      
      <div className='space-y-1'>
        <div>
          <span className='font-medium'>Breakpoint:</span> 
          <span className={`ml-2 px-2 py-1 rounded ${
            currentBreakpoint === 'mobile' ? 'bg-red-600' :
            currentBreakpoint === 'xs' ? 'bg-orange-600' :
            currentBreakpoint === 'sm' ? 'bg-yellow-600' :
            currentBreakpoint === 'md' ? 'bg-green-600' :
            currentBreakpoint === 'lg' ? 'bg-blue-600' :
            currentBreakpoint === 'xl' ? 'bg-indigo-600' :
            'bg-purple-600'
          }`}>
            {currentBreakpoint}
          </span>
        </div>
        
        <div>
          <span className='font-medium'>Screen:</span> {screenSize.width} × {screenSize.height}
        </div>
        
        <div>
          <span className='font-medium'>Touch:</span> {isTouchDevice ? 'Yes' : 'No'}
        </div>
        
        <div>
          <span className='font-medium'>Reduced Motion:</span> {isReducedMotion ? 'Yes' : 'No'}
        </div>
      </div>

      {/* Breakpoint indicators */}
      <div className='mt-3 pt-2 border-t border-white/20'>
        <div className='text-xs opacity-75'>
          <div>Mobile: &lt; 475px</div>
          <div>XS: 475px - 640px</div>
          <div>SM: 640px - 768px</div>
          <div>MD: 768px - 1024px</div>
          <div>LG: 1024px - 1280px</div>
          <div>XL: 1280px - 1536px</div>
          <div>2XL: &gt; 1536px</div>
        </div>
      </div>

      {/* Grid visualization */}
      <div className='mt-3 pt-2 border-t border-white/20'>
        <div className='text-xs opacity-75'>
          Grid Columns:
          <div>
            {currentBreakpoint === 'mobile' && '1 column'}
            {currentBreakpoint === 'xs' && '2 columns'}
            {currentBreakpoint === 'sm' && '2 columns'}
            {currentBreakpoint === 'md' && '3 columns'}
            {currentBreakpoint === 'lg' && '3 columns'}
            {currentBreakpoint === 'xl' && '4 columns'}
            {currentBreakpoint === '2xl' && '5 columns'}
          </div>
        </div>
      </div>
    </div>
  );
}

// Test component to show responsive behavior of book cards
export function ResponsiveBookCardTest() {
  return (
    <div className='p-8 bg-gray-100'>
      <h2 className='text-2xl font-bold mb-6'>Responsive Book Card Test</h2>
      
      {/* Grid test */}
      <div className='
        grid gap-4 xs:gap-5 sm:gap-6 lg:gap-8 mb-8
        grid-cols-1 
        xs:grid-cols-2 
        sm:grid-cols-2 
        md:grid-cols-3 
        lg:grid-cols-3 
        xl:grid-cols-4 
        2xl:grid-cols-5
      '>
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className='
              bg-white rounded-lg p-4 shadow-md
              h-64 xs:h-72 sm:h-80 lg:h-96
              flex items-center justify-center
              text-center
            '
          >
            <div>
              <h3 className='text-sm xs:text-base sm:text-lg font-semibold mb-2'>
                Book Card {i + 1}
              </h3>
              <p className='text-xs xs:text-sm text-gray-600'>
                Responsive test card
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Typography test */}
      <div className='bg-white rounded-lg p-6 mb-8'>
        <h3 className='text-xl mb-4'>Typography Responsiveness</h3>
        <div className='space-y-2'>
          <div className='text-responsive-xs'>Responsive XS text</div>
          <div className='text-responsive-sm'>Responsive SM text</div>
          <div className='text-responsive-base'>Responsive Base text</div>
          <div className='text-responsive-lg'>Responsive LG text</div>
          <div className='text-responsive-xl'>Responsive XL text</div>
          <div className='text-responsive-2xl'>Responsive 2XL text</div>
          <div className='text-responsive-3xl'>Responsive 3XL text</div>
        </div>
      </div>

      {/* Spacing test */}
      <div className='bg-white rounded-lg mb-8'>
        <div className='px-3 xs:px-4 sm:px-6 lg:px-8 py-6 xs:py-8 sm:py-10 md:py-12 lg:py-16'>
          <h3 className='text-xl mb-4'>Responsive Spacing Test</h3>
          <p className='text-gray-600'>
            This container has responsive padding that adapts to screen size.
          </p>
        </div>
      </div>
    </div>
  );
}
