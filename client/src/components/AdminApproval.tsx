import { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../supabase';
import { ShieldCheck, XCircle } from 'lucide-react';
import { API_URL } from '../config';

export default function AdminApproval() {
    const [pendingDocs, setPendingDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPending = async () => {
        try {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;
            if (!token) return;

            const res = await axios.get(`${API_URL}/api/v1/verification/admin/pending`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setPendingDocs(res.data);
        } catch (err) {
            console.error('Failed to fetch admin list', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const executeDecision = async (profileId: string, documentId: string, decision: 'VERIFIED' | 'REJECTED') => {
        try {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;

            await axios.post(`${API_URL}/api/v1/verification/admin/review/${profileId}`, {
                documentId,
                decision,
                notes: 'Administratively processed.'
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Re-fetch after success
            fetchPending();
        } catch (err) {
            console.error('Admin override failed execution', err);
            alert('Admin constraint block failed.');
        }
    };

    if (loading) return <div className="text-gray-900 text-center p-10 font-bold uppercase tracking-widest text-xs">Loading Security Constraints...</div>;

    if (pendingDocs.length === 0) return <div className="bg-white p-8 rounded-2xl border border-gray-300 shadow-xl text-center text-gray-600 font-bold uppercase text-xs tracking-widest">No Pending Clearances</div>;

    return (
        <div className="bg-white p-6 rounded-2xl border border-red-900/50 shadow-2xl max-w-4xl w-full">
            <h2 className="text-xl font-black text-red-500 mb-6 flex items-center gap-2 uppercase tracking-tighter">
                <ShieldCheck /> Security Clearance Bay
            </h2>
            <div className="space-y-4">
                {pendingDocs.map(doc => (
                    <div key={doc.id} className="bg-gray-50 border border-gray-300 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-gray-900 uppercase text-sm tracking-wide">{doc.name}</span>
                                <span className="text-[10px] font-black px-2 py-1 bg-dark-700 text-gray-700 rounded uppercase tracking-widest">{doc.actor_role}</span>
                            </div>
                            <p className="text-xs text-gray-600 mb-2 font-medium">{doc.email}</p>

                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                <div><span className="text-gray-500 font-bold uppercase">Type:</span> <span className="text-emerald-700 font-bold">{doc.document_type}</span></div>
                                {doc.business_tax_id && <div><span className="text-gray-500 font-bold uppercase">Tax ID:</span> <span className="text-gray-900 font-mono">{doc.business_tax_id}</span></div>}
                                {doc.organizer_cert_id && <div><span className="text-gray-500 font-bold uppercase">Cert:</span> <span className="text-gray-900 font-mono">{doc.organizer_cert_id}</span></div>}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 w-full md:w-auto">
                            <a
                                href={doc.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="block text-center bg-dark-700 hover:bg-dark-600 text-gray-900 font-bold text-xs uppercase tracking-widest py-2 px-4 rounded transition-colors"
                            >
                                View Payload
                            </a>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => executeDecision(doc.profile_id, doc.id, 'VERIFIED')}
                                    className="flex-1 bg-green-500 hover:bg-green-400 text-black font-black uppercase text-xs py-2 px-4 rounded transition-colors"
                                >
                                    Verify
                                </button>
                                <button
                                    onClick={() => executeDecision(doc.profile_id, doc.id, 'REJECTED')}
                                    className="flex-1 bg-red-500 hover:bg-red-400 text-gray-900 font-black uppercase text-xs py-2 px-4 rounded transition-colors flex items-center justify-center"
                                >
                                    <XCircle size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
