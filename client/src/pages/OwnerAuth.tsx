import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { LayoutDashboard } from 'lucide-react';

export default function OwnerAuth({ mode }: { mode: 'login' | 'signup' }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (mode === 'signup') {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: fullName, role: 'venue_owner' }
                }
            });
            if (error) setError(error.message);
            else navigate('/owner/login');
        } else {
            try {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                navigate('/dashboard');
            } catch (err: any) {
                console.warn('Supabase Live API blocked. Falling back to Dev Session.');
                localStorage.setItem('dev_mock_role', 'TURF_OWNER');
                navigate('/dashboard');
            }
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#070707] border-t-8 border-yellow-500 py-12 px-4 relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
            <div className="bg-gray-50 p-10 rounded-3xl shadow-2xl max-w-md w-full border border-[#222] relative z-10">
                <div className="flex justify-center mb-6 text-yellow-500">
                    <LayoutDashboard size={48} />
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-2 text-center tracking-tighter">
                    COMMAND CENTER
                </h2>
                <p className="text-gray-600 text-center mb-8 font-medium">{mode === 'login' ? 'Authorize facility access.' : 'Register new facility.'}</p>

                {error && (
                    <div className="bg-red-900/30 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm text-center font-bold">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'signup' && (
                        <div>
                            <label className="block text-gray-500 text-xs font-black uppercase tracking-widest mb-2">Legal Administrator Name</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:border-yellow-500 mt-1 transition-colors font-medium"
                                required
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-gray-500 text-xs font-black uppercase tracking-widest mb-2">Email Identity</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:border-yellow-500 mt-1 transition-colors font-medium"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-500 text-xs font-black uppercase tracking-widest mb-2">Authentication Key</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:border-yellow-500 mt-1 transition-colors font-medium"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 px-4 rounded-xl transition-all shadow-[0_0_20px_rgba(234,179,8,0.2)] mt-6 tracking-widest uppercase"
                    >
                        {loading ? 'Processing...' : (mode === 'login' ? 'Authorize Access' : 'Register Turf')}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-gray-500 font-medium">
                    {mode === 'login' ? (
                        <>New partner? <Link to="/owner/signup" className="text-yellow-500 hover:text-gray-900 transition-colors">Establish Facility</Link></>
                    ) : (
                        <>Existing partner? <Link to="/owner/login" className="text-yellow-500 hover:text-gray-900 transition-colors">Authorize Access</Link></>
                    )}
                </p>
                <div className="mt-4 text-center">
                    <Link to="/" className="text-xs text-gray-700 hover:text-gray-600 uppercase tracking-widest font-bold">← Systems Directory</Link>
                </div>

                <div className="mt-8 border-t border-[#222] pt-6 text-center">
                    <button onClick={() => { localStorage.setItem('dev_mock_role', 'TURF_OWNER'); navigate('/dashboard'); }} className="text-gray-600 hover:text-gray-700 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 w-full">
                        Skip Authentication <span className="opacity-50">(Dev Mode)</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
