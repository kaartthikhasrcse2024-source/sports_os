import { useState } from 'react';

export default function RefereeScorecard() {
    const [matchId, setMatchId] = useState('');
    const [stats, setStats] = useState([{ player_id: '', team_id: '', points: 0, fouls: 0 }]);
    const [submitted, setSubmitted] = useState(false);

    const submit = async () => {
        const payload = { referee_id: "00000000-0000-0000-0000-333333333333", stats };
        await fetch(`http://localhost:3001/api/v1/referees/matches/${matchId}/scorecard`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        setSubmitted(true);
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 p-4 max-w-lg mx-auto flex flex-col">
            <h1 className="text-2xl font-black text-emerald-700 mb-6 uppercase tracking-widest text-center border-b border-gray-300 pb-4">Referee Portal</h1>

            {!submitted ? (
                <div className="flex flex-col gap-6 flex-1">
                    <div>
                        <label className="text-gray-600 text-sm font-bold">Match ID</label>
                        <input type="text" className="w-full bg-white border-none rounded p-3 mt-1 text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500" value={matchId} onChange={e => setMatchId(e.target.value)} placeholder="0000-..." />
                    </div>

                    <div className="bg-white rounded p-4 border-l-4 border-emerald-600">
                        <h3 className="font-bold mb-3 text-sm text-gray-700">PLAYER STATS ENTRY</h3>
                        <div className="space-y-4">
                            {stats.map((s, idx) => (
                                <div key={idx} className="flex flex-wrap gap-2 pt-2 border-t border-gray-300">
                                    <input type="text" placeholder="Player ID" className="bg-gray-50 border-none rounded p-2 text-sm flex-1 text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500" value={s.player_id} onChange={e => { const n = [...stats]; n[idx].player_id = e.target.value; setStats(n); }} />
                                    <input type="text" placeholder="Team ID" className="bg-gray-50 border-none rounded p-2 text-sm w-32 text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500" value={s.team_id} onChange={e => { const n = [...stats]; n[idx].team_id = e.target.value; setStats(n); }} />
                                    <div className="w-full flex gap-2">
                                        <input type="number" placeholder="Pts" className="bg-gray-50 border-none rounded p-2 text-sm w-16 text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500" value={s.points} onChange={e => { const n = [...stats]; n[idx].points = parseInt(e.target.value); setStats(n); }} />
                                        <input type="number" placeholder="Fls" className="bg-gray-50 border-none rounded p-2 text-sm w-16 text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500" value={s.fouls} onChange={e => { const n = [...stats]; n[idx].fouls = parseInt(e.target.value); setStats(n); }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setStats([...stats, { player_id: '', team_id: '', points: 0, fouls: 0 }])} className="text-xs text-emerald-700 mt-4">+ Add Log</button>
                    </div>

                    <button onClick={submit} className="bg-emerald-600 hover:bg-emerald-600 text-dark-900 font-bold p-4 rounded uppercase w-full mt-auto mb-20 shadow-[0_0_15px_rgba(234,179,8,0.3)]">Submit Verified Score</button>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="text-4xl mb-4">🏆</div>
                    <h2 className="text-xl font-bold text-green-400">Scorecard Verified</h2>
                    <p className="text-gray-600 text-sm mt-2">Bracket advanced automatically.</p>
                </div>
            )}
        </div>
    );
}
