import { useState, useRef } from 'react';
import { useAuthStore } from '../store/auth';
import { profileAPI } from '../services/api';
import { User, Lock, Mail, Camera, Check } from 'lucide-react';
import { avatarColor } from '../lib/statusColors';

export default function ProfilePage() {
  const { user, organization, updateUser } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpPurpose, setOtpPurpose] = useState<'change_email' | 'change_password' | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [designation, setDesignation] = useState(user?.designation || '');
  const [saving, setSaving] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setError('');
    try {
      await profileAPI.updateProfile({ designation });
      updateUser({ designation });
      setSuccess('Profile updated');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    setError('');
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await profileAPI.uploadAvatar(base64, file.type);
      updateUser({ avatarUrl: res.data.avatarUrl });
      setSuccess('Profile picture updated');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload avatar');
    } finally {
      setSaving(false);
    }
  };

  const requestOtp = async (purpose: 'change_email' | 'change_password') => {
    setError('');
    setSuccess('');
    if (purpose === 'change_email' && !newEmail) {
      setError('Enter a new email address');
      return;
    }
    if (purpose === 'change_password') {
      if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
      if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    }
    setSaving(true);
    try {
      await profileAPI.requestOtp(purpose, {
        newEmail: purpose === 'change_email' ? newEmail : undefined,
        newPassword: purpose === 'change_password' ? newPassword : undefined,
      });
      setOtpPurpose(purpose);
      setOtpSent(true);
      setSuccess('Verification code sent to your email');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send verification code');
    } finally {
      setSaving(false);
    }
  };

  const verifyOtp = async () => {
    if (!otpPurpose || !otpCode) return;
    setSaving(true);
    setError('');
    try {
      await profileAPI.verifyOtp(otpPurpose, otpCode);
      if (otpPurpose === 'change_email') {
        updateUser({ email: newEmail });
        setNewEmail('');
      } else {
        setNewPassword('');
        setConfirmPassword('');
      }
      setOtpSent(false);
      setOtpPurpose(null);
      setOtpCode('');
      setSuccess('Updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="slide-up max-w-2xl">
      <h1 className="text-2xl font-bold text-charcoal mb-6">My Profile</h1>

      <div className="card mb-6">
        <div className="flex items-center gap-5 mb-6">
          <div className="relative">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-16 h-16 rounded-3xl object-cover" />
            ) : (
              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-2xl font-bold ${avatarColor(user?.name)}`}>
                {user?.name?.[0]?.toUpperCase() || <User size={24} />}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-charcoal rounded-xl flex items-center justify-center text-white"
            >
              <Camera size={12} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-charcoal">{user?.name}</h2>
            <p className="text-gray-400 text-sm">{user?.email}</p>
            <span className={`mt-2 inline-block ${user?.role === 'admin' ? 'badge-info' : 'badge-neutral'} capitalize`}>
              {user?.role === 'admin' ? 'Manager' : 'Employee'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-surface-muted rounded-3xl p-4">
            <p className="text-gray-400 text-xs mb-1">Organization</p>
            <p className="font-semibold text-charcoal">{organization?.name || '—'}</p>
          </div>
          <div className="bg-surface-muted rounded-3xl p-4">
            <p className="text-gray-400 text-xs mb-1">Org Identifier</p>
            <p className="font-semibold text-charcoal">{organization?.slug || '—'}</p>
          </div>
        </div>
      </div>

      {(success || error) && (
        <div className={`mb-4 px-4 py-3 rounded-2xl text-sm ${success ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
          {success && <span className="flex items-center gap-2"><Check size={16} />{success}</span>}
          {error && error}
        </div>
      )}

      <div className="card mb-6">
        <h2 className="text-lg font-bold text-charcoal mb-4">Job Details</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1.5">Designation / Job Title</label>
            <input
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="e.g. Software Engineer"
              className="input-field"
            />
          </div>
          <button onClick={handleSaveProfile} disabled={savingProfile} className="btn-primary">
            {savingProfile ? 'Saving...' : 'Save Designation'}
          </button>
        </div>
      </div>

      {/* Change Email */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 bg-surface-muted rounded-xl flex items-center justify-center">
            <Mail size={16} className="text-gray-500" />
          </div>
          <h2 className="text-lg font-bold text-charcoal">Change Email</h2>
        </div>
        <div className="space-y-3">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="New email address"
            className="input-field"
          />
          {!otpSent || otpPurpose !== 'change_email' ? (
            <button onClick={() => requestOtp('change_email')} disabled={saving} className="btn-primary">
              Send Verification Code
            </button>
          ) : (
            <OtpVerify code={otpCode} setCode={setOtpCode} onVerify={verifyOtp} saving={saving} />
          )}
        </div>
      </div>

      {/* Change Password */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 bg-surface-muted rounded-xl flex items-center justify-center">
            <Lock size={16} className="text-gray-500" />
          </div>
          <h2 className="text-lg font-bold text-charcoal">Change Password</h2>
        </div>
        <div className="space-y-3">
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" className="input-field" />
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="input-field" />
          {!otpSent || otpPurpose !== 'change_password' ? (
            <button onClick={() => requestOtp('change_password')} disabled={saving} className="btn-primary">
              Send Verification Code
            </button>
          ) : (
            <OtpVerify code={otpCode} setCode={setOtpCode} onVerify={verifyOtp} saving={saving} />
          )}
        </div>
      </div>
    </div>
  );
}

function OtpVerify({
  code, setCode, onVerify, saving,
}: {
  code: string; setCode: (v: string) => void; onVerify: () => void; saving: boolean;
}) {
  return (
    <div className="flex gap-2">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="6-digit code"
        maxLength={6}
        className="input-field flex-1"
      />
      <button onClick={onVerify} disabled={saving || code.length < 6} className="btn-primary px-5">
        Verify
      </button>
    </div>
  );
}
