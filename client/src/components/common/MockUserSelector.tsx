import React from 'react';
import { Users } from 'lucide-react';

const MOCK_USERS = [
    { id: '00000000-0000-0000-0000-111111110001', role: 'TURF_OWNER', label: 'Owner 1: Vigneshwaran (Downtown Arena)' },
    { id: '00000000-0000-0000-0000-111111110002', role: 'TURF_OWNER', label: 'Owner 2: Karthik (Bayview Smash)' },
    { id: '00000000-0000-0000-0000-222222220001', role: 'TOURNAMENT_ORGANIZER', label: 'Org 1: Anand (CSL)' },
    { id: '00000000-0000-0000-0000-222222220002', role: 'TOURNAMENT_ORGANIZER', label: 'Org 2: Divya (ECR Smash)' },
    { id: '00000000-0000-0000-0000-333333330101', role: 'PLAYER', label: 'Player 1: Ashwin (Downtown Arena)' },
    { id: '00000000-0000-0000-0000-333333330104', role: 'PLAYER', label: 'Player 2: Kavyashree (Bayview Smash)' },
];

export default function MockUserSelector() {
    const currentId = localStorage.getItem('dev_mock_id');

    const handleSwitch = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (!val) {
            localStorage.removeItem('dev_mock_role');
            localStorage.removeItem('dev_mock_id');
        } else {
            const user = MOCK_USERS.find(u => u.id === val);
            if (user) {
                localStorage.setItem('dev_mock_role', user.role);
                localStorage.setItem('dev_mock_id', user.id);
            }
        }
        window.location.href = '/dashboard';
    };

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-emerald-900 text-white shadow-xl flex items-center justify-center p-2 border-b-2 border-emerald-500">
            <div className="flex items-center gap-3 w-full max-w-4xl px-4">
                <Users size={16} className="text-emerald-300" />
                <span className="text-xs font-black uppercase tracking-widest text-emerald-100 whitespace-nowrap">
                    Active Sandbox Entity:
                </span>
                <select
                    value={currentId || ''}
                    onChange={handleSwitch}
                    className="flex-1 bg-emerald-950 border border-emerald-700 text-white rounded p-1.5 text-xs font-bold focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                >
                    <option value="">-- Guest Sandbox (No Dev Actor) --</option>
                    {MOCK_USERS.map(u => (
                        <option key={u.id} value={u.id}>{u.label}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}
