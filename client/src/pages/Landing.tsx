import { Link } from 'react-router-dom';
import { Activity, LayoutDashboard, ArrowRight, Trophy } from 'lucide-react';

export default function Landing() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center text-gray-900 px-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-500/20 via-dark-900 to-dark-900 pointer-events-none" />

            <div className="z-10 text-center mb-16">
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4">SPORTS <span className="text-emerald-700">OS</span></h1>
                <p className="text-gray-600 text-lg md:text-xl font-medium tracking-wide">Choose your portal to enter the ecosystem.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl z-10">
                {/* Player Portal Card */}
                <Link to="/player/login" className="group bg-white/80 backdrop-blur-xl border border-gray-300 hover:border-emerald-600 p-10 rounded-[2rem] transition-all transform hover:scale-[1.02] shadow-2xl flex flex-col">
                    <div className="bg-emerald-600/10 w-20 h-20 rounded-full flex items-center justify-center text-emerald-700 mb-6 group-hover:bg-emerald-600 group-hover:text-dark-900 transition-colors">
                        <Activity size={32} />
                    </div>
                    <h2 className="text-3xl font-black mb-3 text-gray-900">Athlete Portal</h2>
                    <p className="text-gray-600 font-medium mb-10 flex-1">Book courts, execute escrow splits, and monitor your athletic resume metrics natively.</p>
                    <div className="flex items-center text-emerald-700 font-bold tracking-widest uppercase text-sm">
                        Enter Workspace <ArrowRight size={18} className="ml-2 group-hover:translate-x-2 transition-transform" />
                    </div>
                </Link>

                {/* Owner Portal Card */}
                <Link to="/owner/login" className="group bg-white/80 backdrop-blur-xl border border-gray-300 hover:border-emerald-600 p-10 rounded-[2rem] transition-all transform hover:scale-[1.02] shadow-2xl flex flex-col">
                    <div className="bg-emerald-600/10 w-20 h-20 rounded-full flex items-center justify-center text-emerald-700 mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <LayoutDashboard size={32} />
                    </div>
                    <h2 className="text-3xl font-black mb-3 text-gray-900">Venue Command</h2>
                    <p className="text-gray-600 font-medium mb-10 flex-1">Monitor real-time slot matrices, manage registered rosters, and configure dynamic yield limits.</p>
                    <div className="flex items-center text-emerald-700 font-bold tracking-widest uppercase text-sm">
                        Access Console <ArrowRight size={18} className="ml-2 group-hover:translate-x-2 transition-transform" />
                    </div>
                </Link>

                {/* Organizer Portal Card */}
                <Link to="/organizer/login" className="group bg-white/80 backdrop-blur-xl border border-gray-300 hover:border-emerald-600 p-10 rounded-[2rem] transition-all transform hover:scale-[1.02] shadow-2xl flex flex-col">
                    <div className="bg-emerald-600/10 w-20 h-20 rounded-full flex items-center justify-center text-emerald-700 mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <Trophy size={32} />
                    </div>
                    <h2 className="text-3xl font-black mb-3 text-gray-900">League Organizer</h2>
                    <p className="text-gray-600 font-medium mb-10 flex-1">Orchestrate brackets, command tournament sign-ups, and process escrow collections locally.</p>
                    <div className="flex items-center text-emerald-700 font-bold tracking-widest uppercase text-sm">
                        Enter Authority <ArrowRight size={18} className="ml-2 group-hover:translate-x-2 transition-transform" />
                    </div>
                </Link>
            </div>

            {/* Development Bypass */}
            <div className="z-10 mt-12">
                <Link to="/dashboard" onClick={() => localStorage.setItem('dev_mock_role', 'PLAYER')} className="text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-500 bg-white/50 px-6 py-3 rounded-full font-bold tracking-widest text-xs uppercase transition-all shadow-lg backdrop-blur-md flex items-center gap-2">
                    Enter Without Login (Dev Mode) <ArrowRight size={14} />
                </Link>
            </div>
        </div>
    );
}
