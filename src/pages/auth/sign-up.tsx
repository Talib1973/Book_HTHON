import React, { useState } from 'react';
import Layout from '@theme/Layout';
import { authClient } from '@site/src/lib/auth-client';
import styles from '../auth.module.css';

interface BackgroundData {
  python_experience: 'beginner' | 'intermediate' | 'advanced';
  ros_experience: 'none' | 'beginner' | 'intermediate' | 'advanced';
  has_rtx_gpu: boolean;
  gpu_model: string;
  has_jetson: boolean;
  jetson_model: string;
  robot_type: string;
  learning_goals: string[];
}

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [background, setBackground] = useState<BackgroundData>({
    python_experience: 'beginner',
    ros_experience: 'none',
    has_rtx_gpu: false,
    gpu_model: '',
    has_jetson: false,
    jetson_model: '',
    robot_type: '',
    learning_goals: [],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setBackground((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setBackground((prev) => ({ ...prev, [name]: value }));
    }
  };

  const toggleLearningGoal = (goal: string) => {
    setBackground((prev) => ({
      ...prev,
      learning_goals: prev.learning_goals.includes(goal)
        ? prev.learning_goals.filter((g) => g !== goal)
        : [...prev.learning_goals, goal],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // 1. Create account via Better Auth
      const response = await authClient.signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.name,
      });

      if (response.error) {
        if (response.error.message?.includes('already exists')) {
          setError('This email is already registered. Try logging in instead.');
        } else {
          setError(response.error.message || 'Failed to create account. Please try again.');
        }
        setLoading(false);
        return;
      }

      // 2. POST background profile to FastAPI backend.
      //    The session cookie was just set by sign-up, so fetch will send it automatically.
      const profilePayload = {
        python_experience: background.python_experience,
        ros_experience: background.ros_experience,
        has_rtx_gpu: background.has_rtx_gpu,
        gpu_model: background.has_rtx_gpu ? background.gpu_model : null,
        has_jetson: background.has_jetson,
        jetson_model: background.has_jetson ? background.jetson_model : null,
        robot_type: background.robot_type || null,
        learning_goals: background.learning_goals,
      };

      // Best-effort: profile save failure should not block sign-up success.
      try {
        await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(profilePayload),
        });
      } catch {
        // silently ignore — user is already created and logged in
      }

      window.location.href = '/';
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const LEARNING_GOALS = [
    { value: 'simulation', label: 'Simulation & Gazebo' },
    { value: 'real-robot', label: 'Real Robot Programming' },
    { value: 'ai-research', label: 'AI & ML Research' },
    { value: 'ros-fundamentals', label: 'ROS 2 Fundamentals' },
    { value: 'computer-vision', label: 'Computer Vision' },
  ];

  return (
    <Layout title="Sign Up" description="Create your account">
      <div className={styles.profileSetupContainer}>
        <div className={styles.profileSetupCard}>
          <h1 style={{ textAlign: 'center' }}>Create Your Account</h1>
          <p className={styles.subtitle} style={{ textAlign: 'center' }}>
            Join us to get personalized robotics learning content
          </p>

          <div className={styles.errorMessage} aria-live="polite" role="alert" style={error ? {} : { display: 'none' }}>
            {error}
          </div>

          <form onSubmit={handleSubmit} className={styles.authForm} aria-label="Sign up form">
            {/* ── Account Info ── */}
            <div className={styles.formSection}>
              <h3>Account Information</h3>

              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.formLabel}>Full Name</label>
                <input type="text" id="name" name="name" value={formData.name}
                  onChange={handleChange} className={styles.formInput} required placeholder="John Doe" />
              </div>

              <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
                <label htmlFor="email" className={styles.formLabel}>Email Address</label>
                <input type="email" id="email" name="email" value={formData.email}
                  onChange={handleChange} className={styles.formInput} required placeholder="you@example.com" />
              </div>

              <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
                <label htmlFor="password" className={styles.formLabel}>Password</label>
                <input type="password" id="password" name="password" value={formData.password}
                  onChange={handleChange} className={styles.formInput} required minLength={8} placeholder="At least 8 characters" />
              </div>

              <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
                <label htmlFor="confirmPassword" className={styles.formLabel}>Confirm Password</label>
                <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword}
                  onChange={handleChange} className={styles.formInput} required minLength={8} placeholder="Confirm your password" />
              </div>
            </div>

            {/* ── Programming Background ── */}
            <div className={styles.formSection}>
              <h3>Your Background</h3>
              <p style={{ color: 'var(--ifm-color-emphasis-600)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Help us personalize your learning experience (all optional).
              </p>

              <div className={styles.formGroup}>
                <label htmlFor="python_experience" className={styles.formLabel}>Python Experience</label>
                <select id="python_experience" name="python_experience" value={background.python_experience}
                  onChange={handleBackgroundChange} className={styles.formInput}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
                <label htmlFor="ros_experience" className={styles.formLabel}>ROS 2 Experience</label>
                <select id="ros_experience" name="ros_experience" value={background.ros_experience}
                  onChange={handleBackgroundChange} className={styles.formInput}>
                  <option value="none">No experience</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            {/* ── Hardware Access ── */}
            <div className={styles.formSection}>
              <h3>Hardware Access</h3>

              <div className={styles.checkboxOption}>
                <input type="checkbox" id="has_rtx_gpu" name="has_rtx_gpu"
                  checked={background.has_rtx_gpu} onChange={handleBackgroundChange} />
                <label htmlFor="has_rtx_gpu">I have an NVIDIA RTX GPU</label>
              </div>
              {background.has_rtx_gpu && (
                <div className={styles.formGroup} style={{ marginTop: '0.75rem', paddingLeft: '2rem' }}>
                  <label htmlFor="gpu_model" className={styles.formLabel}>GPU Model</label>
                  <select id="gpu_model" name="gpu_model" value={background.gpu_model}
                    onChange={handleBackgroundChange} className={styles.formInput}>
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
                  checked={background.has_jetson} onChange={handleBackgroundChange} />
                <label htmlFor="has_jetson">I have an NVIDIA Jetson</label>
              </div>
              {background.has_jetson && (
                <div className={styles.formGroup} style={{ marginTop: '0.75rem', paddingLeft: '2rem' }}>
                  <label htmlFor="jetson_model" className={styles.formLabel}>Jetson Model</label>
                  <select id="jetson_model" name="jetson_model" value={background.jetson_model}
                    onChange={handleBackgroundChange} className={styles.formInput}>
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
                <select id="robot_type" name="robot_type" value={background.robot_type}
                  onChange={handleBackgroundChange} className={styles.formInput}>
                  <option value="">None</option>
                  <option value="Unitree Go1">Unitree Go1</option>
                  <option value="Unitree Go2">Unitree Go2</option>
                  <option value="TurtleBot">TurtleBot</option>
                  <option value="Custom">Custom Robot</option>
                </select>
              </div>
            </div>

            {/* ── Learning Goals ── */}
            <div className={styles.formSection}>
              <h3>Learning Goals</h3>
              <div className={styles.checkboxGroup}>
                {LEARNING_GOALS.map((goal) => (
                  <div key={goal.value} className={styles.checkboxOption}>
                    <input type="checkbox" id={`goal-${goal.value}`}
                      checked={background.learning_goals.includes(goal.value)}
                      onChange={() => toggleLearningGoal(goal.value)} />
                    <label htmlFor={`goal-${goal.value}`}>{goal.label}</label>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <div className={styles.authFooter}>
            Already have an account?{' '}
            <a href="/auth/sign-in" className={styles.authLink}>Sign In</a>
          </div>
        </div>
      </div>
    </Layout>
  );
}
