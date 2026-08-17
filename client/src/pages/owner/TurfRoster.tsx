import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { ShieldCheck, UserPlus, Search, Shield, MapPin, Target } from 'lucide-react';
import { API_URL } from '../../config';
import { getSportImage } from '../../utils/sportsImages';

export default function TurfRoster() {
    const [roster, setRoster] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRoster = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            try {
                const res = await fetch(`${API_URL}/api/v1/owner/roster`, {
                    headers: { 'Authorization': `Bearer ${session?.access_token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) setRoster(data);
                    else setRoster([]);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchRoster();
    }, []);

    const handleSelect = (id: string) => {
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleDraft = async () => {
        if (selected.length === 0) return;
        setSubmitting(true);
        const { data: { session } } = await supabase.auth.getSession();
        try {
            const res = await fetch(`${API_URL}/api/v1/owner/roster/draft-team`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamName: 'Anna Nagar Strikers', playerIds: selected })
            });
            const data = await res.json();
            alert(data.message || 'Drafted successfully.');
            setSelected([]);
        } catch (e) { }
        setSubmitting(false);
    };

    return (
        <div className="animate-in fade-in duration-300">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                        <ShieldCheck className="text-emerald-600" size={24} /> Community Roster
                    </h2>
                    <p className="text-slate-500 font-medium text-sm mt-1">Discover elite talent in your facility's operational radius.</p>
                </div>

                <div className="relative w-full md:w-80 shrink-0">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Search size={16} className="text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search players by name..."
                        className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
                    <div className="animate-pulse space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-2xl w-full"></div>)}
                    </div>
                </div>
            ) : roster.length === 0 ? (
                <div className="bg-slate-50 p-16 rounded-[2rem] border border-slate-200 text-center shadow-inner flex flex-col items-center relative overflow-hidden group">
                    <img src={getSportImage('stadium', 1)} className="absolute inset-0 w-full h-full object-cover opacity-[0.03] grayscale group-hover:scale-105 transition-transform duration-700 pointer-events-none" alt="" />
                    <div className="w-24 h-24 bg-white border border-slate-200 rounded-[2rem] shadow-sm flex items-center justify-center mb-6 relative z-10">
                        <Shield size={40} className="text-slate-400 drop-shadow-sm" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2 relative z-10 tracking-tight">No Active Athletes</h3>
                    <p className="text-slate-500 text-base font-medium max-w-md relative z-10">There are currently no active athletes registered in your facility's operational zone.</p>
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden mb-8">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="text-[10px] uppercase font-black tracking-widest text-slate-400 bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    <th className="p-4 pl-6 w-12 text-center">Draft</th>
                                    <th className="p-4">Athlete Profile</th>
                                    <th className="p-4 text-center">Engagement</th>
                                    <th className="p-4">Physical Node</th>
                                    <th className="p-4 pr-6">Sport</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {roster.filter(p => p.name?.toLowerCase().includes(search.toLowerCase())).map(p => (
                                    <tr key={p.id} className="hover:bg-emerald-50/30 transition-colors group cursor-pointer" onClick={() => handleSelect(p.id)}>
                                        <td className="p-4 pl-6 text-center" onClick={e => e.stopPropagation()}>
                                            <label className="relative flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="peer sr-only"
                                                    checked={selected.includes(p.id)}
                                                    onChange={() => handleSelect(p.id)}
                                                />
                                                <div className="w-5 h-5 rounded flex items-center justify-center border-2 border-slate-300 peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all bg-white relative">
                                                    {selected.includes(p.id) && (
                                                        <svg className="w-3 h-3 text-white absolute" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </label>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-black text-sm shrink-0 border border-slate-200 group-hover:border-emerald-200 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                                                    {p.name?.substring(0, 2).toUpperCase() || 'P'}
                                                </div>
                                                <div>
                                                    <p className="font-black tracking-tight text-slate-900">{p.name || 'Unknown Athlete'}</p>
                                                    <p className="text-[10px] font-mono text-slate-400 mt-0.5 uppercase tracking-widest break-all">ID: {p.id.substring(0, 8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="inline-flex flex-col items-center">
                                                <span className="font-extrabold text-slate-700">{p.games || 0}</span>
                                                <span className="text-[9px] uppercase tracking-widest font-black text-slate-400">Games</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                                <MapPin size={12} className="text-slate-400" /> {p.location || 'Unknown Zone'}
                                            </span>
                                        </td>
                                        <td className="p-4 pr-6">
                                            <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-widest">
                                                <Target size={12} className="text-emerald-600" /> {p.preferred || 'All Sports'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Sticky Action Bar */}
            {selected.length > 0 && (
                <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+70px)] md:bottom-8 left-4 right-4 md:left-[27rem] md:right-8 bg-slate-900 rounded-[2rem] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl z-40 animate-in slide-in-from-bottom-8 duration-500 border border-slate-700 overflow-hidden">
                    <img src={getSportImage('stadium', 2)} className="absolute inset-0 w-full h-full object-cover opacity-20 transition-transform duration-700 pointer-events-none" alt="" />
                    <div className="absolute inset-0 bg-slate-900/80 pointer-events-none" />

                    <div className="flex items-center gap-4 text-white relative z-10">
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center relative shadow-sm border border-white/20">
                            <span className="absolute -top-2 -right-2 bg-emerald-500 text-white w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-black shadow-lg shadow-emerald-500/20">{selected.length}</span>
                            <UserPlus size={20} className="text-emerald-400" />
                        </div>
                        <div>
                            <p className="font-black text-[10px] uppercase tracking-widest text-emerald-400 mb-0.5">Scouting Active</p>
                            <p className="text-xs text-slate-300 font-medium tracking-wide">Ready to draft team: <span className="text-white font-black drop-shadow-sm">Anna Nagar Strikers</span></p>
                        </div>
                    </div>

                    <button
                        onClick={handleDraft}
                        disabled={submitting}
                        className="w-full sm:w-auto px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-900 disabled:text-emerald-700 text-slate-950 font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 relative z-10"
                    >
                        {submitting ? 'Drafting Engine...' : 'Confirm Draft Protocol'}
                    </button>
                </div>
            )}
        </div>
    );
}
