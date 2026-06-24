import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { data, error } = await resend.emails.send({
    from: 'Current App <onboarding@resend.dev>',
    to: ['soporte@current.com'],
    replyTo: email,
    subject: `[Soporte Current] Mensaje de ${name}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8" /></head>
        <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Inter',sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                  
                  <tr>
                    <td style="background:linear-gradient(135deg,#0ea5e9,#2563eb);padding:24px 32px;">
                      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;">📩 Nuevo mensaje de soporte</h1>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:32px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-bottom:16px;">
                            <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">De</p>
                            <p style="margin:0;color:#111827;font-size:15px;font-weight:600;">${name}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-bottom:16px;">
                            <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Correo de respuesta</p>
                            <a href="mailto:${email}" style="color:#0ea5e9;font-size:15px;text-decoration:none;">${email}</a>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <p style="margin:0 0 8px;color:#9ca3af;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Mensaje</p>
                            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px;">
                              <p style="margin:0;color:#374151;font-size:15px;line-height:1.7;white-space:pre-wrap;">${message}</p>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:16px 32px;border-top:1px solid #f3f4f6;text-align:center;">
                      <p style="margin:0;color:#9ca3af;font-size:12px;">Enviado desde el formulario de soporte de Current App</p>
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
