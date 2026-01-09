import axios from 'axios';

// Backend uses global prefix /api - see main.ts: app.setGlobalPrefix('api')
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ============================================
// BLOGS APIs
// ============================================
export const blogsApi = {
    getAll: () => api.get('/blogs'),
    getOne: (id: number) => api.get(`/blogs/${id}`),
    create: (data: any) => api.post('/blogs', data),
    update: (id: number, data: any) => api.put(`/blogs/${id}`, data),
    publish: (id: number) => api.post(`/blogs/${id}/publish`),
    unpublish: (id: number) => api.post(`/blogs/${id}/unpublish`),
    delete: (id: number) => api.delete(`/blogs/${id}`),
};

// ============================================
// PRODUCTS APIs (from ERP)
// ============================================
export const productsApi = {
    getAll: () => api.get('/products'),
    getOne: (id: number) => api.get(`/products/${id}`),
    update: (id: number, data: any) => api.put(`/products/${id}`, data),
};

// ============================================
// CUSTOMERS/LEADS APIs (from ERP)
// ============================================
export const leadsApi = {
    getAll: () => api.get('/customers'),
    getOne: (id: number) => api.get(`/customers/${id}`),
    update: (id: number, data: any) => api.put(`/customers/${id}`, data),
};

// ============================================
// CATEGORIES APIs
// ============================================
export const categoriesApi = {
    getAll: () => api.get('/categories'),
};

// ============================================
// SYSTEM CONFIG APIs
// ============================================
export const systemApi = {
    getConfig: (key: string) => api.get(`/system/config/${key}`),
    setConfig: (key: string, value: string, description?: string) =>
        api.post('/system/config', { key, value, description }),
};

export default api;
