import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Bell, Trophy, Calendar, MapPin, ArrowRight, Zap, CheckCircle2, Clock, Users } from 'lucide-react';
import { API_URL } from '../config';
import { getSportImage } from '../utils/sportsImages';

interface Notification {
    id: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    type?: string;
}

export default function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    const fetchNotifications = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        try {
            const res = await fetch(`${API_URL}/api/v1/notifications`, {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
            }
        } catch (e) {
            console.error('Failed to fetch notifications gracefully', e);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        try {
            await fetch(`${API_URL}/api/v1/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) { }
    };

    const markAllRead = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        try {
            await fetch(`${API_URL}/api/v1/notifications/read-all`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (e) { }
    };

    const getIconForType = (type?: string, title?: string, isRead?: boolean) => {
        const colorClass = isRead ? "text-slate-500" : "text-emerald-500";
        const bgClass = isRead ? "bg-slate-100" : "bg-emerald-50";

        // Use type or derive from title if type is missing from backend
        const resolveType = type?.toUpperCase() || title?.toUpperCase() || '';

        if (resolveType.includes('LEASE_REQUESTED') || resolveType.includes('VENUE')) {
            return <div className={`p-2.5 rounded-xl ${bgClass}`}><MapPin size={18} className={isRead ? "text-slate-500" : "text-indigo-500"} /></div>;
        }
        if (resolveType.includes('LEASE_APPROVED') || resolveType.includes('SUCCESS')) {
            return <div className={`p-2.5 rounded-xl ${bgClass}`}><CheckCircle2 size={18} className={isRead ? "text-slate-500" : "text-emerald-500"} /></div>;
        }
        if (resolveType.includes('BOOKING_CONFIRMED') || resolveType.includes('BOOKING')) {
            return <div className={`p-2.5 rounded-xl ${bgClass}`}><Calendar size={18} className={colorClass} /></div>;
        }
        if (resolveType.includes('EXPIRED') || resolveType.includes('TIMEOUT')) {
            return <div className={`p-2.5 rounded-xl ${bgClass}`}><Clock size={18} className={isRead ? "text-slate-500" : "text-orange-500"} /></div>;
        }
        if (resolveType.includes('TEAM_REGISTERED') || resolveType.includes('TOURNAMENT')) {
            return <div className={`p-2.5 rounded-xl ${bgClass}`}><Trophy size={18} className={isRead ? "text-slate-500" : "text-amber-500"} /></div>;
        }
        if (resolveType.includes('PLAYER') || resolveType.includes('TEAM')) {
            return <div className={`p-2.5 rounded-xl ${bgClass}`}><Users size={18} className={isRead ? "text-slate-500" : "text-indigo-500"} /></div>;
        }

        return <div className={`p-2.5 rounded-xl ${bgClass}`}><Zap size={18} className={isRead ? "text-slate-500" : "text-sky-500"} /></div>;
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2.5 rounded-xl transition-all focus:outline-none ${isOpen ? 'bg-emerald-50' : 'hover:bg-slate-100'} ${unreadCount > 0 ? 'text-slate-900 bg-white shadow-sm' : 'text-slate-500'}`}
            >
                <Bell size={20} className="transition-transform" style={{ transform: unreadCount > 0 ? 'rotate(-10deg)' : 'none' }} />
                {unreadCount > 0 && (
                    <span key={unreadCount} className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white shadow-sm ring-2 ring-white so-badge-pop">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    {/* Fixed clickaway overlay */}
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>

                    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-slate-200 rounded-[2rem] shadow-2xl z-50 overflow-hidden so-scale-in" style={{ transformOrigin: 'top right' }}>
                        {/* Header */}
                        <div className="flex justify-between items-center px-6 py-5 bg-slate-900 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/30 rounded-full blur-2xl -mr-10 -mt-10"></div>

                            <h3 className="font-black tracking-tight text-lg relative z-10 flex items-center gap-2">
                                <Zap className="text-emerald-400 w-5 h-5" /> Activity
                            </h3>

                            {unreadCount > 0 && (
                                <button onClick={markAllRead} className="relative z-10 text-[10px] uppercase font-black tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/30">
                                    Mark Read
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-[400px] overflow-y-auto no-scrollbar bg-slate-50">
                            {notifications.length === 0 ? (
                                <div className="p-10 text-center flex flex-col items-center justify-center relative overflow-hidden">
                                    <img src={getSportImage('stadium', 1)} className="absolute inset-0 w-full h-full object-cover opacity-5 grayscale" />
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400 relative z-10 shadow-inner border border-slate-200">
                                        <Bell size={24} />
                                    </div>
                                    <p className="font-bold text-slate-800 relative z-10">Inbox Clear</p>
                                    <p className="text-xs text-slate-500 font-medium mt-1 relative z-10">You're all caught up with alerts.</p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {notifications.map((n, idx) => (
                                        <li
                                            key={n.id}
                                            onClick={() => !n.is_read && markAsRead(n.id)}
                                            className={`p-5 cursor-pointer transition-all flex gap-4 so-slide-right so-delay-${Math.min(idx, 6)} ${!n.is_read ? 'bg-white hover:bg-slate-50/80 shadow-[0_4px_10px_rgba(0,0,0,0.02)] z-10 relative border-l-4 border-l-emerald-500' : 'bg-slate-50 hover:bg-slate-100/50 border-l-4 border-l-transparent'}`}
                                        >
                                            <div className="flex-shrink-0 mt-0.5 relative">
                                                {getIconForType(n.type, n.title, n.is_read)}
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1 gap-2">
                                                    <p className={`text-sm tracking-tight ${!n.is_read ? 'font-black text-slate-900' : 'font-bold text-slate-600'}`}>
                                                        {n.title}
                                                    </p>
                                                    <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap shrink-0 uppercase tracking-widest mt-1">
                                                        {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
                                                <p className={`text-xs leading-relaxed ${!n.is_read ? 'text-slate-600 font-medium' : 'text-slate-500 font-medium line-clamp-2'}`}>
                                                    {n.message}
                                                </p>

                                                {!n.is_read && (
                                                    <div className="mt-3 flex items-center text-[10px] font-black uppercase tracking-widest text-emerald-600 gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                                        Tap to Mark Read <ArrowRight size={12} />
                                                    </div>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
