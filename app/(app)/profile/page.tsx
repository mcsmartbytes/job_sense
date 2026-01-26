'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  created_at: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProfile();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status]);

  async function fetchProfile() {
    try {
      const response = await fetch('/api/users/profile');
      const result = await response.json();
      if (result.success && result.user) {
        setProfile(result.user);
        setFullName(result.user.full_name || '');
        setCompanyName(result.user.company_name || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          company_name: companyName,
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      setProfile(result.user);
      setMessage({ type: 'success', text: 'Profile saved successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save profile' });
    } finally {
      setSaving(false);
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[color:var(--accent)] mx-auto mb-4"></div>
          <p className="text-[color:var(--muted)]">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-[color:var(--muted)]">Please sign in to view your profile.</p>
        <Link
          href="/login"
          className="px-4 py-2 bg-[color:var(--accent)] text-white rounded-lg hover:opacity-90 transition"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[color:var(--fg)]">Profile & Settings</h1>
        <Link
          href="/dashboard"
          className="text-sm text-[color:var(--accent)] hover:underline"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Account Information */}
      <div className="bg-[color:var(--glass-bg)] rounded-lg border border-[color:var(--border)] p-6">
        <h2 className="text-lg font-semibold text-[color:var(--fg)] mb-4">Account Information</h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-[color:var(--muted)]">Email</label>
            <p className="text-[color:var(--fg)]">{profile?.email || session?.user?.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-[color:var(--muted)]">Member Since</label>
            <p className="text-[color:var(--fg)]">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSaveProfile} className="bg-[color:var(--glass-bg)] rounded-lg border border-[color:var(--border)] p-6">
        <h2 className="text-lg font-semibold text-[color:var(--fg)] mb-4">Business Profile</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[color:var(--muted)] mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-2 bg-[color:var(--bg)] border border-[color:var(--border)] rounded-lg text-[color:var(--fg)] placeholder:text-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[color:var(--muted)] mb-2">
              Company Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Your business name"
              className="w-full px-4 py-2 bg-[color:var(--bg)] border border-[color:var(--border)] rounded-lg text-[color:var(--fg)] placeholder:text-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-[color:var(--accent)] text-white rounded-lg hover:opacity-90 transition font-semibold disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
