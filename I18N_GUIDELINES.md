# 🌐 国際化ガイドライン

このドキュメントでは、OpenGroundプロジェクトにおける国際化（i18n）のベストプラクティスと品質管理プロセスについて説明します。

## 📋 目次

1. [概要](#概要)
2. [基本原則](#基本原則)
3. [実装ガイド](#実装ガイド)
4. [品質管理](#品質管理)
5. [トラブルシューティング](#トラブルシューティング)

## 🎯 概要

OpenGroundは日本語と英語の2言語に対応したマルチリンガルアプリケーションです。すべてのUI要素、メッセージ、エラーメッセージは適切に国際化される必要があります。

### サポート言語
- **日本語 (ja)**: デフォルト言語
- **英語 (en)**: セカンダリ言語

## ⚡ 基本原則

### 1. ハードコード禁止
❌ **悪い例:**
```tsx
<button>ログイン</button>
<h1>Welcome to OpenGround</h1>
```

✅ **良い例:**
```tsx
const t = useTranslations('auth');
<button>{t('login')}</button>
<h1>{t('welcome')}</h1>
```

### 2. 翻訳キーの命名規則
- **階層構造**: `section.component.element`
- **説明的**: 内容が推測できる名前
- **一貫性**: 既存のパターンに従う

```json
{
  "auth": {
    "login": "ログイン",
    "logout": "ログアウト",
    "signInRequired": "サインインが必要です"
  },
  "listings": {
    "title": "最新の商品",
    "noListings": "商品がありません",
    "contactPrice": "価格相談"
  }
}
```

### 3. 動的コンテンツの対応
パラメータを含むメッセージには適切なプレースホルダーを使用：

```json
{
  "search": {
    "resultsFound": "{count}件の商品が見つかりました",
    "keyword": "キーワード: \"{query}\""
  }
}
```

```tsx
const t = useTranslations('search');
<p>{t('resultsFound', { count: items.length })}</p>
<p>{t('keyword', { query: searchTerm })}</p>
```

## 🛠 実装ガイド

### Reactコンポーネントでの使用

```tsx
'use client'

import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('mySection');
  const tCommon = useTranslations('common');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
      <button>{tCommon('save')}</button>
    </div>
  );
}
```

### 複数セクションの翻訳を使用する場合

```tsx
export function ListingCard() {
  const t = useTranslations('listings');
  const tCommon = useTranslations('common');
  const tAuth = useTranslations('auth');

  return (
    <Card>
      <h3>{listing.title}</h3>
      <p>{t('contactPrice')}</p>
      <Button onClick={handleSave}>{tCommon('save')}</Button>
      {!user && <p>{tAuth('signInRequired')}</p>}
    </Card>
  );
}
```

### エラーメッセージとアラート

❌ **悪い例:**
```tsx
alert('エラーが発生しました');
throw new Error('Failed to save listing');
```

✅ **良い例:**
```tsx
const t = useTranslations('errors');
alert(t('saveFailed'));
throw new Error(t('listingSaveError'));
```

### フォームとバリデーション

```tsx
export function ContactForm() {
  const t = useTranslations('forms');
  const tValidation = useTranslations('validation');

  return (
    <form>
      <Label htmlFor="email">{t('emailLabel')}</Label>
      <Input 
        id="email"
        placeholder={t('emailPlaceholder')}
        aria-label={t('emailAriaLabel')}
      />
      {error && <p className="error">{tValidation('emailRequired')}</p>}
    </form>
  );
}
```

## 🔍 品質管理

### 自動チェックツール

#### 1. 静的解析チェック
```bash
npm run check:i18n
```
- ハードコードされた日本語を検出
- 存在しない翻訳キーを特定
- 未翻訳の可能性がある文字列を発見

#### 2. E2Eテスト
```bash
npm run test:i18n
```
- 実際のブラウザで言語混在をチェック
- 言語切り替え機能の検証
- エラーメッセージの言語確認

#### 3. 総合検証
```bash
npm run validate:i18n
```
静的解析とE2Eテストの両方を実行

### CI/CDパイプライン

すべてのPull Requestとpushで自動的に国際化チェックが実行されます：

1. **静的解析**: ソースコード内の国際化問題を検出
2. **E2Eテスト**: ブラウザでの実際の表示をチェック
3. **レポート生成**: 詳細な問題レポートを自動生成
4. **PRコメント**: Pull Requestに結果を自動コメント

## 🚨 よくある問題と対処法

### Problem 1: 翻訳キーが見つからない

**エラー:**
```
❌ 存在しない翻訳キー: t('nonExistentKey')
```

**対処法:**
1. `messages/en.json`と`messages/ja.json`に該当キーを追加
2. 適切な階層構造で配置
3. 両言語で一貫した構造を維持

### Problem 2: ハードコードされた日本語

**エラー:**
```
❌ ハードコードされた日本語: "ログインしてください"
```

**対処法:**
```tsx
// Before
<p>ログインしてください</p>

// After
const t = useTranslations('auth');
<p>{t('pleaseLogin')}</p>
```

### Problem 3: 動的テキストの翻訳

**問題:**
```tsx
// カウントや変数を含むテキスト
`${count}件の結果が見つかりました`
```

**対処法:**
```tsx
const t = useTranslations('search');
t('resultsCount', { count });
```

翻訳ファイル:
```json
{
  "search": {
    "resultsCount": "{count}件の結果が見つかりました"
  }
}
```

### Problem 4: 複数形の処理

```tsx
// 英語の複数形対応
const t = useTranslations('items');
t('itemCount', { count, plural: count !== 1 ? 's' : '' });
```

## 📝 開発ワークフロー

### 1. 新機能開発時
1. UI文字列をすべて翻訳ファイルに定義
2. `useTranslations`フックを使用
3. ローカルで`npm run validate:i18n`を実行
4. 問題があれば修正してから commit

### 2. Pull Request前
```bash
# 国際化チェックを実行
npm run validate:i18n

# 問題があれば修正
# 修正後、再度チェック
npm run check:i18n
```

### 3. コードレビュー時
- CI/CDの国際化チェック結果を確認
- 翻訳キーの命名規則をチェック
- 言語切り替えが正しく動作することを確認

## 📚 参考リソース

- [Next.js Internationalization](https://nextjs.org/docs/advanced-features/i18n)
- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [React i18n Best Practices](https://react.i18next.com/guides/quick-start)

## 🆘 サポート

国際化に関する質問や問題がある場合：

1. このガイドラインを確認
2. 自動チェックツールを実行
3. 既存の実装例を参考にする
4. チームメンバーに相談

---

**Remember**: 国際化は品質の重要な要素です。すべてのユーザーに最適な体験を提供するため、これらのガイドラインを遵守してください。🌍