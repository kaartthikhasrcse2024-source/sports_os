import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { CheckCircle, Clock, Check, X, Building, Calendar as CalendarIcon, Briefcase, MapPin } from 'lucide-react';
import { API_URL } from '../../config';
import { getSportImage } from '../../utils/sportsImages';
import { useStagger } from '../../utils/animations';

export default function TurfLeases() {
    const stagger = useStagger(80);
    const [leases, setLeases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const handleAction = async (leaseId: string, action: 'APPROVE' | 'REJECT') => {
        const { data: { session } } = await supabase.auth.getSession();
        try {
            const res = await fetch(`${API_URL}/api/v1/leases/requests/${leaseId}/${action.toLowerCase()}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                setLeases(leases.map(l => l.id === leaseId ? { ...l, status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' } : l));
            } else {
                const data = await res.json();
                alert('Action failed: ' + (data.error || 'Unknown error'));
            }
        } catch (e) {
            console.error(e);
            alert('Failed to execute action on this lease request due to a network error.');
        }
    };

    useEffect(() => {
        const fetchLeases = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            try {
                const res = await fetch(`${API_URL}/api/v1/leases/incoming`, {
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
            } finally {
                setLoading(false);
            }
        };
        fetchLeases();
    }, []);

    return (
        <div className="animate-in fade-in duration-300">
            <div className="flex flex-col mb-8">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                    <Briefcase className="text-emerald-600" size={24} /> Organizer Leases
                </h2>
                <p className="text-slate-500 font-medium text-sm mt-1">Review dedicated slot reservations for scheduled tournaments.</p>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2].map(i => (
                        <div key={i} className="animate-pulse bg-white border border-slate-200 rounded-3xl h-32 w-full"></div>
                    ))}
                </div>
            ) : leases.length === 0 ? (
                <div className="bg-slate-50 p-16 rounded-[2rem] border border-slate-200 text-center shadow-inner flex flex-col items-center relative overflow-hidden group">
                    <img src={getSportImage('stadium', 2)} className="absolute inset-0 w-full h-full object-cover opacity-[0.03] grayscale group-hover:scale-105 transition-transform duration-700 pointer-events-none" alt="" />
                    <div className="w-24 h-24 bg-white border border-slate-200 rounded-[2rem] shadow-sm flex items-center justify-center mb-6 relative z-10">
                        <CheckCircle size={40} className="text-slate-400 drop-shadow-sm" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2 relative z-10 tracking-tight">No Pending Leases</h3>
                    <p className="text-slate-500 text-base font-medium max-w-md relative z-10">Tournament organizers haven't sent any lease requests for your facility yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {leases.map((lease, idx) => (
                        <div key={lease.id} className="bg-slate-900 p-5 md:p-6 rounded-3xl shadow-xl border border-slate-800 hover:shadow-2xl transition-all relative overflow-hidden group so-slide-up" style={{ ...stagger(idx), animationFillMode: 'both' }}>

                            {/* Decorative Background Element */}
                            <img
                                src={getSportImage('stadium', lease.id.charCodeAt(0) % 3)}
                                alt="Facility"
                                className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 group-hover:opacity-50 transition-transform duration-700 pointer-events-none mix-blend-overlay"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent pointer-events-none" />

                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">

                                <div className="flex items-start gap-4">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border backdrop-blur-md shadow-sm ${lease.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                        lease.status === 'REJECTED' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                            'bg-white/10 text-slate-300 border-white/20'
                                        }`}>
                                        <Building size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-xl font-black text-white tracking-tight">{lease.organizer_name || 'Tournament Organizer'}</h3>
                                            <span className={`text-[9px] uppercase tracking-widest font-black px-2.5 py-1 rounded-full shadow-sm ${lease.status === 'APPROVED' ? 'bg-emerald-500 text-emerald-50 shadow-emerald-500/20' :
                                                lease.status === 'REJECTED' ? 'bg-red-500 text-red-50 shadow-red-500/20' :
                                                    'bg-orange-500 text-orange-50 shadow-orange-500/20'
                                                }`}>
                                                {lease.status}
                                            </span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-2">
                                            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                                                <MapPin size={12} className="text-emerald-400" /> {lease.facility_name || 'Mapped Arena'}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                                <Clock size={12} /> ID: {lease.id.split('-')[0]}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-300 uppercase tracking-widest bg-emerald-900/40 border border-emerald-500/20 px-2.5 py-0.5 rounded-md backdrop-blur-sm">
                                                <CalendarIcon size={12} /> {lease.slots?.length || 'Multiple'} Slots
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {lease.status === 'PENDING' && (
                                    <div className="w-full md:w-auto flex gap-2 sm:gap-3 mt-4 md:mt-0">
                                        <button
                                            onClick={() => handleAction(lease.id, 'REJECT')}
                                            className="flex-1 md:flex-none px-6 py-3 bg-white/10 hover:bg-red-500/20 hover:text-red-400 border border-white/20 hover:border-red-500/30 text-slate-300 text-xs uppercase tracking-widest font-bold rounded-xl transition-all flex items-center justify-center gap-2 backdrop-blur-md">
                                            <X size={14} /> Reject
                                        </button>
                                        <button
                                            onClick={() => handleAction(lease.id, 'APPROVE')}
                                            className="flex-1 md:flex-none px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 text-xs uppercase tracking-widest font-black rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2">
                                            <Check size={14} /> Approve
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}


