import { useState, useEffect } from 'react';

export default function SlotGrid() {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:3001/api/v1/bookings/slots')
            .then(r => r.json())
            .then(setSlots)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="h-screen bg-gray-50 text-gray-900 flex justify-center items-center">Loading Slots...</div>;

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
            <h1 className="text-3xl font-bold text-emerald-700 mb-6">Facility Availability</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {slots.map((s: any) => (
                    <div key={s.id} className="bg-white border border-gray-300 rounded p-5 relative group">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-bold">Court {s.court_id?.slice(0, 5) || 'Standard'}</h3>
                            <span className="text-xs font-bold uppercase py-1 px-2 rounded tracking-wider bg-green-500/20 text-green-400">Available</span>
                        </div>
                        <div className="text-gray-600 text-sm mb-4">
                            <div>{new Date(s.start_time).toLocaleString()}</div>
                        </div>

                        <div className="pt-4 border-t border-gray-300 group relative inline-block cursor-help w-full mt-auto">
                            <div className="text-2xl font-black text-gray-900 group-hover:text-emerald-700 flex items-center justify-between transition-colors">
                                ₹{s.yield_price?.final || 1500}

                                {s.yield_price?.breakdown && s.yield_price.breakdown.length > 0 && (
                                    <div className="relative">
                                        <span className="text-xs text-emerald-700 underline decoration-dashed">Details</span>
                                        <div className="absolute bottom-full right-0 mb-2 w-48 bg-gray-50 p-2 rounded text-xs text-gray-700 font-mono shadow-[0_0_10px_rgba(234,179,8,0.3)] border border-emerald-600 z-10 hidden group-hover:block pointer-events-none">
                                            <div>Base: ₹{s.yield_price.original}</div>
                                            {s.yield_price.breakdown.map((b: string, i: number) => (
                                                <div key={i} className="text-emerald-700">{b}</div>
                                            ))}
                                            <div className="border-t border-gray-600 mt-1 pt-1 font-bold text-gray-900">Final: ₹{s.yield_price.final}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {slots.length === 0 && <div className="text-gray-600 text-center mt-10">No slots available right now.</div>}
        </div>
    );
}
