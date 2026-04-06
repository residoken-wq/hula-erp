'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { applyRecruitment } from '@/lib/api';

export default function ApplicationForm({ job }: { job: any }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [portalToken, setPortalToken] = useState('');
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        cv_url: '',
        extra_info: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                job_post_id: job.id,
                source: 'WEBSITE',
                extra_info: formData.extra_info ? { note: formData.extra_info } : null
            };
            
            const res = await applyRecruitment(payload);
            setPortalToken(res.token);
            setSuccess(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            alert('Có lỗi xảy ra, vui lòng thử lại sau.');
        }
        setLoading(false);
    };

    if (success) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                    <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Ưng tuyển thành công!</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Cảm ơn bạn đã ứng tuyển vào vị trí {job.title}. Hệ thống đã gửi email chứa link truy cập Portal cá nhân cho bạn (vui lòng kiểm tra mục thẻ Spam nếu không thấy).
                </p>
                <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6 inline-block text-left relative group">
                    <p className="text-sm text-gray-500 mb-1">Hoặc bạn có thể lưu lại link này để theo dõi tiến độ:</p>
                    <code className="text-primary-600 font-mono text-sm break-all">
                        {`${typeof window !== 'undefined' ? window.location.origin : ''}/portal/recruitment/${portalToken}`}
                    </code>
                </div>
                <div>
                    <button 
                        onClick={() => router.push('/tuyen-dung')}
                        className="btn-primary"
                    >
                        Quay lại trang tuyển dụng
                    </button>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 border-b pb-4">Nộp hồ sơ ứng tuyển</h3>    
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên *</label>
                    <input 
                        type="text" 
                        name="name" 
                        required 
                        value={formData.name} 
                        onChange={handleChange}
                        className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 shadow-sm"
                        placeholder="VD: Nguyễn Văn A"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                    <input 
                        type="tel" 
                        name="phone" 
                        required 
                        value={formData.phone} 
                        onChange={handleChange}
                        className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 shadow-sm"
                        placeholder="VD: 0909123456"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input 
                    type="email" 
                    name="email" 
                    required 
                    value={formData.email} 
                    onChange={handleChange}
                    className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 shadow-sm"
                    placeholder="VD: nguyenvana@gmail.com"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link CV (Google Drive, PDF, vv.) *</label>
                <input 
                    type="url" 
                    name="cv_url" 
                    required 
                    value={formData.cv_url} 
                    onChange={handleChange}
                    className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 shadow-sm"
                    placeholder="https://..."
                />
                <p className="text-xs text-gray-500 mt-1">Vui lòng đảm bảo link đã được chia sẻ quyền xem (Public or Anyone with link).</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thư ngỏ / Ghi chú thêm (Tùy chọn)</label>
                <textarea 
                    name="extra_info" 
                    rows={4}
                    value={formData.extra_info} 
                    onChange={handleChange}
                    className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 shadow-sm"
                    placeholder="Chia sẻ thêm về bản thân bạn hoặc mong muốn của bạn..."
                ></textarea>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full btn-primary py-3 flex justify-center items-center"
            >
                {loading ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : 'Nộp Hồ Sơ Ngay'}
            </button>
        </form>
    );
}
