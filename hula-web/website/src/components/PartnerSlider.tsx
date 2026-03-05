'use client';

import { getGoogleDriveImageUrl } from '@/lib/utils';

interface PartnerSliderProps {
    partners?: Array<{
        name: string;
        logo_url?: string;
    }>;
}

const defaultPartners = [
    { name: 'Đối tác 1', logo_url: '' },
    { name: 'Đối tác 2', logo_url: '' },
    { name: 'Đối tác 3', logo_url: '' },
    { name: 'Đối tác 4', logo_url: '' },
    { name: 'Đối tác 5', logo_url: '' },
    { name: 'Đối tác 6', logo_url: '' },
];

export default function PartnerSlider({ partners }: PartnerSliderProps) {
    const items = (partners && partners.length > 0) ? partners : defaultPartners;
    // Duplicate for infinite scroll effect
    const scrollItems = [...items, ...items];

    return (
        <section className="py-16 lg:py-20 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
                <h2 className="text-3xl lg:text-4xl font-heading font-bold text-gray-900 text-center">
                    Đối Tác Tin Tưởng
                </h2>
            </div>

            <div className="relative">
                <div className="flex animate-scroll-left" style={{ width: `${scrollItems.length * 200}px` }}>
                    {scrollItems.map((partner: any, index: number) => (
                        <div
                            key={index}
                            className="flex-shrink-0 w-[180px] h-[80px] mx-3 bg-gray-50 rounded-[12px] flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                            {partner.logo_url ? (
                                <img
                                    src={getGoogleDriveImageUrl(partner.logo_url)}
                                    alt={partner.name}
                                    className="max-h-[50px] max-w-[150px] object-contain opacity-60 hover:opacity-100 transition-opacity"
                                />
                            ) : (
                                <span className="text-gray-400 font-medium text-sm">{partner.name}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
