import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import { Trophy, ArrowRight, User, ChevronLeft } from 'lucide-react';
import { getSportImage } from '../utils/sportsImages';
import { usePageEnter } from '../utils/animations';

export default function PlayerAuth({ mode = 'login' }: { mode?: 'login' | 'signup' }) {
    const pageClass = usePageEnter();
    const [isSignUp, setIsSignUp] = useState(mode === 'signup');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const [successMessage, setSuccessMessage] = useState(location.state?.message || '');

    const handleOAuthLogin = async (provider: 'google' | 'apple') => {
        await supabase.auth.signInWithOAuth({ provider });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (isSignUp) {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: fullName, role: 'PLAYER' }
                }
            });
            if (error) setError(error.message);
            else {
                if (data.session) {
                    navigate('/player-registration');
                } else {
                    setSuccessMessage("Please confirm your email address before continuing.");
                }
            }
        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                if (error.message.includes("Invalid login credentials") || error.message.includes("Invalid credentials")) {
                    setError("Invalid email or password. Please check your credentials or sign up.");
                } else if (error.message.includes("Email not confirmed")) {
                    setError("Please verify your email address or turn off email confirmation in Supabase settings.");
                } else {
                    setError(error.message);
                }
            } else {
                navigate('/dashboard');
            }
        }
        setLoading(false);
    };

    return (
        <div className={`min-h-screen flex bg-white text-gray-900 overflow-hidden ${pageClass}`}>
            {/* Left Desktop Hero Side */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-white items-end p-12">
                <img
                    src={getSportImage('football', 0)}
                    alt="Stadium Lights"
                    className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-multiply opacity-15 grayscale"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-emerald-50/90 to-transparent" />
                <div className="relative z-10 w-full">
                    <Trophy className="text-emerald-400 w-12 h-12 mb-6" />
                    <h1 className="text-6xl font-black text-slate-900 tracking-tighter mb-6 leading-[1.1] so-fade-up so-delay-1">
                        FIND YOUR GAME.<br />PLAY YOUR BEST.
                    </h1>
                    <p className="text-slate-600 text-xl max-w-md font-medium leading-relaxed">
                        Join the ultimate premium sports ecosystem. Discover elite turfs, match with players, and dominate your tournaments.
                    </p>
                </div>
            </div>

            {/* Right Form Side */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 relative">
                {/* Mobile Background Fallback */}
                <div className="absolute inset-0 lg:hidden overflow-hidden bg-white">
                    <img
                        src={getSportImage('football', 2)}
                        alt="Soccer field"
                        className="w-full h-[40vh] object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white" />
                </div>

                <div className="w-full max-w-md relative z-10 pt-[50vw] sm:pt-10 lg:pt-0">
                    <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-bold uppercase tracking-widest text-xs mb-8 transition-colors bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
                        <ChevronLeft size={16} /> Returns
                    </Link>

                    <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
                                    {isSignUp ? 'CREATE PROFILE' : 'WELCOME BACK'}
                                </h2>
                                <p className="text-slate-500 font-medium mt-1">
                                    {isSignUp ? 'Enter the arena and claim your spot.' : 'Log in to continue your streak.'}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <Trophy strokeWidth={2.5} />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-semibold border border-red-100 flex items-start gap-2">
                                <span className="text-lg leading-none mt-0.5">⚠</span> {error}
                            </div>
                        )}
                        {successMessage && (
                            <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl mb-6 text-sm font-semibold border border-emerald-100 flex items-start gap-2">
                                <span className="text-lg leading-none mt-0.5">✓</span> {successMessage}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {isSignUp && (
                                <div className="space-y-1.5">
                                    <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                                            placeholder="Enter your legal name"
                                            required
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                                    placeholder="coach@example.com"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-slate-900 font-bold py-4 px-4 rounded-xl transition-all shadow-lg shadow-emerald-600/20 mt-6 tracking-wide flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? 'AUTHENTICATING...' : (isSignUp ? 'CREATE ACCOUNT' : 'LOGIN TO PROFILE')}
                                {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                            </button>

                            {!isSignUp && (
                                <div className="pt-4 grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleOAuthLogin('google')}
                                        className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 px-2 rounded-xl transition-all text-sm shadow-sm"
                                    >
                                        Google Login
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleOAuthLogin('apple')}
                                        className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 font-semibold py-3 px-2 rounded-xl transition-all text-sm shadow-sm"
                                    >
                                        Apple Login
                                    </button>
                                </div>
                            )}
                        </form>

                        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <p className="text-sm text-slate-500 font-medium">
                                {!isSignUp ? (
                                    <>New athlete? <button onClick={() => { setIsSignUp(true); setError(''); }} className="text-emerald-600 hover:text-emerald-700 font-bold transition-colors">Sign up</button></>
                                ) : (
                                    <>Registered? <button onClick={() => { setIsSignUp(false); setError(''); }} className="text-emerald-600 hover:text-emerald-700 font-bold transition-colors">Log in</button></>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
