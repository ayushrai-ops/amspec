import nodemailer from 'nodemailer';
import { env } from './env';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

// Verify connection on startup (non-blocking)
if (env.SMTP_USER && env.SMTP_PASS) {
  transporter.verify()
    .then(() => console.log('✉️  SMTP connection verified'))
    .catch((err) => console.warn('⚠️  SMTP connection failed:', err.message));
} else {
  console.warn('⚠️  SMTP credentials not configured - email alerts disabled');
}

export default transporter;
