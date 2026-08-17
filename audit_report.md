# Phase 5 Production Hardening Read-Only Audit

## A. CRITICAL SECURITY ISSUES
**Development Bypass in Authentication**
* **FILE**: `server/src/auth.ts`
* **LINE/ROUTE**: Lines 19-32 (inside `authenticateToken` middleware)
* **CURRENT BEHAVIOR**: If a JWT header starts exactly with `Bearer dev-mode-token:`, the backend skips Supabase validation completely, extracts the role directly from the string, inserts a dummy profile into the database (`000000...1111`), and authorizes the request!
* **WHY IT IS A PROBLEM**: Anyone knowing this token prefix can seamlessly forge Admin, Organizer, or Turf Owner rights in an absolute production environment, executing verified endpoints autonomously and stealing ownership natively.
* **RECOMMENDED FIX**: Remove completely or tightly bound behind `if (process.env.NODE_ENV !== 'production')`.
* **SEVERITY**: **CRITICAL**

## B. HIGH-RISK ISSUES
**SQL Error Leakage**
* **FILE**: Multiple (`server/src/tournaments.ts`, `leases.ts`, `owner.ts`, `players.ts`, `referees.ts`, `scout.ts`)
* **LINE/ROUTE**: Almost every catch block (e.g., `catch (e: any) { res.status(500).json({ error: e.message }); }`)
* **CURRENT BEHAVIOR**: Returns raw `e.message` directly exposing internal PostgreSQL structures recursively. 
* **WHY IT IS A PROBLEM**: Database constraints, table names, syntax bugs, and potentially truncated row boundaries represent severe informational leakage.
* **RECOMMENDED FIX**: Standardize a safe error handler wrapping Postgres logs out, natively returning `res.status(500).json({ error: "Internal Server Error" })`.
* **SEVERITY**: **HIGH**

## C. MEDIUM-RISK ISSUES
**Mock Razorpay Bypass in Payments**
* **FILE**: `server/src/payments.ts`
* **LINE/ROUTE**: Lines 23-25, 49, & 67 
* **CURRENT BEHAVIOR**: Evaluates `process.env.RAZORPAY_KEY_ID === 'dummy_key_id'`, and if so, processes fake payment confirmations bypassing native cryptographic verifications.
* **WHY IT IS A PROBLEM**: If production ENV variables crash or aren't set natively, the server elegantly falls back into a dummy free-purchase generator.
* **RECOMMENDED FIX**: Remove the mock fallbacks entirely. Production servers should crash securely without keys, never simulating payments securely.
* **SEVERITY**: **MEDIUM**

## D. LOW-RISK ISSUES
**Client-Side Fake Verification Branches**
* **FILE**: `client/src/components/payment/RazorpayCheckout.tsx`
* **LINE/ROUTE**: Line 75 (`simulationMode` or `dummy_key_id`)
* **CURRENT BEHAVIOR**: If Razorpay variables are missing, the UI constructs a dummy `razorpay_signature: 'dummy_signature'` simulation. 
* **WHY IT IS A PROBLEM**: Represents technical debt.
* **RECOMMENDED FIX**: Remove simulator branches from frontend payment flows guaranteeing exact match against production SDK loads.
* **SEVERITY**: **LOW**

## E. DATABASE INTEGRITY ISSUES
**Tournament Match Generation Overlap**
* **FILE**: `server/src/tournaments.ts`
* **LINE/ROUTE**: line 142 (POST `/:id/generate`)
* **CURRENT BEHAVIOR**: Calculates matches and wipes `DELETE FROM bracket_matches WHERE tournament_id = $1` WITHOUT wrapping it securely natively within a transaction block `BEGIN / COMMIT` alongside a `FOR UPDATE` table lock!
* **WHY IT IS A PROBLEM**: Parallel requests from the same organizer could randomly intertwine `DELETE` and `INSERT` instructions, mutating the topology out of bounds unpredictably, permanently corrupting the bracket.
* **RECOMMENDED FIX**: Add `BEGIN`, lock the specific Tournament recursively via `SELECT ... FOR UPDATE`, execute deletion, and commit seamlessly.
* **SEVERITY**: MEDIUM

