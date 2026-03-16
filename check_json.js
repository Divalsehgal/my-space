const fs = require('fs');
const path = require('path');

const tokensDir = path.join(process.cwd(), 'packages/design-tokens/tokens');

fs.readdirSync(tokensDir).forEach(file => {
    if (file.endsWith('.json')) {
        const filePath = path.join(tokensDir, file);
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            JSON.parse(content);
            console.log(`OK: ${file}`);
        } catch (e) {
            console.error(`ERROR in ${file}:`, e.message);
        }
    }
});
