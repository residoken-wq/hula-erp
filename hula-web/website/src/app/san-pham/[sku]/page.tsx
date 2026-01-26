import { getProductBySku } from '@/lib/api';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';

export default async function ProductDetailPage({ params }: { params: { sku: string } }) {
    const product = await getProductBySku(params.sku);

    if (!product || product.error) {
        notFound();
    }

    return <ProductDetailClient product={product} />;
}
