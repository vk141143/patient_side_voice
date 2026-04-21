import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, Search, RefreshCw, Users, Stethoscope, User, Bell, Edit2, Trash2, X, Check } from 'lucide-react';

type TargetType = 'all_users' | 'all_doctors' | 'user' | 'doctor';

export function NotificationsAdminPage() {
  // Send form
  const [targetType, setTargetType] = useState<TargetType>('all_users');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [notifType, setNotifType] = useState('info');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Individual target search
  const [targetSearch, setTargetSearch] = useState('');
  const [targetResults, setTargetResults] = useState<any[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<any | null>(null);
  const [searching, setSearching] = useState(false);

  // History
  const [history, setHistory] = useState<any[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<any[]>([]);
  const [histSearch, setHistSearch] = useState('');
  const [histTypeFilter, setHistTypeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [spinning, setSpinning] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchHistory = async () => {
    const { data } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false });
    setHistory(data ?? []);
    setLoadingHistory(false);
  };

  useEffect(() => {
    fetchHistory();
    const sub = supabase.channel('notif_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_notifications' },
        (payload) => setHistory(prev => [payload.new as any, ...prev]))
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  useEffect(() => {
    const q = histSearch.toLowerCase();
    let result = history.filter(n => {
      const matchSearch = !q || n.title?.toLowerCase().includes(q) || n.message?.toLowerCase().includes(q) || n.target_name?.toLowerCase().includes(q);
      const matchType = histTypeFilter === 'all' || n.target_type === histTypeFilter;
      return matchSearch && matchType;
    });
    result = [...result].sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? db - da : da - db;
    });
    setFilteredHistory(result);
  }, [histSearch, histTypeFilter, sortOrder, history]);

  // Search users or doctors for individual send
  useEffect(() => {
    if (!targetSearch.trim() || (targetType !== 'user' && targetType !== 'doctor')) {
      setTargetResults([]); return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      const q = `%${targetSearch}%`;
      if (targetType === 'user') {
        const { data } = await supabase.from('users').select('id, name, email, phone')
          .or(`name.ilike.${q},email.ilike.${q},phone.ilike.${q}`).limit(8);
        setTargetResults(data ?? []);
      } else {
        const { data } = await supabase.from('doctors').select('firebase_uid, full_name, email, specialization')
          .or(`full_name.ilike.${q},email.ilike.${q}`).limit(8);
        setTargetResults(data ?? []);
      }
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [targetSearch, targetType]);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    if ((targetType === 'user' || targetType === 'doctor') && !selectedTarget) return;
    setSending(true);

    const payload: any = {
      target_type: targetType,
      title: title.trim(),
      message: message.trim(),
      type: notifType,
      sent_by: 'admin',
    };

    if (targetType === 'user' && selectedTarget) {
      payload.target_id = selectedTarget.id;
      payload.target_name = selectedTarget.name || selectedTarget.email;
    } else if (targetType === 'doctor' && selectedTarget) {
      payload.target_id = selectedTarget.firebase_uid;
      payload.target_name = selectedTarget.full_name;
    } else if (targetType === 'all_users') {
      payload.target_name = 'All Users';
    } else {
      payload.target_name = 'All Doctors';
    }

    await supabase.from('admin_notifications').insert(payload);
    setSending(false);
    setSent(true);
    setTitle(''); setMessage(''); setSelectedTarget(null); setTargetSearch('');
    setTimeout(() => setSent(false), 2000);
  };

  const handleRefresh = () => { setSpinning(true); fetchHistory(); setTimeout(() => setSpinning(false), 800); };

  const handleEdit = (n: any) => { setEditItem(n); setEditTitle(n.title); setEditMessage(n.message); };

  const handleEditSave = async () => {
    if (!editItem || !editTitle.trim() || !editMessage.trim()) return;
    setEditSaving(true);
    await supabase.from('admin_notifications').update({ title: editTitle.trim(), message: editMessage.trim() }).eq('id', editItem.id);
    setHistory(prev => prev.map(n => n.id === editItem.id ? { ...n, title: editTitle.trim(), message: editMessage.trim() } : n));
    setEditItem(null);
    setEditSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('admin_notifications').delete().eq('id', id);
    setHistory(prev => prev.filter(n => n.id !== id));
    setDeleteId(null);
  };

  const targetTypeBadge = (t: string) => {
    const map: Record<string, string> = {
      all_users:   'bg-blue-500/10 text-blue-400',
      all_doctors: 'bg-teal-500/10 text-teal-400',
      user:        'bg-purple-500/10 text-purple-400',
      doctor:      'bg-green-500/10 text-green-400',
    };
    const labels: Record<string, string> = {
      all_users: 'All Users', all_doctors: 'All Doctors', user: 'User', doctor: 'Doctor'
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[t] ?? 'bg-gray-700 text-gray-400'}`}>{labels[t] ?? t}</span>;
  };

  const typeBadge = (t: string) => {
    const map: Record<string, string> = {
      info:     'bg-blue-500/10 text-blue-400',
      alert:    'bg-red-500/10 text-red-400',
      promo:    'bg-yellow-500/10 text-yellow-400',
      reminder: 'bg-orange-500/10 text-orange-400',
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[t] ?? 'bg-gray-700 text-gray-400'}`}>{t}</span>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Send Notification Panel */}
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Bell className="w-5 h-5 text-teal-400" /> Send Notification
        </h2>

        {/* Target type selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {([
            { id: 'all_users',   label: 'All Users',    icon: Users },
            { id: 'all_doctors', label: 'All Doctors',  icon: Stethoscope },
            { id: 'user',        label: 'Individual User',   icon: User },
            { id: 'doctor',      label: 'Individual Doctor', icon: Stethoscope },
          ] as const).map(opt => (
            <button key={opt.id} onClick={() => { setTargetType(opt.id); setSelectedTarget(null); setTargetSearch(''); }}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                targetType === opt.id ? 'border-teal-500 bg-teal-500/10 text-teal-400' : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
              }`}>
              <opt.icon className="w-4 h-4" />
              {opt.label}
            </button>
          ))}
        </div>

        {/* Individual search */}
        {(targetType === 'user' || targetType === 'doctor') && (
          <div className="relative">
            <div className="flex items-center gap-3 bg-gray-900 border border-gray-700 rounded-xl px-4 h-11">
              <Search className="w-4 h-4 text-gray-400" />
              <input value={targetSearch} onChange={e => { setTargetSearch(e.target.value); setSelectedTarget(null); }}
                placeholder={`Search ${targetType === 'user' ? 'user by name/email/phone' : 'doctor by name/email'}...`}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 outline-none" />
              {searching && <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />}
            </div>
            {targetResults.length > 0 && !selectedTarget && (
              <div className="absolute top-12 left-0 right-0 z-20 bg-gray-900 border border-gray-700 rounded-xl overflow-hidden shadow-xl">
                {targetResults.map(r => (
                  <button key={r.id ?? r.firebase_uid} onClick={() => { setSelectedTarget(r); setTargetResults([]); setTargetSearch(r.name ?? r.full_name ?? r.email); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-left border-b border-gray-800 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-teal-400">{(r.name ?? r.full_name ?? 'U').charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">{r.name ?? r.full_name}</p>
                      <p className="text-xs text-gray-500">{r.email}{r.specialization ? ` · ${r.specialization}` : ''}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {selectedTarget && (
              <div className="mt-2 flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 rounded-xl px-4 py-2">
                <div className="w-7 h-7 rounded-full bg-teal-500/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-teal-400">{(selectedTarget.name ?? selectedTarget.full_name ?? 'U').charAt(0)}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-teal-400 font-medium">{selectedTarget.name ?? selectedTarget.full_name}</p>
                  <p className="text-xs text-gray-500">{selectedTarget.email}</p>
                </div>
                <button onClick={() => { setSelectedTarget(null); setTargetSearch(''); }} className="text-gray-500 hover:text-white text-xs">✕</button>
              </div>
            )}
          </div>
        )}

        {/* Notification type */}
        <div className="flex gap-2 flex-wrap">
          {['info', 'alert', 'promo', 'reminder'].map(t => (
            <button key={t} onClick={() => setNotifType(t)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all border ${
                notifType === t ? 'border-teal-500 bg-teal-500/10 text-teal-400' : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
              }`}>{t}</button>
          ))}
        </div>

        {/* Title + Message */}
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Notification title..."
          className="w-full h-11 px-4 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm outline-none focus:border-teal-500" />
        <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Notification message..."
          className="w-full h-24 px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm outline-none focus:border-teal-500 resize-none" />

        <button onClick={handleSend}
          disabled={!title.trim() || !message.trim() || sending || ((targetType === 'user' || targetType === 'doctor') && !selectedTarget)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500 text-white text-sm font-semibold hover:bg-teal-400 transition-colors disabled:opacity-50">
          <Send className="w-4 h-4" />
          {sending ? 'Sending...' : sent ? '✓ Sent!' : 'Send Notification'}
        </button>
      </div>

      {/* History */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-base font-bold text-white flex-1">Notification History ({filteredHistory.length})</h2>
          <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-xl px-4 h-11 min-w-[200px]">
            <Search className="w-4 h-4 text-gray-400" />
            <input value={histSearch} onChange={e => setHistSearch(e.target.value)} placeholder="Search notifications..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 outline-none" />
          </div>
          <select value={histTypeFilter} onChange={e => setHistTypeFilter(e.target.value)}
            className="h-11 px-3 rounded-xl bg-gray-800 border border-gray-700 text-sm text-gray-300 outline-none">
            <option value="all">All Targets</option>
            <option value="all_users">All Users</option>
            <option value="all_doctors">All Doctors</option>
            <option value="user">Individual User</option>
            <option value="doctor">Individual Doctor</option>
          </select>
          <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}
            className="h-11 px-3 rounded-xl bg-gray-800 border border-gray-700 text-sm text-gray-300 outline-none">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
          <button onClick={handleRefresh} className="h-11 px-4 rounded-xl bg-gray-800 border border-gray-700 text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors">
            <RefreshCw className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        <div className="bg-gray-800 rounded-2xl border border-gray-700">
          <div className="overflow-auto" style={{ maxHeight: '50vh', scrollbarWidth: 'thin', scrollbarColor: '#4B5563 #1F2937' }}>
            <table style={{ minWidth: '900px', width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#1F2937', zIndex: 10 }}>
                <tr className="border-b border-gray-700">
                  {['Target', 'Recipient', 'Type', 'Title', 'Message', 'Sent At', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loadingHistory ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center"><div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
                ) : filteredHistory.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No notifications sent yet</td></tr>
                ) : filteredHistory.map(n => (
                  <tr key={n.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-3">{targetTypeBadge(n.target_type)}</td>
                    <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">{n.target_name || '—'}</td>
                    <td className="px-4 py-3">{typeBadge(n.type)}</td>
                    <td className="px-4 py-3 text-sm text-white font-medium max-w-[180px] truncate">{n.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-400 max-w-[250px] truncate">{n.message}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {n.created_at ? new Date(n.created_at).toLocaleString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEdit(n)} title="Edit"
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-teal-500/20 text-gray-400 hover:text-teal-400 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(n.id)} title="Delete"
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditItem(null)} />
          <div className="relative w-full max-w-md bg-gray-900 rounded-2xl border border-gray-700 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Edit Notification</h3>
              <button onClick={() => setEditItem(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-700">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm outline-none focus:border-teal-500" />
            <textarea value={editMessage} onChange={e => setEditMessage(e.target.value)}
              className="w-full h-28 px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm outline-none focus:border-teal-500 resize-none" />
            <div className="flex gap-3">
              <button onClick={() => setEditItem(null)} className="flex-1 h-10 rounded-xl bg-gray-700 text-gray-300 text-sm font-medium hover:bg-gray-600">Cancel</button>
              <button onClick={handleEditSave} disabled={editSaving || !editTitle.trim() || !editMessage.trim()}
                className="flex-1 h-10 rounded-xl bg-teal-500 text-white text-sm font-semibold hover:bg-teal-400 disabled:opacity-50 flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />{editSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative w-full max-w-sm bg-gray-900 rounded-2xl border border-gray-700 p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Delete Notification?</h3>
            <p className="text-sm text-gray-400">This will permanently delete the notification. Users who haven't read it will no longer see it.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 h-10 rounded-xl bg-gray-700 text-gray-300 text-sm font-medium hover:bg-gray-600">Cancel</button>
              <button onClick={() => handleDelete(deleteId)}
                className="flex-1 h-10 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-400 flex items-center justify-center gap-2">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
