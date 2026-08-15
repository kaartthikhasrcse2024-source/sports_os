import { useState } from 'react';
import axios from 'axios';
import { supabase } from '../supabase';

export default function VerificationUpload({ role }: { role: 'TURF_OWNER' | 'TOURNAMENT_ORGANIZER' }) {
    const [file, setFile] = useState<File | null>(null);
    const [certId, setCertId] = useState('');
    const [docType, setDocType] = useState('BUSINESS_TAX_ID');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) {
            setError('Please attach a verification document.');
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');

        try {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;
            if (!token) throw new Error("Unauthorized context.");

            const formData = new FormData();
            formData.append('document', file);
            formData.append('document_type', docType);
            formData.append('role', role);
            if (role === 'TURF_OWNER') formData.append('business_tax_id', certId);
            else formData.append('organizer_cert_id', certId);

            await axios.post('http://localhost:3001/api/v1/verification/turf-owner/submit', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setMessage('Verification document uploaded securely. Pending administrative clearance.');
            setFile(null);
            setCertId('');
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to submit document.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-300 shadow-xl max-w-lg w-full">
            <h2 className="text-xl font-black text-gray-900 mb-4">Identity Verification</h2>
            <p className="text-gray-600 text-sm mb-6">You must upload your formal authentication documents to bypass constraints.</p>

            {error && <div className="text-red-400 text-xs font-bold mb-4 bg-red-900/30 p-3 rounded-lg border border-red-500/20">{error}</div>}
            {message && <div className="text-green-400 text-xs font-bold mb-4 bg-green-900/30 p-3 rounded-lg border border-green-500/20">{message}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-600 text-xs font-black uppercase mb-2">Document Type</label>
                    <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 text-sm focus:border-emerald-600 outline-none"
                    >
                        <option value="BUSINESS_TAX_ID">Business Tax ID</option>
                        <option value="GOVT_ID">Government ID</option>
                        <option value="OWNERSHIP_PROOF">Ownership Proof</option>
                        <option value="ORGANIZER_CERTIFICATION">Organizer Certification</option>
                    </select>
                </div>

                <div>
                    <label className="block text-gray-600 text-xs font-black uppercase mb-2">{role === 'TURF_OWNER' ? 'Tax ID' : 'Certification ID'}</label>
                    <input
                        type="text"
                        value={certId}
                        onChange={(e) => setCertId(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 text-sm focus:border-emerald-600 outline-none"
                        placeholder="e.g. GSTIN / Certification #..."
                        required
                    />
                </div>

                <div>
                    <label className="block text-gray-600 text-xs font-black uppercase mb-2">Upload Document (PDF/JPG)</label>
                    <input
                        type="file"
                        onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                        className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-dark-700 file:text-gray-900 hover:file:bg-dark-600 transition-colors"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-600 text-dark-900 font-black py-4 rounded-xl mt-4 uppercase tracking-widest text-xs transition-colors"
                >
                    {loading ? 'Transmitting Data...' : 'Submit Verification Pack'}
                </button>
            </form>
        </div>
    );
}
