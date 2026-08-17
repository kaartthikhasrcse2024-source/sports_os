import { useEffect } from 'react';
import { supabase } from '../supabase';
import PlayerHomeScreen from '../components/PlayerHomeScreen';
import TurfOwnerDashboard from './owner/TurfOwnerDashboard';
import OrganizerDashboard from './OrganizerDashboard';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardSwitch() {
    const { role, loading, session, authError, registrationComplete, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !session) {
            navigate('/');
        }
    }, [loading, session, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-emerald-700 text-xl font-black uppercase tracking-widest animate-pulse">Initializing Identity...</div>
            </div>
        );
    }

    if (!session) return null;

    if (authError === 'NO_PROFILE' || authError === 'ORPHANED_USER') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
                <div className="bg-red-50 p-8 rounded-2xl max-w-md w-full text-center border border-red-200">
                    <h2 className="text-red-700 font-bold text-xl mb-4">Profile Sync Error</h2>
                    <p className="text-red-600/80 text-sm font-medium mb-6">
                        Your account was authenticated, but we couldn't find your platform profile.
                    </p>
                    <p className="text-xs text-red-500 font-mono break-all bg-red-100 p-2 rounded mb-6">
                        User ID: {session.user.id}
                    </p>
                    <button onClick={() => logout()} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                        Sign Out
                    </button>
                </div>
            </div>
        );
    }

    if (registrationComplete === false) {
        if (role === 'PLAYER') return <Navigate to="/player-registration" replace />;
        if (role === 'TURF_OWNER') return <Navigate to="/owner-registration" replace />;
        if (role === 'TOURNAMENT_ORGANIZER') return <Navigate to="/organizer-registration" replace />;
        // If not one of these 3 roles but registration is somehow incomplete, just render fallback error.
    }

    if (role === 'TURF_OWNER') return <TurfOwnerDashboard />;
    if (role === 'TOURNAMENT_ORGANIZER') return <OrganizerDashboard />;
    if (role === 'PLAYER') return <PlayerHomeScreen />;

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="bg-red-50 p-8 rounded-2xl max-w-md w-full text-center border border-red-300">
                <h2 className="text-red-700 font-bold text-xl mb-4">Unsupported Role</h2>
                <p className="text-red-600/80 text-sm font-medium mb-6">
                    Your role "{role}" is currently unsupported or invalid.
                </p>
                <button onClick={() => supabase.auth.signOut()} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                    Sign Out
                </button>
            </div>
        </div>
    );
}
