import { useEffect, useState, useRef } from 'react';
import { messagesAPI } from '../services/api';
import { useAuthStore } from '../store/auth';
import { MessageCircle, Send, Search } from 'lucide-react';
import { avatarColor } from '../lib/statusColors';
import clsx from 'clsx';

export default function MessagesPage() {
  const { user } = useAuthStore();
  const [members, setMembers] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedPeer, setSelectedPeer] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadInbox = async () => {
    const res = await messagesAPI.list();
    setMembers(res.data.members || []);
    setConversations(res.data.conversations || []);
  };

  const loadThread = async (peerId: string) => {
    const res = await messagesAPI.thread(peerId);
    setSelectedPeer(res.data.peer);
    setMessages(res.data.messages || []);
  };

  useEffect(() => {
    loadInbox().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startChat = (member: any) => {
    setSelectedPeer(member);
    loadThread(member.id);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !selectedPeer) return;
    setSending(true);
    try {
      const res = await messagesAPI.send(selectedPeer.id, text.trim());
      setMessages((prev) => [...prev, res.data.message]);
      setText('');
      await loadInbox();
    } finally {
      setSending(false);
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return <div className="text-gray-400 text-sm">Loading messages...</div>;
  }

  return (
    <div className="slide-up h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-charcoal rounded-2xl flex items-center justify-center">
          <MessageCircle size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Messages</h1>
          <p className="text-sm text-gray-400">Direct messages with your team</p>
        </div>
      </div>

      <div className="card p-0 overflow-hidden flex h-full max-h-[640px]">
        {/* Sidebar */}
        <div className="w-72 border-r border-gray-100 flex flex-col">
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search members..."
                className="input-field pl-9 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredMembers.map((m) => {
              const conv = conversations.find((c) => c.peerId === m.id);
              return (
                <button
                  key={m.id}
                  onClick={() => startChat(m)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-muted transition',
                    selectedPeer?.id === m.id && 'bg-accent/20',
                  )}
                >
                  {m.avatarUrl ? (
                    <img src={m.avatarUrl} alt="" className="w-9 h-9 rounded-2xl object-cover" />
                  ) : (
                    <div className={clsx('w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-bold', avatarColor(m.name))}>
                      {m.name[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-charcoal text-sm truncate">{m.name}</p>
                    {conv && (
                      <p className="text-xs text-gray-400 truncate">{conv.lastMessage}</p>
                    )}
                  </div>
                  {conv?.unread > 0 && (
                    <span className="bg-accent text-charcoal text-xs font-bold px-2 py-0.5 rounded-full">
                      {conv.unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Thread */}
        <div className="flex-1 flex flex-col">
          {selectedPeer ? (
            <>
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
                {selectedPeer.avatarUrl ? (
                  <img src={selectedPeer.avatarUrl} alt="" className="w-8 h-8 rounded-xl object-cover" />
                ) : (
                  <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold', avatarColor(selectedPeer.name))}>
                    {selectedPeer.name[0]}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-charcoal text-sm">{selectedPeer.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{selectedPeer.role}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {messages.map((msg) => {
                  const mine = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={clsx('flex', mine ? 'justify-end' : 'justify-start')}>
                      <div
                        className={clsx(
                          'max-w-[75%] px-4 py-2.5 rounded-2xl text-sm',
                          mine ? 'bg-charcoal text-white rounded-br-md' : 'bg-surface-muted text-charcoal rounded-bl-md',
                        )}
                      >
                        {msg.body}
                        <p className={clsx('text-[10px] mt-1', mine ? 'text-gray-400' : 'text-gray-400')}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={handleSend} className="p-4 border-t border-gray-100 flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message..."
                  className="input-field flex-1"
                />
                <button type="submit" disabled={sending || !text.trim()} className="btn-primary px-4">
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Select a team member to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
