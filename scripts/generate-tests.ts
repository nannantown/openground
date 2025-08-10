#!/usr/bin/env tsx

import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'yaml'

interface RequirementSpec {
  metadata: {
    project: string
    version: string
    updated: string
    framework: string
  }
  [category: string]: any
}

interface Requirement {
  id: string
  title: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  acceptance_criteria: string[]
  test_data?: Record<string, any>
}

class TestGenerator {
  private spec: RequirementSpec
  private outputDir: string

  constructor(specPath: string, outputDir: string) {
    const specContent = fs.readFileSync(specPath, 'utf8')
    this.spec = yaml.parse(specContent)
    this.outputDir = outputDir
  }

  generateAllTests() {
    console.log(`🚀 Generating tests for ${this.spec.metadata.project}`)
    
    // Ensure output directories exist
    fs.mkdirSync(path.join(this.outputDir, 'e2e'), { recursive: true })
    fs.mkdirSync(path.join(this.outputDir, 'unit'), { recursive: true })
    
    // Generate E2E tests for each category
    Object.keys(this.spec).forEach(category => {
      if (category === 'metadata') return
      
      const requirements = this.spec[category] as Requirement[]
      if (Array.isArray(requirements)) {
        this.generateE2ETestsForCategory(category, requirements)
        this.generateUnitTestsForCategory(category, requirements)
      }
    })

    // Generate accessibility-specific tests
    this.generateAccessibilityTests()
    this.generateTestUtils()
    this.generateRequirementReport()
    
    console.log('✅ Test generation completed')
  }

  private generateE2ETestsForCategory(category: string, requirements: Requirement[]) {
    const testContent = this.generateE2ETestFile(category, requirements)
    const fileName = `${category.toLowerCase()}.spec.ts`
    const filePath = path.join(this.outputDir, 'e2e', fileName)
    
    fs.writeFileSync(filePath, testContent)
    console.log(`📝 Generated E2E tests: ${fileName}`)
  }

  private generateUnitTestsForCategory(category: string, requirements: Requirement[]) {
    const testContent = this.generateUnitTestFile(category, requirements)
    const fileName = `${category.toLowerCase()}.test.ts`
    const filePath = path.join(this.outputDir, 'unit', fileName)
    
    fs.writeFileSync(filePath, testContent)
    console.log(`🧪 Generated unit tests: ${fileName}`)
  }

  private generateE2ETestFile(category: string, requirements: Requirement[]): string {
    const isAccessibility = category.toLowerCase().includes('accessibility')
    
    const imports = isAccessibility ? 
      `import { test, expect, checkButtonContrast, checkPageAccessibility } from '../accessibility-setup'

// @category: ${category}
// Generated from requirements specification
// DO NOT MODIFY - Regenerate using npm run generate:tests
` : 
      `import { test, expect } from '@playwright/test'

// @category: ${category}
// Generated from requirements specification
// DO NOT MODIFY - Regenerate using npm run generate:tests
`

    const tests = requirements.map(req => {
      const testCases = req.acceptance_criteria.map((criteria, index) => {
        const testName = `${req.id}: ${criteria}`
        const testData = req.test_data ? JSON.stringify(req.test_data, null, 2) : '{}'
        
        // Generate accessibility-specific test logic
        if (isAccessibility && typeof criteria === 'object' && criteria.description && criteria.description.includes('コントラスト')) {
          return this.generateContrastTest(req.id, criteria, req.priority)
        }
        
        return `  test('${testName}', async ({ page }) => {
    // @req: ${req.id}
    // @priority: ${req.priority}
    // Test data: ${testData.replace(/\n/g, '\\n')}
    
    // TODO: Implement test logic for: ${criteria}
    await page.goto('/')
    
    // Placeholder test - replace with actual implementation
    await expect(page).toHaveTitle(/Open Ground/)
  })`
      }).join('\n\n')

      return `test.describe('${req.title}', () => {
  // @req: ${req.id}
  // ${req.description}

${testCases}
})`
    }).join('\n\n')

    return `${imports}\n${tests}\n`
  }

