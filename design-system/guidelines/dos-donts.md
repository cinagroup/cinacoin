# Do's and Don'ts — Cinacoin Design System

## Overview

This document summarizes the key principles and common mistakes when implementing the Cinacoin design system. Use this as a quick reference during development and design reviews.

---

## Color

### ✅ Do

- ✅ Use `body` (#4d4d4d) for body text, never pure black
- ✅ Reserve `ink` (#171717) for headlines and primary elements
- ✅ Alternate section backgrounds (canvas → canvas-soft → canvas-soft-2)
- ✅ Use `link` (#0070f3) consistently for all interactive text
- ✅ Test contrast ratios (WCAG AA: 4.5:1 body, 3:1 large text)
- ✅ Use opacity for lighter versions (e.g., `rgba(0, 112, 243, 0.1)`)

### ❌ Don't

- ❌ Never use pure black (#000000) anywhere
- ❌ Don't use accent colors (violet, cyan, pink) for UI chrome
- ❌ Don't mix semantic colors (error is always red, success is always blue)
- ❌ Don't create new colors outside the token system
- ❌ Don't use colored backgrounds for large areas (except full-bleed bands)
- ❌ Don't use `ink` for long-form body text

---

## Typography

### ✅ Do

- ✅ Use the exact type scale (64, 48, 32, 24, 18, 16, 14, 12px)
- ✅ Apply negative letter-spacing to display type (≥24px)
- ✅ Use weight 400 for body text
- ✅ Use weight 500 for labels, buttons, navigation
- ✅ Use weight 600 for headlines only (this is the ceiling)
- ✅ Alternate type sizes by at least 2 levels for clear hierarchy

### ❌ Don't

- ❌ Never use font-weight 700 or higher
- ❌ Don't use mono font for non-code content
- ❌ Don't mix font families within the same context
- ❌ Don't use italic for emphasis (use weight or size instead)
- ❌ Don't center-align long paragraphs
- ❌ Don't use all-caps for headlines
- ❌ Don't invent new font sizes outside the scale

---

## Spacing & Layout

### ✅ Do

- ✅ Use the 4px grid — all spacing is a multiple of 4
- ✅ Use the 12-column grid for all layouts
- ✅ Alternate full-bleed and contained sections on landing pages
- ✅ Maintain 192px section gaps on landing pages
- ✅ Center content with `max-width: 1200px` and `margin: 0 auto`
- ✅ Use consistent gutters (24px desktop, 16px mobile)
- ✅ Let content breathe — generous whitespace is a feature

### ❌ Don't

- ❌ Don't mix grid systems (stick to 12/8/4 columns)
- ❌ Don't use fixed widths for content areas
- ❌ Don't reduce section gaps below 48px on app pages
- ❌ Don't center-align entire layouts (left-align within centered containers)
- ❌ Don't use margins for vertical rhythm between sections (use padding)
- ❌ Don't use odd spacing values (e.g., 5px, 13px) — always multiples of 4

---

## Borders & Shadows

### ✅ Do

- ✅ Include inset hairline borders on all elevated cards
- ✅ Follow the 6-level elevation system (0–5)
- ✅ Use `hairline` (#ebebeb) for default borders
- ✅ Use `hairline-strong` (#a1a1a1) for emphasis or focus
- ✅ Keep shadow opacity low (0.04–0.12)
- ✅ Elevate cards one level on hover (200ms transition)

### ❌ Don't

- ❌ Don't skip the inset border on cards
- ❌ Don't use colored shadows
- ❌ Don't use flat shadows without the inset border
- ❌ Don't mix border radii inconsistently (e.g., 6px and 8px buttons)
- ❌ Don't use drop shadows heavier than Level 5
- ❌ Don't forget the inset border on modals and popovers

---

## Components

### ✅ Do

- ✅ Use one primary button per view
- ✅ Group related actions: primary + secondary
- ✅ Provide visible focus states for all interactive elements
- ✅ Use consistent padding (24px cards, 16px buttons)
- ✅ Test hover states on all interactive elements
- ✅ Use the correct component for the context (check component guidelines)

### ❌ Don't

- ❌ Don't use two primary buttons in the same action group
- ❌ Don't remove focus rings (accessibility is non-negotiable)
- ❌ Don't create custom components without checking standard ones first
- ❌ Don't use different border radii for the same component type
- ❌ Don't skip disabled states — they need visual feedback
- ❌ Don't make buttons look like links or vice versa

---

## Motion & Interaction

### ✅ Do

- ✅ Use 150ms for color/opacity transitions
- ✅ Use 200ms for transform/shadow transitions
- ✅ Use 300ms for layout changes (width/height)
- ✅ Prefer `transform` and `opacity` for animations (GPU-accelerated)
- ✅ Keep animations subtle and professional

### ❌ Don't

- ❌ Don't use bouncy or spring animations
- ❌ Don't animate longer than 400ms for UI transitions
- ❌ Don't animate on page load unless it's meaningful
- ❌ Don't use animations that block interaction

---

## Responsive Design

### ✅ Do

- ✅ Design mobile-first, then enhance for larger screens
- ✅ Step down display sizes on mobile (64→48, 48→32, 32→24)
- ✅ Reduce section gaps on mobile (192px → 48–64px)
- ✅ Test all breakpoints (mobile, tablet, desktop)
- ✅ Ensure touch targets are at least 44px on mobile

### ❌ Don't

- ❌ Don't design desktop-first and try to squeeze down
- ❌ Don't hide critical content on mobile
- ❌ Don't use hover-dependent interactions on mobile
- ❌ Don't forget to test with real content (not just lorem ipsum)

---

## Accessibility

### ✅ Do

- ✅ Ensure all text meets WCAG AA contrast ratios
- ✅ Provide visible focus indicators
- ✅ Use semantic HTML (button, a, input, etc.)
- ✅ Include alt text for images
- ✅ Test with keyboard navigation
- ✅ Use ARIA labels where needed

### ❌ Don't

- ❌ Don't remove focus rings
- ❌ Don't rely on color alone to convey information
- ❌ Don't use small text (<12px) for critical information
- ❌ Don't auto-play videos or animations without user consent

---

## Quick Checklist

Before shipping any UI:

- [ ] All text uses `body` color, not pure black
- [ ] Headlines use `ink` color with correct letter-spacing
- [ ] Font weights are 400/500/600 only (no 700+)
- [ ] All spacing is a multiple of 4px
- [ ] Cards have inset hairline borders
- [ ] Interactive elements have visible focus states
- [ ] One primary button per view
- [ ] Contrast ratios meet WCAG AA
- [ ] Tested on mobile, tablet, desktop
- [ ] Keyboard navigation works
