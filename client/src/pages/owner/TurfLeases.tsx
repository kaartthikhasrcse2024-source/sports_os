import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { CheckCircle } from 'lucide-react';

export default function TurfLeases() {
    const [leases, setLeases] = useState<any[]>([]);

    useEffect(() => {
        const fetchLeases = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            try {
                const res = await fetch('http://localhost:3001/api/v1/leases/incoming', {
                    headers: { 'Authorization': `Bearer ${session?.access_token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        setLeases(data);
                    } else {
                        setLeases([]);
                    }
                } else {
                    setLeases([]);
                }
            } catch (e) {
                setLeases([]);
            }
        };
        fetchLeases();
    }, []);

    return (
        <div className="bg-white border text-emerald-700 border-gray-200 p-8 rounded-none shadow-xl">
            <h2 className="text-xl text-gray-900 font-black uppercase mb-6 flex items-center gap-2">
                <CheckCircle className="text-emerald-600" /> Incoming Venue Leases
            </h2>
            {leases.length === 0 ? (
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider text-center py-4">No incoming lease constraints.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {leases.map(lease => (
                        <div key={lease.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative overflow-hidden">
                            <div className={`absolute right-0 top-0 border-b border-l text-[10px] px-2 py-1 uppercase tracking-widest font-black rounded-bl ${lease.status === 'APPROVED' ? 'bg-green-50 text-green-600 border-green-200'
                                : lease.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-200'
                                    : 'bg-yellow-50 text-yellow-600 border-yellow-200'}`}>
                                {lease.status}
                            </div>
                            <h3 className="text-gray-900 font-black tracking-tight mb-1">{lease.organizer_name || 'Tournament Organizer'}</h3>
                            <p className="text-xs font-bold uppercase text-gray-500 mb-1">{lease.facility_name || 'Mapped Arena'}</p>
                            <p className="text-xs text-gray-400 font-mono">Request ID: {lease.id.split('-')[0]}</p>

                            {lease.status === 'PENDING' && (
                                <div className="mt-4 flex gap-2">
                                    <button className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] uppercase tracking-widest font-black rounded transition">Approve</button>
                                    <button className="flex-1 py-2 bg-red-100 hover:bg-red-200 text-red-700 border border-red-200 text-[10px] uppercase tracking-widest font-black rounded transition">Reject</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
