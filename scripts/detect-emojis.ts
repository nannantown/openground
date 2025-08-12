#!/usr/bin/env tsx

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface EmojiFound {
  file: string;
  line: number;
  column: number;
  context: string;
  emoji: string;
  type: 'ui' | 'comment' | 'translation' | 'console';
}

class EmojiDetector {
  private emojis: EmojiFound[] = [];
  
  // 絵文字の検出パターン（より包括的）
  private readonly EMOJI_PATTERN = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]/gu;
  
  // 除外すべきファイルパターン
  private readonly EXCLUDE_PATTERNS = [
    /node_modules/,
    /\.next/,
    /\.git/,
    /\.vercel/,
    /dist/,
    /build/,
    /coverage/,
    /playwright-report/,
    /test-results/,
    /\.d\.ts$/,
  ];

  // チェック対象ファイル拡張子
  private readonly TARGET_EXTENSIONS = ['.tsx', '.ts', '.js', '.jsx', '.json', '.md'];

  constructor(private rootPath: string) {}

  public checkDirectory(dirPath: string): void {
    const files = readdirSync(dirPath);
    
    for (const file of files) {
      const fullPath = join(dirPath, file);
      
      // 除外パターンチェック
      if (this.EXCLUDE_PATTERNS.some(pattern => pattern.test(fullPath))) {
        continue;
      }

      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        this.checkDirectory(fullPath);
      } else if (this.TARGET_EXTENSIONS.some(ext => file.endsWith(ext))) {
        this.checkFile(fullPath);
      }
    }
  }

  private checkFile(filePath: string): void {
    try {
      const content = readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        let match;
        this.EMOJI_PATTERN.lastIndex = 0; // Reset regex
        
        while ((match = this.EMOJI_PATTERN.exec(line)) !== null) {
          const emoji = match[0];
          const context = line.trim();
          
          // 絵文字の種類を判定
          let type: EmojiFound['type'] = 'ui';
          if (line.includes('//') || line.includes('/*') || line.includes('*')) {
            type = 'comment';
          } else if (filePath.includes('messages/')) {
            type = 'translation';
          } else if (context.includes('console.')) {
            type = 'console';
          }
          
          this.emojis.push({
            file: filePath.replace(this.rootPath, ''),
            line: index + 1,
            column: match.index + 1,
            context: context,
            emoji: emoji,
            type: type
          });
        }
      });
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
    }
  }

  public generateReport(): void {
    console.log('\n🔍 絵文字検出結果\n');
    console.log('='.repeat(80));
    
    if (this.emojis.length === 0) {
      console.log('✅ 絵文字は見つかりませんでした！');
      return;
    }

    const grouped = this.groupEmojisByType();
    
    Object.entries(grouped).forEach(([type, emojis]) => {
      console.log(`\n📋 ${this.getTypeLabel(type as keyof typeof grouped)} (${emojis.length}件)\n`);
      
      emojis.forEach(emoji => {
        console.log(`📁 ${emoji.file}:${emoji.line}:${emoji.column}`);
        console.log(`   絵文字: "${emoji.emoji}"`);
        console.log(`   コンテキスト: ${emoji.context}`);
        console.log('');
      });
    });

    console.log('='.repeat(80));
    console.log(`\n📊 総計: ${this.emojis.length}個の絵文字が見つかりました`);
    
    // 種類別サマリー
    const summary = this.getSummary();
    console.log('\n📈 種類別サマリー:');
    Object.entries(summary).forEach(([type, count]) => {
      console.log(`   ${this.getTypeLabel(type)}: ${count}個`);
    });

    // 推奨対応
    console.log('\n💡 推奨対応:');
    console.log('   UI要素: テキストまたはLucideアイコンに置換');
    console.log('   翻訳ファイル: 適切なテキスト表現に変更');
    console.log('   コメント: プレーンテキストに変更');
    console.log('   コンソール: ログレベル表示に変更');
  }

  private groupEmojisByType() {
    return this.emojis.reduce((acc, emoji) => {
      if (!acc[emoji.type]) acc[emoji.type] = [];
      acc[emoji.type].push(emoji);
      return acc;
    }, {} as Record<string, EmojiFound[]>);
  }

  private getSummary() {
    return this.emojis.reduce((acc, emoji) => {
      acc[emoji.type] = (acc[emoji.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private getTypeLabel(type: string): string {
    const labels = {
      'ui': 'UI要素',
      'comment': 'コメント',
      'translation': '翻訳ファイル',
      'console': 'コンソール出力'
    };
    return labels[type as keyof typeof labels] || type;
  }

  public getEmojis(): EmojiFound[] {
    return this.emojis;
  }

  public getEmojisByType(type: EmojiFound['type']): EmojiFound[] {
    return this.emojis.filter(emoji => emoji.type === type);
  }
}

// スクリプト実行
const detector = new EmojiDetector(process.cwd());
detector.checkDirectory(process.cwd());
detector.generateReport();

// CI用の終了コード
if (detector.getEmojis().length > 0) {
  process.exit(1);
}

export { EmojiDetector };