import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('player');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: role
                }
            }
        });

        if (error) {
            setError(error.message);
        } else {
            navigate('/login');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 border-t-4 border-emerald-600 py-12 px-4">
            <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full border border-gray-300">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
                    Create Account
                </h2>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                        <label className="block text-gray-600 text-sm mb-1">Account Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-gray-900 focus:outline-none focus:border-emerald-600 transition-colors"
                        >
                            <option value="player">Player / Athlete</option>
                            <option value="venue_owner">Turf Owner / Manager</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-gray-600 text-sm mb-1">Full Name</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-gray-900 focus:outline-none focus:border-emerald-600 transition-colors"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-600 text-sm mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-gray-900 focus:outline-none focus:border-emerald-600 transition-colors"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-600 text-sm mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-gray-900 focus:outline-none focus:border-emerald-600 transition-colors"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-600 text-dark-900 font-bold py-2 px-4 rounded transition-colors mt-2"
                    >
                        {loading ? 'Creating...' : 'Sign Up'}
                    </button>
                </form>

                <p className="mt-4 text-center text-sm text-gray-500">
                    Already have an account? <Link to="/login" className="text-emerald-700 hover:underline">Log in</Link>
                </p>
            </div>
        </div>
    );
}
