'use client';

import { useEffect, useState } from 'react';

const TAWK_PROPERTY_ID =
  process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID || '6a6b1e0bcf00701d473f0394';
const TAWK_WIDGET_ID = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID || 'default';

declare global {
  interface Window {
    Tawk_API?: {
      maximize?: () => void;
      showWidget?: () => void;
      onLoad?: () => void;
      onChatMaximized?: () => void;
      onChatMinimized?: () => void;
      onChatHidden?: () => void;
    };
    Tawk_LoadStart?: Date;
  }
}

export default function TawkWidget() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const scriptId = 'tawk-to-widget-script';

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_API.onLoad = () => {
      window.Tawk_API?.showWidget?.();
    };
    window.Tawk_API.onChatMaximized = () => setIsChatOpen(true);
    window.Tawk_API.onChatMinimized = () => setIsChatOpen(false);
    window.Tawk_API.onChatHidden = () => setIsChatOpen(false);
    window.Tawk_LoadStart = new Date();

    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      const firstScript = document.getElementsByTagName('script')[0];

      script.id = scriptId;
      script.async = true;
      script.src = `https://embed.tawk.to/${TAWK_PROPERTY_ID}/${TAWK_WIDGET_ID}`;
      script.charset = 'UTF-8';
      script.setAttribute('crossorigin', '*');

      firstScript.parentNode?.insertBefore(script, firstScript);
    } else {
      window.Tawk_API.showWidget?.();
    }

    const openTawk = () => {
      window.Tawk_API?.showWidget?.();
      window.Tawk_API?.maximize?.();
    };

    window.addEventListener('openChatbot', openTawk);
    return () => window.removeEventListener('openChatbot', openTawk);
  }, []);

  const openTawk = () => {
    window.Tawk_API?.showWidget?.();
    window.Tawk_API?.maximize?.();
    setIsChatOpen(true);
  };

  if (isChatOpen) return null;

  return (
    <button
      type="button"
      aria-label="Open live chat"
      onClick={openTawk}
      className="fixed bottom-24 right-6 z-[2147483000] flex h-16 w-16 items-center justify-center rounded-full bg-[#00A859] text-white shadow-[0_14px_35px_rgba(0,168,89,0.35)] transition duration-200 hover:-translate-y-1 hover:bg-[#00964f] md:bottom-28 md:right-8"
    >
      <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold leading-none text-white">
        1
      </span>
      <svg
        aria-hidden="true"
        className="h-8 w-8"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 4C7.58 4 4 7.13 4 11c0 2.12 1.08 4.02 2.79 5.3L6 20l3.75-1.88c.72.18 1.48.28 2.25.28 4.42 0 8-3.13 8-7S16.42 4 12 4Z"
          fill="currentColor"
        />
        <path
          d="M8.8 11.5h6.4M8.8 14h4.4"
          stroke="#00A859"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
