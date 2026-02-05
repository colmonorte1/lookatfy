/**
 * Script para asignar rol de admin a un usuario
 *
 * Uso:
 * 1. Instalar ts-node si no lo tienes: npm install -g ts-node
 * 2. Ejecutar: npx ts-node scripts/set-admin-role.ts tu-email@ejemplo.com
 *
 * O usar directamente en Supabase SQL Editor:
 * UPDATE profiles SET role = 'admin' WHERE email = 'tu-email@ejemplo.com';
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Faltan variables de entorno');
    console.log('Asegúrate de tener en tu .env.local:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL');
    console.log('- SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const email = process.argv[2];

if (!email) {
    console.error('❌ Error: Debes proporcionar un email');
    console.log('Uso: npx ts-node scripts/set-admin-role.ts tu-email@ejemplo.com');
    process.exit(1);
}

async function setAdminRole(userEmail: string) {
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    console.log(`\n🔍 Buscando usuario: ${userEmail}...`);

    // Buscar el usuario por email
    const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', userEmail)
        .single();

    if (userError || !user) {
        console.error('❌ Error: Usuario no encontrado');
        console.log('Verifica que el email sea correcto');
        process.exit(1);
    }

    console.log(`\n✅ Usuario encontrado:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Nombre: ${user.full_name || 'N/A'}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Rol actual: ${user.role || 'N/A'}`);

    if (user.role === 'admin') {
        console.log('\n✅ El usuario ya tiene rol de admin');
        process.exit(0);
    }

    console.log(`\n🔄 Actualizando rol a 'admin'...`);

    // Actualizar el rol a admin
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', user.id);

    if (updateError) {
        console.error('❌ Error al actualizar:', updateError.message);
        process.exit(1);
    }

    console.log('✅ Rol actualizado exitosamente');
    console.log('\n🎉 El usuario ahora es administrador');
    console.log('\n📝 Nota: Si el usuario ya estaba logueado, debe cerrar sesión y volver a iniciar sesión');
}

setAdminRole(email).catch(console.error);
