import { defineConfig } from 'vite'

// @ts-ignore
export default defineConfig(() => {
    return {
      build: {
        lib: {
          entry: 'src/main.ts',
          name: 'LrcPlayerCore',
          fileName: 'lrc-player-core',
          formats: ['es']
        },
        minify: false, // 禁用压缩
      }
    }
})
