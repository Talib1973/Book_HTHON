import React from 'react';
import { useSession, authClient } from '@site/src/lib/auth-client';
import styles from './styles.module.css';

export default function AuthNav(): JSX.Element {
  const { data: session, isPending } = useSession();

  const handleLogout = async () => {
    await authClient.signOut();
    window.location.href = '/';
  };

  if (isPending) {
    return (
      <div className={styles.authNav}>
        <span className={styles.authLink}>...</span>
      </div>
    );
  }

  if (session?.user) {
    return (
      <div className={styles.authNav}>
        <span className={styles.profileLink}>
          {session.user.name || session.user.email || 'User'}
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
