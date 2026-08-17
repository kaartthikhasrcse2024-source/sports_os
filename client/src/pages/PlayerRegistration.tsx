import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Activity, User, MapPin, Trophy, ArrowRight, CheckCircle2 } from 'lucide-react';
import { API_URL } from '../config';
import { getSportImage } from '../utils/sportsImages';
import { usePageEnter } from '../utils/animations';

export default function PlayerRegistration() {
    const navigate = useNavigate();
    const pageClass = usePageEnter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [session, setSession] = useState<any>(null);

    const [form, setForm] = useState({
        name: '',
        age: 18,
        gender: '',
        mobile_number: '',
        city: '',
        area: '',
        preferred_sport: '',
        playing_position: '',
        skill_level: ''
    });

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (!data.session) {
                navigate('/player/login');
            } else {
                setSession(data.session);
            }
        });
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!form.name || !form.gender || !form.mobile_number || !form.city || !form.area || !form.preferred_sport || !form.playing_position || !form.skill_level) {
            setError('All fields are required.');
            return;
        }

        if (form.age < 5 || form.age > 100) {
            setError('Age must be between 5 and 100.');
            return;
        }

        if (!session) {
            navigate('/player/login');
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/api/v1/player/registration`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify(form)
            });

            const data = await res.json();
            if (!res.ok) {
                if (res.status === 400 && data.fields) {
                    setError('Validation Error: ' + Object.entries(data.fields).map(([k, v]) => `${k} - ${v}`).join(', '));
                } else if (res.status === 401) {
                    setError('Authentication failure. Please log in again.');
                } else if (res.status === 403) {
                    setError('Only PLAYER accounts can register here.');
                } else if (res.status === 404) {
                    setError('Account Profile not found.');
                } else {
                    setError(data.error || 'Server error.');
                }
            } else {
                setSuccessMessage('Player profile established.');
                setTimeout(() => navigate('/dashboard'), 1500);
            }
        } catch (e: any) {
            setError('Network Error: Could not connect to the server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen bg-white border-t-[12px] border-emerald-500 flex flex-col md:flex-row relative ${pageClass}`}>

            {/* Visual Header / Sidebar */}
            <div className="w-full md:w-[40%] lg:w-[45%] relative bg-slate-50 flex flex-col justify-end p-8 md:p-12 overflow-hidden shadow-2xl z-10 min-h-[30vh] md:min-h-screen">
                <img
                    src={getSportImage('cricket', 1)}
                    alt="Athlete Prep"
                    className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-multiply opacity-15 grayscale"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/90 md:block hidden" />

                <div className="relative z-10 w-full max-w-sm mx-auto md:mx-0">
                    <Activity className="text-emerald-400 w-12 h-12 mb-6" />
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight leading-tight">
                        BUILD YOUR<br />LEGACY.
                    </h2>
                    <p className="text-slate-600 font-medium text-lg leading-relaxed md:block hidden">
                        Complete your athletic identity to unlock premium turf bookings, competitive tournaments, and local scouting networks.
                    </p>
                </div>
            </div>

            {/* Form Container */}
            <div className="w-full md:w-[60%] lg:w-[55%] bg-slate-50 relative z-20 flex items-center justify-center p-6 md:p-12 md:-ml-8 md:rounded-l-[2.5rem] shadow-[-20px_0_40px_-15px_rgba(0,0,0,0.5)] flex-1">
                <div className="w-full max-w-xl">
                    <div className="mb-10 text-center md:text-left">
                        <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 tracking-tight">
                            ATHLETE REGISTRATION
                        </h2>
                        <p className="text-slate-500 font-medium">Create your official sports verified profile.</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl mb-8 flex items-start gap-3">
                            <span className="font-bold">Error:</span> {error}
                        </div>
                    )}
                    {successMessage && (
                        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-6 rounded-2xl mb-8 flex flex-col items-center justify-center gap-3 text-center">
                            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                            <h3 className="text-xl font-bold">Profile Confirmed</h3>
                            <p className="text-sm font-medium opacity-80 text-emerald-800">Redirecting to your dashboard...</p>
                        </div>
                    )}

                    {!successMessage && (
                        <form onSubmit={handleSubmit} className="space-y-8">

                            {/* Section 1 */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 uppercase tracking-widest mb-5">
                                    <User className="w-4 h-4 text-emerald-500" /> Identity
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="md:col-span-2">
                                        <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Display Name</label>
                                        <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all font-medium" placeholder="First Last" required />
                                    </div>
                                    <div>
                                        <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Age</label>
                                        <input type="number" min="5" max="100" value={form.age} onChange={e => setForm({ ...form, age: parseInt(e.target.value) || 0 })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all font-medium" required />
                                    </div>
                                    <div>
                                        <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Gender</label>
                                        <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all font-medium appearance-none" required>
                                            <option value="">Select Option</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                            <option value="Prefer not to say">Prefer not to say</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2 */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 uppercase tracking-widest mb-5">
                                    <MapPin className="w-4 h-4 text-emerald-500" /> Contact & Location
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="md:col-span-2">
                                        <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Mobile Contact</label>
                                        <input type="tel" value={form.mobile_number} onChange={e => setForm({ ...form, mobile_number: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all font-medium" placeholder="+91 00000 00000" required />
                                    </div>
                                    <div>
                                        <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Primary City</label>
                                        <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all font-medium" placeholder="E.g. Chennai" required />
                                    </div>
                                    <div>
                                        <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Neighborhood / Area</label>
                                        <input type="text" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all font-medium" placeholder="Local Zone" required />
                                    </div>
                                </div>
                            </div>

                            {/* Section 3 */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 uppercase tracking-widest mb-5">
                                    <Trophy className="w-4 h-4 text-emerald-500" /> Athletic Profile
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="md:col-span-2">
                                        <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Primary Sport</label>
                                        <input type="text" value={form.preferred_sport} onChange={e => setForm({ ...form, preferred_sport: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all font-medium" placeholder="Football, Basketball, Cricket..." required />
                                    </div>
                                    <div>
                                        <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Primary Position</label>
                                        <input type="text" value={form.playing_position} onChange={e => setForm({ ...form, playing_position: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all font-medium" placeholder="E.g. Striker" required />
                                    </div>
                                    <div>
                                        <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Current Skill Tier</label>
                                        <select value={form.skill_level} onChange={e => setForm({ ...form, skill_level: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all font-medium appearance-none" required>
                                            <option value="">Select Level</option>
                                            <option value="Beginner">Beginner</option>
                                            <option value="Intermediate">Intermediate</option>
                                            <option value="Advanced">Advanced (Semi-Pro)</option>
                                            <option value="Professional">Professional</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !session}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-slate-900 font-bold py-5 px-6 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 tracking-wide uppercase flex items-center justify-center gap-2 group disabled:opacity-50"
                            >
                                {loading ? 'FINALIZING PROFILE...' : 'REGISTER ATHLETE PROFILE'}
                                {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
