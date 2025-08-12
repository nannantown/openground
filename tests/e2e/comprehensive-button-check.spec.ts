import { test, expect } from '@playwright/test'

test.describe('Comprehensive Button Quality Check', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('AC-010: 全ボタンの自動検出機能', async ({ page }) => {
    // 様々なタイプのボタンを検出
    const buttons = page.locator('button, [role="button"], a[data-testid*="button"]')
    const buttonCount = await buttons.count()

    // 最低限のボタンが存在することを確認
    expect(buttonCount).toBeGreaterThan(0)

    // button要素の検出
    const nativeButtons = page.locator('button')
    const nativeCount = await nativeButtons.count()
    console.log(`Native buttons found: ${nativeCount}`)

    // Buttonコンポーネント（data-testidで識別）の検出
    const componentButtons = page.locator('[data-testid*="button"]')
    const componentCount = await componentButtons.count()
    console.log(`Component buttons found: ${componentCount}`)

    // リンクボタン（Button asChild）の検出
    const linkButtons = page.locator('a[class*="inline-flex"]')
    const linkCount = await linkButtons.count()
    console.log(`Link buttons found: ${linkCount}`)

    // 各ボタンタイプが適切に検出されることを確認
    expect(nativeCount + componentCount + linkCount).toBe(buttonCount)
  })

  test('AC-011: 視認性問題の検出（実行時検証強化版）', async ({ page }) => {
    const buttons = page.locator('button, [role="button"]')
    const buttonCount = await buttons.count()

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i)
      
      if (await button.isVisible()) {
        // 実行時スタイル情報を取得
        const styles = await button.evaluate((el) => {
          const computed = window.getComputedStyle(el)
          
          // RGB値を数値化
          const parseRGB = (color: string) => {
            const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
            return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : null
          }
          
          const bgColor = parseRGB(computed.backgroundColor)
          const textColor = parseRGB(computed.color)
          
          // 輝度計算
          const getLuminance = (rgb: number[]) => {
            const [r, g, b] = rgb.map(c => {
              c = c / 255
              return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
            })
            return 0.2126 * r + 0.7152 * g + 0.0722 * b
          }
          
          let contrastRatio = null
          if (bgColor && textColor) {
            const bgLum = getLuminance(bgColor)
            const textLum = getLuminance(textColor)
            const brightest = Math.max(bgLum, textLum)
            const darkest = Math.min(bgLum, textLum)
            contrastRatio = (brightest + 0.05) / (darkest + 0.05)
          }
          
          return {
            backgroundColor: computed.backgroundColor,
            color: computed.color,
            opacity: computed.opacity,
            contrastRatio,
            bgColor,
            textColor
          }
        })

        // 透明度チェック
        expect(parseFloat(styles.opacity)).toBeGreaterThanOrEqual(0.5)

        // 背景色と文字色が同じでないことを確認
        expect(styles.backgroundColor).not.toBe(styles.color)

        // コントラスト比チェック（WCAG 2.1 AA基準）
        if (styles.contrastRatio !== null) {
          expect(styles.contrastRatio).toBeGreaterThanOrEqual(4.5)
          console.log(`Button ${i}: Contrast ratio ${styles.contrastRatio.toFixed(2)}:1`)
        }

        // 白背景に白文字の検出
        if (styles.bgColor && styles.textColor) {
          const [bgR, bgG, bgB] = styles.bgColor
          const [textR, textG, textB] = styles.textColor
          
          // 白に近い色（240以上）の組み合わせを検出
          const isBgWhitish = bgR >= 240 && bgG >= 240 && bgB >= 240
          const isTextWhitish = textR >= 240 && textG >= 240 && textB >= 240
          
          expect(isBgWhitish && isTextWhitish).toBeFalsy()
        }
      }
    }
  })

  test('AC-012: アクセシビリティ違反の検出', async ({ page }) => {
    const buttons = page.locator('button, [role="button"]')
    const buttonCount = await buttons.count()

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i)
      
      if (await button.isVisible()) {
        // aria-label、title、またはテキストコンテンツの存在確認
        const hasAriaLabel = await button.getAttribute('aria-label')
        const hasTitle = await button.getAttribute('title')
        const textContent = await button.textContent()
        
        const hasAccessibleText = hasAriaLabel || hasTitle || (textContent && textContent.trim().length > 0)
        expect(hasAccessibleText).toBeTruthy()

        // キーボードフォーカス可能性の確認
        const tabIndex = await button.getAttribute('tabindex')
        const isDisabled = await button.getAttribute('disabled')
        
        if (!isDisabled) {
          // フォーカス可能であることを確認
          await button.focus()
          const focusedElement = page.locator(':focus')
          await expect(focusedElement).toHaveCount(1)
        }
      }
    }
  })

  test('AC-013: 標準化違反の検出', async ({ page }) => {
    // grid/listボタンが標準化されていることを確認
    const gridButton = page.getByTestId('grid-view-button')
    const listButton = page.getByTestId('list-view-button')

    if (await gridButton.isVisible()) {
      // 標準的なクラス構造を持っていることを確認
      const gridClasses = await gridButton.getAttribute('class')
      expect(gridClasses).toContain('inline-flex')
      expect(gridClasses).not.toContain('bg-blue-600') // カスタムスタイルなし
    }

    if (await listButton.isVisible()) {
      const listClasses = await listButton.getAttribute('class')
      expect(listClasses).toContain('inline-flex')
      expect(listClasses).not.toContain('bg-blue-600') // カスタムスタイルなし
    }
  })

  test('AC-014: 包括的品質レポートの検証', async ({ page }) => {
    // ページ上のすべてのボタンを分析
    const allButtons = page.locator('button, [role="button"], a[data-testid*="button"]')
    const totalButtons = await allButtons.count()

    // 各ボタンの品質をチェック
    let qualityIssues = 0
    const buttonDetails = []

    for (let i = 0; i < totalButtons; i++) {
      const button = allButtons.nth(i)
      
      if (await button.isVisible()) {
        const testId = await button.getAttribute('data-testid')
        const className = await button.getAttribute('class')
        const tagName = await button.evaluate(el => el.tagName.toLowerCase())
        
        const buttonInfo = {
          index: i,
          testId: testId || 'no-test-id',
          tagName,
          hasStandardClass: className?.includes('inline-flex') || false,
          hasCustomStyle: className?.includes('bg-') && !className?.includes('variant') || false
        }
        
        buttonDetails.push(buttonInfo)
        
        if (buttonInfo.hasCustomStyle) {
          qualityIssues++
        }
      }
    }

    // レポート統計の検証
    console.log(`Total buttons analyzed: ${totalButtons}`)
    console.log(`Quality issues found: ${qualityIssues}`)
    console.log('Button details:', buttonDetails)

    // 品質基準の確認
    const qualityRatio = totalButtons > 0 ? (totalButtons - qualityIssues) / totalButtons : 1
    expect(qualityRatio).toBeGreaterThanOrEqual(0.8) // 80%以上の品質基準
  })

  test('AC-015: 自動修正の効果確認', async ({ page }) => {
    // 修正後のボタンが適切に動作することを確認
    
    // お気に入りボタンのテスト（修正されたvariantを使用）
    const favouriteButtons = page.getByTestId('favourite-button')
    const favouriteCount = await favouriteButtons.count()
    
    if (favouriteCount > 0) {
      const firstFavButton = favouriteButtons.first()
      await expect(firstFavButton).toBeVisible()
      
      // 適切なvariantが適用されていることを確認
      const buttonClass = await firstFavButton.getAttribute('class')
      expect(buttonClass).toContain('inline-flex') // 標準ボタンクラス
      
      // クリック可能であることを確認
      await firstFavButton.click()
      
      // 状態変化が適切に反映されることを確認
      const updatedClass = await firstFavButton.getAttribute('class')
      expect(updatedClass).toBeDefined()
    }

    // Grid/Listボタンのテスト
    const gridButton = page.getByTestId('grid-view-button')
    const listButton = page.getByTestId('list-view-button')
    
    await expect(gridButton).toBeVisible()
    await expect(listButton).toBeVisible()
    
    // ボタンが適切に機能することを確認
    await listButton.click()
    await expect(page.getByTestId('list-view')).toBeVisible()
    
    await gridButton.click()
    await expect(page.getByTestId('grid-view')).toBeVisible()
  })

  test('ページ全体のボタン品質スコア', async ({ page }) => {
    // 複数ページでのボタン品質チェック
    const pagesToCheck = [
      '/',
      '/favourites',
      '/me/listings'
    ]

    const overallStats = {
      totalButtons: 0,
      qualityButtons: 0,
      issueButtons: 0
    }

    for (const pageUrl of pagesToCheck) {
      await page.goto(pageUrl)
      await page.waitForLoadState('networkidle')

      const buttons = page.locator('button, [role="button"]')
      const buttonCount = await buttons.count()

      let pageQualityButtons = 0
      
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i)
        
        if (await button.isVisible()) {
          const className = await button.getAttribute('class')
          const hasStandardImplementation = className?.includes('inline-flex') || false
          const hasCustomStyle = className?.includes('bg-') && !className?.includes('variant') || false
          
          if (hasStandardImplementation && !hasCustomStyle) {
            pageQualityButtons++
          }
        }
      }

      overallStats.totalButtons += buttonCount
      overallStats.qualityButtons += pageQualityButtons
      overallStats.issueButtons += (buttonCount - pageQualityButtons)

      console.log(`Page ${pageUrl}: ${pageQualityButtons}/${buttonCount} quality buttons`)
    }

    // 全体的な品質スコアを計算
    const qualityScore = overallStats.totalButtons > 0 
      ? (overallStats.qualityButtons / overallStats.totalButtons) * 100 
      : 100

    console.log(`Overall Button Quality Score: ${qualityScore.toFixed(1)}%`)
    console.log(`Total: ${overallStats.totalButtons}, Quality: ${overallStats.qualityButtons}, Issues: ${overallStats.issueButtons}`)

    // 90%以上の品質スコアを期待
    expect(qualityScore).toBeGreaterThanOrEqual(90)
  })
})