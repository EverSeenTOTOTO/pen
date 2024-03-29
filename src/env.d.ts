/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'cookie-parser' {
  const anything = any;
  export default anything;
}
declare module 'get-port' {
  const anything = any;
  export default anything;
}
declare module 'better-logging' {
  const anything = any;
  export default anything;
}
/// <reference types="vite/client" />
/// <reference types="vue/macros-global" />

declare interface Window {
  __PREFETCHED_STATE__: any,
  renderMathInElement: (element: HTMLElement, options: unknown) => void
}

declare interface ImportMetaEnv {
  readonly VITE_SERVER_URL: string
  readonly DEV?: boolean
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv
  readonly globEager(path: string): any;
}
