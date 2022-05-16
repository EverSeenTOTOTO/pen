/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'detect-port' {
  const anything = any;
  export default anything;
}
declare module 'remark-prism' {
  const anything = any;
  export default anything;
}
/// <reference types="vite/client" />
/// <reference types="vue/macros-global" />

declare interface Window {
  __PREFETCHED_STATE__: any
}

declare interface ImportMetaEnv {
  readonly VITE_SERVER_URL: string
  readonly DEV?: boolean
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv
}
