'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { sendEmail, emailTemplates } from '@/lib/email';

/**
 * Deletes a recording by ID (admin only)
 * @param recordingId - The ID of the recording to delete
 * @param userId - The user ID for revalidation path
 * @returns Success status and optional error message
 */
export async function deleteRecording(recordingId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: 'No autenticado' };
    }

    // Authorization check - verify admin role
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profileError || !profile || profile.role !== 'admin') {
        return { success: false, error: 'No autorizado. Solo administradores pueden eliminar grabaciones.' };
    }

    // Delete the recording
    const { error: deleteError } = await supabase
        .from('recordings')
        .delete()
        .eq('id', recordingId);

    if (deleteError) {
        console.error('Error deleting recording:', deleteError);
        return { success: false, error: 'Error al eliminar la grabación' };
    }

    // Revalidate the user detail page
    revalidatePath(`/admin/users/${userId}`);

    return { success: true };
}

/**
 * Creates a new user (admin only)
 * @param formData - Form data with user information
 * @returns Success status, error message, or user ID
 */
export async function createUser(formData: FormData): Promise<{ success: boolean; error?: string; userId?: string }> {
    const supabase = await createClient();

    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: 'No autenticado' };
    }

    // Authorization check - verify admin role
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profileError || !profile || profile.role !== 'admin') {
        return { success: false, error: 'No autorizado' };
    }

    // Extract and validate form data
    const email = formData.get('email')?.toString().trim();
    const fullName = formData.get('full_name')?.toString().trim();
    const role = formData.get('role')?.toString() as 'client' | 'expert' | 'admin' | undefined;

    if (!email || !fullName || !role) {
        return { success: false, error: 'Todos los campos son obligatorios' };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { success: false, error: 'Email inválido' };
    }

    // Validate role
    if (!['client', 'expert', 'admin'].includes(role)) {
        return { success: false, error: 'Rol inválido' };
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

    if (existingUser) {
        return { success: false, error: 'Ya existe un usuario con este email' };
    }

    // Create auth user with Supabase Admin API
    // Note: This requires using the service role key, which should be in server environment
    // For now, we'll create just the profile. In production, you'd use Supabase Admin SDK

    // Generate a temporary password (in production, send password reset email)
    const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!';

    // Sign up the user (this creates both auth user and profile via trigger)
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: tempPassword,
        options: {
            data: {
                full_name: fullName,
                role: role
            }
        }
    });

    if (signUpError || !authData.user) {
        console.error('Error creating user:', signUpError);
        return { success: false, error: signUpError?.message || 'Error al crear el usuario' };
    }

    // Update the profile with the role (in case the trigger didn't set it)
    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            full_name: fullName,
            role: role
        })
        .eq('id', authData.user.id);

    if (updateError) {
        console.error('Error updating profile:', updateError);
    }

    // Send welcome email with credentials
    try {
        const template = emailTemplates.welcome(fullName, email, tempPassword);
        await sendEmail({
            to: email,
            subject: template.subject,
            html: template.html
        });
    } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Don't fail the user creation if email fails
    }

    // Revalidate the users list page
    revalidatePath('/admin/users');

    return { success: true, userId: authData.user.id };
}

/**
 * Updates an existing user (admin only)
 * @param userId - The ID of the user to update
 * @param formData - Form data with updated user information
 * @returns Success status and optional error message
 */
export async function updateUser(userId: string, formData: FormData): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: 'No autenticado' };
    }

    // Authorization check - verify admin role
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profileError || !profile || profile.role !== 'admin') {
        return { success: false, error: 'No autorizado' };
    }

    // Extract and validate form data
    const email = formData.get('email')?.toString().trim();
    const fullName = formData.get('full_name')?.toString().trim();
    const role = formData.get('role')?.toString() as 'client' | 'expert' | 'admin' | undefined;
    const city = formData.get('city')?.toString().trim() || null;
    const country = formData.get('country')?.toString().trim() || null;

    if (!email || !fullName || !role) {
        return { success: false, error: 'Todos los campos obligatorios deben estar completos' };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { success: false, error: 'Email inválido' };
    }

    // Validate role
    if (!['client', 'expert', 'admin'].includes(role)) {
        return { success: false, error: 'Rol inválido' };
    }

    // Prevent admin from removing their own admin role
    if (userId === user.id && role !== 'admin') {
        return { success: false, error: 'No puedes cambiar tu propio rol de administrador' };
    }

    // Check if email is being changed and if it's already taken
    const { data: currentProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();

    if (currentProfile && currentProfile.email !== email) {
        const { data: existingUser } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return { success: false, error: 'Ya existe otro usuario con este email' };
        }
    }

    // Update the profile
    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            full_name: fullName,
            email: email,
            role: role,
            city: city,
            country: country
        })
        .eq('id', userId);

    if (updateError) {
        console.error('Error updating user:', updateError);
        return { success: false, error: 'Error al actualizar el usuario' };
    }

    // Send update notification email
    try {
        const template = emailTemplates.updated(fullName);
        await sendEmail({
            to: email,
            subject: template.subject,
            html: template.html
        });
    } catch (emailError) {
        console.error('Error sending update email:', emailError);
        // Don't fail the update if email fails
    }

    // Revalidate pages
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath(`/admin/users/${userId}/edit`);

    return { success: true };
}

