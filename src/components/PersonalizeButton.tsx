import React, { useState, useCallback } from 'react';
import { useSession } from '@site/src/lib/auth-client';
import { applyPersonalization, revertPersonalization } from './PersonalizationEngine';

// Cache TTL: 30 days in ms
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000;
const CACHE_KEY = 'ba_profile_cache';

interface CachedProfile {
  data: UserProfile;
  expiresAt: number;
}

interface UserProfile {
  python_experience: string;
  ros_experience: string;
  has_rtx_gpu: boolean;
  gpu_model: string | null;
  has_jetson: boolean;
  jetson_model: string | null;
  robot_type: string | null;
  learning_goals: string[];
}

function getCache(): UserProfile | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedProfile = JSON.parse(raw);
    if (cached.expiresAt < Date.now()) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return cached.data;
  } catch {
    return null;
  }
}

function setCache(profile: UserProfile) {
  try {
    const entry: CachedProfile = { data: profile, expiresAt: Date.now() + CACHE_TTL };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // ignore storage errors
  }
}

async function fetchProfile(): Promise<UserProfile | null> {
  // Check localStorage cache first
  const cached = getCache();
  if (cached) return cached;

  try {
    const res = await fetch('/api/profile', { credentials: 'include' });
    if (res.ok) {
      const profile: UserProfile = await res.json();
      setCache(profile);
      return profile;
    }
  } catch {
    // backend unavailable — fall back to cache or null
  }
  return null;
}

export default function PersonalizeButton(): React.ReactNode {
  const { data: session, isPending } = useSession();
  const [personalized, setPersonalized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePersonalize = useCallback(async () => {
    if (personalized) {
      revertPersonalization();
      setPersonalized(false);
      return;
    }

    setLoading(true);
    setError(null);

    const profile = await fetchProfile();
    if (!profile) {
      setError('Could not load your profile. Complete your profile to personalize.');
      setLoading(false);
      return;
    }

    applyPersonalization(profile);
    setPersonalized(true);
    setLoading(false);
  }, [personalized]);

  // Don't render anything during SSR or while session is loading
  if (isPending) return null;

  // Not logged in — show sign-in prompt
  if (!session?.user) {
    return (
      <div style={styles.container}>
        <button style={styles.buttonOutline} onClick={() => { window.location.href = '/auth/sign-in'; }}>
          Sign in to personalize this chapter
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {error && <p style={styles.error}>{error}</p>}
      <button
        style={personalized ? styles.buttonActive : styles.buttonOutline}
        onClick={handlePersonalize}
        disabled={loading}
      >
        {loading ? 'Personalizing...' : personalized ? 'Revert to Default' : 'Personalize for Me'}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    margin: '1rem 0',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  buttonOutline: {
    padding: '0.5rem 1rem',
    border: '2px solid var(--ifm-color-primary)',
    borderRadius: '6px',
    background: 'transparent',
    color: 'var(--ifm-color-primary)',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  buttonActive: {
    padding: '0.5rem 1rem',
    border: '2px solid var(--ifm-color-primary)',
    borderRadius: '6px',
    background: 'var(--ifm-color-primary)',
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  error: {
    color: 'var(--ifm-color-danger)',
    fontSize: '0.85rem',
    margin: 0,
  },
};
