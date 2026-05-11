'use server'

import { cookies } from 'next/headers'

export async function loginBeta(formData: FormData) {
    const username = formData.get('username') as string
    const password = formData.get('password') as string

    if (!username || !password) {
        return { error: 'Vui lòng nhập tài khoản và mật khẩu.' }
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://erp.nemmamnon.com'

    try {
        const res = await fetch(`${apiUrl}/api/auth/login`, {
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
