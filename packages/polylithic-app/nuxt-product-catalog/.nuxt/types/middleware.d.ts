import type { NavigationGuard } from 'vue-router'
export type MiddlewareKey = never
declare module "../../../../../node_modules/.pnpm/nuxt@3.16.0_@parcel+watcher@2.5.1_@types+node@22.13.9_db0@0.3.1_encoding@0.1.13_eslint@9.21.0_5melyr22aniwpvpervi5fp3yze/node_modules/nuxt/dist/pages/runtime/composables" {
  interface PageMeta {
    middleware?: MiddlewareKey | NavigationGuard | Array<MiddlewareKey | NavigationGuard>
  }
}