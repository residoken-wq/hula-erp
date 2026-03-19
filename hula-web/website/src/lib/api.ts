import axios from 'axios';

// CRITICAL: SSR runs on server, need to use internal Docker network (fast)
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

// Products
export const getProducts = async (params?: {
    category?: string;
    limit?: number;
    page?: number;
    sort?: string;
}) => {
    const { data } = await api.get('/products', { params });
    return data;
};

export const getProductBySku = async (sku: string) => {
    const { data } = await api.get(`/products/${sku}`);
    return data;
};

// Categories
export const getCategories = async () => {
    const { data } = await api.get('/categories');
    return data;
};

// Projects
export const getProjects = async () => {
    try {
        const { data } = await api.get('/projects');
        return data.data || [];
    } catch {
        return [];
    }
};

// Blogs
export const getBlogs = async (limit?: number) => {
    const { data } = await api.get('/blogs', { params: { limit } });
    return data;
};

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
export const getHomeConfig = async () => {
    try {
        const { data } = await api.get('/home-config');
        return data;
    } catch {
        return null;
    }
};

export const getSettings = async () => {
    try {
        const { data } = await api.get('/settings');
        return data;
    } catch {
        return null;
    }
};

// About Hula Config
export const getAboutConfig = async () => {
    try {
        const { data } = await api.get('/about-config');
        return data;
    } catch {
        return null;
    }
};

export default api;
