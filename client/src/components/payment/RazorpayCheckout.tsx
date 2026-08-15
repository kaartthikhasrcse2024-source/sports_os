import { useState, useEffect } from 'react';
import { X, ShieldCheck, Zap } from 'lucide-react';
import { supabase } from '../../supabase';

interface RazorpayCheckoutProps {
    isOpen: boolean;
    onClose: () => void;
    baseAmount: number; // in rupees
    paymentType: 'CASUAL_BOOKING' | 'SPLIT_ESCROW' | 'VENUE_LEASE' | 'TOURNAMENT_ENTRY';
    metadata: any;
    onSuccess?: () => void;
}

export default function RazorpayCheckout({ isOpen, onClose, baseAmount, paymentType, metadata, onSuccess }: RazorpayCheckoutProps) {
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const loadScript = () => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            script.onload = () => setScriptLoaded(true);
            document.body.appendChild(script);
        };
        if (isOpen && !scriptLoaded) loadScript();
    }, [isOpen, scriptLoaded]);

    if (!isOpen) return null;

    // Calculate dynamic fee
    let platformFeePercentage = 0;
    if (paymentType === 'CASUAL_BOOKING' || paymentType === 'SPLIT_ESCROW') platformFeePercentage = 0.05;
    if (paymentType === 'VENUE_LEASE') platformFeePercentage = 0.08;
    if (paymentType === 'TOURNAMENT_ENTRY') platformFeePercentage = 0.10;

    const platformFee = Math.round(baseAmount * platformFeePercentage);
    const totalAmount = baseAmount + platformFee;

    const handlePayment = async () => {
        if (!scriptLoaded || !(window as any).Razorpay) {
            alert('Razorpay SDK failed to load. Are you offline?');
            return;
        }

        setProcessing(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) throw new Error('Unauthenticated');

            const orderRes = await fetch('http://localhost:3001/api/v1/payments/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    amount: totalAmount,
                    metadata: { ...metadata, payment_type: paymentType, gross_amount: totalAmount * 100 }
                })
            });

            if (!orderRes.ok) throw new Error('Failed to instantiate order');
            const order = await orderRes.json();

            const options = {
                key: order.key_id,
                amount: order.amount,
                currency: 'INR',
                name: 'Sports OS Platform',
                description: 'Test Mode Checkout',
                order_id: order.order_id,
                handler: async function (response: any) {
                    try {
                        const verifyRes = await fetch('http://localhost:3001/api/v1/payments/verify-signature', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                metadata: { ...metadata, payment_type: paymentType, gross_amount: totalAmount * 100 }
                            })
                        });

                        if (verifyRes.ok) {
                            alert('Payment Successful!');
                            if (onSuccess) onSuccess();
                            onClose();
                        } else {
                            const err = await verifyRes.json();
                            alert(`Verification failed: ${err.error}`);
                        }
                    } catch (err) {
                        alert('Server error verifying payment.');
                    }
                },
                prefill: {
                    name: 'Test Setup',
                    email: 'test@abex.dev',
                    contact: '9999999999'
                },
                theme: { color: '#059669' }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                alert(`Payment Failed: ${response.error.description}`);
            });
            rzp.open();
        } catch (err: any) {
            alert(err.message || 'Payment initiation crashed');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
                <div className="p-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-black uppercase text-gray-900 tracking-tighter flex items-center gap-2">
                        <ShieldCheck className="text-emerald-600" /> Secure Checkout
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 pb-4 flex-1">
                    <div className="space-y-4 text-sm font-medium text-gray-600">
                        <div className="flex justify-between items-center">
                            <span>Base Fee</span>
                            <span className="font-mono text-gray-900">₹{baseAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-700">
                            <span>Platform Conv. Fee ({(platformFeePercentage * 100).toFixed(0)}%)</span>
                            <span className="font-mono">₹{platformFee.toFixed(2)}</span>
                        </div>
                        <div className="h-px w-full bg-gray-200 my-2"></div>
                        <div className="flex justify-between items-center text-xl text-gray-900 font-extrabold uppercase">
                            <span>Total Due</span>
                            <span className="font-mono tracking-tighter">₹{totalAmount.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="mt-8 mb-4 p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex gap-3 text-xs text-blue-800">
                        <Zap size={16} className="text-blue-500 flex-shrink-0" />
                        <p>This is a Test Mode transaction. Select dummy Netbanking or dummy UPI options to simulate a success.</p>
                    </div>
                </div>

                <div className="p-6 bg-gray-50/50 border-t border-gray-100">
                    <button
                        onClick={handlePayment}
                        disabled={processing || !scriptLoaded}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black uppercase tracking-widest text-sm py-4 rounded-xl transition-colors shadow-lg shadow-emerald-600/20"
                    >
                        {processing ? 'Connecting Razorpay...' : `Pay ₹${totalAmount.toFixed(2)}`}
                    </button>
                </div>
            </div>
        </div>
    );
}
