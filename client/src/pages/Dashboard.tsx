import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { LayoutDashboard, MapPin, Trophy, ShieldAlert, LogOut, Menu, X, Users, ClipboardList } from 'lucide-react';

export default function Dashboard() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // Bypass login redirect
                setUser({ email: 'guest@sportsos.com', id: 'guest-id' });
                setProfile({ role: 'PLAYER' });
                setLoading(false);
                return;
            }
            setUser(session.user);

            try {
                const response = await fetch('http://localhost:3001/api/profile', {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`
                    }
                });
                if (response.ok) {
                    const profileData = await response.json();
                    setProfile(profileData);
                }
            } catch (err) {
                console.error('Failed to fetch profile', err);
            }
            setLoading(false);
        };
        checkUser();
    }, [navigate]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-900 flex items-center justify-center">
                <div className="text-primary-500 text-xl font-bold animate-pulse">Loading...</div>
            </div>
        );
    }

    const navigationLinks = [
        { name: 'Overview', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Turf & Facilities', path: '/map-search', icon: <MapPin size={20} /> },
        { name: 'Tournaments', path: '/bracket', icon: <Trophy size={20} /> },
        { name: 'Referee Scorecard', path: '/referee', icon: <ClipboardList size={20} /> },
        { name: 'Free Agents', path: '/free-agents', icon: <Users size={20} /> },
        { name: 'My Profile', path: `/profile/${user?.id || 'guest-id'}`, icon: <ShieldAlert size={20} /> },
    ];

    return (
        <div className="min-h-screen bg-dark-900 flex flex-col md:flex-row text-white w-full overflow-hidden">
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 bg-dark-800 border-b border-dark-700 w-full z-20">
                <div className="text-xl font-bold text-primary-500">Sports OS</div>
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-300">
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 bg-dark-800 border-r border-dark-700 w-64 transform transition-transform duration-200 ease-in-out z-10
                ${mobileMenuOpen ? 'translate-x-0 mt-[60px] pb-[60px]' : '-translate-x-full'}
                md:relative md:translate-x-0 md:mt-0 md:pb-0
                flex flex-col h-full
            `}>
                <div className="hidden md:flex p-6 border-b border-dark-700 items-center justify-center">
                    <h2 className="text-2xl font-bold text-primary-500 tracking-wider">SPORTS OS</h2>
                </div>

                <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto w-full">
                    <p className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Main Menu</p>
                    {navigationLinks.map((link) => (
                        <Link
                            key={link.name}
                            to={link.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${window.location.pathname === link.path
                                    ? 'bg-primary-500/10 text-primary-500'
                                    : 'text-gray-400 hover:text-white hover:bg-dark-700/50'
                                }`}
                        >
                            {link.icon}
                            <span className="font-medium">{link.name}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-dark-700 w-full">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:text-white hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden w-full relative">
                <header className="hidden md:flex items-center justify-between p-6 bg-dark-900 border-b border-dark-700">
                    <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
                    <div className="flex items-center gap-4">
                        <div className="bg-dark-800 px-4 py-2 rounded-full border border-dark-700 text-sm flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-gray-300">System Online</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                    <div className="max-w-5xl mx-auto space-y-6">
                        {/* Profile Card */}
                        <div className="bg-dark-800 rounded-xl p-6 md:p-8 border border-dark-700 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-bl-full -mr-4 -mt-4 blur-2xl"></div>
                            <div className="relative z-10">
                                <h2 className="text-3xl font-bold text-white mb-2">
                                    Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}!
                                </h2>
                                <p className="text-gray-400 mb-6">Manage your sports activities, bookings, and team operations.</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="bg-dark-900/50 p-4 rounded-lg border border-dark-700/50 flex flex-col">
                                        <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Email Account</span>
                                        <span className="text-gray-200 font-medium">{user?.email}</span>
                                    </div>
                                    <div className="bg-dark-900/50 p-4 rounded-lg border border-dark-700/50 flex flex-col">
                                        <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Account Role</span>
                                        <span className="text-primary-400 font-bold tracking-wide uppercase">{profile?.role || 'PLAYER'}</span>
                                    </div>
                                    <div className="bg-dark-900/50 p-4 rounded-lg border border-dark-700/50 flex flex-col md:col-span-2 lg:col-span-1">
                                        <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">System ID</span>
                                        <span className="text-gray-400 font-mono text-sm truncate">{user?.id}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Link to="/map-search" className="bg-gradient-to-br from-dark-800 to-dark-700 p-6 rounded-xl border border-dark-600 hover:border-primary-500/50 group transition-all">
                                <div className="w-12 h-12 bg-primary-500/20 text-primary-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <MapPin size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary-400 transition-colors">Book a Facility</h3>
                                <p className="text-gray-400 text-sm">Find and reserve local turfs, courts, and fields instantly.</p>
                            </Link>

                            <Link to="/bracket" className="bg-gradient-to-br from-dark-800 to-dark-700 p-6 rounded-xl border border-dark-600 hover:border-primary-500/50 group transition-all">
                                <div className="w-12 h-12 bg-primary-500/20 text-primary-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Trophy size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary-400 transition-colors">Tournament Brackets</h3>
                                <p className="text-gray-400 text-sm">View live tournament progression, match pairings, and seedings.</p>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
