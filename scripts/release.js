#!/usr/bin/env node

/**
 * 发布脚本
 * 自动执行版本更新、构建、测试、生成 changelog 等步骤
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const packagePath = resolve(__dirname, '../package.json')
const changelogPath = resolve(__dirname, '../CHANGELOG.md')

function exec(command, options = {}) {
  console.log(`\n> ${command}`)
  try {
    execSync(command, { stdio: 'inherit', ...options })
  } catch (error) {
    console.error(`\n✗ Command failed: ${command}`)
    process.exit(1)
  }
}

function readPackage() {
  return JSON.parse(readFileSync(packagePath, 'utf-8'))
}

function writePackage(pkg) {
  writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n')
}

function updateChangelog(version, type) {
  const date = new Date().toISOString().split('T')[0]
  const changelog = existsSync(changelogPath)
    ? readFileSync(changelogPath, 'utf-8')
    : '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n'

  const entry = `## [${version}] - ${date}\n\n### ${type === 'major' ? 'Breaking Changes' : type === 'minor' ? 'Added' : 'Changed'}\n\n- \n\n`

  const newChangelog = changelog.replace(
    '# Changelog',
    `# Changelog\n\n${entry}`
  )

  writeFileSync(changelogPath, newChangelog)
  console.log(`✓ Updated CHANGELOG.md`)
}

const type = process.argv[2] || 'patch'

if (!['patch', 'minor', 'major'].includes(type)) {
  console.error('Invalid release type. Use: patch, minor, or major')
  process.exit(1)
}

console.log(`\n🚀 Starting release process (${type})...\n`)

// 1. 检查工作区是否干净
try {
  execSync('git diff --quiet HEAD', { stdio: 'pipe' })
} catch {
  console.error('✗ Working directory is not clean. Please commit or stash changes.')
  process.exit(1)
}

// 2. 运行测试
console.log('\n📋 Running tests...')
exec('pnpm test')

// 3. 类型检查
console.log('\n📋 Type checking...')
exec('pnpm type-check')

// 4. 更新版本号
console.log('\n📋 Updating version...')
const versionOutput = execSync('node scripts/version.js ' + type, { encoding: 'utf-8' })
const newVersion = versionOutput.match(/NEW_VERSION=([\d.]+)/)?.[1]
if (!newVersion) {
  console.error('Failed to get new version')
  process.exit(1)
}

// 5. 更新 CHANGELOG
console.log('\n📋 Updating CHANGELOG...')
updateChangelog(newVersion, type)

// 6. 构建
console.log('\n📋 Building...')
exec('pnpm build')

// 7. 提示提交和发布
console.log('\n✅ Release preparation complete!')
console.log(`\nNext steps:`)
console.log(`  1. Review CHANGELOG.md`)
console.log(`  2. Commit changes: git add . && git commit -m "chore: release v${newVersion}"`)
console.log(`  3. Create tag: git tag v${newVersion}`)
console.log(`  4. Push: git push && git push --tags`)
console.log(`  5. Publish: npm publish`)

