/// <reference types="vite/client" />

/**
 * Augment Vite's built-in ImportMetaEnv so that all access to
 * `import.meta.env.*` is fully type-safe — no @ts-ignore required.
 */
interface ImportMetaEnv {
  /** Google Maps JavaScript API key injected at build time */
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  /** Backend Express API base URL injected at build time */
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
