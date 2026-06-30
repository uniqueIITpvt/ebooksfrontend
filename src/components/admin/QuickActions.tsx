'use client';

import React from 'react';
import Link from 'next/link';
import {
  PlusIcon,
  DocumentPlusIcon,
  BookOpenIcon,
  UserPlusIcon,
  CogIcon,
  ChartBarIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

const quickActions = [
  {
    name: 'Add New Blog',
    href: '/admin/blogs/new',
    icon: DocumentPlusIcon,
    color: 'bg-blue-500 hover:bg-blue-600',
    description: 'Create a new blog post'
  },
  {
    name: 'Add Book',
    href: '/admin/books/new',
    icon: BookOpenIcon,
    color: 'bg-yellow-500 hover:bg-yellow-600',
    description: 'Add a new book to catalog'
  },
  {
    name: 'Manage Users',
    href: '/admin/users',
    icon: UserPlusIcon,
    color: 'bg-purple-500 hover:bg-purple-600',
    description: 'View and manage users',
    superadminOnly: true
  },
  {
    name: 'View Analytics',
    href: '/admin/analytics',
    icon: ChartBarIcon,
    color: 'bg-indigo-500 hover:bg-indigo-600',
    description: 'Check detailed analytics'
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: CogIcon,
    color: 'bg-gray-500 hover:bg-gray-600',
    description: 'System configuration',
    superadminOnly: true
  }
];

export default function QuickActions() {
  const { isSuperAdmin } = useAuth();
  const visibleActions = quickActions.filter((action) => isSuperAdmin || !action.superadminOnly);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Quick Actions
        </h3>
        <BellIcon className="h-5 w-5 text-gray-400" />
      </div>
      
      <div className="space-y-3">
        {visibleActions.map((action) => (
          <Link
            key={action.name}
            href={action.href}
            className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
          >
            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white ${action.color} transition-colors`}>
              <action.icon className="h-5 w-5" />
            </div>
            
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {action.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {action.description}
              </p>
            </div>
            
            <div className="flex-shrink-0 ml-2">
              <svg className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
      
      {/* Add custom action button */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
        <button className="w-full flex items-center justify-center px-4 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Custom Action
        </button>
      </div>
    </div>
  );
}
