import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, workspaceName, inviteCode, senderName } = req.body;

  if (!to || !workspaceName || !inviteCode) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { data, error } = await resend.emails.send({
    from: 'Current App <onboarding@resend.dev>',
    to: [to],
    subject: `${senderName || 'Alguien'} te invita a unirte a "${workspaceName}" en Current`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Inter',sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background:linear-gradient(135deg,#0ea5e9,#2563eb);padding:32px;text-align:center;">
                      <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">Current</h1>
                      <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Fluye con tu negocio. Sin fricciones.</p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:32px;">
                      <h2 style="margin:0 0 8px;color:#111827;font-size:20px;font-weight:700;">¡Tienes una invitación!</h2>
                      <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                        <strong style="color:#111827;">${senderName || 'Un administrador'}</strong> te ha invitado a unirte al almacén 
                        <strong style="color:#111827;">"${workspaceName}"</strong> en Current.
                      </p>

                      <!-- Invite Code -->
                      <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
                        <p style="margin:0 0 8px;color:#0369a1;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Tu código de invitación</p>
                        <p style="margin:0;color:#0c4a6e;font-size:28px;font-weight:800;letter-spacing:6px;font-family:monospace;">${inviteCode}</p>
                      </div>

                      <!-- Steps -->
                      <p style="margin:0 0 12px;color:#374151;font-size:14px;font-weight:600;">¿Cómo unirme?</p>
                      <ol style="margin:0 0 24px;padding-left:20px;color:#6b7280;font-size:14px;line-height:2;">
                        <li>Ve a <a href="https://current-app.vercel.app" style="color:#0ea5e9;text-decoration:none;font-weight:600;">current-app.vercel.app</a> y crea o inicia sesión en tu cuenta.</li>
                        <li>En la pantalla de almacenes, haz clic en <strong>"Tengo un Código"</strong>.</li>
                        <li>Ingresa el código de arriba y listo. 🎉</li>
                      </ol>

                      <a href="https://current-app.vercel.app/workspaces" style="display:block;background:linear-gradient(135deg,#0ea5e9,#2563eb);color:#ffffff;text-align:center;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
                        Unirme ahora →
                      </a>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding:20px 32px;border-top:1px solid #f3f4f6;text-align:center;">
                      <p style="margin:0;color:#9ca3af;font-size:12px;">
                        Si no esperabas esta invitación, puedes ignorar este correo.<br/>
                        &copy; 2026 Current App. Todos los derechos reservados.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true, id: data?.id });
}
