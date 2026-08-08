import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

export default function Dashboard() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
                return;
            }
            setUser(session.user);

            try {
                const response = await fetch('http://localhost:3001/api/profile', {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`
                    }
                });
                if (response.ok) {
                    const profileData = await response.json();
                    setProfile(profileData);
                }
            } catch (err) {
                console.error('Failed to fetch profile', err);
            }
            setLoading(false);
        };
        checkUser();
    }, [navigate]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-900 flex items-center justify-center">
                <div className="text-primary-500 text-xl font-bold animate-pulse">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-900">
            <header className="border-b border-dark-700 bg-dark-800 p-4">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-primary-500">Dashboard</h1>
                    <button
                        onClick={handleLogout}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        Sign out
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-8">
                <div className="bg-dark-800 rounded-lg p-6 border border-dark-700 shadow-xl">
                    <h2 className="text-xl font-semibold text-white mb-4">Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}!</h2>
                    <div className="space-y-3 text-gray-300">
                        <p><span className="text-gray-500">Email:</span> {user?.email}</p>
                        <p><span className="text-gray-500">Role:</span> <span className="bg-primary-500 text-dark-900 px-2 py-0.5 rounded text-sm font-bold uppercase">{profile?.role || 'PLAYER'}</span></p>
                        <p className="text-sm mt-4 text-gray-400">Unique ID: {user?.id}</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
