import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import { useSession } from '@site/src/lib/auth-client';
import { useHistory } from '@docusaurus/router';
import { getBackendUrl } from '@site/src/utils/api';
import styles from './auth.module.css';

const HARDWARE_OPTIONS = [
  'Humanoid robot (e.g., Boston Dynamics Atlas)',
  'Quadruped robot (e.g., Spot)',
  'Robotic arm (e.g., UR5, Franka Emika)',
  'Mobile robot (e.g., TurtleBot, differential drive)',
  'Drone/UAV',
  'Custom/research platform',
  'None - learning theory first',
];

export default function ProfileSetupPage(): JSX.Element {
  const history = useHistory();
  const { data: session } = useSession();

  const [programmingExperience, setProgrammingExperience] = useState('');
  const [hardwareAccess, setHardwareAccess] = useState<string[]>([]);
  const [learningGoal, setLearningGoal] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!session) {
      history.push('/login');
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

    if (!programmingExperience || !learningGoal) {
      setError('Please complete all required fields');
      return;
    }

    setLoading(true);
    try {
      // Call FastAPI backend to save profile
      const response = await fetch(`${getBackendUrl()}/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send session cookie
        body: JSON.stringify({
          programming_experience: programmingExperience,
          hardware_access: hardwareAccess,
          learning_goal: learningGoal,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      // Redirect to home page on success
      history.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return <Layout title="Loading..."><div>Loading...</div></Layout>;
  }

  return (
    <Layout
      title="Complete Your Profile"
      description="Tell us about your background to personalize your learning"
    >
      <div className={styles.profileSetupContainer}>
        <div className={styles.profileSetupCard}>
          <h1>Complete Your Profile</h1>
          <p className={styles.subtitle}>
            Help us personalize your learning experience by sharing your background
          </p>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className={styles.errorMessage}>{error}</div>
            )}

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
              disabled={loading}
            >
              {loading ? 'Saving Profile...' : 'Complete Setup'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
