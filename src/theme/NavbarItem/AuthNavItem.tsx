import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

export default function AuthNavItem(): JSX.Element {
  return (
    <BrowserOnly fallback={<a href="/auth/sign-in" style={{ padding: '0.5rem 1rem', fontWeight: 500 }}>Sign In</a>}>
      {() => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const AuthNav = require('@site/src/components/AuthNav').default;
        return <AuthNav />;
      }}
    </BrowserOnly>
  );
}
