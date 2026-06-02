import cron from 'node-cron';
import prisma from '../config/database';
import emailService from './email.service';
import chemicalService from './chemical.service';
import labAccessService from './labAccess.service';
import { daysUntilExpiry } from '../utils/helpers';
import { AlertType } from '@prisma/client';

export class SchedulerService {
  /**
   * Initialize all scheduled tasks
   */
  init() {
    // Run daily at 8:00 AM — check chemical expiry dates
    cron.schedule('0 8 * * *', async () => {
      console.log('🕐 Running daily expiry check...');
      await this.checkExpiringChemicals();
      await chemicalService.updateAllStatuses();
      await labAccessService.cleanupExpiredAccess();
    });

    // Run every hour — update chemical statuses and expired access
    cron.schedule('0 * * * *', async () => {
      await chemicalService.updateAllStatuses();
      await labAccessService.cleanupExpiredAccess();
    });

    console.log('⏰ Scheduler initialized — daily expiry check at 8:00 AM');
  }

  /**
   * Check for chemicals that are expiring and send alerts
   */
  async checkExpiringChemicals() {
    try {
      // Get all active chemicals
      const chemicals = await prisma.chemical.findMany({
        where: { quantity: { gt: 0 } },
      });

      // Get recipients (Lab Managers and Admins)
      const recipients = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'LAB_MANAGER', 'STORE_KEEPER'] },
          isActive: true,
        },
        select: { email: true, id: true },
      });

      if (recipients.length === 0) {
        console.warn('No recipients configured for expiry alerts');
        return;
      }

      const recipientEmails = recipients.map(r => r.email);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Group chemicals by alert type
      const groups: Record<AlertType, typeof chemicals> = {
        EXPIRED: [],
        DAYS_7: [],
        DAYS_15: [],
        DAYS_30: [],
      };

      for (const chemical of chemicals) {
        const days = daysUntilExpiry(chemical.expiryDate);

        if (days <= 0) groups.EXPIRED.push(chemical);
        else if (days <= 7) groups.DAYS_7.push(chemical);
        else if (days <= 15) groups.DAYS_15.push(chemical);
        else if (days <= 30) groups.DAYS_30.push(chemical);
      }

      // Send alerts for each group
      for (const [alertType, chems] of Object.entries(groups)) {
        if (chems.length === 0) continue;

        // Check if alert was already sent today for this type
        const existingAlert = await prisma.emailAlert.findFirst({
          where: {
            alertType: alertType as AlertType,
            alertDate: today,
            sent: true,
          },
        });

        if (existingAlert) continue;

        // Send email
        const sent = await emailService.sendExpiryAlert(
          recipientEmails,
          chems.map(c => ({
            name: c.name,
            expiryDate: c.expiryDate,
            quantity: c.quantity,
            unit: c.unit,
            storageLocation: c.storageLocation,
          })),
          alertType as AlertType
        );

        // Log email alerts
        for (const chemical of chems) {
          await prisma.emailAlert.upsert({
            where: {
              chemicalId_alertType_alertDate: {
                chemicalId: chemical.id,
                alertType: alertType as AlertType,
                alertDate: today,
              },
            },
            update: { sent, sentAt: sent ? new Date() : null },
            create: {
              chemicalId: chemical.id,
              alertType: alertType as AlertType,
              alertDate: today,
              sent,
              sentAt: sent ? new Date() : null,
              recipients: JSON.stringify(recipientEmails),
            },
          });
        }

        // Create in-app notifications
        for (const recipient of recipients) {
          for (const chemical of chems) {
            await prisma.notification.create({
              data: {
                title: alertType === 'EXPIRED'
                  ? `Chemical Expired: ${chemical.name}`
                  : `Chemical Expiring Soon: ${chemical.name}`,
                message: alertType === 'EXPIRED'
                  ? `${chemical.name} has expired.`
                  : `${chemical.name} expires in ${daysUntilExpiry(chemical.expiryDate)} days.`,
                type: alertType === 'EXPIRED' ? 'EXPIRY_ALERT' : 'EXPIRY_WARNING',
                priority: alertType === 'EXPIRED' || alertType === 'DAYS_7' ? 'CRITICAL' : 'HIGH',
                userId: recipient.id,
                chemicalId: chemical.id,
              },
            });
          }
        }
      }

      const totalAlerts = Object.values(groups).reduce((sum, g) => sum + g.length, 0);
      console.log(`✅ Expiry check complete. ${totalAlerts} chemicals flagged.`);
    } catch (error) {
      console.error('Scheduler error:', error);
    }
  }
}

export default new SchedulerService();
