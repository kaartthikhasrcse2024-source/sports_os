import { useState, useEffect } from 'react';
import {
    Search, MapPin, ChevronDown, Users, Calendar, Trophy,
    ChevronRight, ArrowRight, Zap, Star, Clock,
    TrendingUp, Flame, Heart, Home, Compass, User
} from 'lucide-react';
import BottomNav from './BottomNav';
import type { NavItem } from './BottomNav';

const PLAYER_TABS: NavItem[] = [
    { id: 'home', label: 'Home', Icon: Home },
    { id: 'discover', label: 'Discover', Icon: Compass },
    { id: 'games', label: 'Bookings', Icon: Calendar },
    { id: 'tournaments', label: 'Tournaments', Icon: Trophy },
    { id: 'profile', label: 'Profile', Icon: User },
];
import VenueMapDiscovery from './VenueMapDiscovery';
import PlayerProfile from '../pages/PlayerProfile';
import { supabase } from '../supabase';
import { API_URL } from '../config';
import { Link, useNavigate } from 'react-router-dom';
import { getSportImage } from '../utils/sportsImages';
import { usePageEnter, useInView, useCounter } from '../utils/animations';

// ── Animated stat counter (reused from PlayerProfile pattern) ────────────────
function StatCounter({ value, suffix = '', delay = 0 }: { value: number; suffix?: string; delay?: number }) {
    const [ref, visible] = useInView(0.2);
    const count = useCounter(visible ? value : 0, 1200 + delay);
    return <span ref={ref as any} className="tabular-nums">{count}{suffix}</span>;
}

// ── Sport category config ────────────────────────────────────────────────────
const SPORT_CATEGORIES = [
    { key: 'football', label: 'Football', emoji: '⚽' },
    { key: 'cricket', label: 'Cricket', emoji: '🏏' },
    { key: 'basketball', label: 'Basketball', emoji: '🏀' },
    { key: 'badminton', label: 'Badminton', emoji: '🏸' },
    { key: 'tennis', label: 'Tennis', emoji: '🎾' },
    { key: 'volleyball', label: 'Volleyball', emoji: '🏐' },
];

