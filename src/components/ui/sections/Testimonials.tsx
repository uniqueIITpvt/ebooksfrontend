'use client';

import { useEffect, useState } from 'react';
import {
  CheckBadgeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HeartIcon,
  StarIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartIconSolid,
  StarIcon as StarIconSolid,
} from '@heroicons/react/24/solid';
import type { Testimonial } from '@/services/api/testimonialsApi';
import type { TestimonialStat } from '@/services/api/testimonialsApi';

const statStyles = [
  {
    icon: UsersIcon,
    color: 'from-blue-500 to-indigo-600',
  },
  {
    icon: StarIcon,
    color: 'from-yellow-500 to-orange-600',
  },
  {
    icon: HeartIcon,
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: CheckBadgeIcon,
    color: 'from-purple-500 to-violet-600',
  },
];

interface TestimonialsProps {
  testimonials: Testimonial[];
  stats: TestimonialStat[];
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'R';

export default function Testimonials({ testimonials, stats }: TestimonialsProps) {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (testimonials.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  if (testimonials.length === 0) {
    return null;
  }

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

  const currentTestimonialData = testimonials[currentTestimonial];
  const detailText =
    currentTestimonialData.detailedContent ||
    currentTestimonialData.content;
  const readerMeta = [
    currentTestimonialData.role,
    currentTestimonialData.company,
  ]
    .filter(Boolean)
    .join(' at ');

  return (
    <section className='relative overflow-hidden bg-gradient-to-r from-blue-50 via-indigo-50 to-white py-20 font-dm-sans'>
      <div className='absolute inset-0 pointer-events-none opacity-30'>
        <div className='absolute inset-0 bg-gradient-to-br from-blue-50/70 via-white/20 to-purple-100/60' />
      </div>

      <div className='relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div
          className={`mb-14 text-center ${
            isVisible
              ? 'animate-in slide-in-from-top duration-1000'
              : 'opacity-0'
          }`}
        >
          <div className='mb-6 inline-flex items-center rounded-full bg-white/70 px-6 py-3 text-sm font-semibold text-blue-700'>
            <HeartIconSolid className='mr-2 h-5 w-5 text-pink-500' />
            Reader Success Stories
          </div>
          <h2 className='mb-5 font-syne text-4xl font-bold leading-tight text-[#1E1B4B] md:text-5xl lg:text-6xl'>
            What Our{' '}
            <span className='bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent'>
              Readers Say
            </span>
          </h2>
          <p className='mx-auto max-w-4xl text-xl leading-relaxed text-slate-600 md:text-2xl'>
            Verified feedback from readers using TechUniqueIIT Research Center
            books, audiobooks, and learning resources.
          </p>
        </div>

        <div
          className={`mb-14 grid grid-cols-2 gap-4 lg:grid-cols-4 ${
            isVisible
              ? 'animate-in slide-in-from-bottom duration-1000 delay-300'
              : 'opacity-0'
          }`}
        >
          {stats.map((stat, index) => {
            const StatIcon = statStyles[index]?.icon || UsersIcon;
            const statColor =
              statStyles[index]?.color || 'from-blue-500 to-indigo-600';

            return (
            <div
              key={stat.label}
              className='rounded-2xl bg-white/55 p-5 text-center backdrop-blur-sm'
            >
              <div
                className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r ${statColor} text-white`}
              >
                <StatIcon className='h-6 w-6' />
              </div>
              <div className='mb-1 text-2xl font-bold text-[#1E1B4B]'>
                {stat.value}
              </div>
              <div className='text-sm text-slate-600'>{stat.label}</div>
            </div>
          );
          })}
        </div>

        <div
          className={`mb-16 ${
            isVisible
              ? 'animate-in slide-in-from-left duration-1000 delay-500'
              : 'opacity-0'
          }`}
        >
          <div className='relative overflow-hidden rounded-3xl bg-white/55 p-8 backdrop-blur-sm md:p-12'>
            <div className='absolute inset-0 bg-gradient-to-br from-blue-50/60 via-transparent to-indigo-50/50' />

            <div className='relative z-10 grid gap-8 lg:grid-cols-[1fr_280px] lg:items-center'>
              <div className='space-y-6'>
                <div className='flex items-center gap-1'>
                  {[...Array(currentTestimonialData.rating)].map((_, i) => (
                    <StarIconSolid key={i} className='h-6 w-6 text-yellow-400' />
                  ))}
                  <span className='ml-3 text-sm font-medium text-slate-600'>
                    {currentTestimonialData.rating}/5 - Verified Review
                  </span>
                </div>

                <blockquote className='font-syne text-2xl font-semibold leading-relaxed text-[#1E1B4B] md:text-3xl'>
                  &quot;{detailText}&quot;
                </blockquote>

                <div className='flex items-center gap-4'>
                  <div
                    className='flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-cover bg-center text-xl font-bold text-white'
                    style={
                      currentTestimonialData.image
                        ? {
                            backgroundImage: `url(${currentTestimonialData.image})`,
                          }
                        : undefined
                    }
                  >
                    {!currentTestimonialData.image &&
                      getInitials(currentTestimonialData.name)}
                  </div>
                  <div>
                    <div className='text-lg font-bold text-slate-900'>
                      {currentTestimonialData.name}
                    </div>
                    <div className='text-slate-600'>
                      {readerMeta || 'Reader'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

              <div className='relative z-10 mt-8 flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <button
                    onClick={prevTestimonial}
                    className='flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-slate-600 transition hover:text-blue-600'
                    aria-label='Previous testimonial'
                  >
                    <ChevronLeftIcon className='h-5 w-5' />
                  </button>
                  <button
                    onClick={nextTestimonial}
                    className='flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-slate-600 transition hover:text-blue-600'
                    aria-label='Next testimonial'
                  >
                    <ChevronRightIcon className='h-5 w-5' />
                  </button>
                </div>

                <div className='flex gap-2'>
                  {testimonials.map((testimonial, index) => (
                    <button
                      key={testimonial._id}
                      onClick={() => {
                        setCurrentTestimonial(index);
                      }}
                      className={`h-3 rounded-full transition-all duration-300 ${
                        index === currentTestimonial
                          ? 'w-8 bg-blue-600'
                          : 'w-3 bg-blue-200'
                      }`}
                      aria-label={`Show testimonial ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
          </div>
        </div>
      </div>
    </section>
  );
}
