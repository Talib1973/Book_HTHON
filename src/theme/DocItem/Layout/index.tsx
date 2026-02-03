import React from 'react';
import OriginalDocItemLayout from '@theme-original/DocItem/Layout';
import BrowserOnly from '@docusaurus/BrowserOnly';
import type {Props} from '@theme/DocItem/Layout';

export default function DocItemLayout(props: Props): React.ReactNode {
  return (
    <OriginalDocItemLayout {...props}>
      <BrowserOnly>
        {() => {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const PersonalizeButton = require('@site/src/components/PersonalizeButton').default;
          return <PersonalizeButton />;
        }}
      </BrowserOnly>
      {props.children}
    </OriginalDocItemLayout>
  );
}
