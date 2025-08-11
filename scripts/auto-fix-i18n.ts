#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface FixRule {
  pattern: RegExp;
  replacement: string;
  translationKey?: string;
  section?: string;
}

// よくあるハードコード日本語のパターンと修正ルール
const FIX_RULES: FixRule[] = [
  // エラーメッセージとアラート
  {
    pattern: /alert\(['"`]([^'"`]*[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF][^'"`]*?)['"`]\)/g,
    replacement: "alert(t('error'))",
    section: 'common'
  },
  {
    pattern: /throw new Error\(['"`]([^'"`]*[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF][^'"`]*?)['"`]\)/g,
    replacement: "throw new Error(t('error'))",
    section: 'common'
  },
  
  // よくあるUI文字列
  {
    pattern: /(['"`])ログイン(['"`])/g,
    replacement: "{t('login')}",
    translationKey: 'login',
    section: 'auth'
  },
  {
    pattern: /(['"`])サインイン(['"`])/g,
    replacement: "{t('signIn')}",
    translationKey: 'signIn',
    section: 'auth'
  },
  {
    pattern: /(['"`])サインアウト(['"`])/g,
    replacement: "{t('signOut')}",
    translationKey: 'signOut',
    section: 'auth'
  },
  {
    pattern: /(['"`])ホーム(['"`])/g,
    replacement: "{t('home')}",
    translationKey: 'home',
    section: 'nav'
  },
  {
    pattern: /(['"`])お気に入り(['"`])/g,
    replacement: "{t('favourites')}",
    translationKey: 'favourites',
    section: 'nav'
  },
  {
    pattern: /(['"`])読み込み中\.\.\.(['"`])/g,
    replacement: "{t('loading')}",
    translationKey: 'loading',
    section: 'common'
  },
  {
    pattern: /(['"`])エラーが発生しました(['"`])/g,
    replacement: "{t('error')}",
    translationKey: 'error',
    section: 'common'
  },
  {
    pattern: /(['"`])価格相談(['"`])/g,
    replacement: "{t('contactPrice')}",
    translationKey: 'contactPrice',
    section: 'listings'
  },
  
  // フォームラベル
  {
    pattern: /(['"`])商品名(['"`])/g,
    replacement: "{t('titleLabel')}",
    translationKey: 'titleLabel',
    section: 'newListing'
  },
  {
    pattern: /(['"`])カテゴリ(['"`])/g,
    replacement: "{t('category')}",
    translationKey: 'category',
    section: 'search'
  },
  {
    pattern: /(['"`])何をお探しですか？(['"`])/g,
    replacement: "{t('searchLabel')}",
    translationKey: 'searchLabel',
    section: 'search'
  },
];

class I18nAutoFixer {
  private fixesApplied = 0;
  private filesProcessed = 0;

  public fixFile(filePath: string): boolean {
    try {
      const content = readFileSync(filePath, 'utf8');
      let newContent = content;
      let hasChanges = false;
      
      // useTranslationsが既に追加されているかチェック
      const hasUseTranslations = content.includes('useTranslations');
      
      for (const rule of FIX_RULES) {
        const matches = newContent.match(rule.pattern);
        if (matches) {
          // useTranslationsフックが必要な場合は追加
          if (!hasUseTranslations && rule.section) {
            newContent = this.addUseTranslations(newContent, rule.section);
          }
          
          newContent = newContent.replace(rule.pattern, rule.replacement);
          hasChanges = true;
          this.fixesApplied += matches.length;
        }
      }
      
      if (hasChanges) {
        writeFileSync(filePath, newContent, 'utf8');
        this.filesProcessed++;
        console.log(`✅ Fixed: ${filePath}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error);
      return false;
    }
  }

  private addUseTranslations(content: string, section: string): string {
    // 既にuseTranslationsがある場合はスキップ
    if (content.includes('useTranslations')) {
      return content;
    }

    // React importの後にuseTranslationsを追加
    const useTranslationsImport = "import { useTranslations } from 'next-intl';\n";
    
    // import文の直後に追加
    if (content.includes("from 'react'")) {
      content = content.replace(
        /import.*from 'react'.*\n/,
        `$&${useTranslationsImport}`
      );
    } else {
      // 最初のimportの後に追加
      content = content.replace(
        /^import.*\n/m,
        `$&${useTranslationsImport}`
      );
    }

    // 関数コンポーネント内にuseTranslationsフックを追加
    const hookLine = `  const t = useTranslations('${section}');\n`;
    
    // function宣言の直後に追加
    content = content.replace(
      /(export\s+(?:default\s+)?function\s+\w+\s*\([^)]*\)\s*\{)\s*/,
      `$1\n${hookLine}`
    );
    
    // またはアロー関数の場合
    content = content.replace(
      /(const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{)\s*/,
      `$1\n${hookLine}`
    );

    return content;
  }

  public getStats() {
    return {
      fixesApplied: this.fixesApplied,
      filesProcessed: this.filesProcessed
    };
  }
}

// 使用例
if (require.main === module) {
  const fixer = new I18nAutoFixer();
  
  // テスト用: SearchFormを修正
  const testFile = join(process.cwd(), 'src/components/SearchForm.tsx');
  console.log('🔧 Auto-fixing i18n issues...\n');
  
  fixer.fixFile(testFile);
  
  const stats = fixer.getStats();
  console.log('\n📊 Auto-fix Results:');
  console.log(`   Files processed: ${stats.filesProcessed}`);
  console.log(`   Fixes applied: ${stats.fixesApplied}`);
}

export { I18nAutoFixer };