'use client';

import React, { useEffect, useState } from 'react';
import { API_CONFIG } from '@/config/api';
import { tokenStore } from '@/services/api/tokenStore';
import { CreditCard, RefreshCw, CheckCircle, XCircle, Clock, Search, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Payment {
  _id: string;
  paymentType: string;
  itemName: string;
  amount: number;
  totalAmount?: number;
  currency: string;
  paymentMethod: string;
  status: string;
  metadata?: Record<string, string>;
  customer: {
    name: string;
    email: string;
  };
  createdAt: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const token = tokenStore.getAccessToken();
      const res = await fetch(`${API_CONFIG.API_BASE_URL}/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPayments(data.data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.itemName?.toLowerCase().includes(search.toLowerCase()) ||
                         p.customer?.email?.toLowerCase().includes(search.toLowerCase()) ||
                         p._id?.includes(search);
    const matchesFilter = filter === 'all' || p.status === filter;
    const matchesType = typeFilter === 'all' || p.paymentType === typeFilter;
    return matchesSearch && matchesFilter && matchesType;
  });

  const formatCurrency = (amount: number, currency = 'INR') =>
    `${currency} ${amount.toLocaleString('en-IN')}`;

  const getPaymentFormat = (payment: Payment) => {
    const metadata = payment.metadata || {};
    if (metadata.format) return metadata.format;

    if (metadata.cartItems) {
      try {
        const cartItems = JSON.parse(metadata.cartItems);
        if (Array.isArray(cartItems)) {
          const formats = cartItems
            .map((item) => item.format)
            .filter(Boolean);
          return Array.from(new Set(formats)).join(', ');
        }
      } catch {
        return '';
      }
    }

    if (payment.paymentType === 'audiobook_purchase') return 'Audiobook';
    if (payment.paymentType === 'book_purchase' || payment.paymentType === 'book') return 'E-book';

    return '';
  };

  const handleEditClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setEditStatus(payment.status);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setDeleteModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedPayment) return;
    try {
      const token = tokenStore.getAccessToken();
      const res = await fetch(`${API_CONFIG.API_BASE_URL}/payments/${selectedPayment._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: editStatus })
      });
      const data = await res.json();
      if (data.success) {
        setPayments(payments.map(p => p._id === selectedPayment._id ? { ...p, status: editStatus } : p));
        setEditModalOpen(false);
      }
    } catch (error) {
      console.error('Error updating payment:', error);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedPayment) return;
    setDeleteLoading(true);
    try {
      const token = tokenStore.getAccessToken();
      const res = await fetch(`${API_CONFIG.API_BASE_URL}/payments/${selectedPayment._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPayments(payments.filter(p => p._id !== selectedPayment._id));
        setDeleteModalOpen(false);
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100'}`}>
        {status}
      </span>
    );
  };

  const getMethodIcon = (method: string) => {
    if (method === 'razorpay') return <CreditCard className="w-4 h-4" />;
    if (method === 'upi') return <span className="text-xs font-bold">UPI</span>;
    return <CreditCard className="w-4 h-4" />;
  };

  const getPaymentTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      subscription: 'bg-purple-100 text-purple-800',
      book_purchase: 'bg-blue-100 text-blue-800',
      audiobook_purchase: 'bg-amber-100 text-amber-800',
      book: 'bg-blue-100 text-blue-800'
    };
    const labels: Record<string, string> = {
      subscription: 'Subscription',
      book_purchase: 'Book',
      audiobook_purchase: 'Audiobook',
      book: 'Book'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[type] || 'bg-gray-100'}`}>
        {labels[type] || type}
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
          <CreditCard className="w-6 h-6" />
          Payments
        </h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by item, email, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          <option value="subscription">Subscription</option>
          <option value="book_purchase">Book Purchase</option>
          <option value="audiobook_purchase">Audiobook Purchase</option>
        </select>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        {[
          { label: 'Total', value: payments.length, color: 'bg-blue-50' },
          { label: 'Subscription', value: payments.filter(p => p.paymentType === 'subscription').length, color: 'bg-purple-50' },
          { label: 'Book', value: payments.filter(p => p.paymentType === 'book_purchase' || p.paymentType === 'book').length, color: 'bg-indigo-50' },
          { label: 'Audiobook', value: payments.filter(p => p.paymentType === 'audiobook_purchase').length, color: 'bg-amber-50' },
          { label: 'Completed', value: payments.filter(p => p.status === 'completed').length, color: 'bg-green-50' },
          { label: 'Pending', value: payments.filter(p => p.status === 'pending').length, color: 'bg-yellow-50' },
          { label: 'Failed', value: payments.filter(p => p.status === 'failed').length, color: 'bg-red-50' },
          {
            label: 'Total Amount',
            value: formatCurrency(
              payments.reduce((total, payment) => total + Number(payment.totalAmount ?? payment.amount ?? 0), 0),
              payments[0]?.currency || 'INR'
            ),
            color: 'bg-emerald-50',
          },
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
              {/* <th className="px-4 py-3 text-left text-sm font-medium">ID</th> */}
              <th className="px-4 py-3 text-left text-sm font-medium">Item</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Customer</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Method</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredPayments.map((payment) => (
              <tr key={payment._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                {/* <td className="px-4 py-3 text-sm font-mono">{payment._id?.slice(-8)}</td> */}
                <td className="px-4 py-3 text-sm">
                  <div className="font-medium">{payment.itemName}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-start gap-1.5">
                    {getPaymentTypeBadge(payment.paymentType)}
                    {getPaymentFormat(payment) && (
                      <span className="whitespace-nowrap rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-[#f28c18]">
                        {getPaymentFormat(payment)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div>{payment.customer?.name}</div>
                  <div className="text-xs text-gray-500">{payment.customer?.email}</div>
                </td>
                <td className="px-4 py-3 text-sm font-medium">
                  {payment.currency} {payment.amount}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-1">
                    {getMethodIcon(payment.paymentMethod)}
                    <span className="capitalize">{payment.paymentMethod}</span>
                  </div>
                </td>
                <td className="px-4 py-3">{getStatusBadge(payment.status)}</td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(payment.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditClick(payment)}
                      className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                      title="Edit Status"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(payment)}
                      className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                      title="Delete Payment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredPayments.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No payments found
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Edit Payment Status</h3>
            <p className="text-sm text-gray-600 mb-4">
              Payment: {selectedPayment?.itemName}
            </p>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-4 dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="created">Created</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setEditModalOpen(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Delete Payment</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete payment for <strong>{selectedPayment?.itemName}</strong>?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubmit}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