  private generateContrastTest(reqId: string, criteriaObj: any, priority: string): string {
    const criteria = typeof criteriaObj === 'object' ? criteriaObj.description : criteriaObj
    const pageMap: { [key: string]: { path: string, selectors: string[] } } = {
      'ログインページ': { 
        path: '/login', 
        selectors: ['[data-testid="login-button"]', '[data-testid="oauth-google-button"]', '[data-testid="oauth-apple-button"]']
      },
      '新規出品ページ': { 
        path: '/new-listing', 
        selectors: ['[data-testid="submit-button"]', '[data-testid="cancel-button"]', '[data-testid="image-upload-button"]']
      },
      '商品一覧ページ': { 
        path: '/', 
        selectors: ['[data-testid="search-button"]', '[data-testid="filter-button"]', '[data-testid="favourite-button"]']
      },
      '商品詳細ページ': { 
        path: '/listing/test-id', 
        selectors: ['[data-testid="contact-seller-button"]', '[data-testid="favourite-button"]', '[data-testid="share-button"]']
      },
      'お気に入りページ': { 
        path: '/favourites', 
        selectors: ['[data-testid="remove-favourite-button"]', '[data-testid="view-listing-button"]']
      },
      'マイリストページ': { 
        path: '/me/listings', 
        selectors: ['[data-testid="new-listing-button"]', '[data-testid="edit-listing-button"]', '[data-testid="delete-listing-button"]']
      },
      'メッセージページ': { 
        path: '/messages/test-id', 
        selectors: ['[data-testid="send-message-button"]', '[data-testid="back-button"]']
      }
    }

    const pageInfo = Object.entries(pageMap).find(([key]) => criteria.includes(key))
    if (!pageInfo) return `  // TODO: Implement contrast test for: ${criteria}`

    const [pageName, { path, selectors }] = pageInfo
    
    return `  test('${reqId}: ${criteria}', async ({ page, makeAxeBuilder }) => {
    // @req: ${reqId}
    // @priority: ${priority}
    
    await page.goto('${path}')
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')
    
    // Check contrast for each button
    ${selectors.map(selector => `
    await checkButtonContrast(page, '${selector}', 4.5)`).join('')}
    
    // Run comprehensive accessibility check
    await checkPageAccessibility(page, makeAxeBuilder)
  })`
  }

  private generateUnitTestFile(category: string, requirements: Requirement[]): string {
    const imports = `import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// @category: ${category}
// Generated from requirements specification
// DO NOT MODIFY - Regenerate using npm run generate:tests
`

    const tests = requirements.map(req => {
      const testCases = req.acceptance_criteria.map((criteria, index) => {
        return `    it('should ${criteria.toLowerCase()}', async () => {
      // @req: ${req.id}
      // @priority: ${req.priority}
      
      // TODO: Implement unit test for: ${criteria}
      expect(true).toBe(true) // Placeholder
    })`
      }).join('\n\n')

      return `  describe('${req.title}', () => {
    // @req: ${req.id}
    // ${req.description}

${testCases}
  })`
    }).join('\n\n')

    return `${imports}\ndescribe('${category.charAt(0).toUpperCase() + category.slice(1)} Requirements', () => {\n${tests}\n})\n`
  }

  private generateTestUtils() {
    const utilsContent = `// Test utilities for requirement-driven testing
// Generated automatically - DO NOT MODIFY

export class TestDataBuilder {
  static createUser(overrides: Partial<any> = {}) {
    return {
      id: 'test-user-id',
      email: 'test@example.com',
      display_name: 'Test User',
      avatar_url: null,
      is_verified: false,
      created_at: new Date().toISOString(),
      ...overrides
    }
  }

  static createListing(overrides: Partial<any> = {}) {
    return {
      id: 'test-listing-id',
      title: 'Test Product',
      description: 'Test description',
      price: 10000,
      category: 'Electronics',
      images: ['test-image.jpg'],
      status: 'active',
      created_at: new Date().toISOString(),
      user_id: 'test-user-id',
      ...overrides
    }
  }

  static createMessage(overrides: Partial<any> = {}) {
    return {
      id: 'test-message-id',
      thread_id: 'test-thread-id',
      sender_id: 'test-user-id',
      body: 'Test message',
      image_urls: [],
      created_at: new Date().toISOString(),
      read_by: [],
      ...overrides
    }
  }
}

export class PageHelpers {
  static async loginUser(page: any, email: string = 'test@example.com') {
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', email)
    await page.click('[data-testid="login-button"]')
    // Add OTP verification logic if needed
  }

  static async createListing(page: any, data: any) {
    await page.goto('/new-listing')
    await page.fill('[data-testid="title-input"]', data.title)
    await page.fill('[data-testid="description-input"]', data.description)
    await page.fill('[data-testid="price-input"]', data.price.toString())
    await page.selectOption('[data-testid="category-select"]', data.category)
    await page.click('[data-testid="submit-button"]')
  }

  static async searchListings(page: any, query: string) {
    await page.goto('/')
    await page.fill('[data-testid="search-input"]', query)
    await page.press('[data-testid="search-input"]', 'Enter')
  }
}
`

    fs.writeFileSync(path.join(this.outputDir, 'test-utils.ts'), utilsContent)
    console.log('🛠️  Generated test utilities')
  }

