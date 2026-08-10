import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function PlayerProfile() {
    const { id } = useParams();
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        fetch(`http://localhost:3001/api/v1/players/${id}/stats`)
            .then(res => res.json())
            .then(setData)
            .catch(console.error);
    }, [id]);

    if (!data) return <div className="h-screen bg-dark-900 text-white flex justify-center items-center">Loading Data...</div>;

    if (data.error || !data.career_totals) {
        return (
            <div className="min-h-screen bg-dark-900 text-white p-8 max-w-4xl mx-auto flex flex-col items-center justify-center">
                <div className="text-4xl mb-4">⚠️</div>
                <h1 className="text-2xl font-bold text-gray-300">Player Profile Unavailable</h1>
                <p className="text-gray-500 mt-2">Could not fetch stats for this player. ({data.error || 'No totals found'})</p>
                {id === 'guest-id' && (
                    <p className="text-primary-500 mt-4 text-sm mt-8 border border-primary-500/50 bg-primary-500/10 p-4 rounded text-center">
                        You are browsing as a guest. Your guest ID is not registered in the game database.
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-900 text-white p-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-24 h-24 bg-dark-800 rounded-full flex items-center justify-center text-3xl font-black text-gray-500 border border-dark-700">P</div>
                <div>
                    <h1 className="text-3xl font-bold">Player {id?.slice(0, 5)}</h1>
                    <div className="inline-flex items-center gap-2 mt-2 bg-blue-900/40 text-blue-400 border border-blue-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                        Referee Verified
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {Object.entries(data.career_totals).map(([key, value]) => (
                    <div key={key} className="bg-dark-800 p-4 rounded border-t-2 border-primary-500 flex flex-col items-center justify-center text-center">
                        <span className="text-3xl font-black text-white">{Number(value) || 0}</span>
                        <span className="text-xs text-gray-500 uppercase tracking-widest mt-1">{key.replace('total_', '')}</span>
                    </div>
                ))}
            </div>

            <h3 className="font-bold text-gray-300 uppercase tracking-wider mb-4 border-b border-dark-800 pb-2">Tournament Breakdown Activity</h3>
            <div className="bg-dark-800 rounded border border-dark-700 overflow-hidden text-sm">
                <table className="w-full text-left">
                    <thead className="bg-dark-900/50 text-gray-500 text-xs uppercase">
                        <tr>
                            <th className="p-3">Tournament</th>
                            <th className="p-3">Round</th>
                            <th className="p-3 text-right">Pts</th>
                            <th className="p-3 text-right">Fouls</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.history?.map((h: any) => (
                            <tr key={h.id} className="border-t border-dark-700 hover:bg-dark-700 transition">
                                <td className="p-3 font-semibold text-primary-400">{h.tournament_name}</td>
                                <td className="p-3 text-gray-300">R{h.round}</td>
                                <td className="p-3 text-right font-mono">{h.points}</td>
                                <td className="p-3 text-right font-mono text-red-400">{h.fouls}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {data.history?.length === 0 && <div className="p-4 text-center text-gray-600">No verified match logs explicitly mapped.</div>}
            </div>
        </div>
    );
}
