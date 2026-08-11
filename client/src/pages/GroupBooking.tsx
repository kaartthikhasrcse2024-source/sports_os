import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function GroupBooking() {
    const [slotId, setSlotId] = useState('');
    const [amount, setAmount] = useState(1500);
    const [emails, setEmails] = useState<string[]>(['']);
    const [bookingId, setBookingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Real-time listener placeholder for refresh
    const fetchContributions = async () => {
        // Typically fetch from an API route. For simplicity, we just list the feature flow here.
        // E.g., GET /api/v1/bookings/${bookingId}/contributions
    };

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (bookingId) {
            interval = setInterval(fetchContributions, 3000); // 3 second polling
        }
        return () => clearInterval(interval);
    }, [bookingId]);

    const addEmail = () => setEmails([...emails, '']);
    const updateEmail = (index: number, val: string) => {
        const newEmails = [...emails];
        newEmails[index] = val;
        setEmails(newEmails);
    };
    const removeEmail = (index: number) => {
        setEmails(emails.filter((_, i) => i !== index));
    };

    const handleGroupReserve = async () => {
        setLoading(true);
        setError('');
        try {
            const session = {
                access_token: 'fake-token',
                user: { id: 'test-user-id' }
            };

            // Need dummy IDs for teammates for the test script or lookup by email.
            // Assuming backend converts contributor_ids. For the sake of the demo, passing raw strings.
            // A full app would resolve emails to UUIDs via an API or invite links.

            const res = await fetch('http://localhost:3001/api/v1/bookings/group-reserve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({
                    slot_id: slotId,
                    user_id: session?.user.id,
                    amount,
                    contributor_ids: [session?.user.id, ...emails.map((_, i) => `fake-uuid-${i}`)],
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setBookingId(data.booking_id);
        } catch (err: any) {
            setError(err.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-dark-900 text-white p-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-primary-500 mb-6">Group Booking</h1>

                {!bookingId ? (
                    <div className="bg-dark-800 p-6 rounded shadow border border-dark-700">
                        {error && <div className="text-red-500 mb-4">{error}</div>}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-400 mb-1">Slot ID</label>
                                <input type="text" value={slotId} onChange={e => setSlotId(e.target.value)} className="w-full bg-dark-900 border border-dark-700 p-2 rounded text-white focus:outline-none focus:border-primary-500 transition-colors" />
                            </div>
                            <div>
                                <label className="block text-gray-400 mb-1">Total Amount (₹)</label>
                                <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full bg-dark-900 border border-dark-700 p-2 rounded text-white focus:outline-none focus:border-primary-500 transition-colors" />
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-2">Split with Teammates (Emails)</label>
                                {emails.map((email, i) => (
                                    <div key={i} className="flex gap-2 mb-2">
                                        <input type="email" value={email} onChange={e => updateEmail(i, e.target.value)} className="flex-1 bg-dark-900 border border-dark-700 p-2 rounded text-white focus:outline-none focus:border-primary-500 transition-colors" placeholder="teammate@example.com" />
                                        <button onClick={() => removeEmail(i)} className="bg-red-500/20 text-red-500 px-3 rounded hover:bg-red-500/30">X</button>
                                    </div>
                                ))}
                                <button onClick={addEmail} className="text-primary-500 text-sm mt-1">+ Add Teammate</button>
                            </div>

                            <button onClick={handleGroupReserve} disabled={loading} className="w-full bg-primary-500 text-dark-900 font-bold p-3 rounded mt-4">
                                {loading ? 'Reserving...' : `Split ₹${amount} with ${emails.length} Teammates`}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-dark-800 p-6 rounded shadow border border-dark-700">
                        <h2 className="text-xl font-bold mb-4">Payment Tracking</h2>
                        <div className="text-gray-400 text-sm mb-6">Booking ID: {bookingId}</div>

                        <div className="w-full bg-dark-900 rounded-full h-4 mb-2 overflow-hidden border border-dark-700">
                            <div className="bg-primary-500 h-4 rounded-full transition-all" style={{ width: '33%' }}></div>
                        </div>
                        <p className="text-sm text-gray-500 mb-6 font-semibold">1 of 3 Paid</p>

                        <div className="space-y-3">
                            {/* Dummy list for preview layout */}
                            <div className="flex justify-between items-center p-3 border border-dark-700 rounded bg-dark-900">
                                <div>Me <span className="text-xs ml-2 text-gray-500">₹500</span></div>
                                <button className="bg-primary-500 text-dark-900 px-4 py-1 font-semibold rounded text-sm hover:bg-primary-400 transition-colors">Pay Now</button>
                            </div>
                            <div className="flex justify-between items-center p-3 border border-dark-700 rounded bg-dark-900">
                                <div>Teammate 1 <span className="text-xs ml-2 text-gray-500">₹500</span></div>
                                <span className="text-green-500 font-bold text-sm">✓ Paid</span>
                            </div>
                            <div className="flex justify-between items-center p-3 border border-dark-700 rounded bg-dark-900">
                                <div>Teammate 2 <span className="text-xs ml-2 text-gray-500">₹500</span></div>
                                <span className="text-yellow-500 font-semibold text-sm animate-pulse">Pending...</span>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
