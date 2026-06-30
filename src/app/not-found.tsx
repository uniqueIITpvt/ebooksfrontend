'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  HomeIcon,
  ArrowLeftIcon,
  BookOpenIcon,
  MicrophoneIcon,
  UserIcon,
  MagnifyingGlassIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';

export default function NotFound() {
  const router = useRouter();

  const quickLinks = [
    {
      name: 'Home',
      href: '/',
      icon: HomeIcon,
      description: 'Return to homepage',
      color: 'from-blue-500 to-indigo-500',
    },
    {
      name: 'About',
      href: '/about',
      icon: UserIcon,
      description: 'Learn about TechUniqueIIT',
      color: 'from-purple-500 to-pink-500',
    },
    {
      name: 'Books',
      href: '/books',
      icon: BookOpenIcon,
      description: 'Explore our collection of ebooks',
      color: 'from-emerald-500 to-teal-500',
    },
  ];

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 pt-20'>
      <div className='flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16'>
        {/* Background Elements */}
        <div className='absolute inset-0 overflow-hidden pointer-events-none'>
          <div className='absolute top-32 left-4 sm:left-10 w-20 h-20 sm:w-32 sm:h-32 bg-blue-200/20 rounded-full blur-3xl animate-pulse' />
          <div className='absolute bottom-20 right-4 sm:right-10 w-24 h-24 sm:w-40 sm:h-40 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000' />
          <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 sm:w-64 sm:h-64 bg-indigo-200/10 rounded-full blur-3xl animate-pulse delay-500' />
        </div>

        <div className='max-w-4xl mx-auto text-center relative z-10 w-full'>
          {/* 404 Number */}
          <div className='mb-6 sm:mb-8'>
            <h1 className='text-6xl sm:text-8xl md:text-9xl lg:text-[12rem] font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent leading-none'>
              404
            </h1>
            <div className='relative mt-2 sm:mt-4'>
              <div className='absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 h-0.5 sm:h-1 rounded-full transform scale-x-0 animate-[scaleX_1s_ease-out_0.5s_forwards] origin-center' />
            </div>
          </div>

          {/* Main Message */}
          <div className='mb-6 sm:mb-8 lg:mb-12 px-2'>
            <h2 className='text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-3 sm:mb-4'>
              Oops! Page Not Found
            </h2>
            <p className='text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed px-2'>
              The page you&apos;re looking for seems to have wandered off.
              Don&apos;t worry, even the best of us lose our way sometimes.
              Let&apos;s get you back on track.
            </p>
          </div>

          {/* Animated Icon */}
          <div className='mb-6 sm:mb-8 lg:mb-12'>
            <div className='w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center animate-bounce'>
              <MagnifyingGlassIcon className='w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-blue-600' />
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12 lg:mb-16 px-4'>
            <button
              onClick={() => router.back()}
              className='inline-flex items-center justify-center px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base'
            >
              <ArrowLeftIcon className='w-4 h-4 sm:w-5 sm:h-5 mr-2' />
              Go Back
            </button>

            <Link
              href='/'
              className='inline-flex items-center justify-center px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-white text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all duration-300 shadow-lg hover:shadow-xl border border-slate-200 hover:border-slate-300 transform hover:scale-105 text-sm sm:text-base'
            >
              <HomeIcon className='w-4 h-4 sm:w-5 sm:h-5 mr-2' />
              Go Home
            </Link>
          </div>

          {/* Quick Links */}
          <div className='mb-8 sm:mb-12 px-4'>
            <h3 className='text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 mb-4 sm:mb-6'>
              Or explore these popular sections:
            </h3>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6'>
              {quickLinks.map((link, index) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className='group bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 hover:bg-white transition-all duration-300 shadow-lg hover:shadow-xl border border-slate-200/50 hover:border-slate-300 transform hover:scale-105'
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 bg-gradient-to-r ${link.color} rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300`}
                  >
                    <link.icon className='w-5 h-5 sm:w-6 sm:h-6' />
                  </div>
                  <h4 className='font-semibold text-slate-900 mb-1 sm:mb-2 group-hover:text-blue-600 transition-colors text-sm sm:text-base'>
                    {link.name}
                  </h4>
                  <p className='text-xs sm:text-sm text-slate-600 group-hover:text-slate-700 transition-colors leading-relaxed'>
                    {link.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* Help Section */}
          <div className='bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 border border-blue-100 mx-4 sm:mx-0'>
            <div className='flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6'>
              <div className='flex-shrink-0'>
                <div className='w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center'>
                  <HeartIcon className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
                </div>
              </div>
              <div className='text-center sm:text-left'>
                <h4 className='text-base sm:text-lg font-semibold text-slate-900 mb-2'>
                  Need Help Finding a Book?
                </h4>
                <p className='text-sm sm:text-base text-slate-600 mb-3 sm:mb-4 leading-relaxed'>
                  Our support team is here to help you discover your next great read.
                </p>
                <div className='flex flex-col sm:flex-row gap-2 sm:gap-3'>
                  <Link
                    href='/contact'
                    className='inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-xs sm:text-sm'
                  >
                    Contact Support
                  </Link>
                  <Link
                    href='/books'
                    className='inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors text-xs sm:text-sm'
                  >
                    Browse Books
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Message */}
          <div className='mt-6 sm:mt-8 text-xs sm:text-sm text-slate-500 px-4'>
            <p>
              Lost? That&apos;s okay. Sometimes the best discoveries happen when
              we take the scenic route.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
