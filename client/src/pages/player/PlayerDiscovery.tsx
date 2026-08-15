import { useState } from 'react';

const mockVenues = [
    {
        id: 'CHN-OWN-01',
        name: 'Downtown Arena & Turf',
        location: '4th Main Road, Anna Nagar, Chennai - 600040',
        owner: 'Vigneshwaran R. (CHN-OWN-01)',
        sports: 'Football (5-a-side), Box Cricket',
        rate: '₹1,200/hr.'
    },
    {
        id: 'CHN-OWN-02',
        name: 'Bayview Smash & Turf Hub',
        location: 'East Coast Road (ECR), Neelankarai, Chennai - 600115',
        owner: 'Karthik Subramaniam (CHN-OWN-02)',
        sports: 'Badminton, Football (7-a-side)',
        rate: '₹800/hr.'
    }
];

const presetPlayers = [
    { id: 'CHN-PLY-101', name: 'Ashwin Kumar', location: 'Velachery', home_turf_id: null },
    { id: 'CHN-PLY-103', name: 'Mohamed Riyas', location: 'Triplicane', home_turf_id: 'CHN-OWN-01' },
    { id: 'CHN-PLY-105', name: 'Pradeep Chandran', location: 'T. Nagar', home_turf_id: 'CHN-OWN-01' },
    { id: 'CHN-PLY-102', name: 'Kavyashree S.', location: 'Nungambakkam', home_turf_id: 'CHN-OWN-02' }
];

export default function PlayerDiscovery() {
    const [selectedLocation, setSelectedLocation] = useState('Velachery, Chennai');
    const [players, setPlayers] = useState(presetPlayers);
    const [activePlayerId, setActivePlayerId] = useState('CHN-PLY-101'); // Default to Ashwin

    const handleRegisterTurf = async (venueId: string) => {
        try {
            const res = await fetch('/api/v1/player/register-home-turf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: activePlayerId, venueId })
            });
            const data = await res.json();

            if (data.success || res.ok) {
                // Update local state mock to reflect registration
                setPlayers(players.map(p =>
                    p.id === activePlayerId ? { ...p, home_turf_id: venueId } : p
                ));
                alert('Successfully registered as Home Turf!');
            } else {
                alert('Failed to register: ' + (data.error || 'Unknown error'));
            }
        } catch (err) {
            console.error(err);
            alert('Registration error');
        }
    };

    const activePlayer = players.find(p => p.id === activePlayerId);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 p-8 font-sans">
            <h1 className="text-3xl font-black text-emerald-700 uppercase tracking-wider mb-8 border-b-2 border-emerald-600 pb-2">Turf Discovery</h1>

            <div className="mb-8 p-4 border border-gray-300 bg-white">
                <label className="block text-sm font-bold text-emerald-700 mb-2 uppercase tracking-wide">Select Area</label>
                <select
                    className="w-full bg-gray-50 border border-gray-300 text-gray-900 p-3 rounded-none focus:outline-none focus:border-emerald-600"
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                >
                    <option value="Velachery, Chennai">Velachery, Chennai</option>
                    <option value="Anna Nagar">Anna Nagar</option>
                    <option value="Adyar">Adyar</option>
                    <option value="Nungambakkam">Nungambakkam</option>
                    <option value="ECR">ECR</option>
                </select>
            </div>

            <div className="mb-8 p-4 border border-gray-300 bg-white text-sm">
                <h2 className="text-xl font-bold text-emerald-700 mb-4 uppercase">Acting as Player</h2>
                <select
                    className="w-full bg-gray-50 border border-gray-300 text-gray-900 p-2 mb-4 rounded-none"
                    value={activePlayerId}
                    onChange={(e) => setActivePlayerId(e.target.value)}
                >
                    {players.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.id}) - {p.location}</option>
                    ))}
                </select>
                <p><strong>Current Active:</strong> {activePlayer?.name}</p>
                <p><strong>Home Turf Registered:</strong> <span className={activePlayer?.home_turf_id ? "text-emerald-700" : "text-gray-500"}>{activePlayer?.home_turf_id || 'None'}</span></p>
            </div>

            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-widest mb-4">Available Venues</h2>
                {mockVenues.map(venue => {
                    const isRegistered = activePlayer?.home_turf_id === venue.id;
                    return (
                        <div key={venue.id} className="border-l-4 border-emerald-600 bg-white p-6 flex flex-col md:flex-row justify-between items-start md:items-center">
                            <div className="mb-4 md:mb-0">
                                <h3 className="text-xl font-bold text-emerald-700">{venue.name}</h3>
                                <p className="text-gray-600 mt-1">{venue.location}</p>
                                <div className="mt-3 text-sm flex gap-4 text-gray-700">
                                    <span><strong>Owner:</strong> {venue.owner}</span>
                                    <span><strong>Rate:</strong> {venue.rate}</span>
                                </div>
                                <p className="text-sm mt-1 text-gray-700"><strong>Sports:</strong> {venue.sports}</p>
                            </div>
                            <button
                                onClick={() => handleRegisterTurf(venue.id)}
                                disabled={isRegistered}
                                className={`px-6 py-3 font-bold uppercase tracking-wider transition-colors border ${isRegistered ? 'bg-dark-700 border-gray-300 text-gray-500 cursor-not-allowed' : 'bg-emerald-600 text-dark-900 border-emerald-600 hover:bg-transparent hover:text-emerald-700'}`}
                            >
                                {isRegistered ? 'Registered' : 'Register as Home Turf'}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Displaying Mock Records from objective */}
            <div className="mt-12 p-6 border border-gray-300">
                <h2 className="text-lg font-bold text-emerald-700 uppercase tracking-widest mb-4">Mock Records Overview</h2>
                <ul className="space-y-2 text-sm text-gray-700">
                    {players.map(p => (
                        <li key={p.id}>
                            <span className="inline-block w-48 font-bold">{p.name} ({p.id})</span>
                            <span>{p.location}</span>
                            {' -> '}
                            <span className={p.home_turf_id ? "text-emerald-700 font-bold" : "text-gray-500"}>
                                {p.home_turf_id ? `Home Turf: ${p.home_turf_id}` : 'No Home Turf'}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
