import {
    calculateConvenienceFee,
    calculateVenueCommission,
    calculateTournamentCommission
} from '../src/services/feeCalculator';

describe('Fee Calculator Revenue Module (Integer Math)', () => {

    describe('calculateConvenienceFee (+5%)', () => {
        it('calculates a basic ₹1000 (100000 paise) booking accurately', () => {
            const res = calculateConvenienceFee(100000);
            expect(res.grossAmount).toBe(105000); // 1000 + 50
            expect(res.platformFee).toBe(5000);   // 50
            expect(res.netAmount).toBe(100000);   // 1000
        });

        it('handles odd numbers triggering half-cent rounding boundaries (Math.round)', () => {
            const res = calculateConvenienceFee(357); // e.g., ₹3.57 
            // 357 * 0.05 = 17.85 -> rounded to 18
            expect(res.platformFee).toBe(18);
            expect(res.grossAmount).toBe(375); // 357 + 18
        });

        it('gracefully handles zero', () => {
            const res = calculateConvenienceFee(0);
            expect(res.platformFee).toBe(0);
            expect(res.grossAmount).toBe(0);
        });

        it('throws if floating-point inputs bypass validation', () => {
            expect(() => calculateConvenienceFee(100.5)).toThrow();
        });
    });

    describe('calculateVenueCommission (-8%)', () => {
        it('calculates a standard ₹5000 (500000 paise) payout correctly', () => {
            const res = calculateVenueCommission(500000);
            expect(res.grossAmount).toBe(500000);
            expect(res.platformFee).toBe(40000); // 8% of 500000
            expect(res.netAmount).toBe(460000);
        });

        it('handles complex prime number rounding', () => {
            const res = calculateVenueCommission(9999);
            // 9999 * 0.08 = 799.92 -> 800
            expect(res.platformFee).toBe(800);
            expect(res.netAmount).toBe(9999 - 800);
        });
    });

    describe('calculateTournamentCommission (-10%)', () => {
        it('calculates a ₹2000 (200000 paise) entry tournament pool correctly', () => {
            const res = calculateTournamentCommission(200000);
            expect(res.grossAmount).toBe(200000);
            expect(res.platformFee).toBe(20000); // 10%
            expect(res.netAmount).toBe(180000);
        });
    });

});
