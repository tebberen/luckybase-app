'use client';

import { sdk } from '@farcaster/miniapp-sdk';
import { useEffect } from 'react';

export function FarcasterSDK() {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return null;
}
