import nodemailer from 'nodemailer';
import { Exchange, Participant, EmailLog } from '@/types';

export function generateEmailHtml(params: {
  exchange: Exchange;
  giver: Participant;
  receiver: Participant;
}): string {
  const { exchange, giver, receiver } = params;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>¡Tu Amigo Secreto en ${escapeHtml(exchange.title)}!</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 24px;
      color: #1e293b;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #c52d51 0%, #db4969 50%, #1d7b4e 100%);
      padding: 32px 24px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0 0 8px 0;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 0;
      font-size: 15px;
      opacity: 0.95;
    }
    .content {
      padding: 32px 24px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      color: #334155;
    }
    .secret-box {
      background: linear-gradient(135deg, #effaf3 0%, #fef3c7 100%);
      border: 2px dashed #4fb682;
      border-radius: 14px;
      padding: 24px;
      text-align: center;
      margin: 24px 0;
    }
    .secret-label {
      text-transform: uppercase;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1.2px;
      color: #154e34;
      margin-bottom: 8px;
    }
    .secret-name {
      font-size: 28px;
      font-weight: 900;
      color: #0f172a;
      margin: 4px 0 12px 0;
    }
    .wishlist-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      margin-top: 24px;
    }
    .wishlist-title {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .gift-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 10px;
      padding: 10px 12px;
      background: #ffffff;
      border-radius: 8px;
      border-left: 4px solid #db4969;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .gift-number {
      font-weight: 800;
      color: #db4969;
      margin-right: 10px;
      min-width: 20px;
    }
    .gift-text {
      font-size: 14px;
      color: #334155;
      line-height: 1.4;
    }
    .event-info {
      margin-top: 24px;
      padding: 16px;
      background-color: #f1f5f9;
      border-radius: 10px;
      font-size: 13px;
      color: #475569;
    }
    .footer {
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-size: 40px; margin-bottom: 8px;">🎁</div>
      <h1>¡Sorteo de Regalos Realizado!</h1>
      <p>${escapeHtml(exchange.title)}</p>
    </div>

    <div class="content">
      <p class="greeting">¡Hola <strong>${escapeHtml(giver.name)}</strong>!</p>
      <p style="line-height: 1.5; color: #475569;">
        El sorteo para el intercambio <strong>${escapeHtml(exchange.title)}</strong> se ha completado con éxito. Este es tu resultado secreto:
      </p>

      <div class="secret-box">
        <div class="secret-label">✨ Te ha tocado regalar a ✨</div>
        <div class="secret-name">🎁 ${escapeHtml(receiver.name)} 🎁</div>
        <div style="font-size: 13px; color: #154e34;">${escapeHtml(receiver.email)}</div>
      </div>

      <div class="wishlist-card">
        <h3 class="wishlist-title">🌟 Las 3 opciones de regalo deseadas por ${escapeHtml(receiver.name)}:</h3>
        
        <div class="gift-item">
          <span class="gift-number">1.</span>
          <span class="gift-text"><strong>${escapeHtml(receiver.gift1 || 'Cualquier detalle lindo')}</strong></span>
        </div>
        
        <div class="gift-item">
          <span class="gift-number">2.</span>
          <span class="gift-text"><strong>${escapeHtml(receiver.gift2 || 'Sorpresa')}</strong></span>
        </div>
        
        <div class="gift-item">
          <span class="gift-number">3.</span>
          <span class="gift-text"><strong>${escapeHtml(receiver.gift3 || 'Sorpresa')}</strong></span>
        </div>
      </div>

      <div class="event-info">
        <strong>📌 Detalles del intercambio:</strong>
        ${exchange.budget ? `<br>• <strong>Presupuesto sugerido:</strong> ${escapeHtml(exchange.budget)}` : ''}
        ${exchange.eventDate ? `<br>• <strong>Fecha del evento:</strong> ${escapeHtml(exchange.eventDate)}` : ''}
        ${exchange.description ? `<br>• <strong>Notas:</strong> ${escapeHtml(exchange.description)}` : ''}
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0 0 6px 0;">¡Recuerda mantener el secreto hasta el día de la entrega!</p>
      <p style="margin: 0; opacity: 0.8;">Organizado con Sorteo de Regalos &copy; 2026 por ASSEGURA AI SOLUTIONS</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function escapeHtml(text: string | undefined): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function sendAssignmentEmail(params: {
  exchange: Exchange;
  giver: Participant;
  receiver: Participant;
}): Promise<{ success: boolean; status: 'sent' | 'simulated' | 'failed'; error?: string; log: EmailLog }> {
  const { exchange, giver, receiver } = params;
  const htmlContent = generateEmailHtml({ exchange, giver, receiver });
  const subject = `🎁 ¡Tu Amigo Secreto para ${exchange.title}!`;

  const logId = 'log_' + Math.random().toString(36).substring(2, 10);
  const now = new Date().toISOString();

  // Check if SMTP is configured
  const smtp = exchange.smtpConfig;
  const hasSmtp = smtp && smtp.enabled && smtp.host && smtp.user && smtp.pass;

  if (hasSmtp) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtp.host,
        port: Number(smtp.port) || 587,
        secure: smtp.secure,
        auth: {
          user: smtp.user,
          pass: smtp.pass,
        },
      });

      await transporter.sendMail({
        from: `"${smtp.fromName || exchange.title}" <${smtp.fromEmail || smtp.user}>`,
        to: `"${giver.name}" <${giver.email}>`,
        subject: subject,
        html: htmlContent,
      });

      const emailLog: EmailLog = {
        id: logId,
        exchangeId: exchange.id,
        recipientEmail: giver.email,
        recipientName: giver.name,
        assignedName: receiver.name,
        assignedGifts: [receiver.gift1, receiver.gift2, receiver.gift3],
        subject,
        htmlContent,
        status: 'sent',
        sentAt: now,
      };

      return { success: true, status: 'sent', log: emailLog };
    } catch (err: any) {
      const emailLog: EmailLog = {
        id: logId,
        exchangeId: exchange.id,
        recipientEmail: giver.email,
        recipientName: giver.name,
        assignedName: receiver.name,
        assignedGifts: [receiver.gift1, receiver.gift2, receiver.gift3],
        subject,
        htmlContent,
        status: 'failed',
        errorMessage: err?.message || 'Error al conectar con el servidor SMTP',
        sentAt: now,
      };

      return { success: false, status: 'failed', error: err?.message, log: emailLog };
    }
  }

  // Simulation Mode (Default if no custom SMTP configured yet)
  const emailLog: EmailLog = {
    id: logId,
    exchangeId: exchange.id,
    recipientEmail: giver.email,
    recipientName: giver.name,
    assignedName: receiver.name,
    assignedGifts: [receiver.gift1, receiver.gift2, receiver.gift3],
    subject,
    htmlContent,
    status: 'simulated',
    sentAt: now,
  };

  return { success: true, status: 'simulated', log: emailLog };
}
