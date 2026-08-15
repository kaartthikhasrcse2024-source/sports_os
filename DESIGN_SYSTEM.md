---
name: Pitch High Contrast
colors:
  surface: '#101417'
  surface-dim: '#101417'
  surface-bright: '#363a3d'
  surface-container-lowest: '#0b0f11'
  surface-container-low: '#191c1f'
  surface-container: '#1d2023'
  surface-container-high: '#272a2d'
  surface-container-highest: '#323538'
  on-surface: '#e0e2e6'
  on-surface-variant: '#c4c7c8'
  inverse-surface: '#e0e2e6'
  inverse-on-surface: '#2d3134'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c6c6c7'
  primary: '#ffffff'
  on-primary: '#2f3131'
  primary-container: '#e2e2e2'
  on-primary-container: '#636565'
  inverse-primary: '#5d5f5f'
  secondary: '#c6c6c6'
  on-secondary: '#303030'
  secondary-container: '#474747'
  on-secondary-container: '#b5b5b5'
  tertiary: '#ffffff'
  on-tertiary: '#313030'
  tertiary-container: '#e5e2e1'
  on-tertiary-container: '#656464'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c7'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#454747'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c6'
  on-secondary-fixed: '#1b1b1b'
  on-secondary-fixed-variant: '#474747'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474646'
  background: '#101417'
  on-background: '#e0e2e6'
  surface-variant: '#323538'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-bold:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-padding: 20px
  gutter: 12px
---

## Brand & Style

The design system is engineered for a premium, high-energy sports and venue booking experience. It utilizes a **High-Contrast Minimalism** style that emphasizes speed, clarity, and authority. By stripping away color in favor of a monochromatic palette, the UI directs absolute focus toward venue imagery and critical calls to action. 

The aesthetic is sleek and "architectural," drawing inspiration from modern stadium signage and high-end athletic apparel. It avoids soft gradients and decorative flourishes, opting instead for raw power, sharp edges, and intentional whitespace to evoke an elite, professional atmosphere.

## Colors

The palette is strictly monochromatic to ensure maximum visual impact.
- **Pitch Black (#000000):** Used for the primary background to create an "infinite" depth and allow white elements to pop.
- **Deep Charcoal (#111111):** Used for secondary containers and cards that need to sit slightly above the background without the intensity of pure white.
- **Crisp White (#FFFFFF):** Reserved for primary action buttons, high-priority cards (like featured venues), and primary headings.
- **Light Grey (#E5E7EB):** Used exclusively for structural borders and inactive states to provide definition without breaking the dark aesthetic.

Status indicators should remain monochromatic where possible (e.g., using heavy fill for "active" and thin outlines for "inactive"), but may use a single "Action Lime" or "Caution Red" only if functional clarity is compromised.

## Typography

The design system employs **Geist** for its technical precision and monolinear consistency, which reinforces the modern, developer-grade sports aesthetic.

- **Headlines:** Use heavy weights (700-800) with tight letter-spacing to create a "blocky," impactful look similar to sports scoreboards.
- **Labels:** Small labels and badges should be set in all-caps with increased letter-spacing for high legibility at small sizes.
- **Contrast:** Always use pure white (#FFFFFF) for text on black backgrounds, and pure black (#000000) for text on white button surfaces.

## Layout & Spacing

This design system uses a **4px baseline grid** to maintain mathematical rigor. 

- **Mobile Layout:** A 2-column or 4-column fluid grid with 20px side margins. Cards should typically span the full width or 50% of the viewport.
- **Vertical Rhythm:** Use generous spacing (40px+) between major sections to emphasize the minimalist, premium feel. 
- **Grouping:** Use tight 8px spacing for related elements (e.g., an icon and its label) and 16px for internal card padding.

## Elevation & Depth

In this system, depth is communicated through **Tonal Layering** rather than shadows. 

- **Level 0 (Base):** Pure Black (#000000).
- **Level 1 (Secondary):** Deep Charcoal (#111111). Used for list items or grouped content.
- **Level 2 (Prominent):** White (#FFFFFF). Used for the highest priority items that must "pop" off the screen.
- **Borders:** Use 1px solid lines in #E5E7EB for white cards and #262626 for charcoal cards to define edges. Shadows are discouraged to maintain a flat, high-fidelity look.

## Shapes

The design system adopts a **Sharp (0px)** or extremely subtle corner radius. 

- **Primary Elements:** Buttons, cards, and input fields must have 0px radius to emphasize a "brutalist" and aggressive sporting character.
- **Exceptions:** Very small UI elements like checkboxes or avatars may use a 2px radius only if necessary to distinguish them from surrounding text, but the preference is always for 90-degree angles.

## Components

- **Buttons:** 
  - *Primary:* Solid White background with Bold Black text. 0px radius.
  - *Secondary:* Black background with 1px White or Light-Grey border.
- **Input Fields:** Black background with a 1px Light-Grey bottom border only (minimalist style) or a full 1px border. Placeholder text should be in mid-grey.
- **Chips/Badges:** Small, rectangular boxes with Black backgrounds and White 1px borders. Typography is uppercase Label-bold.
- **Cards:** 
  - *Venue Cards:* High-quality photography with a White text overlay or a Deep Charcoal bottom bar. 
  - *Data Cards:* Pure White background with Black text for high-priority info like "Booking Confirmed."
- **Icons:** Use thin-stroke (1.5pt) outline icons. Avoid filled icons unless indicating an active bottom-nav state.
- **Status Indicators:** Use geometric symbols (e.g., a solid white square for "Available," a hollow square for "Booked").
