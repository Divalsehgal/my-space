module.exports = {
    plugins: [
        [
            '@fullhuman/postcss-purgecss',
            {
                content: [
                    './src/app/**/*.{js,jsx,ts,tsx}',
                    './src/components/**/*.{js,jsx,ts,tsx}',
                    './src/containers/**/*.{js,jsx,ts,tsx}',
                    './src/features/**/*.{js,jsx,ts,tsx}',
                    './packages/**/*.{js,jsx,ts,tsx}',
                ],
                defaultExtractor: (content) => content.match(/[\w-/:]+(?<!:)/g) || [],
                safelist: ['html', 'body'],
            },
        ],
    ],
};
