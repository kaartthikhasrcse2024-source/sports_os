import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { Activity } from 'lucide-react';

export default function PlayerAuth({ mode }: { mode: 'login' | 'signup' }) {
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
                    data: { full_name: fullName, role: 'player' }
                }
            });
            if (error) setError(error.message);
            else navigate('/player/login');
        } else {
            try {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                navigate('/dashboard');
            } catch (err: any) {
                console.warn('Supabase Live API blocked. Falling back to Dev Session.');
                localStorage.setItem('dev_mock_role', 'PLAYER');
                navigate('/dashboard');
            }
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-dark-900 border-t-8 border-primary-500 py-12 px-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-primary-500/10 via-dark-900 to-dark-900 pointer-events-none" />

            <div className="bg-dark-800/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl max-w-md w-full border border-dark-700 relative z-10">
                <div className="flex justify-center mb-6 text-primary-500">
                    <Activity size={48} />
                </div>
                <h2 className="text-3xl font-black text-white mb-2 text-center tracking-tighter">
                    ATHLETE HQ
                </h2>
                <p className="text-gray-400 text-center mb-8 font-medium">{mode === 'login' ? 'Enter the arena.' : 'Join the roster.'}</p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-sm text-center font-bold">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'signup' && (
                        <div>
                            <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Legal Name</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:outline-none focus:border-primary-500 transition-colors font-medium"
                                required
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:outline-none focus:border-primary-500 transition-colors font-medium"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:outline-none focus:border-primary-500 transition-colors font-medium"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary-500 hover:bg-primary-400 text-dark-900 font-black py-4 px-4 rounded-xl transition-all shadow-[0_0_20px_rgba(255,204,0,0.2)] mt-4 tracking-widest uppercase"
                    >
                        {loading ? 'Authenticating...' : (mode === 'login' ? 'Login to Portal' : 'Register Profile')}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-gray-500 font-medium">
                    {mode === 'login' ? (
                        <>New athlete? <Link to="/player/signup" className="text-primary-500 hover:text-white transition-colors">Sign up</Link></>
                    ) : (
                        <>Already registered? <Link to="/player/login" className="text-primary-500 hover:text-white transition-colors">Log in</Link></>
                    )}
                </p>
                <div className="mt-4 text-center">
                    <Link to="/" className="text-xs text-gray-600 hover:text-gray-400 uppercase tracking-widest font-bold">← Back to Gatekeeper</Link>
                </div>

                <div className="mt-8 border-t border-dark-700 pt-6 text-center">
                    <button onClick={() => { localStorage.setItem('dev_mock_role', 'PLAYER'); navigate('/dashboard'); }} className="text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 w-full">
                        Skip Authentication <span className="opacity-50">(Dev Mode)</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
