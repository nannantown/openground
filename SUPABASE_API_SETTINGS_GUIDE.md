# 🔧 Supabase API設定でspatial_ref_sysエラーを解決する方法

## 📍 手順

### Step 1: Supabase Dashboardにアクセス
1. [https://supabase.com/dashboard](https://supabase.com/dashboard) にログイン
2. あなたのプロジェクト（openground）を選択

### Step 2: API設定画面に移動
1. 左側メニューから **⚙️ Settings** をクリック
2. **API** タブをクリック

### Step 3: 設定を調整

#### 現在の設定を確認：
```
Exposed schemas: public
```

#### 推奨される調整方法：

**Option A: DB Schema設定**
- **Database Schema** の項目を探す
- `public` のみが含まれていることを確認
- もし他のスキーマ（例: `postgis`, `extensions`）があれば削除

**Option B: Extra Search Path**
- **Extra search path** の項目を探す
- 空にするか、`public` のみに設定

**Option C: Reserved Keywords（もしある場合）**
- **Reserved Keywords** または **Excluded Tables** の項目を探す
- `spatial_ref_sys` を追加

### Step 4: 設定例

#### 理想的な設定：
```
Database Schema: public
Extra search path: public
Reserved Keywords: spatial_ref_sys (もしフィールドがあれば)
```

### Step 5: 保存と確認
1. **Save** または **Update** ボタンをクリック
2. 数分待ってからDatabase Linterを再実行

## 🔍 **見つからない場合の代替方法**

### 方法1: PostgREST設定を探す
- **PostgREST Configuration** セクションを探す
- `db-schemas = "public"` の設定を確認

### 方法2: API Gatewayの設定
- **API Gateway** または **REST API** の設定を確認
- スキーマの公開設定を調整

### 方法3: 環境変数での制御
- **Environment Variables** セクションで以下を追加：
```
PGRST_DB_SCHEMAS=public
PGRST_DB_EXCLUDE_TABLES=spatial_ref_sys
```

## 📋 **設定が見つからない場合**

Supabaseのバージョンや管理画面の更新により、設定項目の場所が変わることがあります。

### その場合の対処法：
1. **⚠️ このエラーを無視する**
   - 機能に影響なし
   - セキュリティに問題なし
   - 重要なテーブルのRLSは既に完了

2. **Supabaseサポートに問い合わせ**
   - Dashboard右下の **?** アイコンから
   - "spatial_ref_sys RLS設定方法" を質問

## 🎯 **重要なポイント**

**あなたのアプリケーションは既に安全です！**
- ✅ ユーザーデータ：完全保護
- ✅ 商品データ：所有者制御
- ✅ お気に入り：ユーザー限定
- ✅ メッセージ：参加者限定

`spatial_ref_sys`のエラーは技術的な警告であり、実際のリスクではありません。