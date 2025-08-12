#!/usr/bin/env tsx

import { promises as fs } from 'fs'
import { join } from 'path'

interface ButtonIssue {
  type: 'visibility' | 'accessibility' | 'standardization' | 'implementation'
  severity: 'critical' | 'high' | 'medium' | 'low'
  message: string
  suggestion: string
  line?: number
  column?: number
}

interface ButtonElement {
  id: string
  file: string
  line: number
  element: string
  type: 'button' | 'Button' | 'link-button' | 'role-button'
  variant?: string
  className?: string
  issues: ButtonIssue[]
}

interface CheckReport {
  totalButtons: number
  issueCount: number
  buttonsByType: Record<string, number>
  issuesBySeverity: Record<string, number>
  fileStats: Record<string, { buttons: number; issues: number }>
  buttons: ButtonElement[]
}

class ComprehensiveButtonChecker {
  private report: CheckReport = {
    totalButtons: 0,
    issueCount: 0,
    buttonsByType: {},
    issuesBySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
    fileStats: {},
    buttons: []
  }

  // 輝度計算（コントラスト比算出用）
  private calculateLuminance(hex: string): number {
    if (!hex || hex === 'transparent') return 1 // 透明は白と仮定
    
    // #を削除してRGBに変換
    const cleanHex = hex.replace('#', '')
    if (cleanHex.length !== 6) return 1
    
    const r = parseInt(cleanHex.slice(0, 2), 16) / 255
    const g = parseInt(cleanHex.slice(2, 4), 16) / 255
    const b = parseInt(cleanHex.slice(4, 6), 16) / 255

    const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
  }

  private calculateContrastRatio(color1: string, color2: string): number {
    const lum1 = this.calculateLuminance(color1)
    const lum2 = this.calculateLuminance(color2)
    
    const brightest = Math.max(lum1, lum2)
    const darkest = Math.min(lum1, lum2)
    
    return (brightest + 0.05) / (darkest + 0.05)
  }

  // Tailwind色をHEXに変換（CSS変数も含む）
  private tailwindToHex(className: string): { bg?: string; text?: string } {
    const colorMap: Record<string, string> = {
      'bg-white': '#ffffff',
      'bg-black': '#000000',
      'bg-gray-50': '#f9fafb',
      'bg-gray-100': '#f3f4f6',
      'bg-gray-200': '#e5e7eb',
      'bg-gray-300': '#d1d5db',
      'bg-gray-700': '#374151',
      'bg-gray-900': '#111827',
      'bg-blue-600': '#2563eb',
      'bg-blue-700': '#1d4ed8',
      'bg-green-600': '#16a34a',
      'bg-green-700': '#15803d',
      'bg-red-600': '#dc2626',
      'bg-red-700': '#b91c1c',
      'bg-yellow-600': '#ca8a04',
      'bg-yellow-700': '#a16207',
      'text-white': '#ffffff',
      'text-black': '#000000',
      'text-gray-700': '#374151',
      'text-gray-900': '#111827',
      // CSS変数の潜在的な問題パターン
      'bg-primary': 'CSS_VAR_RISK',
      'text-primary-foreground': 'CSS_VAR_RISK',
      'bg-secondary': 'CSS_VAR_RISK',
      'text-secondary-foreground': 'CSS_VAR_RISK',
    }

    const result: { bg?: string; text?: string } = {}
    
    // 背景色を抽出
    const bgMatch = className.match(/bg-[\w-]+/)
    if (bgMatch) {
      result.bg = colorMap[bgMatch[0]]
    }

    // 文字色を抽出
    const textMatch = className.match(/text-[\w-]+/)
    if (textMatch) {
      result.text = colorMap[textMatch[0]]
    }

    return result
  }

