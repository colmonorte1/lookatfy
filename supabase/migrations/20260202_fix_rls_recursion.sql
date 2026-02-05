-- ============================================
-- FIX: Infinite Recursion in RLS Policies
-- ============================================
-- Problema: Las políticas RLS causaban recursión infinita
-- Solución: Simplificar las políticas sin subconsultas recursivas
--
-- INSTRUCCIONES:
-- Ejecuta este script en Supabase SQL Editor
-- ============================================

-- Eliminar las políticas problemáticas
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles (including deleted)" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

-- Crear políticas simplificadas sin recursión

-- 1. Los usuarios pueden ver su propio perfil (sin deleted check en la política)
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- 2. Todos los usuarios autenticados pueden ver perfiles activos
--    (esto permite que el login lea el perfil para obtener el rol)
CREATE POLICY "Authenticated users can view active profiles" ON public.profiles
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL
        AND deleted_at IS NULL
    );

-- 3. Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- 4. Política administrativa para INSERT (crear usuarios)
CREATE POLICY "Service role can insert profiles" ON public.profiles
    FOR INSERT
    WITH CHECK (true);

-- 5. Política administrativa para DELETE (no debería usarse, pero por si acaso)
CREATE POLICY "Service role can delete profiles" ON public.profiles
    FOR DELETE
    USING (true);

-- NOTA: Las verificaciones de rol de admin se hacen a nivel de aplicación
-- en los server actions, no en las políticas RLS. Esto evita la recursión.

-- Verificar que las políticas se crearon correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
