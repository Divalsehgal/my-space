Scroll control means aligning snap points, fixed headers, and document offsets so navigation never traps users away from the top of the page.

## Snap (strictness)
Attack: Mandatory trap — root-level mandatory snapping pulls the viewport back to a section when the user tries to rest at the document top.
Fix: Use proximity snapping or scope mandatory snapping to a dedicated scroll container.

```html
<style>
/* ❌ root snap is too aggressive */
html { scroll-snap-type: y mandatory; }
/* ✅ softer root behavior */
html { scroll-snap-type: y proximity; }
</style>
```

| **Mode** | **Behavior** | **Risk** |
|---|---|---|
| `mandatory` | Always snaps | Can trap edge positions |
| `proximity` | Snaps near targets | Less deterministic |
| Container snap | Scoped behavior | Requires fixed height |

**Root scroll** — treat it as shared browser behavior, not a custom widget.

**Mandatory snap** — reserve it for controlled containers.

**Proximity snap** — better for document pages with mixed content heights.

## Offset (navbar)
Attack: Double compensation — `scroll-padding-top` and wrapper `margin-top` both account for the fixed navbar.
Fix: Use one offset model and let the first section handle its visual padding.

```html
<style>
/* ❌ header offset is counted twice */
html { scroll-padding-top: 64px; }
.page-scroll { margin-top: 64px; }
/* ✅ document geometry stays simple */
.page-scroll { margin-top: 0; }
</style>
```

| **Offset** | **Owner** | **Notes** |
|---|---|---|
| `scroll-padding-top` | Browser snap/anchor math | Header-aware targeting |
| Wrapper margin | Document layout | Moves every snap target |
| Section padding | Visual spacing | Keeps target stable |

**One offset** — duplicate compensation creates invisible layout math.

**Fixed header** — account for it in scroll targeting or visual padding, not both.

**First section** — can pad content without moving the snap target.

## Anchors (targets)
Attack: Misaligned target — a section's snap boundary and anchor position do not match the visible heading position.
Fix: Keep snap alignment on structural sections and apply spacing inside them.

```html
<style>
/* ❌ target starts after external margin */
.section { margin-top: 64px; scroll-snap-align: start; }
/* ✅ target is stable, content is padded */
.section { padding-top: 64px; scroll-snap-align: start; }
</style>
```

| **Property** | **Effect** |
|---|---|
| `margin-top` | Moves the element boundary |
| `padding-top` | Moves content inside boundary |
| `scroll-snap-align` | Uses the element boundary |

**Snap boundary** — depends on element geometry.

**Content offset** — padding is safer than margin for first-section clearance.

**Anchor parity** — anchor jumps and snap points should land consistently.

## Debugging (verification)
Attack: Scroll placebo — changes feel fixed on one viewport but fail with different content height or device chrome.
Fix: verify top, anchor, and section-to-section scroll behavior across viewport sizes.

```js
// ❌ only checks current scroll value
window.scrollTo(0, 0);

// ✅ verify the page can remain at top
window.scrollTo({ top: 0, behavior: "instant" });
console.log(window.scrollY === 0);
```

| **Check** | **Prevents** |
|---|---|
| Scroll to top | Root snap trap |
| Anchor click | Header overlap |
| Mobile viewport | Dynamic chrome surprises |

**Top rest** — users must be able to stay at `scrollY === 0`.

**Anchor rest** — headings should not hide behind the navbar.

**Mobile check** — browser chrome changes viewport math.

## Critical Chain
Order matters because scroll bugs come from multiple offset systems combining into one invisible geometry problem.

    Root uses mandatory snapping
      -> wrapper adds top margin for fixed navbar
      -> root also declares scroll padding
      -> first snap target starts at an offset boundary
      -> browser pulls top scroll back to the target
      -> user cannot reliably rest at the document top
