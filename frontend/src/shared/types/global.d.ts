//<reference types="vite/client" />

interface ImportMetaEnv {
  PROD: any;
  DEV: any;
  MODE: any;
  readonly VITE_API_URL?: string;
  readonly VITE_APP_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
