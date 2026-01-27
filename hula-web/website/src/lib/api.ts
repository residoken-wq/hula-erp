import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: `${API_URL}/public`,
    headers: {
        'Content-Type': 'application/json',
    },
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

export default api;
