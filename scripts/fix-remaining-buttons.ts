#!/usr/bin/env tsx

import { promises as fs } from 'fs'
import { join } from 'path'

class RemainingButtonFixer {
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

  async fixFile(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      let modified = content

      // 共通的な修正パターン
      const fixes = [
        {
          pattern: /className="bg-primary text-primary-foreground hover:bg-primary\/90"/g,
          replacement: 'variant="primary"',
          description: 'bg-primary className to variant'
        },
        {
          pattern: /className="[^"]*text-gray-700 hover:bg-gray-100 hover:text-gray-900[^"]*"/g,
          replacement: '',
          description: 'Remove custom gray styles (use ghost variant default)'
        },
        {
          pattern: /className="[^"]*text-red-600 hover:bg-red-100 hover:text-red-700[^"]*"/g,
          replacement: '',
          description: 'Remove custom red styles (danger variant handles this)'
        }
      ]

      let hasChanges = false
      
      for (const fix of fixes) {
        const matches = content.match(fix.pattern)
        if (matches) {
          console.log(`${filePath}: ${fix.description} (${matches.length} matches)`)
          modified = modified.replace(fix.pattern, fix.replacement)
          hasChanges = true
        }
      }

      if (hasChanges) {
        await fs.writeFile(filePath, modified, 'utf-8')
        console.log(`✅ Fixed: ${filePath}`)
      }
    } catch (error) {
      console.error(`Error fixing ${filePath}:`, error)
    }
  }

  async run(): Promise<void> {
    console.log('🚀 Fixing remaining button issues...\n')

    const files = await this.findFiles('./src')
    
    for (const file of files) {
      await this.fixFile(file)
    }

    console.log('\n✅ Remaining button fixes completed!')
  }
}

// 実行
if (require.main === module) {
  const fixer = new RemainingButtonFixer()
  fixer.run().catch(error => {
    console.error('💥 Fix failed:', error)
    process.exit(1)
  })
}

export { RemainingButtonFixer }