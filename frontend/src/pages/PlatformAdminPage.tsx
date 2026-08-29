import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { platformAPI } from '../services/api';
import { JoinRequestsTab } from './admin/AdminExtendedTabs';
import { Shield, Building2, Users, FileText, Ban, ChevronRight, ArrowLeft, UserPlus, ExternalLink } from 'lucide-react';
import clsx from 'clsx';

export default function PlatformAdminPage() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [tab, setTab] = useState<'managers' | 'employees' | 'memos' | 'activity'>('managers');
  const [view, setView] = useState<'orgs' | 'join-requests'>('orgs');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    platformAPI.listOrganizations()
      .then((res) => setOrgs(res.data.organizations || []))
      .catch(() => setError('Failed to load organizations'))
      .finally(() => setLoading(false));
  }, []);

  const openOrg = async (org: any) => {
    setSelectedOrg(org);
    setLoading(true);
    try {
      const res = await platformAPI.getOrganization(org.id);
      setDetail(res.data);
    } catch {
      setError('Failed to load organization details');
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (targetType: 'organization' | 'user' | 'memo', targetId: string, isBanned: boolean) => {
    try {
      if (isBanned) await platformAPI.unban(targetType, targetId);
      else await platformAPI.ban(targetType, targetId);
      if (selectedOrg) await openOrg(selectedOrg);
      else {
        const res = await platformAPI.listOrganizations();
        setOrgs(res.data.organizations || []);
      }
    } catch {
      setError('Action failed');
    }
  };

  if (view === 'join-requests') {
    return (
      <div className="slide-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-charcoal rounded-2xl flex items-center justify-center">
              <UserPlus size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-charcoal">Platform Join Approvals</h1>
              <p className="text-sm text-gray-400">Approve new organizations and manager signups</p>
            </div>
          </div>
          <button onClick={() => setView('orgs')} className="btn-secondary text-sm">Back to Organizations</button>
        </div>
        <JoinRequestsTab title="Platform Join Approvals (new orgs & managers)" />
      </div>
    );
  }

  if (selectedOrg && detail) {
    return (
      <div className="slide-up">
        <button onClick={() => { setSelectedOrg(null); setDetail(null); }} className="flex items-center gap-2 text-gray-400 text-sm mb-4 hover:text-charcoal">
          <ArrowLeft size={16} /> Back to organizations
        </button>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-charcoal rounded-2xl flex items-center justify-center">
              <Building2 size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-charcoal">{detail.organization.name}</h1>
              <p className="text-sm text-gray-400">{detail.organization.slug} · {detail.organization.status}</p>
            </div>
          </div>
          <button
            onClick={() => handleBan('organization', detail.organization.id, detail.organization.status === 'banned')}
            className={clsx('px-4 py-2 rounded-full text-sm font-medium', detail.organization.status === 'banned' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500')}
          >
            {detail.organization.status === 'banned' ? 'Unban Organization' : 'Ban Organization'}
          </button>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {(['managers', 'employees', 'memos', 'activity'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={clsx('px-5 py-2 text-sm font-medium capitalize rounded-full transition', tab === t ? 'bg-charcoal text-white' : 'bg-white text-gray-500 shadow-card')}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'managers' && <UserTable users={detail.managers} onBan={(id, banned) => handleBan('user', id, banned)} />}
        {tab === 'employees' && <UserTable users={detail.employees} onBan={(id, banned) => handleBan('user', id, banned)} />}
        {tab === 'memos' && (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100 text-left text-gray-400">
                <th className="px-5 py-3">Memo #</th><th className="px-5 py-3">Subject</th><th className="px-5 py-3">Author</th><th className="px-5 py-3">Status</th><th className="px-5 py-3"></th>
              </tr></thead>
              <tbody>
                {detail.memos.map((m: any) => (
                  <tr key={m.id} className="border-b border-gray-50">
                    <td className="px-5 py-3 font-mono text-xs">{m.memoNumber}</td>
                    <td className="px-5 py-3">{m.subject}</td>
                    <td className="px-5 py-3 text-gray-400">{m.author?.name}</td>
                    <td className="px-5 py-3 capitalize">{m.status}{m.isBlocked && ' (blocked)'}</td>
                    <td className="px-5 py-3 flex gap-3 items-center">
                      <Link to={`/memos/${m.id}`} className="text-xs text-accent-dark hover:underline flex items-center gap-1">
                        <ExternalLink size={12} /> View
                      </Link>
                      <Link to={`/memos/${m.id}?versions=1`} className="text-xs text-gray-500 hover:underline">
                        Versions
                      </Link>
                      <button onClick={() => handleBan('memo', m.id, m.isBlocked)} className="text-xs text-red-400 hover:text-red-600">
                        {m.isBlocked ? 'Unblock' : 'Block'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {tab === 'activity' && (
          <div className="space-y-2">
            {detail.activityLogs.map((log: any) => (
              <div key={log.id} className="card py-3 px-4 text-sm">
                <span className="font-medium text-charcoal">{log.event}</span>
                <span className="text-gray-400 ml-2">{log.description}</span>
                <span className="text-gray-300 text-xs ml-2">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="slide-up">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-charcoal rounded-2xl flex items-center justify-center">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-charcoal">MemoBhai Platform Admin</h1>
            <p className="text-sm text-gray-400">Manage all organizations, users, and memos</p>
          </div>
        </div>
        <button onClick={() => setView('join-requests')} className="btn-primary flex items-center gap-2">
          <UserPlus size={16} /> Join Approvals
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-500 px-4 py-3 rounded-2xl mb-4 text-sm">{error}</div>}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : (
        <div className="grid gap-3">
          {orgs.map((org) => (
            <button
              key={org.id}
              onClick={() => openOrg(org)}
              className="card flex items-center justify-between hover:shadow-card-hover transition text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-surface-muted rounded-2xl flex items-center justify-center">
                  <Building2 size={18} className="text-gray-400" />
                </div>
                <div>
                  <p className="font-semibold text-charcoal">{org.name}</p>
                  <p className="text-xs text-gray-400">{org.slug} · {org.status}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-xs text-gray-400">
                <span className="flex items-center gap-1"><Users size={12} />{org.managers}M / {org.employees}E</span>
                <span className="flex items-center gap-1"><FileText size={12} />{org.memoCount}</span>
                <ChevronRight size={16} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function UserTable({ users, onBan }: { users: any[]; onBan: (id: string, isBanned: boolean) => void }) {
  return (
    <div className="card p-0 overflow-hidden">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-gray-100 text-left text-gray-400">
          <th className="px-5 py-3">Name</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Status</th><th className="px-5 py-3"></th>
        </tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-gray-50">
              <td className="px-5 py-3 font-medium">{u.name}</td>
              <td className="px-5 py-3 text-gray-400">{u.email}</td>
              <td className="px-5 py-3 capitalize">{u.status}</td>
              <td className="px-5 py-3">
                <button onClick={() => onBan(u.id, u.status === 'banned')} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600">
                  <Ban size={12} />{u.status === 'banned' ? 'Unban' : 'Ban'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
