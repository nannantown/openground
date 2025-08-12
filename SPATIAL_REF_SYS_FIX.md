# 🗺️ spatial_ref_sys RLS エラーの解決方法

## 問題
`spatial_ref_sys`はPostGISのシステムテーブルで、RLSを有効にすべきではありません。
データベースリンターがこれを「公開テーブル」として誤認識しています。

## ✅ 解決策（3つのオプション）

### オプション1: Supabase設定で除外 ⭐ **推奨**
1. **Supabase Dashboard** → **Settings** → **API**
2. **Exposed schemas** で `public` のみを確認
3. **Reserved keywords** に `spatial_ref_sys` を追加

### オプション2: SQL実行（コメント追加）
```sql
-- PostGISシステムテーブルであることを明示
COMMENT ON TABLE public.spatial_ref_sys IS '@omit create,update,delete
PostGIS spatial reference system definitions - system table';

-- APIから完全に隠す
REVOKE ALL ON TABLE public.spatial_ref_sys FROM anon;
REVOKE ALL ON TABLE public.spatial_ref_sys FROM authenticated;
```

### オプション3: PostgREST設定（環境変数）
Vercelの環境変数に追加：
```
PGRST_DB_EXCLUDE_TABLES=spatial_ref_sys
```

## 🚀 **最も簡単な解決法**

以下のSQLを実行するだけ：

```sql
-- spatial_ref_sysをAPIから完全除外
COMMENT ON TABLE public.spatial_ref_sys IS '@omit
PostGIS spatial reference system table - not for API access';

-- 念のためアクセス権限も制限
REVOKE SELECT ON TABLE public.spatial_ref_sys FROM anon;
REVOKE SELECT ON TABLE public.spatial_ref_sys FROM authenticated;
GRANT SELECT ON TABLE public.spatial_ref_sys TO service_role;
```

## ℹ️ 説明
- `spatial_ref_sys` は座標参照系の定義を格納するPostGISシステムテーブル
- ユーザーデータではないため、RLSは不要
- APIアクセスを制限することで、リンターエラーを解消
- PostGIS機能は引き続き正常に動作

## 📋 確認方法
1. 上記SQLを実行
2. Database Linter を再実行
3. `spatial_ref_sys` のエラーが消えることを確認

これで全てのRLSエラーが解消されます！ 🎉