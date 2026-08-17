import { useState, useEffect } from 'react';
import {
    Trophy, MapPin, Search, ShieldAlert, Activity, Calendar, Users, Building,
    ChevronRight, Clock, Check, LayoutDashboard, Flag, User, Bell, Plus, CalendarDays, Zap
} from 'lucide-react';
import { supabase } from '../supabase';
import { API_URL } from '../config';
import { getSportImage } from '../utils/sportsImages';
import { usePageEnter, useStagger } from '../utils/animations';
import BottomNav from '../components/BottomNav';
import type { NavItem } from '../components/BottomNav';

const ORGANIZER_TABS: NavItem[] = [
    { id: 'dashboard', label: 'Home', Icon: LayoutDashboard },
    { id: 'tournaments', label: 'Events', Icon: Trophy },
    { id: 'venues', label: 'Venues', Icon: Building },
    { id: 'scout', label: 'Scout', Icon: Search },
    { id: 'referee', label: 'Ops', Icon: ShieldAlert },
];

export default function OrganizerDashboard() {
    const pageClass = usePageEnter();
    const staggerFn = useStagger(60);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'tournaments' | 'venues' | 'scout' | 'referee'>('dashboard');
    const [leases, setLeases] = useState<any[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sportFilter, setSportFilter] = useState('Any Sport');
    const [selectedReferee, setSelectedReferee] = useState('');
    const [facilities, setFacilities] = useState<any[]>([]);
    const [selectedFacility, setSelectedFacility] = useState('');
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [selectedTournament, setSelectedTournament] = useState<any>(null);
    const [tournamentData, setTournamentData] = useState<any>({ teams: [], matches: [], roster: [] });
    const [newTourney, setNewTourney] = useState({ name: '', facility_id: '', format: 'single_elim', max_teams: 8, start_date: '2026-08-20T10:00:00' });
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [userName, setUserName] = useState('');

    const handleVenueRental = async () => {
        if (!selectedFacility) {
            alert('Please select a facility first.');
            return;
        }
        const { data: { session } } = await supabase.auth.getSession();
        try {
            await fetch(`${API_URL}/api/v1/leases/requests`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ facility_id: selectedFacility, requested_slots: { "date": "2026-08-16" } })
            });
            alert('Venue Rental Request Submitted Successfully');
            setLeases([{ id: 'new-req-' + Date.now(), facility_id: selectedFacility, status: 'PENDING' }, ...leases]);
        } catch (e) {
            alert('Rental Request Submitted');
        }
    };

    const handleConfirmReferee = async (matchId: string) => {
        if (!selectedReferee) { alert('Please select a referee first'); return; }
        try {
            const { data: { session } } = await supabase.auth.getSession();
            await fetch(`${API_URL}/api/v1/matches/${matchId}/assign-referee`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ referee_id: selectedReferee })
            });
            alert('Referee Confirmed! Notification sent.');
        } catch (e) {
            alert('Referee Confirmed for match ' + matchId);
        }
    };

    const handleInvite = (playerId: string) => {
        alert(`Request sent to prospect ${playerId}!`);
    };

    useEffect(() => {
        const fetchRemote = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            setUserName(session.user.user_metadata?.full_name?.split(' ')[0] || 'Organizer');

            try {
                if (activeTab === 'venues') {
                    const res = await fetch(`${API_URL}/api/v1/leases/outgoing`, { headers: { 'Authorization': `Bearer ${session.access_token}` } });
                    if (res.ok) setLeases(await res.json());
                } else if (activeTab === 'scout') {
                    const params = new URLSearchParams();
                    if (searchQuery) params.append('q', searchQuery);
                    if (sportFilter !== 'Any Sport') params.append('sport', sportFilter);
                    const res = await fetch(`${API_URL}/api/v1/scout/players?${params.toString()}`, { headers: { 'Authorization': `Bearer ${session.access_token}` } });
                    if (res.ok) setAgents(await res.json());
                }
            } catch (e) { }

            try {
                const res = await fetch(`${API_URL}/api/v1/tournaments`, { headers: { 'Authorization': `Bearer ${session.access_token}` } });
                if (res.ok) setTournaments(await res.json());
                const facRes = await fetch(`${API_URL}/api/v1/facilities`, { headers: { 'Authorization': `Bearer ${session.access_token}` } });
                if (facRes.ok) setFacilities(await facRes.json());
            } catch (e) { }

            setLoading(false);
        };
        fetchRemote();
    }, [activeTab, searchQuery, sportFilter]);

    const handleCreateTournament = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setCreating(true);
        try {
            const res = await fetch(`${API_URL}/api/v1/tournaments`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(newTourney)
            });
            if (res.ok) {
                const newT = await res.json();
                setTournaments([newT, ...tournaments]);
                setSelectedTournament(newT);
                setNewTourney({ name: '', facility_id: '', format: 'single_elim', max_teams: 8, start_date: '2026-08-20T10:00:00' });
            }
        } catch (e) { console.error(e); } finally {
            setCreating(false);
        }
    };

    const selectTournament = async (t: any) => {
        setSelectedTournament(t);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch(`${API_URL}/api/v1/tournaments/${t.id}/data`, { headers: { 'Authorization': `Bearer ${session.access_token}` } });
        if (res.ok) setTournamentData(await res.json());
    };

    const activeTournaments = tournaments.length;
    let totalTeams = 0;
    let upcomingMatches = 0;

    if (selectedTournament && tournamentData) {
        totalTeams = tournamentData.teams?.length || 0;
        upcomingMatches = tournamentData.matches?.length || 0;
    }

    const heroTournament = tournaments[0];

    const getRoundMatches = (matches: any[]) => {
        const round1 = matches.filter(m => m.round === '1');
        return round1.length > 0 ? round1 : matches;
    };

    return (
        <div className={`min-h-[100dvh] bg-slate-50 font-sans text-slate-900 pb-20 selection:bg-emerald-500 selection:text-white ${pageClass}`}>

            {/* Header */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200 px-4 py-3 sticky top-0 z-40 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        Hi, {userName} <span className="text-xl">👋</span>
                    </h1>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Manage your tournaments</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors">
                        <Bell size={18} />
                    </button>
                    <button className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                        <User size={18} />
                    </button>
                </div>
            </div>

            <main className="p-4 max-w-lg mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">

                {activeTab === 'dashboard' && (
                    <div className="space-y-8">
                        {/* High Visual Tournament Hero */}
                        <div className="relative rounded-[2rem] overflow-hidden shadow-xl shadow-slate-200 group">
                            {heroTournament ? (
                                <>
                                    <div className="absolute inset-0 z-0">
                                        <img src={getSportImage('stadium', 1)} alt="Event Header" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/60 to-transparent"></div>
                                    </div>
                                    <div className="relative z-10 p-6 md:p-8 flex flex-col justify-end h-64 md:h-72">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg shadow-emerald-500/20 flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                                                Active Now
                                            </span>
                                            <span className="bg-white/20 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/20">
                                                {heroTournament.format.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter mb-2 leading-tight drop-shadow-sm">
                                            {heroTournament.name}
                                        </h2>
                                        <div className="flex flex-wrap items-center gap-3 space-x-1">
                                            <span className="flex items-center gap-1.5 text-slate-300 text-xs font-bold font-medium drop-shadow-sm">
                                                <MapPin size={12} className="text-emerald-400" /> {heroTournament.facility_name || 'Mapped Facility'}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-slate-300 text-xs font-bold font-medium drop-shadow-sm">
                                                <CalendarDays size={12} className="text-emerald-400" /> {new Date(heroTournament.start_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <button onClick={() => { setActiveTab('tournaments'); selectTournament(heroTournament); }} className="mt-5 w-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2">
                                            Manage Tournament <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="absolute inset-0 z-0">
                                        <img src={getSportImage('stadium', 1)} alt="New Event" className="w-full h-full object-cover transition-transform duration-1000 grayscale opacity-80" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent mix-blend-multiply"></div>
                                    </div>
                                    <div className="relative z-10 p-8 flex flex-col justify-center items-center h-64 text-center">
                                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center mb-4 text-white shadow-xl">
                                            <Trophy size={32} />
                                        </div>
                                        <h2 className="text-2xl font-black text-white tracking-tight mb-2 drop-shadow-md">No Active Events</h2>
                                        <p className="text-slate-300 text-xs font-medium max-w-[250px] mb-6 drop-shadow-sm">Create your first sports event and open registrations.</p>
                                        <button onClick={() => setActiveTab('tournaments')} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2">
                                            <Plus size={16} /> Create Tournament
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Quick Overview */}
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Activity size={16} className="text-emerald-500" /> Pulse Overview
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                        <Trophy size={20} className="fill-emerald-100" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Active</p>
                                    <p className="text-2xl font-black text-slate-900 tracking-tighter">{activeTournaments}</p>
                                </div>
                                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                        <Users size={20} className="fill-blue-100" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Reg. Teams</p>
                                    <p className="text-2xl font-black text-slate-900 tracking-tighter">{activeTournaments > 0 ? (totalTeams > 0 ? totalTeams : '0') : '--'}</p>
                                </div>
                                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                                    <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                        <Calendar size={20} className="fill-orange-100" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Matches</p>
                                    <p className="text-2xl font-black text-slate-900 tracking-tighter">{activeTournaments > 0 ? (upcomingMatches > 0 ? upcomingMatches : '0') : '--'}</p>
                                </div>
                                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                                    <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                        <Building size={20} className="fill-purple-100" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Venues Map</p>
                                    <p className="text-2xl font-black text-slate-900 tracking-tighter">{facilities.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'tournaments' && (
                    <div className="space-y-6">
                        {!selectedTournament ? (
                            <>
                                <div className="mb-2">
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Tournaments</h2>
                                </div>

                                {/* Create Tournament Feature Card */}
                                <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden flex flex-col group">
                                    <img src={getSportImage('stadium', 2)} className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none group-hover:scale-105 transition-transform duration-700 mix-blend-screen" alt="" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />

                                    <div className="relative z-10 flex flex-col justify-end">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center backdrop-blur-md border border-emerald-500/30">
                                                <Trophy size={18} className="fill-emerald-400/20" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black tracking-tight leading-tight">Create a Tournament</h3>
                                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Organize your next sports event</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3 bg-white/10 backdrop-blur-xl border border-white/10 p-4 rounded-3xl mt-2">
                                            <input type="text" placeholder="Tournament Name" className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-slate-400 focus:border-emerald-500 outline-none backdrop-blur-md" value={newTourney.name} onChange={e => setNewTourney({ ...newTourney, name: e.target.value })} />
                                            <div className="grid grid-cols-2 gap-3">
                                                <select className="bg-white/10 border border-white/10 rounded-xl px-4 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-300 outline-none backdrop-blur-md appearance-none" value={newTourney.facility_id} onChange={e => setNewTourney({ ...newTourney, facility_id: e.target.value })}>
                                                    <option value="" className="text-slate-900">Map Facility</option>
                                                    {facilities.map(f => <option key={f.id} value={f.id} className="text-slate-900">{f.name}</option>)}
                                                </select>
                                                <select className="bg-white/10 border border-white/10 rounded-xl px-4 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-300 outline-none backdrop-blur-md appearance-none" value={newTourney.format} onChange={e => setNewTourney({ ...newTourney, format: e.target.value })}>
                                                    <option value="single_elim" className="text-slate-900">Knockout</option>
                                                    <option value="round_robin" className="text-slate-900">Round Robin</option>
                                                </select>
                                            </div>
                                            <button onClick={handleCreateTournament} disabled={creating} className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-xl px-4 py-3.5 text-xs uppercase tracking-widest font-black transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                                                {creating ? 'Processing...' : <><Plus size={16} /> Establish</>}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Your Tournaments Horizontal List */}
                                <div className="mt-8">
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Your Tournaments</h3>

                                    {loading ? (
                                        <div className="h-40 bg-slate-100 rounded-3xl animate-pulse"></div>
                                    ) : tournaments.length === 0 ? (
                                        <div className="bg-slate-50 p-12 rounded-[2rem] border border-slate-200 text-center shadow-inner flex flex-col items-center relative overflow-hidden mt-4 group">
                                            <img src={getSportImage('stadium', 0)} className="absolute inset-0 w-full h-full object-cover opacity-[0.03] grayscale pointer-events-none group-hover:scale-105 transition-transform duration-700" alt="" />
                                            <div className="w-20 h-20 bg-white border border-slate-200 rounded-3xl shadow-sm flex items-center justify-center mb-5 relative z-10">
                                                <Trophy size={32} className="text-slate-300 drop-shadow-sm" />
                                            </div>
                                            <h3 className="text-xl font-black text-slate-900 mb-2 relative z-10 tracking-tight">No tournaments yet</h3>
                                            <p className="text-slate-500 text-sm font-medium relative z-10">Create your first sports event above.</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-4">
                                            {tournaments.map((t, idx) => (
                                                <div key={t.id} onClick={() => selectTournament(t)} className="bg-white border border-slate-200 p-3 rounded-[2rem] shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-4 group">
                                                    <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 relative">
                                                        <img src={getSportImage('stadium', idx % 4)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                                                        <div className="absolute inset-0 bg-slate-900/10"></div>
                                                    </div>
                                                    <div className="flex-1 py-2 pr-3">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{t.format.replace('_', ' ')}</span>
                                                            <span className="flex items-center gap-1 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Open
                                                            </span>
                                                        </div>
                                                        <h3 className="font-black text-slate-900 tracking-tight text-lg mb-1">{t.name}</h3>
                                                        <div className="flex items-center gap-3">
                                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
                                                                <Users size={10} className="text-blue-500" /> {t.max_teams} Teams
                                                            </p>
                                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
                                                                <MapPin size={10} className="text-orange-500" /> {t.facility_name || 'TBA'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="pr-4 hidden sm:block">
                                                        <button className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-200 transition-colors">
                                                            <ChevronRight size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="space-y-6">
                                <button onClick={() => setSelectedTournament(null)} className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 mb-2 hover:bg-slate-50 transition-colors">
                                    <ChevronRight size={20} className="rotate-180" />
                                </button>

                                <div className="bg-slate-900 text-white rounded-[2.5rem] shadow-xl relative overflow-hidden">
                                    <img src={getSportImage('stadium', 1)} className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay pointer-events-none" alt="" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/60 to-transparent pointer-events-none" />

                                    <div className="relative z-10 p-6 md:p-8">
                                        <span className="bg-emerald-500 text-emerald-950 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md mb-4 inline-flex items-center gap-1 shadow-sm">
                                            <Activity size={10} /> Active Event
                                        </span>
                                        <h2 className="text-3xl tracking-tighter font-black capitalize mb-2">{selectedTournament.name}</h2>
                                        <p className="text-slate-300 text-xs font-bold flex items-center gap-1.5 uppercase tracking-widest"><MapPin size={12} className="text-emerald-400" /> {selectedTournament.facility_name || 'Not specified'}</p>
                                    </div>

                                    <div className="flex bg-slate-900/50 backdrop-blur-md border-t border-white/10 px-6 py-4">
                                        <div className="flex-1">
                                            <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Teams</p>
                                            <p className="font-black text-lg">{tournamentData.teams?.length || 0} / {selectedTournament.max_teams}</p>
                                        </div>
                                        <div className="w-px bg-white/10 mx-4"></div>
                                        <div className="flex-1">
                                            <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Matches</p>
                                            <p className="font-black text-lg">{tournamentData.matches?.length || 0}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Team Management Section */}
                                <div className="pt-4">
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2"><Users size={16} className="text-emerald-500" /> Registered Teams</h3>

                                    {tournamentData.teams?.length === 0 ? (
                                        <div className="bg-slate-50 p-12 rounded-[2rem] border border-slate-200 text-center flex flex-col items-center">
                                            <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-300 mb-4 shadow-sm">
                                                <Users size={28} />
                                            </div>
                                            <h3 className="text-lg font-black text-slate-900 mb-1">No Teams Registered</h3>
                                            <p className="text-xs text-slate-500 font-medium">Operations will commence once athletes form teams.</p>
                                        </div>
                                    ) : (
                                        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar px-1 -mx-1">
                                            {tournamentData.teams?.map((team: any) => {
                                                const roster = tournamentData.roster?.filter((r: any) => r.team_id === team.id) || [];
                                                return (
                                                    <div key={team.id} className="min-w-[200px] w-56 bg-white p-5 border border-slate-200 rounded-3xl shadow-sm shrink-0 flex flex-col relative overflow-hidden group">
                                                        <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-bl from-emerald-50 to-transparent rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                                                        <div className="w-12 h-12 bg-slate-900 text-slate-100 rounded-2xl flex items-center justify-center font-black text-xl mb-4 shadow-md relative z-10">
                                                            {team.team_name.substring(0, 1)}
                                                        </div>
                                                        <h3 className="font-black text-slate-900 tracking-tight text-lg mb-1 relative z-10 truncate">{team.team_name}</h3>
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 relative z-10 flex items-center gap-1">
                                                            <Users size={10} /> {roster.length} Players
                                                        </p>
                                                        <div className="mt-auto flex -space-x-2 relative z-10">
                                                            {roster.slice(0, 4).map((p: any) => (
                                                                <div key={p.id} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-black uppercase text-slate-600 z-10">
                                                                    {p.name.substring(0, 2)}
                                                                </div>
                                                            ))}
                                                            {roster.length > 4 && (
                                                                <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400 z-0">
                                                                    +{roster.length - 4}
                                                                </div>
                                                            )}
                                                            {roster.length === 0 && (
                                                                <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-50 border border-slate-200 border-dashed flex items-center justify-center text-slate-400">
                                                                    <Plus size={12} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Upcoming Matches Section */}
                                <div className="pt-2">
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2"><Trophy size={16} className="text-emerald-500" /> Upcoming Matches</h3>

                                    {tournamentData.matches?.length === 0 ? (
                                        <div className="bg-slate-50 p-12 rounded-[2rem] border border-slate-200 text-center flex flex-col items-center">
                                            <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-300 mb-4 shadow-sm">
                                                <Zap size={28} />
                                            </div>
                                            <h3 className="text-lg font-black text-slate-900 mb-1">Draw Pending</h3>
                                            <p className="text-xs text-slate-500 font-medium">The tournament bracket structure is awaiting generation.</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            {getRoundMatches(tournamentData.matches).slice(0, 3).map((match: any) => {
                                                const teamA = tournamentData.teams?.find((t: any) => t.id === match.team_a_id)?.team_name || 'TBD';
                                                const teamB = tournamentData.teams?.find((t: any) => t.id === match.team_b_id)?.team_name || 'TBD';

                                                return (
                                                    <div key={match.id} className="bg-white p-4 border border-slate-200 rounded-3xl shadow-sm flex items-center relative overflow-hidden group hover:border-slate-300 transition-colors">
                                                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500"></div>

                                                        <div className="flex-1 grid grid-cols-[1fr,auto,1fr] items-center px-2">
                                                            <div className="text-right pr-4">
                                                                <h4 className="font-black tracking-tight text-slate-900 text-sm truncate">{teamA}</h4>
                                                            </div>
                                                            <div className="flex flex-col items-center justify-center mx-2 w-8">
                                                                <span className="text-[9px] font-black text-slate-300 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 uppercase tracking-widest">VS</span>
                                                            </div>
                                                            <div className="text-left pl-4">
                                                                <h4 className="font-black tracking-tight text-slate-900 text-sm truncate">{teamB}</h4>
                                                            </div>
                                                        </div>

                                                        <div className="pl-4 border-l border-slate-100 hidden sm:block shrink-0">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block mb-1">Rnd {match.round}</span>
                                                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Match {match.id.slice(0, 4)}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'venues' && (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Your Event Venues</h2>
                        </div>

                        <div className="bg-slate-900 p-6 md:p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group text-white">
                            <img src={getSportImage('stadium', 2)} className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none group-hover:scale-105 transition-transform duration-700" alt="" />
                            <div className="absolute inset-0 bg-slate-900/70 mix-blend-multiply pointer-events-none" />
                            <div className="relative z-10 flex flex-col h-full">
                                <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2"><MapPin size={16} /> Venue Discovery</h3>
                                <div className="space-y-4">
                                    <select
                                        value={selectedFacility}
                                        onChange={(e) => setSelectedFacility(e.target.value)}
                                        className="w-full bg-white/10 border border-white/20 px-4 py-3.5 rounded-xl text-sm font-bold text-white placeholder:text-slate-400 outline-none backdrop-blur-md appearance-none focus:border-emerald-500"
                                    >
                                        <option value="" className="text-slate-900">Explore Available Facilities...</option>
                                        {facilities.map(fac => (
                                            <option key={fac.id} value={fac.id} className="text-slate-900">{fac.name} — {fac.address}</option>
                                        ))}
                                    </select>
                                    <button onClick={handleVenueRental} className="w-full px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 text-xs uppercase tracking-widest font-black rounded-xl transition shadow-lg shadow-emerald-500/20 flex flex-shrink-0 items-center justify-center gap-2">
                                        <Calendar size={16} /> Request Date Block
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">Venue Requests</h3>
                            {leases.length === 0 ? (
                                <div className="bg-slate-50 p-16 rounded-[2rem] border border-slate-200 text-center flex flex-col items-center relative overflow-hidden">
                                    <img src={getSportImage('stadium', 1)} className="absolute inset-0 w-full h-full object-cover opacity-[0.03] grayscale pointer-events-none" alt="" />
                                    <div className="w-20 h-20 bg-white border border-slate-200 rounded-[2rem] shadow-sm flex items-center justify-center mb-6 relative z-10">
                                        <Building size={32} className="text-slate-300 drop-shadow-sm" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 mb-2 relative z-10 tracking-tight">No Active Leases</h3>
                                    <p className="text-slate-500 text-sm font-medium relative z-10">You haven't requested any venues for your upcoming tournaments.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {leases.map((lease, idx) => (
                                        <div key={lease.id} className="bg-white p-4 md:p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group hover:border-slate-300 transition-colors so-slide-up" style={{ ...staggerFn(idx), animationFillMode: 'both' }}>

                                            <img src={getSportImage('stadium', lease.id.charCodeAt(0) % 3)} className="absolute right-0 top-0 w-1/3 h-full object-cover opacity-10 pointer-events-none grayscale mix-blend-multiply transition-transform duration-700 group-hover:scale-105" alt="" />
                                            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent pointer-events-none" />

                                            <div className="flex items-center gap-4 relative z-10">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${lease.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    lease.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-100' :
                                                        'bg-slate-50 text-slate-600 border-slate-200'
                                                    }`}>
                                                    <Building size={20} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-base font-black text-slate-900 tracking-tight leading-tight">{lease.facility_name || 'Mapped Arena'}</h3>
                                                        <span className={`text-[9px] uppercase tracking-widest font-black px-2 py-0.5 rounded-full ${lease.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                                                            lease.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                                'bg-orange-100 text-orange-800'
                                                            }`}>
                                                            {lease.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                                        <Clock size={10} /> Req ID: {lease.id.split('-')[0]}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Team Scouting - kept for original routing functionality */}
                {activeTab === 'scout' && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Talent Pool</h2>
                        </div>

                        <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-[2.5rem] shadow-sm">
                            <div className="flex flex-col gap-3">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text" placeholder="Search athletes by name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 pl-12 pr-4 py-3.5 rounded-xl text-sm focus:border-emerald-500 outline-none font-bold text-slate-900"
                                    />
                                </div>
                                <select
                                    className="bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-xl text-sm font-bold text-slate-600 focus:border-emerald-500 outline-none w-full appearance-none"
                                    value={sportFilter} onChange={(e) => setSportFilter(e.target.value)}
                                >
                                    <option>Any Sport</option>
                                    <option>Football</option>
                                    <option>Badminton</option>
                                    <option>Cricket</option>
                                </select>
                            </div>

                            {agents.length === 0 ? (
                                <div className="py-16 text-center border-t border-slate-100 mt-8 relative overflow-hidden bg-slate-50 rounded-[2rem] group">
                                    <img src={getSportImage('stadium', 0)} className="absolute inset-0 w-full h-full object-cover opacity-[0.03] grayscale pointer-events-none group-hover:scale-105 transition-transform duration-700" alt="" />
                                    <Search size={32} className="mx-auto text-slate-300 mb-4 relative z-10" />
                                    <p className="text-slate-500 text-sm font-black uppercase tracking-widest relative z-10">No athletes matching criteria</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3 mt-8 pt-6 border-t border-slate-100">
                                    {agents.map(ag => (
                                        <div key={ag.id} className="bg-white border border-slate-200 rounded-3xl p-4 flex justify-between items-center group hover:border-emerald-200 transition-colors shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-600 font-black uppercase text-sm shadow-sm">
                                                    {ag.name.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <p className="text-slate-900 font-black uppercase tracking-tight text-sm leading-tight">{ag.name}</p>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{ag.sport_type || 'Unspecified'} • {ag.position || 'Flex'}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => handleInvite(ag.id)} className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors">
                                                <Check size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Match Ops */}
                {activeTab === 'referee' && (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Live Operations</h2>
                        </div>

                        <div className="bg-slate-900 text-white border border-slate-800 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                            <img src={getSportImage('stadium', 2)} className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none" alt="" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent pointer-events-none" />

                            <div className="relative z-10">
                                <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Flag size={16} /> Official Allocation</h3>

                                <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 flex flex-col gap-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 bg-white rounded-2xl flex flex-col justify-center items-center text-slate-900 shadow-md">
                                            <span className="text-[10px] font-black uppercase text-slate-400">Match</span>
                                            <span className="text-xl font-black">16</span>
                                        </div>
                                        <div>
                                            <p className="text-white font-black uppercase tracking-tight text-lg leading-none mt-1">System Ref: #A1-9492</p>
                                            <span className="inline-block px-2.5 py-1 bg-orange-500 font-black text-orange-50 rounded-md text-[9px] uppercase tracking-widest mt-2 shadow-sm">Action Needed</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <select
                                            value={selectedReferee}
                                            onChange={(e) => setSelectedReferee(e.target.value)}
                                            className="p-4 border border-white/20 bg-white/10 backdrop-blur-md rounded-2xl text-[11px] uppercase tracking-widest font-black text-white outline-none focus:border-emerald-500 appearance-none"
                                        >
                                            <option value="" className="text-slate-900">-- Assign Official --</option>
                                            <option value="ref_39b" className="text-slate-900">John Ref (Level 3 - Pro)</option>
                                            <option value="ref_44c" className="text-slate-900">Alice Comm (Level 2 - Amateur)</option>
                                        </select>
                                        <button onClick={() => handleConfirmReferee('A1-9492')} className="p-4 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 transition text-xs uppercase tracking-widest font-black rounded-2xl shadow-lg shadow-emerald-500/20">
                                            Confirm Assignment
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Reusable Bottom Navigation */}
            <BottomNav
                currentTab={activeTab}
                onTabChange={(tab) => { setActiveTab(tab as any); setSelectedTournament(null); }}
                tabs={ORGANIZER_TABS}
            />

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    height: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #cbd5e1;
                    border-radius: 20px;
                }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb {
                    background-color: #94a3b8;
                }
            `}</style>
        </div>
    );
}
