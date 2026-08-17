import { useState, useEffect } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { API_URL } from '../config';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Dynamic re-centering component
function ChangeView({ center }: { center: [number, number] }) {
    const map = useMap();
    map.setView(center, map.getZoom());
    return null;
}

export default function MapSearch() {
    const [facilities, setFacilities] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [radius, setRadius] = useState(15);
    const [tagFilter, setTagFilter] = useState('');

    const getUserLocation = async () => {
        try {
            const coordinates = await Geolocation.getCurrentPosition();
            setLocation({ lat: coordinates.coords.latitude, lng: coordinates.coords.longitude });
        } catch (err) {
            console.error("Geolocation failed:", err);
        }
    };

    useEffect(() => {
        getUserLocation();
        // Default fallback to central coordinates if prompt is denied (e.g. Bangalore center)
        setTimeout(() => {
            setLocation(loc => loc || { lat: 12.9716, lng: 77.5946 });
        }, 2000);
    }, []);

    const fetchNearby = async () => {
        if (!location) return;
        setLoading(true);
        let url = `${API_URL}/api/v1/facilities/nearby?lat=${location.lat}&lng=${location.lng}&radius_km=${radius}`;

        // Tag filtering mapping to the JSONB array structure
        if (tagFilter) {
            url += `&tags=["${tagFilter}"]`;
        }

        try {
            const res = await fetch(url);
            const data = await res.json();
            setFacilities(data || []);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (location) fetchNearby();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location, radius, tagFilter]);

    return (
        <div className="h-screen flex flex-col bg-gray-50 text-gray-900">
            <div className="p-4 bg-white border-b border-gray-300 flex flex-wrap gap-4 items-center">
                <h1 className="text-xl font-bold text-emerald-700 mr-4">Near Me</h1>

                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Radius: {radius}km</label>
                    <input type="range" min="1" max="50" value={radius} onChange={e => setRadius(Number(e.target.value))} className="accent-primary-500" />
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Filter:</label>
                    <select value={tagFilter} onChange={e => setTagFilter(e.target.value)} className="bg-gray-50 border border-gray-300 rounded px-2 py-1 text-sm">
                        <option value="">All Amenities</option>
                        <option value="turf">Turf</option>
                        <option value="clay">Clay Court</option>
                        <option value="floodlights">Floodlights</option>
                        <option value="indoor">Indoor</option>
                    </select>
                </div>

                {loading && <span className="text-sm text-gray-500 animate-pulse">Searching specific bounding radius...</span>}
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar List */}
                <div className="w-1/3 p-4 overflow-y-auto bg-gray-50 border-r border-dark-800">
                    <h2 className="text-lg font-semibold mb-4">{facilities.length} Venues Found</h2>
                    {facilities.map(f => (
                        <div key={f.id} className="p-4 mb-3 bg-white rounded border border-gray-300 hover:border-emerald-600 cursor-pointer transition-colors">
                            <h3 className="font-bold text-emerald-700">{f.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{f.address}</p>
                            <div className="mt-2 flex flex-wrap gap-1">
                                {f.tags?.map((t: string) => <span key={t} className="text-xs bg-dark-700 px-2 py-1 rounded text-gray-700">{t}</span>)}
                            </div>
                            <div className="mt-3 text-sm text-gray-700 font-semibold">{Number(f.distance_meters / 1000).toFixed(1)} km away</div>
                        </div>
                    ))}
                    {facilities.length === 0 && !loading && <div className="text-gray-500 text-sm">No facilities within threshold constraint. Change filters.</div>}
                </div>

                {/* Map View */}
                <div className="w-2/3 h-full z-0 relative">
                    {location ? (
                        <MapContainer center={[location.lat, location.lng]} zoom={12} style={{ height: '100%', width: '100%' }}>
                            <ChangeView center={[location.lat, location.lng]} />
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            />

                            {/* User Context Marker */}
                            <Marker position={[location.lat, location.lng]}>
                                <Popup>You are statically routed here.</Popup>
                            </Marker>

                            {facilities.map(f => (
                                <Marker key={f.id} position={[f.lat, f.lng]}>
                                    <Popup>
                                        <strong>{f.name}</strong><br />
                                        {Number(f.distance_meters / 1000).toFixed(2)} km
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white text-gray-500">
                            Locating you securely...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
