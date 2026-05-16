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
    getCategories: () => api.get('/blogs/categories'),
    saveCategories: (categories: string[]) => api.post('/blogs/categories', { categories }),
};

// ============================================
// SYSTEM ANALYTICS APIs
// ============================================
export const analyticsApi = {
    getStats: () => api.get('/public/analytics/stats'),
    getVisitors: (params?: any) => api.get('/public/analytics/visitors', { params }),
};

// ============================================
export const websiteProjectsApi = {
    getAll: (params?: any) => api.get('/website-projects', { params }),
    getOne: (id: number) => api.get(`/website-projects/${id}`),
    create: (data: any) => api.post('/website-projects', data),
    update: (id: number, data: any) => api.put(`/website-projects/${id}`, data),
    delete: (id: number) => api.delete(`/website-projects/${id}`),
};

// ============================================
// PRODUCTS APIs (from ERP)
// ============================================
export const productsApi = {
    getAll: () => api.get('/products'),
    getOne: (id: number) => api.get(`/products/${id}`),
    update: (id: number, data: any) => api.put(`/products/${id}`, data),
    getWebsiteConfig: (id: number) => api.get(`/products/${id}/website-config`),
    saveWebsiteConfig: (id: number, data: any) => api.post(`/products/${id}/website-config`, data),
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
    getHomeConfig: () => api.get('/system/home-config'),
    saveHomeConfig: (data: any) => api.post('/system/home-config', data),
    getAboutConfig: () => api.get('/system/about-config'),
    saveAboutConfig: (data: any) => api.post('/system/about-config', data),
};

// ============================================
// POLICIES APIs
// ============================================
export const policiesApi = {
    getAll: () => api.get('/public/policies'),
    getOne: (slug: string) => api.get(`/public/policies/${slug}`),
    update: (slug: string, data: any) => api.put(`/public/policies/${slug}`, data),
};

// ============================================
// WIZARD CONFIG APIs
// ============================================
export const wizardApi = {
    getConfig: () => api.get('/public/wizard/config'),
    saveConfig: (data: any) => api.put('/public/wizard/config', data),
};

// ============================================
// UPLOAD APIs
// ============================================
export const uploadApi = {
    image: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/upload/image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    listFiles: () => api.get('/upload/list'),
    imageUsage: () => api.get('/upload/usage'),
    deleteFile: (filename: string) => api.delete(`/upload/files/${filename}`),
};

// ============================================
// WATERMARK APIs
// ============================================
export const watermarkApi = {
    getConfig: () => api.get('/upload/watermark/config'),
    saveConfig: (data: any) => api.post('/upload/watermark/config', data),
    uploadImage: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/upload/watermark/image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    regenerateAll: () => api.post('/upload/watermark/regenerate'),
};

export default api;

