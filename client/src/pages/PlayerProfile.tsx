import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabase';

export default function PlayerProfile() {
    const { id } = useParams();
    const [data, setData] = useState<any>(null);
    const [athleticData, setAthleticData] = useState<any>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<any>({});

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setCurrentUser(session?.user || null);
        });

        fetch(`http://localhost:3001/api/v1/players/${id}/stats`)
            .then(res => res.json())
            .then(setData)
            .catch(console.error);

        fetch(`http://localhost:3001/api/v1/players/${id}/athletic`)
            .then(res => res.json())
            .then(data => {
                setAthleticData(data);
                if (data) setEditForm(data);
            })
            .catch(console.error);
    }, [id]);

    const handleSave = async () => {
        if (!currentUser) return;
        const { data: sessionData } = await supabase.auth.getSession();

        try {
            const res = await fetch('http://localhost:3001/api/v1/players/athletic', {
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

    if (!data) return <div className="h-screen bg-dark-900 text-white flex justify-center items-center">Loading Data...</div>;

    if (data.error && data.error === 'Player not found') {
        return (
            <div className="min-h-screen bg-dark-900 text-white p-8 max-w-4xl mx-auto flex flex-col items-center justify-center">
                <div className="text-4xl mb-4">⚠️</div>
                <h1 className="text-2xl font-bold text-gray-300">Player Profile Unavailable</h1>
                <p className="text-gray-400 mt-2">Could not find a profile under this ID.</p>
            </div>
        );
    }

    const isOwner = currentUser?.id === id;

    return (
        <div className="min-h-screen bg-dark-900 text-white p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-24 h-24 bg-dark-800 rounded-full flex items-center justify-center text-3xl font-black text-gray-500 border border-dark-700">P</div>
                    <div>
                        <h1 className="text-3xl font-bold">Player {id?.slice(0, 5)}</h1>
                        <div className="inline-flex items-center gap-2 mt-2 bg-blue-900/40 text-blue-400 border border-blue-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                            Referee Verified
                        </div>
                    </div>
                </div>
                {isOwner && (
                    <button onClick={() => setIsEditing(true)} className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded font-bold shadow-lg transition">
                        Edit Athletic Profile
                    </button>
                )}
            </div>

            {/* Athletic Identity Card */}
            <div className="bg-dark-800 rounded-xl p-6 border border-dark-700 mb-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-indigo-500"></div>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <span className="text-primary-400">⚡</span> Athletic Identity
                </h2>

                {athleticData && !athleticData.error ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="bg-dark-900 p-4 rounded-lg flex flex-col items-center justify-center text-center">
                            <span className="text-xs text-gray-500 uppercase">Height / Weight</span>
                            <span className="text-lg font-bold text-white mt-1">{athleticData.height_cm || '-'} cm / {athleticData.weight_kg || '-'} kg</span>
                        </div>
                        <div className="bg-dark-900 p-4 rounded-lg flex flex-col items-center justify-center text-center">
                            <span className="text-xs text-gray-500 uppercase">Role</span>
                            <span className="text-lg font-bold text-white mt-1">{athleticData.primary_position || 'N/A'}</span>
                        </div>
                        <div className="bg-dark-900 p-4 rounded-lg flex flex-col items-center justify-center text-center">
                            <span className="text-xs text-gray-500 uppercase">Speed (10m)</span>
                            <span className="text-lg font-bold text-primary-400 mt-1">{athleticData.sprint_10m_sec || '-'} s</span>
                        </div>
                        <div className="bg-dark-900 p-4 rounded-lg flex flex-col items-center justify-center text-center">
                            <span className="text-xs text-gray-500 uppercase">Status</span>
                            <span className="text-lg font-bold text-white mt-1 capitalize">{athleticData.playing_status?.replace('_', ' ') || 'Unknown'}</span>
                        </div>
                    </div>
                ) : (
                    <div className="text-gray-500 text-center py-4">No athletic data set up for this player yet.</div>
                )}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {data.career_totals && Object.entries(data.career_totals).map(([key, value]) => (
                    <div key={key} className="bg-dark-800 p-4 rounded border-t-2 border-primary-500 flex flex-col items-center justify-center text-center">
                        <span className="text-3xl font-black text-white">{Number(value) || 0}</span>
                        <span className="text-xs text-gray-500 uppercase tracking-widest mt-1">{key.replace('total_', '')}</span>
                    </div>
                ))}
            </div>

            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-800 max-w-lg w-full rounded-xl p-6 border border-dark-700">
                        <h2 className="text-2xl font-bold mb-6">Edit Athletic Profile</h2>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-1">Height (cm)</label>
                                <input type="number" value={editForm.height_cm || ''} onChange={(e) => setEditForm({ ...editForm, height_cm: parseInt(e.target.value) })} className="w-full bg-dark-900 border border-dark-700 rounded p-2 text-white" />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-1">Weight (kg)</label>
                                <input type="number" step="0.1" value={editForm.weight_kg || ''} onChange={(e) => setEditForm({ ...editForm, weight_kg: parseFloat(e.target.value) })} className="w-full bg-dark-900 border border-dark-700 rounded p-2 text-white" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-1">Primary Role</label>
                                <input type="text" value={editForm.primary_position || ''} onChange={(e) => setEditForm({ ...editForm, primary_position: e.target.value })} className="w-full bg-dark-900 border border-dark-700 rounded p-2 text-white" placeholder="e.g. Forward" />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-1">Status</label>
                                <select value={editForm.playing_status || ''} onChange={(e) => setEditForm({ ...editForm, playing_status: e.target.value })} className="w-full bg-dark-900 border border-dark-700 rounded p-2 text-white">
                                    <option value="">Select...</option>
                                    <option value="free_agent">Free Agent</option>
                                    <option value="in_team">In Team</option>
                                    <option value="rehabilitating">Rehabilitating</option>
                                </select>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={editForm.open_for_scouting || false} onChange={(e) => setEditForm({ ...editForm, open_for_scouting: e.target.checked })} className="form-checkbox text-primary-500 bg-dark-900 border-dark-700 rounded" />
                                <span className="text-sm font-medium">Open to Scouting / Offers</span>
                            </label>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded bg-dark-700 hover:bg-dark-600 text-white transition">Cancel</button>
                            <button onClick={handleSave} className="px-4 py-2 rounded bg-primary-600 hover:bg-primary-500 text-white font-bold transition">Save Profile</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
