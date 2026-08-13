import { useState, useEffect } from 'react';
import { Grid, DollarSign, Users, Briefcase } from 'lucide-react';
import { supabase } from '../supabase';

export default function TurfOwnerDashboard() {
    const [activeTab, setActiveTab] = useState<'grid' | 'leases' | 'roster' | 'revenue'>('grid');
    const [leases, setLeases] = useState<any[]>([]);

    useEffect(() => {
        if (activeTab === 'leases') {
            const fetchLeases = async () => {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;
                try {
                    const res = await fetch('http://localhost:3001/api/v1/leases/incoming', {
                        headers: { 'Authorization': `Bearer ${session.access_token}` }
                    });
                    const d = await res.json();
                    setLeases(d);
                } catch (e) { console.error('Fetch incoming leases failed', e); }
            };
            fetchLeases();
        }
    }, [activeTab]);

    const handleLeaseAction = async (id: string, action: 'approve' | 'reject') => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        try {
            await fetch(`http://localhost:3001/api/v1/leases/requests/${id}/${action}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            setLeases(leases.map(l => l.id === id ? { ...l, status: action.toUpperCase() + 'ED' } : l));
        } catch (e) { }
    };

    return (
        <div className="min-h-screen bg-[#111111] p-6 md:p-12 relative overflow-hidden text-[#d4af37]">
            <div className="max-w-7xl mx-auto space-y-8 relative z-10">

                {/* Header Sequence */}
                <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#333333] pb-6">
                    <div>
                        <h1 className="text-4xl font-black text-white uppercase tracking-tighter shadow-black drop-shadow-md">
                            Turf <span className="text-[#d4af37]">Admin</span>
                        </h1>
                    </div>
                    <div className="mt-4 md:mt-0 flex gap-2">
                        {['grid', 'leases', 'roster', 'revenue'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-colors 
                                    ${activeTab === tab
                                        ? 'bg-[#d4af37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                                        : 'bg-[#1a1a1a] text-gray-500 border border-[#333333] hover:text-[#d4af37]'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Dashboard Tabs Logic */}
                {activeTab === 'grid' && (
                    <div className="bg-[#1a1a1a] border border-[#333333] p-8 rounded-3xl shadow-xl">
                        <h2 className="text-xl text-white font-black uppercase mb-6 flex items-center gap-2"><Grid className="text-[#d4af37]" /> Court Matrix</h2>
                        <div className="overflow-x-auto">
                            <div className="min-w-[800px]">
                                {/* Timeline Header */}
                                <div className="grid grid-cols-13 gap-1 mb-2 pl-24 text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center">
                                    {['6 PM', '7 PM', '8 PM', '9 PM', '10 PM', '11 PM'].map(h => <div key={h}>{h}</div>)}
                                </div>

                                {/* Court Row */}
                                {['Primary Sector', 'Indoor Court B'].map(court => (
                                    <div key={court} className="flex items-center gap-4 mb-2">
                                        <div className="w-20 text-xs font-bold text-gray-400 capitalize">{court}</div>
                                        <div className="flex-1 grid grid-cols-6 gap-1 h-12">
                                            {/* Mock Slots */}
                                            <div className="bg-purple-900/60 border border-purple-500/50 rounded flex items-center justify-center text-[10px] font-black text-purple-400 uppercase tracking-widest">Locked</div>
                                            <div className="bg-[#22c55e]/20 border border-[#22c55e]/50 rounded"></div>
                                            <div className="bg-blue-900/60 border border-blue-500/50 rounded flex items-center justify-center text-[10px] font-black text-blue-400 uppercase tracking-widest">Booked</div>
                                            <div className="bg-orange-900/60 border border-orange-500/50 rounded flex items-center justify-center text-[10px] font-black text-orange-400 uppercase tracking-widest animate-pulse">Escrow</div>
                                            <div className="bg-[#22c55e]/20 border border-[#22c55e]/50 rounded"></div>
                                            <div className="bg-[#22c55e]/20 border border-[#22c55e]/50 rounded"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'leases' && (
                    <div className="bg-[#1a1a1a] border border-[#333333] p-8 rounded-3xl shadow-xl">
                        <h2 className="text-xl text-white font-black uppercase mb-6 flex items-center gap-2"><Briefcase className="text-[#d4af37]" /> Venue Lease Requests</h2>
                        {leases.length === 0 ? (
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider text-center py-4">No incoming lease requests.</p>
                        ) : (
                            <div className="space-y-4">
                                {leases.map(lease => (
                                    <div key={lease.id} className="bg-[#111111] p-4 rounded-xl border border-[#333333] flex items-center justify-between">
                                        <div>
                                            <h3 className="text-white font-black uppercase tracking-tight">{lease.facility_name} <span className="text-[10px] bg-[#333] px-2 py-1 rounded ml-2">{lease.status}</span></h3>
                                            <p className="text-xs text-gray-400">Requesting Organizer: {lease.organizer_name || 'Anonymous'}</p>
                                        </div>
                                        {lease.status === 'PENDING' && (
                                            <div className="flex gap-2">
                                                <button onClick={() => handleLeaseAction(lease.id, 'approve')} className="px-3 py-1 bg-green-500 text-black font-black uppercase text-[10px] tracking-widest rounded shadow-md hover:bg-green-400">Approve</button>
                                                <button onClick={() => handleLeaseAction(lease.id, 'reject')} className="px-3 py-1 bg-red-900/50 text-red-500 border border-red-500/50 font-black uppercase text-[10px] tracking-widest rounded hover:bg-red-900/80">Reject</button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'roster' && (
                    <div className="bg-[#1a1a1a] border border-[#333333] p-8 rounded-3xl shadow-xl">
                        <h2 className="text-xl text-white font-black uppercase mb-6 flex items-center gap-2"><Users className="text-[#d4af37]" /> Home Turf Roster</h2>
                        <div className="text-center bg-[#111111] border border-[#333333] rounded-2xl p-6">
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">No athletes mapping home turf linkage natively.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'revenue' && (
                    <div className="bg-[#1a1a1a] border border-[#333333] p-8 rounded-3xl shadow-xl">
                        <h2 className="text-xl text-white font-black uppercase mb-6 flex items-center gap-2"><DollarSign className="text-[#d4af37]" /> Revenue Mechanics</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-[#111111] border border-[#333333] rounded-xl p-4">
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-1">Total Payouts (Gross)</p>
                                <p className="text-3xl text-white font-black">$450.00</p>
                            </div>
                            <div className="bg-[#111111] border border-[#333333] rounded-xl p-4">
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-1">Platform Commission (8%)</p>
                                <p className="text-3xl text-red-500 font-black">-$36.00</p>
                            </div>
                            <div className="bg-[#111111] border-[#d4af37]/30 border-2 rounded-xl p-4 bg-gradient-to-br from-[#111] to-[#332200]">
                                <p className="text-[10px] text-[#d4af37] uppercase tracking-widest font-black mb-1">Net Extraction</p>
                                <p className="text-3xl text-white font-black">$414.00</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
