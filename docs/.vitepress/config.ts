import { defineConfig } from 'vitepress'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// 动态设置 base 路径
// 在 GitHub Pages 上，如果不是 username.github.io 仓库，需要使用仓库名作为 base
// 可以通过环境变量 BASE_PATH 设置，默认为 '/'
const base = process.env.BASE_PATH || '/'

export default defineConfig({
  title: 'My Hooks',
  description: 'Collection of essential Vue Composition API utilities',
  base,
  
  vite: {
    resolve: {
      alias: {
        'my-hooks': resolve(__dirname, '../../src'),
      },
    },
  },
  
  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/' },
      { text: 'Hooks', link: '/hooks/' },
      { text: 'GitHub', link: 'https://github.com/zhangqinglei-tal/my-hooks' }
    ],
    
    sidebar: {
      '/guide/': [
        {
          text: '开始',
          items: [
            { text: '介绍', link: '/guide/' },
            { text: '快速开始', link: '/guide/getting-started' }
          ]
        }
      ],
      '/hooks/': [
        {
          text: 'Hooks',
          items: [
            { text: '概览', link: '/hooks/' },
            { text: 'useCounter', link: '/hooks/useCounter' },
            { text: 'useToggle', link: '/hooks/useToggle' },
            { text: 'useLocalStorage', link: '/hooks/useLocalStorage' },
            {
              text: '表格管理',
              items: [
                { text: 'useTableRequest', link: '/hooks/useTableRequest' },
                { text: 'useTableStatic', link: '/hooks/useTableStatic' }
              ]
            },
            {
              text: '数据请求',
              items: [
                { text: 'useFetch', link: '/hooks/useFetch' },
                { text: 'useAxiosFetch', link: '/hooks/useAxiosFetch' }
              ]
            }
          ]
        }
      ]
    },
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com/zhangqinglei-tal/my-hooks' }
    ],
    
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024'
    },
    
    search: {
      provider: 'local'
    }
  }
})

