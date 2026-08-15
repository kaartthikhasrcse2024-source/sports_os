import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { DollarSign, BarChart3, TrendingUp } from 'lucide-react';

export default function TurfRevenue() {
    const [analytics, setAnalytics] = useState<any>(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            try {
                const res = await fetch('http://localhost:3001/api/v1/owner/analytics', {
                    headers: { 'Authorization': `Bearer ${session?.access_token}` }
                });
                if (res.ok) {
                    setAnalytics(await res.json());
                }
            } catch (e) { }
        };
        fetchAnalytics();
    }, []);

    return (
        <div className="bg-white border border-gray-200 p-8 shadow-xl relative overflow-hidden">
            <h2 className="text-xl text-gray-900 font-black uppercase mb-6 flex items-center gap-2">
                <DollarSign className="text-emerald-600" /> Revenue & Occupancy Pulse
            </h2>

            {!analytics ? (
                <div className="flex justify-center items-center h-32">
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest animate-pulse">Scanning matrix...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-emerald-50 border border-emerald-100 p-6 flex flex-col justify-between rounded-xl">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="text-emerald-600" size={20} />
                            <h3 className="text-gray-900 font-black uppercase tracking-tight">Today's Revenue</h3>
                        </div>
                        <p className="text-4xl font-mono font-bold text-emerald-700">₹{analytics.dailyRevenue}</p>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 p-6 flex flex-col justify-between rounded-xl">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 className="text-gray-500" size={20} />
                            <h3 className="text-gray-900 font-black uppercase tracking-tight">Occupancy Rate</h3>
                        </div>
                        <p className="text-4xl font-mono font-bold text-emerald-700">{analytics.occupancyRate}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
