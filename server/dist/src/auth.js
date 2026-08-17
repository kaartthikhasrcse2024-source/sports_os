"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireVerifiedRole = exports.requireRole = exports.normalizeRole = exports.requireAuth = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const db_1 = __importDefault(require("./db"));
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const requireAuth = async (req, res, next) => {
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
        db_1.default.query(`INSERT INTO profiles (id, name, role, verification_status) VALUES ($1, 'Dev User', $2, 'VERIFIED') ON CONFLICT (id) DO NOTHING`, [dummyId, mockRole]).catch(console.error);
        req.user = {
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
        req.user = {
            id: user.id,
            sub: user.id,
            email: user.email,
            user_metadata: user.user_metadata,
            app_metadata: user.app_metadata,
            role: user.role
        };
        next();
    }
    catch (error) {
        console.error('Token authentication error', error);
        res.status(401).json({ error: 'Invalid token' });
    }
};
exports.requireAuth = requireAuth;
const normalizeRole = (role) => {
    return role ? role.toUpperCase() : '';
};
exports.normalizeRole = normalizeRole;
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        (0, exports.requireAuth)(req, res, () => {
            const user = req.user;
            let rawRole = user.user_metadata?.role || user.app_metadata?.role;
            if (user.role && user.role !== 'authenticated' && user.role !== 'anon')
                rawRole = rawRole || user.role;
            const normalizedRole = (0, exports.normalizeRole)(rawRole || 'PLAYER');
            if (!allowedRoles.includes(normalizedRole)) {
                res.status(403).json({ error: `Forbidden: role ${normalizedRole} is not authorized` });
                return;
            }
            next();
        });
    };
};
exports.requireRole = requireRole;
const requireVerifiedRole = (allowedRoles) => {
    return (req, res, next) => {
        (0, exports.requireAuth)(req, res, async () => {
            const user = req.user;
            let rawRoleVerified = user.user_metadata?.role || user.app_metadata?.role;
            if (user.role && user.role !== 'authenticated' && user.role !== 'anon')
                rawRoleVerified = rawRoleVerified || user.role;
            const userRole = (0, exports.normalizeRole)(rawRoleVerified || 'PLAYER');
            if (!allowedRoles.includes(userRole)) {
                res.status(403).json({ error: `Forbidden: role ${userRole} is not authorized` });
                return;
            }
            try {
                // Fetch profile to verify database-enforced status
                const userId = user.sub || user.id;
                const result = await db_1.default.query('SELECT phone_verified, govt_verification_status, verification_status FROM profiles WHERE id = $1', [userId]);
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
            }
            catch (err) {
                console.error('Verification Status Error', err);
                res.status(500).json({ error: 'Failed to verify verification bounds.' });
            }
        });
    };
};
exports.requireVerifiedRole = requireVerifiedRole;
