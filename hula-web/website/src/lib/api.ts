import axios from 'axios';
import { cache } from 'react';// CRITICAL: SSR runs on server, need to use internal Docker network (fast)
// Client-side runs in browser, needs to use public URL
const getApiUrl = () => {
    const isServer = typeof window === 'undefined';

    if (isServer) {
        // Server-side (SSR): Use internal Docker network URL for fast container-to-container communication
        // API_URL = http://hula_app:3000 (no /api suffix), we add /api here
        if (process.env.API_URL) {
            return `${process.env.API_URL}/api`;
        }
        // Fallback for SSR if API_URL not set
        if (process.env.NEXT_PUBLIC_API_URL) {
            return process.env.NEXT_PUBLIC_API_URL;
        }
    } else {
        // Client-side (browser): Use public URL
        // NEXT_PUBLIC_API_URL = https://erp.nemmamnon.com/api (already has /api)
        if (process.env.NEXT_PUBLIC_API_URL) {
            return process.env.NEXT_PUBLIC_API_URL;
        }
    }

    // Ultimate fallback
    return 'https://erp.nemmamnon.com/api';
};

const API_URL = getApiUrl();

console.log('[API] Using API_URL:', API_URL, '| isServer:', typeof window === 'undefined');

const api = axios.create({
    baseURL: `${API_URL}/public`,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
});

// Safe JSON stringifier that strips circular references and DOM nodes
const safeStringify = (data: any) => {
    const seen = new WeakSet();
    return JSON.stringify(data, (_key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) return undefined;
            if (value.nodeType || value.$$typeof || value._owner) return undefined;
            if (seen.has(value)) return undefined;
            seen.add(value);
        }
        return value;
    });
};

api.defaults.transformRequest = [
    (data, headers) => {
        if (data && typeof data === 'object' && !(data instanceof FormData) && !(data instanceof Blob)) {
            if (headers) {
                headers['Content-Type'] = 'application/json';
            }
            return safeStringify(data);
        }
        return data;
    }
];

// Products
export const getProducts = cache(async (params?: {
    category?: string;
    limit?: number;
    page?: number;
    sort?: string;
    tags?: string[];
}) => {
    const { data } = await api.get('/products', { params });
    return data;
});

export const getProductBySku = async (sku: string) => {
    const { data } = await api.get(`/products/${sku}`);
    return data;
};

// Categories
export const getCategories = cache(async () => {
    const { data } = await api.get('/categories');
    return data;
});

// Projects
export const getProjects = cache(async () => {
    try {
        const { data } = await api.get('/projects');
        return data.data || [];
    } catch {
        return [];
    }
});

// Blogs
export const getBlogs = cache(async (limit?: number) => {
    const { data } = await api.get('/blogs', { params: { limit } });
    return data;
});

export const getBlogBySlug = async (slug: string) => {
    const { data } = await api.get(`/blogs/${slug}`);
    return data;
};

// Leads (Form đăng ký sỉ)
export const createLead = async (data: {
    company_name: string;
    contact_person: string;
    phone: string;
    email?: string;
    address?: string;
    expected_quantity?: string;
    notes?: string;
}) => {
    const response = await api.post('/leads', data);
    return response.data;
};

// Orders
export const createOrder = async (data: {
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    delivery_address: string;
    items: Array<{ sku: string; quantity: number; unit_price: number }>;
    notes?: string;
}) => {
    const { data: response } = await api.post('/orders', data);
    return response;
};

// Config
export const getHomeConfig = cache(async () => {
    try {
        const { data } = await api.get('/home-config');
        return data;
    } catch {
        return null;
    }
});

export const getSettings = cache(async () => {
    try {
        const { data } = await api.get('/settings');
        return data;
    } catch {
        return null;
    }
});

// About Hula Config
export const getAboutConfig = async () => {
    try {
        const { data } = await api.get('/about-config');
        return data;
    } catch {
        return null;
    }
};

// Recruitment
export const getRecruitmentJobs = async () => {
    try {
        const { data } = await api.get('/recruitment/jobs');
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
};

export const getRecruitmentJobBySlug = async (slug: string) => {
    try {
        const { data } = await api.get(`/recruitment/jobs/${slug}`);
        return data;
    } catch {
        return null;
    }
};

export const applyRecruitment = async (payload: any) => {
    const { data } = await api.post('/recruitment/apply', payload);
    return data;
};

export default api;
