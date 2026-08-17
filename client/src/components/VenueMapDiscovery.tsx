import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import { LocateFixed, Search, Activity, Star, ChevronRight, MapPin } from 'lucide-react';
import { API_URL } from '../config';

// Premium Custom Marker SVGs to differentiate Turfs and Tournaments
const createCustomIcon = (color: string, isPulse: boolean = false) => new L.DivIcon({
    className: 'custom-icon border-0 bg-transparent',
    html: `
        <div style="position: relative; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;">
            ${isPulse ? `<div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: ${color}; opacity: 0.3; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
            <div style="width: 24px; height: 24px; background: ${color}; border: 4px solid #ffffff; border-radius: 50%; box-shadow: 0 4px 15px rgba(0,0,0,0.3); position: relative; z-index: 2;"></div>
            ${!isPulse ? `<div style="position: absolute; bottom: 4px; width: 3px; height: 12px; background: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.2); z-index: 1;"></div>` : ''}
        </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -48]
});

const turfIcon = createCustomIcon('#10b981'); // Emerald 500
const tournamentIcon = createCustomIcon('#6366f1'); // Indigo 500
const userIcon = createCustomIcon('#3b82f6', true); // Blue Pulsing

// Sub-component intercepting map viewport transitions safely throttling API calls
function MapBoundsInterceptor({ onBoundsChange }: { onBoundsChange: (bounds: L.LatLngBounds, center: L.LatLng) => void }) {
    const map = useMap();
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useMapEvents({
        moveend: () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                onBoundsChange(map.getBounds(), map.getCenter());
            }, 400); // 400ms Debounce
        },
        zoomend: () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                onBoundsChange(map.getBounds(), map.getCenter());
            }, 400);
        }
    });

    // Initial Fire Once
    useEffect(() => {
        onBoundsChange(map.getBounds(), map.getCenter());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map]);

    return null;
}

// User Geolocator Map Controller forcing viewport zoom
function LocationMarker({ userPos }: { userPos: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
        if (userPos) map.flyTo(userPos, 14, { duration: 1.5 });
    }, [userPos, map]);
    return userPos ? <Marker position={userPos} icon={userIcon} /> : null;
}

// Ensure map container renders properly upon layout toggle
function MapResizer() {
    const map = useMap();
    useEffect(() => {
        const timeout = setTimeout(() => {
            map.invalidateSize();
        }, 300);
        return () => clearTimeout(timeout);
    }, [map]);
    return null;
}


