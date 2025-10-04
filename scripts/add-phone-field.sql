-- Добавляем поле phone в таблицу profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone VARCHAR(20) UNIQUE;

-- Создаем индекс для быстрого поиска по телефону
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- Обновляем политику для просмотра профилей
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);
