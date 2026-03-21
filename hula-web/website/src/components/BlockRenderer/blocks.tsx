import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

// === Block Components === //

export const RichTextBlock = ({ data }: { data: any }) => {
    return (
        <div className="container mx-auto px-4 py-8">
            <div 
                className="prose max-w-none text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: data.content || '' }}
            />
        </div>
    );
};

export const HeroBannerBlock = ({ data }: { data: any }) => {
    return (
        <section className="relative w-full h-[600px] flex items-center justify-center bg-gray-900 text-white overflow-hidden">
            {data.image_url && (
                <div className="absolute inset-0 z-0">
                    <img 
                        src={data.image_url} 
                        alt={data.title || "Hero banner"} 
                        className="w-full h-full object-cover opacity-60"
                        loading="lazy"
                    />
                </div>
            )}
            <div className="relative z-10 text-center px-4 max-w-4xl">
                {data.title && <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight text-white drop-shadow-lg">{data.title}</h1>}
                {data.description && <p className="text-lg md:text-xl text-gray-100 opacity-90 leading-relaxed drop-shadow-md">{data.description}</p>}
            </div>
        </section>
    );
};

export const ImageGalleryBlock = ({ data }: { data: any }) => {
    const images = data.images || [];
    if (!images.length) return null;

    return (
        <section className="container mx-auto px-4 py-16">
            {data.title && <h2 className="text-3xl font-bold text-center mb-12 text-[#2C3E50]">{data.title}</h2>}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {images.map((url: string, idx: number) => (
                    <div key={idx} className="relative aspect-[4/3] rounded-2xl overflow-hidden group shadow-lg">
                        <img 
                            src={url} 
                            alt={`Gallery image ${idx + 1}`} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                ))}
            </div>
        </section>
    );
};

export const TwoColumnBlock = ({ data }: { data: any }) => {
    const isImageLeft = data.imagePosition === 'left';
    
    return (
        <section className="container mx-auto px-4 py-16">
            <div className={`flex flex-col md:flex-row items-center gap-12 ${isImageLeft ? 'md:flex-row-reverse' : ''}`}>
                <div className="flex-1 w-full space-y-6">
                    {data.title && <h2 className="text-3xl md:text-4xl font-bold text-[#2C3E50] leading-tight">{data.title}</h2>}
                    {data.content && (
                        <div 
                            className="prose prose-lg text-gray-600"
                            dangerouslySetInnerHTML={{ __html: data.content }}
                        />
                    )}
                </div>
                {data.image_url && (
                    <div className="flex-1 w-full relative">
                        <img 
                            src={data.image_url} 
                            alt={data.title || "Image"} 
                            className="w-full rounded-3xl shadow-2xl object-cover aspect-[4/3] hover:shadow-3xl transition-shadow duration-300"
                            loading="lazy"
                        />
                        <div className="absolute -z-10 bg-blue-50 w-full h-full rounded-3xl top-6 -right-6 md:top-8 md:-right-8" />
                    </div>
                )}
            </div>
        </section>
    );
};

export const StatsGridBlock = ({ data }: { data: any }) => {
    const items = data.items || [];
    if (!items.length) return null;

    return (
        <section className="bg-gradient-to-br from-[#f8fcfd] to-[#e6f4f8] py-20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-100 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="container mx-auto px-4 relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {items.map((item: any, idx: number) => (
                        <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 text-center flex flex-col items-center justify-center transform hover:-translate-y-2 border border-blue-50">
                            <div className="text-5xl mb-4 opacity-90">{item.icon}</div>
                            <div className="text-4xl font-black text-[#1D9ED9] mb-2">{item.number}</div>
                            <div className="text-gray-500 font-medium text-sm uppercase tracking-wider">{item.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export const VideoEmbedBlock = ({ data }: { data: any }) => {
    if (!data.video_url) return null;
    
    // Extract video ID safely
    const extractYoutubeId = (url: string) => {
        try {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
            const match = url.match(regExp);
            return (match && match[2].length === 11) ? match[2] : null;
        } catch {
            return null;
        }
    };
    
    const videoId = extractYoutubeId(data.video_url);

    return (
        <section className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
                <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl bg-gray-100 ring-1 ring-black/5">
                    {videoId ? (
                        <iframe
                            className="absolute top-0 left-0 w-full h-full"
                            src={`https://www.youtube.com/embed/${videoId}`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            Invalid Video URL
                        </div>
                    )}
                </div>
                {data.caption && <p className="text-center mt-6 text-gray-500 text-lg italic">{data.caption}</p>}
            </div>
        </section>
    );
};

export const CallToActionBlock = ({ data }: { data: any }) => {
    return (
        <section className="container mx-auto px-4 py-20">
            <div className="bg-[#1D9ED9] rounded-[40px] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-xl">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>

                <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
                    {data.title && <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white leading-tight">{data.title}</h2>}
                    {data.description && <p className="text-xl opacity-90 mb-10 text-blue-50">{data.description}</p>}
                    
                    {data.buttonText && data.buttonUrl && (
                        <Link href={data.buttonUrl}>
                            <button className="bg-white text-[#1D9ED9] hover:bg-gray-50 font-bold py-4 px-10 rounded-full text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                                {data.buttonText}
                            </button>
                        </Link>
                    )}
                </div>
            </div>
        </section>
    );
};

export const TeamMembersBlock = ({ data }: { data: any }) => {
    const members = data.members || [];
    if (!members.length) return null;

    return (
        <section className="bg-white py-20">
            <div className="container mx-auto px-4">
                {data.title && <h2 className="text-4xl font-bold text-center mb-16 text-[#2C3E50] relative inline-block left-1/2 -translate-x-1/2">
                    {data.title}
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-1.5 bg-[#1D9ED9] rounded-full"></div>
                </h2>}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {members.map((member: any, idx: number) => (
                        <div key={idx} className="group text-center">
                            <div className="relative w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden border-4 border-white shadow-xl group-hover:shadow-2xl transition-shadow duration-300 bg-gray-100">
                                <img 
                                    src={member.image_url} 
                                    alt={member.name} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    loading="lazy"
                                />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-1">{member.name}</h3>
                            <p className="text-[#1D9ED9] font-medium">{member.role}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export const RelatedProductsBlock = ({ data }: { data: any }) => {
    // In a real scenario, this would fetch from an API or use passed context. 
    // Here we'll just render a placeholder or a static message.
    return (
        <section className="container mx-auto px-4 py-16 text-center border-t border-gray-100 mt-12 block-related-products-placeholder">
            {data.title && <h3 className="text-2xl font-bold text-gray-800 mb-8">{data.title}</h3>}
            <div className="bg-gray-50 p-8 rounded-2xl flex items-center justify-center text-gray-500 italic">
                (Khu vực hiển thị tự động các sản phẩm liên quan từ hệ thống)
            </div>
        </section>
    );
};
