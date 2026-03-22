import { cpSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

function tutorialAssetsPlugin() {
  const tutorialOutputDir = resolve(__dirname, 'vue-group-sheet-tutorial-script', 'output')
  const distTutorialDir = resolve(__dirname, 'dist', 'vue-group-sheet-tutorial-script', 'output')

  return {
    name: 'tutorial-assets',
    apply: 'build',
    closeBundle() {
      if (!existsSync(tutorialOutputDir)) return
      cpSync(tutorialOutputDir, distTutorialDir, { recursive: true })
    }
  }
}

export default defineConfig({
  plugins: [vue(), tutorialAssetsPlugin()],
  base: './',
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
