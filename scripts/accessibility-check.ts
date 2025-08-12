#!/usr/bin/env tsx

import { promises as fs } from 'fs'
import { join } from 'path'

interface ContrastCheck {
  background: string
  foreground: string
  ratio: number
  passes: boolean
}

class AccessibilityChecker {
  private violations: string[] = []

  // WCAG 2.1 AA基準のコントラスト比計算
  calculateLuminance(hex: string): number {
    // HEXからRGBに変換
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255

    // 相対輝度の計算
    const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
  }

  calculateContrastRatio(color1: string, color2: string): number {
    const lum1 = this.calculateLuminance(color1)
    const lum2 = this.calculateLuminance(color2)
    
    const brightest = Math.max(lum1, lum2)
    const darkest = Math.min(lum1, lum2)
    
    return (brightest + 0.05) / (darkest + 0.05)
  }

  // 定義済みのボタンvariantのコントラストチェック
  checkButtonVariants(): ContrastCheck[] {
    const variants = [
      { name: 'primary', bg: '#2563eb', fg: '#ffffff' },      // blue-600/white
      { name: 'success', bg: '#15803d', fg: '#ffffff' },      // green-700/white (updated)
      { name: 'warning', bg: '#a16207', fg: '#ffffff' },      // yellow-700/white (updated)
      { name: 'danger', bg: '#dc2626', fg: '#ffffff' },       // red-600/white
      { name: 'secondary', bg: '#f1f5f9', fg: '#0f172a' },    // slate-100/slate-900
      { name: 'outline', bg: '#ffffff', fg: '#0f172a' },      // white/slate-900
      { name: 'ghost', bg: 'transparent', fg: '#0f172a' },    // transparent/slate-900
    ]

    const results: ContrastCheck[] = []

    for (const variant of variants) {
      if (variant.bg === 'transparent') {
        // transparentの場合は背景を白と仮定
        const ratio = this.calculateContrastRatio('#ffffff', variant.fg)
        results.push({
          background: variant.bg,
          foreground: variant.fg,
          ratio: ratio,
          passes: ratio >= 4.5
        })
      } else {
        const ratio = this.calculateContrastRatio(variant.bg, variant.fg)
        results.push({
          background: variant.bg,
          foreground: variant.fg,
          ratio: ratio,
          passes: ratio >= 4.5
        })
      }
    }

    return results
  }

  // ファイル内のボタンアクセシビリティチェック
  async checkFileAccessibility(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      
      // 問題のあるパターンを検出
      const problematicPatterns = [
        {
          pattern: /<Button[^>]*className="[^"]*bg-white[^"]*text-white[^"]*"/g,
          issue: 'White background with white text'
        },
        {
          pattern: /<Button[^>]*className="[^"]*text-white[^"]*bg-white[^"]*"/g,
          issue: 'White text on white background'
        },
        {
          pattern: /<button[^>]*className="[^"]*bg-white[^"]*text-white[^"]*"/g,
          issue: 'Native button with white on white'
        },
        {
          pattern: /<Button[^>]*(?!.*variant=)[^>]*className="[^"]*bg-[^"]*text-[^"]*"/g,
          issue: 'Custom styled button without variant (should use standard variants)'
        }
      ]

      for (const { pattern, issue } of problematicPatterns) {
        const matches = content.match(pattern)
        if (matches) {
          matches.forEach(match => {
            this.violations.push(`${filePath}: ${issue} - ${match}`)
          })
        }
      }

      // aria-label やtitle属性の不足をチェック
      const buttonPattern = /<Button[^>]*>/g
      const buttons = content.match(buttonPattern)
      
      if (buttons) {
        buttons.forEach(button => {
          const hasAriaLabel = /aria-label="[^"]+"/i.test(button)
          const hasTitle = /title="[^"]+"/i.test(button)
          const hasTextContent = button.includes('>')
          
          if (!hasAriaLabel && !hasTitle && !hasTextContent) {
            this.violations.push(`${filePath}: Button missing accessibility attributes - ${button}`)
          }
        })
      }

    } catch (error) {
      console.error(`Error checking ${filePath}:`, error)
    }
  }

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

  generateReport(): void {
    console.log('\n📊 Accessibility Check Report')
    console.log('=' .repeat(50))

    // ボタンvariantのコントラストチェック結果
    console.log('\n🎨 Button Variant Contrast Analysis:')
    const contrastResults = this.checkButtonVariants()
    
    contrastResults.forEach((result, index) => {
      const status = result.passes ? '✅' : '❌'
      const variantName = ['primary', 'success', 'warning', 'danger', 'secondary', 'outline', 'ghost'][index]
      console.log(`${status} ${variantName}: ${result.ratio.toFixed(2)}:1 (${result.background} / ${result.foreground})`)
    })

    // 違反項目の報告
    console.log('\n🔍 Accessibility Violations:')
    if (this.violations.length === 0) {
      console.log('✅ No accessibility violations found!')
    } else {
      this.violations.forEach(violation => {
        console.log(`❌ ${violation}`)
      })
      console.log(`\nTotal violations: ${this.violations.length}`)
    }

    // 推奨事項
    console.log('\n💡 Recommendations:')
    console.log('- Use standard Button variants instead of custom className styles')
    console.log('- Ensure all interactive elements have appropriate aria-labels or titles')
    console.log('- Test with screen readers and keyboard navigation')
    console.log('- Maintain minimum 4.5:1 contrast ratio for text')
  }

  async run(): Promise<void> {
    console.log('🚀 Starting accessibility check...\n')

    const files = await this.findFiles('./src')
    console.log(`Checking ${files.length} files for accessibility issues...\n`)

    for (const filePath of files) {
      await this.checkFileAccessibility(filePath)
    }

    this.generateReport()

    // 違反がある場合は終了コード1で終了
    if (this.violations.length > 0) {
      console.log('\n❌ Accessibility check failed. Please fix the violations above.')
      process.exit(1)
    } else {
      console.log('\n✅ Accessibility check passed!')
    }
  }
}

// 実行
if (require.main === module) {
  const checker = new AccessibilityChecker()
  checker.run().catch(error => {
    console.error('💥 Accessibility check failed:', error)
    process.exit(1)
  })
}

export { AccessibilityChecker }