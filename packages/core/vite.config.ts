import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/main.ts',
      name: 'MusicPlayerCore',
      fileName: 'music-player-core'
    }
  }
})
