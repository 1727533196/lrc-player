import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/main.ts',
      name: 'LrcPlayerCore',
      fileName: 'lrc-player-core',
      formats: ['es']
    }
  }
})
