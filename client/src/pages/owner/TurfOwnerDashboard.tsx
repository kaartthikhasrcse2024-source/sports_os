import { useState, useEffect } from 'react';
import { Grid, Lock, Unlock, Calendar, TrendingUp, Users, Activity, MapPin } from 'lucide-react';
import { supabase } from '../../supabase';
import TurfRoster from './TurfRoster';
import TurfLeases from './TurfLeases';
import TurfRevenue from './TurfRevenue';
import { API_URL } from '../../config';
import { getSportImage } from '../../utils/sportsImages';
import { usePageEnter } from '../../utils/animations';

function getColClass(status: string) {
    if (status === 'AVAILABLE') return 'so-slot-available';
    if (status === 'HELD_PENDING') return 'so-slot-held';
    if (status === 'CONFIRMED_BOOKED') return 'so-slot-booked';
    if (status === 'LOCKED') return 'so-slot-booked';
    if (status === 'MAINTENANCE') return 'so-slot-expired';
    return 'bg-white border-slate-200 text-slate-500';
}

function getDotClass(status: string) {
    if (status === 'AVAILABLE') return 'bg-emerald-500';
    if (status === 'HELD_PENDING') return 'bg-orange-500';
    if (status === 'CONFIRMED_BOOKED') return 'bg-blue-500';
    if (status === 'LOCKED') return 'bg-slate-500';
    if (status === 'MAINTENANCE') return 'bg-red-500';
    return 'bg-slate-300';
}

