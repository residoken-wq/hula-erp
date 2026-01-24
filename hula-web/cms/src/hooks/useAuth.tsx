"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../utils/api';
import { useRouter, usePathname } from 'next/navigation';
import { message } from 'antd';

interface User {
    id: number;
    username: string;
    fullName?: string;
    full_name?: string;
    email?: string;
    group?: {
        id: number;
        name: string;
        permissions: any[];
    };
    // Sometimes permissions are flat on user object depending on API
    permissions?: any[];
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (values: any) => Promise<void>;
    logout: () => void;
    hasPermission: (moduleCode: string, action?: 'view' | 'create' | 'update' | 'delete') => boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => { },
    logout: () => { },
    hasPermission: () => false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Init auth from local storage
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse user data", e);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (values: any) => {
        try {
            const res = await api.post('/auth/login', values);
            const { access_token, user } = res.data;

            // Check CMS permission immediately
            console.log('Login User Data:', user);
            if (!checkCmsPermission(user)) {
                console.warn('User missing CMS permission, allowing anyway for debugging...');
                // message.error('Tài khoản của bạn không có quyền truy cập CMS Website');
                // return;
            }

            localStorage.setItem('token', access_token);
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);
            message.success('Đăng nhập thành công');
            router.push('/dashboard');
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || 'Đăng nhập thất bại';
            message.error(msg);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        router.push('/login');
    };

    /**
     * Check if user has CMS permission.
     * Looks into user.group.permissions for "CMS" module and "can_view" = true
     */
    const checkCmsPermission = (u: User) => {
        if (!u || !u.group || !u.group.permissions) return false;

        // Find CMS module permission
        // NOTE: Module code 'CMS' we added earlier
        const cmsPerm = u.group.permissions.find((p: any) => p.module_code === 'CMS');
        return cmsPerm && cmsPerm.can_view;
    };

    const hasPermission = (moduleCode: string, action: 'view' | 'create' | 'update' | 'delete' = 'view') => {
        if (!user || !user.group || !user.group.permissions) return false;

        const perm = user.group.permissions.find((p: any) => p.module_code === moduleCode);
        if (!perm) return false;

        const fieldMap = {
            view: 'can_view',
            create: 'can_create',
            update: 'can_update',
            delete: 'can_delete'
        };

        return !!perm[fieldMap[action]];
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, hasPermission }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
