# Database Security Fix Guide

このドキュメントでは、Supabaseデータベースで検出されたRow Level Security (RLS) エラーの修正方法について説明します。

## 🚨 検出された問題

### 1. RLS Disabled in Public Tables
- `public.spatial_ref_sys`: PostGISシステムテーブル
- `public.users`: ユーザーテーブル（重要）

### 2. セキュリティリスク
- 認証されていないユーザーがデータにアクセス可能
- プライベートなユーザー情報の漏洩リスク
- データ改ざんの可能性

## 🛠️ 修正方法

### Step 1: マイグレーションファイルの適用

1. **Supabase CLIを使用する場合:**
```bash
npx supabase db push
```

2. **Supabase Dashboardを使用する場合:**
   - Supabase Dashboard → SQL Editor
   - `supabase/migrations/fix_rls_security.sql` の内容をコピー&ペースト
   - 実行

### Step 2: セキュリティチェックの実行

```bash
npm run check:database-security
```

## 📋 修正される内容

### 1. `spatial_ref_sys` テーブル
- システムテーブルのため、RLSは有効にしない
- 代わりにスキーマ権限で制限
- 認証済みユーザーにSELECT権限のみ付与

### 2. `users` テーブル
- **RLS有効化** ✅
- **ポリシー追加:**
  - ユーザーは自分のプロフィールのみ表示可能
  - ユーザーは自分のプロフィールのみ更新可能
  - 認証済みユーザーのみ新規作成可能
  - 公開プロフィール情報は全員が閲覧可能

### 3. その他のテーブル
- `listings`: 出品者のみ編集可能、全員が閲覧可能
- `favourites`: ユーザー自身のお気に入りのみアクセス可能
- `threads`: 参加者のみアクセス可能
- `messages`: スレッド参加者のみアクセス可能

## 🔐 実装されるRLSポリシー

### Users Table
```sql
-- ユーザーは自分のプロフィールを表示
CREATE POLICY "Users can view their own profile" 
ON public.users FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- ユーザーは自分のプロフィールを更新
CREATE POLICY "Users can update their own profile" 
ON public.users FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- 公開情報は全員が閲覧可能
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.users FOR SELECT 
TO authenticated, anon
USING (true);
```

### Listings Table
```sql
-- アクティブな出品は全員が閲覧可能、所有者は全て閲覧可能
CREATE POLICY "Anyone can view active listings" 
ON public.listings FOR SELECT 
TO authenticated, anon
USING (status = 'active'::listing_status OR auth.uid() = owner_id);

-- 所有者のみ編集可能
CREATE POLICY "Users can update their own listings" 
ON public.listings FOR UPDATE 
TO authenticated 
USING (auth.uid() = owner_id);
```

## ✅ 検証方法

### 1. 自動チェック
```bash
npm run check:database-security
```

### 2. 手動確認
Supabase Dashboard → Database → Tables で各テーブルのRLS状態を確認

### 3. 機能テスト
- ユーザー登録・ログイン
- プロフィール表示・編集
- 商品出品・編集
- お気に入り機能
- メッセージ機能

## 🚀 デプロイ前チェックリスト

- [ ] マイグレーションファイル適用完了
- [ ] `npm run check:database-security` でエラーなし
- [ ] 全機能の動作確認完了
- [ ] ユーザー認証フローの確認完了

## 📞 トラブルシューティング

### マイグレーション実行エラー
```bash
# 現在のマイグレーション状態を確認
npx supabase migration list

# 特定のマイグレーションを手動実行
npx supabase db reset
```

### RLSポリシーエラー
1. Supabase Dashboard → Authentication → Policies
2. 該当テーブルのポリシーを確認
3. 必要に応じて手動でポリシーを修正

## 🔗 参考リンク

- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Database Linter Rules](https://supabase.com/docs/guides/database/database-linter)
- [PostgreSQL RLS Guide](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)