export default function TurfOwnerDashboard() {
    const pageClass = usePageEnter();
    const [activeTab, setActiveTab] = useState<'grid' | 'leases' | 'roster' | 'revenue'>('grid');
    const [slots, setSlots] = useState<any[]>([]);
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState({ revenue: '--', bookings: '--', occupancy: '--', activeRequests: '--' });

    useEffect(() => {
        const fetchBaseData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            try {
                // Fetch user data for hero
                const { data: { user } } = await supabase.auth.getUser();
                setProfile(user?.user_metadata || { full_name: 'Owner' });

                // Fetch slots
                const res = await fetch(`${API_URL}/api/v1/owner/slots`, {
                    headers: { 'Authorization': `Bearer ${session?.access_token}` }
                });
                const d = await res.json();
                if (Array.isArray(d)) {
                    setSlots(d);

                    // Derive artificial KPIs from slots *if* we don't have a real endpoint here yet
                    // But requirement says DO NOT CREATE FAKE DATA. So if true, we stick to what we actually know!
                    const bookedSlots = d.filter(s => s.status === 'CONFIRMED_BOOKED' || s.status === 'LOCKED');
                    const totalMoney = d.filter(s => s.status === 'CONFIRMED_BOOKED' && s.price).reduce((acc, s) => acc + (Number(s.price) || 0), 0);

                    setStats({
                        revenue: totalMoney > 0 ? `₹${totalMoney.toLocaleString()}` : '--',
                        bookings: bookedSlots.length > 0 ? bookedSlots.length.toString() : '--',
                        occupancy: d.length > 0 ? `${Math.round((bookedSlots.length / d.length) * 100)}%` : '--',
                        activeRequests: d.filter(s => s.status === 'HELD_PENDING').length.toString() || '--'
                    });
                }
            } catch (e) { console.error(e) }
        };
        fetchBaseData();
    }, [activeTab]);

    const handleOverride = async (slotId: string, currentState: string) => {
        const isLocked = currentState === 'MAINTENANCE';
        const { data: { session } } = await supabase.auth.getSession();
        try {
            await fetch(`${API_URL}/api/v1/owner/slots/override`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: slotId, lock: !isLocked })
            });
            setSlots(slots.map(s => s.id === slotId ? { ...s, status: !isLocked ? 'MAINTENANCE' : 'AVAILABLE' } : s));
        } catch (e) { }
    }

    return (
        <div className={`min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-emerald-500 selection:text-white pb-20 md:pb-6 ${pageClass}`}>

            {/* Top Navigation (Desktop) / Header (Mobile) */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-5 md:px-8 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-xs">OS</div>
                    <span className="font-black tracking-tight text-lg text-slate-900 hidden md:block">SPORTS OS <span className="text-slate-400 font-bold">OWNER</span></span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-black">
                        {profile?.full_name ? profile.full_name.substring(0, 2).toUpperCase() : 'O'}
                    </div>
                </div>
            </header>

            {/* Mobile Bottom Navigation Component replacement */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 z-50 md:hidden flex justify-around items-center px-2 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                {[
                    { id: 'grid', label: 'Courts', icon: Grid },
                    { id: 'leases', label: 'Leases', icon: Calendar },
                    { id: 'roster', label: 'Roster', icon: Users },
                    { id: 'revenue', label: 'Revenue', icon: TrendingUp }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex flex-col items-center gap-1 w-1/4 transition-all duration-200 ${activeTab === tab.id ? 'text-emerald-600 scale-105' : 'text-slate-400 active:scale-95'}`}
                        style={{ transition: 'color 200ms ease, transform 200ms cubic-bezier(0.34,1.56,0.64,1)' }}
                    >
                        <tab.icon size={20} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                        <span className={`text-[10px] uppercase font-bold tracking-widest ${activeTab === tab.id ? 'text-emerald-700 font-black' : ''}`}>{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="max-w-7xl mx-auto md:px-8 mt-0 md:mt-8 w-full flex flex-col md:flex-row gap-8">

                {/* Desktop Sidebar Navigation */}
                <aside className="hidden md:block w-64 flex-shrink-0 space-y-2 sticky top-24 h-[calc(100vh-120px)]">
                    <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200">
                        <div className="px-4 pb-4 mb-4 border-b border-slate-100">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-2">Navigation</h3>
                        </div>
                        <nav className="space-y-1">
                            {[
                                { id: 'grid', label: 'Command Center', icon: Activity },
                                { id: 'leases', label: 'Lease Requests', icon: Calendar },
                                { id: 'revenue', label: 'Revenue & Analytics', icon: TrendingUp },
                                { id: 'roster', label: 'Player Roster', icon: Users }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-bold text-sm ${activeTab === tab.id ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <tab.icon size={18} strokeWidth={2.5} className={activeTab === tab.id ? 'text-emerald-600' : 'text-slate-400'} />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </aside>

                <main className="flex-1 w-full min-w-0 pb-8">

                    {activeTab === 'grid' && (
                        <div className="space-y-6 md:space-y-8 so-fade-in">

                            {/* Visual Venue Hero Component */}
                            <div className="bg-slate-900 rounded-b-[2rem] md:rounded-[2rem] shadow-xl relative overflow-hidden group mb-8">
                                <img
                                    src={getSportImage('stadium', 0)}
                                    alt="Venue Control Center"
                                    className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700 pointer-events-none"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-slate-900/80 pointer-events-none" />

                                <div className="relative z-10 p-6 lg:p-10 flex flex-col min-h-[320px] justify-between">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 shadow-sm">
                                                <Activity size={12} className="animate-pulse" /> Live Center
                                            </div>
                                            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none mb-2 so-fade-up">
                                                Good morning, {profile?.full_name ? profile.full_name.split(' ')[0] : 'Owner'}.
                                            </h1>
                                            <p className="text-slate-300 font-medium text-sm md:text-base so-fade-up so-delay-1 flex items-center gap-2">
                                                <MapPin size={16} className="text-emerald-500" /> Downtown Arena & Turf (Anna Nagar)
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-8 so-fade-up so-delay-2">
                                        <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 lg:p-5 rounded-2xl hover:bg-white/15 transition-colors shadow-sm">
                                            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2"><TrendingUp size={12} /> Today's Revenue</span>
                                            <span className="text-2xl lg:text-3xl font-black text-white tracking-tighter">{stats.revenue}</span>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 lg:p-5 rounded-2xl hover:bg-white/15 transition-colors shadow-sm">
                                            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2"><Calendar size={12} /> Bookings</span>
                                            <span className="text-2xl lg:text-3xl font-black text-white tracking-tighter">{stats.bookings}</span>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 lg:p-5 rounded-2xl hover:bg-white/15 transition-colors shadow-sm">
                                            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2"><Activity size={12} /> Occupancy</span>
                                            <span className="text-2xl lg:text-3xl font-black text-white tracking-tighter">{stats.occupancy}</span>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 lg:p-5 rounded-2xl hover:bg-white/15 transition-colors shadow-sm relative overflow-hidden">
                                            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-orange-400 mb-2 relative z-10"><Users size={12} /> Active Requests</span>
                                            <span className="text-2xl lg:text-3xl font-black text-white tracking-tighter relative z-10">{stats.activeRequests}</span>
                                            {stats.activeRequests !== '--' && Number(stats.activeRequests) > 0 && (
                                                <span className="absolute top-0 right-0 w-12 h-12 bg-orange-500/20 rounded-full blur-xl animate-pulse" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Slot Management Container */}
                            <div className="px-4 md:px-0">
                                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 gap-3">
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                            <Grid className="text-emerald-600" size={20} /> Court Operations
                                        </h2>
                                        <p className="text-xs text-slate-500 font-medium mt-1">Manage real-time slot inventory and walk-in lockers.</p>
                                    </div>
                                </div>

                                {/* Slot Grid Visualization */}
                                {slots.length === 0 ? (
                                    <div className="bg-slate-50 p-16 rounded-[2rem] border border-slate-200 text-center shadow-inner flex flex-col items-center relative overflow-hidden group">
                                        <img src={getSportImage('stadium', 1)} className="absolute inset-0 w-full h-full object-cover opacity-[0.03] grayscale group-hover:scale-105 transition-transform duration-700 pointer-events-none" alt="" />
                                        <div className="w-24 h-24 bg-white border border-slate-200 rounded-[2rem] shadow-sm flex items-center justify-center mb-6 relative z-10">
                                            <Calendar size={40} className="text-slate-400 drop-shadow-sm" />
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 mb-2 relative z-10 tracking-tight">No Court Data</h3>
                                        <p className="text-slate-500 text-base font-medium max-w-md relative z-10">There are no operational slots generated for your facility yet. The backend engine prepares these hourly.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {slots.map((slot, i) => (
                                            <div key={slot.id} className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col group hover:shadow-md transition-all hover:-translate-y-0.5 so-slide-up" style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}>

                                                <div className={`p-4 border-b ${getColClass(slot.status)} flex justify-between items-start relative overflow-hidden`}>
                                                    {slot.status === 'CONFIRMED_BOOKED' && <div className="absolute right-0 top-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />}
                                                    <div className="relative z-10">
                                                        <div className="flex items-center gap-1.5 mb-1">
                                                            <div className={`w-2 h-2 rounded-full ${getDotClass(slot.status)} shadow-sm`}></div>
                                                            <span className="text-[9px] uppercase font-black tracking-widest">{slot.status.replace('_', ' ')}</span>
                                                        </div>
                                                        <p className="text-xl font-black tracking-tighter">{slot.time}</p>
                                                    </div>
                                                </div>

                                                <div className="p-4 flex-1 flex flex-col bg-white">
                                                    <div className="mb-4">
                                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2"><MapPin size={12} className="text-slate-400" /> {slot.field || 'Main Arena'}</p>
                                                        {slot.price && <p className="text-sm font-black text-emerald-600 tracking-wide flex items-center gap-1.5"><TrendingUp size={14} className="text-emerald-500" /> ₹{slot.price}</p>}
                                                        {slot.title && <p className="text-xs text-slate-700 mt-2 font-bold line-clamp-1">{slot.title}</p>}
                                                        {slot.tx && <p className="text-[9px] text-slate-400 mt-1 font-mono break-all line-clamp-1">Tx: {slot.tx}</p>}
                                                    </div>

                                                    <div className="mt-auto">
                                                        <button
                                                            onClick={() => handleOverride(slot.id, slot.status)}
                                                            className={`w-full flex justify-center gap-2 items-center py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${slot.status === 'MAINTENANCE'
                                                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200 shadow-sm'
                                                                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'}`}
                                                        >
                                                            {slot.status === 'MAINTENANCE' ? <><Unlock size={14} /> Unlock Court</> : <><Lock size={14} /> Lock (Walk-in)</>}
                                                        </button>
                                                    </div>
                                                </div>

                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'leases' && <TurfLeases />}
                    {activeTab === 'roster' && <TurfRoster />}
                    {activeTab === 'revenue' && <TurfRevenue />}

                </main>
            </div>
        </div>
    );
}
