import { useState, useEffect } from 'react';
import { Calendar, Trophy, Activity, Clock } from 'lucide-react';
import VenueMapDiscovery from '../components/VenueMapDiscovery';
import { supabase } from '../supabase';

// Reusing escrow countdown logic securely encapsulated locally
function EscrowCountdown({ createdAt }: { createdAt: string }) {
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        const start = new Date(createdAt).getTime();
        const duration = 15 * 60 * 1000; // 15 mins

        const tick = () => {
            const now = new Date().getTime();
            const remaining = Math.max(0, (start + duration) - now);
            setTimeLeft(remaining);
        };

        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [createdAt]);

    if (timeLeft <= 0) return <span className="text-red-500 font-bold uppercase tracking-wider text-xs">Expired</span>;

    const m = Math.floor(timeLeft / 60000);
    const s = Math.floor((timeLeft % 60000) / 1000);
    return (
        <span className="text-orange-500 font-bold uppercase tracking-widest text-xs flex items-center gap-1">
            <Clock size={12} /> {m}:{s.toString().padStart(2, '0')}
        </span>
    );
}

export default function PlayerDashboard() {
    const [activeTab, setActiveTab] = useState<'bookings' | 'discover' | 'tournaments' | 'resume'>('discover');
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        const loadStats = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            try {
                const res = await fetch(`http://localhost:3001/api/v1/players/${session.user.id}/athletic`);
                if (res.ok) {
                    setStats(await res.json());
                }
            } catch (e) {
                console.error('Athletic fetch block failure:', e);
            }
        };
        loadStats();
    }, []);

    return (
        <div className="min-h-screen bg-dark-950 p-6 md:p-12 relative overflow-hidden">
            <div className="max-w-7xl mx-auto space-y-8 relative z-10">

                {/* Header Sequence */}
                <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-dark-800 pb-6">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter shadow-gray-200 drop-shadow-md">
                            Player <span className="text-emerald-700">Command Control</span>
                        </h1>
                    </div>
                    <div className="mt-4 md:mt-0 flex gap-2">
                        {['bookings', 'discover', 'tournaments', 'resume'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-colors ${activeTab === tab ? 'bg-emerald-600 text-black' : 'bg-white text-gray-600 hover:bg-dark-700 hover:text-gray-900'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Dashboard Tabs Logic */}
                {activeTab === 'bookings' && (
                    <div className="bg-gray-50 border border-gray-300/50 p-8 rounded-3xl shadow-xl">
                        <h2 className="text-xl text-gray-900 font-black uppercase mb-6 flex items-center gap-2"><Calendar className="text-emerald-700" /> Escrow Operations</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Mock Booking Node */}
                            <div className="bg-white border border-gray-300 p-4 rounded-xl flex flex-col gap-2">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-gray-900 font-bold tracking-tight">Manhattan Gridiron</h3>
                                    <EscrowCountdown createdAt={new Date().toISOString()} />
                                </div>
                                <p className="text-xs text-gray-600">Friday, 8:00 PM (1 Hour)</p>
                                <div className="mt-2 bg-gray-50 rounded p-3 border border-orange-500/30 flex justify-between items-center">
                                    <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Hold Status</span>
                                    <span className="text-orange-500 font-bold text-xs uppercase tracking-widest">Pending Split</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'discover' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <VenueMapDiscovery />
                    </div>
                )}

                {activeTab === 'tournaments' && (
                    <div className="bg-gray-50 border border-gray-300/50 p-8 rounded-3xl shadow-xl">
                        <h2 className="text-xl text-gray-900 font-black uppercase mb-6 flex items-center gap-2"><Trophy className="text-emerald-700" /> Active Tournaments</h2>
                        {/* Static Representation of Active Injections */}
                        <div className="p-6 border border-dark-800 bg-dark-950 rounded-2xl text-center">
                            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Registered brackets empty.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'resume' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-gray-50 border border-gray-300/50 p-8 rounded-3xl shadow-xl relative overflow-hidden">
                            {stats?.vertical_jump_cm ? (
                                <div className="absolute top-0 right-0 p-4">
                                    <span className="bg-green-500/20 text-green-400 border border-green-500/50 text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">Referee Verified</span>
                                </div>
                            ) : null}
                            <h2 className="text-xl text-gray-900 font-black uppercase mb-6 flex items-center gap-2"><Activity className="text-emerald-700" /> Athletic Footprint</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white p-4 rounded-xl border border-gray-300 text-center"><p className="text-3xl font-black text-gray-900">{stats?.forty_yard_dash_ms ? (stats.forty_yard_dash_ms / 1000).toFixed(2) : '--'}</p><p className="text-[10px] text-gray-600 uppercase tracking-widest mt-1">40-Yard (s)</p></div>
                                <div className="bg-white p-4 rounded-xl border border-gray-300 text-center"><p className="text-3xl font-black text-emerald-700">{stats?.vertical_jump_cm || '--'}</p><p className="text-[10px] text-gray-600 uppercase tracking-widest mt-1">Vert (cm)</p></div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
