import { test as baseTest, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Extend base test with accessibility methods
export const test = baseTest.extend({
  makeAxeBuilder: async ({ page }, use) => {
    const makeAxeBuilder = () =>
      new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .exclude('#commonly-reused-element-with-known-issue')
    await use(makeAxeBuilder)
  },
})

export { expect }

// Helper function for button contrast testing
export async function checkButtonContrast(
  page: any, 
  selector: string, 
  minRatio: number = 4.5
) {
  const element = await page.locator(selector)
  await expect(element).toBeVisible()
  
  // Get computed styles
  const styles = await element.evaluate((el: HTMLElement) => {
    const computed = window.getComputedStyle(el)
    return {
      color: computed.color,
      backgroundColor: computed.backgroundColor,
      borderColor: computed.borderColor
    }
  })
  
  // Run axe on specific element for color-contrast
  const axeBuilder = new AxeBuilder({ page })
    .include(selector)
    .withRules(['color-contrast'])
  
  const results = await axeBuilder.analyze()
  
  expect(results.violations).toHaveLength(0)
  
  return {
    passed: results.violations.length === 0,
    styles,
    violations: results.violations
  }
}

// Helper for comprehensive accessibility check
export async function checkPageAccessibility(page: any, makeAxeBuilder: any) {
  const accessibilityScanResults = await makeAxeBuilder().analyze()
  
  expect(accessibilityScanResults.violations).toEqual([])
  
  return accessibilityScanResults
}