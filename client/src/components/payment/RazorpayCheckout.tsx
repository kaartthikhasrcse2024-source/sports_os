import { useState, useEffect } from 'react';
import { X, ShieldCheck, Wallet } from 'lucide-react';
import { supabase } from '../../supabase';
import { API_URL } from '../../config';

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
            script.onerror = () => {
                console.warn('Razorpay SDK failed to load.');
            };
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
            alert('Payment service is currently unavailable.');
            return;
        }

        setProcessing(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            let token = session?.access_token;

            // Dev Mode fallback token handling if disabled local login
            if (!token && localStorage.getItem('supabase-auth-token')) {
                token = JSON.parse(localStorage.getItem('supabase-auth-token') || '{}').access_token;
            }

            const orderRes = await fetch(`${API_URL}/api/v1/payments/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    amount: totalAmount,
                    metadata: { ...metadata, payment_type: paymentType, gross_amount: totalAmount * 100 }
                })
            });

            if (!orderRes.ok) throw new Error('Failed to instantiate order');
            const order = await orderRes.json();

            // Check for Missing Key preventing further capture explicitly
            if (!order.key_id || order.key_id === 'dummy_key_id' || order.key_id === 'undefined') {
                throw new Error('Payment service is currently unavailable.');
            }

            const options = {
                key: order.key_id,
                amount: order.amount,
                currency: 'INR',
                name: 'Sports OS Platform',
                description: 'Test Mode Checkout',
                order_id: order.order_id,
                handler: async function (response: any) {
                    try {
                        const verifyRes = await fetch(`${API_URL}/api/v1/payments/verify-signature`, {
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

    const handleWalletPayment = () => {
        setProcessing(true);
        setTimeout(() => {
            if (onSuccess) onSuccess();
            onClose();
            setProcessing(false);
        }, 800);
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


                </div>

                <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex flex-col gap-3">
                    <button
                        onClick={handlePayment}
                        disabled={processing || !scriptLoaded}
                        className={`w-full text-white font-black uppercase tracking-widest text-sm py-4 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 disabled:opacity-50`}
                    >
                        {processing ? 'Processing...' : `Pay via Razorpay ₹${totalAmount.toFixed(2)}`}
                    </button>

                    <button
                        onClick={handleWalletPayment}
                        disabled={processing}
                        className="w-full bg-slate-900 border border-slate-700 text-cyan-400 font-black uppercase tracking-widest text-sm py-4 rounded-xl transition-colors shadow-lg shadow-black/20 hover:bg-slate-800 hover:text-cyan-300 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <Wallet size={18} /> Pay from OS Wallet
                    </button>
                </div>
            </div>
        </div>
    );
}
