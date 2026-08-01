'use client';

import { useRouter } from 'next/navigation';
import {
  BookOpenIcon,
  CloudArrowDownIcon,
  DevicePhoneMobileIcon,
  MusicalNoteIcon,
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
  uniquePlusButtonLabel?: string;
  keepForeverButtonLabel?: string;
  activePlan?: 'basic' | 'premium' | 'pro' | null;
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
  uniquePlusButtonLabel = 'Start Unique Plus',
  keepForeverButtonLabel,
  activePlan = null,
}: AccessChoicePanelProps) {
  const router = useRouter();
  const label = itemLabel === 'audiobook' ? 'audiobook' : 'book';
  const activePlanDetails = activePlan
    ? {
        basic: { name: 'Basic', price: 99, period: '/month' },
        premium: { name: 'Premium', price: 249, period: '/3 months' },
        pro: { name: 'Pro', price: 499, period: '/year' },
      }[activePlan]
    : null;
  const planName = activePlanDetails?.name || 'Unique Plus';
  const displaySubscriptionPrice = activePlanDetails?.price ?? subscriptionPrice;
  const displaySubscriptionPeriod = activePlanDetails?.period || '/month';
  const subscriptionTitle =
    itemLabel === 'audiobook'
      ? activePlanDetails
        ? `Listen with ${planName}`
        : 'Listen with Unique Plus'
      : activePlanDetails
        ? `Read with ${planName}`
        : 'Read with Unique Plus';
  const subscriptionDescription = activePlanDetails
    ? `${planName} plan active${activePlan === 'premium' ? ' for 3 months' : ''}`
    : 'Unlock the full premium library';
  const subscriptionBadge = activePlanDetails ? 'Active Plan' : 'Best Value';
  const subscriptionButtonLabel = activePlanDetails ? planName : uniquePlusButtonLabel;

  const uniquePlusBenefits = [
    { icon: BookOpenIcon, text: 'Access to all premium eBooks' },
    { icon: MusicalNoteIcon, text: 'Access to all premium audiobooks' },
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

      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
        <article className="flex h-full flex-col rounded-2xl border border-blue-200 bg-blue-50/40 p-4 shadow-sm">
          <div className="mb-2.5 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
              <BookOpenIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-slate-950">{subscriptionTitle}</h2>
                <span className="shrink-0 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                  {subscriptionBadge}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-slate-500">{subscriptionDescription}</p>
            </div>
          </div>

          <div className="space-y-2">
            {uniquePlusBenefits.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm font-semibold text-slate-800">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
                  <Icon className="h-4 w-4" />
                </span>
                <span>{text}</span>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-3">
            <div className="mb-3 h-px bg-blue-100" />

            <div className="mb-3 flex items-end justify-between gap-3">
              <div className="flex items-end gap-1">
                <span className="text-3xl font-bold leading-none text-slate-950">{formatRupees(displaySubscriptionPrice)}</span>
                <span className="text-sm font-medium text-slate-500">{displaySubscriptionPeriod}</span>
              </div>
              {activePlanDetails ? (
                <button
                  type="button"
                  onClick={() => router.push('/profile?tab=subscription')}
                  className="pb-0.5 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-800 hover:underline"
                >
                  Cancel anytime
                </button>
              ) : (
                <p className="pb-0.5 text-xs font-medium text-slate-500">Cancel anytime</p>
              )}
            </div>

            <button
              type="button"
              onClick={onStartUniquePlus}
              className="h-11 w-full rounded-xl bg-blue-600 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-700"
            >
              {subscriptionButtonLabel}
            </button>
          </div>
        </article>

        <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2.5 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-900">
              <ShoppingBagIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-slate-950">Keep this book forever</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">One-time purchase with lifetime access</p>
            </div>
          </div>

          <div className="space-y-2">
            {foreverBenefits.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm font-semibold text-slate-800">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                  <Icon className="h-4 w-4" />
                </span>
                <span>{text}</span>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-3">
            <div className="mb-3 h-px bg-slate-200" />

            <button
              type="button"
              onClick={onKeepForever}
              className="h-11 w-full rounded-xl bg-black text-base font-semibold text-white shadow-lg shadow-black/20 transition-colors hover:bg-slate-900"
            >
              {keepForeverButtonLabel ?? `${formatRupees(price)} Keep Forever`}
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
