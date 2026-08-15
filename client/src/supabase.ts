import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

// DEV MODE Global Interceptor
const originalGetSession = supabase.auth.getSession.bind(supabase.auth);
supabase.auth.getSession = async () => {
    const mockRole = localStorage.getItem('dev_mock_role');
    const mockId = localStorage.getItem('dev_mock_id');

    if (mockRole) {
        const idSuffix = mockId ? `:${mockId}` : '';
        return {
            data: {
                session: {
                    access_token: `dev-mode-token:${mockRole}${idSuffix}`,
                    user: {
                        id: mockId || `dev-${mockRole.toLowerCase()}-1`,
                        email: 'test@devmode.internal',
                        user_metadata: { role: mockRole }
                    }
                }
            },
            error: null
        } as any;
    }
    return originalGetSession();
};
