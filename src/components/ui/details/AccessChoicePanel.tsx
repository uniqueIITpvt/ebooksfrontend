'use client';

import {
  BookOpenIcon,
  CloudArrowDownIcon,
  DevicePhoneMobileIcon,
  MegaphoneIcon,
  LockClosedIcon,
  ShoppingBagIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

interface AccessChoicePanelProps {
  itemLabel?: 'book' | 'audiobook';
  price?: string | number | null;
  subscriptionPrice?: string | number;
  onStartUniquePlus: () => void;
  onKeepForever: () => void;
}

const formatRupees = (value?: string | number | null) => {
  const numeric =
    typeof value === 'number'
      ? value
      : Number.parseFloat(String(value || '').replace(/[^0-9.]/g, ''));

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return '\u20B9299';
  }

  return `\u20B9${Math.round(numeric)}`;
};

export function AccessChoicePanel({
  itemLabel = 'book',
  price,
  subscriptionPrice = 199,
  onStartUniquePlus,
  onKeepForever,
}: AccessChoicePanelProps) {
  const label = itemLabel === 'audiobook' ? 'audiobook' : 'book';

  const uniquePlusBenefits = [
    { icon: BookOpenIcon, text: 'Access to all premium eBooks' },
    { icon: MegaphoneIcon, text: 'Access to all premium audiobooks' },
    { icon: DevicePhoneMobileIcon, text: 'Read & listen anywhere' },
  ];

  const foreverBenefits = [
    { icon: CloudArrowDownIcon, text: 'Download ZIP file to local device' },
    { icon: UserCircleIcon, text: 'Individual license ownership' },
    { icon: LockClosedIcon, text: 'Always available in your personal library' },
  ];

  return (
    <section className="mt-6">
      <div className="mb-4 flex items-center gap-4 text-center text-sm font-semibold text-slate-700">
        <span className="h-px flex-1 bg-slate-200" />
        <span>Choose how you want to access this {label}</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <article className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5 shadow-sm">
          <div className="mb-5 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
              <BookOpenIcon className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-950">Read with Unique Plus</h2>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                  Best Value
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-slate-500">Unlock the full premium library</p>
            </div>
          </div>

          <div className="space-y-3">
            {uniquePlusBenefits.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm font-semibold text-slate-800">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
                  <Icon className="h-5 w-5" />
                </span>
                <span>{text}</span>
              </div>
            ))}
          </div>

          <div className="my-5 h-px bg-blue-100" />

          <div className="mb-4">
            <div className="flex items-end gap-1">
              <span className="text-3xl font-extrabold text-slate-950">{formatRupees(subscriptionPrice)}</span>
              <span className="pb-1 text-sm font-medium text-slate-500">/month</span>
            </div>
            <p className="mt-1 text-xs font-medium text-slate-500">Cancel anytime</p>
          </div>

          <button
            type="button"
            onClick={onStartUniquePlus}
            className="h-12 w-full rounded-xl bg-blue-600 text-base font-extrabold text-white shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-700"
          >
            Start Unique Plus
          </button>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-900">
              <ShoppingBagIcon className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-extrabold text-slate-950">Keep this book forever</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">One-time purchase with lifetime access</p>
            </div>
          </div>

          <div className="space-y-3">
            {foreverBenefits.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm font-semibold text-slate-800">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                  <Icon className="h-5 w-5" />
                </span>
                <span>{text}</span>
              </div>
            ))}
          </div>

          <div className="my-5 h-px bg-slate-200" />

          <button
            type="button"
            onClick={onKeepForever}
            className="h-14 w-full rounded-xl bg-black text-lg font-extrabold text-white shadow-lg shadow-black/20 transition-colors hover:bg-slate-900"
          >
            {formatRupees(price)} Keep Forever
          </button>
        </article>
      </div>
    </section>
  );
}
