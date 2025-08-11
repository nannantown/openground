#!/usr/bin/env tsx

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface I18nIssue {
  file: string;
  line: number;
  column: number;
  text: string;
  type: 'hardcoded-japanese' | 'missing-translation' | 'untranslated-key';
}

class I18nChecker {
  private issues: I18nIssue[] = [];
  private translationKeys: Set<string> = new Set();
  
  // 日本語文字の検出パターン
  private readonly JAPANESE_PATTERN = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF]/;
  
  // 除外すべきファイルパターン
  private readonly EXCLUDE_PATTERNS = [
    /node_modules/,
    /\.next/,
    /\.git/,
    /\.vercel/,
    /dist/,
    /build/,
    /coverage/,
    /messages\/ja\.json$/,  // 日本語翻訳ファイルは除外
    /test.*\.ts$/,
    /\.test\./,
    /\.spec\./,
    /\.d\.ts$/,
    /playwright-report/,
    /test-results/,
  ];

  // チェック対象ファイル拡張子
  private readonly TARGET_EXTENSIONS = ['.tsx', '.ts', '.js', '.jsx'];

  constructor(private rootPath: string) {
    this.loadTranslationKeys();
  }

  private loadTranslationKeys(): void {
    try {
      const enMessages = JSON.parse(readFileSync(join(this.rootPath, 'messages/en.json'), 'utf8'));
      this.extractKeys('', enMessages);
    } catch (error) {
      console.error('Error loading translation keys:', error);
    }
  }

  private extractKeys(prefix: string, obj: any): void {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null) {
        this.extractKeys(fullKey, value);
      } else {
        this.translationKeys.add(fullKey);
      }
    }
  }

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
        // コメント行をスキップ
        if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')) {
          return;
        }
        
        // 日本語文字の検出
        const japaneseMatch = line.match(this.JAPANESE_PATTERN);
        if (japaneseMatch) {
          // 翻訳キーの値部分（JSON）は除外
          if (!filePath.includes('messages/') && !line.includes('useTranslations')) {
            this.issues.push({
              file: filePath.replace(this.rootPath, ''),
              line: index + 1,
              column: japaneseMatch.index! + 1,
              text: line.trim(),
              type: 'hardcoded-japanese'
            });
          }
        }
        
        // useTranslationsが使われているが翻訳キーが存在しない場合
        const translationMatch = line.match(/t\(['"`]([^'"`]+)['"`]\)/);
        if (translationMatch) {
          const key = translationMatch[1];
          if (!this.translationKeys.has(key)) {
            this.issues.push({
              file: filePath.replace(this.rootPath, ''),
              line: index + 1,
              column: translationMatch.index! + 1,
              text: line.trim(),
              type: 'missing-translation'
            });
          }
        }

        // ハードコードされた英語文字列（潜在的な翻訳漏れ）
        const hardcodedStrings = line.match(/(?:title|placeholder|alt|aria-label)=['"`]([^'"`]*[a-zA-Z]{3,}[^'"`]*)['"`]/g);
        if (hardcodedStrings && !line.includes('useTranslations') && !line.includes('t(')) {
          hardcodedStrings.forEach(match => {
            // 明らかに翻訳すべき文字列をチェック
            if (match.includes('Search') || match.includes('Sign') || match.includes('Home') || 
                match.includes('Loading') || match.includes('Error')) {
              this.issues.push({
                file: filePath.replace(this.rootPath, ''),
                line: index + 1,
                column: line.indexOf(match) + 1,
                text: line.trim(),
                type: 'untranslated-key'
              });
            }
          });
        }
      });
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
    }
  }

  public generateReport(): void {
    console.log('\n🌐 国際化チェック結果\n');
    console.log('='.repeat(80));
    
    if (this.issues.length === 0) {
      console.log('✅ 問題は見つかりませんでした！');
      return;
    }

    const grouped = this.groupIssuesByType();
    
    Object.entries(grouped).forEach(([type, issues]) => {
      console.log(`\n❌ ${this.getTypeLabel(type as keyof typeof grouped)} (${issues.length}件)\n`);
      
      issues.forEach(issue => {
        console.log(`📁 ${issue.file}:${issue.line}:${issue.column}`);
        console.log(`   ${issue.text}`);
        console.log('');
      });
    });

    console.log('='.repeat(80));
    console.log(`\n📊 総計: ${this.issues.length}件の問題が見つかりました`);
    
    // 重要度別サマリー
    const summary = this.getSummary();
    console.log('\n📈 問題別サマリー:');
    Object.entries(summary).forEach(([type, count]) => {
      console.log(`   ${this.getTypeLabel(type)}: ${count}件`);
    });
  }

  private groupIssuesByType() {
    return this.issues.reduce((acc, issue) => {
      if (!acc[issue.type]) acc[issue.type] = [];
      acc[issue.type].push(issue);
      return acc;
    }, {} as Record<string, I18nIssue[]>);
  }

  private getSummary() {
    return this.issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private getTypeLabel(type: string): string {
    const labels = {
      'hardcoded-japanese': 'ハードコードされた日本語',
      'missing-translation': '存在しない翻訳キー',
      'untranslated-key': '未翻訳の可能性がある文字列'
    };
    return labels[type as keyof typeof labels] || type;
  }

  public hasIssues(): boolean {
    return this.issues.length > 0;
  }

  public getCriticalIssues(): I18nIssue[] {
    return this.issues.filter(issue => 
      issue.type === 'hardcoded-japanese' || issue.type === 'missing-translation'
    );
  }
}

// スクリプト実行
const checker = new I18nChecker(process.cwd());
// srcディレクトリのみをチェック
const srcPath = join(process.cwd(), 'src');
checker.checkDirectory(srcPath);
checker.generateReport();

// CI用の終了コード
if (checker.getCriticalIssues().length > 0) {
  process.exit(1);
}