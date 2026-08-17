import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../config';
import { MapPin, ShieldCheck, CheckCircle2, Search, ArrowRight } from 'lucide-react';
import { getSportImage } from '../../utils/sportsImages';

export default function PlayerDiscovery() {
    const { session } = useAuth();
    const [facilities, setFacilities] = useState<any[]>([]);
    const [homeTurfId, setHomeTurfId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFacilities = async () => {
            try {
                const res = await fetch(`${API_URL}/api/v1/facilities`);
                const data = await res.json();
                if (Array.isArray(data)) setFacilities(data);
            } catch (e) {
                console.error('Failed to fetch facilities', e);
            } finally {
                setLoading(false);
            }
        };

        const fetchProfile = async () => {
            if (!session) return;
            try {
                const res = await fetch(`${API_URL}/api/v1/registration/status`, {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });
                const data = await res.json();
                if (data.profile?.home_turf_id) {
                    setHomeTurfId(data.profile.home_turf_id);
                }
            } catch (e) { }
        };

        fetchFacilities();
        fetchProfile();
    }, [session]);

    const handleRegisterTurf = async (venueId: string) => {
        if (!session) {
            alert('Please login first');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/v1/player/register-home-turf`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ venueId }) // playerId is derived from JWT backend
            });
            const data = await res.json();

            if (data.success || res.ok) {
                setHomeTurfId(venueId);
            } else {
                alert('Failed to register: ' + (data.error || 'Unknown error'));
            }
        } catch (err) {
            console.error(err);
            alert('Registration error');
        }
    };

    const filteredFacilities = facilities.filter(f =>
        (f.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.address || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
            {/* HER0 SECTION */}
            <div className="bg-white pt-[calc(env(safe-area-inset-top)+2rem)] px-6 pb-12 rounded-b-[2.5rem] shadow-xl relative overflow-hidden text-center md:text-left">
                <div className="absolute inset-0 z-0">
                    <img
                        src={getSportImage('football', 0)}
                        alt="Background"
                        className="w-full h-full object-cover opacity-15 grayscale"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900" />
                </div>

                <div className="relative z-10 max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter mb-2 leading-tight">
                            Scout Your <span className="text-emerald-500">Home Turf</span>
                        </h1>
                        <p className="text-slate-500 font-medium max-w-md">Discover premium arenas and set your primary location to match with local players automatically.</p>
                    </div>
                </div>

                <div className="relative z-10 mt-8 max-w-xl mx-auto md:mx-0">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by venue name or area..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-100/80 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 transition-all shadow-lg"
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 mt-10">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <MapPin className="text-emerald-600 w-5 h-5" /> Available Facilities
                    </h2>
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">{filteredFacilities.length} Results</span>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse bg-white rounded-3xl h-72 w-full shadow-sm border border-slate-100"></div>
                        ))}
                    </div>
                ) : filteredFacilities.length === 0 ? (
                    <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center flex flex-col items-center">
                        <MapPin size={48} className="text-slate-200 mb-4" />
                        <h3 className="text-lg font-bold text-slate-800 mb-2">No turfs found in your perimeter.</h3>
                        <p className="text-slate-500 text-sm max-w-sm">Try searching for a different area or adjusting your filters.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredFacilities.map(venue => {
                            const isRegistered = homeTurfId === venue.id;
                            return (
                                <div key={venue.id} className={`group bg-white rounded-3xl overflow-hidden shadow-sm border transition-all duration-300 ${isRegistered ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:shadow-xl hover:border-emerald-300'}`}>
                                    <div className="h-48 bg-white relative overflow-hidden">
                                        <img
                                            src={getSportImage('turf', venue.id?.charCodeAt(0) || 0)}
                                            alt={venue.name}
                                            className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                        {/* Badges */}
                                        <div className="absolute top-4 left-4 flex gap-2">
                                            {isRegistered && (
                                                <span className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-md flex items-center gap-1">
                                                    <ShieldCheck size={12} /> HOME TURF
                                                </span>
                                            )}
                                        </div>

                                        <div className="absolute bottom-4 left-4 right-4">
                                            <h3 className="text-xl font-black text-white tracking-tight leading-tight drop-shadow-lg">{venue.name}</h3>
                                            <p className="text-emerald-300 text-xs font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
                                                <MapPin size={10} /> {venue.city || 'Local Zone'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-5">
                                        <p className="text-slate-500 text-sm line-clamp-2 mb-4 min-h-[40px] font-medium">
                                            {venue.address || 'Address details not provided by owner.'}
                                        </p>

                                        <div className="flex items-center gap-3 text-xs mb-6 text-slate-700 font-bold bg-slate-50 p-2 rounded-lg">
                                            <span>Outdoor: <span className={venue.is_outdoor ? 'text-emerald-600' : 'text-slate-500'}>{venue.is_outdoor ? 'Yes' : 'No'}</span></span>
                                            <span className="text-slate-600">•</span>
                                            <span>Premium Approved</span>
                                        </div>

                                        <button
                                            onClick={() => handleRegisterTurf(venue.id)}
                                            disabled={isRegistered}
                                            className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-2 
                                                ${isRegistered
                                                    ? 'bg-emerald-50 text-emerald-700 cursor-default border-emerald-200'
                                                    : 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95'
                                                }`}
                                        >
                                            {isRegistered ? (
                                                <><CheckCircle2 size={16} /> Verified Home</>
                                            ) : (
                                                <>Claim As Home Base <ArrowRight size={16} /></>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
