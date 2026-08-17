import express from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import pool from './db';
import { requireAuth, requireRole } from './auth';

const router = express.Router();

// Initialize generic multer memory storage and backend Supabase client
const upload = multer({ storage: multer.memoryStorage() });

let _supabaseAdmin: any = null;
function getSupabaseClient() {
    if (_supabaseAdmin) return _supabaseAdmin;
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        console.error('CRITICAL FAULT: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment bindings inside verification router!');
        throw new Error('Supabase key validation blocked engine boot: MISSING KEYS.');
    }
    _supabaseAdmin = createClient(url, key);
    return _supabaseAdmin;
}

// Basic In-Memory Rate Limiter Map: { phone: { count, timestamp } }
const rateLimits = new Map<string, { count: number, timestamp: number }>();

router.post('/player/verify-otp', requireAuth, async (req, res) => {
    const { phone, code } = req.body;
    const user = (req as any).user;

    if (!phone || !code) {
        res.status(400).json({ error: 'Phone and OTP code are mandatory.' });
        return;
    }

    // Rate limiter: Max 3 per 10 minutes
    const now = Date.now();
    const rate = rateLimits.get(phone);
    if (rate) {
        if (now - rate.timestamp < 10 * 60 * 1000) {
            if (rate.count >= 3) {
                res.status(429).json({ error: 'Rate limit exceeded. Please try again in 10 minutes.' });
                return;
            }
            rate.count += 1;
        } else {
            rateLimits.set(phone, { count: 1, timestamp: now });
        }
    } else {
        rateLimits.set(phone, { count: 1, timestamp: now });
    }

    try {
        // Physically assert the phone native verification via Supabase built-in auth bindings
        const { data, error } = await getSupabaseClient().auth.verifyOtp({ phone, token: code, type: 'sms' });

        if (error) {
            res.status(400).json({ error: error.message });
            return;
        }

        // On verified signal, sync the internal database state lock natively bypassing untrusted UI manipulation
        await pool.query(
            'UPDATE profiles SET phone_verified = true, otp_verified_at = NOW() WHERE id = $1',
            [user.sub || user.id]
        );

        res.json({ success: true, message: 'Athlete identity verified natively.' });
    } catch (err) {
        console.error('OTP Framework crash:', err);
        res.status(500).json({ error: 'Verification fault cascade.' });
    }
});

router.post('/turf-owner/submit', requireAuth, upload.single('document'), async (req, res) => {
    const user = (req as any).user;
    const { business_tax_id, organizer_cert_id, document_type, role } = req.body;

    if (!req.file) {
        res.status(400).json({ error: 'Verification document binary buffer missing.' });
        return;
    }

    const actorRole = (role || user.role || user.user_metadata?.role || 'TURF_OWNER').toUpperCase();
    const userId = user.sub || user.id;

    try {
        // Upload the physical PDF/Image buffer into Supabase robust static buckets
        const fileName = `${actorRole}_${userId}_${Date.now()}`;
        const { data: uploadData, error: uploadErr } = await getSupabaseClient().storage
            .from('verification-docs')
            .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: true
            });

        if (uploadErr) throw new Error(`Storage ingestion failure: ${uploadErr.message}`);

        const { data: pubData } = getSupabaseClient().storage
            .from('verification-docs')
            .getPublicUrl(fileName);

        const fileUrl = pubData.publicUrl;

        // Route structural identities into the native PG layer
        await pool.query(
            `INSERT INTO verification_documents (profile_id, actor_role, document_type, file_url, review_status)
             VALUES ($1, $2, $3, $4, 'PENDING')`,
            [userId, actorRole, document_type || 'BUSINESS_TAX_ID', fileUrl]
        );

        // Map optional cert properties natively based on strict Actor mapping
        if (actorRole === 'TURF_OWNER' && business_tax_id) {
            await pool.query('UPDATE profiles SET business_tax_id = $1 WHERE id = $2', [business_tax_id, userId]);
        } else if (actorRole === 'TOURNAMENT_ORGANIZER' && organizer_cert_id) {
            await pool.query('UPDATE profiles SET organizer_cert_id = $1 WHERE id = $2', [organizer_cert_id, userId]);
        }

        res.json({ success: true, message: 'Verification physical package extracted into review bay.' });
    } catch (err: any) {
        console.error('Document extraction crash:', err);
        res.status(500).json({ error: err.message || 'Fatal document buffer manipulation error.' });
    }
});

router.get('/admin/pending', requireAuth, requireRole(['ADMIN']), async (req, res) => {
    try {
        const docData = await pool.query(`
            SELECT v.id, v.profile_id, v.actor_role, v.document_type, v.file_url, v.uploaded_at,
                   p.name, p.email, p.business_tax_id, p.organizer_cert_id
            FROM verification_documents v
            JOIN profiles p ON v.profile_id = p.id
            WHERE v.review_status = 'PENDING'
            ORDER BY v.uploaded_at ASC
        `);
        res.json(docData.rows);
    } catch (err) {
        console.error('Admin Fetch Crash:', err);
        res.status(500).json({ error: 'Administrative lock failed fetching.' });
    }
});

router.post('/admin/review/:profileId', requireAuth, requireRole(['ADMIN']), async (req, res) => {
    const { profileId } = req.params;
    const { decision, notes, documentId } = req.body; // 'VERIFIED' or 'REJECTED'

    if (!['VERIFIED', 'REJECTED'].includes(decision)) {
        res.status(400).json({ error: "Decision must strictly act as VERIFIED or REJECTED bounds." });
        return;
    }

    try {
        // Fetch original document context natively to extract role safely
        let role = 'TURF_OWNER';
        if (documentId) {
            const docData = await pool.query('UPDATE verification_documents SET review_status = $1, reviewer_notes = $2 WHERE id = $3 RETURNING actor_role', [decision, notes, documentId]);
            if (docData.rows.length > 0) role = docData.rows[0].actor_role;
        } else {
            // Fallback block if reviewing profile implicitly
            const docData = await pool.query('UPDATE verification_documents SET review_status = $1, reviewer_notes = $2 WHERE profile_id = $3 AND review_status = $4 RETURNING actor_role', [decision, notes, profileId, 'PENDING']);
            if (docData.rows.length > 0) role = docData.rows[0].actor_role;
        }

        if (role === 'TURF_OWNER') {
            await pool.query('UPDATE profiles SET govt_verification_status = $1 WHERE id = $2', [decision, profileId]);
        } else if (role === 'TOURNAMENT_ORGANIZER') {
            await pool.query('UPDATE profiles SET verification_status = $1 WHERE id = $2', [decision, profileId]);
        }

        res.json({ success: true, message: `Administrator overridden structural identity gate to ${decision}.` });
    } catch (err) {
        console.error('Admin API Crash block:', err);
        res.status(500).json({ error: 'Administrative lock failed executing.' });
    }
});

export default router;
