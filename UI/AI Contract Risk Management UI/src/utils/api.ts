/**
 * Central API configuration.
 *
 * For local development: leave VITE_API_BASE_URL unset — it defaults to localhost:8000.
 * For Railway (production): set VITE_API_BASE_URL in the frontend service's environment
 * variables, pointing to your deployed backend URL (e.g. https://your-backend.up.railway.app).
 */
export const API_BASE_URL: string =
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000';
