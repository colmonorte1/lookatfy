'use server';

import { createClient } from '@/utils/supabase/server';
import { sendEmail } from '@/lib/email/brevo';
import { welcomeTemplate } from '@/lib/email/templates';

type RegisterResult = {
    success: boolean;
    error?: string;
    needsEmailConfirmation?: boolean;
};

export async function registerClient(formData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}): Promise<RegisterResult> {
    const { firstName, lastName, email, password } = formData;

    if (!firstName || !lastName || !email || !password) {
        return { success: false, error: 'Todos los campos son obligatorios.' };
    }

    const fullName = `${firstName} ${lastName}`.trim();

    if (password.length < 8) {
        return { success: false, error: 'La contraseña debe tener al menos 8 caracteres.' };
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                first_name: firstName,
                last_name: lastName,
                role: 'client',
            },
        },
    });

    if (error) {
        if (error.message.includes('already registered')) {
            return { success: false, error: 'Este correo ya está registrado.' };
        }
        return { success: false, error: error.message };
    }

    const needsEmailConfirmation = !data.session;

    // Send welcome email if auto-confirmed (otherwise Supabase sends confirmation email)
    if (!needsEmailConfirmation) {
        try {
            const html = welcomeTemplate({ userName: fullName, role: 'client' });
            await sendEmail({ to: email, subject: 'Bienvenido a Lookatfy', html });
        } catch (e) {
            console.error('Error sending welcome email:', e);
        }
    }

    return { success: true, needsEmailConfirmation };
}

export async function registerExpert(formData: {
    firstName: string;
    lastName: string;
    title: string;
    email: string;
    password: string;
}): Promise<RegisterResult> {
    const { firstName, lastName, title, email, password } = formData;

    if (!firstName || !lastName || !title || !email || !password) {
        return { success: false, error: 'Todos los campos son obligatorios.' };
    }

    if (password.length < 8) {
        return { success: false, error: 'La contraseña debe tener al menos 8 caracteres.' };
    }

    const fullName = `${firstName} ${lastName}`.trim();
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                first_name: firstName,
                last_name: lastName,
                role: 'expert',
                title,
            },
        },
    });

    if (error) {
        if (error.message.includes('already registered')) {
            return { success: false, error: 'Este correo ya está registrado.' };
        }
        return { success: false, error: error.message };
    }

    const needsEmailConfirmation = !data.session;

    // If auto-confirm is enabled, create the expert record
    if (data.session && data.user) {
        const { error: expertError } = await supabase
            .from('experts')
            .insert({
                id: data.user.id,
                title,
                bio: '',
                consultation_price: 0,
            });

        if (expertError) {
            console.error('Error creating expert record:', expertError);
            return {
                success: false,
                error: 'Cuenta creada pero hubo un error al configurar tu perfil de experto. Contacta soporte.',
            };
        }
    }

    // Send welcome email if auto-confirmed
    if (!needsEmailConfirmation) {
        try {
            const html = welcomeTemplate({ userName: fullName, role: 'expert' });
            await sendEmail({ to: email, subject: 'Bienvenido a Lookatfy', html });
        } catch (e) {
            console.error('Error sending welcome email:', e);
        }
    }

    return { success: true, needsEmailConfirmation };
}
