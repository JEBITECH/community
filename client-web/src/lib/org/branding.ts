/**
 * Shared branding fallbacks.
 *
 * The organisation's name and logo normally come from the backend org record
 * (public by-subdomain lookup before sign-in, the active membership's org
 * afterwards). When the record has no logo — or the org can't be resolved —
 * these defaults keep the UI branded instead of showing a bare placeholder.
 */

/** Bundled default logo. Files in public/ are served from the site root. */
export const DEFAULT_LOGO = "/sweetwatervillaLogo.png";
