import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Eye, Check, X, Trash2, ExternalLink, RefreshCw } from 'lucide-react';

type Doctor = Record<string, any>;
type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: 'bg-green-500/10 text-green-400 border-green-500/20',
    pending:  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${map[status] ?? 'bg-gray-700 text-gray-400'}`}>
      {status ?? 'pending'}
    </span>
  );
}

function DocViewModal({ doctor, onClose }: { doctor: Doctor; onClose: () => void }) {
  const fields = [
    ['Full Name', doctor.full_name], ['Email', doctor.email], ['Gender', doctor.gender],
    ['City', doctor.city], ['State', doctor.state], ['Specialization', doctor.specialization],
    ['Experience', `${doctor.experience_years} years`], ['Practice Type', doctor.practice_type],
    ['Hospital', doctor.hospital_name], ['Clinic Address', doctor.clinic_address],
    ['MBBS Cert No.', doctor.mbbs_cert_number], ['MBBS Year', doctor.mbbs_year_of_passing],
    ['PG Type', doctor.postgrad_type], ['PG Cert No.', doctor.postgrad_cert_number],
    ['Reg. Number', doctor.registration_number], ['Council', doctor.council_name],
    ['Reg. Year', doctor.year_of_registration], ['Languages', doctor.languages?.join(', ')],
    ['Chat Service', doctor.service_chat ? 'Yes' : 'No'], ['OPD Service', doctor.service_opd ? 'Yes' : 'No'],
    ['Chat Shift', doctor.chat_shift || '—'],
    ['Consult Duration', `${doctor.consult_duration} min`],
    ['Account Holder', doctor.account_holder], ['Account No.', doctor.account_number],
    ['IFSC', doctor.ifsc_code], ['PAN', doctor.pan_number], ['GST', doctor.gst_number],
  ];

  const docs = [
    { label: 'ID Proof', url: doctor.id_proof_url },
    { label: 'Selfie', url: doctor.selfie_url },
    { label: 'Passport Photo', url: doctor.passport_photo_url },
    { label: 'Bank Document', url: doctor.bank_document_url },
  ].filter(d => d.url);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-gray-900 rounded-2xl border border-gray-700 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 flex-shrink-0">
          <h3 className="text-lg font-bold text-white">Dr. {doctor.full_name}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-700">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            {fields.map(([label, value]) => value ? (
              <div key={label as string} className="bg-gray-800 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                <p className="text-sm text-white font-medium">{value}</p>
              </div>
            ) : null)}
          </div>

          {/* Documents */}
          {docs.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-300 mb-3">Documents & Photos</p>
              <div className="grid grid-cols-2 gap-3">
                {docs.map(doc => (
                  <a key={doc.label} href={doc.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 bg-gray-800 rounded-xl p-3 hover:bg-gray-700 transition-colors group">
                    <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                      <Eye className="w-5 h-5 text-teal-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium">{doc.label}</p>
                      <p className="text-xs text-gray-500 truncate">Click to view</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-teal-400" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Consents */}
          <div>
            <p className="text-sm font-semibold text-gray-300 mb-3">Consents</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['Registered', doctor.consent_registered],
                ['Guidelines', doctor.consent_guidelines],
                ['Terms', doctor.consent_terms],
                ['Prescriptions', doctor.consent_prescriptions],
                ['Data Processing', doctor.consent_data_processing],
              ].map(([label, val]) => (
                <div key={label as string} className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${val ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    {val ? <Check className="w-2.5 h-2.5 text-green-400" /> : <X className="w-2.5 h-2.5 text-red-400" />}
                  </div>
                  <span className="text-xs text-gray-300">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {doctor.rejection_reason && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-xs text-red-400 font-semibold mb-1">Rejection Reason</p>
              <p className="text-sm text-red-300">{doctor.rejection_reason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RejectModal({ onConfirm, onClose }: { onConfirm: (reason: string) => void; onClose: () => void }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-gray-900 rounded-2xl border border-gray-700 p-6">
        <h3 className="text-base font-bold text-white mb-4">Reject Doctor</h3>
        <textarea value={reason} onChange={e => setReason(e.target.value)}
          placeholder="Enter rejection reason..."
          className="w-full h-24 px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm outline-none focus:border-red-500 resize-none mb-4" />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl bg-gray-700 text-gray-300 text-sm font-medium hover:bg-gray-600">Cancel</button>
          <button onClick={() => reason.trim() && onConfirm(reason)} disabled={!reason.trim()}
            className="flex-1 h-10 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-400 disabled:opacity-50">Reject</button>
        </div>
      </div>
    </div>
  );
}

export function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filtered, setFiltered] = useState<Doctor[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [spinning, setSpinning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewDoc, setViewDoc] = useState<Doctor | null>(null);
  const [rejectDoc, setRejectDoc] = useState<Doctor | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDoctors = async () => {
    const { data } = await supabase.from('doctors').select('*').order('created_at', { ascending: false });
    setDoctors(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchDoctors(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    let result = doctors.filter(d => {
      const matchSearch = !q || d.full_name?.toLowerCase().includes(q) || d.email?.toLowerCase().includes(q) || d.specialization?.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || (d.status ?? 'pending') === statusFilter;
      const matchService = serviceFilter === 'all' || (serviceFilter === 'chat' && d.service_chat) || (serviceFilter === 'opd' && d.service_opd);
      return matchSearch && matchStatus && matchService;
    });
    result = [...result].sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? db - da : da - db;
    });
    setFiltered(result);
  }, [search, statusFilter, serviceFilter, sortOrder, doctors]);

  const handleRefresh = () => { setSpinning(true); fetchDoctors(); setTimeout(() => setSpinning(false), 800); };

  const handleApprove = async (doc: Doctor) => {
    setActionLoading(doc.id);
    await supabase.from('doctors').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('id', doc.id);
    await fetchDoctors();
    setActionLoading(null);
  };

  const handleReject = async (doc: Doctor, reason: string) => {
    setActionLoading(doc.id);
    await supabase.from('doctors').update({ status: 'rejected', rejection_reason: reason }).eq('id', doc.id);
    setRejectDoc(null);
    await fetchDoctors();
    setActionLoading(null);
  };

  const handleDelete = async (doc: Doctor) => {
    if (!confirm(`Delete Dr. ${doc.full_name}? This cannot be undone.`)) return;
    setActionLoading(doc.id);
    await supabase.from('doctors').delete().eq('id', doc.id);
    await fetchDoctors();
    setActionLoading(null);
  };

  const counts = {
    all: doctors.length,
    pending: doctors.filter(d => (d.status ?? 'pending') === 'pending').length,
    approved: doctors.filter(d => d.status === 'approved').length,
    rejected: doctors.filter(d => d.status === 'rejected').length,
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['all', 'pending', 'approved', 'rejected'] as StatusFilter[]).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`rounded-2xl p-4 border text-left transition-all ${statusFilter === s ? 'border-teal-500 bg-teal-500/10' : 'border-gray-700 bg-gray-800 hover:border-gray-600'}`}>
            <p className="text-xs text-gray-400 capitalize mb-1">{s}</p>
            <p className={`text-2xl font-bold ${s === 'approved' ? 'text-green-400' : s === 'rejected' ? 'text-red-400' : s === 'pending' ? 'text-yellow-400' : 'text-white'}`}>{counts[s]}</p>
          </button>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-xl px-4 h-11 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or specialization..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 outline-none" />
        </div>
        <select value={serviceFilter} onChange={e => setServiceFilter(e.target.value)}
          className="h-11 px-3 rounded-xl bg-gray-800 border border-gray-700 text-sm text-gray-300 outline-none">
          <option value="all">All Services</option>
          <option value="chat">Chat Only</option>
          <option value="opd">OPD Only</option>
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

      {/* Table */}
      <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-base font-semibold text-white">Doctors ({filtered.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-gray-700">
              {['Doctor', 'Specialization', 'Experience', 'City', 'Hospital', 'Services', 'Chat Shift', 'Status', 'Registered', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-700">
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="px-6 py-12 text-center text-gray-500">No doctors found</td></tr>
              ) : filtered.map(doc => (
                <tr key={doc.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm text-white font-medium whitespace-nowrap">{doc.full_name}</p>
                      <p className="text-xs text-gray-500">{doc.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-teal-400 whitespace-nowrap">{doc.specialization || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">{doc.experience_years ? `${doc.experience_years} yrs` : '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">{doc.city || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap max-w-[120px] truncate">{doc.hospital_name || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {doc.service_chat && <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded">Chat</span>}
                      {doc.service_opd && <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 text-xs rounded">OPD</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {doc.chat_shift
                      ? <span className="px-2 py-0.5 bg-teal-500/10 text-teal-400 text-xs rounded-full font-medium whitespace-nowrap">{doc.chat_shift}</span>
                      : <span className="text-gray-600 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={doc.status ?? 'pending'} /></td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{new Date(doc.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {/* View */}
                      <button onClick={() => setViewDoc(doc)} title="View Details"
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-teal-500/20 text-gray-400 hover:text-teal-400 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      {/* Approve */}
                      {(doc.status ?? 'pending') !== 'approved' && (
                        <button onClick={() => handleApprove(doc)} title="Approve" disabled={actionLoading === doc.id}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-green-500/20 text-gray-400 hover:text-green-400 transition-colors disabled:opacity-50">
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      {/* Reject */}
                      {(doc.status ?? 'pending') !== 'rejected' && (
                        <button onClick={() => setRejectDoc(doc)} title="Reject" disabled={actionLoading === doc.id}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      {/* Delete */}
                      <button onClick={() => handleDelete(doc)} title="Delete" disabled={actionLoading === doc.id}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewDoc && <DocViewModal doctor={viewDoc} onClose={() => setViewDoc(null)} />}
      {rejectDoc && <RejectModal onConfirm={(reason) => handleReject(rejectDoc, reason)} onClose={() => setRejectDoc(null)} />}
    </div>
  );
}
