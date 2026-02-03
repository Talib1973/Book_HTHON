import React, { useState } from 'react';
import Layout from '@theme/Layout';
import { authClient } from '@site/src/lib/auth-client';
import styles from '../auth.module.css';

export default function SignIn() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await authClient.signIn.email({
        email: formData.email,
        password: formData.password,
      });

      if (response.error) {
        setError(response.error.message || 'Failed to sign in. Please try again.');
        setLoading(false);
        return;
      }

      // Session cookie is set — redirect to home
      window.location.href = '/';
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Layout title="Sign In" description="Sign in to your account">
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <h1 className={styles.authTitle}>Welcome Back</h1>
          <p className={styles.authSubtitle}>
            Sign in to continue your robotics learning journey
          </p>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <form className={styles.authForm} onSubmit={(e) => e.preventDefault()}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.formLabel}>
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={styles.formInput}
                required
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.formLabel}>
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={styles.formInput}
                required
                placeholder="Your password"
                autoComplete="current-password"
              />
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className={styles.authFooter}>
            Don't have an account?{' '}
            <a href="/auth/sign-up" className={styles.authLink}>
              Sign Up
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}
