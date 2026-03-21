export type BlockType = 
    | 'RICH_TEXT' 
    | 'HERO_BANNER' 
    | 'IMAGE_GALLERY' 
    | 'TWO_COLUMN_TEXT_IMAGE' 
    | 'STATS_GRID' 
    | 'VIDEO_EMBED' 
    | 'CALL_TO_ACTION' 
    | 'RELATED_PRODUCTS' 
    | 'TEAM_MEMBERS';

export interface BlockData {
    id: string;
    type: BlockType;
    data: any;
}
