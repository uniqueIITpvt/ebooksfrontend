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

let publicPlansCache: { data: SubscriptionPlan[]; timestamp: number } | null = null;
let publicPlansInFlight: Promise<SubscriptionPlan[]> | null = null;
const PUBLIC_PLANS_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const subscriptionPlansApi = {
  async getPublicPlans(forceRefresh = false): Promise<SubscriptionPlan[]> {
    const now = Date.now();
    if (!forceRefresh && publicPlansCache && now - publicPlansCache.timestamp < PUBLIC_PLANS_TTL_MS) {
      return publicPlansCache.data;
    }

    if (publicPlansInFlight) {
      return publicPlansInFlight;
    }

    publicPlansInFlight = (async () => {
      try {
        const response = await fetch(`${API_CONFIG.API_BASE_URL}/subscriptions/plans/public`);
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Failed to load subscription plans');
        }
        const normalized = (result.data || []).map(normalizePlan);
        publicPlansCache = { data: normalized, timestamp: Date.now() };
        return normalized;
      } catch (error) {
        console.error('Error loading public subscription plans:', error);
        return publicPlansCache?.data || fallbackSubscriptionPlans;
      } finally {
        publicPlansInFlight = null;
      }
    })();

    return publicPlansInFlight;
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
    publicPlansCache = null;
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
    publicPlansCache = null;
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
    publicPlansCache = null;
  },
};
