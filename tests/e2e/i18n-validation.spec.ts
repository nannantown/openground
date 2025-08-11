import { test, expect } from '@playwright/test';

const JAPANESE_REGEX = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF]/;

// 英語版でチェックすべき主要ページ
const ENGLISH_PAGES = [
  { path: '/en', name: 'Home' },
  { path: '/en/favourites', name: 'Favourites' },
  { path: '/en/login', name: 'Login' },
  { path: '/en/new-listing', name: 'New Listing' },
];

// チェックすべきUI要素セレクター
const UI_ELEMENTS = [
  'header nav a',           // ナビゲーションリンク
  'button',                 // ボタン
  'input[placeholder]',     // プレースホルダー
  'label',                  // フォームラベル
  'h1, h2, h3, h4, h5, h6', // 見出し
  '[title]',                // ツールチップ
  '[aria-label]',           // アクセシビリティラベル
];

test.describe('国際化検証 - 英語版UI', () => {
  
  test.beforeEach(async ({ page }) => {
    // 英語ロケールを強制設定
    await page.addInitScript(() => {
      // ロケール設定をオーバーライド
      Object.defineProperty(navigator, 'language', {
        writable: true,
        value: 'en-US'
      });
    });
  });

  ENGLISH_PAGES.forEach(({ path, name }) => {
    test(`${name}ページで日本語文字が表示されていない`, async ({ page }) => {
      await page.goto(path);
      
      // ページが完全に読み込まれるまで待機
      await page.waitForLoadState('networkidle');
      
      // すべてのテキストコンテンツを取得
      const textContent = await page.textContent('body');
      
      if (textContent) {
        const japaneseMatches = textContent.match(JAPANESE_REGEX);
        if (japaneseMatches) {
          // 日本語が見つかった場合、詳細を出力
          console.log(`❌ ${name}ページで日本語文字が検出されました:`);
          japaneseMatches.forEach(match => {
            console.log(`   - "${match}"`);
          });
          
          // どの要素に日本語が含まれているかを特定
          const elementsWithJapanese = await page.evaluate(() => {
            const walker = document.createTreeWalker(
              document.body,
              NodeFilter.SHOW_TEXT,
              null
            );
            
            const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF]/;
            const results: Array<{element: string, text: string}> = [];
            
            let node;
            while (node = walker.nextNode()) {
              const text = node.textContent?.trim();
              if (text && japaneseRegex.test(text)) {
                const element = node.parentElement;
                results.push({
                  element: element?.tagName.toLowerCase() + 
                          (element?.className ? `.${element.className}` : '') +
                          (element?.id ? `#${element.id}` : ''),
                  text: text
                });
              }
            }
            
            return results;
          });
          
          console.log('日本語を含む要素:');
          elementsWithJapanese.forEach(item => {
            console.log(`   - ${item.element}: "${item.text}"`);
          });
        }
      }
      
      expect(textContent?.match(JAPANESE_REGEX)).toBeNull();
    });

    test(`${name}ページの主要UI要素が英語で表示される`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      
      for (const selector of UI_ELEMENTS) {
        const elements = await page.locator(selector).all();
        
        for (const element of elements) {
          const isVisible = await element.isVisible();
          if (!isVisible) continue;
          
          // テキストコンテンツをチェック
          const textContent = await element.textContent();
          if (textContent && textContent.trim()) {
            expect(textContent.match(JAPANESE_REGEX), 
              `要素 "${selector}" に日本語が含まれています: "${textContent}"`
            ).toBeNull();
          }
          
          // プレースホルダーをチェック
          const placeholder = await element.getAttribute('placeholder');
          if (placeholder) {
            expect(placeholder.match(JAPANESE_REGEX),
              `プレースホルダーに日本語が含まれています: "${placeholder}"`
            ).toBeNull();
          }
          
          // タイトル属性をチェック
          const title = await element.getAttribute('title');
          if (title) {
            expect(title.match(JAPANESE_REGEX),
              `title属性に日本語が含まれています: "${title}"`
            ).toBeNull();
          }
          
          // aria-label属性をチェック
          const ariaLabel = await element.getAttribute('aria-label');
          if (ariaLabel) {
            expect(ariaLabel.match(JAPANESE_REGEX),
              `aria-label属性に日本語が含まれています: "${ariaLabel}"`
            ).toBeNull();
          }
        }
      }
    });
  });

  test('言語スイッチャーが正しく動作する', async ({ page }) => {
    await page.goto('/en');
    await page.waitForLoadState('networkidle');
    
    // 言語スイッチャーボタンを探す
    const langSwitcher = page.locator('button:has(svg)').filter({ hasText: /English|日本語/ });
    await expect(langSwitcher).toBeVisible();
    
    // 現在の言語表示を確認
    const currentLang = await langSwitcher.textContent();
    expect(currentLang).toContain('日本語'); // 英語ページでは「日本語」ボタンが表示される
    
    // 言語を切り替え
    await langSwitcher.click();
    await page.waitForLoadState('networkidle');
    
    // 日本語ページにリダイレクトされたことを確認
    expect(page.url()).toMatch(/\/ja/);
    
    // 日本語ページでは「English」ボタンが表示される
    const newLangSwitcher = page.locator('button:has(svg)').filter({ hasText: /English|日本語/ });
    const newCurrentLang = await newLangSwitcher.textContent();
    expect(newCurrentLang).toContain('English');
  });

  test('エラーメッセージが英語で表示される', async ({ page }) => {
    // 意図的にエラーを発生させるためのテスト
    await page.goto('/en/favourites');
    
    // ログインしていない状態でアクセス
    await expect(page.locator('text=Sign in required')).toBeVisible();
    await expect(page.locator('text=You need to sign in')).toBeVisible();
    
    // 日本語のエラーメッセージが表示されていないことを確認
    const errorElements = await page.locator('[role="alert"], .error, .warning').all();
    for (const element of errorElements) {
      const text = await element.textContent();
      if (text) {
        expect(text.match(JAPANESE_REGEX),
          `エラーメッセージに日本語が含まれています: "${text}"`
        ).toBeNull();
      }
    }
  });

  test('フォーム検証メッセージが英語で表示される', async ({ page }) => {
    await page.goto('/en/new-listing');
    await page.waitForLoadState('networkidle');
    
    // フォームの送信ボタンを見つけて、バリデーションを発生させる
    const submitButton = page.locator('button[type="submit"], input[type="submit"]');
    if (await submitButton.count() > 0) {
      await submitButton.click();
      
      // バリデーションメッセージが表示されるまで待機
      await page.waitForTimeout(1000);
      
      // バリデーションメッセージをチェック
      const validationMessages = await page.locator('[role="alert"], .error, .invalid').all();
      for (const element of validationMessages) {
        const text = await element.textContent();
        if (text && text.trim()) {
          expect(text.match(JAPANESE_REGEX),
            `バリデーションメッセージに日本語が含まれています: "${text}"`
          ).toBeNull();
        }
      }
    }
  });
});