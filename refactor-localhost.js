const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'client', 'src');

function findPairs(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(findPairs(file));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            const content = fs.readFileSync(file, 'utf8');
            if (content.includes('http://localhost:3001')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = findPairs(srcDir);
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // figure out relative path to config.ts
    let rel = path.relative(path.dirname(file), path.join(srcDir, 'config.ts')).replace(/\\/g, '/');
    if (rel === 'config.ts') rel = './config';
    else rel = rel.replace('.ts', '');
    if (!rel.startsWith('.')) rel = './' + rel;

    // insert import after last import
    if (!content.includes('import { API_URL }')) {
        const lines = content.split('\n');
        let lastImport = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().startsWith('import ')) lastImport = i;
        }
        if (lastImport !== -1) {
            lines.splice(lastImport + 1, 0, `import { API_URL } from '${rel}';`);
        } else {
            lines.unshift(`import { API_URL } from '${rel}';`);
        }
        content = lines.join('\n');
    }

    // replace 'http://localhost:3001/...' -> `${API_URL}/...`
    // Match 'http://localhost:3001'
    content = content.replace(/'http:\/\/localhost:3001([^']*)'/g, '`${API_URL}$1`');
    // Match "http://localhost:3001"
    content = content.replace(/"http:\/\/localhost:3001([^"]*)"/g, '`${API_URL}$1`');
    // Match `http://localhost:3001...` inside an existing template literal
    content = content.replace(/http:\/\/localhost:3001/g, '${API_URL}');

    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated: ${file}`);
});
