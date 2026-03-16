# Scroll Issue Analysis

## Observations
1. `html` has `scroll-snap-type: y mandatory` globally.
2. `html` has `scroll-padding-top: 64px` (to account for fixed Navbar).
3. `.page-scroll` (wrapper for Home sections) has `margin-top: 64px`.
4. `Hero` (first section) has `scroll-snap-align: start`.

## Hypothesis
The "cannot scroll to top" issue occurs because:
- The browser tries to snap the `Hero`'s top boundary to the `scroll-padding-top` offset (64px below viewport top).
- However, since `Hero` is the very first element inside a margin-top'd container, its absolute position in the document is ~64px.
- When the user tries to scroll to 0 (the very top), the "mandatory" snap pulls them back to the `Hero` at scroll position ~0 (since it wants to leave 64px padding, but the document starts at 0).
- This creates a loop or a "bounce" effect where the user can't stay at the absolute top of the viewport if the snap target isn't exactly at the top.

## Solution Plan
1. **Remove `scroll-snap-type: y mandatory` from the `html` element globally**. 
   - Mandatory snap on the root is often too aggressive for many users and environments.
   - Use `scroll-snap-type: y proximity` or apply it ONLY to a specific container if needed.
2. **Remove `margin-top` from `.page-scroll`**.
   - Instead, the first section should handle its own padding/margin if it needs to clear the navbar, OR the navbar should be part of the flow (unlikely given design).
   - Better yet: Keep the navbar fixed, but allow the first section to start at 0 and use `padding-top` to push content down.
3. **Refine snap points**.
   - If we want snapping, it's better to use it on a wrapper with `overflow-y: scroll` and `height: 100vh`, or keep it on `html` but make it `proximity`.

## Recommendation
Switch `mandatory` to `proximity` in `global.scss`.
Remove `margin-top` from `.page-scroll` and let the first section handle the offset via `padding-top: $t-spacing-16`.
Alternatively, keep `margin-top` but remove `scroll-padding-top` if the margin already accounts for it.
Wait, if `margin-top` is 64px, and `scroll-padding-top` is 64px, we are effectively saying "Snap to a point 64px below the navbar".

I will try:
1. `scroll-snap-type: y proximity` (less jarring).
2. Remove `margin-top` from `.page-scroll` in `global.scss`.
3. Ensure `Hero` has enough padding top to clear the navbar if it's not already doing so.
4. Check why `About` section was cropping content (the user mentioned this earlier).

## Notion Fix Check
The user reverted my fix to use `dataSources`. 
I suspect they might be using a specific version or wrapper that I'm not seeing, OR they are mistaken about the SDK.
However, I should respect their change and only revisit if it breaks again. 
But they said "issue is not in blogs everything is conected". This implies the connection *is* working with their change.
Wait, "connected" might mean "the data is coming through but it looks bad".
If they reverted my fix and it's "connected", then maybe `dataSources` *is* the right way for their specific environment (possibly a custom proxy or a very specific version of the SDK).
Actually, looking at `package.json`: `@notionhq/client": "^5.7.0"`. 
I'll focus on CSS for now.
