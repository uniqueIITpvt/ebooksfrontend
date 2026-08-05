'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { FaqItem } from '@/types/faq';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  HeartIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import {
  QuestionMarkCircleIcon as QuestionMarkCircleIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
} from '@heroicons/react/24/solid';

const faqIcons = [
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  PhoneIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  HeartIcon,
];

const faqColors = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-purple-500 to-violet-600',
  'from-orange-500 to-amber-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-blue-600',
  'from-indigo-500 to-purple-600',
  'from-red-500 to-pink-600',
];

const quickStats = [
  {
    icon: ClockIcon,
    label: 'New Releases',
    value: 'Weekly',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    icon: PhoneIcon,
    label: 'Support',
    value: '24 Hours',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: HeartIcon,
    label: 'Formats',
    value: '2 Types',
    color: 'from-purple-500 to-violet-600',
  },
  {
    icon: CheckCircleIcon,
    label: 'Years Experience',
    value: '2+',
    color: 'from-rose-500 to-pink-600',
  },
];

interface FAQProps {
  faqs: FaqItem[];
  categories: string[];
}

export default function FAQ({ faqs, categories }: FAQProps) {
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isVisible, setIsVisible] = useState(false);
  const [showDetailed, setShowDetailed] = useState<string[]>([]);
  const categoryScrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const categoryOptions = useMemo(() => {
    const normalized = categories.filter(Boolean);
    return normalized.length > 0 ? normalized : ['All'];
  }, [categories]);

  const enrichedFaqs = useMemo(() => {
    return faqs.map((faq, index) => ({
      ...faq,
      icon: faqIcons[index % faqIcons.length],
      color: faqColors[index % faqColors.length],
    }));
  }, [faqs]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleDetailed = (id: string) => {
    setShowDetailed((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const scrollCategories = (direction: 'left' | 'right') => {
    categoryScrollerRef.current?.scrollBy({
      left: direction === 'left' ? -160 : 160,
      behavior: 'smooth',
    });
  };

  const filteredFAQs = enrichedFaqs.filter((faq) => {
    const normalizedSearch = searchTerm.toLowerCase();
    const matchesSearch =
      faq.question.toLowerCase().includes(normalizedSearch) ||
      faq.answer.toLowerCase().includes(normalizedSearch) ||
      (faq.detailedAnswer || '').toLowerCase().includes(normalizedSearch);
    const matchesCategory =
      selectedCategory === 'All' || faq.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const popularFAQs = enrichedFaqs.filter((faq) => faq.popular);

  return (
    <section className='relative overflow-hidden bg-gradient-to-r from-blue-50 via-indigo-50 to-white py-10 font-dm-sans'>
      <div className='absolute inset-0 opacity-30 pointer-events-none'>
        <div className='absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50/70 via-white/20 to-purple-100/60' />
      </div>

      <div className='max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 relative'>
        <div
          className={`text-center mb-16 ${
            isVisible
              ? 'animate-in slide-in-from-top duration-1000'
              : 'opacity-0'
          }`}
        >
          <div className='inline-flex items-center bg-white/70 text-blue-700 px-6 py-3 rounded-full text-sm font-semibold mb-6'>
            <QuestionMarkCircleIconSolid className='w-5 h-5 mr-2' />
            Frequently Asked Questions
          </div>
          <h2 className='font-syne text-4xl md:text-5xl lg:text-6xl font-bold text-[#1E1B4B] mb-6 leading-tight'>
            Get Your{' '}
            <span className='bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent'>
              Questions Answered
            </span>
          </h2>
          <p className='text-xl md:text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed'>
            Find answers about our books, audiobooks, and learning resources from{' '}
            <span className='text-blue-600 font-semibold'>
              TechUniqueIIT Research Center
            </span>
          </p>
        </div>

        <div
          className={`mb-12 ${
            isVisible
              ? 'animate-in slide-in-from-left duration-1000 delay-500'
              : 'opacity-0'
          }`}
        >
          <div className='bg-white/45 backdrop-blur-sm rounded-3xl p-6'>
            <div className='flex flex-col lg:flex-row gap-3 items-center'>
              <div className='relative w-full lg:w-[330px] lg:shrink-0'>
                <MagnifyingGlassIcon className='absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400' />
                <input
                  type='text'
                  placeholder='Search questions...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='w-full min-w-0 rounded-2xl border border-blue-100 bg-white/80 py-2.5 pl-12 pr-4 text-slate-900 caret-slate-900 placeholder:text-slate-400 transition-all duration-300 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20'
                />
              </div>

              <div className='relative w-full min-w-0 flex-1 lg:w-auto'>
                <button
                  type='button'
                  onClick={() => scrollCategories('left')}
                  className='absolute inset-y-0 left-0 z-10 flex w-8 items-center justify-start bg-gradient-to-r from-white/90 via-white/70 to-transparent text-sm font-semibold text-slate-500 lg:hidden'
                  aria-label='Scroll categories left'
                >
                  &lt;
                </button>
                <button
                  type='button'
                  onClick={() => scrollCategories('right')}
                  className='absolute inset-y-0 right-0 z-10 flex w-8 items-center justify-end bg-gradient-to-l from-white/90 via-white/70 to-transparent text-sm font-semibold text-slate-500 lg:hidden'
                  aria-label='Scroll categories right'
                >
                  &gt;
                </button>
                <div
                  ref={categoryScrollerRef}
                  className='flex w-full min-w-0 flex-nowrap items-center gap-2 overflow-x-auto overflow-y-hidden px-9 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:justify-end lg:gap-1.5 lg:overflow-hidden lg:px-0 lg:pb-0'
                >
                {categoryOptions.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`shrink-0 whitespace-nowrap rounded-xl px-3 py-2 text-[13px] font-medium leading-none transition-all duration-300 lg:shrink ${
                      selectedCategory === category
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                        : 'bg-white/70 text-slate-600 hover:bg-white'
                    }`}
                  >
                    {category}
                  </button>
                ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {selectedCategory === 'All' && searchTerm === '' && popularFAQs.length > 0 && (
          <div
            className={`mb-16 ${
              isVisible
                ? 'animate-in slide-in-from-right duration-1000 delay-700'
                : 'opacity-0'
            }`}
          >
            <div className='text-center mb-8'>
              <h3 className='font-syne text-2xl md:text-3xl font-bold text-[#1E1B4B] mb-4'>
                Most Popular Questions
              </h3>
              <p className='text-lg text-slate-600'>
                Quick answers to our most frequently asked questions
              </p>
            </div>

            <div className='grid md:grid-cols-2 gap-6'>
              {popularFAQs.map((faq) => (
                <div
                  key={faq._id}
                  className='group bg-white/45 backdrop-blur-sm rounded-2xl p-6 transition-all duration-500 hover:scale-[1.01]'
                >
                  <div className='flex items-start space-x-4'>
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-r ${faq.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300`}
                    >
                      <faq.icon className='w-6 h-6' />
                    </div>
                    <div className='flex-1'>
                      <h4 className='font-bold text-lg text-slate-800 mb-2 group-hover:text-blue-700 transition-colors'>
                        {faq.question}
                      </h4>
                      <p className='text-slate-600 text-sm leading-relaxed'>
                        {faq.answer}
                      </p>
                      <div className='mt-4'>
                        <span className='inline-flex items-center text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full'>
                          {faq.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          className={`mb-16 ${
            isVisible
              ? 'animate-in slide-in-from-bottom duration-1000 delay-900'
              : 'opacity-0'
          }`}
        >
          <div className='text-center mb-8'>
            <h3 className='font-syne text-2xl md:text-3xl font-bold text-[#1E1B4B] mb-4'>
              {searchTerm
                ? `Search Results (${filteredFAQs.length})`
                : 'All Questions'}
            </h3>
            {!searchTerm && (
              <p className='text-lg text-slate-600'>
                Comprehensive answers to help you understand our services
              </p>
            )}
          </div>

          <div className='space-y-4'>
            {filteredFAQs.map((faq) => (
              <div
                key={faq._id}
                className='group bg-white/45 backdrop-blur-sm rounded-3xl transition-all duration-500 overflow-hidden'
              >
                <button
                  onClick={() => toggleItem(faq._id)}
                  className='w-full p-6 text-left hover:bg-white/35 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20'
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-4 flex-1'>
                      <div
                        className={`flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-r ${faq.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300`}
                      >
                        <faq.icon className='w-6 h-6' />
                      </div>
                      <div className='flex-1'>
                        <h3 className='text-lg font-semibold text-slate-800 mb-2 group-hover:text-blue-700 transition-colors'>
                          {faq.question}
                        </h3>
                        <div className='flex items-center space-x-3'>
                          <span className='text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full'>
                            {faq.category}
                          </span>
                          {faq.popular && (
                            <span className='text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full'>
                              Popular
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className='flex-shrink-0 ml-4'>
                      {openItems.includes(faq._id) ? (
                        <ChevronUpIcon className='w-6 h-6 text-blue-500 transform transition-transform duration-300' />
                      ) : (
                        <ChevronDownIcon className='w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors duration-300' />
                      )}
                    </div>
                  </div>
                </button>

                <div
                  className={`overflow-hidden transition-all duration-500 ${
                    openItems.includes(faq._id)
                      ? 'max-h-96 opacity-100'
                      : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className='px-6 pb-6'>
                    <div className='pt-4'>
                      <div className='text-slate-700 leading-relaxed mb-4'>
                        {showDetailed.includes(faq._id) && faq.detailedAnswer
                          ? faq.detailedAnswer
                          : faq.answer}
                      </div>

                      {faq.detailedAnswer && (
                        <button
                          onClick={() => toggleDetailed(faq._id)}
                          className='inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-300'
                        >
                          {showDetailed.includes(faq._id)
                            ? 'Show Less'
                            : 'Show More Details'}
                          <ChevronDownIcon
                            className={`w-4 h-4 ml-1 transition-transform duration-300 ${
                              showDetailed.includes(faq._id) ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredFAQs.length === 0 && (
            <div className='text-center py-12'>
              <QuestionMarkCircleIcon className='w-16 h-16 text-slate-300 mx-auto mb-4' />
              <h3 className='text-xl font-semibold text-slate-600 mb-2'>
                No questions found
              </h3>
              <p className='text-slate-500'>
                Try adjusting your search or category filter
              </p>
            </div>
          )}
        </div>

        <div
          className={`text-center ${
            isVisible
              ? 'animate-in slide-in-from-bottom duration-1000 delay-1100'
              : 'opacity-0'
          }`}
        >
          <div className='relative overflow-hidden rounded-3xl bg-white/45 p-8 text-[#1E1B4B] backdrop-blur-sm md:p-12'>
            <div className='absolute -right-20 -top-24 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl' />
            <div className='absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl' />

            <div className='relative z-10'>
              <h3 className='mb-4 font-syne text-3xl font-bold md:text-4xl'>
                Still Have Questions?
              </h3>
              <p className='mx-auto mb-8 max-w-2xl text-lg leading-8 text-slate-600 md:text-xl'>
                Need help choosing the right book or audiobook? Contact
                TechUniqueIIT Research Center and we&apos;ll guide you.
              </p>

              <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                <a
                  href='/contact'
                  className='group inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-lg font-semibold text-white transition-all duration-300 hover:from-blue-700 hover:to-indigo-700'
                >
                  <ChatBubbleLeftRightIcon className='w-5 h-5 mr-2' />
                  Contact Us
                  <ChevronDownIcon className='w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform rotate-[-90deg]' />
                </a>
                <a
                  href='/about'
                  className='inline-flex items-center justify-center rounded-2xl bg-white/70 px-8 py-4 text-lg font-semibold text-slate-700 transition-all duration-300 hover:bg-white'
                >
                  Learn About TechUniqueIIT Research Center
                </a>
              </div>

              <div className='mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600'>
                <div className='flex items-center'>
                  <ClockIcon className='w-5 h-5 mr-2' />
                  Weekly Releases
                </div>
                <div className='flex items-center'>
                  <ShieldCheckIcon className='w-5 h-5 mr-2' />
                  Curated Content
                </div>
                <div className='flex items-center'>
                  <CheckCircleIconSolid className='w-5 h-5 mr-2' />
                  Books
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
