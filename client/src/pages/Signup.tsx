import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
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
                }
            }
        });

        if (error) {
            setError(error.message);
        } else {
            // You could route to login or show success message for email confirm
            navigate('/login');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-dark-900 border-t-4 border-primary-500">
            <div className="bg-dark-800 p-8 rounded-lg shadow-2xl max-w-md w-full border border-dark-700">
                <h2 className="text-3xl font-bold text-white mb-6 text-center">
                    Create Account
                </h2>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                        <label className="block text-gray-400 text-sm mb-1">Full Name</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full bg-dark-900 border border-dark-700 rounded p-2 text-white focus:outline-none focus:border-primary-500 transition-colors"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 text-sm mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-dark-900 border border-dark-700 rounded p-2 text-white focus:outline-none focus:border-primary-500 transition-colors"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 text-sm mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-dark-900 border border-dark-700 rounded p-2 text-white focus:outline-none focus:border-primary-500 transition-colors"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary-500 hover:bg-primary-400 text-dark-900 font-bold py-2 px-4 rounded transition-colors mt-2"
                    >
                        {loading ? 'Creating...' : 'Sign Up'}
                    </button>
                </form>

                <p className="mt-4 text-center text-sm text-gray-500">
                    Already have an account? <Link to="/login" className="text-primary-500 hover:underline">Log in</Link>
                </p>
            </div>
        </div>
    );
}
