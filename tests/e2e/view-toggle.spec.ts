import { test, expect } from '@playwright/test'

test.describe('Grid/List View Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('AC-001: grid/list切り替えボタンの存在確認', async ({ page }) => {
    // 表示切り替えボタンが存在することを確認
    const viewToggle = page.getByTestId('view-toggle')
    await expect(viewToggle).toBeVisible()

    // gridアイコンボタンが存在することを確認
    const gridButton = page.getByTestId('grid-view-button')
    await expect(gridButton).toBeVisible()
    await expect(gridButton).toContainText('Grid')

    // listアイコンボタンが存在することを確認
    const listButton = page.getByTestId('list-view-button')
    await expect(listButton).toBeVisible()
    await expect(listButton).toContainText('List')
  })

  test('AC-002: gridからlistへの切り替え', async ({ page }) => {
    // 初期状態でgrid表示されていることを確認
    await expect(page.getByTestId('grid-view')).toBeVisible()
    
    // gridボタンがアクティブ状態であることを確認
    const gridButton = page.getByTestId('grid-view-button')
    await expect(gridButton).toHaveClass(/bg-primary|bg-slate-900/)

    // listボタンをクリック
    const listButton = page.getByTestId('list-view-button')
    await listButton.click()

    // list表示に切り替わることを確認
    await expect(page.getByTestId('list-view')).toBeVisible()
    await expect(page.getByTestId('grid-view')).not.toBeVisible()

    // listボタンがアクティブ状態になることを確認
    await expect(listButton).toHaveClass(/bg-primary|bg-slate-900/)
    
    // gridボタンが非アクティブ状態になることを確認
    await expect(gridButton).not.toHaveClass(/bg-primary|bg-slate-900/)
  })

  test('AC-003: listからgridへの切り替え', async ({ page }) => {
    // まずlist表示に切り替え
    const listButton = page.getByTestId('list-view-button')
    await listButton.click()
    await expect(page.getByTestId('list-view')).toBeVisible()

    // gridボタンをクリック
    const gridButton = page.getByTestId('grid-view-button')
    await gridButton.click()

    // grid表示に切り替わることを確認
    await expect(page.getByTestId('grid-view')).toBeVisible()
    await expect(page.getByTestId('list-view')).not.toBeVisible()

    // gridボタンがアクティブ状態になることを確認
    await expect(gridButton).toHaveClass(/bg-primary|bg-slate-900/)
    
    // listボタンが非アクティブ状態になることを確認
    await expect(listButton).not.toHaveClass(/bg-primary|bg-slate-900/)
  })

  test('AC-004: 表示形式の永続化', async ({ page }) => {
    // list表示に切り替え
    const listButton = page.getByTestId('list-view-button')
    await listButton.click()
    await expect(page.getByTestId('list-view')).toBeVisible()

    // ページをリロード
    await page.reload()

    // list表示が維持されていることを確認
    await expect(page.getByTestId('list-view')).toBeVisible()
    await expect(page.getByTestId('grid-view')).not.toBeVisible()

    // listボタンがアクティブ状態を維持していることを確認
    await expect(listButton).toHaveClass(/bg-primary|bg-slate-900/)
  })

  test('グリッド表示でのレイアウト確認', async ({ page }) => {
    // デフォルトでgrid表示であることを確認
    const gridView = page.getByTestId('grid-view')
    await expect(gridView).toBeVisible()

    // 商品カードが存在する場合、グリッドレイアウトであることを確認
    const listingCards = page.getByTestId('listing-card')
    const cardCount = await listingCards.count()
    
    if (cardCount > 0) {
      // グリッドのCSSクラスが適用されていることを確認
      await expect(gridView).toHaveClass(/grid/)
    }
  })

  test('リスト表示でのレイアウト確認', async ({ page }) => {
    // list表示に切り替え
    const listButton = page.getByTestId('list-view-button')
    await listButton.click()

    const listView = page.getByTestId('list-view')
    await expect(listView).toBeVisible()

    // 商品カードが存在する場合、リストレイアウトであることを確認
    const listingCards = page.getByTestId('listing-card')
    const cardCount = await listingCards.count()
    
    if (cardCount > 0) {
      // 最初のカードのレイアウトを確認
      const firstCard = listingCards.first()
      
      // flexレイアウトが適用されていることを確認
      const cardContent = firstCard.locator('div').first()
      await expect(cardContent).toHaveClass(/flex/)
    }
  })
})