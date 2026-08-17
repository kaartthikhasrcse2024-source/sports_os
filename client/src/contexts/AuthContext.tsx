import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import type { Session, User } from '@supabase/supabase-js';
import { API_URL } from '../config';

type AuthContextType = {
    session: Session | null;
    user: User | null;
    role: string | null;
    registrationStatus: string | null;
    registrationComplete: boolean | null;
    loading: boolean;
    authError: string | null;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [registrationStatus, setRegistrationStatus] = useState<string | null>(null);
    const [registrationComplete, setRegistrationComplete] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);

    const logout = async () => {
        setLoading(true);
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setRole(null);
        setRegistrationStatus(null);
        setRegistrationComplete(null);
        setAuthError(null);
        setLoading(false);
    };

    useEffect(() => {
        let mounted = true;

        const syncProfile = async (session: Session | null) => {
            if (!session) {
                // Clear state when session is not found
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('sb-') && key.endsWith('-auth-token') || key === 'user_role') {
                        localStorage.removeItem(key);
                    }
                });
                sessionStorage.clear();
                if (mounted) {
                    setSession(null);
                    setUser(null);
                    setRole(null);
                    setRegistrationStatus(null);
                    setRegistrationComplete(null);
                    setAuthError(null);
                    setLoading(false);
                }
                return;
            }

            try {
                const { data: profiles, error } = await supabase
                    .from('profiles')
                    .select('user_role')
                    .eq('id', session.user.id)
                    .single();

                if (mounted) {
                    if (error || !profiles) {
                        setAuthError('NO_PROFILE');
                        setRole(null);
                    } else {
                        const verifiedRole = (profiles.user_role as string).toUpperCase();
                        setRole(verifiedRole);
                        setAuthError(null);

                        // Fetch registration status
                        try {
                            const regRes = await fetch(`${API_URL}/api/v1/registration/status`, {
                                headers: {
                                    'Authorization': `Bearer ${session.access_token}`
                                }
                            });
                            if (regRes.ok) {
                                const regData = await regRes.json();
                                setRegistrationComplete(regData.registrationComplete);
                                setRegistrationStatus(regData.registrationStatus);
                            } else {
                                setRegistrationComplete(false);
                                setRegistrationStatus('ERROR');
                            }
                        } catch (err) {
                            console.error('Failed to fetch registration status:', err);
                            setRegistrationComplete(false);
                            setRegistrationStatus('ERROR');
                        }
                    }
                    setSession(session);
                    setUser(session.user);
                    setLoading(false);
                }
            } catch (err) {
                if (mounted) {
                    setAuthError('ORPHANED_USER');
                    setRole(null);
                    setRegistrationComplete(null);
                    setRegistrationStatus(null);
                    setSession(session);
                    setUser(session.user);
                    setLoading(false);
                }
            }
        };

        const initializeAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            await syncProfile(session);
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            await syncProfile(session);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ session, user, role, registrationStatus, registrationComplete, loading, authError, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
