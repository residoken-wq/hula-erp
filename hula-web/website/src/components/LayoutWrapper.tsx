'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import { CartProvider } from '@/contexts/CartContext';
import { SettingsProvider } from '@/contexts/SettingsContext';

// Pages where Header and Footer should be hidden
const STANDALONE_PAGES = ['/coming-soon', '/maintenance'];

export default function LayoutWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isStandalonePage = STANDALONE_PAGES.some(page => pathname?.startsWith(page));

    if (isStandalonePage) {
        return <>{children}</>;
    }

    return (
        <SettingsProvider>
            <CartProvider>
                <Header />
                <main className="flex-1">
                    {children}
                </main>
                <Footer />
                <CartDrawer />
            </CartProvider>
        </SettingsProvider>
    );
}
