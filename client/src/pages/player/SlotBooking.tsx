import { useState, useEffect } from 'react';
import RazorpayCheckout from '../../components/payment/RazorpayCheckout';
import { ArrowLeft, Clock, MapPin, Users, CheckCircle2, AlertTriangle, IndianRupee, Copy, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSportImage } from '../../utils/sportsImages';
import { usePageEnter } from '../../utils/animations';
import { API_URL } from '../../config';

export default function SlotBooking() {
    const pageClass = usePageEnter();
    const [paymentMode, setPaymentMode] = useState<'full' | 'split'>('full');
    const [timeLeft, setTimeLeft] = useState(15 * 60);
    const [isActive, setIsActive] = useState(false);
    const [settled, setSettled] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        let interval: any;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const handleSplitPay = async () => {
        setPaymentMode('split');
        setSettled(false);
        setShowSuccess(false);
        setIsActive(true);
        setTimeLeft(15 * 60);
        try {
            await fetch(`${API_URL}/api/v1/escrow/split-pay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slot_id: 4092 })
            });
        } catch (e) { console.error(e); }
    };

    const handleFullPay = () => {
        setPaymentMode('full');
        setIsActive(false);
        setSettled(false);
        setShowSuccess(false);
    }

    const saveBookingToMyGames = () => {
        const newGame = {
            id: Math.random().toString(),
            venue: 'Downtown Arena & Turf (Anna Nagar)',
            time: 'Saturday 7:00 PM - 8:00 PM',
            fee: paymentMode === 'full' ? '₹1,200' : '₹300 (Split)'
        };
        const prev = localStorage.getItem('my_games');
        const games = prev ? JSON.parse(prev) : [];
        games.push(newGame);
        localStorage.setItem('my_games', JSON.stringify(games));
    };

    const handleConfirmFullPay = () => {
        setIsCheckoutOpen(true);
    };

    const handleSimulateSettle = () => {
        setIsCheckoutOpen(true);
    };

    const handleCheckoutSuccess = () => {
        setSettled(true);
        setIsActive(false);
        saveBookingToMyGames();
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);
    };

    const copyLink = () => {
        navigator.clipboard.writeText("https://turfos.in/pay/SPLIT-8821");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const secs = (timeLeft % 60).toString().padStart(2, '0');

    return (
        <div className={`min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans selection:bg-emerald-500 selection:text-slate-900 ${pageClass}`}>

            {showSuccess && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl font-bold flex items-center gap-3 z-50 animate-in slide-in-from-top-10 fade-in duration-300">
                    <CheckCircle2 size={24} />
                    <span className="text-sm uppercase tracking-widest">Booking Confirmed</span>
                </div>
            )}

            {/* Header / Hero component */}
            <div className="bg-white pt-[calc(env(safe-area-inset-top)+2rem)] px-6 pb-12 rounded-b-[3rem] shadow-xl relative overflow-hidden">
                <img
                    src={getSportImage('turf', 0)}
                    alt="Turf"
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />

                <div className="relative z-10 max-w-3xl mx-auto text-center md:text-left text-slate-900 mt-4">
                    <Link to="/player-discovery" className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-bold uppercase tracking-widest text-[10px] mb-6 transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-slate-200 backdrop-blur-md">
                        <ArrowLeft size={12} /> Search Venues
                    </Link>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-4 text-white drop-shadow-lg">Finalize Booking</h1>

                    <div className="bg-slate-50/80 backdrop-blur-md border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row gap-6 mt-8">
                        <div className="flex-1 space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                    <MapPin size={20} />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Venue</p>
                                    <p className="font-bold text-lg leading-tight">Downtown Arena</p>
                                    <p className="text-sm text-slate-600 font-medium">Anna Nagar</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                                    <Clock size={20} />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Schedule</p>
                                    <p className="font-bold text-lg leading-tight">Saturday</p>
                                    <p className="text-sm text-slate-600 font-medium">7:00 PM - 8:00 PM</p>
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:w-px bg-slate-50/80"></div>

                        <div className="flex-1 flex flex-col justify-center items-center md:items-start text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Fee</p>
                            <p className="font-black text-4xl text-slate-900 tracking-tighter w-full mb-1 flex items-center gap-1">
                                <IndianRupee size={28} className="text-emerald-500" /> 1,200
                            </p>
                            <p className="text-[10px] font-bold text-slate-500 bg-white/5 border border-white/5 px-2 py-1 rounded">Includes all taxes</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 -mt-6 relative z-20">
                <div className="bg-white rounded-[2.5rem] p-6 shadow-2xl border border-slate-200 so-slide-up">
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 text-center border-b border-slate-100 pb-4">Select Split Setup</h2>

                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                        <button
                            onClick={handleFullPay}
                            className={`flex-1 p-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex flex-col items-center justify-center gap-2 border-2 
                                ${paymentMode === 'full' ? 'bg-emerald-50 text-emerald-700 border-emerald-500 shadow-[0_10px_20px_rgba(16,185,129,0.1)]' : 'bg-slate-50 text-slate-500 border-transparent hover:border-slate-200'}`}
                        >
                            <IndianRupee size={24} className={paymentMode === 'full' ? 'text-emerald-500' : 'text-slate-500'} />
                            Full Checkout
                            <span className="text-[9px] font-bold text-slate-500">Pay everything upfront</span>
                        </button>
                        <button
                            onClick={handleSplitPay}
                            className={`flex-1 p-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex flex-col items-center justify-center gap-2 border-2 
                                ${paymentMode === 'split' ? 'bg-indigo-50 text-indigo-700 border-indigo-500 shadow-[0_10px_20px_rgba(99,102,241,0.1)]' : 'bg-slate-50 text-slate-500 border-transparent hover:border-slate-200'}`}
                        >
                            <Users size={24} className={paymentMode === 'split' ? 'text-indigo-500' : 'text-slate-500'} />
                            Split Escrow
                            <span className="text-[9px] font-bold text-slate-500">Lock slot, share link</span>
                        </button>
                    </div>

                    {paymentMode === 'full' && (
                        <div className="so-slide-up bg-white rounded-3xl p-8 text-center relative overflow-hidden group" style={{ animationDelay: '60ms', animationFillMode: 'both' }}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl origin-top-right group-hover:scale-150 transition-transform"></div>
                            <h2 className="text-xl font-black text-slate-900 leading-tight mb-2">Ready to secure the slot?</h2>
                            <p className="text-slate-500 text-sm font-medium mb-8">You are paying the entire amount for this session directly.</p>

                            {!settled ? (
                                <button
                                    onClick={handleConfirmFullPay}
                                    className="w-full sm:w-auto mx-auto px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg hover:shadow-emerald-500/30 active:scale-95"
                                >
                                    Proceed to Gateway
                                </button>
                            ) : (
                                <div className="w-full sm:w-auto mx-auto inline-flex items-center justify-center gap-3 px-10 py-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl font-black uppercase tracking-widest text-xs">
                                    <CheckCircle2 size={16} /> PAID IN FULL
                                </div>
                            )}
                        </div>
                    )}

                    {paymentMode === 'split' && (
                        <div className="so-slide-up relative" style={{ animationDelay: '60ms', animationFillMode: 'both' }}>
                            <div className={`p-8 rounded-3xl relative overflow-hidden ${settled ? 'bg-white text-slate-900' : 'bg-indigo-50 border border-indigo-100 text-slate-900'}`}>

                                <div className={`absolute top-0 right-0 px-5 py-2 font-black text-[10px] uppercase tracking-widest rounded-bl-2xl shadow-sm ${settled ? 'bg-emerald-500 text-white' : 'bg-indigo-500 text-slate-900 animate-pulse'}`}>
                                    {settled ? 'Settled' : `${mins}:${secs} Holding`}
                                </div>

                                <h2 className="text-xl font-black tracking-tight mb-2 mt-4 flex items-center gap-2">
                                    {settled ? <CheckCircle2 className="text-emerald-500" /> : <AlertTriangle className="text-indigo-500" />}
                                    {settled ? 'Escrow Cleared' : 'Escrow Hold Active'}
                                </h2>
                                <p className={`text-sm font-medium mb-8 ${settled ? 'text-slate-500' : 'text-slate-500'}`}>
                                    {settled
                                        ? 'All players have contributed. Your booking is 100% confirmed.'
                                        : 'Your slot is held pending full payment. Invite friends to clear the balance.'}
                                </p>

                                {!settled && (
                                    <div className="mb-8 p-1 bg-white border border-indigo-200 rounded-2xl flex items-center justify-between shadow-sm pr-2">
                                        <div className="px-4 py-3 flex-1 overflow-hidden">
                                            <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Shareable Payment Link</p>
                                            <p className="font-mono font-bold text-indigo-600 text-sm truncate">https://turfos.in/pay/SPLIT-8821</p>
                                        </div>
                                        <button
                                            onClick={copyLink}
                                            className="ml-2 w-12 h-12 flex items-center justify-center bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-colors shrink-0"
                                            title="Copy Link"
                                        >
                                            {copied ? <Check size={20} /> : <Copy size={20} />}
                                        </button>
                                    </div>
                                )}

                                <div className="space-y-3 relative z-10">
                                    <div className="p-4 rounded-2xl bg-white border border-emerald-200 flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-black text-[10px] flex items-center justify-center">1</div>
                                            <span className="font-bold text-slate-900 text-sm">You (Host)</span>
                                        </div>
                                        <span className="font-black text-[10px] text-emerald-600 uppercase tracking-widest flex items-center gap-1"><CheckCircle2 size={12} /> PAID (₹300)</span>
                                    </div>

                                    {[2, 3, 4].map(num => (
                                        <div key={num} className={`p-4 rounded-2xl flex items-center justify-between border ${settled ? 'bg-white border-emerald-200 shadow-sm' : 'bg-white/50 border-indigo-200/50'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full font-black text-[10px] flex items-center justify-center ${settled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>{num}</div>
                                                <span className={`font-bold text-sm ${settled ? 'text-slate-900' : 'text-slate-500'}`}>Player {num}</span>
                                            </div>
                                            {settled ? (
                                                <span className="font-black text-[10px] text-emerald-600 uppercase tracking-widest flex items-center gap-1"><CheckCircle2 size={12} /> PAID (₹300)</span>
                                            ) : (
                                                <span className="font-black text-[10px] text-indigo-500 uppercase tracking-widest flex items-center gap-1"><Clock size={12} /> PENDING (₹300)</span>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {!settled && (
                                    <button
                                        onClick={handleSimulateSettle}
                                        className="mt-8 w-full py-4 text-center font-black text-xs uppercase tracking-widest rounded-xl bg-emerald-500 text-white hover:bg-emerald-400 transition-colors shadow-xl active:scale-95"
                                    >
                                        Simulate Escrow Settlement
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <RazorpayCheckout
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                baseAmount={paymentMode === 'full' ? 1200 : 300}
                paymentType={paymentMode === 'full' ? "CASUAL_BOOKING" : "SPLIT_ESCROW"}
                metadata={{ booking_id: 'sample_booking', contribution_id: 'sample_c' }}
                onSuccess={handleCheckoutSuccess}
            />
        </div>
    );
}
