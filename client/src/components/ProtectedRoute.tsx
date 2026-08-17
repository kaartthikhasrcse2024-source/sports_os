import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute() {
    const { session, loading } = useAuth();

    if (loading) {
        return <div className="min-h-screen bg-gray-50 flex justify-center items-center text-emerald-700 font-bold">Verifying Secure Access...</div>;
    }

    return session ? <Outlet /> : <Navigate to="/" replace />;
}