## F. BOOKING ISSUES
*Booking States:* `pending`, `confirmed`, `cancelled`
Transitions map via `cleanup.ts` organically running closures accurately on 15m intervals utilizing native `FOR UPDATE SKIP LOCKED`.
* **Verdict**: Secure locking and accurate cron closures avoid ghost slots seamlessly. No violations found natively.

## G. PAYMENT ISSUES
* **FILE**: `server/src/payments.ts` (POST `/verify-signature`)
* **CURRENT BEHAVIOR**: Successfully verifies `booking_id !== 'dummy_booking'` bounds accurately explicitly confirming `bookRes.rows[0].user_id !== auth_user` throwing `Unauthorized payload manipulation detected` correctly overriding payload manipulation natively. 
* **Verdict**: Transactional bounds properly guarded against client-state manipulation cleanly.

## H. TOURNAMENT ISSUES
* **FILE**: `server/src/tournaments.ts` (POST `/:id/teams`)
* **CURRENT BEHAVIOR**: Team Registration accurately maps locking seamlessly via `SELECT ... FOR UPDATE` protecting `tournament_teams` max occupancy limits dynamically avoiding overlap. Authorization maps over `organizerId` recursively across all modification layers cleanly.
* **Verdict**: Structurally secure against concurrent occupancy overrides dynamically. 

## I. VERIFICATION ISSUES
* **FILE**: `server/src/auth.ts` (`requireVerifiedRole`)
* **CURRENT BEHAVIOR**: Drops exactly onto `SELECT role, verification_status` verifying bounds explicitly confirming `'VERIFIED'`.
* **Verdict**: Secure role verification mapping cleanly!

## J. NOTIFICATION ISSUES
* **FILE**: `server/src/notifications.ts` & `payments.ts`/`tournaments.ts`
* **CURRENT BEHAVIOR**: Dispatched natively `createNotification(client, ...)` intercepting db-layer contexts immediately prior to commits without accepting arbitrary client parameters.
* **Verdict**: Secure idempotency bounds natively applied safely avoiding duplications!

## K. FRONTEND ROUTING ISSUES
* **FILE**: `client/src/App.tsx` & `DashboardSwitch.tsx`
* **CURRENT BEHAVIOR**: Unauthenticated traffic redirects back to `/`. `DashboardSwitch.tsx` evaluates role bounds precisely returning empty states if unmatched organically preventing unauthorized rendering locally safely.
* **Verdict**: Secure route handling implicitly preventing generic access overrides.

## L. MOCK DATA
- `server/src/auth.ts`: Extant dev-mode injection interceptors overriding proper Supabase tokens.
- `server/scripts/test-payment-gateway.ts` and `server/run-marketplace.ts`: Dummy automation tools referencing `dummy_key_secret` safely contained within scripts/
- `client/src/pages/GroupBooking.tsx`: References to Dummy test hooks `dummy_c` explicitly used as safety overrides locally to bypass missing team maps during layout prototyping.

## M. DEAD/STALE CODE
- Multiple test script generators inside `server/fix-lease.ts`, `run-marketplace.ts`. Unused and unnecessary for runtime functionality. 

## N. RECOMMENDED FIX ORDER
1. Extract and delete the Development Token Injection mapping entirely out from `server/src/auth.ts`.
2. Consolidate backend Error Handlers returning `{ error: "Internal Server Error" }` mapping securely.
3. Remove fallback logic isolating `RAZORPAY_KEY` matching dummy logic out from `payments.ts`.
4. Implement atomic Database lock wrapper inside Tournament Generate logic.

---
### PHASE 5 AUDIT VERDICT: 
**PARTIAL (Due to Critical Auth Backdoor & Exposed DB Errors)**
