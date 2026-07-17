'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import AuthPage from '@/app/(user)/user/auth/page';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthModal() {
  const { isLoginModalOpen, setIsLoginModalOpen } = useAuth();

  if (!isLoginModalOpen) return null;

  const closeModal = () => setIsLoginModalOpen(false);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
      <button
        type="button"
        aria-label="Close auth popup"
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={closeModal}
      />

      <div className="relative h-[calc(100dvh-3rem)] w-full max-w-[280px] md:h-[calc(100dvh-5rem)] md:max-w-3xl">
        <button
          type="button"
          aria-label="Close auth popup"
          onClick={closeModal}
          className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-gray-600 shadow-lg transition-all hover:bg-white hover:text-gray-900"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
        <AuthPage />
      </div>
    </div>
  );
}
