# Next.js Image Optimization

This document explains the rationale and benefits of using the `next/image` component instead of standard HTML `<img>` tags or CSS `background-image` for high-performance web applications.

---

## 🚀 Key Benefits

### 1. Automatic Resizing & Compression

Next.js automatically serves correctly sized images for each device, using modern web formats like **WebP** and **AVIF**. This significantly reduces the payload size (up to 70% smaller than raw JPEGs).

### 2. Visual Stability (No Layout Shift)

The `Image` component prevents **Cumulative Layout Shift (CLS)** by requiring width/height or using the `fill` property. This ensures that the page layout doesn't "jump" while images are loading.

### 3. Lazy Loading by Default

Images are only loaded when they enter the viewport. This improves the initial page load time and saves bandwidth for your users.

### 4. Improved LCP (Largest Contentful Paint)

By using the `priority` attribute on above-the-fold images (like Hero banners), you can tell the browser to prioritize those images, leading to a much faster perceived performance.

---

## 🛠 Refactor Case Study: ProjectCard

### Before (CSS Background Image)

Using `background-image` prevents the browser from optimizing the image and makes it harder to implement lazy loading.

```tsx
// ❌ Sub-optimal
<div
  style={{
    backgroundImage: `url(${project.image})`,
    backgroundSize: 'cover'
  }}
/>
```

### After (Next.js Image Component)

Using the `Image` component with the `fill` property allows the image to fill its parent container while maintaining the aspect ratio via `object-fit`.

```tsx
// ✅ Optimized
import Image from "next/image";

<Image
  src={project.image}
  alt={project.name}
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  style={{ objectFit: 'cover' }}
/>
```

---

## 💡 Best Practices

1. **Always provide an `alt` attribute**: Essential for accessibility and SEO.
2. **Use `sizes`**: Tells the browser how much space the image will take up at different breakpoints, allowing it to pick the best source image.
3. **Use `priority` for Hero images**: Add the `priority` prop to images that are visible immediately on page load.
4. **Placeholder images**: Use a small blurred placeholder or a local fallback to improve the loading experience.

---

> **Note:** For images from external domains (like Notion or GitHub), ensure the domains are added to `remotePatterns` in `next.config.ts`. (Already configured in this project).