  private generateAccessibilityTests() {
    const accessibilitySpecPath = path.join(path.dirname(__dirname), 'requirements', 'accessibility.yaml')
    
    if (!fs.existsSync(accessibilitySpecPath)) {
      console.log('⚠️  No accessibility requirements found, skipping accessibility test generation')
      return
    }
    
    const accessibilityContent = fs.readFileSync(accessibilitySpecPath, 'utf8')
    const accessibilitySpec = yaml.parse(accessibilityContent)
    
    if (accessibilitySpec.requirements && Array.isArray(accessibilitySpec.requirements)) {
      this.generateE2ETestsForCategory('accessibility', accessibilitySpec.requirements)
      console.log('♿ Generated accessibility tests')
    }
  }

  private generateRequirementReport() {
    const reportContent = this.generateHTMLReport()
    fs.writeFileSync(path.join(this.outputDir, 'requirements-report.html'), reportContent)
    console.log('📊 Generated requirements traceability report')
  }

  private generateHTMLReport(): string {
    const totalReqs = this.getTotalRequirements()
    const criticalReqs = this.getRequirementsByPriority('critical')
    const highReqs = this.getRequirementsByPriority('high')
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Requirements Traceability Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .metric { display: inline-block; margin: 10px 20px 10px 0; }
        .metric-value { font-size: 2em; font-weight: bold; color: #2563eb; }
        .metric-label { color: #666; }
        .category { margin: 20px 0; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
        .category-header { background: #f9f9f9; padding: 15px; font-weight: bold; }
        .requirement { padding: 15px; border-bottom: 1px solid #eee; }
        .req-id { font-weight: bold; color: #2563eb; }
        .priority { padding: 2px 8px; border-radius: 4px; font-size: 0.8em; color: white; }
        .priority-critical { background: #dc2626; }
        .priority-high { background: #ea580c; }
        .priority-medium { background: #ca8a04; }
        .priority-low { background: #65a30d; }
        .criteria { margin: 10px 0; padding-left: 20px; }
        .criteria li { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Requirements Traceability Report</h1>
        <p>Project: ${this.spec.metadata.project} | Version: ${this.spec.metadata.version} | Updated: ${this.spec.metadata.updated}</p>
        
        <div class="metric">
            <div class="metric-value">${totalReqs}</div>
            <div class="metric-label">Total Requirements</div>
        </div>
        <div class="metric">
            <div class="metric-value">${criticalReqs}</div>
            <div class="metric-label">Critical</div>
        </div>
        <div class="metric">
            <div class="metric-value">${highReqs}</div>
            <div class="metric-label">High Priority</div>
        </div>
    </div>

    ${this.generateCategoryReports()}
</body>
</html>`
  }

  private generateCategoryReports(): string {
    return Object.keys(this.spec)
      .filter(category => category !== 'metadata')
      .map(category => {
        const requirements = this.spec[category] as Requirement[]
        if (!Array.isArray(requirements)) return ''

        const reqsHtml = requirements.map(req => `
          <div class="requirement">
            <div>
              <span class="req-id">${req.id}</span>
              <span class="priority priority-${req.priority}">${req.priority.toUpperCase()}</span>
            </div>
            <h3>${req.title}</h3>
            <p>${req.description}</p>
            <div class="criteria">
              <strong>Acceptance Criteria:</strong>
              <ul>
                ${req.acceptance_criteria.map(criteria => `<li>${criteria}</li>`).join('')}
              </ul>
            </div>
          </div>
        `).join('')

        return `
          <div class="category">
            <div class="category-header">${category.charAt(0).toUpperCase() + category.slice(1)} (${requirements.length} requirements)</div>
            ${reqsHtml}
          </div>
        `
      }).join('')
  }

  private getTotalRequirements(): number {
    return Object.keys(this.spec)
      .filter(category => category !== 'metadata')
      .reduce((total, category) => {
        const requirements = this.spec[category]
        return total + (Array.isArray(requirements) ? requirements.length : 0)
      }, 0)
  }

  private getRequirementsByPriority(priority: string): number {
    return Object.keys(this.spec)
      .filter(category => category !== 'metadata')
      .reduce((total, category) => {
        const requirements = this.spec[category] as Requirement[]
        if (!Array.isArray(requirements)) return total
        return total + requirements.filter(req => req.priority === priority).length
      }, 0)
  }
}

// Main execution
if (require.main === module) {
  const specPath = path.join(__dirname, '..', 'requirements', 'spec.yaml')
  const outputDir = path.join(__dirname, '..', 'tests')
  
  const generator = new TestGenerator(specPath, outputDir)
  generator.generateAllTests()
}

export { TestGenerator }