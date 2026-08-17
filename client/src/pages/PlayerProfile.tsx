import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { ShieldCheck, Activity, Edit3, Save, X, Trophy, Target, Zap, MapPin, Search } from 'lucide-react';
import { API_URL } from '../config';
import { getSportImage } from '../utils/sportsImages';
import { useInView, useCounter } from '../utils/animations';

/** Animated stat card that counts from 0 → value on first viewport entry. */
function AnimatedStatCard({ label, value, delay = 0 }: { label: string; value: number; delay?: number }) {
    const [ref, visible] = useInView(0.2);
    const count = useCounter(visible ? value : 0, 1400);
    return (
        <div
            ref={ref}
            className="bg-white p-6 rounded-3xl border-b-4 border-emerald-500 relative overflow-hidden group so-slide-up"
            style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
        >
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-full blur-xl -mr-4 -mt-4 transition-transform group-hover:scale-150" />
            <div className="relative z-10 flex flex-col items-center text-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 line-clamp-1">{label}</span>
                <span className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums">{count}</span>
            </div>
        </div>
    );
}

export default function PlayerProfile() {
    // If no ID is provided in URL, we assuming the person is viewing their own profile via BottomNav
    const params = useParams();
    const [id, setId] = useState<string | null>(params.id || null);

    const [data, setData] = useState<any>(null);
    const [athleticData, setAthleticData] = useState<any>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<any>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initProfile = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const user = session?.user || null;
                setCurrentUser(user);

                // Determine target player ID
                let targetId = params.id;
                if (!targetId && user) {
                    targetId = user.id;
                    setId(user.id);
                }

                if (!targetId) {
                    setLoading(false);
                    return;
                }

                const [statsRes, athleticRes] = await Promise.all([
                    fetch(`${API_URL}/api/v1/players/${targetId}/stats`),
                    fetch(`${API_URL}/api/v1/players/${targetId}/athletic`)
                ]);

                if (statsRes.ok) setData(await statsRes.json());

                if (athleticRes.ok) {
                    const athData = await athleticRes.json();
                    setAthleticData(athData);
                    if (athData) setEditForm(athData);
                }
            } catch (e) {
                console.error("Failed loading profile", e);
            } finally {
                setLoading(false);
            }
        };

        initProfile();
    }, [params.id]);

    const handleSave = async () => {
        if (!currentUser) return;
        const { data: sessionData } = await supabase.auth.getSession();

        try {
            const res = await fetch(`${API_URL}/api/v1/players/athletic`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionData.session?.access_token}`
                },
                body: JSON.stringify(editForm)
            });
            const updated = await res.json();
            setAthleticData(updated);
            setIsEditing(false);
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex justify-center items-center">
                <div className="flex flex-col items-center gap-4">
                    <Activity className="text-emerald-500 w-12 h-12 animate-pulse" />
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Loading Profile...</span>
                </div>
            </div>
        );
    }

    if (!data || (data.error && data.error === 'Player not found')) {
        return (
            <div className="min-h-screen bg-slate-50 flex justify-center items-center p-6">
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center flex flex-col items-center max-w-md shadow-xl">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                        <Search size={32} className="text-slate-500" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Profile Not Found</h1>
                    <p className="text-slate-500 font-medium mb-8">We couldn't locate the athletic identity for this user. They may not have completed registration.</p>
                    <Link to="/dashboard" className="bg-white text-slate-900 font-bold uppercase tracking-widest text-xs px-8 py-4 rounded-xl shadow-lg hover:bg-slate-100 transition-colors">
                        Return Home
                    </Link>
                </div>
            </div>
        );
    }

    const isOwner = currentUser?.id === id;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 font-sans selection:bg-emerald-500 selection:text-slate-900 relative">

            {/* Epic Header Hero Area */}
            <div className="bg-slate-900 relative rounded-b-[3rem] shadow-xl pt-[calc(env(safe-area-inset-top)+2rem)] px-6 pb-20 overflow-hidden">
                <img
                    src={getSportImage('stadium', id?.charCodeAt(0) || 0)}
                    alt="Cover"
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-slate-900/20" />

                <div className="relative z-10 max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left mt-8">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-32 h-32 md:w-36 md:h-36 bg-slate-200 rounded-full border-[5px] border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.4)] overflow-hidden relative">
                                <img src={getSportImage('player_avatars', id?.charCodeAt(0) || 0)} className="absolute inset-0 w-full h-full object-cover" />
                            </div>
                            <div className="absolute -bottom-2 md:bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-full border-4 border-slate-900 shadow-xl" title="Officially Verified">
                                <ShieldCheck size={20} />
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2 leading-tight drop-shadow-md">{data.player_name || `Athlete ${id?.slice(0, 5)}`}</h1>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3">
                                <span className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500 text-emerald-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                                    <Activity size={12} /> PROSPECT
                                </span>
                                {athleticData?.open_for_scouting && (
                                    <span className="bg-indigo-500/20 backdrop-blur-md border border-indigo-500/50 text-indigo-300 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                                        <Target size={12} /> OPEN TO OFFERS
                                    </span>
                                )}
                                <span className="bg-white/10 backdrop-blur-md text-white/90 border border-white/20 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                                    <MapPin size={12} /> GLOBAL ZONE
                                </span>
                            </div>
                        </div>
                    </div>

                    {isOwner && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="bg-white hover:bg-slate-50 text-slate-900 px-6 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-2xl shrink-0"
                        >
                            <Edit3 size={16} /> Edit Profile
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-5 -mt-8 relative z-20 space-y-6">

                {/* Physical Attributes Premium Cards */}
                <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 flex items-center justify-between overflow-hidden relative">
                    <div className="absolute -right-12 -top-12 opacity-5 pointer-events-none">
                        <Activity size={200} />
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full text-center relative z-10 divide-x divide-slate-100">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1 shadow-sm">Spec</span>
                            <span className="text-xl font-black text-slate-900 tracking-tight">
                                {athleticData?.height_cm || '-'} <span className="text-xs text-slate-500 font-bold uppercase">cm</span> / {athleticData?.weight_kg || '-'} <span className="text-xs text-slate-500 font-bold uppercase">kg</span>
                            </span>
                        </div>
                        <div className="flex flex-col border-l border-slate-100 lg:border-none pl-6 lg:pl-0">
                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Primary Role</span>
                            <span className="text-xl font-black text-emerald-600 tracking-tight capitalize">
                                {athleticData?.primary_position || 'Utility'}
                            </span>
                        </div>
                        <div className="flex flex-col border-t border-slate-100 lg:border-t-0 pt-6 lg:pt-0">
                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1 flex items-center justify-center gap-1"><Zap size={10} className="text-amber-500" /> Speed (10m)</span>
                            <span className="text-xl font-black text-slate-900 tracking-tight">
                                {athleticData?.sprint_10m_sec ? `${athleticData.sprint_10m_sec}s` : 'Unrated'}
                            </span>
                        </div>
                        <div className="flex flex-col border-t lg:border-t-0 border-l lg:border-l border-slate-100 pt-6 lg:pt-0 pl-6 lg:pl-0">
                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Status</span>
                            <span className="text-lg font-black text-slate-900 tracking-tight capitalize">
                                {athleticData?.playing_status ? athleticData.playing_status.replace('_', ' ') : 'Active'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Performance Metrics */}
                <div>
                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-4 px-2">
                        <Trophy className="text-emerald-500 w-5 h-5" /> Career Statistics
                    </h2>

                    {data.career_totals && Object.keys(data.career_totals).length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(data.career_totals).map(([key, value], idx) => {
                                const formattedKey = key.replace('total_', '').replace(/_/g, ' ');
                                return (
                                    <AnimatedStatCard
                                        key={key}
                                        label={formattedKey}
                                        value={Number(value) || 0}
                                        delay={idx * 100}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center flex flex-col items-center">
                            <Target size={40} className="text-slate-200 mb-4" />
                            <p className="text-slate-500 font-bold tracking-tight">No match statistics recorded yet.</p>
                            <p className="text-sm text-slate-500 font-medium">Join tournaments and log matches to build your athletic resume.</p>
                        </div>
                    )}
                </div>

            </div>

            {/* Premium Full-Screen Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6 animate-in slide-in-from-bottom-6 md:fade-in duration-300">
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm" onClick={() => setIsEditing(false)} />
                    <div className="bg-white w-full max-w-2xl rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="bg-white p-6 flex justify-between items-center sticky top-0 z-20">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <Edit3 className="text-emerald-400" /> Update Athletic Form
                            </h2>
                            <button onClick={() => setIsEditing(false)} className="bg-slate-50/80 p-2 rounded-full text-slate-900 hover:bg-white/20 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Scrolling Form Area */}
                        <div className="p-6 md:p-8 overflow-y-auto space-y-6">

                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">Physical Specifications</h3>
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">Height (cm)</label>
                                        <input type="number" value={editForm.height_cm || ''} onChange={(e) => setEditForm({ ...editForm, height_cm: parseInt(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" placeholder="E.g. 180" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">Weight (kg)</label>
                                        <input type="number" step="0.1" value={editForm.weight_kg || ''} onChange={(e) => setEditForm({ ...editForm, weight_kg: parseFloat(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" placeholder="E.g. 75.5" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-2">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">Tactical Role</h3>
                                <div className="grid grid-cols-1 gap-5">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">Primary Assignment</label>
                                        <input type="text" value={editForm.primary_position || ''} onChange={(e) => setEditForm({ ...editForm, primary_position: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" placeholder="Point Guard, Striker, Defender..." />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">Availability Status</label>
                                        <select value={editForm.playing_status || ''} onChange={(e) => setEditForm({ ...editForm, playing_status: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium appearance-none">
                                            <option value="">Select current status...</option>
                                            <option value="free_agent">Free Agent (Seeking Team)</option>
                                            <option value="in_team">Signed / In Team</option>
                                            <option value="rehabilitating">Rehabilitating (Injured)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <label className="flex items-start gap-4 p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 cursor-pointer hover:bg-indigo-50 transition-colors">
                                    <div className="flex h-5 items-center mt-0.5">
                                        <input type="checkbox" checked={editForm.open_for_scouting || false} onChange={(e) => setEditForm({ ...editForm, open_for_scouting: e.target.checked })} className="h-5 w-5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-600 bg-white" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-900">Open for Global Scouting</span>
                                        <span className="text-xs text-slate-500 font-medium">Allow organizers and scouts to view your detailed metrics and send recruitment offers.</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-slate-50 p-6 border-t border-slate-200 flex flex-col md:flex-row justify-end gap-3 rounded-b-[2.5rem]">
                            <button onClick={() => setIsEditing(false)} className="w-full md:w-auto px-6 py-4 rounded-xl font-bold uppercase tracking-widest text-xs bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleSave} className="w-full md:w-auto px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                                <Save size={16} /> Save Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
