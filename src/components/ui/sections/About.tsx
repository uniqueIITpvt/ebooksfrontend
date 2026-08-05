'use client';

import { useState } from 'react';
import type { ComponentType, SVGProps } from 'react';
import Link from 'next/link';
import {
  CheckCircleIcon,
  AcademicCapIcon,
  BookOpenIcon,
  UserGroupIcon,
  ClockIcon,
  HeartIcon,
  TrophyIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,

  BeakerIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';


interface Qualification {
  degree: string;
  institution: string;
  year: string;
  description: string;
}

interface Specialization {
  name: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  color: string;
  experience: string;
}

const About = () => {
  const [activeTab, setActiveTab] = useState('overview');


  const qualifications: Qualification[] = [
    {
      degree: 'Content Curation & Review',
      institution: 'uniqueIIT Research Center',
      year: '2024-2026',
      description:
        'Structured process to select, review, and present high-quality learning resources',
    },
    {
      degree: 'Research-Driven Publishing',
      institution: 'uniqueIIT Research Center',
      year: '2024-2026',
      description: 'Creating clear summaries and resource collections grounded in research',
    },
    {
      degree: 'Learning Resource Development',
      institution: 'uniqueIIT Research Center',
      year: '2024-2026',
      description: 'Developing practical learning materials for students and professionals',
    },
  ];

  const specializations: Specialization[] = [
    {
      name: 'Audiobooks',
      description: 'Listen and learn with curated audio resources',
      icon: ClockIcon,
      color: 'text-blue-600',
      experience: 'Updated weekly',
    },
    {
      name: 'Books',
      description: 'Curated reading resources for structured learning',
      icon: UserGroupIcon,
      color: 'text-indigo-600',
      experience: 'Growing catalog',
    },
    {
      name: 'Summaries & Notes',
      description: 'Concise takeaways to reinforce key concepts',
      icon: HeartIcon,
      color: 'text-green-600',
      experience: 'Research-led',
    },
    {
      name: 'Blog & Articles',
      description: 'Insights and reading guides to support continuous learning',
      icon: ShieldCheckIcon,
      color: 'text-purple-600',
      experience: 'Regular posts',
    },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: UserGroupIcon },
    { id: 'qualifications', label: 'Qualifications', icon: AcademicCapIcon },
    { id: 'specializations', label: 'Specializations', icon: BeakerIcon },
  ];

  return (
    <section className='relative overflow-hidden bg-gradient-to-r from-blue-50 via-indigo-50 to-white py-4 font-dm-sans sm:py-8 lg:py-12'>
      {/* Background */}
      <div className='absolute inset-0 opacity-30'>
        <div className='absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50/70 via-white/20 to-purple-100/60'></div>
      </div>

      <div className='max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 relative'>
        {/* Header */}
        <div className='text-center mb-12'>
          <div className='inline-flex items-center bg-white/70 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-5'>
            <CheckCircleIcon className='w-4 h-4 mr-2' />
            About TechUniqueIIT Research Center
          </div>
          <h2 className='font-syne text-4xl font-bold leading-tight text-[#1E1B4B] mb-5 md:text-5xl'>
            Learn, Listen, Read, and{' '}
            <span className='bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>
              Grow Every Day
            </span>
          </h2>
          <p className='mx-auto max-w-3xl text-lg leading-8 text-slate-600'>
            TechUniqueIIT Research Center is a digital learning platform created to make powerful knowledge easy to access, easy to understand, and easy to experience.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className='flex flex-wrap justify-center gap-2 mb-10'>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              suppressHydrationWarning
              className={`flex items-center px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                  : 'bg-white/70 backdrop-blur-sm text-slate-700 hover:bg-white'
              }`}
            >
              <tab.icon className='w-4 h-4 mr-2' />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Based on Active Tab */}
        {activeTab === 'overview' && (
          <div className='mx-auto max-w-5xl'>
            {/* Left Content */}
            <div className='relative overflow-hidden rounded-[22px] bg-white/45 p-6 backdrop-blur-sm sm:p-8 lg:p-10'>
              <div className='absolute -right-20 -top-24 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl' />
              <div className='absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl' />

              <div className='relative mx-auto mb-8 flex max-w-3xl flex-col items-center text-center'>
                <div className='mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white'>
                  <BookOpenIcon className='h-7 w-7' />
                </div>
                <p className='text-sm font-bold uppercase tracking-[0.22em] text-blue-700'>
                  Digital Learning Platform
                </p>
                <h3 className='mt-3 font-syne text-2xl font-bold text-[#1E1B4B] sm:text-3xl'>
                  Knowledge Designed for Reading, Listening, and Growth
                </h3>
              </div>

              <div className='relative mx-auto max-w-4xl space-y-6 text-center text-base leading-8 text-slate-600 sm:text-lg sm:leading-9'>
                <p>
                  Our platform offers a{' '}
                  <span className='rounded-lg bg-gradient-to-r from-blue-100 to-indigo-100 px-2 py-1 font-semibold text-slate-900'>
                    curated collection of life-changing, motivational, self-growth, and learning-based books and audiobooks
                  </span>
                  . Users can listen to audiobooks through an{' '}
                  <span className='font-semibold text-blue-700'>
                    interactive audiobook player
                  </span>{' '}
                  where words are{' '}
                  <span className='font-semibold text-indigo-700'>
                    highlighted step by step
                  </span>
                  , making the listening experience more focused, engaging, and easy to follow.
                </p>
                <p>
                  Along with audiobooks, users can also{' '}
                  <span className='font-semibold text-slate-900'>
                    read books page by page
                  </span>{' '}
                  through the built-in book reader. We also provide{' '}
                  <span className='font-semibold text-emerald-700'>
                    ebooks that readers can purchase and enjoy anytime, anywhere
                  </span>
                  .
                </p>
                <p>
                  At TechUniqueIIT Research Center, our goal is simple: to bring{' '}
                  <span className='rounded-lg bg-blue-50 px-2 py-1 font-semibold text-slate-900'>
                    meaningful books, audiobooks, and research-based learning content into one place
                  </span>{' '}
                  for students, professionals, and lifelong learners. Whether someone wants motivation, self-improvement, personal growth, or practical knowledge, our platform is designed to support their journey.
                </p>
                <p>
                  We believe that learning should not feel difficult. It should be{' '}
                  <span className='font-semibold text-slate-900'>
                    smooth, accessible, and inspiring
                  </span>
                  . That is why we combine reading, listening, and digital technology to create a better learning experience for everyone.
                </p>
                <p className='text-xl font-semibold text-slate-900'>
                  TechUniqueIIT Research Center{' '}
                  <span className='text-blue-700'>- learn, listen, read, and grow every day.</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className='mx-auto max-w-5xl'>
            <div className='relative overflow-hidden rounded-[22px] bg-white/45 p-6 backdrop-blur-sm sm:p-8 lg:p-10'>
              <div className='absolute -right-20 -top-24 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl' />
              <div className='absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl' />

              <div className='relative mx-auto mb-8 max-w-3xl text-center'>
                <p className='text-sm font-bold uppercase tracking-[0.22em] text-blue-700'>
                  Milestones
                </p>
                <h3 className='mt-3 font-syne text-2xl font-bold text-[#1E1B4B] sm:text-3xl'>
                  Building Better Access to Learning
                </h3>
                <p className='mt-3 text-sm leading-6 text-slate-600 sm:text-base'>
                  Key steps in our journey of research-led publishing, curation, and digital learning resources.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Qualifications Tab */}
        {activeTab === 'qualifications' && (
          <div className='mx-auto max-w-5xl'>
            <div className='relative overflow-hidden rounded-[22px] bg-white/45 p-6 backdrop-blur-sm sm:p-8 lg:p-10'>
              <div className='absolute -right-20 -top-24 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl' />
              <div className='absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl' />

              <div className='relative mx-auto mb-8 max-w-3xl text-center'>
                <p className='text-sm font-bold uppercase tracking-[0.22em] text-blue-700'>
                  Qualifications
                </p>
                <h3 className='mt-3 font-syne text-2xl font-bold text-[#1E1B4B] sm:text-3xl'>
                  Structured Review and Publishing Practice
                </h3>
                <p className='mt-3 text-sm leading-6 text-slate-600 sm:text-base'>
                  Our workflow focuses on selecting, reviewing, and presenting useful learning resources clearly.
                </p>
              </div>

              <div className='relative grid gap-4 md:grid-cols-3'>
              {qualifications.map((qual, index) => (
                <div
                  key={index}
                  className='min-h-[230px] rounded-2xl bg-white/45 p-5 backdrop-blur-sm transition-all duration-300'
                >
                  <div className='flex h-full flex-col'>
                    <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100'>
                      <AcademicCapIcon className='w-6 h-6 text-blue-700' />
                    </div>
                    <div className='flex flex-1 flex-col'>
                      <div className='mb-3'>
                        <h3 className='text-lg font-bold leading-snug text-slate-900'>
                          {qual.degree}
                        </h3>
                        <span className='mt-3 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700'>
                          {qual.year}
                        </span>
                      </div>
                      <p className='mb-2 text-sm font-semibold text-indigo-700'>
                        {qual.institution}
                      </p>
                      <p className='text-sm leading-6 text-slate-600'>
                        {qual.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
          </div>
        )}

        {/* Specializations Tab */}
        {activeTab === 'specializations' && (
          <div className='mx-auto max-w-5xl'>
            <div className='relative overflow-hidden rounded-[22px] bg-white/45 p-6 backdrop-blur-sm sm:p-8 lg:p-10'>
              <div className='absolute -right-20 -top-24 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl' />
              <div className='absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl' />

              <div className='relative mx-auto mb-8 max-w-3xl text-center'>
                <p className='text-sm font-bold uppercase tracking-[0.22em] text-blue-700'>
                  Specializations
                </p>
                <h3 className='mt-3 font-syne text-2xl font-bold text-[#1E1B4B] sm:text-3xl'>
                  Focus Areas for Everyday Learning
                </h3>
                <p className='mt-3 text-sm leading-6 text-slate-600 sm:text-base'>
                  Practical formats that help readers learn through books, audio, summaries, and articles.
                </p>
              </div>

              <div className='relative grid gap-4 md:grid-cols-2'>
            {specializations.map((spec, index) => (
              <div
                key={index}
                className='min-h-[150px] rounded-2xl bg-white/45 p-5 backdrop-blur-sm transition-all duration-300'
              >
                <div className='flex items-start gap-4'>
                  <div
                    className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 ${spec.color}`}
                  >
                    <spec.icon className='w-6 h-6' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='mb-3 flex flex-wrap items-center gap-3'>
                      <h3 className='text-lg font-bold text-slate-900'>
                        {spec.name}
                      </h3>
                      <span className='rounded-full bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-700'>
                        {spec.experience}
                      </span>
                    </div>
                    <p className='text-sm leading-6 text-slate-600'>
                      {spec.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
              </div>
            </div>
          </div>
        )}

        {/* Contact Information */}
        <div className='mx-auto mt-16 max-w-5xl'>
          <div className='relative overflow-hidden rounded-[22px] bg-white/45 p-6 backdrop-blur-sm sm:p-8 lg:p-10'>
            <div className='absolute -right-20 -top-24 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl' />
            <div className='absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl' />

            <div className='relative mx-auto mb-8 max-w-3xl text-center'>
              <div className='mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white'>
                <EnvelopeIcon className='h-7 w-7' />
              </div>
              <p className='text-sm font-bold uppercase tracking-[0.22em] text-blue-700'>
                Connect With Us
              </p>
              <h3 className='mt-3 font-syne text-2xl font-bold text-[#1E1B4B] sm:text-3xl'>
                Ready to Explore More?
              </h3>
              <p className='mt-3 text-sm leading-6 text-slate-600 sm:text-base'>
                Get in touch to ask questions, request recommendations, or suggest new books and audiobooks.
              </p>
            </div>

            <div className='relative grid gap-4 md:grid-cols-3'>
              <div className='flex min-h-[112px] items-center justify-center gap-3 rounded-2xl bg-white/45 p-5 text-center backdrop-blur-sm transition-all duration-300'>
                <div className='flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100'>
                  <PhoneIcon className='w-5 h-5 text-blue-700' />
                </div>
                <div className='min-w-0 text-left'>
                  <div className='font-semibold text-slate-900'>Call (Optional)</div>
                  <div className='text-sm text-slate-600'>+19-7838758293</div>
                </div>
              </div>
              <div className='flex min-h-[112px] items-center justify-center gap-3 rounded-2xl bg-white/45 p-5 text-center backdrop-blur-sm transition-all duration-300'>
                <div className='flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-100'>
                  <EnvelopeIcon className='w-5 h-5 text-indigo-700' />
                </div>
                <div className='min-w-0 text-left'>
                  <div className='font-semibold text-slate-900'>Email</div>
                  <div className='truncate text-sm text-slate-600'>
                    unquebookpublishinghouse@gmail.com
                  </div>
                </div>
              </div>
              <div className='flex min-h-[112px] items-center justify-center gap-3 rounded-2xl bg-white/45 p-5 text-center backdrop-blur-sm transition-all duration-300'>
                <div className='flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-purple-100'>
                  <CalendarIcon className='w-5 h-5 text-purple-700' />
                </div>
                <div className='min-w-0 text-left'>
                  <div className='font-semibold text-slate-900'>Explore</div>
                  <div className='text-sm text-slate-600'>Browse the Library</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
