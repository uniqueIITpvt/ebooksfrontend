'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { API_CONFIG } from '@/config/api';
import {
  ShieldCheckIcon,
  BookOpenIcon,
  UserIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';

const API_URL = API_CONFIG.API_BASE_URL;


// Social media icons as SVG components
const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg fill='currentColor' viewBox='0 0 24 24' {...props}>
    <path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' />
  </svg>
);

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg fill='currentColor' viewBox='0 0 24 24' {...props}>
    <path d='M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z' />
  </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg fill='currentColor' viewBox='0 0 24 24' {...props}>
    <path d='M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-2.297 0-4.163-1.866-4.163-4.163 0-2.297 1.866-4.163 4.163-4.163 2.297 0 4.163 1.866 4.163 4.163 0 2.297-1.866 4.163-4.163 4.163zm7.138 0c-2.297 0-4.163-1.866-4.163-4.163 0-2.297 1.866-4.163 4.163-4.163 2.297 0 4.163 1.866 4.163 4.163 0 2.297-1.866 4.163-4.163 4.163z' />
  </svg>
);

const LinkedInIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg fill='currentColor' viewBox='0 0 24 24' {...props}>
    <path d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' />
  </svg>
);

interface FooterProps {
  siteLogo?: string | null;
}
export default function Footer({ siteLogo: siteLogoProp }: FooterProps) {
  const [siteLogo, setSiteLogo] = useState<string>(siteLogoProp || '');

  useEffect(() => {
    if (siteLogoProp) {
      setSiteLogo(siteLogoProp);
      return;
    }
    
    const fetchLogo = async () => {
      try {
        const res = await fetch(`${API_URL}/settings/public`);
        const data = await res.json();
        if (data?.success && data?.data?.site_logo) {
          setSiteLogo(String(data.data.site_logo));
          return;
        }

        const valueRes = await fetch(`${API_URL}/settings/value/site_logo`);
        const valueData = await valueRes.json();
        if (valueData?.success && valueData?.value) {
          setSiteLogo(String(valueData.value));
        } else {
          setSiteLogo('');
        }
      } catch {
        setSiteLogo('');
      }
    };
    
    void fetchLogo();
  }, [siteLogoProp]);

  const quickLinks = [
    { name: 'About', href: '/about' },
    { name: 'Books', href: '/books' },
    { name: 'Audiobooks', href: '/audiobooks' },
    { name: 'Blog', href: '/blog' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Contact Us', href: '/contact' },
  ];

  const resources = [
    { name: 'All Books', href: '/books', icon: BookOpenIcon },
    { name: 'All Audiobooks', href: '/audiobooks', icon: BookOpenIcon },
    { name: 'Blog', href: '/blog', icon: BookOpenIcon },
    { name: 'FAQ', href: '/faq', icon: BookOpenIcon },
  ];

  const socialLinks = [
    { name: 'LinkedIn', href: 'https://www.linkedin.com', icon: LinkedInIcon },
    { name: 'Facebook', href: '#', icon: FacebookIcon },
    { name: 'Instagram', href: '#', icon: InstagramIcon },
    { name: 'Twitter', href: '#', icon: TwitterIcon },
  ];

  return (
    <footer className='bg-gradient-to-br from-slate-900 to-slate-800 text-white'>
      <div className='max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8'>
        {/* Main Content */}
        <div className='pt-8 pb-4 sm:pt-12 sm:pb-5 lg:pt-16 lg:pb-6'>
          <div className='grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12'>
            {/* Brand Section */}
            <div className='md:col-span-1'>
              <div className='flex flex-col items-start gap-2'>
                <div className='w-20 h-20 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden relative flex-shrink-0'>
                  <Image
                    src={siteLogo || '/file.svg'}
                    alt='TechUniqueIIT Research Center'
                    fill
                    sizes='80px'
                    className='object-contain p-1'
                  />
                </div>
                <div>
                  <div className='text-lg font-extrabold leading-tight'>
                    <span className='text-[#2f8fd3]'>TechUnique</span>
                    <span className='text-[#f59a32]'>IIT</span>
                  </div>
                  <div className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-200'>
                    Research Center
                  </div>
                </div>
              </div>
            </div>

            {/* About Us */}
            <div>
              <h4 className='text-sm font-bold text-white uppercase tracking-wider mb-4'>
                About Us
              </h4>
              <p className='text-slate-300 text-sm leading-relaxed max-w-xs'>
                TechUniqueIIT Research Center provides books, audiobooks, and research-driven content to support continuous learning.
              </p>
            </div>

            {/* Get Know To Us */}
            <div>
              <h4 className='text-sm font-bold text-white uppercase tracking-wider mb-4'>
                Get Know To Us
              </h4>
              <ul className='space-y-2'>
                {quickLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className='text-slate-300 hover:text-white transition-colors text-sm'
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Us */}
            <div>
              <h4 className='text-sm font-bold text-white uppercase tracking-wider mb-4'>
                Contact Us
              </h4>
              <div className='text-sm text-slate-300'>
                <div className='font-semibold text-white/90 mb-1'>Drop email at:</div>
                <a
                  href='mailto:unquebookpublishinghouse@gmail.com'
                  className='text-slate-300 hover:text-white transition-colors'
                >
                  unquebookpublishinghouse@gmail.com
                </a>
              </div>
            </div>

            {/* Follow Us At */}
            {/* <div>
              <h4 className='text-sm font-bold text-white uppercase tracking-wider mb-4'>
                Follow Us At
              </h4>
              <div className='flex items-center gap-3'>
                {socialLinks.slice(0, 2).map((social) => (
                  <Link
                    key={social.name}
                    href={social.href}
                    className='w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition-colors'
                    aria-label={social.name}
                  >
                    <social.icon className='w-4 h-4' />
                  </Link>
                ))}
              </div>
            </div> */}
          </div>

          {/* Bottom Bar */}
          <div className='border-t border-slate-700 mt-10 pt-5'>
            <p className='text-slate-400 text-xs sm:text-sm text-center'>
              Copyright © 2026 uniqueIIT Research Center. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
