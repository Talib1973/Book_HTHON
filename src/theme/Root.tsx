import React from 'react';
import ChatWidget from '../components/ChatWidget';

/**
 * Root wrapper component for Docusaurus theme.
 *
 * This component wraps all pages and persists across navigation,
 * making it perfect for global UI elements like the ChatWidget.
 *
 * Better Auth manages authentication state internally using nanostores.
 * The ChatWidget appears as a floating button on all pages and
 * maintains its state during navigation (single-page app behavior).
 */

export default function Root({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <>
      {children}
      <ChatWidget />
    </>
  );
}
