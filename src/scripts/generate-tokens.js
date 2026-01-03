// src/scripts/generate-tokens.js
// Run: node src/scripts/generate-tokens.js
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const IN = path.join(ROOT, "src", "tokens.json");
const OUT_SCSS = path.join(ROOT, "src", "styles", "_tokens.generated.scss");
const OUT_CSS = path.join(ROOT, "src", "styles", "tokens.generated.css");
const OUT_TS = path.join(ROOT, "src", "lib", "tokens.generated.ts");
const OUT_FONTS_SCSS = path.join(ROOT, "src", "styles", "_fonts.generated.scss");

function toCssVarName(parts) {
    return `--${parts.join("-")}`.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
}

function ensureDir(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function flatten(obj, prefix = []) {
    const entries = [];
    for (const [k, v] of Object.entries(obj)) {
        if (v && typeof v === "object" && !Array.isArray(v)) {
            entries.push(...flatten(v, [...prefix, k]));
        } else {
            entries.push({ keyParts: [...prefix, k], value: String(v) });
        }
    }
    return entries;
}

function generateFontsSection(tokens) {
    if (!tokens.fonts || !tokens.fonts.families) return null;

    let scss = `// AUTO-GENERATED - fonts from src/tokens.json\n// DO NOT EDIT MANUALLY\n\n`;
    for (const [family, sources] of Object.entries(tokens.fonts.families)) {
        for (const src of sources) {
            // defaults
            const weight = src.weight ?? 400;
            const style = src.style ?? "normal";
            const format = src.format ?? (src.file && src.file.endsWith(".woff2") ? "woff2" : "truetype");

            scss += `@font-face {\n`;
            scss += `  font-family: "${family}";\n`;
            scss += `  src: url("${src.file}") format("${format}");\n`;
            scss += `  font-weight: ${weight};\n`;
            scss += `  font-style: ${style};\n`;
            scss += `  font-display: swap;\n`;
            scss += `}\n\n`;
        }
    }

    // Optionally, create CSS variables that point to family names so you can refer to them like var(--typography-fonts-headline)
    if (tokens.typography && tokens.typography.fonts) {
        scss += `// Font family CSS variable aliases (from tokens.typography.fonts)\n:root {\n`;
        for (const [alias, familyStr] of Object.entries(tokens.typography.fonts)) {
            // produce var(--typography-fonts-headline) etc
            const cssName = toCssVarName(["typography", "fonts", alias]);
            scss += `  ${cssName}: ${familyStr};\n`;
        }
        scss += `}\n`;
    }

    return scss;
}

function generate() {
    if (!fs.existsSync(IN)) {
        console.error("tokens.json not found at", IN);
        process.exit(1);
    }
    const raw = fs.readFileSync(IN, "utf8");
    const tokens = JSON.parse(raw);

    // SCSS dev variables (grouped)
    let scss = `// AUTO-GENERATED - DO NOT EDIT (src/tokens.json is source)\n\n`;
    for (const [cat, obj] of Object.entries(tokens)) {
        if (cat === "dark" || cat === "fonts") continue; // dark and fonts handled separately
        if (typeof obj !== "object") continue;
        scss += `// ${cat}\n`;
        for (const e of flatten(obj, [cat])) {
            const scssName = `$${e.keyParts.join("-")}`;
            scss += `${scssName}: ${e.value};\n`;
        }
        scss += `\n`;
    }

    // :root (light theme)
    scss += `:root {\n`;
    for (const [cat, obj] of Object.entries(tokens)) {
        if (cat === "dark" || cat === "fonts") continue;
        if (typeof obj !== "object") continue;
        for (const e of flatten(obj, [cat])) {
            const cssName = toCssVarName(e.keyParts);
            scss += `  ${cssName}: ${e.value};\n`;
        }
    }
    scss += `}\n\n`;

    // dark theme block
    if (tokens.dark && typeof tokens.dark === "object") {
        scss += `/* Dark theme variables (applies when html[data-theme=\"dark\"]) */\n`;
        scss += `html[data-theme="dark"] {\n`;
        for (const [cat, obj] of Object.entries(tokens.dark)) {
            if (typeof obj !== "object") continue;
            for (const e of flatten(obj, [cat])) {
                const cssName = toCssVarName(e.keyParts);
                scss += `  ${cssName}: ${e.value};\n`;
            }
        }
        scss += `}\n`;
    }

    // Plain CSS (tokens.generated.css)
    let css = `/* AUTO-GENERATED tokens.generated.css */\n:root {\n`;
    for (const [cat, obj] of Object.entries(tokens)) {
        if (cat === "dark" || cat === "fonts") continue;
        if (typeof obj !== "object") continue;
        for (const e of flatten(obj, [cat])) {
            const cssName = toCssVarName(e.keyParts);
            css += `  ${cssName}: ${e.value};\n`;
        }
    }
    css += `}\n\n`;
    if (tokens.dark && typeof tokens.dark === "object") {
        css += `html[data-theme="dark"] {\n`;
        for (const [cat, obj] of Object.entries(tokens.dark)) {
            if (typeof obj !== "object") continue;
            for (const e of flatten(obj, [cat])) {
                const cssName = toCssVarName(e.keyParts);
                css += `  ${cssName}: ${e.value};\n`;
            }
        }
        css += `}\n`;
    }

    // TypeScript tokens
    const tsContent = `// AUTO-GENERATED - tokens.generated.ts\n// source: src/tokens.json\nexport const tokens = ${JSON.stringify(tokens, null, 2)} as const;\n\nexport const cssVar = (nameParts: string[]) => \`var(--\${nameParts.join('-')})\`;\nexport const cssVarStr = (category, key) => \`var(--\${category}-\${key})\`;\n`;

    ensureDir(OUT_SCSS);
    ensureDir(OUT_CSS);
    ensureDir(OUT_TS);

    fs.writeFileSync(OUT_SCSS, scss, "utf8");
    fs.writeFileSync(OUT_CSS, css, "utf8");
    fs.writeFileSync(OUT_TS, tsContent, "utf8");

    // Generate fonts SCSS if fonts section present
    const fontsScss = generateFontsSection(tokens);
    if (fontsScss) {
        ensureDir(OUT_FONTS_SCSS);
        fs.writeFileSync(OUT_FONTS_SCSS, fontsScss, "utf8");
    } else {
        // remove previously generated fonts if no fonts present
        if (fs.existsSync(OUT_FONTS_SCSS)) {
            fs.unlinkSync(OUT_FONTS_SCSS);
        }
    }

    console.info("Generation complete.");
}

generate();
