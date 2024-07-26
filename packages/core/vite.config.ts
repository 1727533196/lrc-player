import { defineConfig } from 'vite'

// @ts-ignore
export default defineConfig(() => {
    return {
      build: {
        lib: {
          entry: 'src/main.ts',
          fileName: 'index',
          formats: ['es']
        },
        minify: false, // 禁用压缩
      }
    }
})
