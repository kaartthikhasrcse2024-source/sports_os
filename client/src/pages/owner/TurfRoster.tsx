import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { ShieldCheck, UserPlus, CheckSquare } from 'lucide-react';

export default function TurfRoster() {
    const [roster, setRoster] = useState<any[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchRoster = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            try {
                const res = await fetch('http://localhost:3001/api/v1/owner/roster', {
                    headers: { 'Authorization': `Bearer ${session?.access_token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        setRoster(data);
                    } else {
                        console.error('Expected roster to be an array but got', data);
                        setRoster([]);
                    }
                } else {
                    console.error('Roster API failed', res.status);
                    setRoster([]);
                }
            } catch (e) {
                console.error('Fetch roster error', e);
                setRoster([]);
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
            const res = await fetch('http://localhost:3001/api/v1/owner/roster/draft-team', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamName: 'Anna Nagar Strikers', playerIds: selected })
            });
            const data = await res.json();
            alert(data.message);
            setSelected([]);
        } catch (e) { }
        setSubmitting(false);
    };

    return (
        <div className="bg-white border border-gray-200 p-8 rounded-none shadow-xl">
            <div className="mb-6 flex justify-between items-end">
                <h2 className="text-xl text-gray-900 font-black uppercase flex items-center gap-2"><ShieldCheck className="text-emerald-700" /> Home Turf Roster Directory</h2>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2">Only active local registrants shown</div>
            </div>

            <div className="overflow-x-auto border border-gray-200 mb-6">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="text-[10px] text-gray-500 uppercase font-black bg-gray-50 tracking-widest">
                        <tr>
                            <th className="p-4 w-12 text-center">
                                <CheckSquare size={14} className="inline" />
                            </th>
                            <th className="p-4">Profile ID</th>
                            <th className="p-4">Name</th>
                            <th className="p-4">Location</th>
                            <th className="p-4">Preferred Sport</th>
                            <th className="p-4">Games Played</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roster.map(p => (
                            <tr key={p.id} className="border-t border-gray-200 bg-white hover:bg-gray-100">
                                <td className="p-4 text-center">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 accent-emerald-600 bg-gray-50 border-gray-200"
                                        checked={selected.includes(p.id)}
                                        onChange={() => handleSelect(p.id)}
                                    />
                                </td>
                                <td className="p-4 font-mono text-[10px] uppercase text-emerald-700 tracking-wider">{p.id}</td>
                                <td className="p-4 font-bold text-gray-800">{p.name}</td>
                                <td className="p-4">{p.location}</td>
                                <td className="p-4 text-emerald-700 font-bold">{p.preferred}</td>
                                <td className="p-4 font-mono">{p.games}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selected.length > 0 && (
                <div className="p-6 border border-emerald-600/30 bg-emerald-600/10 flex items-center justify-between animate-pulse">
                    <div>
                        <p className="text-emerald-700 uppercase font-black tracking-widest text-sm mb-1">Draft Sequence Initiated</p>
                        <p className="text-xs text-gray-600">{selected.length} athlete(s) selected for invitation.</p>
                    </div>
                    <button
                        onClick={handleDraft}
                        disabled={submitting}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs tracking-widest transition-colors"
                    >
                        <UserPlus size={16} /> Form Team: Anna Nagar Strikers
                    </button>
                </div>
            )}
        </div>
    );
}
