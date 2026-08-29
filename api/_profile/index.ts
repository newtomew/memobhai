import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withAuth } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import { supabaseAdmin } from '../_lib/supabase';
import { apiHandler } from '../_lib/handler';
import { generateOtpCode, hashOtp, verifyOtp } from '../_lib/crypto';
import { sendOtpEmail } from '../_lib/email';

const OTP_TTL_MS = 10 * 60 * 1000;

export default apiHandler(
  withAuth(async (ctx, req, res) => {
    if (req.method === 'PUT' && req.body?.action === 'avatar') {
      const { fileData, mimeType } = req.body as { fileData?: string; mimeType?: string };
      if (!fileData || !mimeType?.startsWith('image/')) {
        return res.status(400).json({ error: 'Valid image file required' });
      }

      const ext = mimeType.split('/')[1] || 'jpg';
      const path = `${ctx.organizationId}/${ctx.userId}.${ext}`;
      const buffer = Buffer.from(fileData, 'base64');

      const { error: uploadError } = await supabaseAdmin.storage
        .from('avatars')
        .upload(path, buffer, { upsert: true, contentType: mimeType });

      if (uploadError) {
        return res.status(500).json({ error: uploadError.message || 'Avatar upload failed' });
      }

      const { data: urlData } = supabaseAdmin.storage.from('avatars').getPublicUrl(path);
      const avatarUrl = urlData.publicUrl;

      await prisma.user.update({ where: { id: ctx.userId }, data: { avatarUrl } });

      return res.json({ avatarUrl });
    }

    if (req.method === 'POST' && req.body?.action === 'request-otp') {
      const { purpose, newEmail, newPassword } = req.body as {
        purpose?: string;
        newEmail?: string;
        newPassword?: string;
      };

      if (purpose !== 'change_email' && purpose !== 'change_password') {
        return res.status(400).json({ error: 'Invalid purpose' });
      }

      if (purpose === 'change_email') {
        if (!newEmail) return res.status(400).json({ error: 'newEmail is required' });
        const taken = await prisma.user.findFirst({ where: { email: newEmail } });
        if (taken) return res.status(400).json({ error: 'Email already in use' });
      }

      if (purpose === 'change_password' && (!newPassword || newPassword.length < 8)) {
        return res.status(400).json({ error: 'newPassword must be at least 8 characters' });
      }

      const code = generateOtpCode();
      const codeHash = hashOtp(code);
      const expiresAt = new Date(Date.now() + OTP_TTL_MS);

      await prisma.otpVerification.updateMany({
        where: { userId: ctx.userId, purpose, used: false },
        data: { used: true },
      });

      await prisma.otpVerification.create({
        data: {
          userId: ctx.userId,
          email: ctx.email,
          codeHash,
          purpose,
          payload: purpose === 'change_email' ? JSON.stringify({ newEmail }) : JSON.stringify({ newPassword }),
          expiresAt,
        },
      });

      await sendOtpEmail(ctx.email, code, purpose);

      return res.json({ success: true, message: 'Verification code sent to your email' });
    }

    if (req.method === 'POST' && req.body?.action === 'verify-otp') {
      const { purpose, code } = req.body as { purpose?: string; code?: string };
      if (!purpose || !code) {
        return res.status(400).json({ error: 'purpose and code are required' });
      }

      const otp = await prisma.otpVerification.findFirst({
        where: { userId: ctx.userId, purpose, used: false },
        orderBy: { createdAt: 'desc' },
      });

      if (!otp || otp.expiresAt < new Date()) {
        return res.status(400).json({ error: 'OTP expired or not found' });
      }

      if (!verifyOtp(code, otp.codeHash)) {
        return res.status(400).json({ error: 'Invalid verification code' });
      }

      const payload = otp.payload ? JSON.parse(otp.payload) : {};

      if (purpose === 'change_email' && payload.newEmail) {
        await supabaseAdmin.auth.admin.updateUserById(ctx.authId, { email: payload.newEmail });
        await prisma.user.update({
          where: { id: ctx.userId },
          data: { email: payload.newEmail },
        });
      }

      if (purpose === 'change_password' && payload.newPassword) {
        await supabaseAdmin.auth.admin.updateUserById(ctx.authId, { password: payload.newPassword });
      }

      await prisma.otpVerification.update({ where: { id: otp.id }, data: { used: true } });

      return res.json({ success: true, message: 'Profile updated successfully' });
    }

    if (req.method === 'PUT' && req.body?.action === 'profile') {
      const { name, designation } = req.body as { name?: string; designation?: string };
      const user = await prisma.user.update({
        where: { id: ctx.userId },
        data: {
          ...(name !== undefined && { name }),
          ...(designation !== undefined && { designation }),
        },
      });
      return res.json({ user: { id: user.id, name: user.name, designation: user.designation, email: user.email } });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }),
);
