import { Link } from 'react-router-dom';
import { Activity, LayoutDashboard, ArrowRight, Trophy } from 'lucide-react';

export default function Landing() {
    return (
        <div className="min-h-screen bg-dark-900 flex flex-col justify-center items-center text-white px-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-500/20 via-dark-900 to-dark-900 pointer-events-none" />

            <div className="z-10 text-center mb-16">
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4">SPORTS <span className="text-primary-500">OS</span></h1>
                <p className="text-gray-400 text-lg md:text-xl font-medium tracking-wide">Choose your portal to enter the ecosystem.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl z-10">
                {/* Player Portal Card */}
                <Link to="/player/login" className="group bg-dark-800/80 backdrop-blur-xl border border-dark-700 hover:border-primary-500 p-10 rounded-[2rem] transition-all transform hover:scale-[1.02] shadow-2xl flex flex-col">
                    <div className="bg-primary-500/10 w-20 h-20 rounded-full flex items-center justify-center text-primary-500 mb-6 group-hover:bg-primary-500 group-hover:text-dark-900 transition-colors">
                        <Activity size={32} />
                    </div>
                    <h2 className="text-3xl font-black mb-3 text-white">Athlete Portal</h2>
                    <p className="text-gray-400 font-medium mb-10 flex-1">Book courts, execute escrow splits, and monitor your athletic resume metrics natively.</p>
                    <div className="flex items-center text-primary-500 font-bold tracking-widest uppercase text-sm">
                        Enter Workspace <ArrowRight size={18} className="ml-2 group-hover:translate-x-2 transition-transform" />
                    </div>
                </Link>

                {/* Owner Portal Card */}
                <Link to="/owner/login" className="group bg-[#0c0c0c] border border-[#222] hover:border-[#ffcc00] p-10 rounded-[2rem] transition-all transform hover:scale-[1.02] shadow-2xl flex flex-col">
                    <div className="bg-[#ffcc00]/10 w-20 h-20 rounded-full flex items-center justify-center text-[#ffcc00] mb-6 group-hover:bg-[#ffcc00] group-hover:text-black transition-colors">
                        <LayoutDashboard size={32} />
                    </div>
                    <h2 className="text-3xl font-black mb-3 text-white">Venue Command</h2>
                    <p className="text-gray-400 font-medium mb-10 flex-1">Monitor real-time slot matrices, manage registered rosters, and configure dynamic yield limits.</p>
                    <div className="flex items-center text-[#ffcc00] font-bold tracking-widest uppercase text-sm">
                        Access Console <ArrowRight size={18} className="ml-2 group-hover:translate-x-2 transition-transform" />
                    </div>
                </Link>

                {/* Organizer Portal Card */}
                <Link to="/organizer/login" className="group bg-[#0A1220] border border-[#164E63] hover:border-cyan-500 p-10 rounded-[2rem] transition-all transform hover:scale-[1.02] shadow-2xl flex flex-col">
                    <div className="bg-cyan-500/10 w-20 h-20 rounded-full flex items-center justify-center text-cyan-500 mb-6 group-hover:bg-cyan-500 group-hover:text-black transition-colors">
                        <Trophy size={32} />
                    </div>
                    <h2 className="text-3xl font-black mb-3 text-white">League Organizer</h2>
                    <p className="text-cyan-100/50 font-medium mb-10 flex-1">Orchestrate brackets, command tournament sign-ups, and process escrow collections locally.</p>
                    <div className="flex items-center text-cyan-500 font-bold tracking-widest uppercase text-sm">
                        Enter Authority <ArrowRight size={18} className="ml-2 group-hover:translate-x-2 transition-transform" />
                    </div>
                </Link>
            </div>

            {/* Development Bypass */}
            <div className="z-10 mt-12">
                <Link to="/dashboard" onClick={() => localStorage.setItem('dev_mock_role', 'PLAYER')} className="text-gray-500 hover:text-white border border-gray-700 hover:border-gray-500 bg-dark-800/50 px-6 py-3 rounded-full font-bold tracking-widest text-xs uppercase transition-all shadow-lg backdrop-blur-md flex items-center gap-2">
                    Enter Without Login (Dev Mode) <ArrowRight size={14} />
                </Link>
            </div>
        </div>
    );
}
