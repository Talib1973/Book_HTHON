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
      <a href="/auth/sign-in" className={styles.authLink}>
        Sign In
      </a>
      <a href="/auth/sign-up" className={styles.authButton}>
        Sign Up
      </a>
    </div>
  );
}
