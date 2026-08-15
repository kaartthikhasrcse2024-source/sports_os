import { useState, useEffect } from 'react';
import { Trophy, CheckCircle, Search, ShieldAlert } from 'lucide-react';
import { supabase } from '../supabase';

export default function OrganizerDashboard() {
    const [activeTab, setActiveTab] = useState<'tournaments' | 'venues' | 'search' | 'referee'>('tournaments');
    const [leases, setLeases] = useState<any[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sportFilter, setSportFilter] = useState('Any Sport');

    useEffect(() => {
        const fetchRemote = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            if (activeTab === 'venues') {
                const res = await fetch('http://localhost:3001/api/v1/leases/outgoing', { headers: { 'Authorization': `Bearer ${session.access_token}` } });
                setLeases(await res.json());
            } else if (activeTab === 'search') {
                const params = new URLSearchParams();
                if (searchQuery) params.append('q', searchQuery);
                if (sportFilter !== 'Any Sport') params.append('sport', sportFilter);

                const res = await fetch(`http://localhost:3001/api/v1/scout/players?${params.toString()}`, { headers: { 'Authorization': `Bearer ${session.access_token}` } });
                setAgents(await res.json());
            }
        };
        fetchRemote();
    }, [activeTab, searchQuery, sportFilter]);

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-12 relative overflow-hidden text-emerald-700">
            <div className="max-w-7xl mx-auto space-y-8 relative z-10">

                {/* Header Sequence */}
                <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-200 pb-6">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter shadow-gray-200 drop-shadow-md">
                            Organizer <span className="text-emerald-600">Nexus</span>
                        </h1>
                    </div>
                    <div className="mt-4 md:mt-0 flex gap-2">
                        {['tournaments', 'venues', 'search', 'referee'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-colors 
                                    ${activeTab === tab
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : 'bg-white text-gray-500 border border-gray-200 hover:border-emerald-600/50 hover:text-emerald-700'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {activeTab === 'tournaments' && (
                    <div className="bg-white border border-gray-200 p-8 rounded-3xl shadow-xl">
                        <h2 className="text-xl text-gray-900 font-black uppercase mb-6 flex items-center gap-2"><Trophy className="text-emerald-600" /> Bracket Topology</h2>
                        <div className="p-6 border border-gray-200 bg-gray-50 rounded-2xl text-center">
                            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Tournament generator natively spans bounds here.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'venues' && (
                    <div className="bg-white border border-gray-200 p-8 rounded-3xl shadow-xl">
                        <h2 className="text-xl text-gray-900 font-black uppercase mb-6 flex items-center gap-2"><CheckCircle className="text-emerald-600" /> Outgoing Venue Leases</h2>
                        {leases.length === 0 ? (
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider text-center py-4">No outgoing lease constraints.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {leases.map(lease => (
                                    <div key={lease.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative overflow-hidden">
                                        <div className={`absolute right-0 top-0 border-b border-l text-[10px] px-2 py-1 uppercase tracking-widest font-black rounded-bl ${lease.status === 'APPROVED' ? 'bg-green-50 text-green-600 border-green-200' : lease.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-yellow-50 text-yellow-600 border-yellow-200'}`}>
                                            {lease.status}
                                        </div>
                                        <h3 className="text-gray-900 font-black uppercase tracking-tight mb-1">{lease.facility_name || 'Mapped Arena'}</h3>
                                        <p className="text-xs text-gray-400">Request ID: {lease.id.split('-')[0]}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button className="mt-6 px-6 py-2 bg-white hover:bg-emerald-50 text-emerald-700 text-xs uppercase tracking-widest font-black rounded-lg border border-gray-200 transition">Request New Matrix</button>
                    </div>
                )}

                {activeTab === 'search' && (
                    <div className="bg-white border border-gray-200 p-8 rounded-3xl shadow-xl">
                        <h2 className="text-xl text-gray-900 font-black uppercase mb-6 flex items-center gap-2"><Search className="text-emerald-600" /> Free Agent Scouting</h2>
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                placeholder="Search physical bounds..."
                                className="bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm focus:border-emerald-500 outline-none flex-1 text-gray-900"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <select
                                className="bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm text-gray-400 focus:border-emerald-500 outline-none"
                                value={sportFilter}
                                onChange={(e) => setSportFilter(e.target.value)}
                            >
                                <option>Any Sport</option>
                                <option>Football</option>
                                <option>Badminton</option>
                                <option>Cricket</option>
                            </select>
                        </div>
                        {agents.length === 0 ? (
                            <div className="p-6 border border-gray-200 bg-gray-50 rounded-2xl text-center mt-4">
                                <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">No agents mapped to filters.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                {agents.map(ag => (
                                    <div key={ag.id} className="bg-gray-50 border border-gray-200 rounded p-4 flex justify-between items-center">
                                        <div>
                                            <p className="text-gray-900 font-black">{ag.name}</p>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest">{ag.sport_type || 'Flex'} | {ag.position || 'Flex'}</p>
                                        </div>
                                        <button className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded font-black uppercase tracking-widest text-[10px]">Invite</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'referee' && (
                    <div className="bg-white border border-gray-200 p-8 rounded-3xl shadow-xl">
                        <h2 className="text-xl text-gray-900 font-black uppercase mb-6 flex items-center gap-2"><ShieldAlert className="text-emerald-600" /> Arbitration Dispatch</h2>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex justify-between items-center">
                            <div>
                                <p className="text-gray-900 font-black uppercase tracking-tight text-sm">Match ID #A1-9492</p>
                                <p className="text-xs text-gray-400">Status: Unassigned</p>
                            </div>
                            <button className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition text-[10px] uppercase tracking-widest font-black rounded">Bind Official</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
