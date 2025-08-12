#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from 'fs';
import { EmojiDetector } from './detect-emojis';

interface RemovalRule {
  pattern: RegExp;
  replacement: string;
  description: string;
}

class EmojiRemover {
  private removalRules: RemovalRule[] = [
    // UI要素の絵文字を除去（主要なもの）
    { 
      pattern: /['"`]⏳['"`]/g, 
      replacement: '""', 
      description: 'Loading emoji removed' 
    },
    { 
      pattern: /['"`]✅['"`]/g, 
      replacement: '""', 
      description: 'Success emoji removed' 
    },
    { 
      pattern: /['"`]❌['"`]/g, 
      replacement: '""', 
      description: 'Error emoji removed' 
    },
    { 
      pattern: /['"`]❤️?['"`]/g, 
      replacement: '""', 
      description: 'Heart emoji removed' 
    },
    
    // コンソール出力の絵文字を除去
    { 
      pattern: /console\.log\(['"`][^'"`]*?[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}-\u{2454}\u{20D0}-\u{20FF}][^'"`]*?['"`]\)/gu,
      replacement: 'console.log("")',
      description: 'Console emoji removed'
    },
    
    // Markdown内の絵文字（ドキュメント用）
    { 
      pattern: /^#+\s*[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}-\u{2454}\u{20D0}-\u{20FF}]/gmu,
      replacement: '##',
      description: 'Markdown header emoji removed'
    }
  ];

  public cleanFile(filePath: string): { success: boolean; changesCount: number } {
    try {
      const originalContent = readFileSync(filePath, 'utf8');
      let cleanedContent = originalContent;
      let totalChanges = 0;

      for (const rule of this.removalRules) {
        const matches = cleanedContent.match(rule.pattern);
        if (matches) {
          cleanedContent = cleanedContent.replace(rule.pattern, rule.replacement);
          totalChanges += matches.length;
          console.log(`   ${rule.description}: ${matches.length} replacements`);
        }
      }

      if (totalChanges > 0) {
        writeFileSync(filePath, cleanedContent, 'utf8');
        console.log(`✅ Cleaned: ${filePath} (${totalChanges} changes)`);
        return { success: true, changesCount: totalChanges };
      }

      return { success: false, changesCount: 0 };
    } catch (error) {
      console.error(`❌ Error cleaning ${filePath}:`, error);
      return { success: false, changesCount: 0 };
    }
  }

  public cleanAllEmojis(): void {
    console.log('🧹 Starting emoji removal process...\n');
    
    // 絵文字を検出
    const detector = new EmojiDetector(process.cwd());
    detector.checkDirectory(process.cwd());
    const emojis = detector.getEmojis();
    
    if (emojis.length === 0) {
      console.log('✅ No emojis found to remove!');
      return;
    }

    console.log(`Found ${emojis.length} emojis to process...\n`);

    // UI要素の絵文字のみを処理（重要度が高い）
    const uiEmojis = detector.getEmojisByType('ui');
    const uniqueFiles = [...new Set(uiEmojis.map(e => e.file))];

    let totalFiles = 0;
    let totalChanges = 0;

    for (const file of uniqueFiles) {
      const fullPath = process.cwd() + file;
      console.log(`\n📝 Processing: ${file}`);
      
      const result = this.cleanFile(fullPath);
      if (result.success) {
        totalFiles++;
        totalChanges += result.changesCount;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   Files processed: ${totalFiles}`);
    console.log(`   Total changes: ${totalChanges}`);
    console.log('   Recommendation: Run tests after cleanup');
  }
}

// スクリプト実行
if (require.main === module) {
  const remover = new EmojiRemover();
  remover.cleanAllEmojis();
}

export { EmojiRemover };