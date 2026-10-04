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
                    './src/lib/**/*.{js,jsx,ts,tsx}',
                    // Workspace UI package: its class names live in its own source.
                    '../../packages/ui/src/**/*.{js,jsx,ts,tsx}',
                ],
                defaultExtractor: (content) => content.match(/[\w-/:]+(?<!:)/g) || [],
                // Lenis toggles its classes on <html> at runtime.
                safelist: { standard: ['html', 'body'], greedy: [/^lenis/] },
            },
        ],
    ],
};