export default function VenueMapDiscovery() {
    const [markers, setMarkers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Geographical State
    const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);
    const [center, setCenter] = useState<L.LatLng | null>(null);
    const [userLoc, setUserLoc] = useState<[number, number] | null>(null);

    // Sidebar Filter Constraints
    const [searchQuery, setSearchQuery] = useState('');
    const [sport, setSport] = useState('');

    // Fetch marker payload dynamically inside bounds
    const fetchVenues = useCallback(async () => {
        if (!bounds) return;
        setLoading(true);

        try {
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();

            const params: any = {
                ne_lat: ne.lat,
                ne_lng: ne.lng,
                sw_lat: sw.lat,
                sw_lng: sw.lng,
            };

            if (center) {
                params.center_lat = center.lat;
                params.center_lng = center.lng;
            }
            if (sport) params.sport = sport;

            const { data } = await axios.get(`${API_URL}/api/v1/venues/search`, { params });
            setMarkers(data.markers || []);
        } catch (error) {
            console.error('API Geometry fault:', error);
        } finally {
            setLoading(false);
        }
    }, [bounds, center, sport]);

    // Force fetch on arbitrary filter changes natively syncing with current bounds
    useEffect(() => {
        if (bounds) fetchVenues();
    }, [fetchVenues, bounds]);

    // Nominatim Zero-Cost Throttled Autocomplete Search
    const searchNominatim = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery) return;
        try {
            const res = await axios.get('https://nominatim.openstreetmap.org/search', {
                params: { q: searchQuery, format: 'json', limit: 1 },
                headers: { 'User-Agent': 'SportsOS-Agentic-Map-Engine/1.0' }
            });
            if (res.data.length > 0) {
                const { lat, lon } = res.data[0];
                setUserLoc([Number(lat), Number(lon)]);
            } else {
                alert('Location trajectory unknown.');
            }
        } catch (err) {
            console.error('Nominatim block failed', err);
        }
    };

    const captureUserGeolocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLoc([pos.coords.latitude, pos.coords.longitude]),
                (err) => console.warn(err)
            );
        }
    };

    return (
        <div className="w-full h-[550px] relative flex flex-col group">

            {/* Floating Filter Bar Overlay UI */}
            <div className="absolute top-4 left-4 right-4 z-[400] flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between pointer-events-none">

                <form onSubmit={searchNominatim} className="relative flex w-full sm:max-w-md shadow-2xl pointer-events-auto overflow-hidden rounded-2xl">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search Map..."
                        className="w-full bg-white/95 backdrop-blur-md border-0 p-4 pl-5 font-bold text-slate-900 text-sm focus:ring-0 outline-none transition-colors"
                    />
                    <button type="button" onClick={captureUserGeolocation} className="bg-white/95 px-4 text-emerald-600 hover:text-emerald-700 transition-colors border-l border-slate-100" title="Locate Me">
                        <LocateFixed size={18} />
                    </button>
                    <button type="submit" className="bg-emerald-600 px-5 text-slate-900 hover:bg-emerald-700 transition-colors flex items-center justify-center">
                        <Search size={18} />
                    </button>
                </form>

                <div className="flex gap-2 items-center pointer-events-auto">
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl flex items-center px-4 py-2 border border-slate-100">
                        <select
                            value={sport}
                            onChange={(e) => setSport(e.target.value)}
                            className="bg-transparent border-0 text-slate-900 text-sm font-bold focus:ring-0 outline-none cursor-pointer appearance-none pr-6"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right', backgroundRepeat: 'no-repeat' }}
                        >
                            <option value="">All Sports</option>
                            <option value="futsal">Futsal</option>
                            <option value="football">Football</option>
                            <option value="basketball">Basketball</option>
                            <option value="tennis">Tennis</option>
                            <option value="cricket">Cricket</option>
                        </select>
                    </div>

                    {loading && (
                        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-3 border border-slate-100">
                            <Activity size={18} className="text-emerald-600 animate-spin" />
                        </div>
                    )}
                </div>
            </div>

            {/* Geographical Canvas Sandbox */}
            <div className="flex-1 w-full relative z-0 rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-200">
                <MapContainer center={[13.0827, 80.2707]} zoom={12} className="w-full h-full bg-slate-100" zoomControl={false}>
                    {/* Modern Light TileLayer */}
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        className="map-tiles"
                    />

                    <LocationMarker userPos={userLoc} />
                    <MapBoundsInterceptor onBoundsChange={(b, c) => { setBounds(b); setCenter(c); }} />
                    <MapResizer />

                    <MarkerClusterGroup
                        chunkedLoading
                        polygonOptions={{ fillColor: '#10b981', color: '#10b981', weight: 1, opacity: 0.5 }}
                    >
                        {markers.map((node) => (
                            <Marker
                                key={`${node.type}-${node.id}`}
                                position={[node.lat, node.lng]}
                                icon={node.type === 'TURF' ? turfIcon : tournamentIcon}
                            >
                                <Popup className="premium-popup">
                                    <div className="p-0 m-0 w-[240px]">
                                        <div className="h-28 relative overflow-hidden bg-white rounded-t-2xl">
                                            <img
                                                src="https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?q=80&w=600&auto=format&fit=crop"
                                                className="w-full h-full object-cover opacity-60 mix-blend-multiply opacity-15 grayscale"
                                                alt="Turf"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />

                                            <div className="absolute top-3 left-3">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-full shadow-sm flex items-center gap-1 ${node.type === 'TURF' ? 'bg-emerald-500 text-white' : 'bg-indigo-500 text-slate-900'}`}>
                                                    {node.type}
                                                </span>
                                            </div>

                                            <div className="absolute bottom-3 left-3 right-3">
                                                <h3 className="text-lg font-black text-slate-900 leading-tight line-clamp-1">{node.name}</h3>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-white rounded-b-2xl">
                                            <p className="text-xs text-slate-500 mb-4 line-clamp-2 font-medium flex items-start gap-1">
                                                <MapPin size={12} className="shrink-0 mt-0.5 text-slate-500" />
                                                {node.address || 'Address temporarily unavailable'}
                                            </p>

                                            <div className="flex items-center justify-between mb-4 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Rating</span>
                                                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1"><Star size={10} className="text-amber-500 fill-amber-500" /> 4.9</span>
                                                </div>
                                                <div className="w-[1px] h-6 bg-slate-200"></div>
                                                <div className="flex flex-col text-right">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Starting At</span>
                                                    <span className="text-xs font-bold text-emerald-600">₹{((node.min_rate || 50000) / 100).toFixed(0)}<span className="text-slate-500 font-medium">/hr</span></span>
                                                </div>
                                            </div>

                                            <a href={node.type === 'TURF' ? `/book/${node.id}` : `/tournament/${node.id}`}
                                                className="flex items-center justify-center gap-2 w-full bg-white hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all group">
                                                {node.type === 'TURF' ? 'Book Slot' : 'View Hub'}
                                                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                            </a>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MarkerClusterGroup>
                </MapContainer>
            </div>

            {/* Custom Premium CSS Overrides for Leaflet */}
            <style>{`
                .premium-popup .leaflet-popup-content-wrapper {
                    padding: 0;
                    margin: 0;
                    background: transparent;
                    box-shadow: 0 20px 40px -10px rgba(0,0,0,0.3);
                    border-radius: 1rem;
                    overflow: hidden;
                }
                .premium-popup .leaflet-popup-content {
                    margin: 0;
                    width: auto !important;
                }
                .premium-popup .leaflet-popup-tip-container {
                    display: none;
                }
                .premium-popup .leaflet-popup-close-button {
                    color: white !important;
                    top: 10px !important;
                    right: 10px !important;
                    text-shadow: 0 1px 3px rgba(0,0,0,0.5);
                    z-index: 10;
                }
            `}</style>
        </div>
    );
}
