import axios from 'axios';

// Access public runtime config if needed, or use process.env directly
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://erp.nemmamnon.com';

const api = axios.create({
    baseURL: API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
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

// Interceptor: Attach Token
api.interceptors.request.use(
    (config) => {
        // Access localStorage only on client side
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            // If token exists, attach it
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor: Handle Errors (Global)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Log error for debugging
        if (error.response?.status === 401 && typeof window !== 'undefined') {
            // Check if we are already on login page to avoid loops
            if (!window.location.pathname.includes('/login')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // Redirect to login
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
