import { useState, useEffect } from 'react';
import { Grid, Lock, Unlock } from 'lucide-react';
import { supabase } from '../../supabase';
import TurfRoster from './TurfRoster';
import TurfLeases from './TurfLeases';
import TurfRevenue from './TurfRevenue';

function getColClass(status: string) {
    if (status === 'AVAILABLE') return 'bg-green-500/20 border-green-500 text-green-400';
    if (status === 'HELD_PENDING') return 'bg-amber-500/20 border-amber-500 text-amber-400';
    if (status === 'CONFIRMED_BOOKED') return 'bg-slate-500/20 border-slate-500 text-slate-300';
    if (status === 'LOCKED') return 'bg-blue-500/20 border-blue-500 text-blue-400';
    if (status === 'MAINTENANCE') return 'bg-red-500/20 border-red-500 text-red-500';
    return 'bg-dark-700/20 border-gray-300 text-gray-500';
}

export default function TurfOwnerDashboard() {
    const [activeTab, setActiveTab] = useState<'grid' | 'leases' | 'roster' | 'revenue'>('grid');
    const [slots, setSlots] = useState<any[]>([]);

    useEffect(() => {
        if (activeTab === 'grid') {
            const fetchGrid = async () => {
                const { data: { session } } = await supabase.auth.getSession();
                try {
                    const res = await fetch('http://localhost:3001/api/v1/owner/slots?venueId=CHN-OWN-01', {
                        headers: { 'Authorization': `Bearer ${session?.access_token}` }
                    });
                    const d = await res.json();
                    if (Array.isArray(d)) setSlots(d);
                } catch (e) { }
            };
            fetchGrid();
        }
    }, [activeTab]);

    // Only grid mechanics maintained for command center demo

    const handleOverride = async (slotId: string, currentState: string) => {
        const isLocked = currentState === 'MAINTENANCE';
        const { data: { session } } = await supabase.auth.getSession();
        try {
            await fetch('http://localhost:3001/api/v1/owner/slots/override', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: slotId, lock: !isLocked })
            });
            setSlots(slots.map(s => s.id === slotId ? { ...s, status: !isLocked ? 'MAINTENANCE' : 'AVAILABLE' } : s));
        } catch (e) { }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-12 relative overflow-hidden text-emerald-700 font-sans">
            <div className="max-w-7xl mx-auto space-y-8 relative z-10">

                <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-200 pb-6">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter shadow-gray-200 drop-shadow-md">
                            Command <span className="text-emerald-700">Center</span>
                        </h1>
                        <p className="text-gray-600 font-bold uppercase tracking-widest text-xs mt-2">Active: Vigneshwaran R. (CHN-OWN-01) | Downtown Arena</p>
                    </div>
                    <div className="mt-4 md:mt-0 flex gap-2">
                        {['grid', 'leases', 'roster', 'revenue'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-4 py-2 rounded-none border border-transparent text-xs font-black tracking-widest uppercase transition-colors 
                                    ${activeTab === tab
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : 'bg-white text-gray-500 border-gray-200 hover:border-emerald-600/50'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {activeTab === 'grid' && (
                    <div className="bg-white border border-gray-200 p-8 rounded-none shadow-xl">
                        <h2 className="text-xl text-gray-900 font-black uppercase mb-6 flex items-center gap-2"><Grid className="text-emerald-700" /> Operational Grid Matrix (Live)</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {slots.map(slot => (
                                <div key={slot.id} className={`p-4 border ${getColClass(slot.status)} flex flex-col justify-between`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-xs uppercase font-black text-gray-600 mb-1">{slot.field}</p>
                                            <p className="text-xl font-bold text-gray-900">{slot.time}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-[10px] uppercase font-black px-2 py-1 rounded shadow-sm bg-white/90 ${getColClass(slot.status)}`}>{slot.status}</span>
                                        </div>
                                    </div>
                                    <div className="text-xs font-bold font-mono text-gray-600 mb-4 h-6">
                                        {slot.tx && `Tx: ${slot.tx}`}
                                        {slot.title && `${slot.title}`}
                                        {slot.price && `₹${slot.price}`}
                                    </div>
                                    <button
                                        onClick={() => handleOverride(slot.id, slot.status)}
                                        className="w-full flex justify-center gap-2 items-center py-2 border border-gray-200 hover:border-emerald-600/50 text-xs font-black uppercase tracking-widest text-emerald-700 transition-colors bg-white hover:bg-emerald-50"
                                    >
                                        {slot.status === 'MAINTENANCE' ? <><Unlock size={14} /> Unlock Block</> : <><Lock size={14} /> Force Maintenance Maintenance</>}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'roster' && (
                    <TurfRoster />
                )}

                {activeTab === 'leases' && (
                    <TurfLeases />
                )}

                {activeTab === 'revenue' && (
                    <TurfRevenue />
                )}

                {/* Additional tabs omitted for brevity */}
            </div>
        </div>
    );
}
