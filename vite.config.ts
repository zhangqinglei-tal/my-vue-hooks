import { defineConfig } from 'vite'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'
import { readFileSync } from 'fs'

// 读取 package.json 获取版本号
const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'))

export default defineConfig({
  plugins: [vue()],
  define: {
    __VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MyHooks',
      fileName: (format) => `my-hooks.${format}.js`,
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: ['vue', /^vue\//, 'axios'],
      output: {
        // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
        globals: {
          vue: 'Vue',
          axios: 'axios',
        },
        // 支持 tree shaking - 为每个模块生成单独的文件
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
        // 添加 banner 包含版本信息
        banner: `/*! ${pkg.name} v${pkg.version} | ${pkg.license} License */`,
        // 只使用命名导出，避免默认导出警告
        exports: 'named',
      },
    },
    // 生成 source map
    sourcemap: true,
    // 压缩代码
    minify: 'terser',
    // 清空输出目录
    emptyOutDir: true,
  },
})

