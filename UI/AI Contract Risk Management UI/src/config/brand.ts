/**
 * ─── BRAND CONFIGURATION ──────────────────────────────────────────────────────
 * This is the single source of truth for all branding across the app.
 * Change values here to update the name, fonts, colors and metadata globally.
 *
 * After changing colors, the app will pick them up immediately (CSS variables).
 * After changing the font, the Google Fonts link in index.html must also match.
 * After changing APP_NAME or TAGLINE, all UI text will update automatically.
 */

export const BRAND = {
    // ─── Identity ───────────────────────────────────────────────────────────────
    APP_NAME: 'Legal Scanner',
    TAGLINE: 'AI-Powered Contract Risk Management',

    // Browser tab title (can differ slightly from APP_NAME if desired)
    PAGE_TITLE: 'Legal Scanner — Contract Risk Management',

    // ─── Logo ────────────────────────────────────────────────────────────────────
    // Drop your logo file into the public/ folder, then set the path here.
    // e.g. LOGO_PATH: '/logo.png'  or  '/logo.svg'
    //
    // When set:  the logo IMAGE is shown instead of the icon + APP_NAME text.
    //            If your logo already contains the name, APP_NAME is still used
    //            as the <img alt> text for accessibility.
    // When null: falls back to the ShieldCheck icon + APP_NAME text (current default).
    LOGO_PATH: '/logo.png' as string | null, // ← was null
    LOGO_HEIGHT: 80,   // px — controls the displayed height of the logo image

    // ─── Colors (used as CSS variable overrides in main.tsx) ────────────────────
    // Change these hex values to re-theme the entire app.
    COLORS: {
        /** Primary brand color — buttons, links, active states */
        primary: '#2563eb',         // blue-600
        primaryHover: '#1d4ed8',    // blue-700
        primaryForeground: '#ffffff',

        /** Sidebar background */
        sidebar: '#1e293b',         // slate-800
        sidebarText: '#94a3b8',     // slate-400
        sidebarActive: '#2563eb',   // blue-600

        /** Risk level colors */
        high: '#ef4444',            // red-500
        medium: '#f97316',          // orange-500
        low: '#22c55e',             // green-500
    },

    // ─── Typography ─────────────────────────────────────────────────────────────
    // Font family name — must match the Google Fonts import in index.html
    FONT_FAMILY: 'Inter',

    // ─── Meta / SEO ─────────────────────────────────────────────────────────────
    META_DESCRIPTION: 'AI-powered contract risk analysis using a multi-model LLM council. Identify high-risk clauses, get suggested corrections, and protect your business.',

    // ─── PDF Report branding ─────────────────────────────────────────────────────
    // Text shown in the PDF risk report header and footer
    REPORT_BRAND_NAME: 'Legal Scanner',
    REPORT_FOOTER: 'Legal Scanner  |  Confidential',
} as const;

export type Brand = typeof BRAND;
