const fs = require('node:fs');
const path = require('node:path');
// Cache buster for Turborepo: 2

function readConfig(configPath) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, configPath), 'utf8'));
}

async function build() {
  const { default: StyleDictionary } = await import('style-dictionary');
  const configs = ['config.light.json', 'config.dark.json'];

  // Register a custom format to output SCSS variables that point to CSS variables
  StyleDictionary.registerFormat({
    name: 'scss/css-variables',
    format: ({ dictionary }) => {
      return dictionary.allTokens.map(token => {
        const isRuntimeThemeToken = token.path[0] === 'colors' || token.path[0] === 'font';
        const value = isRuntimeThemeToken ? `var(--${token.name})` : token.value;
        return `$${token.name}: ${value};`;
      }).join('\n');
    }
  });

  for (const configPath of configs) {
    const config = readConfig(configPath);
    const sd = new StyleDictionary(config);
    
    // For the light config, also generate the mapping SCSS file
    if (configPath === 'config.light.json') {
      const mappingConfig = {
        ...config,
        platforms: {
          ts: config.platforms.ts,
          css: config.platforms.css,
          scss: {
            transformGroup: 'scss',
            buildPath: 'build/scss/',
            prefix: 't',
            files: [{
              destination: 'variables.scss',
              format: 'scss/css-variables'
            }]
          }
        }
      };
      const mappingSd = new StyleDictionary(mappingConfig);
      await mappingSd.buildAllPlatforms();
    } else {
      await sd.buildAllPlatforms();
    }
  }
}

build().catch(console.error);
