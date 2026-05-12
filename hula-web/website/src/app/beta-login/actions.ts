'use server'

import { cookies } from 'next/headers'

export async function loginBeta(formData: FormData) {
    const username = formData.get('username') as string
    const password = formData.get('password') as string

    if (!username || !password) {
        return { error: 'Vui lòng nhập tài khoản và mật khẩu.' }
    }

    // Ưu tiên API_URL (internal Docker network) cho Server Actions thay vì NEXT_PUBLIC_API_URL (public network)
    let baseUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://erp.nemmamnon.com';
    // Loại bỏ suffix /api nếu có để nối chuỗi chính xác
    if (baseUrl.endsWith('/api')) {
        baseUrl = baseUrl.replace(/\/api$/, '');
    }

    try {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })

        if (!res.ok) {
            return { error: 'Đăng nhập thất bại. Sai tài khoản hoặc mật khẩu.' }
        }

        const data = await res.json()
        if (data.access_token) {
            cookies().set('hula_beta_token', data.access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 * 7, // 1 week
                path: '/'
            })
            return { success: true }
        } else {
            return { error: 'Không nhận được token.' }
        }
    } catch (e) {
        return { error: 'Lỗi kết nối máy chủ. Vui lòng thử lại sau.' }
    }
}
