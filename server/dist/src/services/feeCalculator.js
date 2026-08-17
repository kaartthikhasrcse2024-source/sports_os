"use strict";
/**
 * Central Revenue Rules Engine
 * ALL calculations internally process and return Integer Cents / Paise
 * Floating point math is strictly restricted to multiplier derivations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateConvenienceFee = calculateConvenienceFee;
exports.calculateVenueCommission = calculateVenueCommission;
exports.calculateTournamentCommission = calculateTournamentCommission;
/**
 * calculateConvenienceFee
 * Applied to all casual and split-payment slot bookings: +5% platform fee.
 *
 * @param bookingAmountBase Initial base price in integer cents (e.g. 100000 for ₹1000.00)
 */
function calculateConvenienceFee(bookingAmountBase) {
    if (!Number.isInteger(bookingAmountBase))
        throw new Error('Input must be absolute integer cents');
    // 5% additional fee (Math.round to carefully resolve half-cent splits)
    const platformFee = Math.round(bookingAmountBase * 0.05);
    const totalCharged = bookingAmountBase + platformFee;
    return {
        grossAmount: totalCharged, // The final amount hit on the credit card
        platformFee: platformFee, // Platform deduction limit
        netAmount: bookingAmountBase // What the transaction underlying value is
    };
}
/**
 * calculateVenueCommission
 * Deducted when generating payouts to turf owners: -8% platform fee.
 *
 * @param totalCollectedAmount The total amount that was collected/escrowed initially in cents
 */
function calculateVenueCommission(totalCollectedAmount) {
    if (!Number.isInteger(totalCollectedAmount))
        throw new Error('Input must be absolute integer cents');
    // 8% extraction fee
    const platformFee = Math.round(totalCollectedAmount * 0.08);
    const payoutToTurf = totalCollectedAmount - platformFee;
    return {
        grossAmount: totalCollectedAmount,
        platformFee: platformFee,
        netAmount: payoutToTurf // The actual payout wired to the Turf Owner Bank 
    };
}
/**
 * calculateTournamentCommission
 * 10% platform fee on tournament registration entry fees.
 * (This fee is extracted from the entry fee, similar to venue payouts but isolated)
 *
 * @param entryFeeAmount Base entry fee pool collected per team
 */
function calculateTournamentCommission(entryFeeAmount) {
    if (!Number.isInteger(entryFeeAmount))
        throw new Error('Input must be absolute integer cents');
    // 10% structural extraction
    const platformFee = Math.round(entryFeeAmount * 0.10);
    const organizerNet = entryFeeAmount - platformFee;
    return {
        grossAmount: entryFeeAmount,
        platformFee: platformFee,
        netAmount: organizerNet
    };
}
