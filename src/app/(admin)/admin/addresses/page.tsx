'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  MapPinIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  HomeIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { API_CONFIG } from '@/config/api';
import { tokenStore } from '@/services/api/tokenStore';

interface Address {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  fullName: string;
  email: string;
  streetAddress: string;
  city: string;
  territory: string;
  country: string;
  zipCode: string;
  phone?: string;
  addressType: 'home' | 'office' | 'other';
  isDefault: boolean;
  createdAt: string;
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAddresses, setTotalAddresses] = useState(0);
  const [siteLogo, setSiteLogo] = useState('');

  const fetchAddresses = async (page = 1, search = '') => {
    try {
      const token = tokenStore.getAccessToken();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search })
      });
      
      const response = await fetch(`${API_CONFIG.API_BASE_URL}/addresses/admin/all?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch addresses (${response.status})`);
      }

      const data = await response.json();
      if (data.success) {
        setAddresses(Array.isArray(data.data) ? data.data : data.data?.addresses || []);
        setTotalPages(data.pagination?.totalPages || data.data?.pagination?.totalPages || 1);
        setTotalAddresses(data.total || data.data?.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses(currentPage, searchQuery);
  }, [currentPage, searchQuery]);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch(`${API_CONFIG.API_BASE_URL}/settings/public`);
        const data = await response.json();
        setSiteLogo(String(data?.data?.site_logo || ''));
      } catch {
        setSiteLogo('');
      }
    };

    fetchLogo();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    
    try {
      const token = tokenStore.getAccessToken();
      const response = await fetch(`${API_CONFIG.API_BASE_URL}/addresses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data.success) {
        fetchAddresses(currentPage, searchQuery);
      }
    } catch (error) {
      console.error('Error deleting address:', error);
    }
  };

  const filteredAddresses = addresses.filter(addr =>
    addr.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    addr.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    addr.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    addr.zipCode.includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50/90 via-cyan-50/70 to-orange-50/70 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-slate-900">Addresses</h1>
            <p className="truncate text-sm text-slate-500">
              TechUniqueIIT Research Center customer delivery locations
            </p>
          </div>
        </div>
        <div className="shrink-0 rounded-full border border-blue-200 bg-white px-4 py-2 text-sm text-slate-600">
          Total: <span className="font-semibold text-blue-700">{totalAddresses}</span> addresses
        </div>
      </div>

      {/* Search */}
      <div className="relative rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <MagnifyingGlassIcon className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, email, city, or zip code..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Addresses Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-50 via-cyan-50 to-orange-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Address</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Location</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Default</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAddresses.map((address) => (
                <tr key={address._id} className="transition-colors hover:bg-blue-50/40">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                        <span className="font-semibold text-blue-700">
                          {address.fullName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{address.fullName}</p>
                        <p className="text-sm text-slate-500">{address.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-900">{address.streetAddress || '-'}</p>
                    <p className="text-sm text-slate-500">{address.zipCode || '-'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-900">{address.city || '-'}</p>
                    <p className="text-sm text-slate-500">{address.territory || '-'}, {address.country || '-'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {address.addressType === 'home' ? (
                        <HomeIcon className="h-4 w-4 text-blue-600" />
                      ) : (
                        <BuildingOfficeIcon className="h-4 w-4 text-orange-600" />
                      )}
                      <span className="capitalize text-slate-700">{address.addressType}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {address.isDefault ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                        Default
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(address._id)}
                      className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
                      title="Delete address"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAddresses.length === 0 && (
          <div className="text-center py-12">
            <MapPinIcon className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="text-slate-500">No addresses found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
