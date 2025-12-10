// @ts-nocheck
import { defineConfig } from 'vite'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'
import { readFileSync } from 'fs'

// 读取 package.json 获取版本号
const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'))

// 判断是否为构建模式（通过命令参数）
const isBuild = process.argv.includes('build')

export default defineConfig(({ command }) => {
  // 开发模式：使用应用模式（index.html）
  if (command === 'serve' || !isBuild) {
    return {
      plugins: [vue()],
      define: {
        __VERSION__: JSON.stringify(pkg.version),
      },
      resolve: {
        alias: {
          '@src': resolve(__dirname, 'src'),
        },
      },
      root: '.',
      server: {
        port: 3200,
        open: true,
        proxy: {
          // 代理 /api 路径到后端服务器
          '/api': {
            target: 'http://localhost:9900',
            changeOrigin: true,
            // 可选：重写路径，如果后端不需要 /api 前缀，可以去掉
            // rewrite: (path) => path.replace(/^\/api/, '')
          }
        }
      },
    }
  }

  // 构建模式：库模式配置，仅 toAwaitFetch
  return {
    plugins: [vue()],
    define: {
      __VERSION__: JSON.stringify(pkg.version),
    },
    resolve: {
      alias: {
        '@src': resolve(__dirname, 'src'),
      },
    },
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'xn-fe-tools',
        fileName: (format) => `index.${format}.js`,
        formats: ['es', 'cjs'],
      },
      rollupOptions: {
        // 确保外部化处理那些你不想打包进库的依赖
        external: ['vue', /^vue\//, 'axios'],
        treeshake: 'recommended',
        output: {
          preserveModules: true,
          preserveModulesRoot: 'src/hooks',
          // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
          globals: {
            vue: 'Vue',
            axios: 'axios',
          },
          // 单入口，友好 Tree Shaking（按需使用 ES 模块）
          entryFileNames: '[name].[format].js',
          // 添加 banner 包含版本信息
          banner: `/*! ${pkg.name} v${pkg.version} | ${pkg.license} License */`,
          // 只使用命名导出，避免默认导出警告
          exports: 'named',
        },
      },
      // 关闭 source map 生成
      sourcemap: false,
      // 压缩代码
      minify: 'terser',
      // 清空输出目录
      emptyOutDir: true,
    },
  }
})

