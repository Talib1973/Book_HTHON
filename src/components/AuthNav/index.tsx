import React, { useEffect } from 'react';
import { useSession, authClient } from '@site/src/lib/auth-client';
import styles from './styles.module.css';

export default function AuthNav(): JSX.Element {
  const { data: session, isPending } = useSession();

  // Debug logging
  useEffect(() => {
    console.log('AuthNav - Session state:', { session, isPending });
  }, [session, isPending]);

  const handleLogout = async () => {
    await authClient.signOut();
    window.location.href = '/';
  };

  // Show loading state while checking session
  if (isPending) {
    return (
      <div className={styles.authNav}>
        <span className={styles.authLink}>Loading...</span>
      </div>
    );
  }

  if (session?.user) {
    return (
      <div className={styles.authNav}>
        <span className={styles.profileLink}>
          {session.user.email || session.user.name || 'User'}
        </span>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className={styles.authNav}>
      <a href="/auth/sign-in" className={styles.authLink}>
        Sign In
      </a>
      <a href="/auth/sign-up" className={styles.authButton}>
        Sign Up
      </a>
    </div>
  );
}
