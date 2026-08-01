'use client';

import React, { useEffect, useState } from 'react';
import { API_CONFIG } from '@/config/api';
import { tokenStore } from '@/services/api/tokenStore';
import { subscriptionPlansApi } from '@/services/api/subscriptionPlansApi';
import { fallbackSubscriptionPlans, type SubscriptionPlan } from '@/lib/subscriptionPlans';
import { Crown, RefreshCw, Search, Calendar, Pencil, Trash2 } from 'lucide-react';

interface Subscription {
  _id: string;
  userId: {
    name: string;
    email: string;
  };
  plan: string;
  status: string;
  price: number;
  durationMonths: number;
  startDate: string;
  endDate: string;
  paymentStatus: string;
  paymentMethod: string;
  autoRenew: boolean;
  upgradeCredit?: number;
  createdAt: string;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>(fallbackSubscriptionPlans);
  const [loading, setLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState<SubscriptionPlan>({
    planKey: 'basic',
    name: '',
    price: 0,
    duration: '',
    period: '',
    durationMonths: 1,
    features: [],
    color: 'blue',
    recommended: false,
    isActive: true,
    sortOrder: 0,
  });

  useEffect(() => {
    fetchSubscriptions();
    fetchPlans();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const token = tokenStore.getAccessToken();
      const res = await fetch(`${API_CONFIG.API_BASE_URL}/subscriptions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSubscriptions(data.data);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const data = await subscriptionPlansApi.getAdminPlans();
      if (data.length) {
        setPlans(data);
      }
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
    } finally {
      setPlansLoading(false);
    }
  };

  const resetPlanForm = () => {
    setEditingPlanId(null);
    setPlanForm({
      planKey: 'basic',
      name: '',
      price: 0,
      duration: '',
      period: '',
      durationMonths: 1,
      features: [],
      color: 'blue',
      recommended: false,
      isActive: true,
      sortOrder: plans.length + 1,
    });
  };

  const editPlan = (plan: SubscriptionPlan) => {
    setEditingPlanId(plan._id || null);
    setPlanForm({
      ...plan,
      features: plan.features || [],
      isActive: plan.isActive !== false,
    });
  };

  const savePlan = async () => {
    try {
      const payload = {
        ...planForm,
        price: Number(planForm.price),
        durationMonths: Number(planForm.durationMonths),
        sortOrder: Number(planForm.sortOrder || 0),
        features: planForm.features.filter(Boolean),
      };

      if (editingPlanId) {
        await subscriptionPlansApi.updatePlan(editingPlanId, payload);
      } else {
        await subscriptionPlansApi.createPlan(payload);
      }

      resetPlanForm();
      await fetchPlans();
    } catch (error) {
      console.error('Error saving subscription plan:', error);
      alert(error instanceof Error ? error.message : 'Failed to save subscription plan');
    }
  };

  const deletePlan = async (plan: SubscriptionPlan) => {
    if (!plan._id || !window.confirm(`Delete ${plan.name} plan?`)) {
      return;
    }

    try {
      await subscriptionPlansApi.deletePlan(plan._id);
      await fetchPlans();
    } catch (error) {
      console.error('Error deleting subscription plan:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete subscription plan');
    }
  };

  const filteredSubscriptions = subscriptions.filter(s => {
    const matchesSearch = s.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
                         s.userId?.email?.toLowerCase().includes(search.toLowerCase()) ||
                         s._id?.includes(search);
    const matchesFilter = filter === 'all' || s.status === filter;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      expired: 'bg-orange-100 text-orange-800',
      upgraded: 'bg-indigo-100 text-indigo-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100'}`}>
        {status}
      </span>
    );
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      basic: 'bg-blue-100 text-blue-800',
      premium: 'bg-purple-100 text-purple-800',
      pro: 'bg-amber-100 text-amber-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${colors[plan] || 'bg-gray-100'}`}>
        {plan}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Crown className="w-6 h-6" />
          Subscriptions
        </h1>
      </div>

      <div className="mb-6 rounded-lg bg-white p-5 shadow dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Subscription Plan CRUD</h2>
          {plansLoading && <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <label className="space-y-1 text-sm font-medium text-gray-700">
            <span>Plan Key</span>
            <select
              value={planForm.planKey}
              onChange={(e) => setPlanForm({ ...planForm, planKey: e.target.value as SubscriptionPlan['planKey'] })}
              disabled={!!editingPlanId}
              className="w-full rounded-lg border px-3 py-2"
            >
              <option value="basic">basic</option>
              <option value="premium">premium</option>
              <option value="pro">pro</option>
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium text-gray-700">
            <span>Plan Name</span>
            <input
              value={planForm.name}
              onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
              placeholder="Plan name"
              className="w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-gray-700">
            <span>Price</span>
            <input
              type="number"
              value={planForm.price}
              onChange={(e) => setPlanForm({ ...planForm, price: Number(e.target.value) })}
              placeholder="Price"
              className="w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-gray-700">
            <span>Duration Months</span>
            <input
              type="number"
              value={planForm.durationMonths}
              onChange={(e) => setPlanForm({ ...planForm, durationMonths: Number(e.target.value) })}
              placeholder="Duration months"
              className="w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-gray-700">
            <span>Duration Label</span>
            <input
              value={planForm.duration}
              onChange={(e) => setPlanForm({ ...planForm, duration: e.target.value })}
              placeholder="e.g. per 3 months"
              className="w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-gray-700">
            <span>Card Period</span>
            <input
              value={planForm.period}
              onChange={(e) => setPlanForm({ ...planForm, period: e.target.value })}
              placeholder="e.g. /3 months"
              className="w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-gray-700">
            <span>Sort Order</span>
            <input
              type="number"
              value={planForm.sortOrder || 0}
              onChange={(e) => setPlanForm({ ...planForm, sortOrder: Number(e.target.value) })}
              placeholder="Sort order"
              className="w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-gray-700 md:col-span-2">
            <span>Features</span>
            <textarea
              value={planForm.features.join('\n')}
              onChange={(e) => setPlanForm({ ...planForm, features: e.target.value.split('\n') })}
              placeholder="One feature per line"
              className="w-full rounded-lg border px-3 py-2"
              rows={3}
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-gray-700">
            <span>Recommended Badge</span>
            <div className="flex h-[42px] items-center gap-2 rounded-lg border px-3">
              <input
                type="checkbox"
                checked={!!planForm.recommended}
                onChange={(e) => setPlanForm({ ...planForm, recommended: e.target.checked })}
              />
              Recommended
            </div>
          </label>
          <label className="space-y-1 text-sm font-medium text-gray-700">
            <span>Plan Status</span>
            <div className="flex h-[42px] items-center gap-2 rounded-lg border px-3">
              <input
                type="checkbox"
                checked={planForm.isActive !== false}
                onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.checked })}
              />
              Active
            </div>
          </label>
        </div>

