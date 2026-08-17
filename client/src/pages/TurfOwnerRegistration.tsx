import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { LayoutDashboard, CheckCheck, MapPin, Briefcase, User, ArrowRight } from 'lucide-react';
import { API_URL } from '../config';
import { getSportImage } from '../utils/sportsImages';
import { usePageEnter } from '../utils/animations';

export default function TurfOwnerRegistration() {
    const navigate = useNavigate();
    const pageClass = usePageEnter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [session, setSession] = useState<any>(null);
    const [currentStep, setCurrentStep] = useState(1);

    const [form, setForm] = useState({
        owner_name: '',
        phone_number: '',
        business_name: '',
        business_type: '',
        registration_number: '',
        turf_location: '',
        number_of_turfs: 1
    });

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (!data.session) {
                navigate('/owner/login');
            } else {
                setSession(data.session);
            }
        });
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!form.owner_name || !form.phone_number || !form.business_name || !form.business_type || !form.turf_location || form.number_of_turfs < 1) {
            setError('Please complete all required fields correctly before submitting.');
            return;
        }

        if (!session) {
            navigate('/owner/login');
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/api/v1/owner/registration`, {
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

                setCurrentStep(4); // Move to success step visually
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 2000);
            }
        } catch (e: any) {
            setError('Network Error: Could not connect to the server.');
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        if (currentStep < 3) setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const steps = [
        { id: 1, label: 'Owner Details', icon: User },
        { id: 2, label: 'Business Profile', icon: Briefcase },
        { id: 3, label: 'Facility Info', icon: MapPin }
    ];

    return (
        <div className={`min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 selection:bg-emerald-500 selection:text-white ${pageClass}`}>

            {/* Minimal Header */}
            <header className="bg-white border-b border-slate-200 py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-40">
                <div className="flex items-center gap-2 text-slate-900">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                        <LayoutDashboard size={16} />
                    </div>
                    <span className="font-black tracking-tight text-lg">SPORTS OS <span className="font-bold text-slate-400">PARTNERS</span></span>
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-4 mt-8 md:mt-12">

                {/* Step Indicator */}
                <div className="flex gap-2 my-8 px-2 lg:px-12">
                    {steps.map((step) => (
                        <div key={step.id} className="flex-1">
                            <div className={`h-1.5 rounded-full transition-all duration-500 ${currentStep >= step.id ? 'bg-emerald-600' : 'bg-slate-200'}`} />
                            <span className={`block text-[9px] uppercase tracking-widest font-bold mt-2 ${currentStep >= step.id ? 'text-emerald-700' : 'text-slate-400'}`}>
                                {step.label}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden relative">
                    {/* Form Progress Visuals */}

                    {currentStep === 4 ? (
                        <div className="p-16 text-center flex flex-col items-center animate-in fade-in zoom-in duration-500">
                            <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                                <CheckCheck size={48} />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Registration Complete</h2>
                            <p className="text-slate-500 font-medium">Redirecting to your new command center...</p>
                        </div>
                    ) : (
                        <div>
                            {/* Form Header Context */}
                            <div className="bg-slate-900 overflow-hidden relative p-8 md:p-12 text-white">
                                <img
                                    src={getSportImage('turf', 2)}
                                    className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30"
                                    alt="Grass background"
                                />
                                <div className="relative z-10">
                                    <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2 text-white">
                                        {currentStep === 1 && "Administrator Details"}
                                        {currentStep === 2 && "Business Identity"}
                                        {currentStep === 3 && "Facility Setup"}
                                    </h2>
                                    <p className="text-emerald-50 max-w-sm opacity-90 text-sm font-medium">
                                        {currentStep === 1 && "Start by identifying the primary legal contact for the facility."}
                                        {currentStep === 2 && "Register the legal business entity operating the courts."}
                                        {currentStep === 3 && "Define the physical footprint and offerings of your arena."}
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); if (currentStep === 3) handleSubmit(e); else nextStep(); }} className="p-8 md:p-12">

                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-8 text-sm font-bold animate-in slide-in-from-top-2">
                                        {error}
                                    </div>
                                )}

                                {/* STEP 1 */}
                                {currentStep === 1 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Legal Administrator Name</label>
                                            <input
                                                type="text"
                                                value={form.owner_name}
                                                onChange={e => setForm({ ...form, owner_name: e.target.value })}
                                                required
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors font-bold"
                                                placeholder="e.g. John Doe"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Direct Phone Contact</label>
                                            <input
                                                type="text"
                                                value={form.phone_number}
                                                onChange={e => setForm({ ...form, phone_number: e.target.value })}
                                                required
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors font-bold"
                                                placeholder="+91 98765 43210"
                                            />
                                            <p className="text-xs text-slate-400 mt-2 font-medium">Used for critical operational alerts and customer disputes.</p>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2 */}
                                {currentStep === 2 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Official Business Name</label>
                                            <input
                                                type="text"
                                                value={form.business_name}
                                                onChange={e => setForm({ ...form, business_name: e.target.value })}
                                                required
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors font-bold"
                                                placeholder="e.g. Apex Sports Management"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Business Classification</label>
                                            <select
                                                value={form.business_type}
                                                onChange={e => setForm({ ...form, business_type: e.target.value })}
                                                required
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors font-bold appearance-none"
                                            >
                                                <option value="" disabled>Select business type...</option>
                                                <option value="Sole Proprietorship">Sole Proprietorship</option>
                                                <option value="LLC">Limited Liability Company (LLC)</option>
                                                <option value="Partnership">Partnership</option>
                                                <option value="Corporate">Corporate / Franchise</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Business License / Registration No. <span className="text-slate-400 font-medium normal-case">(Optional)</span></label>
                                            <input
                                                type="text"
                                                value={form.registration_number}
                                                onChange={e => setForm({ ...form, registration_number: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors font-bold"
                                                placeholder="e.g. REG-2026-X891"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3 */}
                                {currentStep === 3 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-2"><MapPin size={12} /> Primary Turf Address / Location</label>
                                            <textarea
                                                value={form.turf_location}
                                                onChange={e => setForm({ ...form, turf_location: e.target.value })}
                                                required
                                                rows={3}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors font-bold resize-none"
                                                placeholder="Full street address and zone context"
                                            ></textarea>
                                        </div>
                                        <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 flex flex-col md:flex-row items-center justify-between gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-emerald-900 uppercase tracking-widest mb-1">Total Operating Divisions</label>
                                                <p className="text-xs text-emerald-700 font-medium">How many physical courts/turfs are located in this facility?</p>
                                            </div>
                                            <div className="flex items-center">
                                                <button type="button" onClick={() => setForm({ ...form, number_of_turfs: Math.max(1, form.number_of_turfs - 1) })} className="w-10 h-10 rounded-l-xl bg-white border border-emerald-200 text-emerald-600 font-black flex items-center justify-center hover:bg-emerald-50">-</button>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={form.number_of_turfs}
                                                    onChange={e => setForm({ ...form, number_of_turfs: parseInt(e.target.value) || 1 })}
                                                    required
                                                    className="w-14 h-10 text-center bg-white border-y border-emerald-200 font-black text-slate-900 appearance-none pointer-events-none"
                                                />
                                                <button type="button" onClick={() => setForm({ ...form, number_of_turfs: form.number_of_turfs + 1 })} className="w-10 h-10 rounded-r-xl bg-white border border-emerald-200 text-emerald-600 font-black flex items-center justify-center hover:bg-emerald-50">+</button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Form Navigation */}
                                <div className="mt-10 flex justify-between items-center pt-6 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        className={`px-6 py-3 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors ${currentStep === 1 ? 'invisible' : 'visible'}`}
                                    >
                                        Back
                                    </button>

                                    {currentStep < 3 ? (
                                        <button
                                            type="button"
                                            onClick={nextStep}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                                        >
                                            Continue <ArrowRight size={16} />
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                                        >
                                            {loading ? 'Confirming...' : 'Launch Facility'}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
