#!/usr/bin/env tsx

import { promises as fs } from 'fs'
import { join } from 'path'

interface AutoFix {
  file: string
  line: number
  original: string
  fixed: string
  description: string
}

class AutoButtonFixer {
  private fixes: AutoFix[] = []

  private async findFiles(dir: string): Promise<string[]> {
    const files: string[] = []
    
    const traverse = async (currentDir: string): Promise<void> => {
      const entries = await fs.readdir(currentDir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = join(currentDir, entry.name)
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await traverse(fullPath)
        } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
          files.push(fullPath)
        }
      }
    }
    
    await traverse(dir)
    return files
  }

  private async analyzeAndFixFile(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const lines = content.split('\n')
      let modified = content
      let hasChanges = false

      // 修正パターンのリスト
      const fixPatterns = [
        // Native button with custom classes -> Button component
        {
          pattern: /<button([^>]*className="[^"]*(?:bg-|text-|border-|hover:)[^"]*"[^>]*)>/g,
          replacer: (match: string) => {
            // 基本的なプロパティを抽出
            const dataTestId = match.match(/data-testid="([^"]+)"/)?.[1] || ''
            const className = match.match(/className="([^"]+)"/)?.[1] || ''
            const onClick = match.match(/onClick=\{([^}]+)\}/)?.[1] || ''
            
            // 適切なvariantを決定
            let variant = 'outline'
            if (className.includes('bg-blue') || className.includes('btn-primary')) {
              variant = 'primary'
            } else if (className.includes('text-red') || className.includes('btn-danger')) {
              variant = 'danger'
            } else if (className.includes('btn-secondary')) {
              variant = 'secondary'
            }

            // Buttonコンポーネントに変換
            let buttonProps = `variant="${variant}"`
            if (dataTestId) buttonProps += ` data-testid="${dataTestId}"`
            if (onClick) buttonProps += ` onClick={${onClick}}`
            if (className.includes('w-full')) buttonProps += ` className="w-full"`

            return `<Button ${buttonProps}>`
          },
          description: 'Native button with custom styles → Button component'
        },
        
        // btn-* クラスの修正
        {
          pattern: /<button([^>]*className="[^"]*btn-[^"]*"[^>]*)>/g,
          replacer: (match: string) => {
            const dataTestId = match.match(/data-testid="([^"]+)"/)?.[1] || ''
            const onClick = match.match(/onClick=\{([^}]+)\}/)?.[1] || ''
            const className = match.match(/className="([^"]+)"/)?.[1] || ''
            
            let variant = 'outline'
            if (className.includes('btn-outline')) variant = 'outline'
            if (className.includes('btn-secondary')) variant = 'secondary'
            if (className.includes('btn-primary')) variant = 'primary'

            let buttonProps = `variant="${variant}"`
            if (dataTestId) buttonProps += ` data-testid="${dataTestId}"`
            if (onClick) buttonProps += ` onClick={${onClick}}`

            return `<Button ${buttonProps}>`
          },
          description: 'btn-* classes → Button component with variant'
        },

        // Button import の追加チェック
        {
          pattern: /^(import.*from.*)/gm,
          replacer: (match: string, content: string) => {
            if (!content.includes('import { Button }') && content.includes('<Button')) {
              const lastImport = content.lastIndexOf('import')
              const nextNewline = content.indexOf('\n', lastImport)
              return content.slice(0, nextNewline) + 
                     "\nimport { Button } from '@/components/ui/button'" +
                     content.slice(nextNewline)
            }
            return match
          },
          description: 'Add Button import'
        }
      ]

      // 各パターンを適用
      for (const { pattern, replacer, description } of fixPatterns) {
        const originalModified = modified
        
        if (typeof replacer === 'function') {
          modified = modified.replace(pattern, replacer as any)
        } else {
          modified = modified.replace(pattern, replacer)
        }

        if (originalModified !== modified) {
          hasChanges = true
          console.log(`  ✓ Applied: ${description}`)
        }
      }

      // ファイルが変更された場合のみ書き込み
      if (hasChanges) {
        await fs.writeFile(filePath, modified, 'utf-8')
        console.log(`✅ Fixed: ${filePath}`)
        
        // 修正内容を記録
        this.fixes.push({
          file: filePath,
          line: 0, // 複数行の場合は0
          original: 'Multiple button fixes',
          fixed: 'Standardized Button components',
          description: 'Converted native buttons to Button component with appropriate variants'
        })
      }

    } catch (error) {
      console.error(`Error processing ${filePath}:`, error)
    }
  }

  // Button importを追加する関数
  private async addButtonImports(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      
      // <Button を使用しているがimportがない場合
      if (content.includes('<Button') && !content.includes("import { Button }")) {
        // 既存のimport文を探す
        const lines = content.split('\n')
        let importInsertIndex = -1
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('import') && lines[i].includes('react')) {
            importInsertIndex = i + 1
          }
        }
        
        if (importInsertIndex > -1) {
          lines.splice(importInsertIndex, 0, "import { Button } from '@/components/ui/button'")
          await fs.writeFile(filePath, lines.join('\n'), 'utf-8')
          console.log(`  ✓ Added Button import to ${filePath}`)
        }
      }
    } catch (error) {
      console.error(`Error adding import to ${filePath}:`, error)
    }
  }

  private generateFixReport(): void {
    console.log('\n📊 AUTO-FIX SUMMARY REPORT')
    console.log('=' .repeat(50))
    console.log(`Total files processed: ${this.fixes.length}`)
    console.log(`Total fixes applied: ${this.fixes.length}`)
    
    if (this.fixes.length > 0) {
      console.log('\n🔧 Applied Fixes:')
      this.fixes.forEach((fix, index) => {
        console.log(`${index + 1}. ${fix.file}`)
        console.log(`   ${fix.description}`)
      })
      
      console.log('\n✅ Auto-fix completed successfully!')
      console.log('💡 Next steps:')
      console.log('  • Run npm run check:buttons to verify fixes')
      console.log('  • Test the affected components manually')
      console.log('  • Run npm run check:accessibility for accessibility validation')
    } else {
      console.log('\n✨ No fixes needed - all buttons are already properly implemented!')
    }
  }

  async run(): Promise<void> {
    console.log('🔧 Starting automatic button fixes...\n')

    const files = await this.findFiles('./src')
    
    for (const file of files) {
      console.log(`Processing: ${file}`)
      await this.analyzeAndFixFile(file)
      await this.addButtonImports(file)
    }

    this.generateFixReport()
  }
}

// 実行
if (require.main === module) {
  const fixer = new AutoButtonFixer()
  fixer.run().catch(error => {
    console.error('💥 Auto-fix failed:', error)
    process.exit(1)
  })
}

export { AutoButtonFixer }