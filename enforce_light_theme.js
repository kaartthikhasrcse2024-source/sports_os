const fs = require('fs');
const path = require('path');

const files = [
    'client/src/pages/PlayerAuth.tsx',
    'client/src/pages/PlayerRegistration.tsx',
    'client/src/components/PlayerHomeScreen.tsx',
    'client/src/pages/PlayerProfile.tsx',
    'client/src/pages/player/SlotBooking.tsx',
    'client/src/components/NotificationCenter.tsx',
    'client/src/pages/TournamentBracket.tsx',
    'client/src/pages/player/PlayerDiscovery.tsx',
    'client/src/components/VenueMapDiscovery.tsx',
    'client/src/components/BottomNav.tsx'
];

files.forEach(f => {
    const fullPath = path.join(__dirname, f);
    if (!fs.existsSync(fullPath)) return;

    let content = fs.readFileSync(fullPath, 'utf8');

    content = content.replace(/bg-slate-900/g, 'bg-white');
    content = content.replace(/bg-gray-900/g, 'bg-white');
    content = content.replace(/bg-black/g, 'bg-slate-50');

    // carefully replace text-white only where it represents a dark mode text. 
    // Wait, some buttons had `text-white` because they are `bg-emerald-600`.
    // Let's replace text-white with text-slate-900 globally, then fix the emerald buttons.
    content = content.replace(/text-white/g, 'text-slate-900');
    content = content.replace(/bg-emerald-600 text-slate-900/g, 'bg-emerald-600 text-white');
    content = content.replace(/bg-emerald-500 text-slate-900/g, 'bg-emerald-500 text-white');
    content = content.replace(/hover:bg-emerald-500 group-hover:text-slate-900/g, 'hover:bg-emerald-500 group-hover:text-white');

    content = content.replace(/text-slate-300/g, 'text-slate-600');
    content = content.replace(/text-slate-400/g, 'text-slate-500');
    content = content.replace(/text-emerald-100/g, 'text-emerald-900');

    content = content.replace(/from-dark-900 via-emerald-900\/40/g, 'from-white via-emerald-50/90');
    content = content.replace(/from-slate-900 via-emerald-900\/40/g, 'from-white via-emerald-50/90');
    content = content.replace(/from-black via-black\/80/g, 'from-white via-white/80');
    content = content.replace(/from-transparent to-black\/90/g, 'from-transparent to-white/90');

    content = content.replace(/mix-blend-luminosity/g, 'mix-blend-multiply opacity-15 grayscale');
    content = content.replace(/mix-blend-overlay/g, 'mix-blend-multiply opacity-10');

    content = content.replace(/bg-slate-800/g, 'bg-slate-100');
    content = content.replace(/border-slate-800/g, 'border-slate-200');

    content = content.replace(/text-slate-900\/50/g, 'text-slate-400');
    content = content.replace(/bg-slate-900\/10/g, 'bg-slate-50/80');
    content = content.replace(/bg-white\/10/g, 'bg-slate-50/80');
    content = content.replace(/border-white\/20/g, 'border-slate-200');
    content = content.replace(/border-white\/10/g, 'border-slate-200');

    fs.writeFileSync(fullPath, content, 'utf8');
});

console.log("Light theme enforced.");
