import * as dotenv from 'dotenv';
dotenv.config();
import nodemailer from 'nodemailer';

export class EmailService {
  constructor() {
  }

  private createTransporter() {
    if (process.env.SMTP_SERVICE === 'gmail' && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    }
    
    // Fallback to Mailtrap or custom SMTP
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
      port: Number(process.env.SMTP_PORT) || 2525,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async sendInviteEmail(to: string, token: string) {
    const transporter = this.createTransporter();
  
  const inviteLink = `${process.env.INVITE_USER_LINK}?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@erp-system.com',
    to,
    subject: 'You are invited!',
    html: `<p>Click the link below to set your password and activate your account:</p>
           <a href="${inviteLink}">${inviteLink}</a>`,
  };
  console.log("email sent!");
  await transporter.sendMail(mailOptions);
  }
  
  async sendResetPasswordEmail(to: string, token: string) {
    const transporter = this.createTransporter();
  
  const inviteLink = `${process.env.RESET_PASSWORD_LINK}?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@erp-system.com',
    to,
    subject: 'Reset Your Password!',
    html: `<p>Click the link below to reset set your new password:</p>
           <a href="${inviteLink}">${inviteLink}</a>`,
  };
  console.log("email sent!");

  await transporter.sendMail(mailOptions);
  return;
  }

}