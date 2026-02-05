# TKH Group - Branding Guidelines for Mission Control

**Generated from:** https://www.tkhgroup.com  
**Date:** 2026-02-05

---

## 🎨 Brand Colors

### Primary Colors

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| **Primary Yellow** | `#CCCC00` | `rgb(204, 204, 0)` | Primary brand color, CTAs, highlights, accents |
| **Blue Dark** | `#1A2638` | `rgb(26, 38, 56)` | Main backgrounds, headers, dark sections |
| **Blue** | `#1E4466` | `rgb(30, 68, 102)` | Text color, primary UI elements |
| **Green** | `#00CCB3` | `rgb(0, 204, 179)` | Success states, positive indicators |

### Secondary Colors

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| **Blue Medium** | `#183147` | `rgb(24, 49, 71)` | Card backgrounds, dark mode accents |
| **Blue Light** | `#326CDB` | `rgb(50, 108, 219)` | Links, interactive elements |
| **Blue Sky** | `#21BCFF` | `rgb(33, 188, 255)` | Highlights, hover states |

### Neutral Colors

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| **White** | `#FFFFFF` | `rgb(255, 255, 255)` | Backgrounds, text on dark |
| **Broken White** | `#FDFBFB` | `rgb(253, 251, 251)` | Subtle backgrounds |
| **Black** | `#0D0C20` | `rgb(13, 12, 32)` | Deep text, high contrast |
| **Grey** | `#9FA2A1` | `rgb(159, 162, 161)` | Secondary text |
| **Grey Light** | `#DDDDDD` | `rgb(221, 221, 221)` | Borders, dividers, disabled states |
| **Line** | `#F5F0F0` | `rgb(245, 240, 240)` | Borders in light mode |
| **Line Dark** | `#183147` | `rgb(24, 49, 71)` | Borders in dark mode |

---

## 📝 Typography

### Font Family
**Nimbus Sans L** - Primary typeface across all applications

- **Regular (400):** Body text, descriptions
- **Bold (700):** Headings, emphasis, buttons
- **Italic (400):** Quotes, emphasis

**Fallback Stack:**
```css
font-family: "Nimbus Sans L", system-ui, sans-serif;
```

### Font Sizes

| Element | Mobile | Desktop | Line Height |
|---------|--------|---------|-------------|
| **Heading 1** | 3rem (48px) | 4.5rem (72px) | 1.0 - 1.33 |
| **Heading 2** | 2.5rem (40px) | 3rem (48px) | 1.16 - 1.2 |
| **Heading 3** | 2rem (32px) | 2rem (32px) | 1.0 |
| **Heading 4** | 1.375rem (22px) | 1.375rem (22px) | 1.5 |
| **Body** | 1.125rem (18px) | 1.125rem (18px) | 1.75 |
| **Small** | 1rem (16px) | 1rem (16px) | 1.5 |
| **Caption** | 0.875rem (14px) | 0.875rem (14px) | 1.6 |

---

## 🎯 Design Principles

### Visual Style
- **Modern & Clean:** Grid-based layouts with clear hierarchy
- **Professional:** Corporate aesthetic with technical precision
- **Accessible:** High contrast, readable typography
- **Structured:** Strong use of borders and grids for organization

### Layout
- **Grid System:** 2 columns (mobile), 6 columns (tablet+)
- **Max Width:** 75rem (1200px) centered content
- **Padding:** 2rem standard spacing
- **Border Radius:** 0px (sharp corners throughout)

### UI Elements
- **Buttons:** No rounded corners, bold text, primary yellow background
- **Cards:** White backgrounds with thin borders (#F5F0F0)
- **Status Indicators:** Color-coded badges (green=online, blue=busy, grey=offline, red=error)
- **Hover States:** Blue Sky (#21BCFF) accent color
- **Focus States:** Primary Yellow (#CCCC00) outline/underline

---

## 🌓 Dark Mode Support

TKH uses dark mode extensively. For Mission Control:

### Dark Theme Colors
- **Background:** Blue Dark (#1A2638)
- **Surface:** Blue Medium (#183147)
- **Text:** White (#FFFFFF)
- **Borders:** Line Dark (#183147)
- **Accent:** Primary Yellow (unchanged)

---

## 🏗️ Component Patterns

### Status Badges
```
✓ Online   → Green (#00CCB3)
● Busy     → Blue Light (#326CDB)
○ Offline  → Grey (#9FA2A1)
✗ Error    → Red (#FF5454)
```

### CTAs & Links
- **Primary Button:** Yellow background (#CCCC00), dark text
- **Secondary Button:** Transparent with yellow border
- **Text Links:** Blue (#1E4466) with yellow underline on hover

### Cards
- White background
- 1px solid border (#F5F0F0)
- 2rem padding
- No shadow (flat design)

---

## 📐 Spacing System

Uses consistent spacing scale:
- **XS:** 0.5rem (8px)
- **SM:** 1rem (16px)
- **MD:** 1.5rem (24px)
- **LG:** 2rem (32px)
- **XL:** 2.5rem (40px)
- **2XL:** 4rem (64px)

---

## 🖼️ Imagery

From the TKH website:
- **Photography:** Industrial, technical, clean
- **Illustrations:** Geometric, simplified, technical diagrams
- **Image Treatment:** Full-bleed or contained in grids
- **Aspect Ratios:** 16:9 for media, 1:1 for icons/avatars

---

## ♿ Accessibility

TKH follows strong accessibility practices:
- **Contrast Ratios:** All text meets WCAG AA standards
- **Focus Indicators:** Clear yellow outlines on interactive elements
- **Font Sizes:** Minimum 16px for body text
- **Semantic HTML:** Proper heading hierarchy, ARIA labels

---

## 💡 Mission Control Specific Recommendations

### Agent Status Colors
Use TKH's existing color system:
- **Online:** Green (#00CCB3)
- **Busy:** Blue Light (#326CDB)
- **Offline:** Grey (#9FA2A1)
- **Error:** Red (define: #FF5454 as warning color)

### Dashboard Layout
- **Header:** Blue Dark (#1A2638) background
- **Sidebar:** Blue Medium (#183147) if needed
- **Main Content:** White (#FFFFFF) background
- **Cards:** White with Line borders (#F5F0F0)

### Interactive Elements
- **Hover:** Blue Sky (#21BCFF) for buttons/links
- **Active:** Primary Yellow (#CCCC00) for selected states
- **Disabled:** Grey Light (#DDDDDD)

---

## 📦 CSS Variables (for implementation)

```css
:root {
  /* Colors */
  --c-primary: #CCCC00;
  --c-blue-dark: #1A2638;
  --c-blue: #1E4466;
  --c-green: #00CCB3;
  --c-blue-light: #326CDB;
  --c-blue-sky: #21BCFF;
  --c-white: #FFFFFF;
  --c-grey: #9FA2A1;
  --c-line: #F5F0F0;
  
  /* Typography */
  --font-primary: "Nimbus Sans L", system-ui, sans-serif;
  --fw-regular: 400;
  --fw-bold: 700;
  
  /* Spacing */
  --spacing-xs: 0.5rem;
  --spacing-sm: 1rem;
  --spacing-md: 1.5rem;
  --spacing-lg: 2rem;
  --spacing-xl: 2.5rem;
  
  /* Layout */
  --border-radius: 0;
  --wrapper-max-width: 75rem;
}
```

---

**Last Updated:** 2026-02-05  
**Source:** TKH Group Website (tkhgroup.com)  
**Maintainer:** Dr. Shellbourne (OpenClaw Agent)
