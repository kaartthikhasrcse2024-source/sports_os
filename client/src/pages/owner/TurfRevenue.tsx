import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { BarChart3, TrendingUp, HandCoins, Activity, FileText, CheckCircle } from 'lucide-react';
import { API_URL } from '../../config';
import { getSportImage } from '../../utils/sportsImages';
import { usePageEnter } from '../../utils/animations';

export default function TurfRevenue() {
    const pageClass = usePageEnter();
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            try {
                const res = await fetch(`${API_URL}/api/v1/owner/analytics`, {
                    headers: { 'Authorization': `Bearer ${session?.access_token}` }
                });
                if (res.ok) {
                    setAnalytics(await res.json());
                }
            } catch (e) {
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    return (
        <div className={`so-fade-in ${pageClass}`}>
            <div className="flex flex-col mb-8">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3 so-fade-up">
                    <HandCoins className="text-emerald-600" size={24} /> Financial Intelligence
                </h2>
                <p className="text-slate-500 font-medium text-sm mt-1 so-fade-up so-delay-1">Real-time revenue monitoring and transparent payout breakdowns.</p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="so-skeleton h-40 rounded-3xl" />
                    <div className="so-skeleton h-40 rounded-3xl" />
                    <div className="so-skeleton h-64 rounded-3xl md:col-span-2" />
                </div>
            ) : !analytics ? (
                <div className="bg-slate-900 rounded-[2rem] p-16 text-center shadow-xl flex flex-col items-center relative overflow-hidden group border border-slate-800">
                    <img src={getSportImage('stadium', 0)} className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay group-hover:scale-105 transition-transform duration-700 pointer-events-none" alt="" />
                    <div className="absolute inset-0 bg-slate-900/60 pointer-events-none" />

                    <div className="w-20 h-20 bg-emerald-500/10 backdrop-blur-md rounded-[2rem] flex items-center justify-center mb-6 relative z-10 border border-emerald-500/20 shadow-inner">
                        <Activity size={40} className="text-emerald-400 drop-shadow-sm" />
                    </div>
                    <h3 className="text-3xl font-black text-white tracking-tight mb-2 relative z-10">Analytics Initializing</h3>
                    <p className="text-slate-300 text-base max-w-sm mx-auto font-medium relative z-10">Revenue streams will populate here once transactions begin processing.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* KPI Cards */}
                    <div className="bg-slate-900 p-6 flex flex-col justify-between rounded-[2rem] shadow-xl text-white relative overflow-hidden group so-scale-in so-delay-1 border border-slate-800">
                        <img src={getSportImage('stadium', 1)} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700 pointer-events-none" alt="" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-900/90 to-slate-900/90 pointer-events-none" />

                        <div className="relative z-10 flex items-center justify-between mb-8">
                            <div className="w-14 h-14 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400">
                                <TrendingUp size={28} />
                            </div>
                            <h3 className="font-extrabold uppercase tracking-widest text-emerald-300 text-[10px] text-right break-words text-right">Today's Revenue</h3>
                        </div>
                        <div className="relative z-10 mt-6">
                            <p className="text-5xl lg:text-7xl font-black tracking-tighter text-white">₹{analytics.summary.todayRevenue}</p>
                            <p className="text-emerald-200/70 text-[10px] mt-2 font-black tracking-widest uppercase">Gross Processed Volume</p>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-6 flex flex-col justify-between rounded-[2rem] shadow-xl text-white relative overflow-hidden group so-scale-in so-delay-2 border border-slate-800">
                        <img src={getSportImage('stadium', 2)} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700 pointer-events-none" alt="" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/90 to-slate-800/90 pointer-events-none" />

                        <div className="relative z-10 flex items-center justify-between mb-8">
                            <div className="w-14 h-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center text-slate-300">
                                <BarChart3 size={28} />
                            </div>
                            <h3 className="font-extrabold uppercase tracking-widest text-slate-400 text-[10px] text-right">Occupancy Rate</h3>
                        </div>
                        <div className="relative z-10 mt-6">
                            <p className="text-5xl lg:text-7xl font-black text-white tracking-tighter">{analytics.summary.occupancyRate}</p>
                            <p className="text-slate-500 text-[10px] mt-2 font-black tracking-widest uppercase">Active Capacity Utilized</p>
                        </div>
                    </div>

                    {/* Breakdown section */}
                    <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-[2rem] shadow-sm col-span-1 md:col-span-2 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 opacity-[0.02] text-slate-900 pointer-events-none transform translate-x-4 -translate-y-4">
                            <FileText size={140} />
                        </div>
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100 shadow-sm">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Settlement Statement</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Platform Fee Breakdown Structure</p>
                                </div>
                            </div>
                            <div className="hidden md:flex text-right flex-col">
                                <span className="text-[10px] font-black tracking-widest uppercase text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full shrink-0">Standard Contract</span>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative z-10">
                            <div className="flex justify-between items-center p-5 md:p-6 border-b border-white hover:bg-slate-100/50 transition-colors">
                                <span className="font-bold text-slate-700 text-sm">Gross Revenue Collections</span>
                                <div className="text-right">
                                    <span className="font-black tracking-tight text-slate-900 text-lg block">₹{analytics.summary.todayRevenue}</span>
                                    <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">100% Volume</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center p-5 md:p-6 border-b border-white bg-slate-100/50 hover:bg-slate-100 transition-colors">
                                <span className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                    Sports OS Platform Processing Fee
                                </span>
                                <div className="text-right">
                                    <span className="font-black tracking-tight text-red-500 text-lg block">- ₹{Math.round(analytics.summary.todayRevenue * 0.05)}</span>
                                    <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">5% Deducted</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center p-6 md:p-8 bg-emerald-50/50 relative overflow-hidden">
                                <div className="absolute inset-y-0 left-0 w-1.5 bg-emerald-500"></div>
                                <div>
                                    <span className="font-black text-emerald-900 text-sm md:text-base uppercase tracking-widest block">Net Payout to Registered Bank</span>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <span className="font-black tracking-tighter text-emerald-600 text-3xl block">₹{Math.round(analytics.summary.todayRevenue * 0.95)}</span>
                                    <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2.5 py-1 rounded-full font-black uppercase tracking-widest flex items-center justify-end gap-1 mt-2 shadow-sm">
                                        <CheckCircle size={10} /> Auto-Settled
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
