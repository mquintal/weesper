import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import tailwindcss from '@tailwindcss/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(import.meta.dirname, '../../'), ['VITE_', 'SENTRY_'])

  const sentry = sentryVitePlugin({
    org: env.SENTRY_ORG,
    project: env.SENTRY_PROJECT,
    authToken: env.SENTRY_AUTH_TOKEN,
    disable: mode !== 'production',
    bundleSizeOptimizations: {
      excludeDebugStatements: true,
      excludeReplayIframe: true,
      excludeReplayShadowDom: true,
    },
    reactComponentAnnotation: {
      enabled: true,
    },
  })

  return {
    envDir: '../../',
    plugins: [
      react(),
      tailwindcss(),

      electron([
        {
          // Main-Process entry file of the Electron App.
          entry: 'electron/main.ts',
          vite: {
            build: {
              sourcemap: true,
              minify: true,
              rollupOptions: {
                external: ['better-sqlite3', 'electron-updater'],
              },
            },
            resolve: {
              conditions: ['node'],
            },
            define: {
              'process.env.VITE_SENTRY_DSN': JSON.stringify(env.VITE_SENTRY_DSN),
            },
            plugins: [sentry],
          },
        },
        {
          entry: 'electron/preload.ts',
          onstart(options) {
            // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete, 
            // instead of restarting the entire Electron App.
            options.reload()
          },
          vite: {
            build: {
              sourcemap: true,
              minify: true,
            },
            plugins: [sentry],
          },
        },
      ]),
      renderer(),
      sentry,
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
        '@electron': path.resolve(import.meta.dirname, './electron'),
        'lottie-web': 'lottie-web/build/player/lottie_light.min.js'
      },
    },
    build: {
      sourcemap: true,
    },
  }
})