/**
 * Soft deletes a user (admin only)
 * @param userId - The ID of the user to delete
 * @returns Success status and optional error message
 */
export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: 'No autenticado' };
    }

    // Authorization check - verify admin role
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profileError || !profile || profile.role !== 'admin') {
        return { success: false, error: 'No autorizado' };
    }

    // Prevent self-deletion
    if (userId === user.id) {
        return { success: false, error: 'No puedes eliminar tu propia cuenta' };
    }

    // Soft delete: set deleted_at timestamp and deleted_by
    const { error: deleteError } = await supabase
        .from('profiles')
        .update({
            deleted_at: new Date().toISOString(),
            deleted_by: user.id,
            status: 'deleted'
        })
        .eq('id', userId);

    if (deleteError) {
        console.error('Error deleting user:', deleteError);
        return { success: false, error: 'Error al eliminar el usuario' };
    }

    // Revalidate pages
    revalidatePath('/admin/users');

    return { success: true };
}

/**
 * Restores a soft-deleted user (admin only)
 * @param userId - The ID of the user to restore
 * @returns Success status and optional error message
 */
export async function restoreUser(userId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: 'No autenticado' };
    }

    // Authorization check - verify admin role
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profileError || !profile || profile.role !== 'admin') {
        return { success: false, error: 'No autorizado' };
    }

    // Restore: clear deleted_at and deleted_by
    const { error: restoreError } = await supabase
        .from('profiles')
        .update({
            deleted_at: null,
            deleted_by: null,
            status: 'active'
        })
        .eq('id', userId);

    if (restoreError) {
        console.error('Error restoring user:', restoreError);
        return { success: false, error: 'Error al restaurar el usuario' };
    }

    // Revalidate pages
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}`);

    return { success: true };
}

/**
 * Suspends or activates a user (admin only)
 * @param userId - The ID of the user to suspend/activate
 * @param suspend - True to suspend, false to activate
 * @returns Success status and optional error message
 */
export async function toggleUserStatus(userId: string, suspend: boolean): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: 'No autenticado' };
    }

    // Authorization check - verify admin role
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profileError || !profile || profile.role !== 'admin') {
        return { success: false, error: 'No autorizado' };
    }

    // Prevent self-suspension
    if (userId === user.id) {
        return { success: false, error: 'No puedes suspender tu propia cuenta' };
    }

    // Get target user's email and name for notification
    const { data: targetUser } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', userId)
        .single();

    // Update status field
    const newStatus = suspend ? 'suspended' : 'active';
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);

    if (updateError) {
        console.error('Error updating user status:', updateError);
        return { success: false, error: 'Error al cambiar el estado del usuario' };
    }

    // Send notification email
    if (targetUser?.email) {
        try {
            const template = suspend
                ? emailTemplates.suspended(targetUser.full_name || targetUser.email)
                : emailTemplates.reactivated(targetUser.full_name || targetUser.email);

            await sendEmail({
                to: targetUser.email,
                subject: template.subject,
                html: template.html
            });
        } catch (emailError) {
            console.error('Error sending status change email:', emailError);
            // Don't fail the status change if email fails
        }
    }

    // Revalidate the users list page
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}`);

    return { success: true };
}

/**
 * Exports users data to CSV format (admin only)
 * @param filters - Optional filters for export (search, role)
 * @returns CSV data string or error
 */
