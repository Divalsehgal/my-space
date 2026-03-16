# Material UI Token-Driven Theme

This directory contains the logic for creating a Material UI theme derived entirely from our design tokens.

## Architecture

- **`createMuiThemeFromTokens.ts`**: The core adapter that imports design tokens and maps them to MUI's `ThemeOptions` structure.
- **`theme.ts`**: The entry point that creates the MUI theme instance using the adapter.

## Usage

The theme is automatically applied via the `ThemeProvider` in `src/app/providers.tsx`.

### Adding New Component Overrides

To customize a component, add it to the `components` object in `createMuiThemeFromTokens.ts`.
**ALWAYS** use tokens. Do not use magic numbers or raw hex values.

```typescript
components: {
  MuiCard: {
    styleOverrides: {
      root: {
        backgroundColor: Tokens.TColorsBackgroundPrimary,
        borderRadius: Tokens.TDimensions2,
      }
    }
  }
}
```

## Best Practices & Constraints

### 1. No Magic Numbers
❌ **Don't**:
```tsx
<Box sx={{ padding: '15px', color: '#333' }} />
```

✅ **Do**:
```tsx
// Using system props (mapped to theme/tokens)
<Box sx={{ p: 2, color: 'text.primary' }} />
```

### 2. No Custom Wrappers
❌ **Don't** create `MyButton.tsx` just to add styles.
✅ **Do** use `styleOverrides` in `createMuiThemeFromTokens.ts` or create a variant in the theme if strictly necessary.

### 3. Fonts
Fonts are managed via `next/font` and mapped to CSS variables. The theme references these variables via `TFontFamily*` tokens.

### 4. What NOT to Override
- **Grid / Stack Layouts**: Do not override layout component styles globally unless you are changing the fundamental grid system.
- **Internal States**: Be careful overriding `Mui-focusVisible` unless you have a specific accessibility token.
- **Z-Index**: Use MUI's default z-index scale unless configured in tokens (`layer.json`).
