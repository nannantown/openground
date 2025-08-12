#!/usr/bin/env tsx

import { promises as fs } from 'fs'
import { join } from 'path'

interface ButtonReplacement {
  pattern: RegExp
  replacement: string
  description: string
}

// 問題のあるボタンパターンと修正後のvariant
const replacements: ButtonReplacement[] = [
  {
    pattern: /className="([^"]*?)bg-blue-600\s+text-white\s+hover:bg-blue-700[^"]*?"/g,
    replacement: 'variant="primary"',
    description: 'Blue buttons → primary variant'
  },
  {
    pattern: /className="([^"]*?)bg-green-600\s+text-white\s+hover:bg-green-700[^"]*?"/g,
    replacement: 'variant="success"',
    description: 'Green buttons → success variant'
  },
  {
    pattern: /className="([^"]*?)bg-red-600\s+text-white\s+hover:bg-red-700[^"]*?"/g,
    replacement: 'variant="danger"',
    description: 'Red buttons → danger variant'
  },
  {
    pattern: /className="([^"]*?)bg-yellow-600\s+text-white\s+hover:bg-yellow-700[^"]*?"/g,
    replacement: 'variant="warning"',
    description: 'Yellow buttons → warning variant'
  },
  // 汎用的な修正パターン
  {
    pattern: /Button[^>]*className="[^"]*bg-blue-600[^"]*text-white[^"]*"/g,
    replacement: (match: string) => {
      // className属性を除去してvariant="primary"を追加
      return match.replace(/className="[^"]*"/, '').replace('<Button', '<Button variant="primary"')
    },
    description: 'Generic blue button fixes'
  }
]

class ButtonStandardizer {
  private processedFiles = 0
  private modifiedFiles = 0
  private totalReplacements = 0

  async findFiles(dir: string, extension = '.tsx'): Promise<string[]> {
    const files: string[] = []
    
    const traverse = async (currentDir: string): Promise<void> => {
      const entries = await fs.readdir(currentDir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = join(currentDir, entry.name)
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await traverse(fullPath)
        } else if (entry.isFile() && entry.name.endsWith(extension)) {
          files.push(fullPath)
        }
      }
    }
    
    await traverse(dir)
    return files
  }

  async standardizeFile(filePath: string): Promise<void> {
    try {
      const originalContent = await fs.readFile(filePath, 'utf-8')
      let modifiedContent = originalContent
      let fileModified = false
      let fileReplacements = 0

      // 各置換パターンを適用
      for (const { pattern, replacement, description } of replacements) {
        const matches = originalContent.match(pattern)
        if (matches) {
          console.log(`  Found ${matches.length} ${description} patterns`)
          
          if (typeof replacement === 'string') {
            modifiedContent = modifiedContent.replace(pattern, replacement)
          } else {
            modifiedContent = modifiedContent.replace(pattern, replacement as any)
          }
          
          fileModified = true
          fileReplacements += matches.length
        }
      }

      // ファイルが変更された場合のみ書き込み
      if (fileModified) {
        await fs.writeFile(filePath, modifiedContent, 'utf-8')
        console.log(`✅ Modified: ${filePath} (${fileReplacements} replacements)`)
        this.modifiedFiles++
        this.totalReplacements += fileReplacements
      }

      this.processedFiles++
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error)
    }
  }

  async checkContrast(): Promise<void> {
    console.log('\n🔍 Checking for potential contrast issues...')
    
    const problematicPatterns = [
      /bg-white.*text-white/g,
      /text-white.*bg-white/g,
      /bg-gray-100.*text-gray-100/g,
      /text-gray-100.*bg-gray-100/g,
    ]

    const files = await this.findFiles('./src')
    
    for (const filePath of files) {
      const content = await fs.readFile(filePath, 'utf-8')
      
      for (const pattern of problematicPatterns) {
        const matches = content.match(pattern)
        if (matches) {
          console.log(`⚠️  Potential contrast issue in ${filePath}:`)
          matches.forEach(match => console.log(`    ${match}`))
        }
      }
    }
  }

  async generateReport(): Promise<void> {
    console.log('\n📊 Button Standardization Report')
    console.log('=' .repeat(50))
    console.log(`Total files processed: ${this.processedFiles}`)
    console.log(`Files modified: ${this.modifiedFiles}`)
    console.log(`Total replacements: ${this.totalReplacements}`)
    
    if (this.modifiedFiles === 0) {
      console.log('✅ No problematic button patterns found!')
    } else {
      console.log('✅ Button standardization completed!')
    }
  }

  async run(): Promise<void> {
    console.log('🚀 Starting button standardization...\n')

    // src ディレクトリ内の全.tsxファイルを処理
    const files = await this.findFiles('./src')
    console.log(`Found ${files.length} TypeScript/React files to process\n`)

    for (const filePath of files) {
      console.log(`Processing: ${filePath}`)
      await this.standardizeFile(filePath)
    }

    await this.checkContrast()
    await this.generateReport()
  }
}

// 実行
if (require.main === module) {
  const standardizer = new ButtonStandardizer()
  standardizer.run().catch(error => {
    console.error('💥 Button standardization failed:', error)
    process.exit(1)
  })
}

export { ButtonStandardizer }