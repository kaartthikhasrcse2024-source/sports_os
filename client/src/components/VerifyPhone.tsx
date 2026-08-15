import { useState } from 'react';
import axios from 'axios';
import { supabase } from '../supabase';
import { Smartphone } from 'lucide-react';

export default function VerifyPhone() {
    const [phone, setPhone] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [step, setStep] = useState<1 | 2>(1);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            // Native Supabase SMS ping
            const { error: otpError } = await supabase.auth.signInWithOtp({ phone });
            if (otpError) throw otpError;

            setMessage('SMS payload triggered. Intercept code and finalize below.');
            setStep(2);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to dispatch SMS payload.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;
            if (!token) throw new Error("Unauthorized context block.");

            await axios.post('http://localhost:3001/api/v1/verification/player/verify-otp', {
                phone,
                code: otpCode
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setStep(1);
            setMessage('Identity matrix locked securely. Verified state mapped.');
            // Reload page or trigger external callback if needed.
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Verification lock strictly rejected standard.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-300 shadow-xl max-w-sm w-full mx-auto text-center">
            <div className="flex justify-center mb-4 text-emerald-700">
                <Smartphone size={32} />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Two-Factor Shield</h2>
            <p className="text-gray-600 text-sm mb-6 font-medium">Link your cellular array to authorize sensitive platform bookings.</p>

            {error && <div className="text-red-400 text-xs font-bold mb-4 bg-red-900/30 p-3 rounded-lg border border-red-500/20 text-left">{error}</div>}
            {message && <div className="text-green-400 text-xs font-bold mb-4 bg-green-900/30 p-3 rounded-lg border border-green-500/20 text-left">{message}</div>}

            {step === 1 ? (
                <form onSubmit={handleSendOTP} className="space-y-4 text-left">
                    <div>
                        <label className="block text-gray-600 text-xs font-black uppercase mb-2">Mobile Interface</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 text-sm focus:border-emerald-600 outline-none"
                            placeholder="+1 (555) 000-0000"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-600 text-dark-900 font-black py-4 rounded-xl mt-4 uppercase tracking-widest text-xs transition-colors"
                    >
                        {loading ? 'Routing...' : 'Initialize Override'}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleVerify} className="space-y-4 text-left">
                    <div>
                        <label className="block text-gray-600 text-xs font-black uppercase mb-2">Decryption Hash (OTP)</label>
                        <input
                            type="text"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 text-center tracking-widest font-mono text-2xl focus:border-emerald-600 outline-none"
                            placeholder="000-000"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-600 text-dark-900 font-black py-4 rounded-xl mt-4 uppercase tracking-widest text-xs transition-colors"
                    >
                        {loading ? 'Matching...' : 'Confirm Authentication'}
                    </button>
                </form>
            )}
        </div>
    );
}
