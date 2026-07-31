'use client';

import { useEffect, useRef, useState } from 'react';
import { API_CONFIG } from '@/config/api';

const TAWK_SCRIPT_ID = 'tawk-to-widget-script';

type TawkConfigResponse = {
  data?: {
    scriptUrl?: string | null;
    enabled?: boolean;
  };
};

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
  const shouldOpenOnLoadRef = useRef(false);
  const scriptUrlRef = useRef<string | null>(null);
  const hasLoadErrorRef = useRef(false);
  const [isFallbackOpen, setIsFallbackOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_API.onLoad = () => {
      if (!isMounted) return;
      hasLoadErrorRef.current = false;
      setIsFallbackOpen(false);
      window.Tawk_API?.showWidget?.();
      if (shouldOpenOnLoadRef.current) {
        window.Tawk_API?.maximize?.();
      }
    };

    const loadTawkScript = (scriptUrl: string) => {
      const existingScript = document.getElementById(TAWK_SCRIPT_ID) as HTMLScriptElement | null;

      if (existingScript) {
        if (existingScript.src === scriptUrl) {
          window.Tawk_API?.showWidget?.();
          return;
        }
        existingScript.remove();
      }

      const script = document.createElement('script');
      const firstScript = document.getElementsByTagName('script')[0];

      window.Tawk_LoadStart = new Date();
      script.id = TAWK_SCRIPT_ID;
      script.async = true;
      script.src = scriptUrl;
      script.charset = 'UTF-8';
      script.setAttribute('crossorigin', '*');
      script.onerror = () => {
        if (!isMounted) return;
        hasLoadErrorRef.current = true;
        setIsFallbackOpen(true);
        shouldOpenOnLoadRef.current = false;
        script.remove();
      };

      firstScript.parentNode?.insertBefore(script, firstScript);
    };

    const loadConfig = async () => {
      try {
        const response = await fetch(`${API_CONFIG.API_BASE_URL}/public-config/tawk`, {
          cache: 'no-store',
        });

        if (!response.ok) throw new Error('Failed to load Tawk config');

        const payload = (await response.json()) as TawkConfigResponse;
        const scriptUrl = payload.data?.enabled ? payload.data.scriptUrl?.trim() : null;

        if (!isMounted) return;

        if (!scriptUrl) {
          hasLoadErrorRef.current = true;
          return;
        }

        hasLoadErrorRef.current = false;
        scriptUrlRef.current = scriptUrl;
        loadTawkScript(scriptUrl);
      } catch {
        if (!isMounted) return;
        hasLoadErrorRef.current = true;
      }
    };

    loadConfig();

    const openTawk = () => {
      shouldOpenOnLoadRef.current = true;
      if (hasLoadErrorRef.current || !scriptUrlRef.current) {
        setIsFallbackOpen(true);
        return;
      }
      window.Tawk_API?.showWidget?.();
      window.Tawk_API?.maximize?.();
    };

    window.addEventListener('openChatbot', openTawk);
    return () => {
      isMounted = false;
      window.removeEventListener('openChatbot', openTawk);
    };
  }, []);

  return (
    <>
      {isFallbackOpen && (
        <div className="fixed bottom-44 right-6 z-[2147483000] w-[280px] rounded-2xl bg-white p-4 text-sm text-slate-700 shadow-[0_18px_45px_rgba(15,23,42,0.18)] md:bottom-48 md:right-8">
          <button
            type="button"
            aria-label="Close live chat message"
            onClick={() => setIsFallbackOpen(false)}
            className="absolute right-3 top-3 text-lg leading-none text-slate-400 transition hover:text-slate-700"
          >
            &times;
          </button>
          <p className="pr-6 font-semibold text-slate-900">Live chat setup needed</p>
          <p className="mt-2 leading-5">
            Add the real Tawk property and widget id in the backend environment. The current Tawk
            embed URL is not available.
          </p>
        </div>
      )}
    </>
  );
}
