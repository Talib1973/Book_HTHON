import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    console.log('✅ SignIn component mounted');
    console.log('✅ authClient:', authClient);
    console.log('✅ authClient.signIn:', authClient.signIn);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(''); // Clear error on input change
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('🔵 handleSubmit called - preventing default');
    e.preventDefault();
    e.stopPropagation();

    console.log('🔵 Form data:', formData);
    setError('');
    setLoading(true);

    try {
      console.log('🔵 Calling authClient.signIn.email...');

      // Sign in with Better Auth
      const response = await authClient.signIn.email({
        email: formData.email,
        password: formData.password,
      });

      console.log('🔵 Got response:', response);

      if (response.error) {
        // Handle specific errors
        if (response.error.message?.includes('Invalid')) {
          setError('Invalid email or password. Please try again.');
        } else {
          setError(response.error.message || 'Failed to sign in. Please try again.');
        }
        setLoading(false);
        return;
      }

      // Success! Redirect to home
      console.log('=== Sign In Success ===');
      console.log('Full response:', response);
      console.log('Response data:', response.data);
      console.log('Response error:', response.error);
      console.log('=====================');

      // Wait a bit for the session to be set before redirecting
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } catch (err) {
      console.error('Sign in error:', err);
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

          <form onSubmit={handleSubmit} className={styles.authForm} action="javascript:void(0)">
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
              type="submit"
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
