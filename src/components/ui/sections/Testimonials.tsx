'use client';

import { useState, useEffect } from 'react';
import {
  StarIcon,
  PlayCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  CheckBadgeIcon,
  HeartIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import {
  StarIcon as StarIconSolid,
  PlayCircleIcon as PlayCircleIconSolid,
  HeartIcon as HeartIconSolid,
} from '@heroicons/react/24/solid';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Marketing Executive',
    company: 'Tech Innovations Inc.',
    image: '👩‍💼',
    content:
      'uniqueIIT Research Center made it easy to find audiobooks that match my goals. The curated picks helped me learn faster and stay consistent.',
    detailedContent:
      'I started with audiobooks during my commute and later added books for deeper study. The recommendations and summaries helped me focus on what mattered most. After a few months, I built a solid learning routine and finished more titles than ever before.',
    rating: 5,
    condition: 'Learning Routine',
    duration: '3 months',
    format: 'Books',
    improvement: '95%',
    beforeScore: 2,
    afterScore: 9,
    featured: true,
    videoTestimonial: true,
  },
  {
    id: 2,
    name: 'Michael Chen',
    role: 'Software Engineer',
    company: 'StartupFlow',
    image: '👨‍💻',
    content:
      'The audiobook filter is perfect. I quickly found what to listen to and the topics were exactly what I needed for professional growth.',
    detailedContent:
      'I used the categories and search to build a personal playlist of audiobooks. The experience felt organized and intentional, and it helped me keep learning week after week.',
    rating: 5,
    condition: 'Skill Building',
    duration: '2 months',
    format: 'Audiobook Learning',
    improvement: '90%',
    beforeScore: 3,
    afterScore: 8,
    featured: false,
    videoTestimonial: false,
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    role: 'High School Teacher',
    company: 'Lincoln High School',
    image: '👩‍🏫',
    content:
      'Clear summaries and well-picked titles. I finally found resources that explain complex topics in a simple way.',
    detailedContent:
      'I used the summaries to decide what to read next and the recommendations were consistently high quality. It saved me time and made my learning more focused.',
    rating: 5,
    condition: 'Focused Study',
    duration: '6 weeks',
    format: 'Summaries & Notes',
    improvement: '88%',
    beforeScore: 2,
    afterScore: 8,
    featured: true,
    videoTestimonial: true,
  },
  {
    id: 4,
    name: 'David Thompson',
    role: 'Business Owner',
    company: 'Thompson Consulting',
    image: '👨‍💼',
    content:
      'The resources are practical and easy to apply. I found books that improved my communication and leadership skills.',
    detailedContent:
      'I picked a few titles from the collections and applied the ideas immediately at work. The mix of books and audiobooks made it easy to keep momentum.',
    rating: 5,
    condition: 'Professional Growth',
    duration: '1 month',
    format: 'Curated Reading',
    improvement: '92%',
    beforeScore: 4,
    afterScore: 9,
    featured: false,
    videoTestimonial: false,
  },
  {
    id: 5,
    name: 'Lisa Park',
    role: 'Librarian',
    company: 'City Library',
    image: '👩‍⚕️',
    content:
      'Great catalog and smooth discovery experience. The audiobook picks helped me stay productive and motivated.',
    detailedContent:
      'I used audiobooks to keep learning during busy weeks. When I had time, I switched to books for deeper reading. The variety helped me stay consistent.',
    rating: 5,
    condition: 'Consistency',
    duration: '2 months',
    format: 'Audiobooks + Books',
    improvement: '94%',
    beforeScore: 3,
    afterScore: 9,
    featured: true,
    videoTestimonial: false,
  },
  {
    id: 6,
    name: 'James Wilson',
    role: 'College Student',
    company: 'State University',
    image: '👨‍🎓',
    content:
      'As a student, I love the quick summaries and the ability to filter audiobooks. It saves time when preparing for exams.',
    detailedContent:
      'I used the site to find beginner-friendly books and audiobooks. The summaries helped me decide quickly, and my study routine became much more effective.',
    rating: 5,
    condition: 'Study Support',
    duration: '1 month',
    format: 'Summaries + Audiobooks',
    improvement: '87%',
    beforeScore: 3,
    afterScore: 8,
    featured: false,
    videoTestimonial: true,
  },
];

