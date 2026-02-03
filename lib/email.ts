/**
 * Email service for sending notifications
 * Supports Resend (recommended) or console logging for development
 */

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    from?: string;
}

interface EmailResponse {
    success: boolean;
    error?: string;
    messageId?: string;
}

/**
 * Sends an email using the configured email service
 * To use Resend: npm install resend && set RESEND_API_KEY in .env
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResponse> {
    const { to, subject, html, from = process.env.EMAIL_FROM || 'noreply@lookatfy.com' } = options;

    // Check if Resend is configured
    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
        try {
            // Dynamic import to avoid errors if resend is not installed
            const { Resend } = await import('resend');
            const resend = new Resend(resendApiKey);

            const { data, error } = await resend.emails.send({
                from,
                to,
                subject,
                html
            });

            if (error) {
                console.error('Email sending error:', error);
                return { success: false, error: error.message };
            }

            return { success: true, messageId: data?.id };
        } catch (error) {
            console.error('Resend module error:', error);
            // Fall through to console log
        }
    }

    // Development mode: Log to console
    console.log('📧 Email (Development Mode)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`From: ${from}`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(html);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return { success: true, messageId: 'dev-mode' };
}

/**
 * Email templates for different user actions
 */
export const emailTemplates = {
    /**
     * Welcome email for new users
     */
    welcome: (userName: string, email: string, tempPassword: string) => ({
        subject: 'Bienvenido a Lookatfy',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .credential { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #667eea; border-radius: 4px; }
                    .credential strong { color: #667eea; }
                    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>¡Bienvenido a Lookatfy!</h1>
                    </div>
                    <div class="content">
                        <p>Hola <strong>${userName}</strong>,</p>
                        <p>Tu cuenta ha sido creada exitosamente. Aquí están tus credenciales de acceso:</p>

                        <div class="credential">
                            <strong>Email:</strong> ${email}
                        </div>
                        <div class="credential">
                            <strong>Contraseña temporal:</strong> ${tempPassword}
                        </div>

                        <p><strong>⚠️ Importante:</strong> Por seguridad, te recomendamos cambiar tu contraseña después del primer inicio de sesión.</p>

                        <div style="text-align: center;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" class="button">
                                Iniciar Sesión
                            </a>
                        </div>

                        <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>

                        <p>Saludos,<br><strong>El equipo de Lookatfy</strong></p>
                    </div>
                    <div class="footer">
                        <p>Este es un correo automático, por favor no respondas.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    /**
     * Account suspended notification
     */
    suspended: (userName: string) => ({
        subject: 'Tu cuenta ha sido suspendida',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>⚠️ Cuenta Suspendida</h1>
                    </div>
                    <div class="content">
                        <p>Hola <strong>${userName}</strong>,</p>

                        <div class="warning">
                            <strong>Tu cuenta ha sido suspendida temporalmente.</strong>
                        </div>

                        <p>No podrás acceder a tu cuenta hasta que sea reactivada por un administrador.</p>

                        <p>Si crees que esto es un error, por favor contacta al equipo de soporte.</p>

                        <p>Saludos,<br><strong>El equipo de Lookatfy</strong></p>
                    </div>
                    <div class="footer">
                        <p>Este es un correo automático, por favor no respondas.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    /**
     * Account reactivated notification
     */
    reactivated: (userName: string) => ({
        subject: 'Tu cuenta ha sido reactivada',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .success { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }
                    .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✅ Cuenta Reactivada</h1>
                    </div>
                    <div class="content">
                        <p>Hola <strong>${userName}</strong>,</p>

                        <div class="success">
                            <strong>¡Buenas noticias! Tu cuenta ha sido reactivada.</strong>
                        </div>

                        <p>Ya puedes volver a acceder a todos los servicios de Lookatfy.</p>

                        <div style="text-align: center;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" class="button">
                                Iniciar Sesión
                            </a>
                        </div>

                        <p>Saludos,<br><strong>El equipo de Lookatfy</strong></p>
                    </div>
                    <div class="footer">
                        <p>Este es un correo automático, por favor no respondas.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    /**
     * Account updated notification
     */
    updated: (userName: string) => ({
        subject: 'Tu cuenta ha sido actualizada',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #667eea; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .info { background: #dbeafe; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📝 Cuenta Actualizada</h1>
                    </div>
                    <div class="content">
                        <p>Hola <strong>${userName}</strong>,</p>

                        <div class="info">
                            <strong>Tu información de cuenta ha sido actualizada por un administrador.</strong>
                        </div>

                        <p>Si no solicitaste estos cambios, por favor contacta al equipo de soporte inmediatamente.</p>

                        <p>Saludos,<br><strong>El equipo de Lookatfy</strong></p>
                    </div>
                    <div class="footer">
                        <p>Este es un correo automático, por favor no respondas.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    })
};
