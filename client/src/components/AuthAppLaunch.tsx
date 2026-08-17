import { useState, useEffect } from 'react';
import { Activity, LayoutDashboard, Trophy, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AuthAppLaunch() {
    const [step, setStep] = useState<'splash' | 'role'>('splash');
    const navigate = useNavigate();

    useEffect(() => {
        if (step === 'splash') {
            const timer = setTimeout(() => {
                setStep('role');
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [step]);

    const handleRoleSelect = (selectedRole: 'PLAYER' | 'TURF_OWNER' | 'TOURNAMENT_ORGANIZER') => {
        if (selectedRole === 'PLAYER') navigate('/player/login');
        if (selectedRole === 'TURF_OWNER') navigate('/owner/login');
        if (selectedRole === 'TOURNAMENT_ORGANIZER') navigate('/organizer/login');
    };

    if (step === 'splash') {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-900 to-slate-900 pointer-events-none" />
                <div className="z-10 flex flex-col items-center animate-in fade-in zoom-in duration-1000">
                    <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                        <Zap size={48} className="text-emerald-500" strokeWidth={2.5} />
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter text-white">SPORTS<span className="text-emerald-500">OS</span></h1>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12 relative overflow-hidden flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-emerald-500/10 via-slate-50 to-slate-50 pointer-events-none" />

            <div className="z-10 text-center mb-12 w-full max-w-4xl">
                <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-4">Select Your Identity</h2>
                <p className="text-slate-500 font-medium">Choose a portal to interact with the Sports OS ecosystem.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl z-10">
                <button onClick={() => handleRoleSelect('PLAYER')} className="group bg-white p-8 rounded-3xl border border-slate-200 hover:border-emerald-500 hover:shadow-xl transition-all flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                        <Activity size={32} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">Player / Athlete</h3>
                    <p className="text-slate-500 text-sm font-medium">Book courts, execute escrow splits, and monitor your athletic resume natively.</p>
                </button>

                <button onClick={() => handleRoleSelect('TURF_OWNER')} className="group bg-white p-8 rounded-3xl border border-slate-200 hover:border-emerald-500 hover:shadow-xl transition-all flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <LayoutDashboard size={32} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">Turf Manager</h3>
                    <p className="text-slate-500 text-sm font-medium">Overlook operations, manage facility bookings, and yield revenue.</p>
                </button>

                <button onClick={() => handleRoleSelect('TOURNAMENT_ORGANIZER')} className="group bg-white p-8 rounded-3xl border border-slate-200 hover:border-emerald-500 hover:shadow-xl transition-all flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all">
                        <Trophy size={32} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">Tournament Host</h3>
                    <p className="text-slate-500 text-sm font-medium">Orchestrate brackets, command registrations, and issue payouts.</p>
                </button>
            </div>
        </div>
    );
}
