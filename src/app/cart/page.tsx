'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingCartIcon,
  TrashIcon,
  PlusIcon,
  MinusIcon,
  ArrowLeftIcon,
  TagIcon,
  ShieldCheckIcon,
  TruckIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { useCart } from '@/contexts/CartContext';

export default function CartPage() {
  const router = useRouter();
  const { cartItems, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, totalSavings } = useCart();
  const [mounted, setMounted] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
      </div>
    );
  }

  const getCartLineKey = (id: string, format?: string) => `${id}:${format || 'default'}`;

  const handleRemove = (id: string, format?: string) => {
    setRemovingId(getCartLineKey(id, format));
    setTimeout(() => {
      removeFromCart(id, format);
      setRemovingId(null);
    }, 250);
  };

  const platformFee = totalPrice > 0 ? 0 : 0;
  const deliveryCharge = 0;
  const grandTotal = totalPrice + platformFee + deliveryCharge;
  const totalMrp = cartItems.reduce((sum, c) => sum + (c.originalPrice ?? c.price) * c.quantity, 0);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white rounded-2xl shadow-md p-12 max-w-md w-full">
          <ShoppingCartIcon className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty!</h2>
          <p className="text-gray-500 mb-8">Add items to it now.</p>
          <Link
            href="/books"
            className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Shop Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            My Cart <span className="text-gray-400 font-normal text-base">({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
          </h1>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2.5 border border-blue-600 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors text-sm"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Continue Shopping
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* ─── Left: Cart Items ─── */}
          <div className="flex-1 space-y-3">
            {cartItems.map(item => {
              const displayFormat = item.format || 'E-book';

              return (
              <div
                key={getCartLineKey(item.id, item.format)}
                className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-all duration-250 ${
                  removingId === getCartLineKey(item.id, item.format) ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                }`}
              >
                <div className="flex gap-4">
                  {/* Book Cover */}
                  <Link href={`/books/${item.slug}`} className="flex-shrink-0">
                    <div className="relative w-24 h-32 rounded-lg overflow-hidden bg-gray-100 shadow">
                      <Image
                        src={item.image || '/placeholder-book.jpg'}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/books/${item.slug}`}>
                      <h3 className="font-bold text-gray-900 text-base leading-snug hover:text-blue-600 transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-500 mt-0.5">by {item.author}</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <span className="inline-block text-xs bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded-full">
                        {item.category}
                      </span>
                      <span className="inline-block text-xs bg-orange-50 text-orange-700 font-medium px-2 py-0.5 rounded-full">
                        Format: {displayFormat}
                      </span>
                      {item.language && (
                        <span className="inline-block text-xs bg-emerald-50 text-emerald-700 font-medium px-2 py-0.5 rounded-full">
                          Language: {item.language}
                        </span>
                      )}
                    </div>

                    {/* Delivery note */}
                    <p className="flex items-center gap-1 text-xs text-green-600 font-medium mt-2">
                      <TruckIcon className="w-3.5 h-3.5" />
                      {['Hardcover', 'Paperback'].includes(displayFormat)
                        ? 'Delivery address required'
                        : 'Instant Digital Delivery'}
                    </p>

                    {/* Price row */}
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-lg font-bold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <>
                          <span className="text-sm text-gray-400 line-through">₹{(item.originalPrice * item.quantity).toFixed(2)}</span>
                          <span className="text-sm text-green-600 font-semibold">
                            {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% off
                          </span>
                        </>
                      )}
                    </div>

                    {/* Quantity + Actions */}
                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      {/* Quantity control */}
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                        <button
                          onClick={() => item.quantity === 1 ? handleRemove(item.id, item.format) : updateQuantity(item.id, item.quantity - 1, item.format)}
                          className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600"
                        >
                          <MinusIcon className="w-4 h-4" />
                        </button>
                        <span className="w-10 text-center font-semibold text-gray-800 text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1, item.format)}
                          className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600"
                        >
                          <PlusIcon className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => handleRemove(item.id, item.format)}
                        className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                        Remove
                      </button>

                      {/* Buy Now (single item) */}
                      <button
                        onClick={() => {
                          const params = new URLSearchParams({ id: item.id, qty: String(item.quantity) });
                          if (item.format) params.set('format', item.format);
                          router.push(`/checkout?${params.toString()}`);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>

                  {/* Item total (desktop) */}
                  <div className="hidden sm:flex flex-col items-end justify-between">
                    <span className="font-bold text-gray-900 text-base">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
            })}

            {/* Clear cart */}
            <div className="flex justify-end">
              <button
                onClick={clearCart}
                className="text-sm text-gray-400 hover:text-red-500 transition-colors"
              >
                Clear entire cart
              </button>
            </div>
          </div>

          {/* ─── Right: Price Summary ─── */}
          <div className="lg:w-80 space-y-4">
            {/* Offers */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <TagIcon className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-gray-800 text-sm">Available Offers</span>
              </div>
              <p className="text-xs text-gray-500 flex items-start gap-2">
                <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                Instant digital delivery — no shipping required for e-books.
              </p>
            </div>

            {/* Price Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-24">
              <h2 className="font-bold text-gray-600 uppercase text-xs tracking-widest mb-4 border-b border-gray-100 pb-3">
                Price Details
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-700">
                  <span>Price ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
                  <span>₹{totalMrp.toFixed(2)}</span>
                </div>

                {totalSavings > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>− ₹{totalSavings.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-700">
                  <span>Platform Fee</span>
                  <span className="text-green-600 font-medium">FREE</span>
                </div>

                <div className="flex justify-between text-gray-700">
                  <span>Delivery Charges</span>
                  <span className="text-green-600 font-medium">FREE</span>
                </div>

                <div className="flex justify-between font-bold text-gray-900 text-base border-t border-dashed border-gray-200 pt-3">
                  <span>Total Amount</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>

                {totalSavings > 0 && (
                  <p className="text-green-600 font-semibold text-sm text-center bg-green-50 rounded-lg py-2">
                    You will save ₹{totalSavings.toFixed(2)} on this order!
                  </p>
                )}
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => router.push('/checkout?from=cart')}
                className="mt-5 w-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg text-base"
              >
                Place Order
              </button>

              {/* Trust badges */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <ShieldCheckIcon className="w-4 h-4 text-blue-500" />
                  Safe & Secure Payments
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CheckBadgeIcon className="w-4 h-4 text-blue-500" />
                  100% Authentic Products
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
