import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { API_URL } from '../config';
import { Trophy, Activity, CalendarDays, MapPin } from 'lucide-react';
import { getSportImage } from '../utils/sportsImages';
import { prefersReducedMotion } from '../utils/animations';

export default function TournamentBracket({ tournamentId }: { tournamentId?: string }) {
    const [tournament, setTournament] = useState<any>(null);
    const [data, setData] = useState<{ teams: any[], matches: any[] }>({ teams: [], matches: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!tournamentId) {
            setLoading(false);
            return;
        }

        const loadData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            try {
                // Fetch tournament structural setup gracefully
                const tRes = await fetch(`${API_URL}/api/v1/tournaments`);
                if (tRes.ok) {
                    const tList = await tRes.json();
                    const t = tList.find((x: any) => x.id === tournamentId);
                    if (t) setTournament(t);
                }

                // Load explicit math limits resolving true roster branches
                const res = await fetch(`${API_URL}/api/v1/tournaments/${tournamentId}/data`);
                if (res.ok) {
                    setData(await res.json());
                }
            } catch (e) { console.error('Failed to load authentic bracket paths'); }
            finally { setLoading(false); }
        };
        loadData();
    }, [tournamentId]);

    const setWinner = async (matchId: string, winnerId: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Optimistic UI update could go here

        await fetch(`${API_URL}/api/v1/tournaments/${tournamentId}/matches/${matchId}/winner`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ winner_id: winnerId })
        });

        // Reload branch limits flawlessly enforcing clean states
        const res = await fetch(`${API_URL}/api/v1/tournaments/${tournamentId}/data`);
        if (res.ok) setData(await res.json());
    };

    if (loading) {
        return (
            <div className="h-[400px] bg-slate-50 flex justify-center items-center rounded-3xl">
                <div className="flex flex-col items-center gap-4">
                    <Activity className="text-emerald-500 w-12 h-12 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Constructing Bracket...</span>
                </div>
            </div>
        );
    }

    if (!tournament) {
        return (
            <div className="h-[400px] bg-slate-50 flex justify-center items-center p-6 rounded-3xl relative overflow-hidden group">
                <img src={getSportImage('stadium', 2)} className="absolute inset-0 w-full h-full object-cover opacity-10 grayscale group-hover:scale-105 transition-transform duration-700" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-100 to-transparent" />
                <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 text-center flex flex-col items-center max-w-md shadow-xl shadow-slate-200/50 relative z-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm">
                        <Trophy size={32} className="text-emerald-500 drop-shadow-sm" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Bracket Visualizer</h1>
                    <p className="text-slate-500 text-sm font-medium">Select an active tournament from your dashboard to visualize registered teams and progress.</p>
                </div>
            </div>
        );
    }

    // Parse matches mapped by their round dynamically
    const rounds = Array.from(new Set(data.matches.map((m: any) => m.round))).sort();
    const getTeamName = (tid: string) => data.teams.find(t => t.id === tid)?.team_name || 'TBD';

    return (
        <div className="bg-white text-slate-900 pb-10 font-sans selection:bg-emerald-500 selection:text-white rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-sm">
            {/* Header Hero Area */}
            <div className="bg-emerald-600 relative px-6 md:px-10 py-12 md:py-16 overflow-hidden">
                <div className="absolute inset-0">
                    <img src={getSportImage('stadium', 2)} alt="Cover" className="w-full h-full object-cover opacity-20 mix-blend-overlay" />
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/60 to-transparent" />
                </div>

                <div className="relative z-10 max-w-6xl mx-auto flex flex-col items-start gap-4">
                    <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md border border-white/20 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-1 shadow-sm">
                        <Activity size={12} className="animate-pulse" /> Tournament Bracket
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none shadow-sm">
                        {tournament.name}
                    </h1>

                    <div className="flex flex-wrap items-center gap-3 mt-4">
                        <span className="flex items-center gap-1.5 text-white text-xs font-bold bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 shadow-sm">
                            <CalendarDays size={14} className="text-emerald-300" /> {new Date(tournament.start_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1.5 text-white text-xs font-bold bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 shadow-sm uppercase">
                            <MapPin size={14} className="text-emerald-300" /> {tournament.format.replace('_', ' ')}
                        </span>
                        <span className="flex items-center gap-1.5 text-white text-xs font-bold bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 shadow-sm">
                            <Trophy size={14} className="text-yellow-400" /> ₹{tournament.prize_pool}
                        </span>
                    </div>
                </div>
            </div>

            <div className="w-full relative z-20 overflow-x-auto pb-10 pt-10 px-6 md:px-10 custom-scrollbar">
                {data.matches.length === 0 ? (
                    <div className="bg-slate-50 p-16 rounded-3xl border border-slate-200 text-center shadow-inner flex flex-col items-center relative overflow-hidden group">
                        <img src={getSportImage('stadium', 0)} className="absolute inset-0 w-full h-full object-cover opacity-[0.03] grayscale group-hover:scale-105 transition-transform duration-700" alt="" />
                        <div className="w-24 h-24 bg-white border border-slate-200 rounded-[2rem] shadow-sm flex items-center justify-center mb-6 relative z-10">
                            <Trophy size={40} className="text-slate-400 drop-shadow-sm" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2 relative z-10 tracking-tight">Draw Pending</h3>
                        <p className="text-slate-500 text-base font-medium relative z-10">Bracket will be generated once registration closes.</p>
                    </div>
                ) : (
                    <div className="min-w-max flex gap-20 select-none relative">
                        {/* Background pattern */}
                        <div className="absolute inset-0 opacity-[0.4] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#e2e8f0 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>

                        {rounds.map((r, i) => {
                            const isFinal = i === rounds.length - 1;
                            const roundMatches = data.matches.filter((m: any) => m.round === r);
                            return (
                                <div
                                    key={r}
                                    className={`flex flex-col justify-around gap-12 relative z-10 py-8 so-slide-right`}
                                    style={prefersReducedMotion() ? {} : { animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}
                                >
                                    <div className="text-center font-black text-slate-300 absolute top-0 w-full uppercase tracking-widest text-[10px]">
                                        {isFinal ? 'Championship' : `Round ${r}`}
                                    </div>

                                    {roundMatches.map((m: any, mi: number) => {
                                        const isMatchComplete = m.winner_id;
                                        const teamAWon = m.winner_id === m.team_a_id;
                                        const teamBWon = m.winner_id === m.team_b_id;

                                        return (
                                            <div
                                                key={m.id}
                                                className="relative group so-slide-up"
                                                style={prefersReducedMotion() ? {} : { animationDelay: `${i * 80 + mi * 60 + 40}ms`, animationFillMode: 'both' }}
                                            >
                                                {/* Connecting line to next match */}
                                                {m.next_match_id && (
                                                    <div className="absolute top-1/2 -right-10 w-10 h-0 border-t-2 border-slate-200 group-hover:border-emerald-300 transition-colors pointer-events-none"></div>
                                                )}

                                                <div className="w-64 bg-white border border-slate-200 rounded-3xl overflow-hidden flex flex-col shadow-sm transition-all duration-300 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-1 relative">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50/50 pointer-events-none"></div>

                                                    {/* Team A */}
                                                    <div className={`p-4 flex justify-between items-center cursor-pointer transition-colors border-b border-slate-100 relative z-10
                                                        ${teamAWon ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700'}
                                                        ${isMatchComplete && !teamAWon ? 'bg-slate-50 text-slate-400 opacity-60 grayscale' : ''}
                                                        ${!isMatchComplete ? 'hover:bg-slate-50' : ''}
                                                    `}
                                                        onClick={() => { if (m.team_a_id) setWinner(m.id, m.team_a_id); }}>
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center text-[10px] font-black uppercase tracking-widest shadow-sm
                                                                ${teamAWon ? 'bg-emerald-500 border-emerald-600 text-white shadow-emerald-500/20' : 'bg-white border-slate-200 text-slate-400'}
                                                            `}>
                                                                {m.team_a_id ? getTeamName(m.team_a_id).substring(0, 1) : '-'}
                                                            </div>
                                                            <span className="font-black text-sm uppercase tracking-tight">{m.team_a_id ? getTeamName(m.team_a_id) : 'TBD'}</span>
                                                        </div>
                                                        {teamAWon && (
                                                            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                                                <Trophy size={12} className="fill-emerald-600/20" />
                                                            </div>
                                                        )}
                                                        {m.team_a_id && !isMatchComplete && (
                                                            <button className="opacity-0 group-hover:opacity-100 text-[9px] font-black uppercase tracking-widest text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded shadow-sm hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all">
                                                                Adv
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* VS Divider */}
                                                    <div className="h-0 relative flex items-center justify-center z-20">
                                                        <div className="bg-white border border-slate-100 text-[8px] font-black text-slate-300 px-2 py-0.5 rounded absolute uppercase tracking-widest bg-clip-padding shadow-sm">VS</div>
                                                    </div>

                                                    {/* Team B */}
                                                    <div className={`p-4 flex justify-between items-center cursor-pointer transition-colors relative z-10
                                                        ${teamBWon ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700'}
                                                        ${isMatchComplete && !teamBWon ? 'bg-slate-50 text-slate-400 opacity-60 grayscale' : ''}
                                                        ${!isMatchComplete ? 'hover:bg-slate-50' : ''}
                                                    `}
                                                        onClick={() => { if (m.team_b_id) setWinner(m.id, m.team_b_id); }}>
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center text-[10px] font-black uppercase tracking-widest shadow-sm
                                                                ${teamBWon ? 'bg-emerald-500 border-emerald-600 text-white shadow-emerald-500/20' : 'bg-white border-slate-200 text-slate-400'}
                                                            `}>
                                                                {m.team_b_id ? getTeamName(m.team_b_id).substring(0, 1) : '-'}
                                                            </div>
                                                            <span className="font-black text-sm uppercase tracking-tight">{m.team_b_id ? getTeamName(m.team_b_id) : 'TBD'}</span>
                                                        </div>
                                                        {teamBWon && (
                                                            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                                                <Trophy size={12} className="fill-emerald-600/20" />
                                                            </div>
                                                        )}
                                                        {m.team_b_id && !isMatchComplete && (
                                                            <button className="opacity-0 group-hover:opacity-100 text-[9px] font-black uppercase tracking-widest text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded shadow-sm hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all">
                                                                Adv
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}

                        {/* Final Champion Node */}
                        {(() => {
                            const finalMatch = data.matches.find((m: any) => m.next_match_id === null);
                            if (finalMatch?.winner_id) {
                                return (
                                    <div className="flex flex-col justify-center gap-8 relative z-20 ml-4 animate-in fade-in zoom-in duration-500">
                                        <div className="absolute top-1/2 -left-[60px] w-[60px] h-0 border-t-2 border-emerald-200 pointer-events-none"></div>

                                        <div className="text-center font-black text-amber-500/70 absolute top-0 w-full uppercase tracking-widest text-[10px] animate-pulse">
                                            CHAMPION
                                        </div>

                                        <div className="w-64 bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-[2rem] p-8 flex flex-col items-center justify-center shadow-lg shadow-emerald-500/10 relative overflow-hidden group">
                                            <Trophy size={48} fill="currentColor" strokeWidth={1} className="text-emerald-500 mb-4 drop-shadow-sm" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Victor</span>
                                            <span className="font-black text-2xl text-slate-900 text-center leading-tight uppercase tracking-tighter">
                                                {getTeamName(finalMatch.winner_id)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            }
                        })()}
                    </div>
                )}
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #e2e8f0;
                    border-radius: 20px;
                }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb {
                    background-color: #cbd5e1;
                }
            `}</style>
        </div>
    );
}
