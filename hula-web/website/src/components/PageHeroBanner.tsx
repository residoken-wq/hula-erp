import { resolveImageUrl } from '@/lib/utils';

interface PageHeroBannerProps {
    title: string;
    description?: string;
    backgroundImage?: string;
    /** Black overlay opacity 0-100, default 40 (same as homepage HeroCarousel) */
    maskOpacity?: number;
    /** Compact mode for pages with their own layout (e.g. wizard) */
    compact?: boolean;
}

export default function PageHeroBanner({
    title,
    description,
    backgroundImage,
    maskOpacity = 40,
    compact = false,
}: PageHeroBannerProps) {
    const bgUrl = backgroundImage ? resolveImageUrl(backgroundImage) : '';
    const hasImage = !!bgUrl;

    return (
        <section
            className={`relative overflow-hidden text-white ${compact ? 'py-12 lg:py-16' : 'py-16 lg:py-24'}`}
            style={
                hasImage
                    ? { backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : undefined
            }
        >
            {/* Overlay */}
            <div
                className="absolute inset-0"
                style={
                    hasImage
                        ? { backgroundColor: `rgba(0, 0, 0, ${(maskOpacity || 0) / 100})` }
                        : { background: 'linear-gradient(135deg, var(--color-primary-600) 0%, var(--color-primary-800) 100%)' }
                }
            />

            {/* Pattern decoration (gradient mode only) */}
            {!hasImage && (
                <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10" />
            )}

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
                <h1 className={`font-heading font-bold ${compact ? 'text-3xl lg:text-4xl mb-3' : 'text-4xl lg:text-5xl mb-6'}`}>
                    {title}
                </h1>
                {description && (
                    <p className={`text-white/80 max-w-2xl mx-auto leading-relaxed ${compact ? 'text-base' : 'text-lg'}`}>
                        {description}
                    </p>
                )}
            </div>
        </section>
    );
}
