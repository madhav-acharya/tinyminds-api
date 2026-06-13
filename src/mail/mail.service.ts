import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface TeacherInviteMailOptions {
  toEmail: string;
  toName: string;
  institutionName: string;
  inviteId: string;
}

export interface LearnerInviteMailOptions {
  toEmail: string;
  toName: string;
  institutionName: string;
  learnerUsername: string;
  inviteId: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.config.get<string>('MAIL_USER'),
        pass: this.config.get<string>('MAIL_PASS'),
      },
    });
  }

  async sendTeacherInvite(opts: TeacherInviteMailOptions): Promise<void> {
    const baseUrl = this.config.get<string>('APP_BASE_URL') ?? 'http://localhost:8081';
    const acceptLink = `${baseUrl}/accept-teacher-invite?id=${opts.inviteId}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    body { margin:0; padding:0; background:#EAF5FF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width:560px; margin:40px auto; background:#fff; border-radius:24px; overflow:hidden; box-shadow:0 8px 32px rgba(26,63,100,0.12); }
    .header { background:linear-gradient(135deg,#0F5FA8,#1A7FD4); padding:40px 32px 32px; text-align:center; }
    .header-logo { font-size:32px; font-weight:900; color:#fff; letter-spacing:-1px; }
    .header-sub  { color:rgba(255,255,255,0.80); font-size:14px; margin-top:6px; }
    .body   { padding:36px 32px; }
    .greeting { font-size:22px; font-weight:800; color:#1A3A5C; margin-bottom:8px; }
    .message  { font-size:15px; color:#4A6785; line-height:1.7; }
    .institution-badge { display:inline-block; background:#EAF5FF; color:#1A7FD4; font-weight:700; font-size:14px; padding:8px 18px; border-radius:999px; margin:20px 0; }
    .btn { display:block; width:fit-content; margin:28px auto 0; background:linear-gradient(135deg,#1A7FD4,#0F5FA8); color:#fff; text-decoration:none; padding:16px 48px; border-radius:999px; font-size:16px; font-weight:800; letter-spacing:0.3px; }
    .divider { border:none; border-top:1px solid #E5EDF5; margin:28px 0; }
    .link-fallback { font-size:12px; color:#7A9ABB; word-break:break-all; }
    .footer { background:#F8FAFB; padding:20px 32px; text-align:center; font-size:12px; color:#A0B5CC; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="header-logo">🎓 TinyMinds</div>
      <div class="header-sub">Learning made joyful</div>
    </div>
    <div class="body">
      <div class="greeting">Hello, ${opts.toName}!</div>
      <p class="message">
        You have been invited to join <strong>${opts.institutionName}</strong> as a <strong>Teacher</strong> on TinyMinds.
        Click the button below to set up your account and get started.
      </p>
      <div class="institution-badge">🏫 ${opts.institutionName}</div>
      <a class="btn" href="${acceptLink}">Accept Invitation →</a>
      <hr class="divider" />
      <p class="link-fallback">
        If the button doesn't work, paste this link in your browser:<br/>
        ${acceptLink}
      </p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} TinyMinds. If you didn't expect this email, you can safely ignore it.
    </div>
  </div>
</body>
</html>`;

    await this.send({
      to: `${opts.toName} <${opts.toEmail}>`,
      subject: `🎓 You're invited to teach at ${opts.institutionName} – TinyMinds`,
      html,
    });
  }

  async sendLearnerInvite(opts: LearnerInviteMailOptions): Promise<void> {
    const baseUrl = this.config.get<string>('APP_BASE_URL') ?? 'http://localhost:8081';
    const appLink = `${baseUrl}/invitations`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    body { margin:0; padding:0; background:#F0FAEF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width:560px; margin:40px auto; background:#fff; border-radius:24px; overflow:hidden; box-shadow:0 8px 32px rgba(30,100,60,0.10); }
    .header { background:linear-gradient(135deg,#1E6B3C,#2E8B4A); padding:40px 32px 32px; text-align:center; }
    .header-logo { font-size:32px; font-weight:900; color:#fff; letter-spacing:-1px; }
    .header-sub  { color:rgba(255,255,255,0.80); font-size:14px; margin-top:6px; }
    .body   { padding:36px 32px; }
    .greeting { font-size:22px; font-weight:800; color:#1A3A2C; margin-bottom:8px; }
    .message  { font-size:15px; color:#4A6750; line-height:1.7; }
    .info-box { background:#F0FAEF; border-radius:16px; padding:20px 24px; margin:20px 0; }
    .info-row { display:flex; justify-content:space-between; font-size:14px; padding:4px 0; }
    .info-label { color:#7A9A7B; font-weight:600; }
    .info-val   { color:#1A3A2C; font-weight:800; }
    .btn { display:block; width:fit-content; margin:28px auto 0; background:linear-gradient(135deg,#2E8B4A,#1E6B3C); color:#fff; text-decoration:none; padding:16px 48px; border-radius:999px; font-size:16px; font-weight:800; }
    .divider { border:none; border-top:1px solid #E5F0E5; margin:28px 0; }
    .footer { background:#F8FAFB; padding:20px 32px; text-align:center; font-size:12px; color:#A0B5A0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="header-logo">🌱 TinyMinds</div>
      <div class="header-sub">Learning made joyful</div>
    </div>
    <div class="body">
      <div class="greeting">Hello, ${opts.toName}!</div>
      <p class="message">
        Your child has been invited to join <strong>${opts.institutionName}</strong> on TinyMinds.
        Open the app and go to your <strong>Invitations</strong> to accept and create your child's account.
      </p>
      <div class="info-box">
        <div class="info-row"><span class="info-label">School</span><span class="info-val">${opts.institutionName}</span></div>
        <div class="info-row"><span class="info-label">Child's Username</span><span class="info-val">@${opts.learnerUsername}</span></div>
      </div>
      <a class="btn" href="${appLink}">Open Invitations →</a>
      <hr class="divider" />
      <p style="font-size:13px;color:#7A9A7B;">
        You will need to be logged into the TinyMinds app to accept this invitation.
      </p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} TinyMinds. If you didn't expect this email, you can safely ignore it.
    </div>
  </div>
</body>
</html>`;

    await this.send({
      to: `${opts.toName} <${opts.toEmail}>`,
      subject: `🌱 Your child has been invited to ${opts.institutionName} – TinyMinds`,
      html,
    });
  }

  private async send(opts: { to: string; subject: string; html: string }) {
    try {
      const info = await this.transporter.sendMail({
        from: this.config.get<string>('MAIL_FROM'),
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      });
      this.logger.log(`Email sent: ${info.messageId} → ${opts.to}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${opts.to}`, err);
      throw err;
    }
  }
}
