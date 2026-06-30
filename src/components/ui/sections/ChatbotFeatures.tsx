'use client';

import { useState, useEffect } from 'react';
import { 
  SparklesIcon, 
  ClockIcon, 
  ChatBubbleLeftRightIcon, 
  ShieldCheckIcon,
  LanguageIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const features = [
  {
    icon: SparklesIcon,
    title: 'Lightning Fast',
    description: 'Instant responses from the assistant within seconds — keep readers moving forward.',
    gradient: 'from-purple-500 to-blue-600',
  },
  {
    icon: ClockIcon,
    title: '24/7 Available',
    description: 'Always-on help for browsing books, audiobooks, and learning resources.',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: 'Intelligent Conversations',
    description: 'Powered by AI to answer questions and recommend resources based on what you want to learn.',
    gradient: 'from-indigo-500 to-purple-600',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Privacy First',
    description: 'Designed with privacy and safety in mind while you explore learning resources.',
    gradient: 'from-green-500 to-emerald-600',
  },
  {
    icon: LanguageIcon,
    title: 'Multilingual Support',
    description: 'Ask questions in your preferred language for smoother learning.',
    gradient: 'from-orange-500 to-red-600',
  },
  {
    icon: ChartBarIcon,
    title: 'Analytics Dashboard',
    description: 'Track content engagement and improve how resources are discovered.',
    gradient: 'from-pink-500 to-rose-600',
  },
];

export default function ChatbotFeatures() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleTryChatbot = () => {
    // Dispatch custom event to open chatbot
    window.dispatchEvent(new CustomEvent('openChatbot'));
  };

  return (
    <section className='py-16 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden'>
      {/* Background Elements */}
      <div className='absolute inset-0 opacity-20'>
        <div className='absolute top-20 left-10 w-32 h-32 bg-blue-400/20 rounded-full blur-3xl animate-pulse' />
        <div className='absolute bottom-20 right-10 w-40 h-40 bg-purple-400/15 rounded-full blur-3xl animate-pulse delay-1000' />
        <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl animate-pulse delay-500' />
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
          <div className='inline-flex items-center bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-blue-200 px-6 py-3 rounded-full text-sm font-semibold mb-6 backdrop-blur-sm border border-blue-400/20'>
            <SparklesIcon className='w-5 h-5 mr-2' />
            <span>AI-Powered Learning Assistant</span>
          </div>
          <h2 className='text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight'>
            Most Accurate{' '}
            <span className='bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent'>
              AI Chatbot
            </span>
            <br />
            for Books
          </h2>
          <p className='text-xl text-blue-200 max-w-4xl mx-auto leading-relaxed'>
            Stop wasting time searching. Let our AI assistant help you discover the right books, audiobooks,
            and articles based on your interests.
          </p>
          <div className='mt-8'>
            <button
              onClick={handleTryChatbot}
              className='bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-purple-500/25'
            >
              Try the Chatbot Now
            </button>
            <p className='text-sm text-blue-300 mt-3'>
              Get started in &lt; 30 seconds · Try 100% free · No setup required
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {features.map((feature, index) => (
            <div
              key={index}
              className={`relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all duration-500 group ${
                isVisible
                  ? 'animate-in slide-in-from-bottom duration-1000'
                  : 'opacity-0'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className='w-6 h-6 text-white' />
              </div>
              <h3 className='text-xl font-bold text-white mb-4'>{feature.title}</h3>
              <p className='text-blue-200 leading-relaxed'>{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div
          className={`mt-16 grid grid-cols-2 lg:grid-cols-4 gap-8 ${
            isVisible
              ? 'animate-in slide-in-from-bottom duration-1000 delay-300'
              : 'opacity-0'
          }`}
        >
          <div className='text-center'>
            <div className='text-3xl lg:text-4xl font-bold text-white mb-2'>1,400+</div>
            <div className='text-blue-300'>Curated Collections</div>
          </div>
          <div className='text-center'>
            <div className='text-3xl lg:text-4xl font-bold text-white mb-2'>32,000+</div>
            <div className='text-blue-300'>Reader Questions Answered</div>
          </div>
          <div className='text-center'>
            <div className='text-3xl lg:text-4xl font-bold text-white mb-2'>500K+</div>
            <div className='text-blue-300'>Messages Handled</div>
          </div>
          <div className='text-center'>
            <div className='text-3xl lg:text-4xl font-bold text-white mb-2'>2,000+</div>
            <div className='text-blue-300'>Hours Saved Weekly</div>
          </div>
        </div>

        {/* Testimonial */}
        <div
          className={`mt-16 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center ${
            isVisible
              ? 'animate-in slide-in-from-bottom duration-1000 delay-500'
              : 'opacity-0'
          }`}
        >
          <div className='text-lg text-blue-200 mb-6 italic leading-relaxed'>
            "The assistant makes it easy to find the right audiobook fast. I can discover new topics,
            get quick summaries, and keep learning without getting stuck."
          </div>
          <div className='text-white font-semibold'>Community Feedback</div>
          <div className='text-blue-300 text-sm'>uniqueIIT Research Center</div>
        </div>
      </div>
    </section>
  );
}
