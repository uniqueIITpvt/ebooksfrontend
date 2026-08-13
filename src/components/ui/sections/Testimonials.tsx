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

  return (
    <section className='relative overflow-hidden bg-gradient-to-r from-blue-50 via-indigo-50 to-white py-3 font-dm-sans'>
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
            Verified feedback from readers using Unique Books Plus Research Center
            books, audiobooks, and learning resources.
          </p>
        </div>

        {/* <div
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
        </div> */}

        <div
          className={`mb-12 ${
            isVisible
              ? 'animate-in slide-in-from-left duration-1000 delay-500'
              : 'opacity-0'
          }`}
        >
          <div className='relative overflow-hidden rounded-3xl bg-white/55 px-5 py-10 backdrop-blur-sm md:px-12'>
            <div className='absolute inset-0 bg-gradient-to-br from-blue-50/60 via-transparent to-indigo-50/50' />

            <div className='relative z-10 overflow-hidden'>
              <div
                className='flex transition-transform duration-700 ease-out'
                style={{
                  transform: `translateX(-${currentTestimonial * 100}%)`,
                }}
              >
                {testimonials.map((testimonial) => {
                  const detailText =
                    testimonial.detailedContent || testimonial.content;
                  const readerMeta = [testimonial.role, testimonial.company]
                    .filter(Boolean)
                    .join(' at ');

                  return (
                    <div
                      key={testimonial._id}
                      className='flex w-full shrink-0 justify-center px-2'
                    >
                      <article className='flex min-h-[320px] w-full max-w-[300px] flex-col items-center rounded-[8px] bg-white/85 px-6 py-7 text-center shadow-sm sm:max-w-[340px]'>
                        <div
                          className='mb-5 flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 bg-cover bg-center text-xl font-bold text-white'
                          style={
                            testimonial.image
                              ? {
                                  backgroundImage: `url(${testimonial.image})`,
                                }
                              : undefined
                          }
                        >
                          {!testimonial.image && getInitials(testimonial.name)}
                        </div>

                        <h3 className='mb-2 font-syne text-base font-bold text-[#1E1B4B]'>
                          {testimonial.name}
                        </h3>

                        <div className='mb-3 flex items-center justify-center gap-0.5'>
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <StarIconSolid
                              key={i}
                              className='h-4 w-4 text-yellow-400'
                            />
                          ))}
                        </div>

                        <blockquote className='mb-5 line-clamp-6 text-[13px] leading-6 text-slate-600'>
                          {detailText}
                        </blockquote>

                        <div className='mt-auto'>
                          <div className='font-syne text-sm font-bold text-slate-900'>
                            {testimonial.role || 'Verified Reader'}
                          </div>
                          <div className='mt-1 text-[11px] font-medium text-slate-500'>
                            {readerMeta || testimonial.format || 'Reader'}
                          </div>
                        </div>
                      </article>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={prevTestimonial}
              className='absolute left-5 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-600 transition hover:text-blue-600 md:left-8'
              aria-label='Previous testimonial'
            >
              <ChevronLeftIcon className='h-5 w-5' />
            </button>

            <button
              onClick={nextTestimonial}
              className='absolute right-5 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-600 transition hover:text-blue-600 md:right-8'
              aria-label='Next testimonial'
            >
              <ChevronRightIcon className='h-5 w-5' />
            </button>

            <div className='relative z-10 mt-8 flex items-center justify-center'>
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
