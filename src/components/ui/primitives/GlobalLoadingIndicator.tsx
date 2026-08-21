'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

const MIN_VISIBLE_MS = 280;
const LOADER_SHOWN_KEY = 'global-loading-indicator-shown';

export default function GlobalLoadingIndicator() {
  const pathname = usePathname();
  const shouldShowInitial =
    typeof window === 'undefined' || sessionStorage.getItem(LOADER_SHOWN_KEY) !== 'true';
  const [active, setActive] = useState(shouldShowInitial);
  const startedAtRef = useRef(Date.now());
  const hideTimerRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const hide = (delayMs = MIN_VISIBLE_MS) => {
    const elapsed = Date.now() - startedAtRef.current;
    const remaining = Math.max(delayMs - elapsed, 0);

    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
    }

    hideTimerRef.current = window.setTimeout(() => {
      setActive(false);
    }, remaining);
  };

  useEffect(() => {
    if (!active) return;

    const completeInitialLoad = () => hide(520);

    if (document.readyState === 'complete') {
      completeInitialLoad();
    } else {
      window.addEventListener('load', completeInitialLoad, { once: true });
    }

    return () => {
      window.removeEventListener('load', completeInitialLoad);
      clearTimers();
    };
  }, [active]);

  useEffect(() => {
    if (!active && typeof window !== 'undefined') {
      sessionStorage.setItem(LOADER_SHOWN_KEY, 'true');
    }
  }, [active]);

  if (!active || pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      aria-busy={active}
      className={`pointer-events-none fixed inset-0 z-[99999] flex items-center justify-center bg-white/45 backdrop-blur-[1px] transition-opacity duration-200 ${
        active ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-[0_12px_35px_rgba(15,23,42,0.16)] ring-1 ring-blue-100">
        <div className="flex h-9 items-end gap-1.5">
          {[0, 1, 2, 3].map((index) => (
            <span
              key={index}
              className="block w-2 rounded-full bg-gradient-to-t from-blue-700 via-cyan-500 to-orange-400 animate-[global-loading-wave_0.82s_ease-in-out_infinite]"
              style={{ animationDelay: `${index * 0.09}s` }}
            />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}
