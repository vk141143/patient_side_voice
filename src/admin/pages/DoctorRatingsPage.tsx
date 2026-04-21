import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Star, X, Search, RefreshCw } from 'lucide-react';

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={`w-4 h-4 ${s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
      ))}
    </div>
  );
}

function ReviewsModal({ doctor, reviews, onClose }: { doctor: any; reviews: any[]; onClose: () => void }) {
  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-gray-900 rounded-2xl border border-gray-700 flex flex-col" style={{ maxHeight: '85vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 flex-shrink-0">
          <div>
            <h3 className="text-base font-bold text-white">Dr. {doctor.full_name}</h3>
            <p className="text-xs text-gray-400">{doctor.specialization} · {reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-yellow-500/10 px-3 py-1.5 rounded-full">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-yellow-400 font-bold text-sm">{avg}</span>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-700">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Reviews list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4B5563 #1F2937' }}>
          {reviews.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No reviews yet</p>
          ) : reviews.map(r => (
            <div key={r.id} className="bg-gray-800 rounded-xl p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-teal-400">{(r.patient_name ?? 'P').charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{r.patient_name ?? '—'}</p>
                    <p className="text-xs text-gray-500">{r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</p>
                  </div>
                </div>
                <StarDisplay rating={r.rating} />
              </div>
              {r.review && (
                <p className="text-sm text-gray-300 leading-relaxed pl-11">{r.review}</p>
              )}
              {/* Appointment details */}
              {r.appointment && (
                <div className="pl-11 flex flex-wrap gap-2 mt-1">
                  {r.appointment.appointment_date && (
                    <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">
                      {new Date(r.appointment.appointment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                  {r.appointment.time_slot && (
                    <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">{r.appointment.time_slot}</span>
                  )}
                  {r.appointment.patient_phone && (
                    <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">📞 {r.appointment.patient_phone}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DoctorRatingsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [allRatings, setAllRatings] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('highest');
  const [minRating, setMinRating] = useState('all');
  const [spinning, setSpinning] = useState(false);
  const [viewDoctor, setViewDoctor] = useState<any | null>(null);
  const [viewReviews, setViewReviews] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    const { data: ratings } = await supabase
      .from('doctor_ratings')
      .select('*, appointment:appointment_id(appointment_date, time_slot, patient_phone)')
      .order('created_at', { ascending: false });

    if (!ratings?.length) { setLoading(false); return; }

    const doctorIds = [...new Set(ratings.map(r => r.doctor_id))];
    const { data: docs } = await supabase
      .from('doctors')
      .select('firebase_uid, full_name, specialization, hospital_name, selfie_url, city')
      .in('firebase_uid', doctorIds);

    const doctorMap: Record<string, any> = {};
    docs?.forEach(d => { doctorMap[d.firebase_uid] = d; });

    const grouped = doctorIds.map(uid => {
      const docRatings = ratings.filter(r => r.doctor_id === uid);
      const avg = docRatings.reduce((s, r) => s + r.rating, 0) / docRatings.length;
      return {
        doctor: doctorMap[uid] ?? { firebase_uid: uid, full_name: 'Unknown', specialization: '' },
        ratings: docRatings,
        avg: parseFloat(avg.toFixed(1)),
        count: docRatings.length,
      };
    });

    setDoctors(grouped);
    setAllRatings(ratings);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleRefresh = () => { setSpinning(true); fetchData(); setTimeout(() => setSpinning(false), 800); };

  useEffect(() => {
    const q = search.toLowerCase();
    let result = doctors.filter(d =>
      (!q || d.doctor?.full_name?.toLowerCase().includes(q) || d.doctor?.specialization?.toLowerCase().includes(q) || d.doctor?.hospital_name?.toLowerCase().includes(q)) &&
      (minRating === 'all' || d.avg >= parseFloat(minRating))
    );
    result = [...result].sort((a, b) =>
      sortOrder === 'highest' ? b.avg - a.avg :
      sortOrder === 'lowest'  ? a.avg - b.avg :
      sortOrder === 'most'    ? b.count - a.count : a.count - b.count
    );
    setFiltered(result);
  }, [search, sortOrder, minRating, doctors]);

  const handleView = (item: any) => {
    setViewDoctor(item.doctor);
    setViewReviews(item.ratings);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
          <p className="text-xs text-gray-400 mb-1">Total Reviews</p>
          <p className="text-2xl font-bold text-white">{allRatings.length}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
          <p className="text-xs text-gray-400 mb-1">Doctors Rated</p>
          <p className="text-2xl font-bold text-teal-400">{doctors.length}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
          <p className="text-xs text-gray-400 mb-1">Overall Avg</p>
          <div className="flex items-center gap-1.5">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <p className="text-2xl font-bold text-yellow-400">
              {allRatings.length ? (allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length).toFixed(1) : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-xl px-4 h-11 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search doctor, specialty or hospital..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 outline-none" />
        </div>
        <select value={minRating} onChange={e => setMinRating(e.target.value)}
          className="h-11 px-3 rounded-xl bg-gray-800 border border-gray-700 text-sm text-gray-300 outline-none">
          <option value="all">All Ratings</option>
          <option value="4">4★ & above</option>
          <option value="3">3★ & above</option>
          <option value="2">2★ & above</option>
        </select>
        <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}
          className="h-11 px-3 rounded-xl bg-gray-800 border border-gray-700 text-sm text-gray-300 outline-none">
          <option value="highest">Highest Rated</option>
          <option value="lowest">Lowest Rated</option>
          <option value="most">Most Reviews</option>
          <option value="least">Least Reviews</option>
        </select>
        <button onClick={handleRefresh} className="h-11 px-4 rounded-xl bg-gray-800 border border-gray-700 text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors">
          <RefreshCw className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
        <div className="overflow-auto" style={{ maxHeight: '60vh', scrollbarWidth: 'thin', scrollbarColor: '#4B5563 #1F2937' }}>
          <table style={{ minWidth: '800px', width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#1F2937', zIndex: 10 }}>
              <tr className="border-b border-gray-700">
                {['Doctor', 'Specialization', 'Hospital', 'Avg Rating', 'Total Reviews', 'Latest Review', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No ratings yet</td></tr>
              ) : filtered.map(item => (
                <tr key={item.doctor.firebase_uid} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {item.doctor.selfie_url ? (
                        <img src={item.doctor.selfie_url} className="w-9 h-9 rounded-full object-cover border border-gray-600" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-teal-400">{(item.doctor.full_name ?? 'D').charAt(0)}</span>
                        </div>
                      )}
                      <span className="text-sm text-white font-medium whitespace-nowrap">Dr. {item.doctor.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">{item.doctor.specialization || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">{item.doctor.hospital_name || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <StarDisplay rating={Math.round(item.avg)} />
                      <span className="text-sm font-bold text-yellow-400">{item.avg}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-white font-semibold">{item.count}</td>
                  <td className="px-4 py-3 text-sm text-gray-400 max-w-[200px] truncate">
                    {item.ratings[0]?.review || <span className="text-gray-600 italic">No text</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleView(item)}
                      className="px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-400 text-xs font-semibold hover:bg-teal-500/20 transition-colors">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewDoctor && (
        <ReviewsModal
          doctor={viewDoctor}
          reviews={viewReviews}
          onClose={() => { setViewDoctor(null); setViewReviews([]); }}
        />
      )}
    </div>
  );
}
