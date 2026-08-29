const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.OTP_FROM_EMAIL || 'MemoBhai <onboarding@resend.dev>';

const BRAND = {
  name: 'MemoBhai',
  tagline: 'Inter-Office Memo Management',
  accent: '#89B9F6',
  dark: '#1a1a2e',
};

function emailLayout(content: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
        <tr>
          <td style="background:${BRAND.dark};padding:28px 32px">
            <div style="display:flex;align-items:center;gap:12px">
              <div style="width:40px;height:40px;background:${BRAND.accent};border-radius:12px;display:flex;align-items:center;justify-content:center">
                <span style="color:${BRAND.dark};font-weight:800;font-size:18px">M</span>
              </div>
              <div>
                <p style="margin:0;color:#fff;font-size:20px;font-weight:700">${BRAND.name}</p>
                <p style="margin:2px 0 0;color:#9ca3af;font-size:12px">${BRAND.tagline}</p>
              </div>
            </div>
          </td>
        </tr>
        <tr><td style="padding:32px">${content}</td></tr>
        <tr>
          <td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb">
            <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center">
              © ${new Date().getFullYear()} ${BRAND.name} · memobhai.vercel.app
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendOtpEmail(to: string, code: string, purpose: string): Promise<void> {
  const subject =
    purpose === 'change_email'
      ? 'MemoBhai — Verify your new email'
      : 'MemoBhai — Password change verification';

  const purposeText =
    purpose === 'change_email'
      ? 'Use this code to confirm your new email address on MemoBhai.'
      : 'Use this code to confirm your password change on MemoBhai.';

  const html = emailLayout(`
    <h2 style="margin:0 0 8px;color:${BRAND.dark};font-size:18px">Verification Code</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.5">${purposeText}</p>
    <div style="background:#f3f4f6;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
      <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:${BRAND.accent}">${code}</span>
    </div>
    <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.5">
      This code expires in <strong>10 minutes</strong>. If you did not request this, you can safely ignore this email.
    </p>
  `);

  if (!RESEND_API_KEY) {
    console.log(`[OTP Email] To: ${to} | Code: ${code} | Purpose: ${purpose}`);
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to send email: ${err}`);
  }
}
