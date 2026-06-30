'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface CartItem {
  id: string;
  title: string;
  author: string;
  price: number;
  originalPrice?: number;
  image: string;
  slug: string;
  quantity: number;
  category: string;
  format?: string;
  language?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>, qty?: number) => 'added' | 'updated';
  removeFromCart: (id: string, format?: string) => void;
  updateQuantity: (id: string, quantity: number, format?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  totalSavings: number;
  isInCart: (id: string, format?: string) => boolean;
  getItemQty: (id: string, format?: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'ebook_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCartItems(JSON.parse(raw));
    } catch {
      // ignore malformed storage
    }
    setHydrated(true);
  }, []);

  // Persist to localStorage whenever cart changes (after hydration)
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
    }
  }, [cartItems, hydrated]);

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>, qty = 1): 'added' | 'updated' => {
    let result: 'added' | 'updated' = 'added';
    setCartItems(prev => {
      const existing = prev.find(c => c.id === item.id && c.format === item.format);
      if (existing) {
        result = 'updated';
        return prev.map(c =>
          c.id === item.id && c.format === item.format
            ? { ...c, quantity: c.quantity + qty }
            : c
        );
      }
      return [...prev, { ...item, quantity: qty }];
    });
    return result;
  }, []);

  const removeFromCart = useCallback((id: string, format?: string) => {
    setCartItems(prev => prev.filter(c => !(c.id === id && c.format === format)));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number, format?: string) => {
    if (quantity < 1) return;
    setCartItems(prev => prev.map(c =>
      c.id === id && c.format === format ? { ...c, quantity } : c
    ));
  }, []);

  const clearCart = useCallback(() => setCartItems([]), []);

  const totalItems = cartItems.reduce((sum, c) => sum + c.quantity, 0);
  const totalPrice = cartItems.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const totalSavings = cartItems.reduce((sum, c) => {
    if (c.originalPrice && c.originalPrice > c.price) {
      return sum + (c.originalPrice - c.price) * c.quantity;
    }
    return sum;
  }, 0);

  const isInCart = useCallback(
    (id: string, format?: string) =>
      cartItems.some(c => c.id === id && (format === undefined || c.format === format)),
    [cartItems]
  );
  const getItemQty = useCallback(
    (id: string, format?: string) =>
      cartItems.find(c => c.id === id && (format === undefined || c.format === format))?.quantity ?? 0,
    [cartItems]
  );

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
      totalSavings,
      isInCart,
      getItemQty,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
