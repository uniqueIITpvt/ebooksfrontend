import { API_CONFIG } from '@/config/api';
import { fallbackSubscriptionPlans, type SubscriptionPlan } from '@/lib/subscriptionPlans';
import { authApi } from './authApi';
import { tokenStore } from './tokenStore';

type PlanPayload = Omit<SubscriptionPlan, '_id'>;

const normalizePlan = (plan: Partial<SubscriptionPlan>): SubscriptionPlan => ({
  _id: plan._id,
  planKey: plan.planKey || 'basic',
  name: plan.name || 'Basic',
  price: Number(plan.price || 0),
  duration: plan.duration || 'per month',
  period: plan.period || '/month',
  durationMonths: Number(plan.durationMonths || 1),
  features: Array.isArray(plan.features) ? plan.features : [],
  color: plan.color || 'blue',
  recommended: Boolean(plan.recommended),
  isActive: plan.isActive !== false,
  sortOrder: Number(plan.sortOrder || 0),
});

const getAdminHeaders = async () => {
  if (!tokenStore.getAccessToken()) {
    await authApi.refreshToken();
  }

  const token = tokenStore.getAccessToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const adminFetch = async (url: string, init: RequestInit = {}) => {
  let response = await fetch(url, {
    ...init,
    headers: {
      ...(await getAdminHeaders()),
      ...(init.headers || {}),
    },
    credentials: 'include',
  });

  if (response.status === 401) {
    await authApi.refreshToken();
    response = await fetch(url, {
      ...init,
      headers: {
        ...(await getAdminHeaders()),
        ...(init.headers || {}),
      },
      credentials: 'include',
    });
  }

  return response;
};

export const subscriptionPlansApi = {
  async getPublicPlans(): Promise<SubscriptionPlan[]> {
    try {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}/subscriptions/plans/public`);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to load subscription plans');
      }
      return (result.data || []).map(normalizePlan);
    } catch (error) {
      console.error('Error loading public subscription plans:', error);
      return fallbackSubscriptionPlans;
    }
  },

  async getAdminPlans(): Promise<SubscriptionPlan[]> {
    const response = await adminFetch(`${API_CONFIG.API_BASE_URL}/subscriptions/plans`);
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to load subscription plans');
    }
    return (result.data || []).map(normalizePlan);
  },

  async createPlan(payload: PlanPayload): Promise<SubscriptionPlan> {
    const response = await adminFetch(`${API_CONFIG.API_BASE_URL}/subscriptions/plans`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to create subscription plan');
    }
    return normalizePlan(result.data);
  },

  async updatePlan(id: string, payload: Partial<PlanPayload>): Promise<SubscriptionPlan> {
    const response = await adminFetch(`${API_CONFIG.API_BASE_URL}/subscriptions/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to update subscription plan');
    }
    return normalizePlan(result.data);
  },

  async deletePlan(id: string): Promise<void> {
    const response = await adminFetch(`${API_CONFIG.API_BASE_URL}/subscriptions/plans/${id}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to delete subscription plan');
    }
  },
};
