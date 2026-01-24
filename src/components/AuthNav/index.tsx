import React from 'react';
import { useSession, authClient } from '@site/src/lib/auth-client';
import styles from './styles.module.css';

export default function AuthNav(): JSX.Element {
  const { data: session } = useSession();

  const handleLogout = async () => {
    await authClient.signOut();
    window.location.href = '/';
  };

  if (session) {
    return (
      <div className={styles.authNav}>
        <a href="/profile" className={styles.profileLink}>
          Profile
        </a>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Log Out
        </button>
      </div>
    );
  }

  return (
    <div className={styles.authNav}>
      <a href="/login" className={styles.authLink}>
        Log In
      </a>
      <a href="/signup" className={styles.authButton}>
        Sign Up
      </a>
    </div>
  );
}
