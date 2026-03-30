# Design System Specification: The Academic Curator

## 1. Overview & Creative North Star
Modern university life is a chaotic influx of data. This design system is not a mere utility; it is **The Digital Curator**. Our North Star is to transform fragmented academic information into a high-end, editorial experience that feels both authoritative and breathable.

We break the "standard app" mold by rejecting rigid, boxed-in grids in favor of **Soft Minimalism**. By utilizing intentional asymmetry, overlapping tonal layers, and a sophisticated typographic scale, we move away from a "template" feel toward a signature identity that feels calm, intelligent, and premium.

---

## 2. Colors & Surface Philosophy
The palette is grounded in intelligence and reliability, but its application must be nuanced to avoid a "flat" interface.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or containment. Structural boundaries must be defined exclusively through background color shifts or tonal nesting.
*   **Surface:** `#F8F9FA` (Base background)
*   **Surface-Container-Low:** `#EDEEEF` (Secondary sections)
*   **Surface-Container-Lowest:** `#FFFFFF` (Elevated cards)

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. To create depth without visual clutter:
1.  **Level 0 (Base):** Use `surface`.
2.  **Level 1 (Sectioning):** Use `surface-container-low` for large content groupings.
3.  **Level 2 (Interaction):** Place `surface-container-lowest` (#FFFFFF) cards within Level 1 sections to create a soft, "nested" lift.

### Glass & Gradient Rule
To provide "visual soul," primary actions and hero states should utilize a subtle linear gradient from `primary` (`#005BC0`) to `primary_container` (`#1A73E8`). Floating headers or navigation bars should employ **Glassmorphism**:
*   **Backdrop Blur:** 12px – 20px.
*   **Opacity:** 85% of the surface color.

---

## 3. Typography: Editorial Authority
We use a high-contrast scale to ensure information is not just readable, but curated.

*   **The Display Duo:** Use **Manrope** for Display and Headlines. Its geometric yet warm curves provide a "Modern Academic" feel.
    *   *Display-LG (3.5rem):* Reserved for high-impact metrics (e.g., GPA or Attendance %).
*   **The Utility Duo:** Use **Inter** (or SF Pro Text) for titles and body.
    *   *Title-MD (1.125rem):* Medium weight for card titles to maintain an organized hierarchy.
    *   *Body-MD (0.875rem):* Regular weight for descriptions, ensuring high legibility during long study sessions.

---

## 4. Elevation & Depth
In this system, depth is felt, not seen. We mimic natural, ambient light.

*   **Tonal Layering:** 90% of hierarchy is achieved by stacking `surface-container` tiers (Lowest to Highest).
*   **Ambient Shadows:** When a floating element (like a FAB or Menu) is required, use:
    *   **Value:** `0 8px 32px`
    *   **Color:** `on-surface` at **6% opacity**. 
    *   *Note:* The shadow should never be pure black; it must be a tinted version of the background to feel integrated.
*   **The "Ghost Border" Fallback:** If accessibility requires a border, use `outline-variant` at **15% opacity**. Never use 100% opaque lines.

---

## 5. Components

### Buttons & CTAs
*   **Primary:** High-pill shape (Radius: `full`). Background: Primary Gradient. No shadow.
*   **Secondary:** Background: `secondary_container` (`#E2E0FC`). Text: `on_secondary_fixed` (`#1A1A2E`).
*   **Interaction:** One-tap patterns. Sizing must be a minimum of 44pt for touch targets.

### Chips (The Status Indicator)
*   **Geometry:** 24px rounded corners.
*   **Usage:** Use for "Course Health" or "Assignment Urgency." 
*   **Tone:** Use `error_container` for high urgency and `success` tokens for completed tasks.

### Cards & Lists
*   **The Forbiddance of Dividers:** Do not use lines to separate list items. Use **Vertical White Space** (Spacing Scale `4` or `1rem`) or a 2% color shift in the background of alternating rows.
*   **Large Metrics:** As seen in the reference "Grade Detail," use `display-sm` for primary data points, paired with `label-md` for subtext.

### Input Fields
*   **Style:** Minimalist. No bottom line. Instead, use a `surface_container_high` background with an 8px radius.
*   **States:** On focus, transition the "Ghost Border" to `primary` at 40% opacity.

---

## 6. Do’s and Don'ts

### Do
*   **DO** use white space as a structural element. If a screen feels "busy," increase the spacing between containers rather than adding lines.
*   **DO** use "Primary Blue" sparingly to draw the eye to the single most important action on the screen.
*   **DO** ensure "Data-Driven" metrics (82%, A+, 16d) are the largest typographic elements on the page.

### Don't
*   **DON'T** use standard Material Design drop shadows (Level 1-5). Stick to the Ambient Shadow spec.
*   **DON'T** use 100% black (`#000000`) for text. Use `on_surface` (`#191C1D`) to maintain a "calm" reading experience.
*   **DON'T** crowd the edges. Respect a minimum 16px (`1rem`) margin for all primary content containers.

---

## 7. Spacing & Rhythm
Rhythm is maintained through a strict 4px/8px baseline grid.
*   **Tight (4px - 8px):** Related labels and icons.
*   **Medium (16px):** Standard gutter between cards.
*   **Loose (24px - 32px):** Separating major content blocks or headers from content.