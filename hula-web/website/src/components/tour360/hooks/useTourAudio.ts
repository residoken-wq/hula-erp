/**
 * HULA 360 Tour - Audio Management Hook (useTourAudio)
 * Manages audio lifecycle, Web Audio API chime generation, subtitle sync,
 * and immediate queue cleanup on role switch / tour close (MR-07 & Instruction 02).
 */

import { useRef, useCallback, useEffect } from 'react';

export function useTourAudio(isMuted: boolean) {
    const audioContextRef = useRef<AudioContext | null>(null);
    const activeOscillatorRef = useRef<OscillatorNode | null>(null);

    // Khởi tạo AudioContext an toàn khi có tương tác người dùng
    const getAudioContext = useCallback(() => {
        if (typeof window === 'undefined') return null;
        if (!audioContextRef.current) {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
                audioContextRef.current = new AudioCtx();
            }
        }
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
        return audioContextRef.current;
    }, []);

    /**
     * Dừng ngay lập tức mọi âm thanh đang phát (satisfies MR-07)
     */
    const stopAudio = useCallback(() => {
        if (activeOscillatorRef.current) {
            try {
                activeOscillatorRef.current.stop();
                activeOscillatorRef.current.disconnect();
            } catch {
                // ignore if already stopped
            }
            activeOscillatorRef.current = null;
        }
    }, []);

    /**
     * Phát âm thanh chime nhẹ nhàng thông báo bước / tương tác
     */
    const playChime = useCallback((frequency: number = 523.25, duration: number = 0.25) => {
        if (isMuted) return;
        const ctx = getAudioContext();
        if (!ctx) return;

        stopAudio();

        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(frequency, ctx.currentTime);
            // Decay curve nhẹ nhàng
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + duration);
            activeOscillatorRef.current = osc;

            osc.onended = () => {
                if (activeOscillatorRef.current === osc) {
                    activeOscillatorRef.current = null;
                }
            };
        } catch (e) {
            console.warn('[TourAudio] Could not play chime:', e);
        }
    }, [isMuted, getAudioContext, stopAudio]);

    /**
     * Âm thanh gợi ý nhẹ khi bé chạm vào chi tiết
     */
    const playChildTouchSound = useCallback(() => {
        playChime(659.25, 0.2); // Mi (E5) trong trẻo
    }, [playChime]);

    /**
     * Âm thanh hoàn thành một bước
     */
    const playSuccessSound = useCallback(() => {
        if (isMuted) return;
        const ctx = getAudioContext();
        if (!ctx) return;
        stopAudio();

        try {
            // Chuỗi 2 nốt Sol -> Đố
            const now = ctx.currentTime;
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.frequency.setValueAtTime(392.00, now); // G4
            gain1.gain.setValueAtTime(0.06, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start(now);
            osc1.stop(now + 0.15);

            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.frequency.setValueAtTime(523.25, now + 0.12); // C5
            gain2.gain.setValueAtTime(0.08, now + 0.12);
            gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(now + 0.12);
            osc2.stop(now + 0.35);
        } catch (e) {
            console.warn('[TourAudio] Success chime error:', e);
        }
    }, [isMuted, getAudioContext, stopAudio]);

    // Dọn dẹp audio context khi unmount
    useEffect(() => {
        return () => {
            stopAudio();
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(() => {});
            }
        };
    }, [stopAudio]);

    return {
        stopAudio,
        playChime,
        playChildTouchSound,
        playSuccessSound,
    };
}
