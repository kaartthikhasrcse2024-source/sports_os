import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import pool from './db';

const supabase = createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_ANON_KEY as string);

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid authorization header' });
        return;
    }

    const token = authHeader.split(' ')[1];

    if (token.startsWith('dev-mode-token')) {
        if (process.env.NODE_ENV === 'production') {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }

        const parts = token.split(':');
        const rawRole = parts[1] || 'TOURNAMENT_ORGANIZER';
        const mockRole = rawRole.toUpperCase();
        const dummyId = parts[2] || '00000000-0000-0000-0000-111111111111';
        pool.query(`INSERT INTO profiles (id, name, role, verification_status) VALUES ($1, 'Dev User', $2, 'VERIFIED') ON CONFLICT (id) DO NOTHING`, [dummyId, mockRole]).catch(console.error);
        (req as any).user = {
            id: dummyId,
            sub: dummyId,
            role: mockRole
        };
        return next();
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            throw new Error("Invalid token via Supabase Auth API");
        }

        // Attach decoded user information to the request mapping standard JWT sub
        (req as any).user = {
            id: user.id,
            sub: user.id,
            email: user.email,
            user_metadata: user.user_metadata,
            app_metadata: user.app_metadata,
            role: user.role
        };
        next();
    } catch (error) {
        console.error('Token authentication error', error);
        res.status(401).json({ error: 'Invalid token' });
    }
};

export const normalizeRole = (role: string | undefined | null): string => {
    return role ? role.toUpperCase() : '';
};

type CanonicalRole = 'PLAYER' | 'TURF_OWNER' | 'TOURNAMENT_ORGANIZER' | 'REFEREE' | 'ADMIN' | 'VENUE_OWNER';

export const requireRole = (allowedRoles: CanonicalRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        requireAuth(req, res, () => {
            const user = (req as any).user;
            let rawRole = user.user_metadata?.role || user.app_metadata?.role;
            if (user.role && user.role !== 'authenticated' && user.role !== 'anon') rawRole = rawRole || user.role;

            const normalizedRole = normalizeRole(rawRole || 'PLAYER');

            if (!allowedRoles.includes(normalizedRole as CanonicalRole)) {
                res.status(403).json({ error: `Forbidden: role ${normalizedRole} is not authorized` });
                return;
            }
            next();
        });
    };
};

export const requireVerifiedRole = (allowedRoles: CanonicalRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        requireAuth(req, res, async () => {
            const user = (req as any).user;
            let rawRoleVerified = user.user_metadata?.role || user.app_metadata?.role;
            if (user.role && user.role !== 'authenticated' && user.role !== 'anon') rawRoleVerified = rawRoleVerified || user.role;

            const userRole = normalizeRole(rawRoleVerified || 'PLAYER');

            if (!allowedRoles.includes(userRole as CanonicalRole)) {
                res.status(403).json({ error: `Forbidden: role ${userRole} is not authorized` });
                return;
            }

            try {
                // Fetch profile to verify database-enforced status
                const userId = user.sub || user.id;
                const result = await pool.query('SELECT phone_verified, govt_verification_status, verification_status FROM profiles WHERE id = $1', [userId]);
                if (result.rows.length === 0) {
                    res.status(403).json({ error: 'Profile not found' });
                    return;
                }
                const profile = result.rows[0];

                if (userRole === 'PLAYER' && !profile.phone_verified) {
                    res.status(403).json({ error: 'VERIFICATION_REQUIRED', message: 'Player phone verification is required.' });
                    return;
                }

                if (userRole === 'TURF_OWNER' && profile.govt_verification_status !== 'VERIFIED') {
                    res.status(403).json({ error: 'VERIFICATION_REQUIRED', message: 'Turf Owner verification is pending or rejected.' });
                    return;
                }

                if (userRole === 'TOURNAMENT_ORGANIZER' && profile.verification_status !== 'VERIFIED') {
                    res.status(403).json({ error: 'VERIFICATION_REQUIRED', message: 'Tournament Organizer verification is pending or rejected.' });
                    return;
                }

                next();
            } catch (err) {
                console.error('Verification Status Error', err);
                res.status(500).json({ error: 'Failed to verify verification bounds.' });
            }
        });
    };
};
