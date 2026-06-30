'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { freeSummariesApi, type FreeSummary } from '@/services/api/freeSummariesApi';

export default function FreeSummaryReadClient({ slug }: { slug: string }) {
  const router = useRouter();
  const [summary, setSummary] = useState<FreeSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const loadSummary = async () => {
      try {
        const data = await freeSummariesApi.getReadPayload(slug);
        if (!ignore) setSummary(data);
      } catch (error: any) {
        if (ignore) return;

        const message = String(error?.message || '');
        if (message.includes('401') || message.toLowerCase().includes('login')) {
          router.replace(`/user/auth?returnUrl=${encodeURIComponent(window.location.pathname)}`);
          return;
        }

        router.replace(`/free-summaries/${slug}`);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadSummary();

    return () => {
      ignore = true;
    };
  }, [router, slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back
        </button>

        <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 sm:p-8">
          <p className="text-sm font-semibold text-blue-600">{summary.category}</p>
          <h1 className="text-3xl font-bold text-slate-950 mt-2">{summary.title}</h1>
          <p className="text-sm text-slate-500 mt-2">by {summary.author}</p>

          <div className="mt-8 whitespace-pre-wrap leading-8 text-slate-700">
            {summary.description}
          </div>
        </article>
      </div>
    </div>
  );
}
