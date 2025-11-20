#!/usr/bin/env node

/**
 * 版本管理脚本
 * 使用方法:
 *   node scripts/version.js patch   # 1.0.0 -> 1.0.1
 *   node scripts/version.js minor   # 1.0.0 -> 1.1.0
 *   node scripts/version.js major   # 1.0.0 -> 2.0.0
 *   node scripts/version.js 1.2.3   # 直接设置版本号
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const packagePath = resolve(__dirname, '../package.json')
const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'))

function parseVersion(version) {
  return version.split('.').map(Number)
}

function formatVersion(parts) {
  return parts.join('.')
}

function bumpVersion(version, type) {
  const parts = parseVersion(version)
  
  switch (type) {
    case 'major':
      return formatVersion([parts[0] + 1, 0, 0])
    case 'minor':
      return formatVersion([parts[0], parts[1] + 1, 0])
    case 'patch':
      return formatVersion([parts[0], parts[1], parts[2] + 1])
    default:
      // 如果传入的是版本号，直接使用
      if (/^\d+\.\d+\.\d+/.test(type)) {
        return type
      }
      throw new Error(`Invalid version type: ${type}`)
  }
}

const type = process.argv[2]

if (!type) {
  console.error('Usage: node scripts/version.js [patch|minor|major|version]')
  console.error('Example: node scripts/version.js patch')
  process.exit(1)
}

const currentVersion = pkg.version
const newVersion = bumpVersion(currentVersion, type)

console.log(`Bumping version: ${currentVersion} -> ${newVersion}`)

// 更新 package.json
pkg.version = newVersion
writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n')

console.log(`✓ Updated package.json to version ${newVersion}`)

// 输出新版本号，供其他脚本使用
console.log(`NEW_VERSION=${newVersion}`)

