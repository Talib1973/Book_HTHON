import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import { useSession } from '@site/src/lib/auth-client';
import { useHistory } from '@docusaurus/router';
import { getBackendUrl } from '@site/src/utils/api';
import styles from './auth.module.css';

interface UserProfile {
  programming_experience: string;
  hardware_access: string[];
  learning_goal: string;
  created_at: string;
  updated_at: string;
}

const HARDWARE_OPTIONS = [
  'Humanoid robot (e.g., Boston Dynamics Atlas)',
  'Quadruped robot (e.g., Spot)',
  'Robotic arm (e.g., UR5, Franka Emika)',
  'Mobile robot (e.g., TurtleBot, differential drive)',
  'Drone/UAV',
  'Custom/research platform',
  'None - learning theory first',
];

export default function ProfilePage(): JSX.Element {
  const history = useHistory();
  const { data: session, isPending } = useSession();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [programmingExperience, setProgrammingExperience] = useState('');
  const [hardwareAccess, setHardwareAccess] = useState<string[]>([]);
  const [learningGoal, setLearningGoal] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Redirect if not authenticated (wait for session check to complete)
  useEffect(() => {
    if (!isPending && !session) {
      history.push('/login');
    }
  }, [session, isPending, history]);

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(
          `${getBackendUrl()}/profile`,
          {
            credentials: 'include',
          }
        );

        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          setProgrammingExperience(data.programming_experience);
          setHardwareAccess(data.hardware_access);
          setLearningGoal(data.learning_goal);
        } else if (response.status === 404) {
          // No profile yet - redirect to setup
          history.push('/profile-setup');
        }
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchProfile();
    }
  }, [session, history]);

  const toggleHardware = (hardware: string) => {
    setHardwareAccess((prev) =>
      prev.includes(hardware)
        ? prev.filter((h) => h !== hardware)
        : [...prev, hardware]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!programmingExperience || !learningGoal) {
      setError('Please complete all required fields');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        `${getBackendUrl()}/profile`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            programming_experience: programmingExperience,
            hardware_access: hardwareAccess,
            learning_goal: learningGoal,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Show loading while checking session
  if (isPending || loading) {
    return (
      <Layout title="Profile">
        <div className={styles.authContainer}>Loading...</div>
      </Layout>
    );
  }

  // If session check complete and no session, redirect will happen via useEffect
  if (!session) {
    return <Layout title="Profile"><div>Redirecting...</div></Layout>;
  }

  return (
    <Layout
      title="Your Profile"
      description="View and update your learning profile"
    >
      <div className={styles.profileSetupContainer}>
        <div className={styles.profileSetupCard}>
          <h1>Your Learning Profile</h1>
          <p className={styles.subtitle}>
            Update your background to get personalized content recommendations
          </p>

          <form onSubmit={handleSubmit}>
            {error && <div className={styles.errorMessage}>{error}</div>}
            {success && <div className={styles.successMessage}>{success}</div>}

            {/* Programming Experience */}
            <div className={styles.formSection}>
              <h3>Programming Experience *</h3>
              <div className={styles.radioGroup}>
                <div className={styles.radioOption}>
                  <input
                    type="radio"
                    id="beginner"
                    name="experience"
                    value="beginner"
                    checked={programmingExperience === 'beginner'}
                    onChange={(e) => setProgrammingExperience(e.target.value)}
                  />
                  <label htmlFor="beginner">
                    <strong>Beginner</strong>
                    <span>New to programming or Python</span>
                  </label>
                </div>

                <div className={styles.radioOption}>
                  <input
                    type="radio"
                    id="intermediate"
                    name="experience"
                    value="intermediate"
                    checked={programmingExperience === 'intermediate'}
                    onChange={(e) => setProgrammingExperience(e.target.value)}
                  />
                  <label htmlFor="intermediate">
                    <strong>Intermediate</strong>
                    <span>Comfortable with Python basics, some ROS experience</span>
                  </label>
                </div>

                <div className={styles.radioOption}>
                  <input
                    type="radio"
                    id="advanced"
                    name="experience"
                    value="advanced"
                    checked={programmingExperience === 'advanced'}
                    onChange={(e) => setProgrammingExperience(e.target.value)}
                  />
                  <label htmlFor="advanced">
                    <strong>Advanced</strong>
                    <span>Experienced with ROS, control systems, or ML</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Hardware Access */}
            <div className={styles.formSection}>
              <h3>Hardware Access (select all that apply)</h3>
              <div className={styles.checkboxGroup}>
                {HARDWARE_OPTIONS.map((hardware) => (
                  <div key={hardware} className={styles.checkboxOption}>
                    <input
                      type="checkbox"
                      id={hardware}
                      checked={hardwareAccess.includes(hardware)}
                      onChange={() => toggleHardware(hardware)}
                    />
                    <label htmlFor={hardware}>{hardware}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Learning Goal */}
            <div className={styles.formSection}>
              <h3>Primary Learning Goal *</h3>
              <div className={styles.radioGroup}>
                <div className={styles.radioOption}>
                  <input
                    type="radio"
                    id="theory"
                    name="goal"
                    value="theory"
                    checked={learningGoal === 'theory'}
                    onChange={(e) => setLearningGoal(e.target.value)}
                  />
                  <label htmlFor="theory">
                    <strong>Theory-focused</strong>
                    <span>Understanding concepts, math, and algorithms</span>
                  </label>
                </div>

                <div className={styles.radioOption}>
                  <input
                    type="radio"
                    id="implementation"
                    name="goal"
                    value="implementation"
                    checked={learningGoal === 'implementation'}
                    onChange={(e) => setLearningGoal(e.target.value)}
                  />
                  <label htmlFor="implementation">
                    <strong>Implementation-focused</strong>
                    <span>Hands-on projects, code examples, and tutorials</span>
                  </label>
                </div>

                <div className={styles.radioOption}>
                  <input
                    type="radio"
                    id="both"
                    name="goal"
                    value="both"
                    checked={learningGoal === 'both'}
                    onChange={(e) => setLearningGoal(e.target.value)}
                  />
                  <label htmlFor="both">
                    <strong>Balanced</strong>
                    <span>Equal mix of theory and practical implementation</span>
                  </label>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Update Profile'}
            </button>
          </form>

          {profile && (
            <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--ifm-color-emphasis-600)' }}>
              Last updated: {new Date(profile.updated_at).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
}
