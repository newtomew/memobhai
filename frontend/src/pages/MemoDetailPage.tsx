import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { commentsAPI, memosAPI, workflowAPI } from '../services/api';
import { useAuthStore } from '../store/auth';

export default function MemoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userId } = useAuthStore((s) => ({ userId: s.user?.id }));
  const [memo, setMemo] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [actionComment, setActionComment] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!id) return;
    const res = await memosAPI.get(id);
    setMemo(res.data.memo);
  };

  useEffect(() => {
    load().catch((err) => setError(err.response?.data?.error || 'Failed to load memo'));
  }, [id]);

  const pendingStep = memo?.workflowSteps?.find(
    (s: any) => s.status === 'pending' && s.userId === userId,
  );

  const runAction = async (fn: () => Promise<any>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      await load();
      setActionComment('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  if (!memo && !error) return <p className="text-gray-500">Memo details loading...</p>;
  if (!memo) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="text-sm text-gray-500">{memo.memoNumber}</p>
          <h1 className="text-3xl font-bold">{memo.subject}</h1>
          <p className="text-gray-500 mt-1 capitalize">
            {memo.status.replaceAll('_', ' ')} · {memo.priority} · {memo.department?.name}
          </p>
        </div>
        <Link to="/inbox" className="text-blue-600 hover:underline">
          Back
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-6 whitespace-pre-wrap">{memo.body}</div>

      {pendingStep && (
        <div className="bg-white rounded-lg shadow p-6 mb-6 space-y-4">
          <h2 className="text-xl font-bold">Your action</h2>
          <textarea
            value={actionComment}
            onChange={(e) => setActionComment(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Comment (required for reject / request changes)"
          />
          <div className="flex flex-wrap gap-2">
            <button
              disabled={busy}
              onClick={() => runAction(() => workflowAPI.approve(memo.id, actionComment))}
              className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
            >
              Approve
            </button>
            <button
              disabled={busy}
              onClick={() => runAction(() => workflowAPI.reject(memo.id, actionComment))}
              className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
            >
              Reject
            </button>
            <button
              disabled={busy}
              onClick={() => runAction(() => workflowAPI.requestChanges(memo.id, actionComment))}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg disabled:opacity-50"
            >
              Request changes
            </button>
            <button
              disabled={busy}
              onClick={() => runAction(() => workflowAPI.forward(memo.id))}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50"
            >
              Forward
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Comments</h2>
        <ul className="space-y-3 mb-4">
          {(memo.comments || []).map((c: any) => (
            <li key={c.id} className="border-b pb-2">
              <p className="text-sm font-medium">{c.author?.name}</p>
              <p>{c.text}</p>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg"
            placeholder="Add a comment"
          />
          <button
            disabled={busy || !comment.trim()}
            onClick={() =>
              runAction(async () => {
                await commentsAPI.add({ memoId: memo.id, text: comment });
                setComment('');
              })
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
