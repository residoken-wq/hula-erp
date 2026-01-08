'use client';

import { useState, useEffect } from 'react';

export default function ComingSoonPage() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [days, setDays] = useState(15);
    const [hours, setHours] = useState(8);
    const [minutes, setMinutes] = useState(42);
    const [seconds, setSeconds] = useState(30);

    useEffect(() => {
        const timer = setInterval(() => {
            setSeconds((s) => {
                if (s > 0) return s - 1;
                setMinutes((m) => {
                    if (m > 0) return m - 1;
                    setHours((h) => {
                        if (h > 0) return h - 1;
                        setDays((d) => (d > 0 ? d - 1 : 0));
                        return 23;
                    });
                    return 59;
                });
                return 59;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            setSubmitted(true);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl"></div>
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-secondary-500/20 to-transparent rounded-full blur-3xl"></div>
            </div>

            {/* Floating elements */}
            <div className="absolute top-20 left-20 w-20 h-20 bg-white/10 rounded-2xl backdrop-blur-sm animate-bounce" style={{ animationDuration: '3s' }}></div>
            <div className="absolute bottom-32 right-24 w-16 h-16 bg-secondary-500/20 rounded-xl backdrop-blur-sm animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}></div>
            <div className="absolute top-1/3 right-16 w-12 h-12 bg-white/5 rounded-lg backdrop-blur-sm animate-pulse"></div>

            <div className="relative z-10 text-center max-w-3xl mx-auto">
                {/* Logo */}
                <div className="mb-8">
                    <div className="w-24 h-24 mx-auto bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4">
                        <span className="text-5xl font-bold text-white">H</span>
                    </div>
                    <h2 className="text-2xl font-semibold text-white/90">HULA</h2>
                </div>

                {/* Main heading */}
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                    Website Đang
                    <br />
                    <span className="bg-gradient-to-r from-secondary-300 to-secondary-500 bg-clip-text text-transparent">
                        Hoàn Thiện
                    </span>
                </h1>

                <p className="text-lg md:text-xl text-white/80 mb-12 max-w-xl mx-auto">
                    Chúng tôi đang chuẩn bị một trải nghiệm tuyệt vời dành cho bạn.
                    Hãy để lại email để nhận thông báo khi website ra mắt!
                </p>

                {/* Countdown */}
                <div className="flex justify-center gap-4 md:gap-8 mb-12">
                    {[
                        { value: days, label: 'Ngày' },
                        { value: hours, label: 'Giờ' },
                        { value: minutes, label: 'Phút' },
                        { value: seconds, label: 'Giây' },
                    ].map((item, index) => (
                        <div key={index} className="text-center">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center mb-2">
                                <span className="text-2xl md:text-3xl font-bold text-white">
                                    {String(item.value).padStart(2, '0')}
                                </span>
                            </div>
                            <span className="text-xs md:text-sm text-white/60">{item.label}</span>
                        </div>
                    ))}
                </div>

                {/* Email form */}
                {!submitted ? (
                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email của bạn..."
                            className="flex-1 px-5 py-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-secondary-400"
                            required
                        />
                        <button
                            type="submit"
                            className="px-8 py-4 bg-secondary-500 hover:bg-secondary-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-secondary-500/30 hover:shadow-secondary-500/50"
                        >
                            Thông báo cho tôi
                        </button>
                    </form>
                ) : (
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 max-w-md mx-auto border border-white/20">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-white font-medium">Cảm ơn bạn đã đăng ký!</p>
                        <p className="text-white/70 text-sm mt-2">Chúng tôi sẽ thông báo khi website chính thức ra mắt.</p>
                    </div>
                )}

                {/* Contact */}
                <div className="mt-16 pt-8 border-t border-white/10">
                    <p className="text-white/60 text-sm mb-4">Liên hệ trước:</p>
                    <div className="flex justify-center gap-6">
                        <a href="tel:0123456789" className="text-white/80 hover:text-white transition-colors">
                            📞 0123 456 789
                        </a>
                        <a href="mailto:info@nemmamnon.com" className="text-white/80 hover:text-white transition-colors">
                            ✉️ info@nemmamnon.com
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
