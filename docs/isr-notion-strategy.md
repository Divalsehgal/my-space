# ISR & Notion Integration Strategy

## Overview

This project uses **Incremental Static Regeneration (ISR)** to serve blog content from Notion while maintaining excellent performance and SEO.

## The Problem: `revalidate = 0` Breaks Static Generation

### ❌ What NOT to Do

```typescript
// apps/web/src/app/blogs/page.tsx
export const revalidate = 0; // ❌ WRONG

export default async function Blogs() {
  const posts = await getNotionPosts(); // Fetches from Notion
  // ...
}
```

**Error During Build:**

```
Error: Dynamic server usage: Route /blogs couldn't be rendered statically
because it used revalidate: 0 fetch...
```

**Why?** When you set `revalidate = 0`, Next.js treats the route as:

- **Dynamic** (must fetch fresh data on every request)
- **Cannot be statically generated** (static generation happens once at build time)

This creates a contradiction during the build process.

## The Solution: ISR with Proper Revalidation

### ✓ Blog Listing Page: 1 Hour Revalidation

```typescript
// apps/web/src/app/blogs/page.tsx

// Revalidate every 1 hour (ISR)
// ✓ Statically generates at build time
// ✓ Reuses cache for 1 hour
// ✓ On next request after 1 hour, regenerates in the background
export const revalidate = 3600;  // 3600 seconds = 1 hour

export default async function Blogs() {
  const posts = await getNotionPosts();  // Fetches from Notion
  return <BlogPageContent posts={posts} />;
}
```

### ✓ Individual Blog Post: 60 Second Revalidation

```typescript
// apps/web/src/app/blogs/[slug]/page.tsx

export async function generateStaticParams() {
  const posts = await getNotionPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export const dynamicParams = true; // Allow new posts without rebuild
export const revalidate = 60; // Revalidate every 60 seconds

export default async function BlogPost({ params }) {
  const { slug } = await params;
  const posts = await getNotionPosts();
  const post = posts.find((p) => p.slug === slug);
  // ...
}
```

### ✓ Sitemap: 1 Hour Revalidation

```typescript
// apps/web/src/app/sitemap.ts

export const revalidate = 3600; // Revalidate every 1 hour

export default async function sitemap() {
  return generateSitemap(); // Fetches blog posts from Notion
}
```

## How ISR Works

### Timeline

```
Build Time (yarn build)
│
├─ generateStaticParams() runs
│  └─ Fetches ALL published posts from Notion
│  └─ Pre-generates HTML pages for all posts
│
└─ Initial HTML is cached statically
```

### At Runtime

**Request 1 (0-60 minutes):**

```
Browser Request → Cached HTML (instant) → ✓ No Notion fetch
```

**Request 2 (after 60 seconds):**

```
Browser Request → Cached HTML served immediately ✓
                → Background: Next.js regenerates in the background
                → Notion data is fetched for the NEW HTML
                → Cached version is updated for the NEXT request
```

**Request 3 (after Request 2 completes):**

```
Browser Request → Fresh HTML (with latest Notion data) → ✓
```

## Why Different Revalidation Times?

| Route                             | Revalidate            | Reason                                                 |
| --------------------------------- | --------------------- | ------------------------------------------------------ |
| `/blogs/[slug]` (individual post) | 60 seconds            | Fast updates when content changes                      |
| `/blogs` (listing)                | 3600 seconds (1 hour) | Listing doesn't change as frequently                   |
| `/sitemap.xml`                    | 3600 seconds (1 hour) | Robots crawl infrequently; large revalidation overhead |

## Performance & Cost Breakdown

### With `revalidate = 0` (❌ BROKEN)

- Every page request fetches from Notion
- Slower response times
- More Notion API calls
- More load on Notion database

### With ISR (✓ RECOMMENDED)

- **First visit:** Full regeneration (with Notion fetch)
- **Subsequent visits (within revalidate window):** Cached HTML (instant)
- **After revalidate window:** Background regeneration
- **Result:** 99% of requests served from cache

## Debugging ISR Issues

### 1. Check Revalidation Settings

```bash
# Verify your current settings
grep -r "export const revalidate" apps/web/src/app
```

**Output should look like:**

```
apps/web/src/app/blogs/page.tsx: export const revalidate = 3600;
apps/web/src/app/blogs/[slug]/page.tsx: export const revalidate = 60;
apps/web/src/app/sitemap.ts: export const revalidate = 3600;
```

### 2. Test Build & Production

```bash
# Production build
yarn build

# Production server
yarn start

# Visit a blog page and check:
# - Response headers: X-Middleware-Prefetch: false
# - Content freshness in browser DevTools
# - Check Next.js terminal for regeneration logs
```

### 3. Monitor Notion API Calls

In development, you'll see:

```
Fetching Notion posts... { dbId: '25195533-c718-80ca-a3ad-f8796ed075fa', hasKey: true }
```

**In production:**

- During build: Multiple calls (one per post + listing)
- At runtime: Calls only happen during revalidation windows
- Background: Regeneration happens asynchronously

## Common Mistakes

### ❌ Mistake 1: Using `revalidate = 0`

```typescript
// WRONG
export const revalidate = 0;
export default async function Page() {
  const data = await fetchNotionData(); // Error during build!
}
```

### ✓ Solution: Use reasonable revalidation interval

```typescript
// RIGHT
export const revalidate = 3600; // 1 hour
export default async function Page() {
  const data = await fetchNotionData(); // Works!
}
```

---

### ❌ Mistake 2: Forgetting `dynamicParams`

```typescript
// For [slug] routes without this, new posts won't be discovered
// until your next full rebuild
```

### ✓ Solution: Enable `dynamicParams`

```typescript
export const dynamicParams = true; // New posts appear without rebuild

export async function generateStaticParams() {
  // Pre-generate common posts
  const posts = await getNotionPosts();
  return posts.slice(0, 10).map((post) => ({ slug: post.slug }));
}
```

---

### ❌ Mistake 3: Setting too short revalidation

```typescript
export const revalidate = 1; // ❌ Regenerates every second = constant load
```

### ✓ Solution: Balance freshness vs. load

```typescript
export const revalidate = 60; // ✓ Good balance for frequently changed content
export const revalidate = 3600; // ✓ Fine for static listings
```

## Production Deployment Checklist

- [ ] All routes with Notion fetches have `revalidate` set (no `= 0`)
- [ ] `dynamicParams = true` on dynamic routes like `/blogs/[slug]`
- [ ] Revalidation intervals are reasonable (60s to 3600s)
- [ ] Built and tested: `yarn build && yarn start`
- [ ] No "Dynamic server usage" errors in build output
- [ ] Verified pages load correctly in production build
- [ ] Monitor Notion API usage in first few days of deployment

## Vercel-Specific Notes

If deploying to Vercel:

- ISR automatically handles background regeneration
- No additional configuration needed beyond setting `revalidate`
- On-demand revalidation available via `revalidatePath()` if needed

## Related Documentation

- [Notion Integration](./notion-setup.md)
- [CSS Architecture](./css-architecture.md)
- [Next.js ISR](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration)