  // ボタン要素の検出と解析
  private async analyzeFile(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const lines = content.split('\n')

      // 各種ボタンパターンを検出
      const buttonPatterns = [
        // 標準button要素
        /<button[^>]*>/g,
        // Buttonコンポーネント
        /<Button[^>]*>/g,
        // role="button"
        /<[^>]+role=["']button["'][^>]*>/g,
        // Link as Button
        /<Button[^>]*asChild[^>]*>/g
      ]

      let buttonId = 0

      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex]
        
        for (const pattern of buttonPatterns) {
          const matches = [...line.matchAll(pattern)]
          
          for (const match of matches) {
            const element = match[0]
            buttonId++
            
            const button: ButtonElement = {
              id: `btn-${filePath}-${buttonId}`,
              file: filePath,
              line: lineIndex + 1,
              element: element.substring(0, 100) + (element.length > 100 ? '...' : ''),
              type: this.determineButtonType(element),
              variant: this.extractVariant(element),
              className: this.extractClassName(element),
              issues: []
            }

            // 各種チェックを実行
            this.checkVisibility(button, element)
            this.checkAccessibility(button, element)
            this.checkStandardization(button, element)
            this.checkImplementation(button, element)

            this.report.buttons.push(button)
            this.report.totalButtons++

            // 統計情報を更新
            this.updateStats(button, filePath)
          }
        }
      }
    } catch (error) {
      console.error(`Error analyzing ${filePath}:`, error)
    }
  }

  private determineButtonType(element: string): ButtonElement['type'] {
    if (element.includes('<Button') && element.includes('asChild')) return 'link-button'
    if (element.includes('<Button')) return 'Button'
    if (element.includes('role="button"')) return 'role-button'
    return 'button'
  }

  private extractVariant(element: string): string | undefined {
    const variantMatch = element.match(/variant=["']([^"']+)["']/)
    return variantMatch?.[1]
  }

  private extractClassName(element: string): string | undefined {
    const classMatch = element.match(/className=["']([^"']+)["']/)
    return classMatch?.[1]
  }

  // 視認性チェック
  private checkVisibility(button: ButtonElement, element: string): void {
    const className = button.className || ''
    
    // 同色の背景と文字をチェック
    if (className.includes('bg-white') && className.includes('text-white')) {
      button.issues.push({
        type: 'visibility',
        severity: 'critical',
        message: '背景色と文字色が同じ白色です',
        suggestion: '適切なコントラストを持つ色の組み合わせを使用してください'
      })
    }

    // CSS変数リスクの検出
    const colors = this.tailwindToHex(className)
    if (colors.bg === 'CSS_VAR_RISK' || colors.text === 'CSS_VAR_RISK') {
      button.issues.push({
        type: 'visibility',
        severity: 'high',
        message: 'CSS変数を使用したスタイル（実行時に検証が必要）',
        suggestion: '明示的なカラー値（primary, secondary, outline, ghost, danger variant）を使用してください'
      })
    }

    // コントラスト比チェック
    if (colors.bg && colors.text && colors.bg !== 'CSS_VAR_RISK' && colors.text !== 'CSS_VAR_RISK') {
      const ratio = this.calculateContrastRatio(colors.bg, colors.text)
      if (ratio < 4.5) {
        button.issues.push({
          type: 'visibility',
          severity: 'high',
          message: `コントラスト比が不足しています (${ratio.toFixed(2)}:1)`,
          suggestion: 'WCAG 2.1 AA基準の4.5:1以上のコントラスト比を確保してください'
        })
      }
    }

    // 透明度チェック
    if (className.includes('opacity-') && !className.includes('opacity-100')) {
      const opacityMatch = className.match(/opacity-(\d+)/)
      if (opacityMatch && parseInt(opacityMatch[1]) < 50) {
        button.issues.push({
          type: 'visibility',
          severity: 'medium',
          message: '透明度が低すぎます',
          suggestion: '最低50%以上の透明度を維持してください'
        })
      }
    }
  }

  // アクセシビリティチェック
  private checkAccessibility(button: ButtonElement, element: string): void {
    // aria-labelまたはtitle属性の確認
    const hasAriaLabel = element.includes('aria-label=')
    const hasTitle = element.includes('title=')
    const hasTextContent = element.includes('>')
    
    if (!hasAriaLabel && !hasTitle && !hasTextContent) {
      button.issues.push({
        type: 'accessibility',
        severity: 'high',
        message: 'アクセシビリティ属性が不足しています',
        suggestion: 'aria-label、title属性、またはテキストコンテンツを追加してください'
      })
    }

    // disabled状態のチェック
    if (element.includes('disabled') && !element.includes('aria-disabled')) {
      button.issues.push({
        type: 'accessibility',
        severity: 'medium',
        message: 'aria-disabled属性が不足しています',
        suggestion: 'disabled属性と合わせてaria-disabled属性を追加してください'
      })
    }

    // role属性の不適切な使用
    if (element.includes('role="button"') && element.includes('<button')) {
      button.issues.push({
        type: 'accessibility',
        severity: 'low',
        message: '不要なrole属性です',
        suggestion: 'button要素にはrole="button"は不要です'
      })
    }
  }

  // 標準化チェック
  private checkStandardization(button: ButtonElement, element: string): void {
    const className = button.className || ''

    // カスタムスタイルの使用
    if (className.includes('bg-') || className.includes('text-') || className.includes('hover:')) {
      if (!button.variant) {
        button.issues.push({
          type: 'standardization',
          severity: 'high',
          message: 'カスタムスタイルが使用されています',
          suggestion: '統一されたvariantを使用してください (primary, secondary, outline, ghost, danger)'
        })
      }
    }

    // 非標準ボタンの使用
    if (button.type === 'button' && !element.includes('<Button')) {
      button.issues.push({
        type: 'standardization',
        severity: 'medium',
        message: '標準Buttonコンポーネントが使用されていません',
        suggestion: '@/components/ui/buttonのButtonコンポーネントを使用してください'
      })
    }

    // 未承認のvariant
    const approvedVariants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'primary', 'success', 'warning', 'danger']
    if (button.variant && !approvedVariants.includes(button.variant)) {
      button.issues.push({
        type: 'standardization',
        severity: 'medium',
        message: `未承認のvariant "${button.variant}" が使用されています`,
        suggestion: `承認されたvariantを使用してください: ${approvedVariants.join(', ')}`
      })
    }
  }

  // 実装チェック
  private checkImplementation(button: ButtonElement, element: string): void {
    // インラインスタイルの使用
    if (element.includes('style=')) {
      button.issues.push({
        type: 'implementation',
        severity: 'high',
        message: 'インラインスタイルが使用されています',
        suggestion: 'CSSクラスまたはvariantを使用してください'
      })
    }

    // onClick属性のチェック
    if (element.includes('onClick') && button.type === 'link-button') {
      button.issues.push({
        type: 'implementation',
        severity: 'low',
        message: 'Link buttonでonClickが使用されています',
        suggestion: 'ナビゲーションにはLinkコンポーネントを使用してください'
      })
    }
  }

  private updateStats(button: ButtonElement, filePath: string): void {
    // ボタンタイプ別統計
    this.report.buttonsByType[button.type] = (this.report.buttonsByType[button.type] || 0) + 1

    // 問題重要度別統計
    button.issues.forEach(issue => {
      this.report.issuesBySeverity[issue.severity]++
      this.report.issueCount++
    })

    // ファイル別統計
    if (!this.report.fileStats[filePath]) {
      this.report.fileStats[filePath] = { buttons: 0, issues: 0 }
    }
    this.report.fileStats[filePath].buttons++
    this.report.fileStats[filePath].issues += button.issues.length
  }

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

  private generateDetailedReport(): void {
    console.log('\n🔍 COMPREHENSIVE BUTTON QUALITY REPORT')
    console.log('=' .repeat(60))
    
    // 概要統計
    console.log('\n📊 Summary Statistics:')
    console.log(`Total buttons found: ${this.report.totalButtons}`)
    console.log(`Total issues: ${this.report.issueCount}`)
    console.log(`Files analyzed: ${Object.keys(this.report.fileStats).length}`)
    
    // ボタンタイプ別統計
    console.log('\n🔘 Buttons by Type:')
    Object.entries(this.report.buttonsByType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`)
    })

    // 重要度別統計
    console.log('\n⚠️  Issues by Severity:')
    Object.entries(this.report.issuesBySeverity).forEach(([severity, count]) => {
      const icon = severity === 'critical' ? '🔴' : severity === 'high' ? '🟠' : severity === 'medium' ? '🟡' : '🔵'
      console.log(`  ${icon} ${severity}: ${count}`)
    })

    // ファイル別統計
    console.log('\n📁 Issues by File:')
    Object.entries(this.report.fileStats)
      .filter(([, stats]) => stats.issues > 0)
      .sort(([, a], [, b]) => b.issues - a.issues)
      .forEach(([file, stats]) => {
        console.log(`  ${file}: ${stats.issues} issues (${stats.buttons} buttons)`)
      })

    // 詳細な問題リスト
    if (this.report.issueCount > 0) {
      console.log('\n🐛 Detailed Issues:')
      this.report.buttons
        .filter(button => button.issues.length > 0)
        .forEach(button => {
          console.log(`\n📍 ${button.file}:${button.line}`)
          console.log(`   Element: ${button.element}`)
          console.log(`   Type: ${button.type}${button.variant ? ` (variant: ${button.variant})` : ''}`)
          
          button.issues.forEach(issue => {
            const icon = issue.severity === 'critical' ? '🔴' : issue.severity === 'high' ? '🟠' : issue.severity === 'medium' ? '🟡' : '🔵'
            console.log(`   ${icon} ${issue.message}`)
            console.log(`      → ${issue.suggestion}`)
          })
        })
    }

    // 修正提案
    console.log('\n💡 Auto-fix Recommendations:')
    const criticalIssues = this.report.issueCount
    if (criticalIssues > 0) {
      console.log(`  • Run 'npm run fix:buttons' to automatically fix ${criticalIssues} standardization issues`)
      console.log(`  • Run 'npm run check:accessibility' for detailed accessibility analysis`)
      console.log(`  • Use standard Button variants: primary, secondary, outline, ghost, danger`)
    } else {
      console.log('  ✅ No automatic fixes needed!')
    }
  }

  async run(): Promise<void> {
    console.log('🚀 Starting comprehensive button check...')

    const files = await this.findFiles('./src')
    console.log(`Analyzing ${files.length} files...`)

    for (const file of files) {
      await this.analyzeFile(file)
    }

    this.generateDetailedReport()

    // レポートをJSONファイルとして保存
    await fs.writeFile(
      'button-quality-report.json',
      JSON.stringify(this.report, null, 2),
      'utf-8'
    )

    console.log('\n📄 Detailed report saved to: button-quality-report.json')

    // 重大な問題がある場合は終了コード1
    if (this.report.issuesBySeverity.critical > 0) {
      console.log('\n❌ Critical issues found. Please fix before deployment.')
      process.exit(1)
    } else if (this.report.issueCount === 0) {
      console.log('\n✅ All button quality checks passed!')
    } else {
      console.log('\n⚠️  Some issues found. Consider fixing for better quality.')
    }
  }
}

// 実行
if (require.main === module) {
  const checker = new ComprehensiveButtonChecker()
  checker.run().catch(error => {
    console.error('💥 Comprehensive button check failed:', error)
    process.exit(1)
  })
}

export { ComprehensiveButtonChecker }