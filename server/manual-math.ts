import {
    calculateConvenienceFee,
    calculateVenueCommission,
    calculateTournamentCommission
} from './src/services/feeCalculator';

console.log('💰 === MANUAL MATH VALIDATION === 💰\n');

// 1. ₹1000 Booking
const bookingBase = 100000;
const bookingRes = calculateConvenienceFee(bookingBase);
console.log('1️⃣ Convenience Fee (+5%) on ₹1000 Booking:');
console.log(`Gross Amount (Charged): ₹${(bookingRes.grossAmount / 100).toFixed(2)}`);
console.log(`Platform Fee: ₹${(bookingRes.platformFee / 100).toFixed(2)}`);
console.log(`Net Base: ₹${(bookingRes.netAmount / 100).toFixed(2)}\n`);
if (bookingRes.grossAmount === 105000 && bookingRes.platformFee === 5000) console.log('✅ Unit matches verified.\n');

// 2. ₹5000 Payout
const payoutBase = 500000;
const payoutRes = calculateVenueCommission(payoutBase);
console.log('2️⃣ Venue Commission (-8%) on ₹5000 Escrow Payout:');
console.log(`Gross Extracted: ₹${(payoutRes.grossAmount / 100).toFixed(2)}`);
console.log(`Platform Deduction: ₹${(payoutRes.platformFee / 100).toFixed(2)}`);
console.log(`Net Sent to Turf: ₹${(payoutRes.netAmount / 100).toFixed(2)}\n`);
if (payoutRes.netAmount === 460000 && payoutRes.platformFee === 40000) console.log('✅ Unit matches verified.\n');

// 3. ₹2000 Tournament Entry
const tournamentBase = 200000;
const tourneyRes = calculateTournamentCommission(tournamentBase);
console.log('3️⃣ Tournament Entry Fee (-10%) on ₹2000 Pool:');
console.log(`Gross Pool: ₹${(tourneyRes.grossAmount / 100).toFixed(2)}`);
console.log(`Platform Deduction (Organizing Tooling): ₹${(tourneyRes.platformFee / 100).toFixed(2)}`);
console.log(`Organizer Net Collection: ₹${(tourneyRes.netAmount / 100).toFixed(2)}\n`);
if (tourneyRes.netAmount === 180000 && tourneyRes.platformFee === 20000) console.log('✅ Unit matches verified.\n');
