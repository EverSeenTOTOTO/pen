/// <reference types="vite/client" />

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
}
