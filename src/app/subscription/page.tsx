"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/services/api/authApi";
import { useRouter } from "next/navigation";
import { CheckIcon } from "@heroicons/react/24/solid";
import { Button } from "@/components/ui/primitives/Button";

const plans = [
  {
    name: "Basic",
    price: 99,
    duration: "per month",
    features: [
      "Access to all standard books",
      "Read on any device",
      "Standard support",
      "No ads",
    ],
    planKey: "basic",
    color: "blue",
  },
  {
    name: "Premium",
    price: 249,
    duration: "per 3 months",
    features: [
      "All Basic features",
      "Access to Premium summaries",
      "Download for offline reading",
      "Priority support",
    ],
    planKey: "premium",
    color: "indigo",
    recommended: true,
  },
  {
    name: "Pro",
    price: 499,
    duration: "year",
    features: [
      "All Premium features",
      "Exclusive community access",
      "Early access to new releases",
      "Personalized reading plans",
    ],
    planKey: "pro",
    color: "purple",
  },
];

const PLAN_RANK: Record<string, number> = { basic: 1, premium: 2, pro: 3 };

export default function SubscriptionPage() {
  const { user, isAuthenticated, refreshUser, openAuthModal } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [returnTo, setReturnTo] = useState('');
  const hasUniquePlus =
    !!user?.subscriptionPlan &&
    user.subscriptionPlan !== 'none';

  useEffect(() => {
    setReturnTo(new URLSearchParams(window.location.search).get('returnTo') || '');
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void refreshUser();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !hasUniquePlus || !returnTo.startsWith('/')) return;
    router.replace(returnTo);
  }, [hasUniquePlus, isAuthenticated, returnTo, router]);

  const handleSubscribe = async (planKey: string) => {
    if (
      user?.subscriptionStatus === 'active' &&
      user.subscriptionPlan &&
      PLAN_RANK[planKey] < PLAN_RANK[user.subscriptionPlan]
    ) {
      return;
    }

    // If not logged in, redirect to login with return URL
    if (!isAuthenticated) {
      openAuthModal('signin', `/checkout?plan=${planKey}&type=subscription`);
      return;
    }

    // For logged-in users, redirect directly to checkout for payment
    router.push(`/checkout?plan=${planKey}&type=subscription`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-syne font-bold text-slate-950 mb-4">
            Choose Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Reading Plan
            </span>
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Unlock unlimited access to our entire library of research papers,
            book summaries, and exclusive content.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isCurrentPlan = user?.subscriptionPlan === plan.planKey;
            const hasHigherActivePlan =
              user?.subscriptionStatus === 'active' &&
              !!user.subscriptionPlan &&
              PLAN_RANK[plan.planKey] < PLAN_RANK[user.subscriptionPlan];

            return (
            <div
              key={plan.planKey}
              className={`relative flex flex-col p-8 rounded-[32px] border ${plan.recommended ? "bg-white border-blue-500/50 shadow-2xl shadow-blue-500/15" : "bg-white/85 border-blue-100 shadow-xl shadow-blue-100/60"} transition-all hover:-translate-y-2`}
            >
              {plan.recommended && (
                <div className="absolute top-0 right-8 -translate-y-1/2 px-4 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                  Recommended
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-950 mb-2 font-syne">
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-950">
                    ₹{plan.price}
                  </span>
                  <span className="text-slate-500 text-sm">{plan.duration}</span>
                </div>
              </div>

              <ul className="flex-1 space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-slate-700 text-sm"
                  >
                    <div className="p-1 rounded-full bg-blue-500/10">
                      <CheckIcon className="w-3 h-3 text-blue-500" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSubscribe(plan.planKey)}
                loading={isLoading === plan.planKey}
                variant={plan.recommended ? "primary" : "secondary"}
                fullWidth
                className="py-4 font-bold rounded-2xl"
                disabled={isCurrentPlan || hasHigherActivePlan}
              >
                {isCurrentPlan
                  ? "Current Plan"
                  : hasHigherActivePlan
                  ? "Available After Current Plan"
                  : `Get Started with ${plan.name}`}
              </Button>
              {hasHigherActivePlan && (
                <p className="mt-3 text-center text-xs text-slate-500">
                  You already have a higher active plan.
                </p>
              )}
            </div>
          );
          })}
        </div>

        <div className="mt-16 text-center text-slate-500 text-sm">
          Secure payments powered by UniqueIIT. Cancel anytime.
        </div>
      </div>
    </div>
  );
}
