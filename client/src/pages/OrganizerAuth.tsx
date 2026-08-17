import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import { Trophy, ShieldCheck, ArrowRight, ChevronLeft } from 'lucide-react';
import { getSportImage } from '../utils/sportsImages';
import { usePageEnter } from '../utils/animations';

export default function OrganizerAuth({ mode = 'login' }: { mode?: 'login' | 'signup' }) {
    const pageClass = usePageEnter();
    const [isSignUp, setIsSignUp] = useState(mode === 'signup');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const [successMessage, setSuccessMessage] = useState((location.state as any)?.message || '');

    const handleOAuthLogin = async (provider: 'google' | 'apple') => {
        await supabase.auth.signInWithOAuth({ provider });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (isSignUp) {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: fullName, role: 'TOURNAMENT_ORGANIZER' }
                }
            });
            if (error) setError(error.message);
            else {
                setSuccessMessage("Account created successfully! Logging you in...");
                setTimeout(() => navigate('/dashboard'), 1500);
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
        <div className={`min-h-screen flex bg-slate-50 font-sans text-slate-900 selection:bg-emerald-500 selection:text-white ${pageClass}`}>
            {/* LEFT / HERO AREA (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-white items-end p-12">
                <img
                    src={getSportImage('stadium', 3)}
                    alt="Football Tournament"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent mix-blend-multiply opacity-60" />

                <div className="relative z-10 bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl max-w-lg border border-white/20">
                    <div className="flex items-center gap-3 text-emerald-600 mb-4">
                        <Trophy size={32} />
                        <span className="font-black text-xl tracking-tighter">SPORTS OS</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-3 so-fade-up so-delay-1">
                        Build tournaments.<br />
                        Create unforgettable games.
                    </h1>
                    <p className="text-slate-600 font-medium">
                        Join the premier network of event organizers. Streamline teams, manage brackets, and secure elite facilities instantly.
                    </p>
                </div>
            </div>

            {/* RIGHT / FORM AREA */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 relative">
                {/* Mobile Background (Hidden on desktop) */}
                <div className="absolute inset-0 lg:hidden overflow-hidden bg-white">
                    <img
                        src={getSportImage('stadium', 3)}
                        alt="Hero Mobile"
                        className="absolute inset-0 w-full h-[40vh] object-cover opacity-80"
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
                                    {isSignUp ? 'Establish League.' : 'Organizer Access.'}
                                </h2>
                                <p className="text-slate-500 font-medium mt-1">
                                    {isSignUp ? 'Partner with Sports OS.' : 'Welcome back to HQ.'}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <Trophy strokeWidth={2.5} />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-2">
                                <ShieldCheck size={18} className="text-red-500 shrink-0" />
                                {error}
                            </div>
                        )}
                        {successMessage && (
                            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-2">
                                <ShieldCheck size={18} className="text-emerald-500 shrink-0" />
                                {successMessage}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {isSignUp && (
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Legal Organization Name</label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold outline-none"
                                        placeholder="Enter your full name"
                                        required
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Email Identity</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold outline-none"
                                    placeholder="your@email.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex justify-between items-center">
                                    <span>Authentication Key</span>
                                    {!isSignUp && <a href="#" className="text-emerald-600 hover:underline">Forgot?</a>}
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold outline-none"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-4 rounded-xl transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-between group disabled:opacity-70 mt-4"
                            >
                                <span className="uppercase tracking-widest text-xs flex-1 text-center">
                                    {loading ? 'Processing...' : (!isSignUp ? 'Authorize Access' : 'Register Org')}
                                </span>
                                {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                            </button>

                            {!isSignUp && (
                                <div className="mt-4 flex flex-col gap-3 pt-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => handleOAuthLogin('google')}
                                        className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 font-bold py-3.5 px-4 rounded-xl transition-all text-sm flex items-center justify-center gap-3 shadow-sm"
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /><path fill="none" d="M1 1h22v22H1z" /></svg>
                                        Google Authorized Link
                                    </button>
                                </div>
                            )}
                        </form>

                        <div className="mt-8 text-center bg-slate-50 p-4 rounded-xl">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                                {!isSignUp ? (
                                    <>Not an organizer yet? <button type="button" onClick={() => { setIsSignUp(true); setError(''); setSuccessMessage(''); }} className="text-emerald-600 hover:text-emerald-700 transition-colors ml-1 underline decoration-emerald-600/30 underline-offset-2">Register Now</button></>
                                ) : (
                                    <>Existing organizer? <button type="button" onClick={() => { setIsSignUp(false); setError(''); setSuccessMessage(''); }} className="text-emerald-600 hover:text-emerald-700 transition-colors ml-1 underline decoration-emerald-600/30 underline-offset-2">Sign In</button></>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
