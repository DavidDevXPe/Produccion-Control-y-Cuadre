import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'

function walkSourceFiles(dir: string): string[] {
  const results: string[] = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...walkSourceFiles(fullPath))
    } else if (/\.(tsx?|jsx?|html|css)$/.test(entry.name)) {
      results.push(fullPath)
    }
  }

  return results
}

describe('DesignTokensGuard', () => {
  it('ensures no arbitrary dark mode hex classes exist in frontend source files', () => {
    const srcDir = path.resolve('src')
    const files = walkSourceFiles(srcDir)

    const darkHexPattern = /dark:(?:[a-z-]+:)*[a-z-]*\[#[0-9a-fA-F]{3,6}\]/g
    const violations: { file: string; line: number; match: string }[] = []

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8')
      const lines = content.split('\n')

      lines.forEach((lineText: string, index: number) => {
        const matches = lineText.match(darkHexPattern)
        if (matches) {
          for (const match of matches) {
            violations.push({
              file: path.relative(srcDir, file),
              line: index + 1,
              match,
            })
          }
        }
      })
    }

    expect(
      violations,
      `Found arbitrary dark mode hex color classes. Use semantic design tokens from index.css instead:\n${violations
        .map((v) => `  ${v.file}:${v.line} -> ${v.match}`)
        .join('\n')}`,
    ).toEqual([])
  })
})
