import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification as firebaseSendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  reload,
  User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export interface DBUserProfile {
  id: string;
  email: string;
  name: string;
  age?: string;
  gender?: string;
  phone?: string;
  location_lat?: number;
  location_lng?: number;
  location_city?: string;
  wallet_balance?: number;
  promo_code?: string;
  created_at?: string;
}

// ── Generate unique referral code ───────────────────────────────
function generateReferralCode(name: string): string {
  const prefix = name.replace(/\s+/g, '').substring(0, 4).toUpperCase();
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${suffix}`;
}

// ── Validate promo code + create referral record ──────────────────
export async function applyPromoCode(
  newUserId: string,
  promoCode: string
): Promise<{ referrerId: string | null; error: string | null }> {
  if (!promoCode) return { referrerId: null, error: null };
  // Find user with this referral code
  const { data: referrer } = await supabase
    .from('users').select('id').eq('referral_code', promoCode.toUpperCase()).maybeSingle();
  if (!referrer) return { referrerId: null, error: 'Invalid promo code.' };
  if (referrer.id === newUserId) return { referrerId: null, error: 'You cannot use your own referral code.' };
  // Create referral record
  await supabase.from('referrals').insert({
    referrer_id: referrer.id,
    referred_id: newUserId,
    referral_code: promoCode.toUpperCase(),
    status: 'pending',
  });
  // Update new user's referred_by
  await supabase.from('users').update({ referred_by: referrer.id }).eq('id', newUserId);
  return { referrerId: referrer.id, error: null };
}

// ── Complete referral — grant bonus minutes to both ────────────────
export async function completeReferral(referredUserId: string): Promise<void> {
  // Find pending referral for this user
  const { data: referral } = await supabase
    .from('referrals')
    .select('*')
    .eq('referred_id', referredUserId)
    .eq('status', 'pending')
    .maybeSingle();
  if (!referral || referral.bonus_granted) return;
  // Grant +2 bonus minutes to both users
  await supabase.rpc('increment_bonus_minutes', { user_id: referral.referrer_id, minutes: 2 });
  await supabase.rpc('increment_bonus_minutes', { user_id: referredUserId, minutes: 2 });
  // Mark referral as completed
  await supabase.from('referrals').update({
    status: 'completed',
    bonus_granted: true,
    completed_at: new Date().toISOString(),
  }).eq('id', referral.id);
}

// ── Get referral stats for a user ──────────────────────────────
export async function getReferralStats(userId: string): Promise<{
  totalReferred: number;
  bonusMinutes: number;
  referralCode: string;
}> {
  const { data: user } = await supabase
    .from('users').select('referral_code, bonus_minutes').eq('id', userId).maybeSingle();
  const { count } = await supabase
    .from('referrals').select('*', { count: 'exact', head: true })
    .eq('referrer_id', userId).eq('status', 'completed');
  return {
    totalReferred: count ?? 0,
    bonusMinutes: user?.bonus_minutes ?? 0,
    referralCode: user?.referral_code ?? '',
  };
}

// ── Check if phone already exists ────────────────────────────────
export async function checkPhoneExists(phone: string): Promise<boolean> {
  const { data } = await supabase.from('users').select('id').eq('phone', phone).maybeSingle();
  return !!data;
}

// ── Step 1: Create Firebase account + send verification email ──────
export async function registerAndSendVerification(
  email: string,
  password: string
): Promise<{ user: User | null; error: string | null }> {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await firebaseSendEmailVerification(credential.user);
    return { user: credential.user, error: null };
  } catch (err: any) {
    console.error('Firebase signUp error:', err.code, err.message);
    return { user: null, error: mapFirebaseError(err.code) };
  }
}

// ── Step 2: Poll Firebase to check if email is verified ───────────
export async function checkEmailVerified(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;
  await reload(user);
  return user.emailVerified;
}

// ── Step 3: Resend verification email ─────────────────────────────
export async function resendVerificationEmail(): Promise<{ error: string | null }> {
  const user = auth.currentUser;
  if (!user) return { error: 'No user session found.' };
  try {
    await firebaseSendEmailVerification(user);
    return { error: null };
  } catch (err: any) {
    return { error: mapFirebaseError(err.code) };
  }
}

// ── Step 4: Save full profile to Supabase (with hashed password) ──
export async function saveProfileToSupabase(
  uid: string,
  email: string,
  name: string,
  age: string,
  gender: string,
  phone?: string,
  promoCode?: string,
  plainPassword?: string
): Promise<{ error: string | null }> {
  let password_hash: string | null = null;
  if (plainPassword) password_hash = await bcrypt.hash(plainPassword, 10);

  const referralCode = generateReferralCode(name);

  const { error } = await supabase.from('users').upsert({
    id: uid, email, name, age, gender,
    phone: phone ?? null,
    promo_code: promoCode ?? null,
    password_hash,
    referral_code: referralCode,
    bonus_minutes: 0,
    wallet_balance: 0,
  });
  if (error) return { error: error.message };

  // Apply promo code if provided
  if (promoCode) {
    await applyPromoCode(uid, promoCode);
  }

  return { error: null };
}

// ── Log login event to customer_login ────────────────────────────
async function logCustomerLogin(userId: string, email: string, status: 'success' | 'failed') {
  try {
    const ua = navigator.userAgent;
    const device = /Mobi|Android/i.test(ua) ? 'mobile' : /Tablet|iPad/i.test(ua) ? 'tablet' : 'desktop';
    const browser = /Chrome/i.test(ua) ? 'Chrome' : /Firefox/i.test(ua) ? 'Firefox' : /Safari/i.test(ua) ? 'Safari' : 'Other';
    const os = /Android/i.test(ua) ? 'Android' : /iPhone|iPad/i.test(ua) ? 'iOS' : /Windows/i.test(ua) ? 'Windows' : /Mac/i.test(ua) ? 'macOS' : 'Other';

    let lat: number | null = null;
    let lng: number | null = null;
    let city: string | null = null;
    let region: string | null = null;
    let country: string | null = null;
    let ip: string | null = null;

    // 1. Try browser GPS first (most accurate)
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
      );
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {}

    // 2. Always get IP + city/region/country from ipapi.co
    // If GPS failed, also use ipapi lat/lng as fallback
    try {
      const geo = await fetch('https://ipapi.co/json/').then(r => r.json());
      ip = geo.ip ?? null;
      city = geo.city ?? null;
      region = geo.region ?? null;
      country = geo.country_name ?? null;
      if (lat === null) lat = geo.latitude ?? null;
      if (lng === null) lng = geo.longitude ?? null;
    } catch {}

    await supabase.from('customer_login').insert({
      user_id: userId,
      email,
      status,
      latitude: lat,
      longitude: lng,
      ip_address: ip,
      location_city: city,
      location_region: region,
      location_country: country,
      device_type: device,
      browser,
      os,
    });
  } catch (e) {
    console.error('logCustomerLogin error:', e);
  }
}

// ── Login ──────────────────────────────────────────────────────────
export async function login(
  email: string,
  password: string
): Promise<{ profile: DBUserProfile | null; error: string | null }> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const user = credential.user;
    if (!user.emailVerified) {
      await signOut(auth);
      await logCustomerLogin(user.uid, email, 'failed');
      return { profile: null, error: 'Please verify your email before logging in. Check your inbox.' };
    }
    const { data, error: dbError } = await supabase
      .from('users').select('*').eq('id', user.uid).single();
    if (dbError) {
      await logCustomerLogin(user.uid, email, 'failed');
      return { profile: null, error: 'Failed to load profile. Please try again.' };
    }
    await logCustomerLogin(user.uid, email, 'success');
    return { profile: data as DBUserProfile, error: null };
  } catch (err: any) {
    await logCustomerLogin('', email, 'failed');
    return { profile: null, error: mapFirebaseError(err.code) };
  }
}

// ── Logout ─────────────────────────────────────────────────────────
export async function logout(): Promise<void> {
  await signOut(auth);
}

// ── Forgot Password ────────────────────────────────────────────────
export async function forgotPassword(email: string): Promise<{ error: string | null }> {
  try {
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (err: any) {
    return { error: mapFirebaseError(err.code) };
  }
}

// ── Sync wallet balance to Supabase ───────────────────────────────
export async function syncWalletBalance(uid: string, balance: number): Promise<void> {
  await supabase.from('users').update({ wallet_balance: balance }).eq('id', uid);
}

// ── Update location in Supabase ────────────────────────────────────
export async function updateUserLocation(
  uid: string, lat: number, lng: number, city?: string
): Promise<void> {
  await supabase.from('users').update({
    location_lat: lat, location_lng: lng, location_city: city ?? null,
  }).eq('id', uid);
}

// ── Update profile fields ──────────────────────────────────────────
export async function updateUserProfile(
  uid: string,
  updates: Partial<Pick<DBUserProfile, 'name' | 'age' | 'gender' | 'phone' | 'wallet_balance'>>
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('users').update(updates).eq('id', uid);
  return { error: error?.message ?? null };
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

function mapFirebaseError(code: string): string {
  const map: Record<string, string> = {
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
  };
  return map[code] ?? 'Something went wrong. Please try again.';
}
