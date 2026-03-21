import React from 'react';
import {
    RichTextBlock,
    HeroBannerBlock,
    ImageGalleryBlock,
    TwoColumnBlock,
    StatsGridBlock,
    VideoEmbedBlock,
    CallToActionBlock,
    TeamMembersBlock,
    RelatedProductsBlock
} from './blocks';

export interface BlockData {
    id: string;
    type: string;
    data: any;
}

interface BlockRendererProps {
    blocks?: BlockData[];
    fallbackContent?: string;
}

/**
 * A generic renderer that takes an array of blocks from the CMS and maps them
 * to the corresponding React components.
 * 
 * Includes fallback logic: if `blocks` is empty but `fallbackContent` is provided,
 * it will render the fallback HTML. This is useful for backwards compatibility.
 */
export default function BlockRenderer({ blocks = [], fallbackContent }: BlockRendererProps) {
    // Determine if we should render blocks or fallback content
    const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0;

    if (!hasBlocks) {
        if (fallbackContent) {
            return (
                <div className="container mx-auto px-4 py-8">
                    <div 
                        className="prose max-w-none text-gray-700 leading-relaxed custom-html-content"
                        dangerouslySetInnerHTML={{ __html: fallbackContent }}
                    />
                </div>
            );
        }
        return null;
    }

    return (
        <div className="flex flex-col w-full hula-block-renderer">
            {blocks.map((block) => {
                switch (block.type) {
                    case 'RICH_TEXT':
                        return <RichTextBlock key={block.id} data={block.data} />;
                    case 'HERO_BANNER':
                        return <HeroBannerBlock key={block.id} data={block.data} />;
                    case 'IMAGE_GALLERY':
                        return <ImageGalleryBlock key={block.id} data={block.data} />;
                    case 'TWO_COLUMN_TEXT_IMAGE':
                        return <TwoColumnBlock key={block.id} data={block.data} />;
                    case 'STATS_GRID':
                        return <StatsGridBlock key={block.id} data={block.data} />;
                    case 'VIDEO_EMBED':
                        return <VideoEmbedBlock key={block.id} data={block.data} />;
                    case 'CALL_TO_ACTION':
                        return <CallToActionBlock key={block.id} data={block.data} />;
                    case 'TEAM_MEMBERS':
                        return <TeamMembersBlock key={block.id} data={block.data} />;
                    case 'RELATED_PRODUCTS':
                        return <RelatedProductsBlock key={block.id} data={block.data} />;
                    default:
                        // Ignore unsupported block types gracefully
                        return null;
                }
            })}
        </div>
    );
}
