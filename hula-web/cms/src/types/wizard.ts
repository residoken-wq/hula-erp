export interface WizardBaseImage {
    id: string;
    url: string;
    label?: string;
    sort_order: number;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface WizardOption {
    id: string;
    name: string;
    description?: string;
    price_modifier: number;
    image_url?: string;
    image_urls?: string[];
    visualization_overlay?: string;
    color_code?: string;
    sub_options?: WizardOption[];
}

export interface WizardCustomizationStep {
    id: string;
    label: string;
    type: 'toggle' | 'dropdown' | 'color_swatch' | 'branding' | 'yes_no';
    options: WizardOption[];
    default_option_id?: string;
    is_skippable?: boolean;
    required_frame_id?: string;
}

export interface WizardPriceTier {
    min_quantity: number;
    max_quantity?: number;
    base_price: number;
}

export interface Wizard360Frame {
    id: string;
    angle: number; // e.g. 0, 45, 90, 135, 180, 225, 270, 315
    label?: string; // e.g. "Chính diện 0°"
    image_url: string; // Base photo frame URL
    mask_url?: string; // Optional mask image URL for selective color tinting
    tint_blend_mode?: 'multiply' | 'color' | 'overlay' | 'soft-light';
    tint_opacity?: number; // 0.1 - 1.0 (default 0.7)
    sort_order: number;
}

export interface WizardCategoryL2 {
    id: string;
    name: string;
    description?: string;
    sort_order: number;
    base_image?: string;
    base_images?: WizardBaseImage[];
    frames_360?: Wizard360Frame[];
    customization_steps: WizardCustomizationStep[];
    price_tiers: WizardPriceTier[];
}

export interface WizardCategoryL1 {
    id: string;
    name: string;
    icon_url?: string;
    image_url?: string;
    sort_order: number;
    subcategories: WizardCategoryL2[];
}

export interface WizardConfigData {
    hero_title: string;
    hero_subtitle?: string;
    categories: WizardCategoryL1[];
    trust_section?: {
        process_steps: Array<{ icon: string; title: string; description: string }>;
        quality_badges: Array<{ icon: string; text: string }>;
        partner_logos: string[];
    };
}
