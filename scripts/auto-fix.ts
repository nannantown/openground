#!/usr/bin/env tsx

import * as fs from 'fs'
import * as path from 'path'
import { spawn } from 'child_process'

interface TestResult {
  status: 'passed' | 'failed' | 'skipped'
  title: string
  file: string
  error?: string
  requirement?: string
}

interface FixStrategy {
  pattern: RegExp
  fix: string
  description: string
}

class AutoFixOrchestrator {
  private fixStrategies: FixStrategy[] = [
    {
      pattern: /Button.*not found/i,
      fix: 'Add data-testid="button" attribute to button elements',
      description: 'Missing test selectors for buttons'
    },
    {
      pattern: /Input.*not found/i,
      fix: 'Add data-testid attributes to form inputs',
      description: 'Missing test selectors for form elements'
    },
    {
      pattern: /Navigation.*failed/i,
      fix: 'Check routing configuration and page components',
      description: 'Navigation or routing issues'
    },
    {
      pattern: /Authentication.*required/i,
      fix: 'Add authentication mock or test user setup',
      description: 'Authentication not properly mocked'
    },
    {
      pattern: /API.*not responding/i,
      fix: 'Mock API endpoints or check server availability',
      description: 'API integration issues'
    }
  ]

  async analyzeFailures(testResults: TestResult[]): Promise<void> {
    console.log('🔍 Analyzing test failures for auto-fix opportunities...')
    
    const failures = testResults.filter(result => result.status === 'failed')
    
    if (failures.length === 0) {
      console.log('✅ No test failures to analyze')
      return
    }

    console.log(`❌ Found ${failures.length} test failures`)

    const fixSuggestions = this.generateFixSuggestions(failures)
    await this.generateFixReport(fixSuggestions)
    
    // Auto-apply simple fixes
    await this.applySimpleFixes(fixSuggestions)
  }

  private generateFixSuggestions(failures: TestResult[]) {
    const suggestions: Array<{
      test: TestResult
      strategy: FixStrategy | null
      autoFixable: boolean
    }> = []

    failures.forEach(failure => {
      const strategy = this.fixStrategies.find(s => 
        s.pattern.test(failure.error || '')
      )
      
      suggestions.push({
        test: failure,
        strategy: strategy || null,
        autoFixable: !!strategy
      })
    })

    return suggestions
  }

  private async generateFixReport(suggestions: any[]) {
    const reportContent = this.generateFixReportHTML(suggestions)
    const reportPath = path.join(process.cwd(), 'test-results', 'auto-fix-report.html')
    
    // Ensure directory exists
    fs.mkdirSync(path.dirname(reportPath), { recursive: true })
    fs.writeFileSync(reportPath, reportContent)
    
    console.log(`📋 Auto-fix report generated: ${reportPath}`)
  }

