'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const STORAGE_PREFIX = 'uniqueiit-scroll:';

function getScrollKey(pathname: string, search: string) {
  return `${STORAGE_PREFIX}${pathname}${search ? `?${search}` : ''}`;
}

function saveScrollPosition(key: string) {
  sessionStorage.setItem(
    key,
    JSON.stringify({ x: window.scrollX, y: window.scrollY })
  );
}

function readScrollPosition(key: string) {
  try {
    const value = sessionStorage.getItem(key);
    if (!value) return null;

    const parsed = JSON.parse(value) as { x?: number; y?: number };
    return {
      x: typeof parsed.x === 'number' ? parsed.x : 0,
      y: typeof parsed.y === 'number' ? parsed.y : 0,
    };
  } catch {
    return null;
  }
}

export default function ScrollRestoration() {
  const pathname = usePathname() || '/';
  const searchParams = useSearchParams();
  const search = searchParams?.toString() || '';
  const keyRef = useRef(getScrollKey(pathname, search));
  const isBackForwardRef = useRef(false);

  useEffect(() => {
    if (!('scrollRestoration' in window.history)) return;

    const previousValue = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

    return () => {
      window.history.scrollRestoration = previousValue;
    };
  }, []);

  useEffect(() => {
    const markBackForward = () => {
      isBackForwardRef.current = true;
    };

    window.addEventListener('popstate', markBackForward);

    return () => {
      window.removeEventListener('popstate', markBackForward);
    };
  }, []);

  useEffect(() => {
    const currentKey = getScrollKey(pathname, search);
    const previousKey = keyRef.current;

    if (previousKey !== currentKey) {
      saveScrollPosition(previousKey);
      keyRef.current = currentKey;
    }

    const savedPosition = readScrollPosition(currentKey);
    const shouldRestore =
      isBackForwardRef.current && savedPosition && !window.location.hash;

    if (shouldRestore) {
      const restore = () => {
        window.scrollTo(savedPosition.x, savedPosition.y);
      };

      requestAnimationFrame(restore);
      const timers = [250, 900].map((delay) => window.setTimeout(restore, delay));

      return () => {
        timers.forEach(window.clearTimeout);
        saveScrollPosition(currentKey);
        isBackForwardRef.current = false;
      };
    }

    isBackForwardRef.current = false;

    return () => {
      saveScrollPosition(currentKey);
    };
  }, [pathname, search]);

  useEffect(() => {
    const saveCurrentScroll = () => {
      saveScrollPosition(keyRef.current);
    };

    window.addEventListener('pagehide', saveCurrentScroll);
    window.addEventListener('beforeunload', saveCurrentScroll);

    return () => {
      saveCurrentScroll();
      window.removeEventListener('pagehide', saveCurrentScroll);
      window.removeEventListener('beforeunload', saveCurrentScroll);
    };
  }, []);

  return null;
}
