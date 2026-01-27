import { getProductBySku } from '@/lib/api';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({ params }: { params: Promise<{ sku: string }> }) {
    const resolvedParams = await params;

    let product;
    try {
        product = await getProductBySku(resolvedParams.sku);
    } catch (error) {
        console.error('Error fetching product:', error);
        notFound();
    }

    if (!product || product.error) {
        notFound();
    }

    return <ProductDetailClient product={product} />;
}
