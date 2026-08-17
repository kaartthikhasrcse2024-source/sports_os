import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';
import { Users, Target, Activity, MapPin, ChevronLeft } from 'lucide-react';
import { getSportImage } from '../utils/sportsImages';
import { usePageEnter } from '../utils/animations';

export default function FreeAgents() {
    const pageClass = usePageEnter();
    const [agents, setAgents] = useState([]);
    const [sport, setSport] = useState('basketball');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetch(`${API_URL}/api/v1/players/free-agents?sport=${sport}`)
            .then(r => r.json())
            .then(setAgents)
            .finally(() => setLoading(false));
    }, [sport]);

    return (
        <div className={`min-h-screen bg-slate-50 text-slate-900 pb-20 ${pageClass}`}>
            {/* HERO SECTION */}
            <div className="bg-slate-900 pt-[calc(env(safe-area-inset-top)+2rem)] px-6 pb-12 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
                <img
                    src={getSportImage(sport, 1)}
                    alt="Background"
                    className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay transition-opacity duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-900" />

                <div className="relative z-10">
                    <Link to="/dashboard" className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors mb-6 text-xs font-bold uppercase tracking-widest bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                        <ChevronLeft size={14} /> Back to Dashboard
                    </Link>

                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2 leading-tight drop-shadow-md flex items-center gap-3">
                        <Users className="text-emerald-500 w-10 h-10" /> Draft Board
                    </h1>
                    <p className="text-slate-400 font-medium max-w-md text-sm">
                        Scout free agents actively looking for teams. Filter by primary sport and recruit top talent for your roster.
                    </p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 mt-8 space-y-8">
                {/* SPORT FILTER BAR */}
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
                    {['basketball', 'football', 'tennis', 'cricket'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setSport(s)}
                            className={`snap-start shrink-0 px-6 py-3.5 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 shadow-sm ${sport === s
                                ? 'bg-emerald-500 text-slate-900 shadow-emerald-500/20'
                                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                }`}>
                            {sport === s ? <Target size={14} /> : null}
                            {s}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse bg-white rounded-[2rem] h-64 w-full border border-slate-100 shadow-sm"></div>
                        ))}
                    </div>
                ) : agents.length === 0 ? (
                    <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 text-center flex flex-col items-center shadow-sm relative overflow-hidden">
                        <img src={getSportImage('player_avatars', 0)} className="absolute inset-0 w-full h-full object-cover opacity-5 grayscale" />
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100 relative z-10">
                            <Users size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2 relative z-10">No Agents Available</h3>
                        <p className="text-slate-500 text-sm font-medium max-w-sm mx-auto relative z-10">There are no verified free agents in our registry mapping to active scouting requests for this sport.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {agents.map((a: any, index) => (
                            <Link to={`/profile/${a.id}`} key={a.id} className={`group bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-200 hover:shadow-xl hover:border-emerald-200 transition-all duration-300 flex flex-col so-fade-up so-delay-${Math.min(index, 6)}`}>
                                <div className="h-40 bg-slate-100 relative overflow-hidden">
                                    <img
                                        src={getSportImage('player_avatars', a.id.charCodeAt(0) || index)}
                                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />

                                    <div className="absolute top-3 left-3 flex gap-2">
                                        <div className="bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow-md flex items-center gap-1">
                                            <Activity size={10} /> {a.position || 'FLEX'}
                                        </div>
                                    </div>

                                    <div className="absolute top-3 right-3">
                                        {a.open_for_scouting !== false && (
                                            <div className="bg-white/95 backdrop-blur text-slate-900 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-md flex items-center gap-1 border border-slate-100">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> L.F.T
                                            </div>
                                        )}
                                    </div>

                                    <div className="absolute bottom-3 left-4 right-4">
                                        <h2 className="text-xl font-black text-white tracking-tight leading-tight">{a.name}</h2>
                                        <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                            <MapPin size={10} /> Local Zone
                                        </p>
                                    </div>
                                </div>

                                <div className="p-5 flex-1 flex flex-col justify-between bg-white relative z-10 border-t border-slate-100">
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center text-center">
                                            <div className="text-lg font-black text-slate-900 tracking-tight tabular-nums">{Number(a.win_rate || 50).toFixed(1)}%</div>
                                            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Win Rate</div>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center text-center">
                                            <div className="text-lg font-black text-slate-900 tracking-tight tabular-nums uppercase">{a.skill_level || 'PRO'}</div>
                                            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Skill Tier</div>
                                        </div>
                                    </div>
                                    <button className="w-full bg-slate-900 group-hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] py-3 rounded-xl transition-colors shadow-sm">
                                        View Identity
                                    </button>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
