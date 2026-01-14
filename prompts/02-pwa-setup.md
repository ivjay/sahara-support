# Prompt 02: PWA Setup

## Objective
Configure the app as a Progressive Web App (PWA) so users can install it on their devices.

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `public/manifest.json` | CREATE | PWA manifest with app info |
| `public/icons/` | CREATE | App icons for PWA |
| `app/layout.tsx` | MODIFY | Add manifest link and meta tags |
| `next.config.ts` | MODIFY | Add PWA headers |

---

## Step 1: Create PWA Manifest

Create `public/manifest.json`:

```json
{
  "name": "Sahara Support",
  "short_name": "Sahara",
  "description": "Your AI-powered support assistant for bookings and services",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#0891b2",
  "orientation": "portrait-primary",
  "categories": ["utilities", "productivity"],
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

---

## Step 2: Create Placeholder Icons

Create folder `public/icons/` and add placeholder icons:

For now, create simple placeholder icons or use a tool like [favicon.io](https://favicon.io/) to generate them.

Required files:
- `public/icons/icon-192.png` (192x192 pixels)
- `public/icons/icon-512.png` (512x512 pixels)

---

## Step 3: Update app/layout.tsx

Add the following to the `<head>` section:

```tsx
import type { Metadata, Viewport } from "next";

// Add viewport export
export const viewport: Viewport = {
  themeColor: "#0891b2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// Update metadata
export const metadata: Metadata = {
  title: "Sahara Support",
  description: "Your AI-powered support assistant for bookings and services",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sahara",
  },
  formatDetection: {
    telephone: false,
  },
};
```

---

## Step 4: Update next.config.ts

Add headers for PWA:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

---

## Verification

### Test PWA Manifest

1. Run the development server: `npm run dev`
2. Open Chrome DevTools (F12)
3. Go to **Application** tab
4. Click **Manifest** in the sidebar
5. Verify:
   - App name shows "Sahara Support"
   - Icons are detected
   - No manifest errors

### Expected DevTools Output

```
Manifest
├── Identity
│   ├── Name: Sahara Support
│   └── Short name: Sahara
├── Presentation
│   ├── Start URL: /
│   └── Display: standalone
└── Icons
    ├── 192x192
    └── 512x512
```

---

## Important Rules

> ⚠️ **DO NOT** change color variables in `globals.css`
> ⚠️ Use the existing primary color for theme_color (#0891b2 is approximate - use CSS variable)
> ⚠️ Keep the existing font configuration

---

## Next Step

→ Proceed to **Prompt 03: Chat Types and Mock Data**
