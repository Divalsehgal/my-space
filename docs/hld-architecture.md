# High-Level Design (HLD)

This document describes the high-level architecture of the portfolio + blog platform
(a Turborepo monorepo with a Next.js 16 / React 19 app at `apps/web`).

## System diagram

![High-Level Design diagram](diagrams/hld.svg)

> Rendered image: [diagrams/hld.svg](diagrams/hld.svg) · [diagrams/hld.png](diagrams/hld.png) · source: [diagrams/hld.mmd](diagrams/hld.mmd)

```mermaid
flowchart TB
    subgraph Client["Browser / PWA Client"]
        UI["Next.js UI (React 19)<br/>Home · Blog · BlogPost"]
        SW["Service Worker<br/>(Workbox precache + NetworkFirst /api)"]
        Hook["useBlogViews hook<br/>IntersectionObserver + Visibility"]
        Owner["Owner Mode<br/>localStorage + admin cookie"]
        GA["GoogleTracking<br/>GA4 / GTM"]
    end

    subgraph Vercel["Vercel — Next.js App (apps/web)"]
        direction TB
        subgraph Pages["Server Components / Pages"]
            PBlogs["/blogs (listing)<br/>getViewCounts (cached 60s)"]
            PPost["/blogs/[slug]<br/>BlogPost + Tracker"]
            PHome["/ (Home)"]
        end
        subgraph API["Route Handlers (/api)"]
            RView["blogs/[slug]/view<br/>GET count · POST record"]
            RAnalytics["blogs/[slug]/analytics<br/>(admin only)"]
            RPopular["blogs/popular"]
            RContact["contact (POST)"]
            RCtx["chat-context (GET)"]
            RReval["revalidate (POST webhook)"]
        end
        subgraph Svc["Service Layer (lib/services)"]
            SAnalytics["analytics.ts<br/>recordView · getViews · getAnalytics"]
            SContentful["contentful.ts<br/>GraphQL client"]
            SNotion["notion.ts"]
            SRedis["lib/redis.ts<br/>isRedisConfigured"]
        end
    end

    subgraph External["External Services"]
        Redis[("Upstash Redis<br/>views:total / daily / monthly<br/>HLL visitors · referrers · geo")]
        CMS[("Contentful CMS<br/>Blog content")]
        Notion[("Notion DB<br/>Contact submissions")]
        Worker["Cloudflare Worker<br/>AI Chatbot (RAG + Vectorize)"]
        Google[("Google Analytics / GTM")]
    end

    subgraph Pkgs["Monorepo packages/ (Turborepo)"]
        Tokens["design-tokens"]
        Fonts["fonts"]
        ESLint["eslint-config"]
        Jest["jest-config"]
        NextCfg["next-config"]
    end

    UI --> Pages
    Hook -->|GET/POST| RView
    Owner -.cookie.-> RView
    GA --> Google
    UI <-->|chat widget| Worker

    PBlogs --> SAnalytics
    PPost --> SContentful
    PHome --> SContentful

    RView --> SAnalytics
    RAnalytics --> SAnalytics
    RPopular --> SAnalytics
    RContact --> SNotion
    RCtx --> SContentful
    RReval -->|revalidateTag| Pages
    RReval -.seed.-> Worker

    SAnalytics --> SRedis --> Redis
    SContentful --> CMS
    SNotion --> Notion
    Worker -->|reads context| RCtx

    CMS -->|publish webhook| RReval
    Pages -.builds with.-> Pkgs
```

## Components

| Layer | Responsibility |
| --- | --- |
| **Client / PWA** | React 19 UI, service worker caching, view tracking, owner-mode opt-out, GA/GTM. |
| **Pages (RSC)** | Server-render blog listing/post/home; fetch content + cached view counts. |
| **Route Handlers** | `/api/*` endpoints (see endpoint audit below). |
| **Service layer** | Encapsulates Contentful (GraphQL), Notion, and Upstash Redis analytics. |
| **External** | Contentful CMS, Upstash Redis, Notion, Cloudflare Worker (AI chatbot), Google. |
| **packages/** | Shared design tokens, fonts, ESLint/Jest/Next configs built via Turborepo. |

## Blog view-count data flow

1. `BlogViewTracker` mounts on a post and calls `useBlogViews(slug)`.
2. **GET** `/api/blogs/[slug]/view` returns the current `views:total:<slug>` count.
3. After the reader is actively visible for 5s, the hook **POST**s the same route.
4. `recordView()` sets a 24h dedup key (`view:dedup:<slug>:<hash>`) with `SET NX EX`.
   On first set it atomically increments `views:total`, `views:daily`, `views:monthly`,
   adds the visitor to a HyperLogLog, and records referrer + country.
5. Owner mode (localStorage flag + `admin_view_secret` cookie) skips recording.
6. The listing page reads all counts in one pipeline via `getViewCounts`, cached 60s.

> **If counts do not increase:** the most common cause is missing
> `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (see `lib/redis.ts`,
> which now logs a warning and returns `recorded: false`), or owner mode being
> active in the current browser (`localStorage.removeItem('owner_mode')`).
