-- ============================================
-- RLS Policies for Experts Table
-- ============================================
-- Permite que los usuarios autenticados puedan ver experts
-- para que los KPIs del dashboard funcionen correctamente
-- ============================================

-- Habilitar RLS en la tabla experts si no está habilitado
ALTER TABLE public.experts ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Public can view active experts" ON public.experts;
DROP POLICY IF EXISTS "Authenticated users can view experts" ON public.experts;
DROP POLICY IF EXISTS "Experts can view own profile" ON public.experts;
DROP POLICY IF EXISTS "Experts can update own profile" ON public.experts;

-- 1. Usuarios autenticados pueden ver todos los experts
CREATE POLICY "Authenticated users can view experts" ON public.experts
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- 2. Experts pueden actualizar su propio perfil
CREATE POLICY "Experts can update own profile" ON public.experts
    FOR UPDATE
    USING (user_id = auth.uid());

-- 3. Permitir INSERT para service role (creación de experts)
CREATE POLICY "Service role can insert experts" ON public.experts
    FOR INSERT
    WITH CHECK (true);

-- Verificar las políticas
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'experts'
ORDER BY policyname;