export async function exportUsersToCSV(filters?: {
    search?: string;
    role?: string;
}): Promise<{ success: boolean; data?: string; error?: string }> {
    const supabase = await createClient();

    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: 'No autenticado' };
    }

    // Authorization check - verify admin role
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profileError || !profile || profile.role !== 'admin') {
        return { success: false, error: 'No autorizado' };
    }

    // Build query with filters
    let query = supabase
        .from('profiles')
        .select('id, full_name, email, role, status, city, country, created_at, deleted_at')
        .neq('role', 'expert')
        .is('deleted_at', null);

    // Apply search filter
    if (filters?.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    // Apply role filter
    if (filters?.role && filters.role !== 'all') {
        query = query.eq('role', filters.role);
    }

    const { data: users, error } = await query.order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching users for export:', error);
        return { success: false, error: 'Error al obtener los datos de usuarios' };
    }

    if (!users || users.length === 0) {
        return { success: false, error: 'No hay usuarios para exportar' };
    }

    // Generate CSV headers
    const headers = [
        'ID',
        'Nombre Completo',
        'Email',
        'Rol',
        'Estado',
        'Ciudad',
        'País',
        'Fecha de Creación'
    ];

    // Generate CSV rows
    const rows = users.map(user => [
        user.id,
        user.full_name || '',
        user.email || '',
        user.role || '',
        user.status || 'active',
        user.city || '',
        user.country || '',
        user.created_at ? new Date(user.created_at).toLocaleString('es-ES') : ''
    ]);

    // Escape CSV values (handle commas, quotes, newlines)
    const escapeCSV = (value: string) => {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    };

    // Build CSV string
    const csvLines = [
        headers.map(escapeCSV).join(','),
        ...rows.map(row => row.map(cell => escapeCSV(String(cell))).join(','))
    ];

    const csvData = csvLines.join('\n');

    return { success: true, data: csvData };
}

/**
 * Performs bulk action on multiple users (admin only)
 * @param userIds - Array of user IDs to perform action on
 * @param action - Action to perform: 'suspend', 'activate', or 'delete'
 * @returns Success status with counts or error
 */
export async function bulkUserAction(
    userIds: string[],
    action: 'suspend' | 'activate' | 'delete'
): Promise<{ success: boolean; error?: string; processed?: number; failed?: number }> {
    const supabase = await createClient();

    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: 'No autenticado' };
    }

    // Authorization check - verify admin role
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profileError || !profile || profile.role !== 'admin') {
        return { success: false, error: 'No autorizado' };
    }

    if (!userIds || userIds.length === 0) {
        return { success: false, error: 'No se seleccionaron usuarios' };
    }

    // Prevent acting on self
    const filteredUserIds = userIds.filter(id => id !== user.id);

    if (filteredUserIds.length === 0) {
        return { success: false, error: 'No puedes realizar acciones sobre tu propia cuenta' };
    }

    let processed = 0;
    let failed = 0;

    // Fetch users for email notifications
    const { data: targetUsers } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', filteredUserIds);

    // Perform bulk action based on type
    if (action === 'delete') {
        // Soft delete: set deleted_at and status
        const { error: bulkError } = await supabase
            .from('profiles')
            .update({
                deleted_at: new Date().toISOString(),
                deleted_by: user.id,
                status: 'deleted'
            })
            .in('id', filteredUserIds);

        if (bulkError) {
            console.error('Bulk delete error:', bulkError);
            return { success: false, error: 'Error al eliminar usuarios' };
        }

        processed = filteredUserIds.length;
    } else if (action === 'suspend' || action === 'activate') {
        const newStatus = action === 'suspend' ? 'suspended' : 'active';

        const { error: bulkError } = await supabase
            .from('profiles')
            .update({ status: newStatus })
            .in('id', filteredUserIds);

        if (bulkError) {
            console.error('Bulk status update error:', bulkError);
            return { success: false, error: 'Error al actualizar el estado de usuarios' };
        }

        processed = filteredUserIds.length;

        // Send email notifications for each user
        if (targetUsers) {
            for (const targetUser of targetUsers) {
                if (targetUser.email) {
                    try {
                        const template = action === 'suspend'
                            ? emailTemplates.suspended(targetUser.full_name || targetUser.email)
                            : emailTemplates.reactivated(targetUser.full_name || targetUser.email);

                        await sendEmail({
                            to: targetUser.email,
                            subject: template.subject,
                            html: template.html
                        });
                    } catch (emailError) {
                        console.error(`Error sending email to ${targetUser.email}:`, emailError);
                        // Continue even if email fails
                    }
                }
            }
        }
    }

    // Revalidate pages
    revalidatePath('/admin/users');

    return { success: true, processed, failed };
}
