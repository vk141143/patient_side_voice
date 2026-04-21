import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Eye, X, ExternalLink, Search, RefreshCw } from 'lucide-react';

function FeedbackDetailModal({ item, onClose }: { item: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-gray-900 rounded-2xl border border-gray-700 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 flex-shrink-0">
          <h3 className="text-base font-bold text-white">{item.title || item.message || 'Feedback'}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-700">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {item.description && <div><p className="text-xs text-gray-500 mb-1">Description</p><p className="text-sm text-white">{item.description}</p></div>}
          {item.message && <div><p className="text-xs text-gray-500 mb-1">Message</p><p className="text-sm text-white">{item.message}</p></div>}
          {item.user_email && <div><p className="text-xs text-gray-500 mb-1">User Email</p><p className="text-sm text-teal-400">{item.user_email}</p></div>}
          {item.doctor_email && <div><p className="text-xs text-gray-500 mb-1">Doctor Email</p><p className="text-sm text-teal-400">{item.doctor_email}</p></div>}
          {item.doctor_name && <div><p className="text-xs text-gray-500 mb-1">Doctor Name</p><p className="text-sm text-white">{item.doctor_name}</p></div>}
          {item.type && <div><p className="text-xs text-gray-500 mb-1">Type</p><p className="text-sm text-white capitalize">{item.type}</p></div>}
          {item.rating && <div><p className="text-xs text-gray-500 mb-1">Rating</p><p className="text-sm text-yellow-400">{'★'.repeat(item.rating)}</p></div>}
          {item.location_city && <div><p className="text-xs text-gray-500 mb-1">Location</p><p className="text-sm text-white">{item.location_city}, {item.location_region}, {item.location_country}</p></div>}
          {item.attachment_urls?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Attachments</p>
              <div className="space-y-2">
                {item.attachment_urls.map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 bg-gray-800 rounded-xl p-3 hover:bg-gray-700 transition-colors">
                    <ExternalLink className="w-4 h-4 text-teal-400" />
                    <span className="text-sm text-teal-400 truncate">Attachment {i + 1}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function FeedbackPage() {
  const [customerFeedback, setCustomerFeedback] = useState<any[]>([]);
  const [doctorFeedback, setDoctorFeedback] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'customer' | 'doctor'>('customer');
  const [viewItem, setViewItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [spinning, setSpinning] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [cf, df] = await Promise.all([
      supabase.from('customer_feedback').select('*').order('created_at', { ascending: false }),
      supabase.from('doctor_feedback').select('*').order('submitted_at', { ascending: false }),
    ]);
    if (cf.error) console.error('customer_feedback error:', cf.error);
    if (df.error) console.error('doctor_feedback error:', df.error);
    setCustomerFeedback(cf.data ?? []);
    setDoctorFeedback(df.data ?? []);
    if (df.error) setError(`Doctor feedback: ${df.error.message}`);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleRefresh = () => { setSpinning(true); fetchData(); setTimeout(() => setSpinning(false), 800); };

  const q = search.toLowerCase();
  const customerFiltered = customerFeedback.filter(i => !q || i.title?.toLowerCase().includes(q) || i.user_email?.toLowerCase().includes(q));
  const doctorFiltered = doctorFeedback.filter(i => !q || i.doctor_name?.toLowerCase().includes(q) || i.doctor_email?.toLowerCase().includes(q));
  const data = activeTab === 'customer' ? customerFiltered : doctorFiltered;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 space-y-4">
      {/* Tabs + Search + Refresh */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => setActiveTab('customer')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'customer' ? 'bg-teal-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
          Customer ({customerFeedback.length})
        </button>
        <button onClick={() => setActiveTab('doctor')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'doctor' ? 'bg-teal-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
          Doctor ({doctorFeedback.length})
        </button>
        <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-xl px-4 h-11 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 outline-none" />
        </div>
        <button onClick={handleRefresh} className="h-11 px-4 rounded-xl bg-gray-800 border border-gray-700 text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors">
          <RefreshCw className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {activeTab === 'doctor' && error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
          <p className="text-xs text-gray-500 mt-1">Check Supabase RLS policies for doctor_feedback table — add a SELECT policy allowing admin reads.</p>
        </div>
      )}

      <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-gray-700">
              {activeTab === 'customer'
                ? ['Title', 'Description', 'User Email', 'Attachments', 'Status', 'Date', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase whitespace-nowrap">{h}</th>
                  ))
                : ['Doctor', 'Email', 'Type', 'Rating', 'Message', 'City', 'Date', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase whitespace-nowrap">{h}</th>
                  ))
              }
            </tr></thead>
            <tbody className="divide-y divide-gray-700">
              {data.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No feedback yet</td></tr>
              ) : activeTab === 'customer' ? customerFeedback.map(item => (
                <tr key={item.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-white font-medium max-w-[150px] truncate">{item.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-400 max-w-[200px] truncate">{item.description}</td>
                  <td className="px-4 py-3 text-sm text-teal-400">{item.user_email || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{item.attachment_urls?.length || 0} files</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.status === 'resolved' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                      {item.status || 'open'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">{new Date(item.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setViewItem(item)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-teal-500/20 text-gray-400 hover:text-teal-400 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )) : doctorFeedback.map(item => (
                <tr key={item.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-white font-medium whitespace-nowrap">{item.doctor_name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-teal-400">{item.doctor_email || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-400 capitalize">{item.type || '—'}</td>
                  <td className="px-4 py-3 text-sm text-yellow-400">{item.rating ? '★'.repeat(item.rating) : '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-400 max-w-[200px] truncate">{item.message || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{item.location_city || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">{new Date(item.submitted_at).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setViewItem(item)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-teal-500/20 text-gray-400 hover:text-teal-400 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {viewItem && <FeedbackDetailModal item={viewItem} onClose={() => setViewItem(null)} />}
    </div>
  );
}
