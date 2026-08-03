import type { SubscriptionPlanKey } from './subscriptionPlans';

type SubscriptionUser = {
  subscriptionStatus?: 'none' | 'active' | 'inactive' | 'expired' | string;
  subscriptionPlan?: 'none' | 'basic' | 'premium' | 'pro';
  subscriptionEndDate?: string;
} | null | undefined;

export const hasActiveSubscription = (user: SubscriptionUser) => {
  if (!user?.subscriptionPlan || user.subscriptionPlan === 'none') return false;
  if (
    user.subscriptionStatus === 'none' ||
    user.subscriptionStatus === 'inactive' ||
    user.subscriptionStatus === 'expired'
  ) {
    return false;
  }

  if (!user.subscriptionEndDate) return true;

  const endTime = new Date(user.subscriptionEndDate).getTime();
  return Number.isNaN(endTime) ? false : endTime > Date.now();
};

export const getActiveSubscriptionPlan = (user: SubscriptionUser): SubscriptionPlanKey | null => {
  if (!hasActiveSubscription(user)) return null;
  const plan = user?.subscriptionPlan;
  return plan === 'basic' || plan === 'premium' || plan === 'pro' ? plan : null;
};

export const formatSubscriptionPlanLabel = (
  plan: NonNullable<SubscriptionUser>['subscriptionPlan'] | null | undefined
) => {
  if (!plan || plan === 'none') return '';
  return plan.charAt(0).toUpperCase() + plan.slice(1);
};
