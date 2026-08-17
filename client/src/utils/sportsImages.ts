export const SPORTS_IMAGES = {
    football: [
        'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1518605368461-1ee511667d46?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?q=80&w=1200&auto=format&fit=crop'
    ],
    cricket: [
        'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1624526267942-ed80b6bfea38?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1629226466981-d10ff5c65a44?q=80&w=1200&auto=format&fit=crop'
    ],
    basketball: [
        'https://images.unsplash.com/photo-1519861531473-920026076284?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1542652694-40abf5262829?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1200&auto=format&fit=crop'
    ],
    badminton: [
        'https://images.unsplash.com/photo-1613918431713-33bc03d1fbca?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1200&auto=format&fit=crop' // Using clean indoor racquets
    ],
    tennis: [
        'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?q=80&w=1200&auto=format&fit=crop'
    ],
    volleyball: [
        'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1592656094267-764a45160876?q=80&w=1200&auto=format&fit=crop'
    ],
    turf: [
        'https://images.unsplash.com/photo-1459865264687-595d652de67e?q=80&w=1200&auto=format&fit=crop', // Night lights
        'https://images.unsplash.com/photo-1518605368461-1ee511667d46?q=80&w=1200&auto=format&fit=crop', // Open turf
        'https://images.unsplash.com/photo-1444062140410-1cda5ec2372d?q=80&w=1200&auto=format&fit=crop'
    ],
    stadium: [
        'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?q=80&w=1200&auto=format&fit=crop'
    ],
    player_avatars: [
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=300&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=300&auto=format&fit=crop' // Using generic professional portrait silhouettes if no avatar exists
    ]
};

// Helper: Safely grab a random image or deterministic modulo image
export function getSportImage(sportCategory: keyof typeof SPORTS_IMAGES | string, index: number = 0): string {
    const key = sportCategory.toLowerCase() as keyof typeof SPORTS_IMAGES;
    const array = SPORTS_IMAGES[key] || SPORTS_IMAGES.turf; // Fallback
    return array[index % array.length];
}
