import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import PlayerDashboard from './PlayerDashboard';
import TurfOwnerDashboard from './TurfOwnerDashboard';
import OrganizerDashboard from './OrganizerDashboard';

export default function DashboardSwitch() {
    const [role, setRole] = useState<'PLAYER' | 'TURF_OWNER' | 'TOURNAMENT_ORGANIZER' | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRole = async () => {
            const mockRole = localStorage.getItem('dev_mock_role');
            if (mockRole) {
                setRole(mockRole as any);
                setLoading(false);
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // If completely unauthorized, kick back to landing
                navigate('/');
                return;
            }

            try {
                // Assuming we stored profile role in Supabase auth metadata or can fetch it securely
                const { data: profiles, error } = await supabase
                    .from('profiles')
                    .select('user_role')
                    .eq('id', session.user.id)
                    .single();

                if (error || !profiles) {
                    console.error('Role fetch blocked:', error);
                    // Fallback boundary
                    setRole('PLAYER');
                } else {
                    setRole(profiles.user_role as any);
                }
            } catch (err) {
                console.error('Crash fetching identity', err);
            }
            setLoading(false);
        };
        fetchRole();
    }, [navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-900 flex items-center justify-center">
                <div className="text-primary-500 text-xl font-black uppercase tracking-widest animate-pulse">Initializing Identity...</div>
            </div>
        );
    }

    if (role === 'TURF_OWNER') return <TurfOwnerDashboard />;
    if (role === 'TOURNAMENT_ORGANIZER') return <OrganizerDashboard />;

    // Default Fallback
    return <PlayerDashboard />;
}
