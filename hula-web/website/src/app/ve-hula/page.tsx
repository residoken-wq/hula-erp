import { getAboutConfig } from '@/lib/api';
import { BlockRenderer } from '@/components/BlockRenderer';

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
    const config = await getAboutConfig() || {};
    
    // Safely parse blocks
    const blocks = Array.isArray(config.about_page_blocks) ? config.about_page_blocks : [];

    return (
        <div className="bg-white min-h-screen">
            {blocks.length > 0 ? (
                <BlockRenderer blocks={blocks} />
            ) : (
                <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">Trang Về Hula đang được cập nhật</h1>
                    <p className="text-gray-500">Nội dung trang này đang được xây dựng lại thông qua CMS Block Builder.</p>
                </div>
            )}
        </div>
    );
}
