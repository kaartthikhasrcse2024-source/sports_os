import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import { LocateFixed, Search, Map, DollarSign, Activity, Star } from 'lucide-react';

// Custom Marker SVGs to differentiate Turfs and Tournaments without default pins
const createCustomIcon = (color: string, isPulse: boolean = false) => new L.DivIcon({
    className: 'custom-icon',
    html: `
        <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
            ${isPulse ? `<div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: ${color}; opacity: 0.4; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
            <div style="width: 20px; height: 20px; background: ${color}; border: 3px solid #1a1a1a; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>
            <div style="position: absolute; bottom: 0; width: 4px; height: 10px; background: #1a1a1a;"></div>
        </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
});

const turfIcon = createCustomIcon('#22c55e'); // Green
const tournamentIcon = createCustomIcon('#eab308'); // Gold
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
        if (userPos) map.flyTo(userPos, 13);
    }, [userPos, map]);
    return userPos ? <Marker position={userPos} icon={userIcon} /> : null;
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
    const [radius, setRadius] = useState<number | ''>('');
    const [minPrice, setMinPrice] = useState<number | ''>('');
    const [maxPrice, setMaxPrice] = useState<number | ''>('');

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
            if (radius) params.radius_km = radius;
            if (sport) params.sport = sport;
            if (minPrice) params.min_price = minPrice;
            if (maxPrice) params.max_price = maxPrice;

            const { data } = await axios.get('http://localhost:3001/api/v1/venues/search', { params });
            setMarkers(data.markers || []);
        } catch (error) {
            console.error('API Geometry fault:', error);
        } finally {
            setLoading(false);
        }
    }, [bounds, center, radius, sport, minPrice, maxPrice]);

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
        <div className="flex flex-col md:flex-row h-[85vh] bg-dark-900 border border-dark-700 rounded-2xl overflow-hidden relative shadow-2xl mt-4">

            {/* Control Dashboard Overlay */}
            <div className="w-full md:w-96 bg-dark-800 p-6 flex flex-col gap-6 overflow-y-auto border-r border-dark-700 z-[1000]">
                <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2 mb-2">
                        <Map size={24} className="text-primary-500" />
                        Discovery Matrix
                    </h2>
                    <p className="text-xs text-gray-400 font-bold tracking-widest uppercase">Target your local battlefield</p>
                </div>

                <form onSubmit={searchNominatim} className="relative flex">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search City or Zone..."
                        className="w-full bg-dark-900 border border-dark-700 rounded-l-xl p-4 text-white text-sm focus:border-primary-500 outline-none"
                    />
                    <button type="submit" className="bg-primary-500 px-4 rounded-r-xl text-black hover:bg-primary-400">
                        <Search size={18} />
                    </button>
                    <button
                        type="button"
                        onClick={captureUserGeolocation}
                        className="absolute right-[4rem] top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                        title="Locate Me"
                    >
                        <LocateFixed size={18} />
                    </button>
                </form>

                <div className="space-y-4">
                    <h3 className="text-xs text-gray-500 font-black tracking-widest uppercase border-b border-dark-700 pb-2">Operational Filters</h3>

                    <div>
                        <label className="text-xs font-bold text-gray-400 mb-1 block">Sport Type</label>
                        <select
                            value={sport}
                            onChange={(e) => setSport(e.target.value)}
                            className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-sm focus:border-primary-500 outline-none"
                        >
                            <option value="">Any Sport</option>
                            <option value="futsal">Futsal</option>
                            <option value="basketball">Basketball</option>
                            <option value="tennis">Tennis</option>
                            <option value="badminton">Badminton</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 mb-1 flex justify-between">
                            <span>Radius Constraint</span>
                            <span className="text-primary-500">{radius ? `${radius} km` : 'Worldwide'}</span>
                        </label>
                        <input
                            type="range" min="1" max="100"
                            value={radius === '' ? 50 : radius} onChange={(e) => setRadius(Number(e.target.value))}
                            className="w-full accent-primary-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 mb-1 block">Min Rate</label>
                            <div className="relative">
                                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="number" value={minPrice} onChange={e => setMinPrice(Number(e.target.value))}
                                    className="w-full bg-dark-900 border border-dark-700 rounded-xl p-2 pl-8 text-white text-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 mb-1 block">Max Rate</label>
                            <div className="relative">
                                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="number" value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))}
                                    className="w-full bg-dark-900 border border-dark-700 rounded-xl p-2 pl-8 text-white text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-auto">
                    <div className="flex flex-col gap-2 p-4 bg-dark-900 rounded-xl border border-dark-700 border-dashed">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-wide">Available Turfs</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-wide">Active Tournaments</span>
                        </div>
                    </div>
                    {loading && <div className="text-[10px] text-primary-500 font-black tracking-widest text-center mt-4 animate-pulse">Syncing Geography...</div>}
                </div>
            </div>

            {/* Geographical Canvas Sandbox */}
            <div className="flex-1 relative z-0">
                <MapContainer center={[40.7128, -74.0060]} zoom={12} className="w-full h-full" zoomControl={false}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        className="map-tiles-dark" // We will add a dark mode CSS filter
                    />

                    <LocationMarker userPos={userLoc} />
                    <MapBoundsInterceptor onBoundsChange={(b, c) => { setBounds(b); setCenter(c); }} />

                    <MarkerClusterGroup
                        chunkedLoading
                        polygonOptions={{ fillColor: '#22c55e', color: '#22c55e', weight: 1 }}
                    >
                        {markers.map((node) => (
                            <Marker
                                key={`${node.type}-${node.id}`}
                                position={[node.lat, node.lng]}
                                icon={node.type === 'TURF' ? turfIcon : tournamentIcon}
                            >
                                <Popup className="sportsos-popup">
                                    <div className="p-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${node.type === 'TURF' ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
                                                {node.type}
                                            </span>
                                            {node.type === 'TURF' && <div className="flex items-center text-xs text-yellow-500 font-bold"><Star size={12} className="mr-1" /> 4.8</div>}
                                        </div>
                                        <h3 className="text-lg font-black text-gray-900 leading-tight mb-1">{node.name}</h3>
                                        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{node.address}</p>

                                        <div className="bg-gray-100 rounded-lg p-2 mb-3">
                                            {node.type === 'TURF' ? (
                                                <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                                                    <DollarSign size={14} className="text-green-600" />
                                                    Rate: <span>${((node.min_rate || 0) / 100).toFixed(2)} - ${((node.max_rate || 0) / 100).toFixed(2)}/hr</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                                                    <Activity size={14} className="text-yellow-600" />
                                                    Entry: <span>${((node.min_rate || 0) / 100).toFixed(2)} /team</span>
                                                </div>
                                            )}
                                        </div>

                                        <a href={node.type === 'TURF' ? `/facility/${node.id}` : `/tournament/${node.id}`}
                                            className="block text-center w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-2 rounded-lg text-xs uppercase tracking-widest transition-colors">
                                            {node.type === 'TURF' ? 'Book Slot' : 'View Tournament'}
                                        </a>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MarkerClusterGroup>
                </MapContainer>
            </div>

            {/* Inject Dark Mode CSS Filter Overrides */}
            <style>{`
                .map-tiles-dark {
                    filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
                }
                .leaflet-popup-content-wrapper {
                    background: #ffffff;
                    color: #1a1a1a;
                    border-radius: 1rem;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
                }
                .leaflet-popup-tip {
                    background: #ffffff;
                }
                .leaflet-container {
                    background: #121212;
                }
            `}</style>
        </div>
    );
}
