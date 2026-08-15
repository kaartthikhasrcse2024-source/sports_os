import { useState, useEffect } from 'react';

export default function TournamentBracket() {
    const [tournament, setTournament] = useState<any>(null);
    const [data, setData] = useState<{ teams: any[], matches: any[] }>({ teams: [], matches: [] });

    const initDemoTournament = async () => {
        // 1. Create tournament
        const tRes = await fetch('http://localhost:3001/api/v1/tournaments', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Championship 2026', format: 'single_elim', max_teams: 8, start_date: new Date().toISOString() })
        });
        const t = await tRes.json();
        setTournament(t);

        // 2. Add 8 teams
        for (let i = 1; i <= 8; i++) {
            await fetch(`http://localhost:3001/api/v1/tournaments/${t.id}/teams`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ team_name: `Team ${i}` })
            });
        }

        // 3. Generate matches
        await fetch(`http://localhost:3001/api/v1/tournaments/${t.id}/generate`, { method: 'POST' });
        loadData(t.id);
    };

    const loadData = async (id: string) => {
        const res = await fetch(`http://localhost:3001/api/v1/tournaments/${id}/data`);
        setData(await res.json());
    };

    const setWinner = async (matchId: string, winnerId: string) => {
        await fetch(`http://localhost:3001/api/v1/tournaments/${tournament.id}/matches/${matchId}/winner`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ winner_id: winnerId })
        });
        loadData(tournament.id);
    };

    useEffect(() => {
        // Check if we have tournaments
        fetch('http://localhost:3001/api/v1/facilities/nearby?lat=0&lng=0').catch(() => { }); // warmup
    }, []);

    if (!tournament) {
        return (
            <div className="h-screen bg-gray-50 text-gray-900 flex flex-col items-center justify-center">
                <h1 className="text-3xl font-bold mb-4">Tournament Module Dashboard</h1>
                <button onClick={initDemoTournament} className="bg-emerald-600 text-dark-900 px-6 py-3 font-bold uppercase tracking-wider rounded">Seed 8-Team Demo Tournament</button>
            </div>
        );
    }

    // Parse matches mapped by their round dynamically
    const rounds = Array.from(new Set(data.matches.map((m: any) => m.round))).sort();
    const getTeamName = (tid: string) => data.teams.find(t => t.id === tid)?.team_name || 'TBD';

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 p-8 overflow-x-auto overflow-y-auto">
            <h1 className="text-2xl text-emerald-700 font-bold mb-8">Admin View: {tournament.name}</h1>

            <div className="flex gap-16 min-w-max">
                {rounds.map(r => (
                    <div key={r} className="flex flex-col justify-around gap-8 relative select-none">
                        <div className="text-center font-bold text-gray-500 absolute -top-8 w-full uppercase">Round {r}</div>
                        {data.matches.filter((m: any) => m.round === r).map((m: any) => (
                            <div key={m.id} className="w-56 bg-white border-2 border-gray-300 rounded overflow-hidden flex flex-col relative" style={{ minHeight: '80px' }}>

                                {/* Team A */}
                                <div className={`p-2 flex justify-between items-center cursor-pointer hover:bg-dark-700 transition ${m.winner_id === m.team_a_id ? 'bg-emerald-600/20 text-emerald-700' : ''}`}
                                    onClick={() => { if (m.team_a_id) setWinner(m.id, m.team_a_id); }}>
                                    <span className="font-semibold">{m.team_a_id ? getTeamName(m.team_a_id) : 'TBD'}</span>
                                    {m.winner_id === m.team_a_id && <span>🏆</span>}
                                    {m.team_a_id && !m.winner_id && <span className="text-xs text-gray-500 border border-gray-600 px-1 rounded hover:bg-gray-700">Win</span>}
                                </div>

                                <div className="h-px bg-dark-700 w-full" />

                                {/* Team B */}
                                <div className={`p-2 flex justify-between items-center cursor-pointer hover:bg-dark-700 transition ${m.winner_id === m.team_b_id ? 'bg-emerald-600/20 text-emerald-700' : ''}`}
                                    onClick={() => { if (m.team_b_id) setWinner(m.id, m.team_b_id); }}>
                                    <span className="font-semibold">{m.team_b_id ? getTeamName(m.team_b_id) : 'TBD'}</span>
                                    {m.winner_id === m.team_b_id && <span>🏆</span>}
                                    {m.team_b_id && !m.winner_id && <span className="text-xs text-gray-500 border border-gray-600 px-1 rounded hover:bg-gray-700">Win</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}

                {/* Final Champion Node */}
                {(() => {
                    const finalMatch = data.matches.find((m: any) => m.next_match_id === null);
                    if (finalMatch?.winner_id) {
                        return (
                            <div className="flex flex-col justify-center gap-8 relative select-none">
                                <div className="text-center font-bold text-emerald-700 absolute -top-8 w-full uppercase animate-pulse">CHAMPION</div>
                                <div className="w-56 bg-emerald-600 text-dark-900 border-2 border-emerald-600 rounded p-4 flex flex-col relative items-center shadow-[0_0_25px_rgba(234,179,8,0.5)] font-black text-xl text-center">
                                    🏆<br />{getTeamName(finalMatch.winner_id)}
                                </div>
                            </div>
                        );
                    }
                })()}
            </div>
        </div>
    );
}
