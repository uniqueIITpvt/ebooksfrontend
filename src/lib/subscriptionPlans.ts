export type SubscriptionPlanKey = 'basic' | 'premium' | 'pro';

export interface SubscriptionPlan {
  _id?: string;
  name: string;
  price: number;
  duration: string;
  period: string;
  durationMonths: number;
  features: string[];
  planKey: SubscriptionPlanKey;
  color: 'blue' | 'indigo' | 'purple';
  recommended?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export const fallbackSubscriptionPlans: SubscriptionPlan[] = [
  {
    name: 'Basic',
    price: 99,
    duration: 'per month',
    period: '/month',
    durationMonths: 1,
    features: [
      'Access to all standard books',
      'Read on any device',
      'Standard support',
      'No ads',
    ],
    planKey: 'basic',
    color: 'blue',
  },
  {
    name: 'Premium',
    price: 249,
    duration: 'per 3 months',
    period: '/3 months',
    durationMonths: 3,
    features: [
      'All Basic features',
      'Access to Premium summaries',
      'Download for offline reading',
      'Priority support',
    ],
    planKey: 'premium',
    color: 'indigo',
    recommended: true,
  },
  {
    name: 'Pro',
    price: 499,
    duration: 'year',
    period: '/year',
    durationMonths: 12,
    features: [
      'All Premium features',
      'Exclusive community access',
      'Early access to new releases',
      'Personalized reading plans',
    ],
    planKey: 'pro',
    color: 'purple',
  },
];

export const subscriptionPlanRank: Record<SubscriptionPlanKey, number> = {
  basic: 1,
  premium: 2,
  pro: 3,
};

export const subscriptionPlans = fallbackSubscriptionPlans;

export const getRecommendedSubscriptionPlan = (
  plans: SubscriptionPlan[] = fallbackSubscriptionPlans
) => plans.find((plan) => plan.recommended) ?? plans[0] ?? fallbackSubscriptionPlans[0];

export const recommendedSubscriptionPlan = getRecommendedSubscriptionPlan();

export const getSubscriptionPlan = (
  planKey: SubscriptionPlanKey | null | undefined,
  plans: SubscriptionPlan[] = fallbackSubscriptionPlans
) => (planKey ? plans.find((plan) => plan.planKey === planKey) ?? null : null);
