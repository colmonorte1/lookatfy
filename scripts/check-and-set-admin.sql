-- ============================================
-- SCRIPT PARA VERIFICAR Y ASIGNAR ROL DE ADMIN
-- ============================================
--
-- INSTRUCCIONES:
-- 1. Ve a tu Supabase Dashboard > SQL Editor
-- 2. Copia y pega este script
-- 3. Reemplaza 'TU_EMAIL_AQUI' con tu email
-- 4. Ejecuta el script
--
-- ============================================

-- PASO 1: Verificar el estado actual del usuario
-- Descomenta y ejecuta esta línea primero para ver tu información actual:

-- SELECT id, email, full_name, role, status, updated_at
-- FROM profiles
-- WHERE email = 'TU_EMAIL_AQUI';


-- PASO 2: Actualizar el rol a admin
-- Reemplaza 'TU_EMAIL_AQUI' con tu email real y ejecuta:

UPDATE profiles
SET role = 'admin'
WHERE email = 'TU_EMAIL_AQUI';


-- PASO 3: Verificar que el cambio se aplicó correctamente
-- Ejecuta esta consulta para confirmar:

SELECT id, email, full_name, role, status, updated_at
FROM profiles
WHERE email = 'TU_EMAIL_AQUI';


-- ============================================
-- CONSULTAS ÚTILES ADICIONALES
-- ============================================

-- Ver TODOS los usuarios y sus roles:
-- SELECT id, email, full_name, role, status
-- FROM profiles
-- ORDER BY updated_at DESC;


-- Ver solo los administradores:
-- SELECT id, email, full_name, role
-- FROM profiles
-- WHERE role = 'admin';


-- Asignar rol de admin a múltiples usuarios:
-- UPDATE profiles
-- SET role = 'admin'
-- WHERE email IN ('email1@ejemplo.com', 'email2@ejemplo.com');


-- NOTA IMPORTANTE:
-- Después de actualizar el rol, el usuario debe:
-- 1. Cerrar sesión completamente
-- 2. Cerrar todas las pestañas del navegador
-- 3. Volver a iniciar sesión
-- 4. La redirección debería funcionar correctamente
