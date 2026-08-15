const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'client', 'src');

const replacements = [
    { from: /bg-\[\#111111\]/g, to: 'bg-gray-50' },
    { from: /bg-\[\#111\]/g, to: 'bg-gray-50' },
    { from: /bg-\[\#1a1a1a\]/g, to: 'bg-white' },
    { from: /bg-dark-900/g, to: 'bg-gray-50' },
    { from: /bg-dark-800/g, to: 'bg-white' },
    { from: /bg-\[\#222\]/g, to: 'bg-gray-100' },
    { from: /border-\[\#333333\]/g, to: 'border-gray-200' },
    { from: /border-\[\#333\]/g, to: 'border-gray-200' },
    { from: /border-dark-700/g, to: 'border-gray-300' },
    { from: /border-dark-600/g, to: 'border-gray-300' },
    { from: /border-gray-700/g, to: 'border-gray-200' },
    { from: /text-\[\#d4af37\]/g, to: 'text-emerald-700' },
    { from: /bg-\[\#d4af37\]/g, to: 'bg-emerald-600' },
    { from: /border-\[\#d4af37\]/g, to: 'border-emerald-600' },
    { from: /text-primary-\d00/g, to: 'text-emerald-700' },
    { from: /bg-primary-\d00/g, to: 'bg-emerald-600' },
    { from: /border-primary-\d00/g, to: 'border-emerald-600' },
    { from: /text-white/g, to: 'text-gray-900' },
    { from: /text-gray-100/g, to: 'text-gray-900' },
    { from: /text-gray-200/g, to: 'text-gray-800' },
    { from: /text-gray-300/g, to: 'text-gray-700' },
    { from: /text-gray-400/g, to: 'text-gray-600' },
    { from: /text-gray-500/g, to: 'text-gray-500' },
    { from: /bg-cyan-950\/20/g, to: 'bg-cyan-50' },
    { from: /border-cyan-900\/50/g, to: 'border-cyan-200' },
    { from: /text-cyan-400/g, to: 'text-cyan-700' },
    { from: /text-cyan-300/g, to: 'text-cyan-600' },
    { from: /bg-cyan-[89]00/g, to: 'bg-cyan-100' },
    { from: /shadow-black/g, to: 'shadow-gray-200' }
];

function walk(directory) {
    let results = [];
    const list = fs.readdirSync(directory);
    list.forEach(file => {
        file = path.join(directory, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(dir);

let totalChanges = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    replacements.forEach(r => {
        content = content.replace(r.from, r.to);
    });

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        totalChanges++;
        console.log(`Updated theme classes in: ${file}`);
    }
});

console.log(`Theme conversion complete. Modified ${totalChanges} files.`);
