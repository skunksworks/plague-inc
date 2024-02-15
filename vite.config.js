import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

// https://vitejmodule.exports = {


export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },proxy: {
      '/api': {
        target: 'https://euezoazieuaczioeuzaieouazioezuei.github.io/api/',
        changeOrigin: true,
        pathRewrite: {
          '^/api': '',
        },
      },
    }
  }
})