  private generateFixReportHTML(suggestions: any[]): string {
    const autoFixable = suggestions.filter(s => s.autoFixable)
    const manualFix = suggestions.filter(s => !s.autoFixable)

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Auto-Fix Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #fee2e2; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .section { margin: 20px 0; }
        .auto-fix { background: #dcfce7; padding: 15px; border-radius: 8px; margin: 10px 0; }
        .manual-fix { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 10px 0; }
        .test-title { font-weight: bold; color: #1f2937; }
        .error { color: #dc2626; font-family: monospace; background: #f9fafb; padding: 10px; border-radius: 4px; }
        .fix-suggestion { color: #059669; margin-top: 10px; }
        .stats { display: flex; gap: 20px; margin: 20px 0; }
        .stat { text-align: center; }
        .stat-value { font-size: 2em; font-weight: bold; }
        .stat-label { color: #6b7280; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔧 Test Auto-Fix Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        
        <div class="stats">
            <div class="stat">
                <div class="stat-value">${suggestions.length}</div>
                <div class="stat-label">Total Failures</div>
            </div>
            <div class="stat">
                <div class="stat-value">${autoFixable.length}</div>
                <div class="stat-label">Auto-Fixable</div>
            </div>
            <div class="stat">
                <div class="stat-value">${manualFix.length}</div>
                <div class="stat-label">Manual Fix Required</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>🤖 Auto-Fixable Issues</h2>
        ${autoFixable.map(s => `
            <div class="auto-fix">
                <div class="test-title">${s.test.title}</div>
                <div>File: ${s.test.file}</div>
                ${s.test.requirement ? `<div>Requirement: ${s.test.requirement}</div>` : ''}
                <div class="error">${s.test.error}</div>
                <div class="fix-suggestion">
                    <strong>Suggested Fix:</strong> ${s.strategy.fix}
                    <br><em>${s.strategy.description}</em>
                </div>
            </div>
        `).join('')}
    </div>

    <div class="section">
        <h2>👤 Manual Fix Required</h2>
        ${manualFix.map(s => `
            <div class="manual-fix">
                <div class="test-title">${s.test.title}</div>
                <div>File: ${s.test.file}</div>
                ${s.test.requirement ? `<div>Requirement: ${s.test.requirement}</div>` : ''}
                <div class="error">${s.test.error}</div>
                <div style="color: #d97706; margin-top: 10px;">
                    <strong>Action Required:</strong> Manual investigation and fix needed
                </div>
            </div>
        `).join('')}
    </div>
</body>
</html>`
  }

  private async applySimpleFixes(suggestions: any[]) {
    const autoFixable = suggestions.filter(s => s.autoFixable)
    
    console.log(`🔧 Applying ${autoFixable.length} simple fixes...`)
    
    for (const suggestion of autoFixable) {
      await this.applyFix(suggestion)
    }
  }

  private async applyFix(suggestion: any) {
    const { test, strategy } = suggestion
    
    console.log(`Applying fix for: ${test.title}`)
    
    // For demonstration, this is a simple pattern-based fix
    // In a real implementation, you might integrate with LLMs or more sophisticated code analysis
    
    if (strategy.pattern.test('Button.*not found')) {
      await this.addTestIds('button')
    } else if (strategy.pattern.test('Input.*not found')) {
      await this.addTestIds('input')
    }
  }

  private async addTestIds(elementType: string) {
    // Simple implementation - in practice this would be more sophisticated
    console.log(`Adding test IDs to ${elementType} elements...`)
    
    // This is a placeholder - real implementation would:
    // 1. Parse component files
    // 2. Add data-testid attributes where missing
    // 3. Update components automatically
  }

  async runTestsAndAnalyze() {
    console.log('🧪 Running tests and analyzing results...')
    
    try {
      // Run tests and capture results
      const testResults = await this.runTests()
      await this.analyzeFailures(testResults)
      
      // If fixes were applied, re-run tests
      const fixedResults = await this.runTests()
      const improvementCount = testResults.filter(r => r.status === 'failed').length - 
                              fixedResults.filter(r => r.status === 'failed').length
      
      if (improvementCount > 0) {
        console.log(`✅ Auto-fix improved ${improvementCount} test(s)`)
      }
      
    } catch (error) {
      console.error('❌ Error during auto-fix process:', error)
    }
  }

  private async runTests(): Promise<TestResult[]> {
    return new Promise((resolve, reject) => {
      const testProcess = spawn('npm', ['run', 'test:all'], {
        stdio: 'pipe',
        shell: true
      })
      
      let output = ''
      testProcess.stdout.on('data', (data) => {
        output += data.toString()
      })
      
      testProcess.stderr.on('data', (data) => {
        output += data.toString()
      })
      
      testProcess.on('close', (code) => {
        // Parse test results from output
        // This is simplified - real implementation would parse structured output
        const results = this.parseTestOutput(output)
        resolve(results)
      })
    })
  }

  private parseTestOutput(output: string): TestResult[] {
    // Simplified parser - real implementation would handle structured test output
    const lines = output.split('\n')
    const results: TestResult[] = []
    
    lines.forEach(line => {
      if (line.includes('✓') || line.includes('PASS')) {
        results.push({
          status: 'passed',
          title: line,
          file: 'unknown'
        })
      } else if (line.includes('✗') || line.includes('FAIL')) {
        results.push({
          status: 'failed',
          title: line,
          file: 'unknown',
          error: line
        })
      }
    })
    
    return results
  }
}

// CLI interface
if (require.main === module) {
  const orchestrator = new AutoFixOrchestrator()
  
  if (process.argv.includes('--analyze-only')) {
    // Analyze existing test results
    const resultsPath = path.join(process.cwd(), 'test-results', 'results.json')
    if (fs.existsSync(resultsPath)) {
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'))
      orchestrator.analyzeFailures(results)
    } else {
      console.log('No test results found. Run tests first.')
    }
  } else {
    // Run full auto-fix process
    orchestrator.runTestsAndAnalyze()
  }
}

export { AutoFixOrchestrator }