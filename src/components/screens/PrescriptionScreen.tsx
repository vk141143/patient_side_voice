import { Button } from '@/components/ui/button';
import { Download, MessageSquare, FileText, CheckCircle, ArrowLeft, Star, X, Loader2, Pill, Video, ShieldCheck, Wallet } from 'lucide-react';
import { Prescription } from '@/types/app';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/services/auth';
import { WalletRechargeModal } from '@/components/WalletRechargeModal';

interface PrescriptionScreenProps {
  prescription?: Prescription | null;
  rxId?: string | null;
  walletBalance?: number;
  onRecharge?: (amt: number) => void;
  onConsultAgain: () => void;
  onBookSameDoctor: () => void;
  onGoHome: () => void;
  onOrderMedicines: () => void;
  onSelectDoctor?: (doctor: any, callType: 'chat' | 'video') => void;
}

function DoctorRatingPopup({ doctor, onClose }: { doctor: any; onClose: () => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    const user = getCurrentUser();
    await supabase.from('doctor_ratings').insert({
      doctor_id: doctor.id ?? doctor.firebase_uid ?? '',
      patient_name: user?.displayName ?? user?.email ?? 'Patient',
      patient_user_id: user?.uid ?? null,
      rating,
      review: review.trim() || null,
    });
    setSubmitting(false);
    setDone(true);
    setTimeout(onClose, 1500);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-background rounded-t-3xl flex flex-col" style={{ maxHeight: '80vh', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* Drag handle */}
        <div className="flex-shrink-0 pt-4 pb-2 px-6">
          <div className="w-10 h-1 rounded-full bg-border mx-auto" />
        </div>

        {done ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8 px-6">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
              <Star className="w-8 h-8 text-green-500 fill-green-500" />
            </div>
            <p className="text-lg font-bold text-foreground">Thank you!</p>
            <p className="text-sm text-muted-foreground mt-1">Your rating has been submitted.</p>
          </div>
        ) : (
          <>
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 pb-2 space-y-5"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#D1D5DB #F9FAFB' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Rate Your Consultation</h3>
                  <p className="text-sm text-muted-foreground">How was your experience with Dr. {doctor.name}?</p>
                </div>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="flex justify-center gap-3">
                {[1,2,3,4,5].map(s => (
                  <button key={s} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)} onClick={() => setRating(s)}>
                    <Star className={`w-10 h-10 transition-all ${s <= (hover || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                  </button>
                ))}
              </div>
              <textarea value={review} onChange={e => setReview(e.target.value)}
                placeholder="Share your experience (optional)..."
                className="w-full h-28 px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm outline-none focus:border-primary resize-none" />
            </div>
            {/* Fixed submit button — extra bottom padding to clear nav bar */}
            <div className="flex-shrink-0 px-6 pt-3 pb-20 border-t border-border bg-background">
              <Button variant="hero" size="lg" className="w-full" disabled={rating === 0 || submitting} onClick={handleSubmit}>
                {submitting ? 'Submitting...' : 'Submit Rating'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function PrescriptionScreen({ 
  prescription, rxId,
  walletBalance = 0, onRecharge,
  onConsultAgain, onBookSameDoctor, onGoHome, onOrderMedicines, onSelectDoctor,
}: PrescriptionScreenProps) {
  const [showRating, setShowRating] = useState(true);
  const [rx, setRx] = useState<any | null>(null);
  const [loading, setLoading] = useState(!!rxId);
  const [doctorPhoto, setDoctorPhoto] = useState<string | null>(null);
  const [onlineDoctors, setOnlineDoctors] = useState<any[]>([]);
  const [doctorPrices, setDoctorPrices] = useState<Record<string, { chat_price: number; video_price: number }>>({});
  const [showWallet, setShowWallet] = useState(false);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [reqCountdown, setReqCountdown] = useState(30);
  const [waitReqId, setWaitReqId] = useState<string | null>(null);
  const [rejected, setRejected] = useState<string | null>(null);

  // Fetch real prescription from chat_prescriptions
  useEffect(() => {
    if (!rxId) return;
    setLoading(true);

    const fetch = async () => {
      const { data } = await supabase.from('chat_prescriptions').select('*').eq('id', rxId).single();
      if (data) {
        setRx(data);
        setLoading(false);
        // Fetch doctor photo
        if (data.doctor_id) {
          const { data: doc } = await supabase.from('doctors')
            .select('selfie_url').eq('firebase_uid', data.doctor_id).maybeSingle();
          if (doc?.selfie_url) setDoctorPhoto(doc.selfie_url);
        }
      }
    };
    fetch();

    const channel = supabase
      .channel(`rx_${rxId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'chat_prescriptions' },
        async (payload) => {
          const row = payload.new as any;
          if (row?.id === rxId) {
            setRx(row);
            setLoading(false);
            if (row.doctor_id && !doctorPhoto) {
              const { data: doc } = await supabase.from('doctors')
                .select('selfie_url').eq('firebase_uid', row.doctor_id).maybeSingle();
              if (doc?.selfie_url) setDoctorPhoto(doc.selfie_url);
            }
          }
        })
      .subscribe();

    const poll = setInterval(async () => {
      if (rx) { clearInterval(poll); return; }
      const { data } = await supabase.from('chat_prescriptions').select('*').eq('id', rxId).single();
      if (data) { setRx(data); setLoading(false); clearInterval(poll); }
    }, 3000);

    return () => { supabase.removeChannel(channel); clearInterval(poll); };
  }, [rxId]);

  // Fetch online doctors for same specialty + their prices
  useEffect(() => {
    const spec = rx?.doctor_specialty ?? prescription?.doctor?.specialization;
    if (!spec) return;

    const load = async () => {
      const { data: docs } = await supabase.from('doctors')
        .select('firebase_uid, full_name, specialization, experience_years, selfie_url, is_online, chat_enabled')
        .eq('status', 'approved').eq('is_online', true).eq('chat_enabled', true)
        .ilike('specialization', `%${spec}%`);
      if (!docs?.length) return;
      setOnlineDoctors(docs);

      // Fetch per-doctor prices
      const ids = docs.map(d => d.firebase_uid);
      const { data: prices } = await supabase.from('doctor_pricing')
        .select('doctor_id, chat_price, video_price').in('doctor_id', ids);
      const map: Record<string, { chat_price: number; video_price: number }> = {};
      prices?.forEach(p => { map[p.doctor_id] = { chat_price: p.chat_price, video_price: p.video_price }; });
      setDoctorPrices(map);
    };
    load();
  }, [rx, prescription?.doctor?.specialization]);

  const handleConsultDoctor = async (doctor: any, callType: 'chat' | 'video') => {
    if (!onSelectDoctor) return;
    const prices = doctorPrices[doctor.firebase_uid];
    const fee = callType === 'chat' ? (prices?.chat_price ?? 299) : (prices?.video_price ?? 499);
    if (walletBalance < fee) { setShowWallet(true); return; }

    const user = getCurrentUser();
    if (!user) return;
    setRequesting(doctor.firebase_uid);
    setRejected(null);

    const { data: userRow } = await supabase.from('users').select('name').eq('id', user.uid).maybeSingle();
    const patientName = userRow?.name || user.displayName || user.email || 'Patient';
    const spec = rx?.doctor_specialty ?? prescription?.doctor?.specialization ?? '';

    const { data: req } = await supabase.from('consultation_requests').insert({
      patient_id: user.uid, patient_name: patientName,
      specialty: spec, status: 'searching',
      doctor_id: doctor.firebase_uid, call_type: callType, fee,
    }).select('id').single();

    if (!req?.id) { setRequesting(null); return; }
    setWaitReqId(req.id);
    let count = 30; setReqCountdown(30);

    const timer = setInterval(() => {
      count--; setReqCountdown(count);
      if (count <= 0) {
        clearInterval(timer);
        supabase.from('consultation_requests').update({ status: 'timeout' }).eq('id', req.id);
        setRequesting(null); setWaitReqId(null); setRejected(doctor.firebase_uid);
      }
    }, 1000);

    const poll = setInterval(async () => {
      const { data: updated } = await supabase.from('consultation_requests')
        .select('status').eq('id', req.id).single();
      if (updated?.status === 'accepted') {
        clearInterval(timer); clearInterval(poll);
        setRequesting(null);
        onSelectDoctor(doctor, callType);
      } else if (updated?.status === 'rejected') {
        clearInterval(timer); clearInterval(poll);
        setRequesting(null); setWaitReqId(null); setRejected(doctor.firebase_uid);
      }
    }, 2000);
  };

  const handleCancelReq = async () => {
    if (waitReqId) await supabase.from('consultation_requests').update({ status: 'cancelled' }).eq('id', waitReqId);
    setRequesting(null); setWaitReqId(null);
  };

  const handleDownloadPDF = () => {
    const name  = rx?.doctor_name  ?? prescription?.doctor?.name ?? '';
    const spec  = rx?.doctor_specialty ?? prescription?.doctor?.specialization ?? '';
    const date  = new Date(rx?.created_at ?? prescription?.date ?? new Date())
      .toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    const diag  = rx?.diagnosis    ?? prescription?.diagnosis ?? '';
    const advList: string[] = rx?.advice ?? prescription?.advice ?? [];
    const meds: any[]       = rx?.medicines ?? prescription?.medicines ?? [];
    const fu    = rx?.follow_up ?? '';

    const medRows = meds.map(m => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-weight:600">${m.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#666">${m.dosage ?? ''}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#666">${m.timing ?? m.frequency ?? ''}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#666">${m.duration ?? ''}</td>
      </tr>`).join('');

    const advHtml = advList.map(a => `<li style="margin-bottom:4px">${a}</li>`).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>Prescription - Dr. ${name}</title>
      <style>
        body{font-family:Arial,sans-serif;margin:0;padding:32px;color:#1a1a1a;max-width:700px;margin:auto}
        .header{background:linear-gradient(135deg,#0ea5e9,#6366f1);color:white;padding:24px 28px;border-radius:12px;margin-bottom:24px;display:flex;align-items:center;gap:16px}
        .avatar{width:64px;height:64px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,0.4)}
        .avatar-placeholder{width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:bold;color:white;flex-shrink:0}
        .section{background:#f9fafb;border-radius:10px;padding:16px 20px;margin-bottom:16px}
        .section-title{font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px}
        table{width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden}
        th{background:#f3f4f6;padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase}
        .followup{background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 16px}
        .footer{text-align:center;color:#9ca3af;font-size:11px;margin-top:24px;border-top:1px solid #e5e7eb;padding-top:16px}
        @media print{body{padding:16px}}
      </style></head><body>
      <div class="header">
        ${doctorPhoto
          ? `<img src="${doctorPhoto}" class="avatar" />`
          : `<div class="avatar-placeholder">${name.charAt(0)}</div>`}
        <div>
          <div style="font-size:20px;font-weight:700">Dr. ${name}</div>
          <div style="opacity:.85;margin-top:2px">${spec}</div>
          <div style="opacity:.7;font-size:13px;margin-top:4px">${date}</div>
        </div>
      </div>
      ${diag ? `<div class="section"><div class="section-title">Diagnosis</div><p style="margin:0;font-weight:500">${diag}</p></div>` : ''}
      ${advList.length ? `<div class="section"><div class="section-title">Advice</div><ul style="margin:0;padding-left:20px">${advHtml}</ul></div>` : ''}
      ${fu ? `<div class="followup" style="margin-bottom:16px"><div style="font-size:12px;font-weight:700;color:#2563eb;text-transform:uppercase">Follow-up</div><p style="margin:4px 0 0;color:#1e40af">${fu}</p></div>` : ''}
      ${meds.length ? `<div class="section"><div class="section-title">💊 Medicines Prescribed</div>
        <table><thead><tr><th>Medicine</th><th>Dosage</th><th>Timing</th><th>Duration</th></tr></thead>
        <tbody>${medRows}</tbody></table></div>` : ''}
      <div class="footer">This prescription was generated digitally via MediCare. For emergencies call 112.</div>
    </body></html>`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  // Map real rx → display values (rx from DB is the source of truth)
  const doctorName = rx?.doctor_name  ?? prescription?.doctor?.name ?? '';
  const specialty  = rx?.doctor_specialty ?? prescription?.doctor?.specialization ?? '';
  const dateVal    = rx?.created_at   ?? prescription?.date ?? new Date();
  const diagnosis  = rx?.diagnosis    ?? prescription?.diagnosis ?? null;
  const advice     = rx?.advice       ?? prescription?.advice ?? [];
  const medicines  = rx?.medicines    ?? prescription?.medicines ?? [];
  const followUp   = rx?.follow_up    ?? null;

  // If no rxId and no real rx, show empty state
  if (!rxId && !rx) {
    return (
      <div className="flex flex-col h-screen bg-background items-center justify-center gap-4 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="font-semibold text-foreground">No prescription yet</p>
        <p className="text-sm text-muted-foreground">Your prescription will appear here after your consultation.</p>
        <Button variant="heroSecondary" size="lg" className="w-full max-w-xs" onClick={onConsultAgain}>
          <MessageSquare className="w-5 h-5" /> Start a Consultation
        </Button>
        <Button variant="outline" size="lg" className="w-full max-w-xs" onClick={onGoHome}>Go Home</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-background items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <Pill className="w-8 h-8 text-emerald-600 animate-pulse" />
        </div>
        <p className="font-semibold text-foreground">Loading your prescription...</p>
        <p className="text-sm text-muted-foreground">Please wait a moment</p>
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }
  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      {showRating && rx && <DoctorRatingPopup doctor={{ id: rx.doctor_id, name: rx.doctor_name }} onClose={() => setShowRating(false)} />}
      {/* Header */}
      <div className="gradient-primary px-5 pt-12 pb-8">
        <button 
          onClick={onGoHome}
          className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center mb-4"
        >
          <ArrowLeft className="w-5 h-5 text-primary-foreground" />
        </button>

        <div className="flex items-center gap-4">
          {doctorPhoto
            ? <img src={doctorPhoto} alt={doctorName} className="w-16 h-16 rounded-2xl object-cover border-2 border-primary-foreground/20" />
            : <div className="w-16 h-16 rounded-2xl bg-primary-foreground/20 flex items-center justify-center border-2 border-primary-foreground/20"><span className="text-2xl font-bold text-primary-foreground">{doctorName?.charAt(0)}</span></div>
          }
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-primary-foreground">Dr. {doctorName}</h2>
              <CheckCircle className="w-5 h-5 text-primary-foreground/80" />
            </div>
            <p className="text-primary-foreground/80 text-sm">{specialty}</p>
            <p className="text-primary-foreground/60 text-xs mt-1">
              {new Date(dateVal).toLocaleDateString('en-IN', { 
                weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-6 -mt-4">
        {/* Consultation Summary */}
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50 mb-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Consultation Summary
          </h3>
          <div className="space-y-3">
            {diagnosis && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Diagnosis</p>
                <p className="text-foreground font-medium">{diagnosis}</p>
              </div>
            )}
            {advice?.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Advice</p>
                <ul className="space-y-1">
                  {advice.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <span className="text-success mt-1">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {followUp && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">Follow-up</p>
                <p className="text-sm text-blue-800 mt-0.5">{followUp}</p>
              </div>
            )}
          </div>
        </div>

        {/* Medicines */}
        {medicines?.length > 0 && (
          <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50 mb-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              💊 Medicines Prescribed
            </h3>
            <div className="space-y-4">
              {medicines.map((med: any, i: number) => (
                <div key={i} className="p-4 bg-secondary/50 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-foreground">{med.name}</h4>
                    <div className="flex gap-1">
                      {med.type && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          med.type === 'generic' ? 'bg-success/10 text-success' :
                          med.type === 'antibiotic' ? 'bg-destructive/10 text-destructive' :
                          'bg-primary/10 text-primary'
                        }`}>
                          {med.type}
                        </span>
                      )}
                      {med.duration && (
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                          {med.duration}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{med.dosage}</p>
                  {(med.timing ?? med.frequency) && (
                    <p className="text-xs text-muted-foreground mt-1">⏰ {med.timing ?? med.frequency}</p>
                  )}
                  {med.instructions && (
                    <p className="text-xs text-amber-600 mt-1">⚠ {med.instructions}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Button variant="outline" size="lg" className="w-full" onClick={handleDownloadPDF}>
            <Download className="w-5 h-5" />
            Download PDF
          </Button>
          <Button variant="outline" size="lg" className="w-full">
            <FileText className="w-5 h-5" />
            Save to Records
          </Button>
        </div>

        <div className="space-y-3">
          <Button variant="heroSecondary" size="lg" className="w-full" onClick={onConsultAgain}>
            <MessageSquare className="w-5 h-5" />
            Consult Again
          </Button>
        </div>

        {/* Online Doctors for Same Specialty */}
        {onlineDoctors.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h3 className="font-semibold text-foreground text-sm">
                {onlineDoctors.length} {rx?.doctor_specialty ?? prescription?.doctor?.specialization} doctor{onlineDoctors.length > 1 ? 's' : ''} online now
              </h3>
              {onSelectDoctor && (
                <button onClick={() => setShowWallet(true)}
                  className="ml-auto flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
                  <Wallet className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-bold text-primary">₹{walletBalance}</span>
                </button>
              )}
            </div>

            <div className="space-y-3">
              {onlineDoctors.map(doc => {
                const prices = doctorPrices[doc.firebase_uid];
                const chatFee  = prices?.chat_price  ?? 299;
                const videoFee = prices?.video_price ?? 499;
                const isReq    = requesting === doc.firebase_uid;
                const isRej    = rejected  === doc.firebase_uid;

                return (
                  <div key={doc.firebase_uid} className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                    <div className="flex gap-3 mb-3">
                      <div className="relative flex-shrink-0">
                        {doc.selfie_url
                          ? <img src={doc.selfie_url} alt={doc.full_name} className="w-14 h-14 rounded-xl object-cover" />
                          : <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center"><span className="text-xl font-bold text-primary">{doc.full_name?.charAt(0)}</span></div>
                        }
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-background" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-foreground truncate">Dr. {doc.full_name}</p>
                          <ShieldCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        </div>
                        <p className="text-xs text-muted-foreground">{doc.specialization}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Star className="w-3 h-3 fill-orange-400 text-orange-400" />
                          <span className="text-xs font-semibold text-foreground">4.8</span>
                          <span className="text-xs text-muted-foreground">· {doc.experience_years} yrs</span>
                        </div>
                      </div>
                    </div>

                    {isRej ? (
                      <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2">
                        <X className="w-3.5 h-3.5 text-destructive" />
                        <p className="text-xs text-destructive font-medium">Unavailable right now. Try another.</p>
                      </div>
                    ) : isReq ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-3 py-2.5">
                          <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-foreground">Waiting for doctor... {reqCountdown}s</p>
                          </div>
                        </div>
                        <button onClick={handleCancelReq} className="w-full text-xs text-muted-foreground hover:text-destructive py-1">Cancel</button>
                      </div>
                    ) : onSelectDoctor ? (
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handleConsultDoctor(doc, 'chat')}
                          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                            walletBalance >= chatFee
                              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                              : 'border-2 border-dashed border-border text-muted-foreground'
                          }`}>
                          <MessageSquare className="w-3.5 h-3.5" />
                          Chat · ₹{chatFee}
                        </button>
                        <button onClick={() => handleConsultDoctor(doc, 'video')}
                          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                            walletBalance >= videoFee
                              ? 'bg-blue-500 text-white hover:bg-blue-600'
                              : 'border-2 border-dashed border-border text-muted-foreground'
                          }`}>
                          <Video className="w-3.5 h-3.5" />
                          Video · ₹{videoFee}
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showWallet && onRecharge && (
        <WalletRechargeModal currentBalance={walletBalance} onRecharge={onRecharge} onClose={() => setShowWallet(false)} />
      )}
    </div>
  );
}
