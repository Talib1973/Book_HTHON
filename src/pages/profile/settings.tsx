import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import BrowserOnly from '@docusaurus/BrowserOnly';
import styles from '../auth.module.css';

interface ProfileData {
  python_experience: 'beginner' | 'intermediate' | 'advanced';
  ros_experience: 'none' | 'beginner' | 'intermediate' | 'advanced';
  has_rtx_gpu: boolean;
  gpu_model: string;
  has_jetson: boolean;
  jetson_model: string;
  robot_type: string;
  learning_goals: string[];
}

const DEFAULTS: ProfileData = {
  python_experience: 'beginner',
  ros_experience: 'none',
  has_rtx_gpu: false,
  gpu_model: '',
  has_jetson: false,
  jetson_model: '',
  robot_type: '',
  learning_goals: [],
};

const LEARNING_GOALS = [
  { value: 'simulation', label: 'Simulation & Gazebo' },
  { value: 'real-robot', label: 'Real Robot Programming' },
  { value: 'ai-research', label: 'AI & ML Research' },
  { value: 'ros-fundamentals', label: 'ROS 2 Fundamentals' },
  { value: 'computer-vision', label: 'Computer Vision' },
];

function ProfileSettingsForm() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useSession } = require('@site/src/lib/auth-client');
  const { data: session, isPending } = useSession();

  const [profile, setProfile] = useState<ProfileData>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isPending || !session?.user) return;

    fetch('/api/profile', { credentials: 'include' })
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data) {
          setProfile({
            python_experience: data.python_experience || 'beginner',
            ros_experience: data.ros_experience || 'none',
            has_rtx_gpu: data.has_rtx_gpu || false,
            gpu_model: data.gpu_model || '',
            has_jetson: data.has_jetson || false,
            jetson_model: data.jetson_model || '',
            robot_type: data.robot_type || '',
            learning_goals: data.learning_goals || [],
          });
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [session, isPending]);

  if (isPending) return <p>Loading...</p>;

  if (!session?.user) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <h1 className={styles.authTitle}>Sign In Required</h1>
          <p className={styles.authSubtitle}>
            Please sign in to access your profile settings.
          </p>
          <a href="/auth/sign-in" className={styles.submitButton} style={{ textAlign: 'center', display: 'block' }}>
            Sign In
          </a>
        </div>
      </div>
    );
  }

  if (loading) return <p>Loading your profile...</p>;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setProfile((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setProfile((prev) => ({ ...prev, [name]: value }));
    }
    setError('');
    setSuccess('');
  };

  const toggleGoal = (goal: string) => {
    setProfile((prev) => ({
      ...prev,
      learning_goals: prev.learning_goals.includes(goal)
        ? prev.learning_goals.filter((g) => g !== goal)
        : [...prev.learning_goals, goal],
    }));
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          python_experience: profile.python_experience,
          ros_experience: profile.ros_experience,
          has_rtx_gpu: profile.has_rtx_gpu,
          gpu_model: profile.has_rtx_gpu ? profile.gpu_model : null,
          has_jetson: profile.has_jetson,
          jetson_model: profile.has_jetson ? profile.jetson_model : null,
          robot_type: profile.robot_type || null,
          learning_goals: profile.learning_goals,
        }),
      });

      if (res.ok) {
        // Clear personalization cache so next "Personalize" uses fresh data
        localStorage.removeItem('ba_profile_cache');
        setSuccess('Profile updated successfully.');
      } else {
        setError('Failed to save profile. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setSaving(false);
  };

  return (
    <div className={styles.profileSetupContainer}>
      <div className={styles.profileSetupCard}>
        <h1 style={{ textAlign: 'center' }}>Profile Settings</h1>
        <p className={styles.subtitle} style={{ textAlign: 'center' }}>
          Update your background to refine personalized content
        </p>

        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}

        {/* Programming Background */}
        <div className={styles.formSection}>
          <h3>Programming Experience</h3>

          <div className={styles.formGroup}>
            <label htmlFor="python_experience" className={styles.formLabel}>Python Experience</label>
            <select id="python_experience" name="python_experience" value={profile.python_experience}
              onChange={handleChange} className={styles.formInput}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
            <label htmlFor="ros_experience" className={styles.formLabel}>ROS 2 Experience</label>
            <select id="ros_experience" name="ros_experience" value={profile.ros_experience}
              onChange={handleChange} className={styles.formInput}>
              <option value="none">No experience</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Hardware Access */}
        <div className={styles.formSection}>
          <h3>Hardware Access</h3>

          <div className={styles.checkboxOption}>
            <input type="checkbox" id="has_rtx_gpu" name="has_rtx_gpu"
              checked={profile.has_rtx_gpu} onChange={handleChange} />
            <label htmlFor="has_rtx_gpu">I have an NVIDIA RTX GPU</label>
          </div>
          {profile.has_rtx_gpu && (
            <div className={styles.formGroup} style={{ marginTop: '0.75rem', paddingLeft: '2rem' }}>
              <label htmlFor="gpu_model" className={styles.formLabel}>GPU Model</label>
              <select id="gpu_model" name="gpu_model" value={profile.gpu_model}
                onChange={handleChange} className={styles.formInput}>
                <option value="">Select GPU...</option>
                <option value="RTX 4090">RTX 4090</option>
                <option value="RTX 4080">RTX 4080</option>
                <option value="RTX 4070">RTX 4070</option>
                <option value="RTX 3090">RTX 3090</option>
                <option value="RTX 3080">RTX 3080</option>
                <option value="RTX 3060 Ti">RTX 3060 Ti</option>
                <option value="RTX 3060">RTX 3060</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}

          <div className={styles.checkboxOption} style={{ marginTop: '0.75rem' }}>
            <input type="checkbox" id="has_jetson" name="has_jetson"
              checked={profile.has_jetson} onChange={handleChange} />
            <label htmlFor="has_jetson">I have an NVIDIA Jetson</label>
          </div>
          {profile.has_jetson && (
            <div className={styles.formGroup} style={{ marginTop: '0.75rem', paddingLeft: '2rem' }}>
              <label htmlFor="jetson_model" className={styles.formLabel}>Jetson Model</label>
              <select id="jetson_model" name="jetson_model" value={profile.jetson_model}
                onChange={handleChange} className={styles.formInput}>
                <option value="">Select Jetson...</option>
                <option value="Orin Nano">Orin Nano</option>
                <option value="Orin NX">Orin NX</option>
                <option value="AGX Orin">AGX Orin</option>
                <option value="Xavier NX">Xavier NX</option>
                <option value="AGX Xavier">AGX Xavier</option>
              </select>
            </div>
          )}

          <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
            <label htmlFor="robot_type" className={styles.formLabel}>Physical Robot</label>
            <select id="robot_type" name="robot_type" value={profile.robot_type}
              onChange={handleChange} className={styles.formInput}>
              <option value="">None</option>
              <option value="Unitree Go1">Unitree Go1</option>
              <option value="Unitree Go2">Unitree Go2</option>
              <option value="TurtleBot">TurtleBot</option>
              <option value="Custom">Custom Robot</option>
            </select>
          </div>
        </div>

        {/* Learning Goals */}
        <div className={styles.formSection}>
          <h3>Learning Goals</h3>
          <div className={styles.checkboxGroup}>
            {LEARNING_GOALS.map((goal) => (
              <div key={goal.value} className={styles.checkboxOption}>
                <input type="checkbox" id={`goal-${goal.value}`}
                  checked={profile.learning_goals.includes(goal.value)}
                  onChange={() => toggleGoal(goal.value)} />
                <label htmlFor={`goal-${goal.value}`}>{goal.label}</label>
              </div>
            ))}
          </div>
        </div>

        <button type="button" className={styles.submitButton} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}

export default function ProfileSettings() {
  return (
    <Layout title="Profile Settings" description="Update your learning profile">
      <BrowserOnly fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
        {() => <ProfileSettingsForm />}
      </BrowserOnly>
    </Layout>
  );
}
