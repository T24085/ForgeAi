# Plan (Joe Snuffy_s Old Fashioned Grill - Business)

## Summary
A premium, high‑end website for Joe Snuffy’s Old Fashioned Grill that elevates the brand with a polished, modern design, clear hierarchy, and fast performance. The site targets local diners and tourists seeking comfort food, positioning the restaurant as a timeless, welcoming destination. Primary CTA: "Reserve a Table" and secondary: "View Menu".

Key design pillars: restrained color palette (deep burgundy + warm neutrals), strong typography hierarchy (Serif for headings, Sans‑Serif for body), generous negative space, subtle motion on hero and gallery, mobile‑first layout, and optimized assets for lightning‑fast load.

Pages: Home, Menu, About, Reservations, Gallery, Contact, Blog.

Components: Hero, Menu Grid, About Story, Testimonial, Reservation Form, Gallery Grid, CTA Banner, Footer.

The architecture is built with Next.js (static‑first), TailwindCSS, and minimal vanilla JS for interactivity. Accessibility is baked in with semantic markup, ARIA labels, and WCAG contrast compliance.



## Pages
- Home
- Menu
- About
- Reservations
- Gallery
- Contact
- Blog

## Sections
- Hero
- Menu Grid
- About Story
- Testimonial
- Reservation Form
- Gallery Grid
- CTA Banner
- Footer

## Style Notes

- **Color Palette**: Primary – deep burgundy (#8B0000); Secondary – warm taupe (#D2B48C); Neutrals – charcoal (#333333) and off‑white (#FAFAFA).
- **Typography**: Heading – Playfair Display, 48–72px, bold; Body – Inter, 18–20px, regular; Line‑height 1.6.
- **Spacing**: 8‑point modular scale, 1rem = 16px; generous padding on sections (5rem top/bottom). 
- **Motion**: Subtle fade‑in on scroll (IntersectionObserver), hover lift on menu items.
- **Imagery**: High‑resolution, color‑graded to match palette, lazy‑loaded.
- **Accessibility**: Contrast 4.5:1, focus styles, alt text, keyboard‑navigable forms.
- **Performance**: Image WebP, SVG icons, minimal JS bundle (<50KB), CSS purged.


## Assets Needed
- logo.svg
- favicon.ico
- hero‑image‑hero.jpg
- menu‑item‑images/*.jpg
- interior‑photos/*.jpg
- staff‑portrait.jpg
- reservation‑form‑icon.svg
- testimonial‑quote.svg
