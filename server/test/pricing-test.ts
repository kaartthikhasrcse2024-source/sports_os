import { calculateYieldPrice } from '../src/pricing';

function assertObj(name: string, { original, final, breakdown }: any, expFinal: number, expBreakdownLength: number) {
    if (final !== expFinal || breakdown.length !== expBreakdownLength) {
        console.error(`❌ TEST FAILED: [${name}] | Expected ${expFinal} / ${expBreakdownLength} breakdown, Got ${final}, [${breakdown}]`);
        process.exit(1);
    }
    console.log(`✅ [${name}] evaluated securely combining constraints => Final: ${final} | Breakdown: [${breakdown.join(', ')}]`);
}

async function runTests() {
    console.log('Validating Math Models for explicit mapping pipelines...');
    const base = 100;

    // Use local time strings to prevent timezone shifts pushing constraints actively
    // 1. Normal Weekday Off-Peak (Wednesday 2PM)
    const d1 = new Date('2026-08-12T14:00:00');
    assertObj('Normal Weekday Off-Peak', calculateYieldPrice(d1.toISOString(), base, 1.2, 1.15, true, null), 100, 0);

    // 2. Weekend Off-Peak (Saturday 2PM) 
    const d2 = new Date('2026-08-15T14:00:00');
    assertObj('Weekend Off-Peak', calculateYieldPrice(d2.toISOString(), base, 1.2, 1.15, true, null), 115, 1);

    // 3. Weekday Peak Hour (Wednesday 7PM / 19:00)
    const d3 = new Date('2026-08-12T19:00:00');
    assertObj('Weekday Peak Hour', calculateYieldPrice(d3.toISOString(), base, 1.2, 1.15, true, null), 120, 1);

    // 4. Weekend Peak Hour (Saturday 7PM)
    const d4 = new Date('2026-08-15T19:00:00');
    assertObj('Weekend Peak Hour', calculateYieldPrice(d4.toISOString(), base, 1.2, 1.15, true, null), 138, 2);

    // 5. Weather Discount (Weekday Off-peak, Rain, outdoor)
    const weatherRain = { temperature: 20, rain: 5 };
    assertObj('Weather Discount (Rain Outdoor)', calculateYieldPrice(d1.toISOString(), base, 1.2, 1.15, true, weatherRain), 80, 1);

    // 6. Weather Extreme Heat (Weekday Off-peak, Heat, outdoor)
    const weatherHeat = { temperature: 38, rain: 0 };
    assertObj('Weather Discount (Heat Outdoor)', calculateYieldPrice(d1.toISOString(), base, 1.2, 1.15, true, weatherHeat), 80, 1);

    // 7. Weather Discard (Weekday Off-peak, Rain, but INDOOR)
    assertObj('Weather Rejected (Indoor facility protection)', calculateYieldPrice(d1.toISOString(), base, 1.2, 1.15, false, weatherRain), 100, 0);

    console.log('\n✅ ALL YIELD PRICING UNIT TESTS PASSED SUCCESSFULLY! Mathematical integrations track limits natively.');
}

runTests();
