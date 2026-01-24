import axios from 'axios';

// Access public runtime config if needed, or use process.env directly
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://erp.nemmamnon.com';

const api = axios.create({
    baseURL: API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

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
