import api from '../utils/api';

// Remove local axios instance creation as we use the one from utils/api which has interceptors
// const API_URL = ... 
// const api = axios.create(...)


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
    create: (data: any) => api.post('/customers', data),
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
