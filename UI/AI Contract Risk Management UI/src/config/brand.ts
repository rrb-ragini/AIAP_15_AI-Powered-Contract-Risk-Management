/**
 * ─── BRAND CONFIGURATION ──────────────────────────────────────────────────────
 * Single source of truth for app identity and branding.
 * Changes here update all UI text, logos, and PDF reports automatically.
 *
 * NOTE: Colors and fonts are controlled by Tailwind classes in individual
 * components and the Google Fonts import in index.html — not here.
 */

export const BRAND = {
    // ─── Identity ─────────────────────────────────────────────────────────────
    // Changing APP_NAME updates: Sidebar, Landing page (navbar + footer), PDF reports
    APP_NAME: 'Legal Scanner',
    TAGLINE: 'AI-Powered Contract Risk Management',

    // Browser tab title — also update <title> in index.html to match
    PAGE_TITLE: 'Legal Scanner — Contract Risk Management',

    // ─── Logo ──────────────────────────────────────────────────────────────────
    // Drop your logo file into public/ folder, then set the path below.
    // When set:  shows logo image instead of the ShieldCheck icon + APP_NAME text.
    // When null: falls back to ShieldCheck icon + APP_NAME text.
    LOGO_PATH: '/logo.png' as string | null,
    LOGO_HEIGHT: 56,  // px

    // ─── Meta / SEO ───────────────────────────────────────────────────────────
    META_DESCRIPTION: 'AI-powered contract risk analysis. Identify high-risk clauses, get suggested corrections, and protect your business.',

    // ─── PDF Report ───────────────────────────────────────────────────────────
    // Text shown in the downloaded PDF risk report header and footer
    REPORT_BRAND_NAME: 'Legal Scanner',
    REPORT_FOOTER: 'Legal Scanner  |  Confidential',
} as const;

export type Brand = typeof BRAND;