        <div className="mt-4 flex gap-2">
          <button onClick={savePlan} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white">
            {editingPlanId ? 'Update Plan' : 'Add Plan'}
          </button>
          <button onClick={resetPlanForm} className="rounded-lg border px-4 py-2 font-semibold">
            Cancel
          </button>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Plan</th>
                <th className="px-3 py-2 text-left">Price</th>
                <th className="px-3 py-2 text-left">Duration</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {plans.map((plan) => (
                <tr key={plan._id || plan.planKey}>
                  <td className="px-3 py-2">
                    <div className="font-semibold">{plan.name}</div>
                    <div className="text-xs text-gray-500">{plan.planKey}</div>
                  </td>
                  <td className="px-3 py-2">₹{plan.price}</td>
                  <td className="px-3 py-2">{plan.duration}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs ${plan.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {plan.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                    {plan.recommended && <span className="ml-2 rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">Recommended</span>}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button onClick={() => editPlan(plan)} className="rounded border p-2 text-blue-600">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => deletePlan(plan)} className="rounded border p-2 text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by user, email, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="cancelled">Cancelled</option>
          <option value="upgraded">Upgraded</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: subscriptions.length, color: 'bg-blue-50' },
          { label: 'Active', value: subscriptions.filter(s => s.status === 'active').length, color: 'bg-green-50' },
          { label: 'Expired', value: subscriptions.filter(s => s.status === 'expired').length, color: 'bg-orange-50' },
          { label: 'Upgraded', value: subscriptions.filter(s => s.status === 'upgraded').length, color: 'bg-indigo-50' },
        ].map((stat, i) => (
          <div key={i} className={`p-4 rounded-lg ${stat.color}`}>
            <p className="text-sm text-gray-600">{stat.label}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">User</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Plan</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Price</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Duration</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Period</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Auto Renew</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredSubscriptions.map((sub) => (
              <tr key={sub._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3 text-sm">
                  <div className="font-medium">{sub.userId?.name}</div>
                  <div className="text-xs text-gray-500">{sub.userId?.email}</div>
                </td>
                <td className="px-4 py-3">{getPlanBadge(sub.plan)}</td>
                <td className="px-4 py-3">{getStatusBadge(sub.status)}</td>
                <td className="px-4 py-3 text-sm font-medium">₹{sub.price}</td>
                <td className="px-4 py-3 text-sm">{sub.durationMonths} months</td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-1 text-xs">
                    <Calendar className="w-3 h-3" />
                    {new Date(sub.startDate).toLocaleDateString()} -
                    {new Date(sub.endDate).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${sub.autoRenew ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {sub.autoRenew ? 'Yes' : 'No'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredSubscriptions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No subscriptions found
          </div>
        )}
      </div>
    </div>
  );
}
