# Typography System - Healing Buds

## Font Families

### Geist (Primary - Body & Cards)
**Usage:** Body text, cards, buttons, descriptions, and UI elements
**Weights:** Regular (400), Medium (500), SemiBold (600), Bold (700)
**Characteristics:** 
- Modern, clean, and highly legible
- Designed by Vercel for optimal screen readability
- Perfect for medical/pharmaceutical content
- Excellent spacing and readability at all sizes

**Tailwind Class:** `font-geist`

### Archivo Narrow (Headers & Titles)
**Usage:** Page titles, section headers, pharmaceutical branding
**Weights:** Medium (500), SemiBold (600), Bold (700)
**Characteristics:**
- Professional and authoritative
- Condensed for space efficiency
- Excellent for large titles

**Tailwind Class:** `font-pharma`

### Geist Mono (Code & Technical)
**Usage:** Technical documentation, code snippets, data display
**Weight:** Regular (400)

**Tailwind Class:** `font-geist-mono`

## Font Usage Guidelines

### Cards
```tsx
// Country cards, news cards, info boxes
<div className="font-geist">
  <h3 className="font-geist font-bold">Card Title</h3>
  <p className="font-geist">Card description text...</p>
</div>
```

### Buttons
```tsx
// All buttons use Geist for modern, clean look
<button className="font-geist font-medium">
  Click Here
</button>
```

### Headers
```tsx
// Page titles and section headers use Archivo Narrow
<h1 className="font-pharma font-semibold">
  Main Page Title
</h1>

<h2 className="font-pharma font-semibold">
  Section Header
</h2>
```

### Body Text
```tsx
// Body paragraphs default to Geist
<p className="font-geist">
  This is body text that uses Geist font...
</p>
```

## Font Loading

Fonts are loaded via:
1. **Google Fonts** for Archivo Narrow, Cinzel, Inter (fallbacks)
2. **Custom CDN** for Geist font family (primary brand font)

Font files are referenced in:
- `/public/fonts/geist.css` - Font-face declarations
- `index.html` - Font stylesheet links
- `tailwind.config.ts` - Font family configuration
- `src/index.css` - Default font applications

## Performance Optimization

- `font-display: swap` ensures text remains visible during font load
- Preconnect to font CDNs for faster loading
- Fallback fonts specified for each family
- Font subset optimization for faster initial load

## Brand Consistency

**Primary Font:** Geist - Modern, clean, medical professional
**Secondary Font:** Archivo Narrow - Authoritative, pharmaceutical
**Accent Font:** Cinzel - Decorative, premium feel (limited use)

This creates a distinctive brand identity that communicates:
- Professionalism
- Modern medical expertise
- Trustworthiness
- Innovation
