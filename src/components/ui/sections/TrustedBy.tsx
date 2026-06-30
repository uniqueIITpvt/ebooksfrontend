'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

const partnerOrganizations = [
  {
    name: 'Research Communities',
    logo: 'https://logo.clearbit.com/researchgate.net',
  },
  {
    name: 'Online Learning',
    logo: 'https://logo.clearbit.com/coursera.org',
  },
  {
    name: 'Open Knowledge',
    logo: 'https://logo.clearbit.com/wikipedia.org',
  },
  {
    name: 'Technical Publishing',
    logo: 'https://logo.clearbit.com/oreilly.com',
  },
  {
    name: 'Academic Publishing',
    logo: 'https://logo.clearbit.com/springer.com',
  },
  {
    name: 'Reader Community',
    logo: 'https://logo.clearbit.com/goodreads.com',
  },
  {
    name: 'Audio Platforms',
    logo: 'https://logo.clearbit.com/audible.com',
  },
  {
    name: 'Libraries',
    logo: 'https://logo.clearbit.com/worldcat.org',
  },
  {
    name: 'Research Journals',
    logo: 'https://logo.clearbit.com/nature.com',
  },
  {
    name: 'Open Courses',
    logo: 'https://logo.clearbit.com/edx.org',
  },
];

export default function TrustedBy() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className='py-4 sm:py-8 lg:py-12 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden'>
    
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll {
          animation: scroll 30s linear infinite;
        }

        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
