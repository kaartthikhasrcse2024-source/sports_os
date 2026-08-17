import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Trophy, ArrowRight, ArrowLeft, ShieldCheck, User, Building, MapPin } from 'lucide-react';
import { API_URL } from '../config';
import { getSportImage } from '../utils/sportsImages';

export default function OrganizerRegistration() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [session, setSession] = useState<any>(null);
    const [step, setStep] = useState(1);

    const [form, setForm] = useState({
        organizer_name: '',
        phone_number: '',
        organization_name: '',
        organization_type: '',
        registration_number: '',
        tournament_experience: '',
        operating_location: ''
    });

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (!data.session) {
                navigate('/organizer/login');
            } else {
                setSession(data.session);
            }
        });
    }, [navigate]);

    const handleNext = () => {
        if (step === 1 && (!form.organizer_name || !form.phone_number)) {
            setError('Please fill in required fields to continue.');
            return;
        }
        if (step === 2 && !form.organization_name) {
            setError('Please provide an organization name.');
            return;
        }
        setError('');
        setStep(Math.min(step + 1, 4));
    };

    const handlePrev = () => setStep(Math.max(step - 1, 1));

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setError('');

        if (!form.organizer_name || !form.phone_number || !form.organization_name) {
            setError('Please fill all required primary fields.');
            return;
        }

        if (!session) {
            navigate('/organizer/login');
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/api/v1/organizer/registration`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify(form)
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Server error.');
            } else {
                setSuccessMessage('Tournament Organizer registration submitted successfully.');
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1500);
            }
        } catch (e: any) {
            setError('Network Error: Could not connect to the server.');
        } finally {
            setLoading(false);
        }
    };

    const renderStepIndicators = () => (
        <div className="flex gap-2 my-8">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-1">
                    <div className={`h-1.5 rounded-full ${step >= i ? 'bg-emerald-600' : 'bg-slate-200'}`} />
                    <span className={`block text-[9px] uppercase tracking-widest font-bold mt-2 ${step >= i ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {i === 1 ? 'Organizer' : i === 2 ? 'Organization' : i === 3 ? 'Profile' : 'Review'}
                    </span>
                </div>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-emerald-500 selection:text-white pb-12">
            {/* Header */}
            <div className="bg-slate-900 border-b border-slate-200 pt-16 pb-12 px-6 relative z-10 shadow-sm overflow-hidden">
                <img src={getSportImage('stadium', 2)} className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay" alt="" />
                <div className="max-w-2xl mx-auto flex flex-col gap-4 relative z-10">
                    <div className="flex items-center gap-3 text-emerald-500">
                        <Trophy size={28} />
                        <span className="font-black text-lg tracking-tighter text-white">SPORTS OS</span>
                    </div>
                    <div className="mt-4">
                        <h1 className="text-3xl font-black text-white tracking-tight leading-none mb-2">Organizer Registration</h1>
                        <p className="text-slate-300 font-medium text-sm">Establish your organization's credibility to manage top-tier tournaments.</p>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-6 mt-4">
                {renderStepIndicators()}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-3">
                        <ShieldCheck size={20} className="text-red-500" /> {error}
                    </div>
                )}
                {successMessage && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-3">
                        <ShieldCheck size={20} className="text-emerald-600" /> {successMessage}
                    </div>
                )}

                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden relative">
                    <div className="p-8 md:p-10">
                        {step === 1 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900">Personal Identity</h2>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Authorized Representative</p>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Representative Name</label>
                                        <input
                                            type="text" value={form.organizer_name} onChange={e => setForm({ ...form, organizer_name: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold outline-none"
                                            placeholder="Legal Full Name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Phone Contact</label>
                                        <input
                                            type="tel" value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold outline-none"
                                            placeholder="+91"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                        <Building size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900">Business Entity</h2>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Corporate Identity</p>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Organization Name</label>
                                        <input
                                            type="text" value={form.organization_name} onChange={e => setForm({ ...form, organization_name: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold outline-none"
                                            placeholder="e.g. Apex Sports League"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Organization Type</label>
                                        <input
                                            type="text" value={form.organization_type} onChange={e => setForm({ ...form, organization_type: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold outline-none"
                                            placeholder="Private Club, Corporate, Academy"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex justify-between">Registration Number <span className="text-slate-400">Optional</span></label>
                                        <input
                                            type="text" value={form.registration_number} onChange={e => setForm({ ...form, registration_number: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold outline-none"
                                            placeholder="CIN, LLPIN, etc."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900">Tournament Profile</h2>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Event Operations</p>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Experience Level</label>
                                        <select
                                            value={form.tournament_experience} onChange={e => setForm({ ...form, tournament_experience: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold outline-none appearance-none"
                                        >
                                            <option value="">Select Level</option>
                                            <option value="New">First Tournament</option>
                                            <option value="Some">1-5 Tournaments</option>
                                            <option value="Veteran">5+ Tournaments</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Operating Base (City)</label>
                                        <input
                                            type="text" value={form.operating_location} onChange={e => setForm({ ...form, operating_location: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold outline-none"
                                            placeholder="Primary City"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <h2 className="text-2xl font-black text-slate-900 mb-6 text-center">Confirm Profile Details</h2>
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4 mb-2">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Representative</p>
                                        <p className="font-bold text-slate-900 mt-1">{form.organizer_name} — {form.phone_number}</p>
                                    </div>
                                    <div className="pt-4 border-t border-slate-200">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Organization</p>
                                        <p className="font-bold text-slate-900 mt-1">{form.organization_name}</p>
                                        <p className="text-sm text-slate-500">{form.organization_type} {form.registration_number ? `(${form.registration_number})` : ''}</p>
                                    </div>
                                    <div className="pt-4 border-t border-slate-200">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operations</p>
                                        <p className="font-bold text-slate-900 mt-1">{form.operating_location || 'Not Specified'}</p>
                                        <p className="text-sm text-slate-500">Experience: {form.tournament_experience || 'Not Specified'}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="bg-slate-50 border-t border-slate-100 p-6 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={handlePrev}
                            disabled={step === 1 || loading}
                            className="w-12 h-12 rounded-xl border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-white transition-colors disabled:opacity-30"
                        >
                            <ArrowLeft size={18} />
                        </button>

                        {step < 4 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="bg-slate-900 hover:bg-black text-white px-8 py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center gap-3 transition-colors shadow-lg shadow-black/10"
                            >
                                Continue <ArrowRight size={16} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => handleSubmit()}
                                disabled={loading}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center gap-3 transition-colors shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                            >
                                {loading ? 'Processing...' : 'Establish League'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
