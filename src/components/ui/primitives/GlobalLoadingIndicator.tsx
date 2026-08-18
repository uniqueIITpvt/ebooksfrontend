'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

const MIN_VISIBLE_MS = 280;
const ACTION_VISIBLE_MS = 900;
const MAX_VISIBLE_MS = 15000;

const isModifiedClick = (event: MouseEvent) =>
  event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;

const isSamePageHash = (anchor: HTMLAnchorElement) => {
  if (!anchor.hash) return false;

  const current = new URL(window.location.href);
  const target = new URL(anchor.href, window.location.href);

  return current.origin === target.origin && current.pathname === target.pathname && current.search === target.search;
};

export default function GlobalLoadingIndicator() {
  const pathname = usePathname();
  const [active, setActive] = useState(true);
  const startedAtRef = useRef(Date.now());
  const hideTimerRef = useRef<number | null>(null);
  const maxTimerRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (maxTimerRef.current) {
      window.clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
  };

  const show = (maxMs = MAX_VISIBLE_MS) => {
    clearTimers();
    startedAtRef.current = Date.now();
    setActive(true);

    maxTimerRef.current = window.setTimeout(() => {
      setActive(false);
    }, maxMs);
  };

  const hide = (delayMs = MIN_VISIBLE_MS) => {
    const elapsed = Date.now() - startedAtRef.current;
    const remaining = Math.max(delayMs - elapsed, 0);

    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
    }

    hideTimerRef.current = window.setTimeout(() => {
      if (maxTimerRef.current) {
        window.clearTimeout(maxTimerRef.current);
        maxTimerRef.current = null;
      }
      setActive(false);
    }, remaining);
  };

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    hide(420);
  }, [pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (isModifiedClick(event)) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest('a[href]');
      if (anchor instanceof HTMLAnchorElement) {
        if (anchor.target === '_blank' || anchor.hasAttribute('download') || isSamePageHash(anchor)) return;

        const targetUrl = new URL(anchor.href, window.location.href);
        if (targetUrl.href !== window.location.href) {
          show();
        }
        return;
      }

      const button = target.closest('button, [role="button"], input[type="button"], input[type="submit"]');
      if (!(button instanceof HTMLElement)) return;
      if (button.hasAttribute('disabled') || button.getAttribute('aria-disabled') === 'true') return;

      show(ACTION_VISIBLE_MS);
      hide(ACTION_VISIBLE_MS);
    };

    const handleSubmit = () => show();
    const handleBeforeUnload = () => show();

    document.addEventListener('click', handleClick, true);
    document.addEventListener('submit', handleSubmit, true);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('submit', handleSubmit, true);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

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