export default function PlayerHomeScreen() {
    const pageClass = usePageEnter();
    const navigate = useNavigate();
    const [currentTab, setCurrentTab] = useState('home');
    const [searchQuery, setSearchQuery] = useState('');
    const [sportFilter, setSportFilter] = useState('');
    const [isMapView, setIsMapView] = useState(false);

    // Real API Data states
    const [facilities, setFacilities] = useState<any[]>([]);
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [myBookings, setMyBookings] = useState<any[]>([]);
    const [freeAgents, setFreeAgents] = useState<any[]>([]);
    const [profile, setProfile] = useState<any>(null);
    const [athleticStats, setAthleticStats] = useState<any>(null);
    const [sessionUser, setSessionUser] = useState<any>(null);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;
                setSessionUser(session.user);

                const headers = { 'Authorization': `Bearer ${session.access_token}` };

                // Fetch user profile
                const profileRes = await fetch(`${API_URL}/api/v1/player/profile`, { headers });
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    setProfile(profileData);
                }

                // Fetch athletic stats
                if (session.user) {
                    const athRes = await fetch(`${API_URL}/api/v1/players/${session.user.id}/athletic`, { headers });
                    if (athRes.ok) {
                        const athData = await athRes.json();
                        setAthleticStats(athData);
                    }
                }

                // Fetch real facilities
                const facRes = await fetch(`${API_URL}/api/v1/facilities`, { headers });
                if (facRes.ok) {
                    const facData = await facRes.json();
                    setFacilities(facData);
                }

                // Fetch real tournaments
                const tourRes = await fetch(`${API_URL}/api/v1/tournaments`, { headers });
                if (tourRes.ok) {
                    const tourData = await tourRes.json();
                    setTournaments(tourData);
                }

                // Fetch my bookings
                const bookRes = await fetch(`${API_URL}/api/v1/player/bookings`, { headers });
                if (bookRes.ok) {
                    const bookData = await bookRes.json();
                    setMyBookings(bookData);
                }

                // Fetch free agents
                try {
                    const faRes = await fetch(`${API_URL}/api/v1/players/free-agents`, { headers });
                    if (faRes.ok) {
                        const faData = await faRes.json();
                        setFreeAgents(Array.isArray(faData) ? faData.slice(0, 8) : []);
                    }
                } catch { /* optional endpoint */ }
            } catch (e) {
                console.error("Failed fetching dashboard data", e);
            } finally {
                setLoadingData(false);
            }
        };

        if (['home', 'discover', 'games', 'tournaments'].includes(currentTab)) {
            fetchDashboardData();
        }
    }, [currentTab]);

    const filteredFacilities = facilities.filter(f => {
        const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.city.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const upcomingBooking = myBookings.find(b => b.status === 'CONFIRMED' || b.status === 'PENDING');

    // ═══════════════════════════════════════════════════════════════════════════
    // TAB 1: HOME — Premium sports discovery landing
    // ═══════════════════════════════════════════════════════════════════════════
    const renderHome = () => (
        <div className={`${pageClass} pb-24`}>
            {/* ── 1. Compact Header ─────────────────────────────────────────── */}
            <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-100 px-5 py-3 flex items-center justify-between"
                style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}>
                <div>
                    <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                        Hi, {profile?.name?.split(' ')[0] || 'Player'} 👋
                    </h1>
                    <p className="text-[11px] text-slate-500 font-semibold tracking-wide">What are you playing today?</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                        <MapPin size={12} className="text-emerald-500" />
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{profile?.city || 'Local'}</span>
                    </div>
                    <div onClick={() => setCurrentTab('profile')}
                        className="w-9 h-9 rounded-full overflow-hidden border-2 border-emerald-400 cursor-pointer hover:scale-110 transition-transform shadow-md">
                        <img src={getSportImage('player_avatars', sessionUser?.id?.charCodeAt(0) || 0)}
                            className="w-full h-full object-cover" alt="avatar" />
                    </div>
                </div>
            </div>

            {/* ── 2. Hero Discovery Banner ──────────────────────────────────── */}
            <div className="relative mx-4 mt-4 rounded-[2rem] overflow-hidden shadow-lg" style={{ height: '220px' }}>
                <img src={getSportImage('football', 1)} alt="Hero"
                    className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 z-10">
                    <h2 className="text-2xl font-black text-white tracking-tight leading-tight mb-1.5 drop-shadow-lg">
                        Ready for your<br />next game?
                    </h2>
                    <p className="text-slate-300 text-xs font-medium mb-4 max-w-[220px]">
                        Discover turfs, tournaments & players near you
                    </p>
                    <button onClick={() => setCurrentTab('discover')}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black uppercase tracking-widest text-[10px] px-5 py-2.5 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all flex items-center gap-1.5 active:scale-95">
                        Explore Turfs <ChevronRight size={14} />
                    </button>
                </div>
                {/* Decorative glow */}
                <div className="absolute top-4 right-4 w-20 h-20 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
            </div>

            {/* ── 3. Sport Category Carousel ────────────────────────────────── */}
            <section className="pt-7">
                <div className="px-5 mb-3 flex justify-between items-center">
                    <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Flame className="text-orange-500 w-4 h-4" /> Sports
                    </h2>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest cursor-pointer hover:opacity-80">View all</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide px-5 snap-x">
                    {SPORT_CATEGORIES.map((sport, _i) => (
                        <div key={sport.key}
                            onClick={() => setSportFilter(sportFilter === sport.key ? '' : sport.key)}
                            className={`shrink-0 snap-start relative w-[5.5rem] h-24 rounded-2xl overflow-hidden cursor-pointer transition-all group ${sportFilter === sport.key
                                ? 'ring-[3px] ring-emerald-400 scale-105 shadow-lg'
                                : 'hover:scale-105 active:scale-95 shadow-sm border border-slate-100'
                                }`}>
                            <img src={getSportImage(sport.key, 0)} alt={sport.label}
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
                            <div className="absolute bottom-2 inset-x-0 text-center">
                                <span className="text-[10px] text-white font-bold tracking-wide drop-shadow">{sport.label}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <div className="px-5 space-y-8 pt-4 max-w-2xl mx-auto">
                {/* ── 4. Quick Discovery Cards ──────────────────────────────── */}
                <section>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { icon: MapPin, label: 'Find a Turf', sub: 'Book your ground', img: 'turf', imgIdx: 2, action: () => setCurrentTab('discover') },
                            { icon: Calendar, label: 'My Bookings', sub: 'Upcoming games', img: 'football', imgIdx: 2, action: () => setCurrentTab('games') },
                            { icon: Trophy, label: 'Tournaments', sub: 'Join brackets', img: 'stadium', imgIdx: 0, action: () => setCurrentTab('tournaments') },
                            { icon: Users, label: 'Find Players', sub: 'Build your squad', img: 'basketball', imgIdx: 1, action: () => navigate('/free-agents') },
                        ].map((card, _i) => (
                            <div key={card.label} onClick={card.action}
                                className="relative group cursor-pointer overflow-hidden rounded-2xl h-28 shadow-sm border border-slate-100 active:scale-[0.97] transition-all">
                                <img src={getSportImage(card.img, card.imgIdx)}
                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 to-slate-900/15" />
                                <div className="absolute inset-x-0 bottom-0 p-3.5">
                                    <card.icon className="text-emerald-400 mb-1 w-4 h-4 drop-shadow" />
                                    <h3 className="text-white font-black text-[13px] tracking-tight leading-tight">{card.label}</h3>
                                    <p className="text-slate-300 text-[9px] font-semibold mt-0.5 tracking-wide">{card.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── 5. Turfs Near You (Horizontal Scroll) ────────────────── */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <MapPin className="text-emerald-600 w-4 h-4" /> Turfs Near You
                        </h2>
                        <span onClick={() => setCurrentTab('discover')}
                            className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest cursor-pointer hover:opacity-80 flex items-center">
                            See all <ChevronRight size={12} />
                        </span>
                    </div>

                    {loadingData ? (
                        <div className="flex gap-4 overflow-x-auto scrollbar-hide">
                            {[1, 2, 3].map(n => <div key={n} className="shrink-0 w-64 h-56 rounded-2xl bg-slate-100 animate-pulse" />)}
                        </div>
                    ) : facilities.length === 0 ? (
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center relative overflow-hidden">
                            <img src={getSportImage('turf', 2)} className="absolute inset-0 w-full h-full object-cover opacity-5 grayscale" />
                            <div className="relative z-10 w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-sm">
                                <MapPin size={24} className="text-emerald-500" />
                            </div>
                            <h3 className="text-base font-black text-slate-800 mb-1 relative z-10">No turfs found nearby</h3>
                            <p className="text-xs text-slate-500 font-medium relative z-10">Try expanding your search area</p>
                        </div>
                    ) : (
                        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x -mx-5 px-5">
                            {facilities.slice(0, 6).map((venue, i) => {
                                const rating = (4.0 + (i % 10) / 10).toFixed(1);
                                return (
                                    <Link key={venue.id} to={`/book/${venue.id}`}
                                        className="shrink-0 snap-start w-64 group">
                                        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-lg hover:border-emerald-200 transition-all">
                                            <div className="h-36 relative overflow-hidden bg-slate-100">
                                                <img src={getSportImage('turf', venue.id.charCodeAt(0) || i)} alt={venue.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
                                                <div className="absolute top-2.5 right-2.5 bg-slate-900/75 backdrop-blur text-amber-400 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                                                    <Star size={10} fill="currentColor" /> {rating}
                                                </div>
                                                <div className="absolute bottom-2.5 left-2.5">
                                                    <span className="bg-emerald-500 text-white text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">Available</span>
                                                </div>
                                            </div>
                                            <div className="p-3.5">
                                                <h3 className="font-bold text-sm text-slate-900 truncate group-hover:text-emerald-600 transition-colors">{venue.name}</h3>
                                                <div className="flex items-center justify-between mt-1.5">
                                                    <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                                                        <MapPin size={10} /> {venue.city || 'Local'}
                                                    </span>
                                                    <span className="text-emerald-600 font-black text-sm">₹{venue.hourly_rate || ((i + 1) * 200 + 800)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* ── 6. Your Upcoming Game ─────────────────────────────────── */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <Clock className="text-blue-500 w-4 h-4" /> Your Upcoming Game
                        </h2>
                        <span onClick={() => setCurrentTab('games')}
                            className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest cursor-pointer hover:opacity-80 flex items-center">
                            All bookings <ChevronRight size={12} />
                        </span>
                    </div>

                    {!upcomingBooking ? (
                        <div className="bg-white rounded-2xl p-7 shadow-sm border border-slate-100 text-center relative overflow-hidden group">
                            <img src={getSportImage('football', 0)} className="absolute inset-0 w-full h-full object-cover opacity-[0.03] group-hover:scale-105 transition-transform duration-700" alt="" />
                            <div className="relative z-10 w-14 h-14 bg-gradient-to-br from-emerald-50 to-white rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-sm">
                                <Calendar size={24} className="text-emerald-500" />
                            </div>
                            <h3 className="text-base font-black text-slate-800 mb-1 relative z-10 tracking-tight">No upcoming games</h3>
                            <p className="text-xs text-slate-500 mb-5 relative z-10 font-medium">Book a turf and start playing!</p>
                            <button onClick={() => setCurrentTab('discover')}
                                className="relative z-10 bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] px-6 py-3 rounded-xl hover:bg-emerald-400 shadow-md transition-all active:scale-95">
                                Explore Turfs
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex gap-0 group hover:shadow-md transition-shadow">
                            <div className="w-28 shrink-0 relative overflow-hidden bg-slate-100">
                                <img src={getSportImage('turf', upcomingBooking.id?.charCodeAt(0) || 0)}
                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
                            </div>
                            <div className="flex-1 p-4">
                                <div className="flex items-start justify-between mb-1.5">
                                    <h3 className="font-bold text-sm text-slate-900 leading-tight">{upcomingBooking.facility_name || 'Your Booking'}</h3>
                                    <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${upcomingBooking.status === 'CONFIRMED'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                        }`}>{upcomingBooking.status}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium mb-2">
                                    <Calendar size={12} className="text-emerald-500" />
                                    {upcomingBooking.start_time
                                        ? new Date(upcomingBooking.start_time).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })
                                        : 'TBD'}
                                </div>
                                <div className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded-lg">
                                    <span className="text-[10px] text-slate-500 font-semibold">Cost</span>
                                    <span className="text-sm font-black text-emerald-600">₹{upcomingBooking.total_amount || 0}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* ── 7. Players Near You (Horizontal Scroll) ──────────────── */}
                {freeAgents.length > 0 && (
                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <Users className="text-violet-500 w-4 h-4" /> Players Near You
                            </h2>
                            <span onClick={() => navigate('/free-agents')}
                                className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest cursor-pointer hover:opacity-80 flex items-center">
                                View all <ChevronRight size={12} />
                            </span>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x -mx-5 px-5">
                            {freeAgents.map((agent, i) => (
                                <div key={agent.id || i}
                                    className="shrink-0 snap-start w-32 bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 text-center hover:shadow-md transition-all cursor-pointer active:scale-95"
                                    onClick={() => agent.user_id && navigate(`/profile/${agent.user_id}`)}>
                                    <div className="w-14 h-14 rounded-full mx-auto mb-2.5 overflow-hidden border-2 border-emerald-300 shadow-sm">
                                        <img src={getSportImage('player_avatars', i)} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <h4 className="text-xs font-bold text-slate-900 truncate">{agent.name || 'Player'}</h4>
                                    <p className="text-[9px] text-emerald-600 font-semibold mt-0.5 uppercase tracking-wider">
                                        {agent.sport_category || agent.preferred_sport || 'All Sports'}
                                    </p>
                                    <div className="mt-2 bg-slate-50 rounded-lg px-2 py-1">
                                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                                            {agent.skill_tier || 'Beginner'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── 8. Upcoming Tournaments ───────────────────────────────── */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <Trophy className="text-amber-500 w-4 h-4" /> Tournaments
                        </h2>
                        <span onClick={() => setCurrentTab('tournaments')}
                            className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest cursor-pointer hover:opacity-80 flex items-center">
                            View all <ChevronRight size={12} />
                        </span>
                    </div>

                    {loadingData ? (
                        <div className="h-44 rounded-2xl bg-slate-100 animate-pulse" />
                    ) : tournaments.length === 0 ? (
                        <div className="bg-white rounded-2xl p-7 shadow-sm border border-slate-100 text-center relative overflow-hidden group">
                            <img src={getSportImage('stadium', 2)} className="absolute inset-0 w-full h-full object-cover opacity-[0.03] grayscale bg-blend-luminosity group-hover:scale-105 transition-transform duration-700" alt="" />
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-amber-50/20" />
                            <div className="relative z-10 w-14 h-14 bg-gradient-to-br from-amber-50 to-white rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-100 shadow-sm">
                                <Trophy size={24} className="text-amber-500 drop-shadow-sm" />
                            </div>
                            <h3 className="text-base font-black text-slate-800 mb-1 relative z-10 tracking-tight">No tournaments yet</h3>
                            <p className="text-xs text-slate-500 relative z-10 font-medium">Stay tuned for upcoming competitions</p>
                        </div>
                    ) : (
                        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x -mx-5 px-5">
                            {tournaments.slice(0, 4).map((t, idx) => (
                                <div key={t.id}
                                    className="shrink-0 snap-start w-72 bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 group cursor-pointer hover:shadow-lg transition-all"
                                    onClick={() => navigate('/bracket')}>
                                    <div className="h-32 relative overflow-hidden bg-slate-100">
                                        <img src={getSportImage('stadium', idx)} alt={t.name}
                                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                                        <div className="absolute bottom-3 left-3 right-3">
                                            <span className="bg-amber-500 text-white text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">Pro Event</span>
                                            <h3 className="text-white font-black text-lg tracking-tight mt-1 drop-shadow line-clamp-1">{t.name}</h3>
                                        </div>
                                    </div>
                                    <div className="p-3.5 flex items-center justify-between">
                                        <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                                            <Users size={10} /> {t.max_teams || 16} Teams
                                        </span>
                                        <button className="bg-slate-900 text-white text-[9px] font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-600 transition-colors">
                                            View
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* ── 9. Athletic Identity Card ─────────────────────────────── */}
                {athleticStats && Object.keys(athleticStats).length > 0 && (
                    <section className="pb-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <Zap className="text-emerald-500 w-4 h-4" /> Athletic Identity
                            </h2>
                            <span onClick={() => setCurrentTab('profile')}
                                className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest cursor-pointer hover:opacity-80 flex items-center">
                                Full profile <ChevronRight size={12} />
                            </span>
                        </div>
                        <div className="bg-slate-900 rounded-2xl p-5 relative overflow-hidden shadow-xl">
                            <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/15 rounded-full blur-3xl -mr-8 -mt-8 pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-20 h-20 bg-violet-500/10 rounded-full blur-2xl -ml-6 -mb-6 pointer-events-none" />

                            <div className="flex items-center gap-3.5 mb-4 relative z-10">
                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500 shrink-0 shadow-lg">
                                    <img src={getSportImage('player_avatars', sessionUser?.id?.charCodeAt(0) || 0)}
                                        className="w-full h-full object-cover" alt="" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-sm">{profile?.name || 'Athlete'}</h3>
                                    <span className="text-emerald-400 text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                        {athleticStats.primary_position || 'Utility'}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2.5 relative z-10">
                                {[
                                    { val: athleticStats.vertical_jump_cm || 55, unit: 'cm', label: 'Vert Jump', icon: TrendingUp },
                                    { val: athleticStats.sprint_10m_sec || 1.8, unit: 's', label: 'Sprint', icon: Zap },
                                    { val: athleticStats.stamina_score || 85, unit: '', label: 'Stamina', icon: Heart },
                                ].map((stat, i) => (
                                    <div key={stat.label} className="bg-white/[0.06] rounded-xl p-3 border border-white/[0.08] text-center">
                                        <stat.icon size={14} className="text-emerald-400 mx-auto mb-1.5" />
                                        <span className="text-white font-black text-base block">
                                            <StatCounter value={typeof stat.val === 'number' ? stat.val : parseFloat(stat.val)} suffix={stat.unit ? ` ${stat.unit}` : ''} delay={i * 150} />
                                        </span>
                                        <span className="text-emerald-400/80 text-[8px] font-bold uppercase tracking-wider mt-0.5 block">{stat.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // TAB 2: DISCOVER — Venue search + map mode
    // ═══════════════════════════════════════════════════════════════════════════
    const renderDiscover = () => (
        <div className={`${pageClass} pb-24`}>
            {/* Hero banner */}
            <div className="relative bg-white pt-[calc(env(safe-area-inset-top)+1rem)] px-5 pb-10 rounded-b-[2.5rem] shadow-sm overflow-hidden border-b border-slate-200">
                <img src={getSportImage('turf', 0)} alt="Hero"
                    className="absolute inset-0 w-full h-full object-cover opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-slate-900/10" />

                <div className="relative z-10 flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                        <MapPin size={16} className="text-emerald-400" />
                        <h2 className="text-sm font-bold text-white tracking-wide">{profile?.city || 'Local Zone'}</h2>
                        <ChevronDown size={14} className="text-white/70" />
                    </div>
                    <button onClick={() => setCurrentTab('home')}
                        className="text-[10px] text-white font-bold uppercase tracking-widest bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/20 transition-colors">
                        ← Home
                    </button>
                </div>

                <div className="relative z-10 mb-4 mt-2">
                    <h2 className="text-3xl font-black text-white tracking-tight leading-tight mb-2 drop-shadow-lg">
                        Discover Turfs
                    </h2>
                    <p className="text-sm text-slate-200 font-medium max-w-[250px]">
                        Find the best venues near you
                    </p>
                </div>
            </div>

            {/* Sport filter chips */}
            <div className="flex gap-2 overflow-x-auto px-5 pt-5 pb-2 scrollbar-hide">
                <button onClick={() => setSportFilter('')}
                    className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${!sportFilter ? 'bg-emerald-500 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300'}`}>
                    All
                </button>
                {SPORT_CATEGORIES.map(s => (
                    <button key={s.key} onClick={() => setSportFilter(sportFilter === s.key ? '' : s.key)}
                        className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${sportFilter === s.key ? 'bg-emerald-500 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300'}`}>
                        {s.emoji} {s.label}
                    </button>
                ))}
            </div>

            <div className="px-5 pt-4 max-w-2xl mx-auto space-y-6">
                {/* Search + map toggle */}
                <div className="flex gap-3 items-center">
                    <div className="flex-1 relative">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search turfs by name or location..."
                            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-semibold text-xs" />
                    </div>
                    <button onClick={() => setIsMapView(!isMapView)}
                        className="bg-white border border-slate-200 text-slate-600 px-4 py-3 rounded-xl text-xs font-bold hover:border-emerald-300 transition-colors shrink-0">
                        {isMapView ? 'List' : 'Map'}
                    </button>
                </div>

                {isMapView ? (
                    <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200">
                        <VenueMapDiscovery />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {loadingData ? (
                            [1, 2].map(i => <div key={i} className="h-56 rounded-2xl bg-slate-100 animate-pulse" />)
                        ) : filteredFacilities.length === 0 ? (
                            <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100 text-center relative overflow-hidden">
                                <img src={getSportImage('turf', 0)} className="absolute inset-0 w-full h-full object-cover opacity-5 grayscale" alt="" />
                                <div className="relative z-10 w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm">
                                    <MapPin size={32} className="text-emerald-500/70" />
                                </div>
                                <h3 className="text-xl font-black tracking-tight text-slate-800 mb-1 relative z-10">No arenas found</h3>
                                <p className="text-sm text-slate-500 font-medium relative z-10">Try a different search or clear filters</p>
                            </div>
                        ) : (
                            filteredFacilities.map((venue, i) => {
                                const rating = (4.0 + (i % 10) / 10).toFixed(1);
                                return (
                                    <Link key={venue.id} to={`/book/${venue.id}`} className="block group">
                                        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-lg hover:border-emerald-200 transition-all">
                                            <div className="h-44 relative overflow-hidden bg-slate-100">
                                                <img src={getSportImage('turf', venue.id.charCodeAt(0) || i)} alt={venue.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                                                <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                                                    <div className="bg-white/95 backdrop-blur text-slate-900 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 border border-slate-100">
                                                        <MapPin size={10} className="text-emerald-600" /> {venue.city || 'Local'}
                                                    </div>
                                                    <div className="bg-slate-900/75 backdrop-blur text-amber-400 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                                                        <Star size={10} fill="currentColor" /> {rating}
                                                    </div>
                                                </div>
                                                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                                                    <div className="flex gap-1.5">
                                                        <span className="bg-emerald-500 text-white text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">Football</span>
                                                        <span className="bg-slate-800 text-white text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-white/10">Cricket</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-[9px] text-slate-300 font-semibold uppercase tracking-wider">from</div>
                                                        <div className="text-emerald-400 font-black text-lg leading-none">₹{venue.hourly_rate || ((i + 1) * 200 + 800)}</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-4 flex justify-between items-center">
                                                <div>
                                                    <h3 className="font-bold text-base text-slate-900 group-hover:text-emerald-600 transition-colors">{venue.name}</h3>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"></span>
                                                        <p className="text-[10px] text-slate-500 font-semibold">Available today</p>
                                                    </div>
                                                </div>
                                                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                                    <ArrowRight size={14} />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // TAB 3: BOOKINGS
    // ═══════════════════════════════════════════════════════════════════════════
    const renderMyGames = () => (
        <div className={`${pageClass} px-5 pt-[calc(env(safe-area-inset-top)+2rem)] pb-24 space-y-6 max-w-2xl mx-auto`}>
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5 mb-1">
                    <Calendar className="text-emerald-600 w-6 h-6" /> Your Bookings
                </h1>
                <p className="text-slate-500 text-sm font-medium">Track upcoming and past game bookings</p>
            </div>

            {loadingData ? (
                <div className="space-y-4">
                    <div className="animate-pulse bg-white rounded-2xl h-28 w-full shadow-sm border border-slate-100"></div>
                </div>
            ) : myBookings.length === 0 ? (
                <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-100 text-center relative overflow-hidden group">
                    <img src={getSportImage('stadium', 0)} className="absolute inset-0 w-full h-full object-cover opacity-[0.02] grayscale group-hover:scale-105 transition-transform duration-700" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-50/30" />
                    <div className="relative z-10 w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/10 border border-slate-100 border-b-emerald-100">
                        <Calendar size={32} className="text-emerald-500 drop-shadow-sm" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2 relative z-10 tracking-tight">Your next game is waiting</h3>
                    <p className="text-slate-500 text-sm font-medium max-w-sm mx-auto mb-8 relative z-10">No upcoming bookings. Discover premium turfs and lock in your slot.</p>
                    <button onClick={() => setCurrentTab('discover')}
                        className="relative z-10 bg-emerald-500 text-white font-black uppercase tracking-widest text-[11px] px-8 py-4 rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 hover:-translate-y-0.5 transition-all active:scale-95">
                        Explore Turfs
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {myBookings.map((game, idx) => (
                        <div key={game.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex gap-0 group hover:shadow-md transition-shadow">
                            <div className="w-24 sm:w-28 shrink-0 relative overflow-hidden bg-slate-100">
                                <img src={getSportImage('turf', game.id.charCodeAt(0) || idx)}
                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
                            </div>
                            <div className="flex-1 p-3.5">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-sm text-slate-900 leading-tight group-hover:text-emerald-600 transition-colors">{game.facility_name || 'Facility ' + game.facility_id}</h3>
                                    <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${game.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                        {game.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium mt-1.5">
                                    <Calendar size={11} className="text-emerald-500" />
                                    {game.start_time ? new Date(game.start_time).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }) : 'TBD'}
                                </div>
                                <div className="flex items-center justify-between mt-2.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-50">
                                    <span className="text-[10px] text-slate-500 font-semibold">Total Cost</span>
                                    <span className="text-sm font-black text-emerald-600">₹{game.total_amount || 0}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // TAB 4: TOURNAMENTS
    // ═══════════════════════════════════════════════════════════════════════════
    const renderTournaments = () => (
        <div className={`${pageClass} px-5 pt-[calc(env(safe-area-inset-top)+2rem)] pb-24 space-y-6 max-w-2xl mx-auto`}>
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5 mb-1">
                    <Trophy className="text-amber-500 w-6 h-6" /> Tournaments
                </h1>
                <p className="text-slate-500 text-sm font-medium">Join competitive brackets and win big</p>
            </div>

            {loadingData ? (
                <div className="h-48 rounded-2xl bg-slate-100 animate-pulse" />
            ) : tournaments.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100 text-center relative overflow-hidden group">
                    <img src={getSportImage('stadium', 1)} className="absolute inset-0 w-full h-full object-cover opacity-[0.03] grayscale bg-blend-luminosity group-hover:scale-105 transition-transform duration-700" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-amber-50/40 to-transparent" />
                    <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 relative z-10 shadow-xl shadow-amber-500/10 border border-slate-100 border-b-amber-100">
                        <Trophy size={32} className="text-amber-500 drop-shadow-sm" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2 relative z-10 tracking-tight">No tournaments yet</h3>
                    <p className="text-slate-500 text-sm font-medium max-w-sm mx-auto mb-8 relative z-10">Keep an eye out for upcoming city leagues and flagship competitions.</p>
                    <button onClick={() => setCurrentTab('discover')}
                        className="bg-slate-900 text-white font-black uppercase tracking-widest text-[11px] px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:bg-slate-800 transition-all hover:-translate-y-0.5 relative z-10 active:scale-95">
                        Discover Arenas
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {tournaments.map((t, idx) => (
                        <div key={t.id}
                            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 group cursor-pointer hover:shadow-lg transition-all"
                            onClick={() => navigate('/bracket')}>
                            <div className="h-40 relative overflow-hidden bg-slate-100">
                                <img src={getSportImage('stadium', idx)} alt={t.name}
                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 to-slate-900/15" />
                                <div className="absolute bottom-3 left-3 right-3">
                                    <span className="bg-amber-500 text-white text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mb-1.5 inline-block">Pro Event</span>
                                    <h3 className="font-black text-white text-xl tracking-tight drop-shadow">{t.name}</h3>
                                </div>
                            </div>
                            <div className="p-4 flex items-center justify-between">
                                <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
                                    <Users size={12} className="text-emerald-500" /> {t.max_teams || 16} Teams
                                </span>
                                <button className="bg-slate-900 text-white text-[10px] font-bold px-4 py-2 rounded-xl hover:bg-emerald-600 transition-colors">
                                    View Event
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // SHELL
    // ═══════════════════════════════════════════════════════════════════════════
    return (
        <div className="min-h-[100dvh] bg-slate-50 font-sans selection:bg-emerald-500 selection:text-white relative pb-0">
            {currentTab === 'home' && renderHome()}
            {currentTab === 'discover' && renderDiscover()}
            {currentTab === 'games' && renderMyGames()}
            {currentTab === 'tournaments' && renderTournaments()}
            {currentTab === 'profile' && <div className={pageClass}><PlayerProfile /></div>}

            <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} tabs={PLAYER_TABS} />
        </div>
    );
}
