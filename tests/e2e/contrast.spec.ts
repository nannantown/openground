import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Button Contrast Tests', () => {
  test('login page button contrast', async ({ page }) => {
    await page.goto('/login')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Check that login button exists and has proper styling
    const loginButton = page.locator('[data-testid="login-button"]')
    await expect(loginButton).toBeVisible()
    
    // Check computed styles for contrast
    const styles = await loginButton.evaluate((el: HTMLElement) => {
      const computed = window.getComputedStyle(el)
      return {
        color: computed.color,
        backgroundColor: computed.backgroundColor
      }
    })
    
    console.log('Login button styles:', styles)
    
    // Run axe accessibility test focused on color-contrast
    const axeBuilder = new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .include('[data-testid="login-button"]')
    
    const results = await axeBuilder.analyze()
    
    expect(results.violations).toHaveLength(0)
  })

  test('new listing page button contrast', async ({ page }) => {
    await page.goto('/new-listing')
    
    await page.waitForLoadState('networkidle')
    
    // Check submit button
    const submitButton = page.locator('[data-testid="submit-button"]')
    await expect(submitButton).toBeVisible()
    
    // Run axe accessibility test
    const axeBuilder = new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .include('[data-testid="submit-button"]')
    
    const results = await axeBuilder.analyze()
    
    expect(results.violations).toHaveLength(0)
  })

  test('search form button contrast', async ({ page }) => {
    await page.goto('/')
    
    await page.waitForLoadState('networkidle')
    
    // Check search button
    const searchButton = page.locator('[data-testid="search-button"]')
    await expect(searchButton).toBeVisible()
    
    // Run axe accessibility test
    const axeBuilder = new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .include('[data-testid="search-button"]')
    
    const results = await axeBuilder.analyze()
    
    expect(results.violations).toHaveLength(0)
  })
})