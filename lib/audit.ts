/**
 * Admin audit logging utility.
 * Uses service role to bypass RLS on admin_audit_logs.
 */

interface AuditEntry {
    adminId: string;
    action: string;
    targetType: string;
    targetId?: string;
    details?: Record<string, unknown>;
}

export async function logAdminAction(entry: AuditEntry): Promise<void> {
    try {
        const serviceRoleKey =
            process.env.SUPABASE_SERVICE_ROLE_KEY ||
            process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY ||
            '';
        if (!serviceRoleKey) return;

        const { createServerClient } = await import('@supabase/ssr');
        const client = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey,
            { cookies: { getAll: () => [], setAll: () => {} } }
        );

        await client.from('admin_audit_logs').insert({
            admin_id: entry.adminId,
            action: entry.action,
            target_type: entry.targetType,
            target_id: entry.targetId ?? null,
            details: entry.details ?? null,
        });
    } catch (e) {
        // Audit logging must never break the main operation
        console.error('[audit] Failed to log admin action:', e);
    }
}
