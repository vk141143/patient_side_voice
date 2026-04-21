import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Video, Save, CheckCircle, Loader2, Search, IndianRupee } from 'lucide-react';

export function DoctorPricingPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [prices, setPrices] = useState<Record<string, { chat: string; video: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data: docs } = await supabase.from('doctors')
        .select('firebase_uid, full_name, specialization, selfie_url, is_online')
        .eq('status', 'approved')
        .order('full_name');

      const { data: pricingRows } = await supabase.from('doctor_pricing')
        .select('doctor_id, chat_price, video_price');

      const map: Record<string, { chat: string; video: string }> = {};
      pricingRows?.forEach(p => {
        map[p.doctor_id] = { chat: String(p.chat_price), video: String(p.video_price) };
      });

      setDoctors(docs ?? []);
      setPrices(map);
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async (doctorId: string) => {
    const p = prices[doctorId];
    const chat  = Number(p?.chat  ?? 0);
    const video = Number(p?.video ?? 0);
    if (!chat || !video) return;
    setSaving(doctorId);
    await supabase.from('doctor_pricing').upsert(
      { doctor_id: doctorId, chat_price: chat, video_price: video },
      { onConflict: 'doctor_id' }
    );
    setSaving(null);
    setSaved(doctorId);
    setTimeout(() => setSaved(null), 2000);
  };

  const setPrice = (doctorId: string, field: 'chat' | 'video', val: string) => {
    setPrices(p => ({ ...p, [doctorId]: { ...p[doctorId], [field]: val } }));
  };

  const filtered = doctors.filter(d =>
    d.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.specialization?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Doctor Pricing</h2>
        <p className="text-gray-400 text-sm mt-1">Set individual chat & video call prices per doctor. Shown to patients in real-time.</p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 mb-6 max-w-sm">
        <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search doctor or specialty..."
          className="bg-transparent text-white text-sm outline-none flex-1 placeholder:text-gray-600"
        />
      </div>

      <div className="space-y-3 max-w-2xl">
        {filtered.length === 0 && (
          <p className="text-gray-500 text-sm">No doctors found.</p>
        )}
        {filtered.map(doc => {
          const p = prices[doc.firebase_uid] ?? { chat: '', video: '' };
          const isSaving = saving === doc.firebase_uid;
          const isSaved  = saved  === doc.firebase_uid;

          return (
            <div key={doc.firebase_uid} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-4">
                {doc.selfie_url
                  ? <img src={doc.selfie_url} alt={doc.full_name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  : <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center flex-shrink-0"><span className="text-teal-400 font-bold">{doc.full_name?.charAt(0)}</span></div>
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-semibold text-sm truncate">Dr. {doc.full_name}</p>
                    {doc.is_online && (
                      <span className="flex items-center gap-1 text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full flex-shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />Online
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs">{doc.specialization}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Chat price */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-teal-400" /> Chat Price (₹)
                  </label>
                  <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2">
                    <IndianRupee className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <input
                      type="number" min="1"
                      value={p.chat}
                      onChange={e => setPrice(doc.firebase_uid, 'chat', e.target.value)}
                      placeholder="e.g. 299"
                      className="bg-transparent text-white text-sm font-bold w-full outline-none placeholder:text-gray-600"
                    />
                  </div>
                </div>

                {/* Video price */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-1.5">
                    <Video className="w-3.5 h-3.5 text-blue-400" /> Video Price (₹)
                  </label>
                  <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2">
                    <IndianRupee className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <input
                      type="number" min="1"
                      value={p.video}
                      onChange={e => setPrice(doc.firebase_uid, 'video', e.target.value)}
                      placeholder="e.g. 499"
                      className="bg-transparent text-white text-sm font-bold w-full outline-none placeholder:text-gray-600"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSave(doc.firebase_uid)}
                disabled={isSaving || !p.chat || !p.video}
                className={`mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isSaved
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-teal-500 hover:bg-teal-400 text-white disabled:opacity-50'
                }`}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" />
                  : isSaved ? <><CheckCircle className="w-4 h-4" /> Saved</>
                  : <><Save className="w-4 h-4" /> Save Prices</>
                }
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
