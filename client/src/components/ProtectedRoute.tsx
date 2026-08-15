import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../supabase';

export default function ProtectedRoute() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const { data } = await supabase.auth.getSession();
            setIsAuthenticated(!!data.session);
        };

        checkAuth();

        // Listen for auth changes to kick users out dynamically
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                setIsAuthenticated(false);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    if (isAuthenticated === null) {
        return <div className="min-h-screen bg-gray-50 flex justify-center items-center text-emerald-700 font-bold">Verifying Secure Access...</div>;
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
}
