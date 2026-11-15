'use client';

import { useEffect } from 'react';

export default function AdminPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.replace('/index.html');
    }
  }, []);

  return null;
}
