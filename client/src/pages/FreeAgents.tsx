import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function FreeAgents() {
    const [agents, setAgents] = useState([]);
    const [sport, setSport] = useState('basketball');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetch(`http://localhost:3001/api/v1/players/free-agents?sport=${sport}`)
            .then(r => r.json())
            .then(setAgents)
            .finally(() => setLoading(false));
    }, [sport]);

    return (
        <div className="min-h-screen bg-dark-900 text-white p-8">
            <h1 className="text-3xl font-black text-primary-500 mb-2 uppercase tracking-wide">Draft Board</h1>
            <p className="text-gray-400 mb-8 max-w-2xl">Browse athletes explicitly flagged as Open to Play or actively Looking for Team mapped across positional matrices.</p>

            <div className="flex gap-2 mb-8">
                {['basketball', 'football', 'tennis'].map(s => (
                    <button key={s} onClick={() => setSport(s)} className={`px-4 py-2 rounded font-bold uppercase tracking-wider text-xs border ${sport === s ? 'bg-primary-500 text-dark-900 border-primary-500' : 'bg-transparent text-gray-500 border-dark-700 hover:text-white'}`}>
                        {s}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {!loading && agents.map((a: any) => (
                    <Link to={`/profile/${a.id}`} key={a.id} className="bg-dark-800 border border-dark-700 rounded p-5 hover:border-primary-500 transition group relative overflow-hidden flex flex-col items-start block">
                        <div className="text-xs bg-dark-700 text-gray-300 uppercase tracking-widest px-2 py-1 rounded mb-3 group-hover:bg-primary-500/20 group-hover:text-primary-400 transition">{a.position || 'FLEX'}</div>
                        <h2 className="text-xl font-bold mb-1">{a.name}</h2>

                        <div className="flex gap-4 mt-6 w-full pt-4 border-t border-dark-700">
                            <div>
                                <div className="text-lg font-mono font-black">{Number(a.win_rate).toFixed(1)}%</div>
                                <div className="text-[10px] text-gray-500 uppercase tracking-wider">Win Rate</div>
                            </div>
                            <div className="ml-auto">
                                <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 shadow-[0_0_10px_rgba(34,197,94,0.6)]"></span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">L.F.T</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {!loading && agents.length === 0 && (
                <div className="text-center py-20 text-gray-600 border border-dashed border-dark-700 rounded">
                    No verified free agents mapping to specific parameters actively.
                </div>
            )}
        </div>
    );
}
