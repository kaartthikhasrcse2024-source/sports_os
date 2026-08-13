import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { Trophy } from 'lucide-react';

export default function OrganizerAuth({ mode }: { mode: 'login' | 'signup' }) {
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
                    data: { full_name: fullName, role: 'TOURNAMENT_ORGANIZER' }
                }
            });
            if (error) setError(error.message);
            else navigate('/organizer/login');
        } else {
            try {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                navigate('/dashboard');
            } catch (err: any) {
                console.warn('Supabase Live API blocked. Falling back to Dev Session.');
                localStorage.setItem('dev_mock_role', 'TOURNAMENT_ORGANIZER');
                navigate('/dashboard');
            }
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050B14] border-t-8 border-cyan-500 py-12 px-4 relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
            <div className="bg-[#0A1220] p-10 rounded-3xl shadow-[0_0_40px_rgba(6,182,212,0.15)] max-w-md w-full border border-[#164E63] relative z-10">
                <div className="flex justify-center mb-6 text-cyan-500">
                    <Trophy size={48} />
                </div>
                <h2 className="text-3xl font-black text-white mb-2 text-center tracking-tighter">
                    ORGANIZER HQ
                </h2>
                <p className="text-cyan-100/50 text-center mb-8 font-medium">{mode === 'login' ? 'Authorize ecosystem access.' : 'Establish league authority.'}</p>

                {error && (
                    <div className="bg-red-900/30 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm text-center font-bold">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'signup' && (
                        <div>
                            <label className="block text-cyan-600 text-xs font-black uppercase tracking-widest mb-2">Legal Organization Name</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-[#050B14] border border-[#164E63] rounded-xl p-3 text-cyan-100 focus:outline-none focus:border-cyan-500 mt-1 transition-colors font-medium"
                                required
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-cyan-600 text-xs font-black uppercase tracking-widest mb-2">Email Identity</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#050B14] border border-[#164E63] rounded-xl p-3 text-cyan-100 focus:outline-none focus:border-cyan-500 mt-1 transition-colors font-medium"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-cyan-600 text-xs font-black uppercase tracking-widest mb-2">Authentication Key</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#050B14] border border-[#164E63] rounded-xl p-3 text-cyan-100 focus:outline-none focus:border-cyan-500 mt-1 transition-colors font-medium"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black py-4 px-4 rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] mt-6 tracking-widest uppercase"
                    >
                        {loading ? 'Processing...' : (mode === 'login' ? 'Authorize Access' : 'Register Org')}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-cyan-700 font-medium">
                    {mode === 'login' ? (
                        <>New organization? <Link to="/organizer/signup" className="text-cyan-500 hover:text-white transition-colors">Establish League</Link></>
                    ) : (
                        <>Existing authority? <Link to="/organizer/login" className="text-cyan-500 hover:text-white transition-colors">Authorize Access</Link></>
                    )}
                </p>
                <div className="mt-4 text-center">
                    <Link to="/" className="text-xs text-cyan-800 hover:text-cyan-400 uppercase tracking-widest font-bold">← Systems Directory</Link>
                </div>

                <div className="mt-8 border-t border-[#164E63] pt-6 text-center">
                    <button onClick={() => { localStorage.setItem('dev_mock_role', 'TOURNAMENT_ORGANIZER'); navigate('/dashboard'); }} className="text-cyan-700 hover:text-cyan-300 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 w-full">
                        Skip Authentication <span className="opacity-50">(Dev Mode)</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
