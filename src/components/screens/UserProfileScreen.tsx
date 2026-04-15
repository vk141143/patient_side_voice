import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Phone, Calendar, Edit2, Moon, Sun, Bell, Shield, HelpCircle, LogOut, ChevronRight, Users, X, Check, Copy, Share2, MessageCircle, Mail, ChevronDown, ChevronUp, Star, Plus } from 'lucide-react';
import { UserProfile } from '@/types/app';
import { useTheme } from '@/context/ThemeContext';

interface UserProfileScreenProps {
  user: UserProfile;
  onBack: () => void;
  onEditProfile: () => void;
  onLogout: () => void;
  onDoctorRegister?: () => void;
}

// ── Edit Profile Modal ──────────────────────────────────────────────
function EditProfileModal({ user, onSave, onClose }: { user: UserProfile; onSave: (u: Partial<UserProfile>) => void; onClose: () => void }) {
  const [name, setName] = useState(user.name);
  const [age, setAge] = useState(user.age);
  const [gender, setGender] = useState(user.gender);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-background rounded-t-3xl px-6 pt-4 pb-10">
        <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5" />
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground">Edit Profile</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-border bg-card text-foreground outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Age</label>
            <input type="number" value={age} onChange={e => setAge(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-border bg-card text-foreground outline-none focus:border-primary" min={1} max={120} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Gender</label>
            <div className="flex gap-2">
              {(['male', 'female', 'other'] as const).map(g => (
                <button key={g} onClick={() => setGender(g)}
                  className={`flex-1 h-11 rounded-xl border-2 text-sm font-medium capitalize transition-all ${gender === g ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          <Button variant="hero" size="xl" className="w-full mt-2" onClick={() => { onSave({ name, age, gender }); onClose(); }}>
            <Check className="w-4 h-4" /> Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Notifications Screen ────────────────────────────────────────────
function NotificationsScreen({ onBack }: { onBack: () => void }) {
  const [settings, setSettings] = useState({ appointments: true, offers: false, reminders: true, updates: false });
  const toggle = (key: keyof typeof settings) => setSettings(p => ({ ...p, [key]: !p[key] }));
  const items = [
    { key: 'appointments' as const, label: 'Appointment Reminders', desc: 'Get notified before your appointments' },
    { key: 'offers' as const, label: 'Offers & Promotions', desc: 'Discounts and special offers' },
    { key: 'reminders' as const, label: 'Medication Reminders', desc: 'Reminders to take your medicines' },
    { key: 'updates' as const, label: 'App Updates', desc: 'New features and improvements' },
  ];
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex items-center gap-4 px-4 py-4 border-b border-border">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary"><ArrowLeft className="w-5 h-5 text-foreground" /></button>
        <h1 className="text-lg font-semibold text-foreground">Notifications</h1>
      </div>
      <div className="flex-1 px-5 py-5 space-y-3">
        {items.map(item => (
          <div key={item.key} className="flex items-center justify-between bg-card rounded-xl p-4 border border-border/50">
            <div>
              <p className="font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
            <button onClick={() => toggle(item.key)}
              className={`w-12 h-6 rounded-full p-0.5 transition-colors ${settings[item.key] ? 'bg-primary' : 'bg-muted'}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${settings[item.key] ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Help & Support Screen ───────────────────────────────────────────
function HelpSupportScreen({ onBack }: { onBack: () => void }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [fbTitle, setFbTitle] = useState('');
  const [fbDesc, setFbDesc] = useState('');
  const [fbPhotos, setFbPhotos] = useState<string[]>([]);
  const [fbDocs, setFbDocs] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 4 - fbPhotos.length;
    files.slice(0, remaining).forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => setFbPhotos(p => [...p, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
    e.target.value = '';
  };

  const handleDocAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Document must be less than 2MB'); return; }
    if (fbDocs.length >= 2) return;
    setFbDocs(p => [...p, file.name]);
    e.target.value = '';
  };

  const faqs = [
    { q: 'How do I book an appointment?', a: 'Go to Home → Book a Doctor → Select specialty → Choose clinic → Pick a time slot.' },
    { q: 'How does the wallet work?', a: 'Add money to your wallet and use it to pay for consultations and appointments directly.' },
    { q: 'Can I cancel an appointment?', a: 'Yes, go to Bookings → tap the appointment → Cancel Appointment.' },
    { q: 'How do I consult a doctor instantly?', a: 'Tap "Consult a Doctor Now" on the home screen, select specialty, and start chatting.' },
    { q: 'Is my data private?', a: 'Yes, all your health data is encrypted and never shared without your consent.' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex items-center gap-4 px-4 py-4 border-b border-border flex-shrink-0">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary"><ArrowLeft className="w-5 h-5 text-foreground" /></button>
        <h1 className="text-lg font-semibold text-foreground">Help & Support</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 scrollbar-thin">
        <p className="text-sm font-semibold text-foreground">Frequently Asked Questions</p>
        {faqs.map((faq, i) => (
          <div key={i} className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <button className="w-full flex items-center justify-between px-4 py-3.5 text-left" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
              <span className="text-sm font-medium text-foreground pr-4">{faq.q}</span>
              {openFaq === i ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
            </button>
            {openFaq === i && <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-3">{faq.a}</div>}
          </div>
        ))}

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">Still need help?</p>
          <div className="flex gap-3">
            {/* <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
              <MessageCircle className="w-4 h-4" /> Chat with us
            </button> */}
            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm font-medium">
              <Mail className="w-4 h-4" /> Email us
            </button>
          </div>
          <button
            onClick={() => setShowFeedback(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary/30 bg-primary/5 text-primary text-sm font-medium hover:bg-primary/10 transition-colors">
            <Star className="w-4 h-4" /> Give Feedback / Complaint
          </button>
        </div>
      </div>

      {/* Feedback Popup */}
      {showFeedback && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowFeedback(false)} />
          <div className="relative w-full max-w-md bg-background rounded-t-3xl flex flex-col" style={{ height: '85vh' }}>
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0"><div className="w-10 h-1 rounded-full bg-border" /></div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
              <h3 className="text-base font-bold text-foreground">Feedback / Complaint</h3>
              <button onClick={() => setShowFeedback(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-base font-bold text-foreground">Thank you!</p>
                <p className="text-sm text-muted-foreground">Your feedback has been submitted.</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 space-y-4 scrollbar-thin">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Title</label>
                    <input value={fbTitle} onChange={e => setFbTitle(e.target.value)}
                      placeholder="e.g. App improvement suggestion"
                      className="w-full h-11 px-4 rounded-xl border border-border bg-card text-foreground text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Description</label>
                    <textarea value={fbDesc} onChange={e => setFbDesc(e.target.value)}
                      placeholder="Describe your feedback or complaint in detail..."
                      className="w-full h-28 px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm outline-none focus:border-primary resize-none" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Attachments (optional)</label>
                    <div className="flex gap-2 flex-wrap">
                      {fbPhotos.map((src, i) => (
                        <div key={i} className="relative w-16 h-16">
                          <img src={src} className="w-16 h-16 rounded-xl object-cover border border-border" />
                          <button onClick={() => setFbPhotos(p => p.filter((_, j) => j !== i))}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center">
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      ))}
                      {fbDocs.map((name, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-xl border border-border">
                          <span className="text-xs text-foreground truncate max-w-[80px]">{name}</span>
                          <button onClick={() => setFbDocs(p => p.filter((_, j) => j !== i))}><X className="w-3 h-3 text-muted-foreground" /></button>
                        </div>
                      ))}
                      {(fbPhotos.length < 4 || fbDocs.length < 2) && (
                        <button
                          onClick={() => fbPhotos.length < 4 ? photoRef.current?.click() : docRef.current?.click()}
                          className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center hover:border-primary transition-colors">
                          <Plus className="w-6 h-6 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">Up to 4 photos · Documents max 2MB each</p>
                    <input ref={photoRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoAdd} />
                    <input ref={docRef} type="file" accept="application/pdf,.doc,.docx" className="hidden" onChange={handleDocAdd} />
                  </div>
                </div>
                {/* Submit pinned at bottom */}
                <div className="flex-shrink-0 px-5 pb-8 pt-3 border-t border-border">
                  <Button variant="hero" size="lg" className="w-full"
                    disabled={!fbTitle.trim() || !fbDesc.trim()}
                    onClick={() => setSubmitted(true)}>
                    Submit Feedback
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Privacy Policy Screen ───────────────────────────────────────────
function PrivacyPolicyScreen({ onBack }: { onBack: () => void }) {
  const sections = [
    { title: 'Information We Collect', body: 'We collect information you provide during registration including name, age, gender, phone number, and location. We also collect health-related information you share during consultations.' },
    { title: 'How We Use Your Information', body: 'Your information is used to connect you with doctors, improve our services, send appointment reminders, and provide personalised health recommendations.' },
    { title: 'Data Security', body: 'All data is encrypted using 256-bit SSL encryption. We never sell your personal data to third parties. Your health records are stored securely and accessible only to you and your treating doctors.' },
    { title: 'Location Data', body: 'Location is used to find nearby doctors and clinics. You can revoke location access at any time from your device settings.' },
    { title: 'Your Rights', body: 'You have the right to access, correct, or delete your personal data at any time. Contact our support team to exercise these rights.' },
    { title: 'Contact Us', body: 'For privacy concerns, email us at privacy@medicare.app or call our support line.' },
  ];
  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex items-center gap-4 px-4 py-4 border-b border-border flex-shrink-0">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary"><ArrowLeft className="w-5 h-5 text-foreground" /></button>
        <h1 className="text-lg font-semibold text-foreground">Privacy Policy</h1>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 px-5 py-5 space-y-5 scrollbar-thin">
        <p className="text-xs text-muted-foreground">Last updated: January 2025</p>
        {sections.map((s, i) => (
          <div key={i}>
            <h3 className="text-sm font-bold text-foreground mb-2">{s.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Refer a Friend Screen ───────────────────────────────────────────
function ReferFriendScreen({ onBack }: { onBack: () => void }) {
  const [copied, setCopied] = useState(false);
  const rulesRef = useRef<HTMLDivElement>(null);
  const referralCode = 'MEDI' + Math.random().toString(36).substring(2, 7).toUpperCase();

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = () => {
    const text = `Join MediCare and get ₹100 off your first consultation! Use my referral code: ${referralCode}\nDownload: https://medicare.app`;
    if (navigator.share) {
      navigator.share({ title: 'Join MediCare', text });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const scrollToRules = () => {
    rulesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const rules = [
    'Referral reward is credited only after the referred friend completes their first paid consultation.',
    'Each user can refer a maximum of 50 friends per month.',
    'Referral code cannot be applied to existing accounts.',
    'Rewards are non-transferable and cannot be converted to cash.',
    'MediCare reserves the right to cancel rewards in case of fraudulent activity.',
    'Referral bonus will be credited to the wallet within 24 hours of qualifying consultation.',
    'Self-referrals are not allowed and will result in disqualification.',
    'Offer valid only for new users registering on MediCare for the first time.',
  ];

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex items-center gap-4 px-4 py-4 border-b border-border flex-shrink-0">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary"><ArrowLeft className="w-5 h-5 text-foreground" /></button>
        <h1 className="text-lg font-semibold text-foreground">Refer a Friend</h1>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 px-5 py-6 space-y-6 pb-28">
        {/* Hero */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Invite & Earn</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Invite your friends to MediCare. You earn <span className="text-primary font-semibold">₹100</span> and your friend gets <span className="text-primary font-semibold">₹100 off</span> their first consultation.
          </p>
        </div>

        {/* How it works */}
        <div>
          <p className="text-sm font-semibold text-foreground mb-3">How it works</p>
          <div className="space-y-3">
            {[
              { step: '1', text: 'Share your unique referral code with friends' },
              { step: '2', text: 'Friend signs up using your code' },
              { step: '3', text: 'Friend completes their first consultation' },
              { step: '4', text: 'You both get ₹100 added to your wallets' },
            ].map(item => (
              <div key={item.step} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary-foreground">{item.step}</span>
                </div>
                <p className="text-sm text-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* T&C button */}
        <button
          onClick={scrollToRules}
          className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-bold">T&C</span>
          View Terms & Conditions
        </button>

        {/* Referral Code */}
        <div>
          <p className="text-sm font-semibold text-foreground mb-3">Your Referral Code</p>
          <div className="flex items-center gap-3 bg-card border-2 border-dashed border-primary/40 rounded-xl px-4 py-4">
            <span className="flex-1 text-2xl font-bold text-primary tracking-widest text-center">{referralCode}</span>
            <button onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${
                copied ? 'bg-green-500/10 text-green-600' : 'bg-primary/10 text-primary hover:bg-primary/20'
              }`}>
              {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy</>}
            </button>
          </div>
        </div>

        {/* Share Button */}
        <Button variant="hero" size="xl" className="w-full" onClick={handleShare}>
          <Share2 className="w-5 h-5" /> Share with Friends
        </Button>

        {/* T&C Rules */}
        <div ref={rulesRef} className="bg-card border border-border/50 rounded-2xl p-5">
          <p className="text-sm font-bold text-foreground mb-4">Terms & Conditions</p>
          <ul className="space-y-3">
            {rules.map((rule, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">{rule}</p>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground text-center pb-4">
          Reward credited after friend's first paid consultation.
        </p>
      </div>
    </div>
  );
}

// ── Main UserProfileScreen ──────────────────────────────────────────
export function UserProfileScreen({ user, onBack, onEditProfile, onLogout }: UserProfileScreenProps) {
  const { theme, toggleTheme } = useTheme();
  const [activeSubScreen, setActiveSubScreen] = useState<'notifications' | 'help' | 'privacy' | 'refer' | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [localUser, setLocalUser] = useState(user);

  if (activeSubScreen === 'notifications') return <NotificationsScreen onBack={() => setActiveSubScreen(null)} />;
  if (activeSubScreen === 'help') return <HelpSupportScreen onBack={() => setActiveSubScreen(null)} />;
  if (activeSubScreen === 'privacy') return <PrivacyPolicyScreen onBack={() => setActiveSubScreen(null)} />;
  if (activeSubScreen === 'refer') return <ReferFriendScreen onBack={() => setActiveSubScreen(null)} />;

  const menuItems = [
    { icon: Bell,        label: 'Notifications',   action: () => setActiveSubScreen('notifications') },
    { icon: Shield,      label: 'Privacy Policy',   action: () => setActiveSubScreen('privacy') },
    { icon: HelpCircle,  label: 'Help & Support',   action: () => setActiveSubScreen('help') },
    { icon: Users,       label: 'Refer a Friend',   action: () => setActiveSubScreen('refer') },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-primary px-5 pt-12 pb-8">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-primary-foreground" />
          </button>
          <h1 className="text-xl font-bold text-primary-foreground">My Profile</h1>
        </div>

        {/* Profile Card */}
        <div className="bg-card rounded-2xl p-5 shadow-lg -mb-12">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground">{localUser.name || 'User'}</h2>
              <p className="text-sm text-muted-foreground">{localUser.phone || '+91 98765 43210'}</p>
            </div>
            <button onClick={() => setShowEditModal(true)} className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Edit2 className="w-5 h-5 text-primary" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-border">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Age</p>
                <p className="font-semibold text-foreground">{localUser.age || '--'} years</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Gender</p>
                <p className="font-semibold text-foreground capitalize">{localUser.gender || '--'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-16">
        {/* Theme Toggle */}
        <div className="bg-card rounded-xl p-4 border border-border/50 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
              <div>
                <p className="font-medium text-foreground">Appearance</p>
                <p className="text-sm text-muted-foreground">{theme === 'dark' ? 'Dark' : 'Light'} mode</p>
              </div>
            </div>
            <button onClick={toggleTheme} className={`w-14 h-8 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-muted'}`}>
              <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden mb-4">
          {menuItems.map((item, index) => (
            <button key={item.label} onClick={item.action}
              className={`w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors ${index !== menuItems.length - 1 ? 'border-b border-border/50' : ''}`}>
              <item.icon className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 text-left font-medium text-foreground">{item.label}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <Button variant="outline" size="lg" className="w-full text-destructive border-destructive/20 hover:bg-destructive/10" onClick={onLogout}>
          <LogOut className="w-5 h-5" /> Logout
        </Button>

        <p className="text-xs text-muted-foreground text-center mt-6">App Version 1.0.0</p>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal
          user={localUser}
          onSave={(updates) => setLocalUser(prev => ({ ...prev, ...updates }))}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}
