import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Zap, MessageSquare, Video, Save, CheckCircle, Loader2, IndianRupee } from 'lucide-react';

const PRICE_KEYS = [
  {
    key: 'instant_chat_price',
    label: 'Instant Chat Price',
    description: 'Patient pays this for instant match (5 min chat)',
    icon: Zap,
    color: 'text-amber-500',
    bg: 'bg-amber-50 border-amber-200',
  },
  {
    key: 'available_chat_price',
    label: 'Available Doctors — Chat Price',
    description: 'Patient pays this to chat with a chosen doctor (10 min)',
    icon: MessageSquare,
    color: 'text-primary',
    bg: 'bg-primary/5 border-primary/20',
  },
  {
    key: 'available_video_price',
    label: 'Available Doctors — Video Price',
    description: 'Patient pays this for video call with a chosen doctor (10 min)',
    icon: Video,
    color: 'text-blue-500',
    bg: 'bg-blue-50 border-blue-200',
  },
];

export function PricingPage() {
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('admin_pricing').select('key, value')
      .then(({ data }) => {
        const map: Record<string, string> = {};
        data?.forEach(row => { map[row.key] = String(row.value); });
        // defaults
        if (!map['instant_chat_price']) map['instant_chat_price'] = '99';
        if (!map['available_chat_price']) map['available_chat_price'] = '299';
        if (!map['available_video_price']) map['available_video_price'] = '499';
        setPrices(map);
        setLoading(false);
      });
  }, []);

  const handleSave = async (key: string) => {
    const val = Number(prices[key]);
    if (!val || val < 1) return;
    setSaving(key);
    await supabase.from('admin_pricing').upsert({ key, value: val }, { onConflict: 'key' });
    setSaving(null);
    setSaved(key);
    setTimeout(() => setSaved(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Consultation Pricing</h2>
        <p className="text-gray-400 text-sm mt-1">Set prices shown to patients. Changes take effect immediately.</p>
      </div>

      <div className="space-y-4">
        {PRICE_KEYS.map(({ key, label, description, icon: Icon, color, bg }) => (
          <div key={key} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">{label}</p>
                <p className="text-gray-400 text-xs mt-0.5">{description}</p>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 flex-1">
                    <IndianRupee className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <input
                      type="number"
                      min="1"
                      value={prices[key] ?? ''}
                      onChange={e => setPrices(p => ({ ...p, [key]: e.target.value }))}
                      className="bg-transparent text-white text-sm font-bold w-full outline-none placeholder:text-gray-600"
                      placeholder="0"
                    />
                  </div>
                  <button
                    onClick={() => handleSave(key)}
                    disabled={saving === key}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      saved === key
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-teal-500 hover:bg-teal-400 text-white'
                    } disabled:opacity-60`}
                  >
                    {saving === key ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : saved === key ? (
                      <><CheckCircle className="w-4 h-4" /> Saved</>
                    ) : (
                      <><Save className="w-4 h-4" /> Save</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <p className="text-gray-400 text-xs leading-relaxed">
          <span className="text-teal-400 font-semibold">Note:</span> Prices update in real-time on the patient app and doctor dashboard — no refresh needed.
          Doctors see the chat/video prices set here on their earnings screen.
          Instant chat price applies to the auto-match flow only.
        </p>
      </div>
    </div>
  );
}
