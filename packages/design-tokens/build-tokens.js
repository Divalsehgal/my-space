const StyleDictionary = require('style-dictionary').default;
// Cache buster for Turborepo: 1

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

async function build() {
  const configs = ['config.light.json', 'config.dark.json'];

  for (const configPath of configs) {
    const config = require(`./${configPath}`);
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
