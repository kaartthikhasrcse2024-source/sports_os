"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateYieldPrice = calculateYieldPrice;
exports.fetchFacilityWeather = fetchFacilityWeather;
function calculateYieldPrice(startTimeStr, basePrice, peakMultiplier = 1.2, weekendMultiplier = 1.15, isOutdoor = true, weather = null) {
    const startTime = new Date(startTimeStr);
    let breakdown = [];
    let multiplier = 1.0;
    // Check Weekend mapping (0 = Sunday, 6 = Saturday)
    const day = startTime.getDay();
    if (day === 0 || day === 6) {
        multiplier *= weekendMultiplier;
        breakdown.push(`weekend +${Math.round((weekendMultiplier - 1) * 100)}%`);
    }
    // Check Peak timeline blocks (18:00 to 21:00 / 6PM to 9PM)
    const hour = startTime.getHours();
    if (hour >= 18 && hour < 21) {
        multiplier *= peakMultiplier;
        breakdown.push(`peak +${Math.round((peakMultiplier - 1) * 100)}%`);
    }
    // Incorporate Weather constraints robustly discounting outdoors
    if (isOutdoor && weather) {
        if (weather.temperature > 35) {
            multiplier *= 0.8;
            breakdown.push(`heat discount -20%`);
        }
        else if (weather.rain > 0) {
            multiplier *= 0.8;
            breakdown.push(`rain discount -20%`);
        }
    }
    const finalPrice = Math.round(basePrice * multiplier);
    return { original: basePrice, final: finalPrice, breakdown };
}
async function fetchFacilityWeather(lat, lng) {
    try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=rain`);
        const data = await res.json();
        if (data && data.current_weather) {
            const currentTemp = data.current_weather.temperature;
            // Simplified rain parsing mapping the first hourly block natively
            const currentRain = data.hourly?.rain?.[0] || 0;
            return { temperature: currentTemp, rain: currentRain };
        }
        return null;
    }
    catch (e) {
        // Fail securely dropping constraints seamlessly upon rate limiting faults
        console.error('Weather fetch block failed, dropping payload silently', e);
        return null;
    }
}
