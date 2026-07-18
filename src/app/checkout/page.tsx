'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeftIcon,
  ShoppingBagIcon,
  CheckCircleIcon,
  BookOpenIcon,
  MapPinIcon,
  EyeIcon,
  ArrowPathIcon,
  UserIcon,
  MinusIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import { booksApi, type Book } from '@/services/api/booksApi';
import { audiobooksApi } from '@/services/api/audiobooksApi';
import { API_CONFIG } from '@/config/api';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { tokenStore } from '@/services/api/tokenStore';

const API_BASE_URL = API_CONFIG.API_BASE_URL;

type Step = 'address' | 'account' | 'review';

interface AddressData {
  fullName: string;
  email: string;
  streetAddress: string;
  zipCode: string;
  city: string;
  territory: string;
  country: string;
}

const PLAN_RANK: Record<string, number> = { basic: 1, premium: 2, pro: 3 };

const roundMoney = (value: number) => Math.round(value * 100) / 100;

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cartItems, clearCart } = useCart();
  const { user, openAuthModal } = useAuth();

  const fromCart = searchParams.get('from') === 'cart';
  const checkoutKind = searchParams.get('kind');
  const isAudiobookCheckout = checkoutKind === 'audiobook';
  const bookId = !isAudiobookCheckout ? searchParams.get('id') : null;
  const audiobookId = isAudiobookCheckout ? searchParams.get('id') : null;
  const audiobookSlug = searchParams.get('slug');
  const audiobookMode = (searchParams.get('mode') as 'buy' | 'claim' | null) || null;
  const initialQty = Math.max(1, parseInt(searchParams.get('qty') || '1'));
  const selectedBookFormat = searchParams.get('format');
  const planKey = searchParams.get('plan');
  const type = searchParams.get('type');

  const PHYSICAL_FORMATS = ['Hardcover', 'Paperback'];

  const parseCurrency = (value?: string | number | null) => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    return parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
  };

  const getBookCheckoutFormat = (bookData: Book) =>
    selectedBookFormat || (bookData.format?.includes('Hardcover') ? 'Hardcover' : bookData.format?.[0] || 'E-book');

  const getBookFormatPrice = (bookData: Book, format: string) => {
    const basePrice = parseCurrency(bookData.price);

    if (bookData.formatPrices?.[format]) {
      return parseCurrency(bookData.formatPrices[format]);
    }

    switch (format) {
      case 'Hardcover':
        return basePrice * 1.5;
      case 'Paperback':
        return basePrice;
      case 'E-book':
        return basePrice * 0.7;
      default:
        return basePrice;
    }
  };

  const getCheckoutUser = () => {
    if (typeof window === 'undefined') return user;

    const storedUser = localStorage.getItem('user_user') || localStorage.getItem('admin_user');
    if (!storedUser) return user;

    try {
      return JSON.parse(storedUser);
    } catch {
      return user;
    }
  };

  const getCheckoutContact = () => {
    const checkoutUser = getCheckoutUser();

    return {
      name: addressData.fullName || checkoutUser?.name || '',
      email: addressData.email || checkoutUser?.email || '',
      contact: checkoutUser?.phone || '',
    };
  };

  const getAddressPayload = () => {
    const contact = getCheckoutContact();

    return {
      ...addressData,
      fullName: contact.name,
      email: contact.email,
      phone: contact.contact,
    };
  };

  const getRazorpayCustomerOptions = () => ({
    prefill: getCheckoutContact(),
    remember_customer: false,
  });

  const [book, setBook] = useState<Book | null>(null);
  const [audiobook, setAudiobook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>('address');
  const [isFetchingZip, setIsFetchingZip] = useState(false);
  const [quantity, setQuantity] = useState(initialQty);
  const [subscriptionUpgradeCredit, setSubscriptionUpgradeCredit] = useState(0);
  
  const [addressData, setAddressData] = useState<AddressData>({
    fullName: '',
    email: '',
    streetAddress: '',
    zipCode: '',
    city: '',
    territory: '',
    country: 'India'
  });
  
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'other'>('other');

  // Physical formats need a delivery address; digital ones skip straight to payment
  const cartNeedsAddress =
    fromCart && cartItems.some((item) => PHYSICAL_FORMATS.includes(item.format || ''));
  const needsAddress = fromCart
    ? cartNeedsAddress
    : book
      ? selectedBookFormat
        ? PHYSICAL_FORMATS.includes(selectedBookFormat)
        : (book.format?.some(f => PHYSICAL_FORMATS.includes(f)) ?? false)
      : false;

  // Plan data for subscription checkout
  const planData = planKey ? {
    basic: { name: 'Basic Plan', price: '₹99', duration: 'per month', features: ['Access to all standard books', 'Read on any device', 'Standard support', 'No ads'] },
    premium: { name: 'Premium Plan', price: '₹249', duration: 'per 3 months', features: ['All Basic features', 'Access to Premium summaries', 'Download for offline reading', 'Priority support'] },
    pro: { name: 'Pro Plan', price: '₹499', duration: 'per year', features: ['All Premium features', 'Exclusive community access', 'Early access to new releases', 'Personalized reading plans'] },
  }[planKey] : null;

  useEffect(() => {
    if (fromCart) {
      setLoading(false);
      setCurrentStep(cartNeedsAddress ? 'address' : 'account');
    } else if (audiobookId) {
      fetchAudiobook();
    } else if (bookId) {
      fetchBook();
    } else if (planKey) {
      setLoading(false);
      setCurrentStep('account'); // subscriptions are digital, skip address
    } else {
      setLoading(false);
    }
  }, [fromCart, audiobookId, bookId, planKey, cartNeedsAddress]);

  useEffect(() => {
    const fetchUpgradeCredit = async () => {
      if (!planKey || typeof window === 'undefined') {
        setSubscriptionUpgradeCredit(0);
        return;
      }

      const token = tokenStore.getAccessToken();
      if (!token) return;

      try {
        const response = await fetch(`${API_BASE_URL}/subscriptions/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        const subscription = result?.data;
        const targetPrice = planData ? parseCurrency(planData.price) : 0;

        if (
          !subscription ||
          subscription.status !== 'active' ||
          !subscription.endDate ||
          PLAN_RANK[planKey] <= PLAN_RANK[subscription.plan]
        ) {
          setSubscriptionUpgradeCredit(0);
          return;
        }

        const now = Date.now();
        const startTime = new Date(subscription.startDate || subscription.createdAt || now).getTime();
        const endTime = new Date(subscription.endDate).getTime();
        const totalMs = Math.max(endTime - startTime, 1);
        const remainingMs = Math.max(endTime - now, 0);
        const unusedRatio = Math.min(remainingMs / totalMs, 1);
        const credit = roundMoney((Number(subscription.price) || 0) * unusedRatio);

        setSubscriptionUpgradeCredit(Math.min(credit, targetPrice));
      } catch {
        setSubscriptionUpgradeCredit(0);
      }
    };

    void fetchUpgradeCredit();
  }, [planKey, planData?.price]);

  const fetchBook = async () => {
    try {
      const response = await booksApi.getAllBooks();
      if (response.success) {
        const found = response.data.find(b => b.id === bookId || (b as any)._id === bookId);
        setBook(found || null);
        // Skip address step for digital formats (ebook, PDF, etc.)
        const isPhysical = selectedBookFormat
          ? PHYSICAL_FORMATS.includes(selectedBookFormat)
          : (found?.format?.some(f => PHYSICAL_FORMATS.includes(f)) ?? false);
        if (!isPhysical) setCurrentStep('account');
      }
    } catch (error) {
      console.error('Error fetching book for checkout:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAudiobook = async () => {
    try {
      if (!audiobookId) return;
      const response = await audiobooksApi.getById(audiobookId);
      if (response.success) {
        setAudiobook(response.data);
        setCurrentStep('account'); // audiobooks are always digital, skip address
      }
    } catch (error) {
      console.error('Error fetching audiobook for checkout:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddressData(prev => ({ ...prev, [name]: value }));
  };

  // Lookup zip code and auto-fill city, territory, country
  const handleZipCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const zipCode = e.target.value;
    setAddressData(prev => ({ ...prev, zipCode }));
    
    if (zipCode.length >= 6) {
      setIsFetchingZip(true);
      try {
        const response = await fetch(`${API_BASE_URL}/addresses/lookup/${zipCode}`);
        const data = await response.json();
        if (data.success) {
          setAddressData(prev => ({
            ...prev,
            city: data.data.city,
            territory: data.data.territory,
            country: data.data.country
          }));
        }
      } catch (error) {
        console.error('Error looking up zip code:', error);
      } finally {
        setIsFetchingZip(false);
      }
    }
  };

  const goToStep = (step: Step) => {
    setCurrentStep(step);
  };

  const nextStep = () => {
    if (currentStep === 'address') {
      // Validate address fields
      if (!addressData.fullName || !addressData.email || !addressData.streetAddress || 
          !addressData.zipCode || !addressData.city || !addressData.territory || !addressData.country) {
        alert('Please fill in all address fields');
        return;
      }
      setCurrentStep('account');
    } else if (currentStep === 'account') {
      setCurrentStep('review');
    }
  };

  const prevStep = () => {
    if (currentStep === 'account' && needsAddress) setCurrentStep('address');
    else if (currentStep === 'review') setCurrentStep('account');
  };

  const handlePaymentSubmit = async () => {
    if (!fromCart && !book && !planKey && !audiobook) return;
    if (fromCart && cartItems.length === 0) { alert('Your cart is empty'); return; }

    // Check authentication
    const token = tokenStore.getAccessToken();
    if (!token) {
      alert('Please log in to complete your purchase');
      openAuthModal('signin', `${window.location.pathname}${window.location.search}`);
      return;
    }

    setSubmitting(true);
    try {
      // ── Cart checkout ──────────────────────────────────────────────
      if (fromCart) {
        const cartTotal = cartItems.reduce((sum, c) => sum + c.price * c.quantity, 0);

        if (cartTotal <= 0) {
          // All items are free — complete order without Razorpay
          clearCart();
          setOrderSuccess(true);
          setTimeout(() => router.push('/'), 3000);
          return;
        }

        const orderResponse = await fetch(`${API_BASE_URL}/payments/create-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            paymentType: 'book_purchase',
            itemName: `Cart Order (${cartItems.length} items)`,
            amount: Math.round(cartTotal),
            cartItems: cartItems.map((item) => ({
              id: item.id,
              title: item.title,
              itemType: 'ebook',
              format: item.format,
            })),
          }),
        });

        const orderData = await orderResponse.json();
        if (!orderData.success) throw new Error(orderData.message || 'Failed to create cart order');

        if (orderData.data.isFree) {
          clearCart();
          setOrderSuccess(true);
          setTimeout(() => router.push(orderData.data.redirectTarget || '/profile?tab=library'), 3000);
          return;
        }

        const options = {
          key: orderData.data.key,
          amount: orderData.data.amount,
          currency: 'INR',
          name: 'UniqueIIT Research Center',
          description: `Cart Order (${cartItems.length} items)`,
          order_id: orderData.data.orderId,
          handler: async function (response: any) {
            const verifyResponse = await fetch(`${API_BASE_URL}/payments/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                addressData: getAddressPayload(),
              }),
            });
            const verifyData = await verifyResponse.json();
            if (verifyData.success) {
              clearCart();
              setOrderSuccess(true);
              setTimeout(() => router.push(verifyData.data?.redirectTarget || '/profile?tab=library'), 3000);
            } else {
              throw new Error('Payment verification failed');
            }
          },
          ...getRazorpayCustomerOptions(),
          theme: { color: '#f97316' },
        };

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => { const rzp = new (window as any).Razorpay(options); rzp.open(); };
        document.body.appendChild(script);
        return;
      }

      // ── Original single-item flows below ──────────────────────────
      if (isAudiobookCheckout && audiobook) {
        if (audiobookMode === 'claim') {
          const claimResponse = await audiobooksApi.claim(audiobook.slug || audiobook.id);
          if (!claimResponse.success) {
            throw new Error(claimResponse.message || 'Failed to claim audiobook');
          }

          setOrderSuccess(true);
          setTimeout(
            () =>
              router.push(
                claimResponse.data.redirectTarget ||
                  `/audiobooks/${audiobook.slug || audiobookSlug || audiobook.id}/listen`
              ),
            2000
          );
          return;
        }

        const orderResponse = await fetch(`${API_BASE_URL}/payments/create-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            paymentType: 'audiobook_purchase',
            audiobookId: audiobook.id || (audiobook as any)._id,
          })
        });

        const orderData = await orderResponse.json();
        if (!orderData.success) {
          throw new Error(orderData.message || 'Failed to create audiobook order');
        }

        const options = {
          key: orderData.data.key,
          amount: orderData.data.amount,
          currency: 'INR',
          name: 'UniqueIIT Research Center',
          description: audiobook.title || 'Audiobook Purchase',
          order_id: orderData.data.orderId,
          handler: async function (response: any) {
            const verifyResponse = await fetch(`${API_BASE_URL}/payments/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                addressData: {
                  ...getAddressPayload(),
                  streetAddress: addressData.streetAddress,
                  city: addressData.city,
                  territory: addressData.territory,
                  country: addressData.country,
                  zipCode: addressData.zipCode,
                }
              })
            });

            const verifyData = await verifyResponse.json();
            if (verifyData.success) {
              setOrderSuccess(true);
              setTimeout(
                () =>
                  router.push(
                    verifyData.data?.redirectTarget || '/profile?tab=library'
                  ),
                2000
              );
            } else {
              throw new Error('Payment verification failed');
            }
          },
          ...getRazorpayCustomerOptions(),
          theme: { color: '#6366f1' }
        };

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        };
        document.body.appendChild(script);
      } else if (type === 'subscription' && planKey) {
        // Subscription payment flow
        const orderResponse = await fetch(`${API_BASE_URL}/payments/create-order`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            paymentType: 'subscription',
            plan: planKey,
            itemName: planData?.name
          })
        });

        const orderData = await orderResponse.json();
        if (!orderData.success) {
          throw new Error(orderData.message || 'Failed to create order');
        }

        const options = {
          key: orderData.data.key,
          amount: orderData.data.amount,
          currency: 'INR',
          name: 'UniqueIIT Research Center',
          description: planData?.name || 'Subscription',
          order_id: orderData.data.orderId,
          handler: async function (response: any) {
            const verifyResponse = await fetch(`${API_BASE_URL}/payments/verify`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                addressData: {
                  ...getAddressPayload(),
                  streetAddress: addressData.streetAddress,
                  city: addressData.city,
                  territory: addressData.territory,
                  country: addressData.country,
                  zipCode: addressData.zipCode,
                }
              })
            });

            const verifyData = await verifyResponse.json();
            if (verifyData.success) {
              setOrderSuccess(true);
              setTimeout(() => router.push('/profile'), 3000);
            } else {
              throw new Error('Payment verification failed');
            }
          },
          ...getRazorpayCustomerOptions(),
          theme: { color: '#6366f1' }
        };

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        };
        document.body.appendChild(script);

      } else if (book) {
        // Book payment flow
        const checkoutFormat = getBookCheckoutFormat(book);
        const priceVal = getBookFormatPrice(book, checkoutFormat);
        const totalAmount = priceVal * quantity * (1 + (book.gst || 0) / 100);

        const orderResponse = await fetch(`${API_BASE_URL}/payments/create-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            paymentType: 'book_purchase',
            bookId: book.id || (book as any)._id,
            itemName: book.title,
            amount: Math.round(totalAmount),
            format: checkoutFormat
          })
        });

        const orderData = await orderResponse.json();
        if (!orderData.success) {
          throw new Error(orderData.message || 'Failed to create order');
        }

        // Free book — no Razorpay needed
        if (orderData.data.isFree) {
          setOrderSuccess(true);
          setTimeout(() => router.push(orderData.data.redirectTarget || `/books/${book.slug || book.id}/read`), 3000);
          return;
        }

        const options = {
          key: orderData.data.key,
          amount: orderData.data.amount,
          currency: 'INR',
          name: 'UniqueIIT Research Center',
          description: book?.title || 'Book Purchase',
          order_id: orderData.data.orderId,
          handler: async function (response: any) {
            const verifyResponse = await fetch(`${API_BASE_URL}/payments/verify`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                bookId: book.id || (book as any)._id,
                quantity,
                customerName: getCheckoutContact().name,
                customerEmail: getCheckoutContact().email,
                addressData: {
                  ...getAddressPayload(),
                  streetAddress: addressData.streetAddress,
                  city: addressData.city,
                  territory: addressData.territory,
                  country: addressData.country,
                  zipCode: addressData.zipCode,
                }
              })
            });

            const verifyData = await verifyResponse.json();
            if (verifyData.success) {
              setOrderSuccess(true);
              setTimeout(() => router.push(verifyData.data?.redirectTarget || '/profile?tab=library'), 3000);
            } else {
              throw new Error('Payment verification failed');
            }
          },
          ...getRazorpayCustomerOptions(),
          theme: { color: '#6366f1' }
        };

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        };
        document.body.appendChild(script);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      alert(error.message || 'Failed to initiate payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitOrder = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    await handlePaymentSubmit();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!fromCart && !book && !audiobook && !planData && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">No item selected for checkout</h2>
        <Link href="/" className="text-indigo-600 hover:text-indigo-700 flex items-center gap-2">
          <ArrowLeftIcon className="w-5 h-5" /> Back to Store
        </Link>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircleIcon className="w-12 h-12 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {planData
            ? 'Subscription Activated!'
            : isAudiobookCheckout
              ? audiobookMode === 'claim'
                ? 'Audiobook Claimed!'
                : 'Audiobook Purchased!'
              : 'Order Confirmed!'}
        </h1>
        <p className="text-gray-600 max-w-md mb-8">
          {planData
            ? `Thank you for subscribing to ${planData.name}. Your subscription is now active.`
            : isAudiobookCheckout
              ? `Access for "${audiobook?.title}" is ready. Redirecting you to the listening page.`
              : `Thank you for your purchase. Your order for "${book?.title}" has been placed successfully.`
          }
        </p>
        <div className="animate-pulse text-indigo-600 text-sm">
          Redirecting to {planData ? 'profile' : isAudiobookCheckout ? 'listening page' : 'homepage'}...
        </div>
        <Link
          href={
            planData
              ? '/profile'
              : isAudiobookCheckout
                ? `/audiobooks/${audiobook?.slug || audiobookSlug || audiobook?.id}/listen`
                : '/'
          }
          className="mt-8 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Go Back Now
        </Link>
      </div>
    );
  }

  // Calculate prices based on whether it's a book or subscription
  let priceVal = 0;
  let subtotal = 0;
  let gstPercentage = 0;
  let gstAmount = 0;
  let totalAmount = 0;
  let displayPrice = '₹0.00';

  if (fromCart) {
    totalAmount = cartItems.reduce((sum, c) => sum + c.price * c.quantity, 0);
    subtotal = totalAmount;
    displayPrice = `₹${totalAmount.toFixed(2)}`;
  } else if (book) {
    priceVal = parseFloat(book.price.replace(/[₹$]/g, ''));
    subtotal = priceVal * quantity;
    gstPercentage = book.gst || 0;
    gstAmount = subtotal * (gstPercentage / 100);
    totalAmount = subtotal + gstAmount;
    displayPrice = `₹${priceVal.toFixed(2)}`;
  } else if (planData) {
    priceVal = parseFloat(planData.price.replace(/[^0-9.]/g, ''));
    subtotal = priceVal;
    gstPercentage = 0;
    gstAmount = 0;
    totalAmount = Math.max(roundMoney(subtotal - subscriptionUpgradeCredit), 0);
    displayPrice = `₹${priceVal.toFixed(2)}`;
  } else if (audiobook) {
    priceVal = parseFloat(audiobook.price.replace(/[^0-9.]/g, ''));
    subtotal = audiobookMode === 'claim' ? 0 : priceVal;
    gstPercentage = 0;
    gstAmount = 0;
    totalAmount = subtotal;
    displayPrice = audiobookMode === 'claim' ? '₹0.00' : `₹${priceVal.toFixed(2)}`;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50 text-gray-800 font-dm-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Navigation */}
        <button
          onClick={() => fromCart ? router.push('/cart') : router.back()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 rounded-xl text-gray-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-blue-50 shadow-sm transition-all mb-10 group"
        >
          <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm font-medium">
            {fromCart ? 'Back to Cart' : `Back to ${isAudiobookCheckout ? 'audiobook' : 'book'} details`}
          </span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Form Section */}
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Checkout</h1>
              <p className="text-gray-500">Complete your purchase by providing your details below.</p>
            </div>

            <form onSubmit={handleSubmitOrder} className="space-y-6">
              {/* Stepper */}
              <div className="flex items-center w-full mb-8">
                {[
                  ...(needsAddress ? [{ key: 'address', label: 'Address Details', icon: MapPinIcon }] : []),
                  { key: 'account', label: isAudiobookCheckout && audiobookMode === 'claim' ? 'Claim Access' : 'Payment Method', icon: UserIcon },
                  { key: 'review', label: 'Review', icon: EyeIcon }
                ].map((step, index, arr) => (
                  <div
                    key={step.key}
                    className={`flex items-center min-w-0 ${index < arr.length - 1 ? 'flex-1' : 'flex-none'}`}
                  >
                    <button
                      type="button"
                      onClick={() => goToStep(step.key as Step)}
                      className={`flex shrink-0 items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all ${
                        currentStep === step.key
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                          : 'bg-white border border-blue-200 text-gray-500 hover:bg-blue-50 hover:border-indigo-300'
                      }`}
                    >
                      <step.icon className="w-4 h-4" />
                      <span className="text-sm font-medium hidden sm:block whitespace-nowrap">{step.label}</span>
                    </button>
                    {index < arr.length - 1 && (
                      <div className="flex-1 min-w-3 h-px bg-blue-200 mx-2" />
                    )}
                  </div>
                ))}
              </div>

              {/* Address Details Step — only for physical (Hardcover/Paperback) books */}
              {currentStep === 'address' && needsAddress && (
                <div className="bg-white border border-blue-100 rounded-2xl p-6 space-y-4 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                    <MapPinIcon className="w-5 h-5 text-indigo-500" />
                    Address Details
                  </h3>

                  <div className="space-y-2">
                    <label htmlFor="fullName" className="text-sm font-medium text-gray-600">Full Name *</label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={addressData.fullName}
                      onChange={handleAddressChange}
                      required
                      className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 transition-all"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-gray-600">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={addressData.email}
                      onChange={handleAddressChange}
                      required
                      className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 transition-all"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="streetAddress" className="text-sm font-medium text-gray-600">Street Address *</label>
                    <input
                      type="text"
                      id="streetAddress"
                      name="streetAddress"
                      value={addressData.streetAddress}
                      onChange={handleAddressChange}
                      required
                      className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 transition-all"
                      placeholder="Enter your street address"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="zipCode" className="text-sm font-medium text-gray-600">Zip/Postal Code *</label>
                      <div className="relative">
                        <input
                          type="text"
                          id="zipCode"
                          name="zipCode"
                          value={addressData.zipCode}
                          onChange={handleZipCodeChange}
                          required
                          maxLength={6}
                          className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 transition-all"
                          placeholder="e.g., 110001"
                        />
                        {isFetchingZip && (
                          <ArrowPathIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500 animate-spin" />
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="city" className="text-sm font-medium text-gray-600">City *</label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={addressData.city}
                        onChange={handleAddressChange}
                        required
                        className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 transition-all"
                        placeholder="Auto-filled from zip"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="territory" className="text-sm font-medium text-gray-600">Territory/State *</label>
                      <input
                        type="text"
                        id="territory"
                        name="territory"
                        value={addressData.territory}
                        onChange={handleAddressChange}
                        required
                        className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 transition-all"
                        placeholder="Auto-filled from zip"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="country" className="text-sm font-medium text-gray-600">Country *</label>
                      <input
                        type="text"
                        id="country"
                        name="country"
                        value={addressData.country}
                        onChange={handleAddressChange}
                        required
                        className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 transition-all"
                        placeholder="Auto-filled from zip"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={nextStep}
                    className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
                  >
                    Continue to Payment
                  </button>
                </div>
              )}

              {/* Account Step - Payment Method */}
              {currentStep === 'account' && (
                <div className="bg-white border border-blue-100 rounded-2xl p-6 space-y-4 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                    <UserIcon className="w-5 h-5 text-indigo-500" />
                    {isAudiobookCheckout && audiobookMode === 'claim' ? 'Claim Access' : 'Payment Method'}
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    {/* UPI Card */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
                        paymentMethod === 'upi'
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-blue-100 hover:border-indigo-300 hover:bg-blue-50'
                      }`}
                    >
                      <span className="text-3xl">📱</span>
                      <span className="font-semibold text-gray-800">UPI</span>
                      <span className="text-xs text-gray-500">Google Pay, PhonePe, Paytm</span>
                    </button>

                    {/* Other Methods Card */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('other')}
                      className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
                        paymentMethod === 'other'
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-blue-100 hover:border-indigo-300 hover:bg-blue-50'
                      }`}
                    >
                      <span className="text-3xl">💳</span>
                      <span className="font-semibold text-gray-800">Card/Net Banking</span>
                      <span className="text-xs text-gray-500">Razorpay</span>
                    </button>
                  </div>

                  <div className="flex gap-3 pt-4">
                    {needsAddress && (
                      <button
                        type="button"
                        onClick={prevStep}
                        className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-200 transition-all"
                      >
                        Back
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={nextStep}
                      className="flex-1 bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
                    >
                      Review Order
                    </button>
                  </div>
                </div>
              )}

              {/* Review Step */}
              {currentStep === 'review' && (
                <div className="bg-white border border-blue-100 rounded-2xl p-6 space-y-4 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                    <EyeIcon className="w-5 h-5 text-indigo-500" />
                    Review Order
                  </h3>

                  <div className="space-y-4">
                    {needsAddress && (
                      <div className="bg-blue-50 rounded-xl p-4">
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Delivery Address</h4>
                        <p className="text-gray-800 font-medium">{addressData.fullName}</p>
                        <p className="text-gray-600 text-sm">{addressData.streetAddress}</p>
                        <p className="text-gray-600 text-sm">{addressData.city}, {addressData.territory} - {addressData.zipCode}</p>
                        <p className="text-gray-600 text-sm">{addressData.country}</p>
                        <p className="text-gray-600 text-sm mt-1">{addressData.email}</p>
                      </div>
                    )}

                    <div className="bg-blue-50 rounded-xl p-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">
                        {isAudiobookCheckout && audiobookMode === 'claim' ? 'Claim Mode' : 'Payment Method'}
                      </h4>
                      <p className="text-gray-800">
                        {isAudiobookCheckout && audiobookMode === 'claim'
                          ? 'Free access claim. No gateway payment required.'
                          : paymentMethod === 'upi'
                            ? '📱 UPI (Google Pay, PhonePe, Paytm)'
                            : '💳 Card/Net Banking via Razorpay'}
                      </p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <p className="text-sm text-amber-700 leading-relaxed">
                        <strong>{isAudiobookCheckout && audiobookMode === 'claim' ? 'Claim Flow:' : 'Demo Mode:'}</strong>{' '}
                        {isAudiobookCheckout && audiobookMode === 'claim'
                          ? 'This free audiobook will be claimed instantly after review and then opened in the listening page.'
                          : 'Payment integration is currently in sandbox. Razorpay checkout will appear when you place the order.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-200 transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold py-3 rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {submitting ? (
                        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <ShoppingBagIcon className="w-5 h-5" />
                          {isAudiobookCheckout && audiobookMode === 'claim'
                            ? 'Claim Free Access'
                            : `Place Order (${planData ? displayPrice : `₹${totalAmount.toFixed(2)}`})`}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Summary Section */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="bg-white border border-blue-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-indigo-50 to-blue-50">
                <h3 className="text-xl font-bold text-gray-800">Order Summary</h3>
              </div>

              <div className="p-6 space-y-6">
                {fromCart ? (
                  // Cart Summary
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {cartItems.map(item => {
                      const displayFormat = item.format || 'E-book';

                      return (
                      <div key={`${item.id}:${item.format || 'default'}`} className="flex gap-3 items-center">
                        <div className="relative w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-blue-50 border border-blue-100">
                          <Image src={item.image || ''} alt={item.title} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-800 text-sm font-semibold leading-snug line-clamp-1">{item.title}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span className="text-gray-500">Qty: {item.quantity}</span>
                            <span className="rounded-full bg-orange-50 px-2 py-0.5 font-medium text-orange-700">
                              Format: {displayFormat}
                            </span>
                            {/* {item.language && (
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                                Language: {item.language}
                              </span>
                            )} */}
                          </div>
                        </div>
                        <span className="text-indigo-600 font-bold text-sm flex-shrink-0">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    );
                    })}
                  </div>
                ) : book ? (
                  // Book Summary
                  <div className="flex gap-4">
                    <div className="relative w-24 h-32 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                      <Image
                        src={book.image || ''}
                        alt={book.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-grow flex flex-col justify-between py-1">
                      <div>
                        <h4 className="font-bold text-gray-800 leading-tight mb-1">{book.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider font-semibold">
                          <BookOpenIcon className="w-3.5 h-3.5 text-indigo-500" />
                          {book.category}
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-indigo-600 font-bold">{displayPrice}</div>
                        <div className="flex items-center border border-blue-200 rounded-lg overflow-hidden bg-white">
                          <button
                            type="button"
                            onClick={() => setQuantity(current => Math.max(1, current - 1))}
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            disabled={quantity <= 1}
                            aria-label="Decrease quantity"
                          >
                            <MinusIcon className="w-4 h-4" />
                          </button>
                          <span className="w-9 text-center text-sm font-semibold text-gray-800">{quantity}</span>
                          <button
                            type="button"
                            onClick={() => setQuantity(current => current + 1)}
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-blue-50"
                            aria-label="Increase quantity"
                          >
                            <PlusIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : audiobook ? (
                  <div className="flex gap-4">
                    <div className="relative w-24 h-32 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                      <Image
                        src={audiobook.image || ''}
                        alt={audiobook.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-grow flex flex-col justify-between py-1">
                      <div>
                        <h4 className="font-bold text-gray-800 leading-tight mb-1">{audiobook.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider font-semibold">
                          <BookOpenIcon className="w-3.5 h-3.5 text-indigo-500" />
                          Audiobook
                        </div>
                      </div>
                      <div className="text-indigo-600 font-bold">
                        {displayPrice}
                      </div>
                    </div>
                  </div>
                ) : planData ? (
                  // Subscription Summary
                  <div className="flex gap-4">
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 shadow-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                      <span className="text-3xl">📚</span>
                    </div>
                    <div className="flex-grow flex flex-col justify-between py-1">
                      <div>
                        <h4 className="font-bold text-gray-800 leading-tight mb-1">{planData.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider font-semibold">
                          <CheckCircleIcon className="w-3.5 h-3.5 text-green-500" />
                          Subscription Plan
                        </div>
                      </div>
                      <div className="text-indigo-600 font-bold">{planData.price} <span className="text-sm text-gray-500">{planData.duration}</span></div>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-4 pt-4 border-t border-blue-100">
                  <div className="flex justify-between text-gray-600">
                    <span>Price</span>
                    <span>
                      {fromCart
                        ? displayPrice
                        : book
                          ? displayPrice
                          : audiobook
                          ? audiobookMode === 'claim'
                            ? '₹0.00'
                            : displayPrice
                          : planData
                            ? planData.price
                            : '-'}
                    </span>
                  </div>
                  {planData && subscriptionUpgradeCredit > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Upgrade credit</span>
                      <span>- ₹{subscriptionUpgradeCredit.toFixed(2)}</span>
                    </div>
                  )}
                  {book && (
                    <div className="flex justify-between text-gray-600">
                      <span>Quantity</span>
                      <span>x{quantity}</span>
                    </div>
                  )}
                  {gstPercentage > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>GST ({gstPercentage}%)</span>
                      <span>₹{gstAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Service Fee</span>
                    <span className="text-green-600 font-medium">FREE</span>
                  </div>
                  <div className="flex justify-between text-gray-800 text-xl font-bold pt-4 border-t border-blue-100">
                    <span>Total</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                      ₹{totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-blue-50/60 border-t border-blue-100">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  </div>
                  <span>Secure checkout with 128-bit encryption</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