const stats = [
  {
    icon: UsersIcon,
    label: 'Readers Reached',
    value: '5000+',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    icon: StarIcon,
    label: 'Average Rating',
    value: '4.9/5',
    color: 'from-yellow-500 to-orange-600',
  },
  {
    icon: HeartIcon,
    label: 'Completion Rate',
    value: '92%',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: CheckBadgeIcon,
    label: 'Years Experience',
    value: '10+',
    color: 'from-purple-500 to-violet-600',
  },
];

export default function Testimonials() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [selectedTestimonial, setSelectedTestimonial] = useState<number | null>(
    null
  );
  const [isVisible, setIsVisible] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (!isAutoPlay) return;

    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlay]);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    setIsAutoPlay(false);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
    setIsAutoPlay(false);
  };

  const currentTestimonialData = testimonials[currentTestimonial];

  return (
    <section className='py-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 relative overflow-hidden'>
      {/* Background Pattern */}
      <div className='absolute inset-0 opacity-20'>
        <div className='absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-indigo-600/5' />
        <div
          className='w-full h-full bg-repeat opacity-30'
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e0e7ff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Floating Elements */}
      <div className='absolute inset-0 pointer-events-none'>
        <div className='absolute top-20 left-10 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl animate-pulse' />
        <div className='absolute bottom-20 right-10 w-48 h-48 bg-indigo-400/10 rounded-full blur-3xl animate-pulse delay-1000' />
        <div className='absolute top-40 right-20 w-24 h-24 bg-purple-400/10 rounded-full blur-2xl animate-pulse delay-2000' />
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative'>
        {/* Header */}
        <div
          className={`text-center mb-16 ${
            isVisible
              ? 'animate-in slide-in-from-top duration-1000'
              : 'opacity-0'
          }`}
        >
          <div className='inline-flex items-center bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-6 py-3 rounded-full text-sm font-semibold mb-6 shadow-lg'>
            <HeartIconSolid className='w-5 h-5 mr-2 text-pink-500' />
            Reader Success Stories
          </div>
          <h2 className='text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight'>
            Lives{' '}
            <span className='bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent'>
              Transformed
            </span>
          </h2>
          <p className='text-xl md:text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed'>
            Real stories from real people who built better learning habits
            through{' '}
            <span className='text-blue-600 font-semibold'>
              curated resources
            </span>{' '}
            and{' '}
            <span className='text-indigo-600 font-semibold'>
              research-driven insights
            </span>
          </p>
        </div>

        {/* Stats Section */}
        <div
          className={`grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16 ${
            isVisible
              ? 'animate-in slide-in-from-bottom duration-1000 delay-300'
              : 'opacity-0'
          }`}
        >
          {stats.map((stat, index) => (
            <div
              key={index}
              className='bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 border border-slate-200/50 hover:border-slate-300/50 text-center group hover:scale-105'
            >
              <div
                className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-r ${stat.color} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}
              >
                <stat.icon className='w-7 h-7' />
              </div>
              <div className='text-3xl font-bold text-slate-800 mb-2'>
                {stat.value}
              </div>
              <div className='text-sm text-slate-600'>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Featured Testimonial Carousel */}
        <div
          className={`mb-20 ${
            isVisible
              ? 'animate-in slide-in-from-left duration-1000 delay-500'
              : 'opacity-0'
          }`}
        >
          <div className='bg-white/90 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-2xl border border-slate-200/50 relative overflow-hidden'>
            {/* Background Gradient */}
            <div className='absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-indigo-50/30' />

            <div className='relative z-10'>
              <div className='grid lg:grid-cols-3 gap-8 items-center'>
                {/* Testimonial Content */}
                <div className='lg:col-span-2 space-y-6'>
                  {/* Rating */}
                  <div className='flex items-center space-x-1'>
                    {[...Array(currentTestimonialData.rating)].map((_, i) => (
                      <StarIconSolid
                        key={i}
                        className='w-6 h-6 text-yellow-400'
                      />
                    ))}
                    <span className='ml-3 text-sm text-slate-600 font-medium'>
                      {currentTestimonialData.rating}/5 · Verified Reader
                    </span>
                  </div>

                  {/* Quote */}
                  <blockquote className='text-xl md:text-2xl text-slate-700 leading-relaxed font-medium'>
                    &quot;{currentTestimonialData.detailedContent}&quot;
                  </blockquote>

                  {/* Reader Info */}
                  <div className='flex items-center space-x-4'>
                    <div className='w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg'>
                      {currentTestimonialData.image}
                    </div>
                    <div>
                      <div className='font-bold text-lg text-slate-800'>
                        {currentTestimonialData.name}
                      </div>
                      <div className='text-slate-600'>
                        {currentTestimonialData.role} at{' '}
                        {currentTestimonialData.company}
                      </div>
                    </div>
                    {currentTestimonialData.videoTestimonial && (
                      <button className='ml-auto group flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300'>
                        <PlayCircleIconSolid className='w-5 h-5 group-hover:scale-110 transition-transform' />
                        <span className='text-sm font-medium'>Watch Video</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Stats */}
                <div className='space-y-4'>
                  <div className='bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 border border-slate-200/50'>
                    <h4 className='font-semibold text-slate-800 mb-4'>
                      Learning Details
                    </h4>
                    <div className='space-y-3'>
                      <div className='flex justify-between items-center'>
                        <span className='text-sm text-slate-600'>
                          Format:
                        </span>
                        <span className='font-medium text-slate-800'>
                          {currentTestimonialData.format}
                        </span>
                      </div>
                      <div className='flex justify-between items-center'>
                        <span className='text-sm text-slate-600'>
                          Duration:
                        </span>
                        <span className='font-medium text-slate-800'>
                          {currentTestimonialData.duration}
                        </span>
                      </div>
                      <div className='flex justify-between items-center'>
                        <span className='text-sm text-slate-600'>
                          Improvement:
                        </span>
                        <span className='font-bold text-emerald-600'>
                          {currentTestimonialData.improvement}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className='mt-6'>
                      <div className='flex justify-between text-xs text-slate-600 mb-2'>
                        <span>Before</span>
                        <span>After</span>
                      </div>
                      <div className='flex items-center space-x-2'>
                        <div className='text-xs text-slate-500'>
                          {currentTestimonialData.beforeScore}/10
                        </div>
                        <div className='flex-1 bg-slate-200 rounded-full h-2'>
                          <div
                            className='bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full transition-all duration-1000'
                            style={{
                              width: `${
                                (currentTestimonialData.afterScore / 10) * 100
                              }%`,
                            }}
                          />
                        </div>
                        <div className='text-xs font-medium text-emerald-600'>
                          {currentTestimonialData.afterScore}/10
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className='flex items-center justify-between mt-8'>
                <div className='flex items-center space-x-4'>
                  <button
                    onClick={prevTestimonial}
                    className='w-12 h-12 bg-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center text-slate-600 hover:text-blue-600 transition-all duration-300 hover:scale-105'
                  >
                    <ChevronLeftIcon className='w-5 h-5' />
                  </button>
                  <button
                    onClick={nextTestimonial}
                    className='w-12 h-12 bg-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center text-slate-600 hover:text-blue-600 transition-all duration-300 hover:scale-105'
                  >
                    <ChevronRightIcon className='w-5 h-5' />
                  </button>
                  <button
                    onClick={() => setIsAutoPlay(!isAutoPlay)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                      isAutoPlay
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {isAutoPlay ? 'Pause' : 'Play'} Auto
                  </button>
                </div>

                {/* Dots Indicator */}
                <div className='flex space-x-2'>
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentTestimonial(index);
                        setIsAutoPlay(false);
                      }}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentTestimonial
                          ? 'bg-blue-500 scale-125'
                          : 'bg-slate-300 hover:bg-slate-400'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* All Testimonials Grid */}
        <div
          className={`mb-16 ${
            isVisible
              ? 'animate-in slide-in-from-bottom duration-1000 delay-700'
              : 'opacity-0'
          }`}
        >
          <div className='text-center mb-12'>
            <h3 className='text-3xl md:text-4xl font-bold text-slate-900 mb-4'>
              What Our Readers Say
            </h3>
            <p className='text-lg text-slate-600 max-w-2xl mx-auto'>
              Discover more stories from readers who improved their learning through
              books and audiobooks
            </p>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className={`group bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-700 border border-slate-200/50 hover:border-blue-200/50 transform hover:scale-[1.02] cursor-pointer ${
                  index % 2 === 0 ? 'hover:rotate-1' : 'hover:-rotate-1'
                }`}
                onClick={() =>
                  setSelectedTestimonial(
                    selectedTestimonial === testimonial.id
                      ? null
                      : testimonial.id
                  )
                }
              >
                {/* Featured Badge */}
                {testimonial.featured && (
                  <div className='absolute -top-3 left-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1 rounded-full text-xs font-bold'>
                    Featured
                  </div>
                )}

                <div className='flex items-start space-x-4 mb-4'>
                  <div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center text-lg shadow-lg group-hover:shadow-xl transition-shadow duration-300'>
                    {testimonial.image}
                  </div>
                  <div className='flex-1'>
                    <h4 className='font-bold text-lg text-slate-800 mb-1'>
                      {testimonial.name}
                    </h4>
                    <p className='text-slate-600 text-sm mb-2'>
                      {testimonial.role}
                    </p>
                    <div className='flex items-center space-x-1'>
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <StarIconSolid
                          key={i}
                          className='w-4 h-4 text-yellow-400'
                        />
                      ))}
                    </div>
                  </div>
                  {testimonial.videoTestimonial && (
                    <PlayCircleIcon className='w-6 h-6 text-blue-500 group-hover:text-blue-600 transition-colors' />
                  )}
                </div>

                <blockquote className='text-slate-700 leading-relaxed mb-4 italic'>
                  &quot;
                  {selectedTestimonial === testimonial.id
                    ? testimonial.detailedContent
                    : testimonial.content}
                  &quot;
                </blockquote>

                <div className='flex items-center justify-between pt-4 border-t border-slate-200/50'>
                  <div className='flex items-center space-x-2'>
                    <div className='bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-1 rounded-full'>
                      <span className='text-xs font-semibold text-emerald-700'>
                        {testimonial.condition}
                      </span>
                    </div>
                  </div>
                  <div className='text-xs text-slate-500 flex items-center space-x-1'>
                    <ClockIcon className='w-3 h-3' />
                    <span>{testimonial.duration}</span>
                  </div>
                </div>

                {/* Expanded Content */}
                {selectedTestimonial === testimonial.id && (
                  <div className='mt-4 pt-4 border-t border-slate-200/50 animate-in slide-in-from-top duration-300'>
                    <div className='grid grid-cols-2 gap-4 text-sm'>
                      <div>
                        <span className='text-slate-500'>Format:</span>
                        <div className='font-medium text-slate-700'>
                          {testimonial.format}
                        </div>
                      </div>
                      <div>
                        <span className='text-slate-500'>Improvement:</span>
                        <div className='font-bold text-emerald-600'>
                          {testimonial.improvement}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
      </div>
    </section>
  );
}
