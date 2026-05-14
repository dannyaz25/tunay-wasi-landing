/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TARGET?: 'clientes' | 'caficultores' | 'mayoristas';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
