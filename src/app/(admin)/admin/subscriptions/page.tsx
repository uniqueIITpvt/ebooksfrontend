'use client';

import React, { useEffect, useState } from 'react';
import { API_CONFIG } from '@/config/api';
import { tokenStore } from '@/services/api/tokenStore';
import { Crown, RefreshCw, CheckCircle, XCircle, Clock, Search, Calendar } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchSubscriptions();
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
