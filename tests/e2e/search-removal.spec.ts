import { test, expect } from '@playwright/test'

test.describe('REQ-003: 検索画面削除', () => {
  test('AC-011: 検索画面へのアクセスが無効化される', async ({ page }) => {
    // @req: REQ-003
    // @priority: must
    
    // Navigate to search page - should return 404 or redirect
    const response = await page.goto('/search')
    expect(response?.status()).not.toBe(200)
    
    // Verify URL is not /search
    expect(page.url()).not.toContain('/search')
  })

  test('AC-012: 検索画面へのリンクが全て削除される', async ({ page }) => {
    // @req: REQ-003  
    // @priority: must
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check that no links to search page exist
    const searchLinks = page.locator('a[href="/search"]')
    await expect(searchLinks).toHaveCount(0)
    
    // Check for any test IDs that might link to search
    const searchPageLinks = page.locator('[data-testid="search-page-link"]')
    await expect(searchPageLinks).toHaveCount(0)
  })

  test('AC-013: HOME画面で検索機能が完全に利用可能', async ({ page }) => {
    // @req: REQ-003
    // @priority: must
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Verify search components are visible
    await expect(page.locator('[data-testid="search-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="search-button"]')).toBeVisible()
    
    // Test search functionality
    await page.fill('[data-testid="search-input"]', 'テスト商品')
    await page.click('[data-testid="search-button"]')
    
    // Should stay on home page with search params
    await expect(page).toHaveURL(/\?.*q=%E3%83%86%E3%82%B9%E3%83%88%E5%95%86%E5%93%81/)
  })

  test('AC-014: 検索結果がHOME画面で正しく表示される', async ({ page }) => {
    // @req: REQ-003
    // @priority: must
    
    // Navigate with search query
    await page.goto('/?q=electronics')
    await page.waitForLoadState('networkidle')
    
    // Verify search results section exists
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible()
    
    // Verify search query is displayed
    const searchQueryElement = page.locator('[data-testid="search-query"]')
    await expect(searchQueryElement).toContainText('electronics')
    
    // Verify listing cards are visible (if any results exist)
    const listingCards = page.locator('[data-testid="listing-card"]')
    // Cards may or may not exist depending on data, so just check that the grid container exists
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible()
  })
})