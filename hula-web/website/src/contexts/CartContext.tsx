'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
export interface CartItem {
    instanceId: string; // Unique ID for this item instance (handles variants)
    id: number;
    sku: string;
    name: string;
    price: number;
    quantity: number;
    image_url?: string;
    customization?: any;
}

interface CartContextType {
    items: CartItem[];
    itemCount: number;
    total: number;
    addToCart: (product: { id: number; sku: string; name: string; base_price: number; image_url?: string; customization?: any; quantity?: number }) => void;
    removeFromCart: (instanceId: string) => void;
    updateQuantity: (instanceId: string, quantity: number) => void;
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
                const parsed = JSON.parse(stored);
                // Migration: Ensure all items have instanceId
                const migrated = parsed.map((item: any) => ({
                    ...item,
                    instanceId: item.instanceId || `${item.sku}-${Date.now()}-${Math.random()}`
                }));
                setItems(migrated);
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
    const addToCart = (product: { id: number; sku: string; name: string; base_price: number; image_url?: string; customization?: any; quantity?: number }) => {
        setItems(prev => {
            // If has customization, always add new item. 
            // If no customization, try to find existing matching SKU without customization.

            const isCustom = !!product.customization;
            const qty = product.quantity || 1;

            if (!isCustom) {
                const existingIndex = prev.findIndex(item => item.sku === product.sku && !item.customization);
                if (existingIndex > -1) {
                    const newItems = [...prev];
                    newItems[existingIndex].quantity += qty;
                    return newItems;
                }
            }

            // Add new item
            return [...prev, {
                instanceId: `${product.sku}-${Date.now()}`,
                id: product.id,
                sku: product.sku,
                name: product.name,
                price: product.base_price,
                quantity: qty,
                image_url: product.image_url,
                customization: product.customization
            }];
        });
        setIsCartOpen(true); // Open cart drawer when adding
    };

    // Remove product from cart
    const removeFromCart = (instanceId: string) => {
        setItems(prev => prev.filter(item => item.instanceId !== instanceId));
    };

    // Update quantity
    const updateQuantity = (instanceId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(instanceId);
            return;
        }
        setItems(prev =>
            prev.map(item =>
                item.instanceId === instanceId ? { ...item, quantity } : item
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
