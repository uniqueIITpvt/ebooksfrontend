'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/primitives/Button';

interface BooksCTAProps {
  className?: string;
}

export default function BooksCTA({ className = '' }: BooksCTAProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    setEmail('');

    // Reset after 3 seconds
    setTimeout(() => setIsSubmitted(false), 3000);
  };

  return (
    <section className={`
      py-8 xs:py-10 sm:py-12 md:py-16 lg:py-20
      bg-gradient-to-r from-blue-600 to-indigo-700
      relative overflow-hidden
      ${className}
    `}>
      {/* Background decorative elements */}
      <div className='absolute inset-0 pointer-events-none'>
        <div className='absolute top-10 left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl' />
        <div className='absolute bottom-10 right-10 w-48 h-48 bg-white/3 rounded-full blur-3xl' />
        <div className='absolute top-1/2 left-1/4 w-24 h-24 bg-white/4 rounded-full blur-xl' />
      </div>

      <div className='max-w-4xl mx-auto text-center px-3 xs:px-4 sm:px-6 lg:px-8 relative z-10'>
        {/* Responsive headings */}
        <h2 className='
          text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl 
          font-bold text-white 
          mb-3 xs:mb-4 sm:mb-6 lg:mb-8
          leading-tight
        '>
          Stay Updated on New Releases
        </h2>
        
        <p className='
          text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl 
          text-white/90 
          mb-6 xs:mb-8 sm:mb-10 lg:mb-12
          max-w-2xl mx-auto leading-relaxed
        '>
          Be the first to know when UniqueIIT Research Center publishes new books and resources
        </p>

        {/* Responsive form */}
        {isSubmitted ? (
          <div className='
            bg-white/10 backdrop-blur-sm 
            rounded-2xl xs:rounded-3xl 
            p-6 xs:p-8 sm:p-10 
            max-w-md mx-auto
            border border-white/20
          '>
            <div className='text-white text-center'>
              <div className='w-12 h-12 xs:w-16 xs:h-16 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center'>
                <svg className='w-6 h-6 xs:w-8 xs:h-8' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                </svg>
              </div>
              <h3 className='text-lg xs:text-xl font-semibold mb-2'>Thank you!</h3>
              <p className='text-sm xs:text-base text-blue-100'>
                You&apos;ll be notified about new releases.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className='max-w-md mx-auto'>
            {/* Mobile-first form layout */}
            <div className='flex flex-col xs:flex-row gap-3 xs:gap-4'>
              <div className='flex-1'>
                <input
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='Enter your email'
                  required
                  className='
                    w-full 
                    px-4 py-3 xs:px-5 xs:py-3.5 sm:px-6 sm:py-4
                    bg-white/95 backdrop-blur-sm
                    rounded-xl xs:rounded-2xl 
                    border-0 
                    text-sm xs:text-base lg:text-lg
                    text-gray-900 placeholder-gray-500
                    focus:ring-2 focus:ring-white focus:outline-none
                    transition-all duration-200
                    shadow-lg
                  '
                />
              </div>
              
              <Button
                type='submit'
                variant='secondary'
                loading={isSubmitting}
                className='
                  bg-white text-blue-600 hover:bg-gray-100
                  px-6 py-3 xs:px-8 xs:py-3.5 sm:px-10 sm:py-4
                  rounded-xl xs:rounded-2xl
                  text-sm xs:text-base lg:text-lg
                  font-semibold shadow-lg
                  min-w-[120px] xs:min-w-[140px]
                  whitespace-nowrap
                '
                disabled={!email || isSubmitting}
              >
                {isSubmitting ? 'Subscribing...' : 'Subscribe'}
              </Button>
            </div>

            {/* Privacy note */}
            <p className='
              text-xs xs:text-sm 
              text-blue-200/80 
              mt-4 xs:mt-6 
              leading-relaxed
            '>
              We respect your privacy. Unsubscribe at any time.
            </p>
          </form>
        )}

        {/* Additional features for larger screens */}
        <div className='hidden lg:block mt-12'>
          <div className='grid grid-cols-3 gap-8 max-w-2xl mx-auto'>
            <div className='text-center'>
              <div className='w-12 h-12 bg-white/10 rounded-full mx-auto mb-4 flex items-center justify-center'>
                <svg className='w-6 h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253' />
                </svg>
              </div>
              <p className='text-sm text-blue-100'>New Books</p>
            </div>
            <div className='text-center'>
              <div className='w-12 h-12 bg-white/10 rounded-full mx-auto mb-4 flex items-center justify-center'>
                <svg className='w-6 h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M9.464 15.536a5 5 0 01-7.072 0M4.636 4.636a9 9 0 000 12.728' />
                </svg>
              </div>
              <p className='text-sm text-blue-100'>Audiobooks</p>
            </div>
            <div className='text-center'>
              <div className='w-12 h-12 bg-white/10 rounded-full mx-auto mb-4 flex items-center justify-center'>
                <svg className='w-6 h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' />
                </svg>
              </div>
              <p className='text-sm text-blue-100'>Exclusive Content</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
