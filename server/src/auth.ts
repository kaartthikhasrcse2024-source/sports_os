import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from './db';

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid authorization header' });
        return;
    }

    const token = authHeader.split(' ')[1];
    try {
        const jwtSecret = process.env.SUPABASE_JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("SUPABASE_JWT_SECRET is not configured");
        }
        const decoded = jwt.verify(token, jwtSecret);
        // Attach decoded user information to the request
        (req as any).user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

export const requireRole = (allowedRoles: ('player' | 'venue_owner' | 'referee' | 'admin')[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        requireAuth(req, res, () => {
            const user = (req as any).user;

            // Assume JWT payload contains the role or we verify it some other way.
            // Since existing login injects 'player' or 'venue_owner', we check here.
            // (If role is not in JWT, an extra DB call would be needed, but for typical Supabase auth 
            // you might check `user.role` or `user.app_metadata.role`).
            // Here, we check what is loaded from decoded user context.
            const userRole = user.role || user.user_metadata?.role || 'player'; // default to player if undefined

            if (!allowedRoles.includes(userRole as any)) {
                res.status(403).json({ error: `Forbidden: role ${userRole} is not authorized` });
                return;
            }
            next();
        });
    };
};

export const requireVerifiedRole = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        requireAuth(req, res, async () => {
            const user = (req as any).user;
            const userRole = (user.role || user.user_metadata?.role || user.app_metadata?.role || 'PLAYER').toUpperCase();

            if (!allowedRoles.map(r => r.toUpperCase()).includes(userRole)) {
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
