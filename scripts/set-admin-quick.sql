-- ============================================
-- SCRIPT RÁPIDO PARA ASIGNAR ROL DE ADMIN
-- ============================================
--
-- INSTRUCCIONES RÁPIDAS:
-- 1. Reemplaza 'TU_EMAIL_AQUI' con tu email real
-- 2. Ejecuta este script en Supabase SQL Editor
-- 3. Cierra sesión y vuelve a iniciar sesión
--
-- ============================================

-- VER TU USUARIO ACTUAL (opcional - para verificar antes)
SELECT id, email, full_name, role, status
FROM profiles
WHERE email = 'TU_EMAIL_AQUI';

-- ASIGNAR ROL DE ADMIN
UPDATE profiles
SET role = 'admin'
WHERE email = 'TU_EMAIL_AQUI';

-- VERIFICAR EL CAMBIO
SELECT id, email, full_name, role, status
FROM profiles
WHERE email = 'TU_EMAIL_AQUI';

-- ============================================
-- Si ves role = 'admin' en el resultado,
-- ya estás listo! Solo cierra sesión y vuelve
-- a iniciar sesión para que tome efecto.
-- ============================================
