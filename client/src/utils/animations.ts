/**
 * Sports OS — Phase 8C Animation Utilities
 * Pure React hooks for GPU-friendly UI motion.
 * No external library dependency.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// ─── Easing presets ───────────────────────────────────────────────────────────
export const EASING = {
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
} as const;

// ─── Reduced-motion detection ─────────────────────────────────────────────────
export function prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ─── usePageEnter ─────────────────────────────────────────────────────────────
/** Applies a `so-page-enter` CSS class on mount for page fade-up transitions. */
export function usePageEnter() {
    const [entered, setEntered] = useState(false);
    useEffect(() => {
        const id = requestAnimationFrame(() => setEntered(true));
        return () => cancelAnimationFrame(id);
    }, []);
    return entered ? 'so-page-enter so-page-enter--active' : 'so-page-enter';
}

// ─── useInView ────────────────────────────────────────────────────────────────
/** Returns [ref, isVisible]. Element reveals when it enters the viewport. */
export function useInView(threshold = 0.15): [React.RefObject<HTMLDivElement>, boolean] {
    const ref = useRef<HTMLDivElement>(null!);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (prefersReducedMotion()) { setVisible(true); return; }
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
            { threshold }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [threshold]);

    return [ref, visible];
}

// ─── useCounter ───────────────────────────────────────────────────────────────
/** Counts from 0 to `target` over `duration` ms. Returns current display value. */
export function useCounter(target: number, duration = 1200, decimals = 0): number {
    const [count, setCount] = useState(0);
    const frameRef = useRef<number>(0);

    useEffect(() => {
        if (prefersReducedMotion() || target === 0) { setCount(target); return; }
        const start = performance.now();
        const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            // Ease-out quad
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = parseFloat((eased * target).toFixed(decimals));
            setCount(value);
            if (progress < 1) frameRef.current = requestAnimationFrame(animate);
        };
        frameRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameRef.current);
    }, [target, duration, decimals]);

    return count;
}

// ─── useStagger ───────────────────────────────────────────────────────────────
/** Returns a function that maps item index to a stagger delay class. */
export function useStagger(baseDelayMs = 60) {
    return useCallback((index: number): React.CSSProperties => {
        if (prefersReducedMotion()) return {};
        return { animationDelay: `${index * baseDelayMs}ms` };
    }, [baseDelayMs]);
}

// ─── useSuccessFlash ─────────────────────────────────────────────────────────
/** Returns `show` boolean that auto-hides after `durationMs`. */
export function useSuccessFlash(durationMs = 2000) {
    const [show, setShow] = useState(false);
    const trigger = useCallback(() => {
        setShow(true);
        setTimeout(() => setShow(false), durationMs);
    }, [durationMs]);
    return { show, trigger };
}

// ─── Slot state CSS class map ─────────────────────────────────────────────────
export type SlotState = 'available' | 'selected' | 'held' | 'booked' | 'expired';

export const slotStateClass: Record<SlotState, string> = {
    available: 'so-slot-available',
    selected: 'so-slot-selected',
    held: 'so-slot-held',
    booked: 'so-slot-booked',
    expired: 'so-slot-expired',
};

// ─── Booking status CSS class map ────────────────────────────────────────────
export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'expired';

export const bookingStatusClass: Record<BookingStatus, string> = {
    pending: 'so-status-pending',
    confirmed: 'so-status-confirmed',
    rejected: 'so-status-rejected',
    expired: 'so-status-expired',
};
