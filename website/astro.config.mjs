import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  site: 'https://mquintal.github.io',
  base: '/weesper',
  vite: {
    plugins: [tailwindcss()],
  },
})
