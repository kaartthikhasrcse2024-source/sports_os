import { useState, useEffect } from 'react';

export default function SlotBooking() {
    const [paymentMode, setPaymentMode] = useState<'full' | 'split'>('full');
    const [timeLeft, setTimeLeft] = useState(15 * 60);
    const [isActive, setIsActive] = useState(false);
    const [settled, setSettled] = useState(false);

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
        setIsActive(true);
        setTimeLeft(15 * 60);
        try {
            await fetch('/api/v1/escrow/split-pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slot_id: 4092 })
            });
        } catch (e) { console.error(e); }
    };

    const handleFullPay = () => {
        setPaymentMode('full');
        setIsActive(false);
    }

    const handleSimulateSettle = async () => {
        try {
            await fetch('/api/v1/escrow/split-pay/settle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slot_id: 4092 })
            });
            setIsActive(false);
            setSettled(true);
            alert('Settlement complete - Slot CONFIRMED_BOOKED!');
        } catch (e) { console.error(e); }
    };

    const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const secs = (timeLeft % 60).toString().padStart(2, '0');

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 p-8 font-sans">
            <h1 className="text-3xl font-black text-emerald-700 uppercase tracking-wider mb-8 border-b-2 border-emerald-600 pb-2">Checkout Details</h1>

            <div className="mb-8 p-6 border border-gray-300 bg-white">
                <h2 className="text-xl font-bold text-gray-900 uppercase tracking-widest mb-4">Slot Selection</h2>
                <div className="text-gray-700 space-y-2">
                    <p><strong className="text-emerald-700">Time:</strong> Saturday 7:00 PM - 8:00 PM</p>
                    <p><strong className="text-emerald-700">Venue:</strong> Downtown Arena & Turf (Anna Nagar)</p>
                    <p><strong className="text-emerald-700">Total Fee:</strong> ₹1,200</p>
                </div>
            </div>

            <div className="mb-8 flex gap-4">
                <button
                    onClick={handleFullPay}
                    className={`flex-1 py-4 text-center font-black uppercase tracking-wider border transition-colors 
                        ${paymentMode === 'full' ? 'bg-emerald-600 text-dark-900 border-emerald-600' : 'bg-gray-50 text-gray-600 border-gray-300 hover:border-emerald-600/50'}`}
                >
                    Full Payment (₹1,200)
                </button>
                <button
                    onClick={handleSplitPay}
                    className={`flex-1 py-4 text-center font-black uppercase tracking-wider border transition-colors 
                        ${paymentMode === 'split' ? 'bg-cyan-500 text-dark-900 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'bg-gray-50 text-gray-600 border-gray-300 hover:border-cyan-500/50'}`}
                >
                    Split Payment (₹300 x 4)
                </button>
            </div>

            {paymentMode === 'split' && (
                <div className="p-8 border border-cyan-200 bg-cyan-50 rounded relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-cyan-500 text-dark-900 px-4 py-1 font-black text-sm uppercase tracking-widest">
                        {settled ? '00:00 - SETTLED' : `${mins}:${secs} - LIVE`}
                    </div>

                    <h2 className="text-2xl font-bold text-cyan-700 uppercase tracking-widest mb-2">Split Escrow Hold Activated</h2>
                    <p className="text-gray-600 mb-6 text-sm">Your slot has been put on hold (HELD_PENDING). Invite your friends to settle the balance before the timer expires.</p>

                    <div className="mb-6 p-4 border border-gray-300 bg-gray-50 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Shareable Invite Link</p>
                            <p className="font-mono text-cyan-600">https://turfos.in/pay/CHN-SPL-8821</p>
                        </div>
                        <button className="px-4 py-2 border border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-dark-900 uppercase font-bold tracking-widest text-xs transition duration-200">
                            Copy Link
                        </button>
                    </div>

                    <div className="space-y-3">
                        <div className="p-4 border border-green-500/30 bg-green-500/10 flex justify-between">
                            <span className="font-bold text-green-400">[1] Ashwin Kumar (CHN-PLY-101)</span>
                            <span className="font-black text-green-500 uppercase tracking-widest">PAID (₹300)</span>
                        </div>
                        <div className={`p-4 border ${settled ? 'border-green-500/30 bg-green-500/10' : 'border-yellow-500/30 bg-yellow-500/10'} flex justify-between`}>
                            <span className={`font-bold ${settled ? 'text-green-400' : 'text-yellow-400'}`}>[2] Mohamed Riyas (CHN-PLY-103)</span>
                            <span className={`font-black uppercase tracking-widest ${settled ? 'text-green-500' : 'text-yellow-500'}`}>{settled ? 'PAID (₹300)' : 'PENDING (₹300)'}</span>
                        </div>
                        <div className={`p-4 border ${settled ? 'border-green-500/30 bg-green-500/10' : 'border-yellow-500/30 bg-yellow-500/10'} flex justify-between`}>
                            <span className={`font-bold ${settled ? 'text-green-400' : 'text-yellow-400'}`}>[3] Pradeep Chandran (CHN-PLY-105)</span>
                            <span className={`font-black uppercase tracking-widest ${settled ? 'text-green-500' : 'text-yellow-500'}`}>{settled ? 'PAID (₹300)' : 'PENDING (₹300)'}</span>
                        </div>
                        <div className={`p-4 border ${settled ? 'border-green-500/30 bg-green-500/10' : 'border-yellow-500/30 bg-yellow-500/10'} flex justify-between`}>
                            <span className={`font-bold ${settled ? 'text-green-400' : 'text-yellow-400'}`}>[4] Player 4</span>
                            <span className={`font-black uppercase tracking-widest ${settled ? 'text-green-500' : 'text-yellow-500'}`}>{settled ? 'PAID (₹300)' : 'PENDING (₹300)'}</span>
                        </div>
                    </div>

                    {!settled && (
                        <button
                            onClick={handleSimulateSettle}
                            className="mt-6 w-full py-4 text-center font-black text-sm uppercase tracking-widest border border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-dark-900 transition-colors"
                        >
                            Simulate Remaining Approvals
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
