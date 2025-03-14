declare var reframed:any;

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ImportMetaEnv {
  readonly NODE_ENV: string;
  readonly BASE_URL: string;
  [key: string]: string | undefined;
}

