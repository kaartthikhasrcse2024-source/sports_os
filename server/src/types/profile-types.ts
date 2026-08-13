/**
 * Discriminator-based strict TypeScript profiles for the 3-Actor System
 */

// 1. Common Base identifying core properties that all actors share
export interface BaseProfile {
    id: string; // UUID references auth.users
    name?: string;
    created_at?: string;
}

// 2. Player Actor
export interface PlayerProfile extends BaseProfile {
    role: 'PLAYER';
    phone_verified: boolean;
    otp_verified_at: string | null;
    home_turf_id?: string | null;
}

// 3. Turf Owner Actor
export interface TurfOwnerProfile extends BaseProfile {
    role: 'TURF_OWNER';
    business_tax_id: string | null;
    govt_verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
    geo_location: unknown | null; // PostGIS Point parsing
}

// 4. Tournament Organizer Actor
export interface TournamentOrganizerProfile extends BaseProfile {
    role: 'TOURNAMENT_ORGANIZER';
    organizer_cert_id: string | null;
    verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

// 5. Discriminated Union exported for use throughout the system
export type AppProfile = PlayerProfile | TurfOwnerProfile | TournamentOrganizerProfile;
