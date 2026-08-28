import { useState } from 'react';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';
import { User, Lock, Check } from 'lucide-react';
import { avatarColor } from '../lib/statusColors';

export default function ProfilePage() {
  const { user, organization } = useAuthStore();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const { error: err } = await supabase.auth.updateUser({ password: newPassword });
      if (err) throw err;
      setSuccess('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="slide-up max-w-2xl">
      <h1 className="text-2xl font-bold text-charcoal mb-6">My Profile</h1>

      <div className="card mb-6">
        <div className="flex items-center gap-5 mb-6">
          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-2xl font-bold ${avatarColor(user?.name)}`}>
            {user?.name?.[0]?.toUpperCase() || <User size={24} />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-charcoal">{user?.name}</h2>
            <p className="text-gray-400 text-sm">{user?.email}</p>
            <span className={`mt-2 inline-block ${user?.role === 'admin' ? 'badge-info' : 'badge-neutral'} capitalize`}>
              {user?.role}
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

      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 bg-surface-muted rounded-xl flex items-center justify-center">
            <Lock size={16} className="text-gray-500" />
          </div>
          <h2 className="text-lg font-bold text-charcoal">Change Password</h2>
        </div>

        {success && (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-3 rounded-2xl mb-4 text-sm">
            <Check size={16} /> {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 text-red-500 px-4 py-3 rounded-2xl mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1.5">New password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 8 characters" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1.5">Confirm new password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat your new password" className="input-field" />
          </div>
          <button type="submit" disabled={saving || !newPassword} className="btn-primary">
            {saving ? 'Saving...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
