import type { ReactNode } from 'react';

export const metadata = {
  title: 'ASE-OS — AI Video Editing MVP',
  description: 'Phase 1 local MVP',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0 }}>{children}</body>
    </html>
  );
}
