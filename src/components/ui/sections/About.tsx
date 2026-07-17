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

interface Achievement {
  year: string;
  title: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  color: string;
}

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
  const [selectedAchievement, setSelectedAchievement] = useState<string | null>(
    null
  );

  const stats = [
    {
      number: '700+',
      label: 'Resources Shared',
      color: 'text-blue-600',
      description:
        'Books, audiobooks, and learning materials shared with readers and learners',
    },
    {
      number: '5+',
      label: 'Years of Work',
      color: 'text-indigo-600',
      description:
        'Sustained focus on research, publishing, and knowledge-sharing initiatives',
    },
    {
      number: 'Same Day',
      label: 'Fast Access',
      color: 'text-emerald-600',
      description: 'Quick access to curated resources and updates as they are published',
    },
    {
      number: '3',
      label: 'Core Areas',
      color: 'text-purple-600',
      description: 'Books, audiobooks, and blogs focused on learning and research content',
    },
  ];

  const achievements: Achievement[] = [
    {
      year: '2017',
      title: 'Launched the Library',
      description:
        'Started publishing curated books and audiobook resources for continuous learning',
      icon: TrophyIcon,
      color: 'text-yellow-600',
    },
    {
      year: '2018',
      title: 'Expanded Audio Resources',
      description: 'Introduced audiobook-focused collections to support learning on the go',
      icon: HeartIcon,
      color: 'text-red-600',
    },
    {
      year: '2016',
      title: 'Research & Curation Workflow',
      description: 'Established a consistent review and curation process for quality resources',
      icon: ShieldCheckIcon,
      color: 'text-blue-600',
    },
    {
      year: '2006',
      title: 'Long-Term Knowledge Work',
      description: 'Built years of experience turning complex topics into clear learning materials',
      icon: UserGroupIcon,
      color: 'text-green-600',
    },
    {
      year: '2006',
      title: 'Foundational Research Focus',
      description: 'Committed to research-driven publishing and accessible education resources',
      icon: AcademicCapIcon,
      color: 'text-indigo-600',
    },
  ];

  const qualifications: Qualification[] = [
    {
      degree: 'Content Curation & Review',
      institution: 'uniqueIIT Research Center',
      year: '2004-2006',
      description:
        'Structured process to select, review, and present high-quality learning resources',
    },
    {
      degree: 'Research-Driven Publishing',
      institution: 'uniqueIIT Research Center',
      year: '2001-2004',
      description: 'Creating clear summaries and resource collections grounded in research',
    },
    {
      degree: 'Learning Resource Development',
      institution: 'uniqueIIT Research Center',
      year: '2001',
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
    { id: 'achievements', label: 'Achievements', icon: TrophyIcon },
    { id: 'qualifications', label: 'Qualifications', icon: AcademicCapIcon },
    { id: 'specializations', label: 'Specializations', icon: BeakerIcon },
  ];

  return (
    <section className='py-4 sm:py-8 lg:py-12 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 relative overflow-hidden'>
      {/* Animated Background */}
      <div className='absolute inset-0 opacity-30'>
        <div className='absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-100/50 via-transparent to-indigo-100/50'></div>
        <div className='absolute top-20 right-20 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl animate-pulse'></div>
        <div className='absolute bottom-20 left-20 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl animate-pulse delay-1000'></div>
        <div className='absolute top-1/2 left-1/4 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-500'></div>
      </div>

      <div className='max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 relative'>
        {/* Header */}
        <div className='text-center mb-16'>
          <div className='inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold mb-6'>
            <CheckCircleIcon className='w-4 h-4 mr-2' />
            About TechUniqueIIT Research Center
          </div>
          <h2 className='text-4xl md:text-5xl font-bold text-slate-900 leading-tight mb-6'>
            Learn, Listen, Read, and{' '}
            <span className='bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>
              Grow Every Day
            </span>
          </h2>
          <p className='text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed'>
            TechUniqueIIT Research Center is a digital learning platform created to make powerful knowledge easy to access, easy to understand, and easy to experience.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className='flex flex-wrap justify-center gap-2 mb-12'>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              suppressHydrationWarning
              className={`flex items-center px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-white/80 backdrop-blur-sm text-slate-700 hover:bg-white border border-blue-100 hover:border-blue-200'
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
            <div className='relative overflow-hidden rounded-[28px] border border-blue-100 bg-white/90 p-6 shadow-[0_24px_70px_rgba(0,87,184,0.12)] backdrop-blur-sm sm:p-8 lg:p-10'>
              <div className='absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#0057b8] via-[#00a6d6] to-[#f58220]' />
              <div className='absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[#0057b8]/10 blur-3xl' />
              <div className='absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-[#f58220]/10 blur-3xl' />

              <div className='relative mx-auto mb-8 flex max-w-3xl flex-col items-center text-center'>
                <div className='mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0057b8] via-[#00a6d6] to-[#f58220] text-white shadow-lg'>
                  <BookOpenIcon className='h-7 w-7' />
                </div>
                <p className='text-sm font-bold uppercase tracking-[0.22em] text-[#0057b8]'>
                  Digital Learning Platform
                </p>
                <h3 className='mt-3 text-2xl font-bold text-slate-900 sm:text-3xl'>
                  Knowledge Designed for Reading, Listening, and Growth
                </h3>
              </div>

              <div className='relative mx-auto max-w-4xl space-y-6 text-center text-base leading-8 text-slate-600 sm:text-lg sm:leading-9'>
                <p>
                  Our platform offers a{' '}
                  <span className='rounded-lg bg-gradient-to-r from-[#f58220]/15 to-[#00a6d6]/10 px-2 py-1 font-semibold text-slate-900'>
                    curated collection of life-changing, motivational, self-growth, and learning-based books and audiobooks
                  </span>
                  . Users can listen to audiobooks through an{' '}
                  <span className='font-semibold text-[#0057b8]'>
                    interactive audiobook player
                  </span>{' '}
                  where words are{' '}
                  <span className='font-semibold text-[#00a6d6]'>
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
                  <span className='font-semibold text-[#008a67]'>
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
                  <span className='text-[#0057b8]'>- learn, listen, read, and grow every day.</span>
                </p>
              </div>

              {/* Credentials */}
              <div className='relative mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                <div className='flex min-h-[96px] items-center text-slate-700 bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300'>
                  <div className='p-2 bg-green-100 rounded-xl mr-4'>
                    <CheckCircleIcon className='w-5 h-5 text-green-600' />
                  </div>
                  <span className='font-semibold'>
                    Research-Led Publications
                  </span>
                </div>
                <div className='flex min-h-[96px] items-center text-slate-700 bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300'>
                  <div className='p-2 bg-blue-100 rounded-xl mr-4'>
                    <UserGroupIcon className='w-5 h-5 text-blue-600' />
                  </div>
                  <span className='font-semibold'>Expert Curation Team</span>
                </div>
                <div className='flex min-h-[96px] items-center text-slate-700 bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300'>
                  <div className='p-2 bg-indigo-100 rounded-xl mr-4'>
                    <UserGroupIcon className='w-5 h-5 text-indigo-600' />
                  </div>
                  <span className='font-semibold'>Community Learning</span>
                </div>
                <div className='flex min-h-[96px] items-center text-slate-700 bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300'>
                  <div className='p-2 bg-yellow-100 rounded-xl mr-4'>
                    <TrophyIcon className='w-5 h-5 text-yellow-600' />
                  </div>
                  <span className='font-semibold'>Curated Resources</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className='relative mt-8 flex flex-col justify-center gap-4 sm:flex-row'>
                <a
                  href='/about'
                  className='inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-[#0057b8] to-[#00a6d6] text-white rounded-2xl font-semibold hover:from-blue-700 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105'
                >
                  Learn More About UniqueIIT Research Center
                  <ArrowRightIcon className='w-5 h-5 ml-2' />
                </a>
                <Link
                  href='/books'
                  className='inline-flex items-center justify-center px-8 py-4 bg-white text-slate-700 rounded-2xl font-semibold hover:bg-orange-50 transition-all duration-300 shadow-lg hover:shadow-xl border border-[#f58220]/25'
                >
                  View Publications
                </Link>
              </div>
            </div>

            {/* Right Stats Card */}
            {/* <div className='relative lg:sticky lg:top-24 self-start'>
              <div className='absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-3xl opacity-20 transform rotate-6'></div>
              <div className='relative bg-white/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-blue-100'>
                <div className='mb-6'>
                  <p className='text-sm font-semibold uppercase tracking-[0.18em] text-blue-600'>
                    At a glance
                  </p>
                  <h3 className='mt-2 text-2xl font-bold text-slate-900'>
                    Main Highlights
                  </h3>
                </div>
                <div className='grid grid-cols-2 gap-6'>
                  {stats.map((stat, index) => (
                    <div
                      key={index}
                      className='rounded-2xl bg-slate-50/80 px-4 py-6 text-center group cursor-pointer border border-slate-100'
                    >
                      <div
                        className={`text-4xl font-bold ${stat.color} mb-2 group-hover:scale-110 transition-transform duration-300`}
                      >
                        {stat.number}
                      </div>
                      <div className='text-slate-600 font-medium mb-2'>
                        {stat.label}
                      </div>
                      <div className='text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                        {stat.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div> */}
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className='mx-auto max-w-5xl'>
            <div className='relative overflow-hidden rounded-[28px] border border-blue-100 bg-white/90 p-6 shadow-[0_24px_70px_rgba(0,87,184,0.12)] backdrop-blur-sm sm:p-8 lg:p-10'>
              <div className='absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#0057b8] via-[#00a6d6] to-[#f58220]' />
              <div className='absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[#0057b8]/10 blur-3xl' />
              <div className='absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-[#f58220]/10 blur-3xl' />

              <div className='relative mx-auto mb-8 max-w-3xl text-center'>
                <p className='text-sm font-bold uppercase tracking-[0.22em] text-[#0057b8]'>
                  Milestones
                </p>
                <h3 className='mt-3 text-2xl font-bold text-slate-900 sm:text-3xl'>
                  Building Better Access to Learning
                </h3>
                <p className='mt-3 text-sm leading-6 text-slate-600 sm:text-base'>
                  Key steps in our journey of research-led publishing, curation, and digital learning resources.
                </p>
              </div>

              <div className='relative grid gap-4'>
              {achievements.map((achievement, index) => (
                <div
                  key={index}
                  className={`min-h-[132px] cursor-pointer rounded-2xl border bg-white/90 p-5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ${
                    selectedAchievement === achievement.year
                      ? 'border-[#00a6d6] ring-2 ring-[#00a6d6]/25'
                      : 'border-blue-100'
                  }`}
                  onClick={() =>
                    setSelectedAchievement(
                      selectedAchievement === achievement.year
                        ? null
                        : achievement.year
                    )
                  }
                >
                  <div className='flex items-start gap-4'>
                    <div
                      className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0057b8]/10 via-[#00a6d6]/10 to-[#f58220]/10 ${achievement.color}`}
                    >
                      <achievement.icon className='w-6 h-6' />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <div className='mb-2 flex flex-wrap items-center gap-3'>
                        <span className='text-lg font-bold text-slate-900 sm:text-xl'>
                          {achievement.title}
                        </span>
                        <span className='rounded-full bg-[#0057b8]/10 px-3 py-1 text-xs font-bold text-[#0057b8]'>
                          {achievement.year}
                        </span>
                      </div>
                      <p className='text-sm leading-6 text-slate-600 sm:text-base'>
                        {achievement.description}
                      </p>
                      {selectedAchievement === achievement.year && (
                        <div className='mt-4 rounded-xl border border-[#f58220]/20 bg-orange-50/70 p-4'>
                          <p className='text-sm text-slate-700'>
                            This achievement represents a significant milestone
                            for our work, demonstrating our commitment to
                            accessible learning and consistent resource quality.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
          </div>
        )}

        {/* Qualifications Tab */}
        {activeTab === 'qualifications' && (
          <div className='mx-auto max-w-5xl'>
            <div className='relative overflow-hidden rounded-[28px] border border-blue-100 bg-white/90 p-6 shadow-[0_24px_70px_rgba(0,87,184,0.12)] backdrop-blur-sm sm:p-8 lg:p-10'>
              <div className='absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#0057b8] via-[#00a6d6] to-[#f58220]' />
              <div className='absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[#0057b8]/10 blur-3xl' />
              <div className='absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-[#f58220]/10 blur-3xl' />

              <div className='relative mx-auto mb-8 max-w-3xl text-center'>
                <p className='text-sm font-bold uppercase tracking-[0.22em] text-[#0057b8]'>
                  Qualifications
                </p>
                <h3 className='mt-3 text-2xl font-bold text-slate-900 sm:text-3xl'>
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
                  className='min-h-[230px] rounded-2xl border border-blue-100 bg-white/90 p-5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl'
                >
                  <div className='flex h-full flex-col'>
                    <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0057b8]/10 via-[#00a6d6]/10 to-[#f58220]/10'>
                      <AcademicCapIcon className='w-6 h-6 text-[#0057b8]' />
                    </div>
                    <div className='flex flex-1 flex-col'>
                      <div className='mb-3'>
                        <h3 className='text-lg font-bold leading-snug text-slate-900'>
                          {qual.degree}
                        </h3>
                        <span className='mt-3 inline-flex rounded-full bg-[#0057b8]/10 px-3 py-1 text-xs font-bold text-[#0057b8]'>
                          {qual.year}
                        </span>
                      </div>
                      <p className='mb-2 text-sm font-semibold text-[#00a6d6]'>
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
            <div className='relative overflow-hidden rounded-[28px] border border-blue-100 bg-white/90 p-6 shadow-[0_24px_70px_rgba(0,87,184,0.12)] backdrop-blur-sm sm:p-8 lg:p-10'>
              <div className='absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#0057b8] via-[#00a6d6] to-[#f58220]' />
              <div className='absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[#0057b8]/10 blur-3xl' />
              <div className='absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-[#f58220]/10 blur-3xl' />

              <div className='relative mx-auto mb-8 max-w-3xl text-center'>
                <p className='text-sm font-bold uppercase tracking-[0.22em] text-[#0057b8]'>
                  Specializations
                </p>
                <h3 className='mt-3 text-2xl font-bold text-slate-900 sm:text-3xl'>
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
                className='min-h-[150px] rounded-2xl border border-blue-100 bg-white/90 p-5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl'
              >
                <div className='flex items-start gap-4'>
                  <div
                    className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0057b8]/10 via-[#00a6d6]/10 to-[#f58220]/10 ${spec.color}`}
                  >
                    <spec.icon className='w-6 h-6' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='mb-3 flex flex-wrap items-center gap-3'>
                      <h3 className='text-lg font-bold text-slate-900'>
                        {spec.name}
                      </h3>
                      <span className='rounded-full bg-[#f58220]/12 px-2.5 py-1 text-xs font-bold text-[#9a4a00]'>
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
          <div className='relative overflow-hidden rounded-[28px] border border-blue-100 bg-white/90 p-6 shadow-[0_24px_70px_rgba(0,87,184,0.12)] backdrop-blur-sm sm:p-8 lg:p-10'>
            <div className='absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#0057b8] via-[#00a6d6] to-[#f58220]' />
            <div className='absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[#0057b8]/10 blur-3xl' />
            <div className='absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-[#f58220]/10 blur-3xl' />

            <div className='relative mx-auto mb-8 max-w-3xl text-center'>
              <div className='mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0057b8] via-[#00a6d6] to-[#f58220] text-white shadow-lg'>
                <EnvelopeIcon className='h-7 w-7' />
              </div>
              <p className='text-sm font-bold uppercase tracking-[0.22em] text-[#0057b8]'>
                Connect With Us
              </p>
              <h3 className='mt-3 text-2xl font-bold text-slate-900 sm:text-3xl'>
                Ready to Explore More?
              </h3>
              <p className='mt-3 text-sm leading-6 text-slate-600 sm:text-base'>
                Get in touch to ask questions, request recommendations, or suggest new books and audiobooks.
              </p>
            </div>

            <div className='relative grid gap-4 md:grid-cols-3'>
              <div className='flex min-h-[112px] items-center justify-center gap-3 rounded-2xl border border-blue-100 bg-white/90 p-5 text-center shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl'>
                <div className='flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#0057b8]/10'>
                  <PhoneIcon className='w-5 h-5 text-[#0057b8]' />
                </div>
                <div className='min-w-0 text-left'>
                  <div className='font-semibold text-slate-900'>Call (Optional)</div>
                  <div className='text-sm text-slate-600'>+19-7838758293</div>
                </div>
              </div>
              <div className='flex min-h-[112px] items-center justify-center gap-3 rounded-2xl border border-blue-100 bg-white/90 p-5 text-center shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl'>
                <div className='flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#00a6d6]/10'>
                  <EnvelopeIcon className='w-5 h-5 text-[#00a6d6]' />
                </div>
                <div className='min-w-0 text-left'>
                  <div className='font-semibold text-slate-900'>Email</div>
                  <div className='truncate text-sm text-slate-600'>
                    unquebookpublishinghouse@gmail.com
                  </div>
                </div>
              </div>
              <div className='flex min-h-[112px] items-center justify-center gap-3 rounded-2xl border border-blue-100 bg-white/90 p-5 text-center shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl'>
                <div className='flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#f58220]/10'>
                  <CalendarIcon className='w-5 h-5 text-[#f58220]' />
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
