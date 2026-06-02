import transporter from '../config/email';
import { env } from '../config/env';
import { formatDate } from '../utils/helpers';

interface ExpiringChemical {
  name: string;
  expiryDate: Date;
  quantity: number;
  unit: string;
  storageLocation: string | null;
}

export class EmailService {
  /**
   * Send expiry alert email
   */
  async sendExpiryAlert(
    recipients: string[],
    chemicals: ExpiringChemical[],
    alertType: 'DAYS_30' | 'DAYS_15' | 'DAYS_7' | 'EXPIRED'
  ) {
    if (!env.SMTP_USER || !env.SMTP_PASS) {
      console.warn('SMTP not configured, skipping email send');
      return false;
    }

    const urgencyMap = {
      DAYS_30: '30 Days',
      DAYS_15: '15 Days',
      DAYS_7: '7 Days',
      EXPIRED: 'EXPIRED',
    };

    const urgency = urgencyMap[alertType];
    const isExpired = alertType === 'EXPIRED';

    const chemicalListHtml = chemicals.map((c, i) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px; color: #334155;">${i + 1}</td>
        <td style="padding: 12px; color: #334155; font-weight: 600;">${c.name}</td>
        <td style="padding: 12px; color: ${isExpired ? '#ef4444' : '#f59e0b'}; font-weight: 600;">
          ${formatDate(c.expiryDate)}
        </td>
        <td style="padding: 12px; color: #334155;">${c.quantity} ${c.unit}</td>
        <td style="padding: 12px; color: #334155;">${c.storageLocation || 'N/A'}</td>
      </tr>
    `).join('');

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px;">
      <div style="max-width: 700px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); padding: 30px; text-align: center;">
          <h1 style="color: #06b6d4; margin: 0; font-size: 24px;">⚗️ AMSPEC Inventory System</h1>
          <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 14px;">Chemical Expiry Alert</p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          <div style="background: ${isExpired ? '#fef2f2' : '#fffbeb'}; border-left: 4px solid ${isExpired ? '#ef4444' : '#f59e0b'}; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
            <p style="margin: 0; color: ${isExpired ? '#991b1b' : '#92400e'}; font-weight: 600; font-size: 16px;">
              ${isExpired ? '🔴 EXPIRED CHEMICALS' : `⚠️ Chemicals Expiring Within ${urgency}`}
            </p>
          </div>

          <p style="color: #475569; line-height: 1.6;">Dear Lab Manager,</p>
          <p style="color: #475569; line-height: 1.6;">
            The following chemicals ${isExpired ? 'have expired' : 'are nearing their expiry date'}. 
            Please take necessary action immediately.
          </p>

          <!-- Chemical Table -->
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #e2e8f0; border-radius: 8px;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="padding: 12px; text-align: left; color: #64748b; font-size: 12px; text-transform: uppercase;">#</th>
                <th style="padding: 12px; text-align: left; color: #64748b; font-size: 12px; text-transform: uppercase;">Chemical</th>
                <th style="padding: 12px; text-align: left; color: #64748b; font-size: 12px; text-transform: uppercase;">Expiry Date</th>
                <th style="padding: 12px; text-align: left; color: #64748b; font-size: 12px; text-transform: uppercase;">Quantity</th>
                <th style="padding: 12px; text-align: left; color: #64748b; font-size: 12px; text-transform: uppercase;">Location</th>
              </tr>
            </thead>
            <tbody>
              ${chemicalListHtml}
            </tbody>
          </table>

          <p style="color: #475569; line-height: 1.6;">
            Please log in to the <a href="${env.FRONTEND_URL}" style="color: #06b6d4; text-decoration: none; font-weight: 600;">AMSPEC Dashboard</a> to review and manage these items.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; color: #94a3b8; font-size: 12px;">
            This is an automated message from AMSPEC Inventory Management System.<br>
            Please do not reply to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
    `;

    try {
      await transporter.sendMail({
        from: `"AMSPEC Lab System" <${env.SMTP_FROM}>`,
        to: recipients.join(', '),
        subject: isExpired
          ? `🔴 URGENT: ${chemicals.length} Chemical(s) Have Expired`
          : `⚠️ Chemical Expiry Alert — ${chemicals.length} Item(s) Expiring Within ${urgency}`,
        html,
      });

      console.log(`✉️  Expiry alert sent to ${recipients.length} recipient(s) for ${chemicals.length} chemical(s)`);
      return true;
    } catch (error) {
      console.error('Failed to send expiry alert:', error);
      return false;
    }
  }
}

export default new EmailService();
