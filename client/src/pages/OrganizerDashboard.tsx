import { useState, useEffect } from 'react';
import { Trophy, CheckCircle, Search, ShieldAlert } from 'lucide-react';
import { supabase } from '../supabase';

export default function OrganizerDashboard() {
    const [activeTab, setActiveTab] = useState<'tournaments' | 'venues' | 'search' | 'referee'>('tournaments');
    const [leases, setLeases] = useState<any[]>([]);
    const [agents, setAgents] = useState<any[]>([]);

    useEffect(() => {
        const fetchRemote = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            if (activeTab === 'venues') {
                const res = await fetch('http://localhost:3001/api/v1/leases/outgoing', { headers: { 'Authorization': `Bearer ${session.access_token}` } });
                setLeases(await res.json());
            } else if (activeTab === 'search') {
                const res = await fetch('http://localhost:3001/api/v1/scout/players', { headers: { 'Authorization': `Bearer ${session.access_token}` } });
                setAgents(await res.json());
            }
        };
        fetchRemote();
    }, [activeTab]);

    return (
        <div className="min-h-screen bg-slate-950 p-6 md:p-12 relative overflow-hidden text-cyan-400">
            <div className="max-w-7xl mx-auto space-y-8 relative z-10">

                {/* Header Sequence */}
                <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-cyan-900/30 pb-6">
                    <div>
                        <h1 className="text-4xl font-black text-white uppercase tracking-tighter shadow-black drop-shadow-md">
                            Organizer <span className="text-cyan-500">Nexus</span>
                        </h1>
                    </div>
                    <div className="mt-4 md:mt-0 flex gap-2">
                        {['tournaments', 'venues', 'search', 'referee'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-colors 
                                    ${activeTab === tab
                                        ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                                        : 'bg-slate-900 text-slate-500 border border-slate-800 hover:border-cyan-500/50 hover:text-cyan-400'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {activeTab === 'tournaments' && (
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl">
                        <h2 className="text-xl text-white font-black uppercase mb-6 flex items-center gap-2"><Trophy className="text-cyan-500" /> Bracket Topology</h2>
                        <div className="p-6 border border-slate-800 bg-slate-950 rounded-2xl text-center">
                            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Tournament generator natively spans bounds here.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'venues' && (
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl">
                        <h2 className="text-xl text-white font-black uppercase mb-6 flex items-center gap-2"><CheckCircle className="text-cyan-500" /> Outgoing Venue Leases</h2>
                        {leases.length === 0 ? (
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider text-center py-4">No outgoing lease constraints.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {leases.map(lease => (
                                    <div key={lease.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative overflow-hidden">
                                        <div className={`absolute right-0 top-0 border-b border-l text-[10px] px-2 py-1 uppercase tracking-widest font-black rounded-bl ${lease.status === 'APPROVED' ? 'bg-green-500/20 text-green-500 border-green-500/30' : lease.status === 'REJECTED' ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'}`}>
                                            {lease.status}
                                        </div>
                                        <h3 className="text-white font-black uppercase tracking-tight mb-1">{lease.facility_name || 'Mapped Arena'}</h3>
                                        <p className="text-xs text-slate-400">Request ID: {lease.id.split('-')[0]}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button className="mt-6 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs uppercase tracking-widest font-black rounded-lg border border-slate-700 transition">Request New Matrix</button>
                    </div>
                )}

                {activeTab === 'search' && (
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl">
                        <h2 className="text-xl text-white font-black uppercase mb-6 flex items-center gap-2"><Search className="text-cyan-500" /> Free Agent Scouting</h2>
                        <div className="flex gap-2 mb-4">
                            <input type="text" placeholder="Search physical bounds..." className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm focus:border-cyan-500 outline-none flex-1 text-white" />
                            <select className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm text-slate-400 focus:border-cyan-500 outline-none">
                                <option>Any Sport</option>
                            </select>
                        </div>
                        {agents.length === 0 ? (
                            <div className="p-6 border border-slate-800 bg-slate-950 rounded-2xl text-center mt-4">
                                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">No agents mapped to filters.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                {agents.map(ag => (
                                    <div key={ag.id} className="bg-slate-950 border border-slate-800 rounded p-4 flex justify-between items-center">
                                        <div>
                                            <p className="text-white font-black">{ag.name}</p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">{ag.sport_type || 'Flex'} | {ag.position || 'Flex'}</p>
                                        </div>
                                        <button className="px-3 py-1 bg-cyan-900/30 text-cyan-500 border border-cyan-500/50 rounded font-black uppercase tracking-widest text-[10px]">Invite</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'referee' && (
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl">
                        <h2 className="text-xl text-white font-black uppercase mb-6 flex items-center gap-2"><ShieldAlert className="text-cyan-500" /> Arbitration Dispatch</h2>
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                            <div>
                                <p className="text-white font-black uppercase tracking-tight text-sm">Match ID #A1-9492</p>
                                <p className="text-xs text-slate-400">Status: Unassigned</p>
                            </div>
                            <button className="px-4 py-2 bg-cyan-900/40 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-900/60 transition text-[10px] uppercase tracking-widest font-black rounded">Bind Official</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
