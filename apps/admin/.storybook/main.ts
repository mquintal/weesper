import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { StorybookConfig } from '@storybook/react-vite'

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string) {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)))
}
const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [getAbsolutePath('@storybook/addon-a11y'), getAbsolutePath('@storybook/addon-docs')],
  framework: getAbsolutePath('@storybook/react-vite'),
  async viteFinal(config) {
    if (config.plugins) {
      config.plugins = config.plugins.filter((plugin: any) => {
        if (Array.isArray(plugin)) {
          return !plugin.some((p) => p?.name?.startsWith('vite-plugin-electron'))
        }
        return plugin?.name && !plugin.name.startsWith('vite-plugin-electron')
      })
    }

    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@/widget/useRecordingManager': fileURLToPath(
          new URL('../src/widget/useRecordingManager.mock.ts', import.meta.url),
        ),
      }
    }

    return config
  },
}
export default config
