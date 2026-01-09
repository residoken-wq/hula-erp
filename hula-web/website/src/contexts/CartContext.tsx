'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
export interface CartItem {
    id: number;
    sku: string;
    name: string;
    price: number;
    quantity: number;
    image_url?: string;
}

interface CartContextType {
    items: CartItem[];
    itemCount: number;
    total: number;
    addToCart: (product: { id: number; sku: string; name: string; base_price: number; image_url?: string }) => void;
    removeFromCart: (sku: string) => void;
    updateQuantity: (sku: string, quantity: number) => void;
    clearCart: () => void;
    isCartOpen: boolean;
    setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'hula_cart';

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load cart from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(CART_STORAGE_KEY);
            if (stored) {
                setItems(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Failed to load cart from localStorage:', error);
        }
        setIsLoaded(true);
    }, []);

    // Save cart to localStorage whenever items change
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
        }
    }, [items, isLoaded]);

    // Calculate totals
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Add product to cart
    const addToCart = (product: { id: number; sku: string; name: string; base_price: number; image_url?: string }) => {
        setItems(prev => {
            const existing = prev.find(item => item.sku === product.sku);
            if (existing) {
                return prev.map(item =>
                    item.sku === product.sku
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, {
                id: product.id,
                sku: product.sku,
                name: product.name,
                price: product.base_price,
                quantity: 1,
                image_url: product.image_url
            }];
        });
        setIsCartOpen(true); // Open cart drawer when adding
    };

    // Remove product from cart
    const removeFromCart = (sku: string) => {
        setItems(prev => prev.filter(item => item.sku !== sku));
    };

    // Update quantity
    const updateQuantity = (sku: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(sku);
            return;
        }
        setItems(prev =>
            prev.map(item =>
                item.sku === sku ? { ...item, quantity } : item
            )
        );
    };

    // Clear cart
    const clearCart = () => {
        setItems([]);
    };

    return (
        <CartContext.Provider
            value={{
                items,
                itemCount,
                total,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                isCartOpen,
                setIsCartOpen
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

// Custom hook to use cart
export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
