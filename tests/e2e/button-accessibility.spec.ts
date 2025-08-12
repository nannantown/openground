import { test, expect } from '@playwright/test'

test.describe('Button Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('AC-005: ボタンの視認性確保', async ({ page }) => {
    // ページ上のすべてのボタンを取得
    const buttons = page.locator('button, [role="button"]')
    const buttonCount = await buttons.count()

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i)
      
      // ボタンが表示されている場合のみテスト
      if (await button.isVisible()) {
        // ボタンのスタイルを取得
        const styles = await button.evaluate((el) => {
          const computed = window.getComputedStyle(el)
          return {
            backgroundColor: computed.backgroundColor,
            color: computed.color,
            opacity: computed.opacity
          }
        })

        // 透明度が適切であることを確認
        expect(parseFloat(styles.opacity)).toBeGreaterThan(0.5)

        // 背景色と文字色が同じでないことを確認
        expect(styles.backgroundColor).not.toBe(styles.color)
      }
    }
  })

  test('AC-006: 統一ボタンコンポーネントの使用確認', async ({ page }) => {
    // View toggle buttonsの確認
    const gridButton = page.getByTestId('grid-view-button')
    const listButton = page.getByTestId('list-view-button')

    // ボタンが標準的なクラスを使用していることを確認
    await expect(gridButton).toBeVisible()
    await expect(listButton).toBeVisible()

    // 適切なvariantが適用されていることを確認（CSSクラスの存在）
    const gridButtonClasses = await gridButton.getAttribute('class')
    const listButtonClasses = await listButton.getAttribute('class')

    // 標準的なボタンクラスが含まれていることを確認
    expect(gridButtonClasses).toContain('inline-flex')
    expect(listButtonClasses).toContain('inline-flex')
  })

  test('AC-008: アクセシビリティ基準の遵守', async ({ page }) => {
    // キーボードナビゲーションのテスト
    await page.keyboard.press('Tab')
    
    // フォーカスされた要素がボタンまたはリンクであることを確認
    const focusedElement = page.locator(':focus')
    const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase())
    
    expect(['button', 'a', 'input'].some(tag => tagName === tag)).toBeTruthy()

    // ボタンにフォーカスリングが表示されることを確認
    const focusedStyles = await focusedElement.evaluate((el) => {
      return window.getComputedStyle(el).outline
    })
    
    // フォーカスが視覚的に示されていることを確認（outline, box-shadow, etc）
    expect(focusedStyles === 'none' || focusedStyles === '').toBeFalsy()
  })

  test('ホバー状態での視認性確認', async ({ page }) => {
    const gridButton = page.getByTestId('grid-view-button')
    
    // ホバー前の状態を記録
    const initialStyles = await gridButton.evaluate((el) => {
      const computed = window.getComputedStyle(el)
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color
      }
    })

    // ホバー
    await gridButton.hover()

    // ホバー後の状態を確認
    const hoverStyles = await gridButton.evaluate((el) => {
      const computed = window.getComputedStyle(el)
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color
      }
    })

    // ホバー時に何らかの視覚的変化があることを確認
    const hasVisualChange = 
      initialStyles.backgroundColor !== hoverStyles.backgroundColor ||
      initialStyles.color !== hoverStyles.color

    expect(hasVisualChange).toBeTruthy()
  })

  test('Favouriteボタンの視認性確認', async ({ page }) => {
    // リスト表示に切り替えて商品を表示
    const listButton = page.getByTestId('list-view-button')
    await listButton.click()

    // 商品カードが表示されるまで待機
    const listingCards = page.getByTestId('listing-card')
    await expect(listingCards.first()).toBeVisible()

    // お気に入りボタンを取得
    const favouriteButtons = page.getByTestId('favourite-button')
    const favouriteCount = await favouriteButtons.count()

    if (favouriteCount > 0) {
      const firstFavButton = favouriteButtons.first()
      
      // ボタンが表示されていることを確認
      await expect(firstFavButton).toBeVisible()

      // ボタンのスタイルを確認
      const styles = await firstFavButton.evaluate((el) => {
        const computed = window.getComputedStyle(el)
        return {
          backgroundColor: computed.backgroundColor,
          color: computed.color,
          borderColor: computed.borderColor
        }
      })

      // 背景色と文字色が適切に設定されていることを確認
      expect(styles.backgroundColor).not.toBe(styles.color)
    }
  })

  test('Primary buttonの色確認', async ({ page }) => {
    // 投稿ボタンなどのprimary buttonを探す
    const primaryButtons = page.locator('button').filter({ hasText: /投稿|Post|新規/ })
    const primaryCount = await primaryButtons.count()

    if (primaryCount > 0) {
      const firstPrimary = primaryButtons.first()
      
      if (await firstPrimary.isVisible()) {
        const styles = await firstPrimary.evaluate((el) => {
          const computed = window.getComputedStyle(el)
          return {
            backgroundColor: computed.backgroundColor,
            color: computed.color
          }
        })

        // Primary buttonが適切な青色背景と白文字を使用していることを確認
        expect(styles.color).toBe('rgb(255, 255, 255)') // white text
        expect(styles.backgroundColor).toMatch(/rgb\(37, 99, 235\)|rgb\(29, 78, 216\)/) // blue-600 or blue-700
      }
    }
  })
})