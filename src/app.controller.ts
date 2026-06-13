import { Controller, Get, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('accept-teacher-invite')
  async acceptTeacherInvite(@Query('id') id: string): Promise<string> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      return this.getErrorPageHtml(
        'Invalid Invitation Link',
        'The invitation link you followed is malformed. Please verify the link in your email and try again.',
      );
    }

    try {
      const invite = await this.prisma.teacherInvite.findUnique({
        where: { id },
        include: { institution: true },
      });

      if (!invite || invite.status !== 'INVITED') {
        return this.getErrorPageHtml(
          'Invitation Stale or Invalid',
          "This invitation has already been accepted, rejected, or has expired. If you've already created your account, you can safely log into the app.",
        );
      }

      const suggestedUsername = invite.fullName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 15);

      return this.getAcceptPageHtml(id, invite, suggestedUsername);
    } catch (err) {
      return this.getErrorPageHtml(
        'Database Connection Error',
        'We encountered a database error while looking up your invitation details. Please try again later.',
      );
    }
  }

  @Get('invitations')
  invitations(): string {
    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:8081';
    const webUrl = `${frontendUrl}/invitations`;
    const deepLink = `tinymindsapp://invitations`;
    const expoGoUrl = `exp://192.168.101.247:8081/--/invitations`;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Open Invitations | TinyMinds</title>
  <style>
    body {
      margin: 0; padding: 0;
      background: #EAF5FF;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh;
    }
    .card {
      max-width: 480px; width: 90%;
      background: #ffffff; border-radius: 28px; padding: 40px 32px;
      text-align: center; box-shadow: 0 12px 40px rgba(15, 95, 168, 0.12);
      box-sizing: border-box;
    }
    .logo { font-size: 40px; margin-bottom: 20px; }
    .title {
      font-size: 24px; font-weight: 800; color: #1A3A5C;
      margin-bottom: 12px; letter-spacing: -0.5px;
    }
    .sub {
      font-size: 15px; color: #7A9ABB; line-height: 1.6;
      margin-bottom: 32px; font-weight: 500;
    }
    .btn {
      display: flex; align-items: center; justify-content: center;
      height: 56px; border-radius: 999px;
      font-size: 16px; font-weight: 800; text-decoration: none;
      margin-bottom: 16px; transition: transform 0.15s ease, opacity 0.15s ease;
    }
    .btn:active { transform: scale(0.97); }
    .btn-primary {
      background: linear-gradient(135deg, #1A7FD4, #0F5FA8); color: #ffffff;
      box-shadow: 0 8px 20px rgba(26, 127, 212, 0.3);
    }
    .btn-secondary {
      background: #F0FAEF; color: #2E8B4A;
      border: 1.5px solid rgba(46, 139, 74, 0.15);
    }
    .btn-outline {
      background: #F8FAFB; color: #4A6785;
      border: 1.5px solid #E2E8F0;
    }
    .divider { height: 1px; background: #E5EDF5; margin: 24px 0; border: none; }
    .footer { font-size: 12px; color: #A0B5CC; font-weight: 500; }
  </style>
  <script>
    window.onload = function() {
      window.location.href = "${deepLink}";
    };
  </script>
</head>
<body>
  <div class="card">
    <div class="logo">🌱</div>
    <div class="title">Open Invitations</div>
    <div class="sub">Review your child's school invitations and accept them.</div>
    
    <a href="${deepLink}" class="btn btn-primary">Open in TinyMinds App</a>
    <a href="${expoGoUrl}" class="btn btn-secondary">Open in Expo Go</a>
    
    <hr class="divider" />
    
    <a href="${webUrl}" class="btn btn-outline">Open in Web Browser</a>
    
    <div class="footer">
      TinyMinds App • Learning made joyful
    </div>
  </div>
</body>
</html>
    `;
  }

  private getAcceptPageHtml(id: string, invite: any, suggestedUsername: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Accept Invitation | TinyMinds</title>
  <style>
    body {
      margin: 0; padding: 0;
      background: linear-gradient(135deg, #EBF3FC, #F1F7FE);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; color: #2C3E50;
    }
    .card {
      width: 100%; max-width: 460px; margin: 20px;
      background: #ffffff; border-radius: 24px; padding: 36px 30px;
      box-shadow: 0 10px 30px rgba(15, 95, 168, 0.08); box-sizing: border-box;
      transition: all 0.3s ease;
    }
    .logo { font-size: 44px; text-align: center; margin-bottom: 16px; }
    .school-tag {
      display: inline-block; background: #EAF5FF; color: #1A7FD4;
      font-size: 13px; font-weight: 700; padding: 6px 14px;
      border-radius: 20px; text-align: center; margin: 0 auto 16px auto;
    }
    .center { text-align: center; display: flex; flex-direction: column; align-items: center; }
    .title {
      font-size: 22px; font-weight: 800; color: #1A3A5C;
      margin-bottom: 8px; letter-spacing: -0.5px; text-align: center;
    }
    .sub {
      font-size: 14px; color: #7A9ABB; line-height: 1.5;
      margin-bottom: 28px; text-align: center; font-weight: 500;
    }
    .form-group { margin-bottom: 18px; text-align: left; }
    .label {
      display: block; font-size: 13px; font-weight: 700;
      color: #4A6785; margin-bottom: 6px;
    }
    .input {
      width: 100%; height: 50px; border-radius: 12px;
      border: 1.5px solid #E2E8F0; background: #F8FAFB;
      padding: 0 16px; font-size: 15px; color: #1A3A5C;
      font-weight: 600; box-sizing: border-box; outline: none;
      transition: all 0.2s ease;
    }
    .input:focus {
      border-color: #1A7FD4; background: #ffffff;
      box-shadow: 0 0 0 3px rgba(26, 127, 212, 0.12);
    }
    .input[readonly] {
      background: #EDF2F7; border-color: #E2E8F0;
      color: #718096; cursor: not-allowed;
    }
    .btn {
      width: 100%; height: 52px; border-radius: 999px;
      font-size: 16px; font-weight: 800; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s ease;
    }
    .btn-primary {
      background: linear-gradient(135deg, #1A7FD4, #0F5FA8); color: #ffffff;
      box-shadow: 0 6px 16px rgba(26, 127, 212, 0.25);
    }
    .btn-primary:active { transform: scale(0.97); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .error-box {
      background: #FFF0F0; border-left: 4px solid #D63E6A;
      border-radius: 10px; padding: 12px; font-size: 13px;
      font-weight: 600; color: #D63E6A; margin-bottom: 20px;
      display: none; text-align: left;
    }
    .success-container { display: none; text-align: center; }
    .success-icon {
      width: 72px; height: 72px; border-radius: 50%;
      background: #F0FAEF; display: flex; align-items: center;
      justify-content: center; margin: 0 auto 20px auto;
    }
    .success-icon svg { width: 36px; height: 36px; color: #2E8B4A; }
    .divider { height: 1px; background: #E5EDF5; margin: 24px 0; border: none; }
    .footer { font-size: 12px; color: #A0B5CC; text-align: center; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="card" id="main-card">
    <div class="logo">🏫</div>
    <div class="center">
      <div class="school-tag">${invite.institution.name}</div>
      <div class="title">Join as a Teacher</div>
      <div class="sub">Set up your username and password to accept the invitation and join your school's workspace.</div>
    </div>

    <div class="error-box" id="error-alert"></div>

    <form id="invite-form" onsubmit="submitForm(event)">
      <div class="form-group">
        <label class="label">Full Name</label>
        <input type="text" class="input" value="${invite.fullName}" readonly />
      </div>
      <div class="form-group">
        <label class="label">Email Address</label>
        <input type="text" class="input" value="${invite.email}" readonly />
      </div>
      <div class="form-group">
        <label class="label">Create Username</label>
        <input type="text" id="username" class="input" value="${suggestedUsername}" required />
      </div>
      <div class="form-group">
        <label class="label">Create Password (Min 8 characters)</label>
        <input type="password" id="password" class="input" placeholder="Create password" required minlength="8" />
      </div>

      <button type="submit" id="submit-btn" class="btn btn-primary" style="margin-top: 24px;">
        Accept Invitation & Create Account
      </button>
    </form>

    <div class="footer">
      TinyMinds • Teacher Portal
    </div>
  </div>

  <div class="card success-container" id="success-card">
    <div class="success-icon">
      <svg fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    </div>
    <div class="title">Welcome Aboard!</div>
    <div class="sub">
      You have successfully accepted the invitation and created your teacher account.
    </div>
    
    <div style="background: #F8FAFB; border: 1.5px solid #E2E8F0; border-radius: 16px; padding: 20px; text-align: left; margin-bottom: 24px;">
      <div style="font-size: 14px; font-weight: 700; color: #1A3A5C; margin-bottom: 6px;">Your Login Details:</div>
      <div style="font-size: 13px; color: #4A6785; margin-bottom: 4px;"><strong>Email:</strong> ${invite.email}</div>
      <div style="font-size: 13px; color: #4A6785;"><strong>Username:</strong> <span id="display-username"></span></div>
    </div>

    <div style="font-size: 14px; font-weight: 600; color: #7A9ABB; line-height: 1.6;">
      Download and open the <strong>TinyMinds app</strong> on your mobile device, and log in with your email/username and password.
    </div>

    <hr class="divider" />
    
    <a href="tinymindsapp://" class="btn btn-primary">Open TinyMinds App</a>

    <div class="footer">
      TinyMinds App • Learning made joyful
    </div>
  </div>

  <script>
    async function submitForm(e) {
      e.preventDefault();
      const errBox = document.getElementById('error-alert');
      const submitBtn = document.getElementById('submit-btn');
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;

      errBox.style.display = 'none';

      if (!username || password.length < 8) {
        errBox.textContent = 'Please fill in all fields correctly.';
        errBox.style.display = 'block';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating account...';

      try {
        const res = await fetch('/teacher-invite/${id}/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await res.json();
        
        if (res.ok) {
          document.getElementById('display-username').textContent = username;
          document.getElementById('main-card').style.display = 'none';
          document.getElementById('success-card').style.display = 'block';
        } else {
          errBox.textContent = data.message || 'Failed to accept invitation. Please try again.';
          errBox.style.display = 'block';
        }
      } catch (err) {
        errBox.textContent = 'Network error. Please try again.';
        errBox.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Accept Invitation & Create Account';
      }
    }
  </script>
</body>
</html>
    `;
  }

  private getErrorPageHtml(title: string, sub: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title} | TinyMinds</title>
  <style>
    body {
      margin: 0; padding: 0;
      background: #EAF5FF;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh;
    }
    .card {
      max-width: 440px; width: 90%;
      background: #ffffff; border-radius: 24px; padding: 40px 32px;
      text-align: center; box-shadow: 0 10px 30px rgba(15, 95, 168, 0.08);
      box-sizing: border-box;
    }
    .logo { font-size: 44px; margin-bottom: 16px; }
    .title {
      font-size: 22px; font-weight: 800; color: #1A3A5C;
      margin-bottom: 12px; letter-spacing: -0.5px;
    }
    .sub {
      font-size: 14px; color: #7A9ABB; line-height: 1.6;
      margin-bottom: 24px; font-weight: 500;
    }
    .btn {
      display: flex; align-items: center; justify-content: center;
      height: 52px; border-radius: 999px;
      font-size: 15px; font-weight: 800; text-decoration: none;
      transition: all 0.2s ease;
    }
    .btn-primary {
      background: linear-gradient(135deg, #1A7FD4, #0F5FA8); color: #ffffff;
      box-shadow: 0 6px 16px rgba(26, 127, 212, 0.25);
    }
    .footer { font-size: 11px; color: #A0B5CC; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">⚠️</div>
    <div class="title">${title}</div>
    <div class="sub">${sub}</div>
    <a href="tinymindsapp://" class="btn btn-primary">Open TinyMinds App</a>
    <div class="footer">
      TinyMinds App • Learning made joyful
    </div>
  </div>
</body>
</html>
    `;
  }
}
