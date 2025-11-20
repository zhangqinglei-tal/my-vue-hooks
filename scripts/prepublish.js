#!/usr/bin/env node

/**
 * 发布前检查脚本
 * 在 npm publish 之前自动运行
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function exec(command, options = {}) {
  try {
    execSync(command, { stdio: 'inherit', ...options })
  } catch (error) {
    console.error(`\n✗ Command failed: ${command}`)
    process.exit(1)
  }
}

console.log('🔍 Running pre-publish checks...\n')

// 1. 检查 dist 目录是否存在
const distPath = resolve(__dirname, '../dist')
if (!existsSync(distPath)) {
  console.error('✗ dist directory not found. Run "pnpm build" first.')
  process.exit(1)
}

// 2. 检查必要的文件是否存在
const requiredFiles = [
  'dist/my-vue-hooks.es.js',
  'dist/my-vue-hooks.cjs.js',
  'dist/index.d.ts',
]

for (const file of requiredFiles) {
  const filePath = resolve(__dirname, '..', file)
  if (!existsSync(filePath)) {
    console.error(`✗ Required file not found: ${file}`)
    console.error('  Run "pnpm build" to generate build files.')
    process.exit(1)
  }
}

// 3. 运行测试
console.log('📋 Running tests...')
exec('pnpm test --run')

// 4. 类型检查
console.log('\n📋 Type checking...')
exec('pnpm type-check')

// 5. 检查 package.json 配置
console.log('\n📋 Checking package.json...')
const packagePath = resolve(__dirname, '../package.json')
const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'))

if (!pkg.version) {
  console.error('✗ Version not found in package.json')
  process.exit(1)
}

if (!pkg.files || !pkg.files.includes('dist')) {
  console.warn('⚠ Warning: "dist" not in package.json files array')
}

console.log(`✓ Package version: ${pkg.version}`)
console.log(`✓ Package name: ${pkg.name}`)

// 6. 检查是否有未提交的更改
try {
  execSync('git diff --quiet HEAD', { stdio: 'pipe' })
} catch {
  console.warn('⚠ Warning: There are uncommitted changes')
}

console.log('\n✅ Pre-publish checks passed!')

