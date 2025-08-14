-- ゲストユーザーをSupabaseとデータベースに設定するSQLスクリプト

-- 1. usersテーブルにゲストユーザーを挿入
INSERT INTO users (
  id,
  email,
  display_name,
  avatar_url,
  created_at,
  updated_at
) VALUES (
  'guest-dev-user',
  'guest@dev.local',
  '開発用ゲスト',
  null,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  display_name = EXCLUDED.display_name,
  updated_at = NOW();

-- 2. 必要に応じてゲストユーザーのprofileを作成
-- （profilesテーブルがある場合）
-- INSERT INTO profiles (
--   id,
--   display_name,
--   avatar_url,
--   created_at,
--   updated_at
-- ) VALUES (
--   'guest-dev-user',
--   '開発用ゲスト',
--   null,
--   NOW(),
--   NOW()
-- ) ON CONFLICT (id) DO UPDATE SET
--   display_name = EXCLUDED.display_name,
--   updated_at = NOW();